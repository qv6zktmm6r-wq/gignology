import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleApi} from '../server/api.ts';

const origin=process.env.TEST_ORIGIN||'https://gignology.test';
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../drizzle/0000_absent_freak.sql',import.meta.url),'utf8'));
function prepared(sql,values=[]){return {bind(...bound){return prepared(sql,bound);},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {success:true,results:sqlite.prepare(sql).all(...values)};},async run(){return {success:true,meta:sqlite.prepare(sql).run(...values),results:[]};}};}
const database={prepare:prepared,async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.all());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
const ownerHeaders={'oai-authenticated-user-id':'integration-owner','oai-authenticated-user-email':'owner@integration.test'};
async function request(path,{method='GET',data,owner=false,headers={}}={}){
 const init={method,headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...(owner?ownerHeaders:{}),...headers},body:data?JSON.stringify(data):undefined,redirect:'manual'};
 const response=process.env.TEST_ORIGIN?await fetch(origin+path,init):await handleApi(new Request(origin+path,init),{DB:database,OWNER_EMAIL:'owner@integration.test'});
 let body;try{body=await response.json();}catch{body=null;}
 return {status:response.status,body};
}
const inquiry={name:'Integration test',email:'test@example.com',company:'Local verification',interest:'AI governance & strategy',message:'Local integration test. Do not contact.',website:'',requestKey:randomUUID()};
assert.equal((await request('/api/owner/bootstrap')).status,401,'anonymous owner read is denied');
assert.equal((await request('/api/owner/bootstrap',{headers:{'oai-authenticated-user-id':'intruder','oai-authenticated-user-email':'other@example.com'}})).status,403,'unapproved identity cannot claim owner');
const initial=await request('/api/owner/bootstrap',{owner:true});assert.equal(initial.status,200,'verified owner can bootstrap');
assert.equal((await request('/api/owner/bootstrap',{headers:{...ownerHeaders,'oai-authenticated-user-id':'another-id'}})).status,403,'owner remains bound to Site-scoped user ID');
assert.equal((await request('/api/inquiries',{method:'POST',data:inquiry,headers:{Origin:'https://different.example'}})).status,403,'cross-origin writes are denied');
assert.equal((await request('/api/inquiries',{method:'POST',data:{...inquiry,email:'invalid'}})).status,400,'invalid email rejected');
assert.equal((await request('/api/inquiries',{method:'POST',data:{...inquiry,website:'bot'}})).status,400,'honeypot rejected');
assert.equal((await request('/api/inquiries',{method:'POST',data:{...inquiry,message:'x'.repeat(50_000)}})).status,413,'oversized body is bounded even without Content-Length');
const saved=await request('/api/inquiries',{method:'POST',data:inquiry});assert.equal(saved.status,201);assert.ok(saved.body.reference);
const retry=await request('/api/inquiries',{method:'POST',data:inquiry});assert.equal(retry.body.id,saved.body.id,'retry returns same persisted inquiry');
assert.equal((await request(`/api/owner/leads/${saved.body.id}`,{method:'PATCH',data:{status:'qualified',notes:'Verified locally.'}})).status,401,'anonymous update denied');
assert.equal((await request(`/api/owner/leads/${saved.body.id}`,{method:'PATCH',data:{status:'qualified',notes:'Verified locally.'},owner:true})).status,200);
const booking={...inquiry,requestKey:randomUUID(),timezone:'America/Los_Angeles',preferredDate:new Date(Date.now()+7*86400_000).toISOString().slice(0,10),preferredTime:'13:30'};
assert.equal((await request('/api/bookings',{method:'POST',data:{...booking,preferredDate:'2020-01-01'}})).status,400,'past call preference rejected');
assert.equal((await request('/api/bookings',{method:'POST',data:{...booking,timezone:'Invalid/Timezone'}})).status,400,'invalid timezone rejected');
const call=await request('/api/bookings',{method:'POST',data:booking});assert.equal(call.status,201);assert.equal(call.body.status,'new');
assert.equal((await request('/api/bookings',{method:'POST',data:booking})).body.id,call.body.id,'booking retry is idempotent');
assert.equal((await request(`/api/owner/bookings/${call.body.id}`,{method:'PATCH',owner:true,data:{status:'confirmed',confirmedAt:null,meetingUrl:'',notes:''}})).status,400,'confirmation requires a real agreed time');
assert.equal((await request(`/api/owner/bookings/${call.body.id}`,{method:'PATCH',owner:true,data:{status:'confirmed',confirmedAt:new Date(Date.now()+8*86400_000).toISOString(),meetingUrl:'https://example.com/meeting',notes:'Local verification only.'}})).status,200);
const caseKey=randomUUID();const draft={title:'Local verification draft',clientLabel:'',sector:'',challenge:'',approach:'',outcome:'',permissionConfirmed:false,status:'draft'};
assert.equal((await request('/api/owner/case-studies',{method:'POST',owner:true,headers:{'Idempotency-Key':randomUUID()},data:{...draft,status:'published'}})).status,400,'unverified incomplete proof cannot publish');
const caseSaved=await request('/api/owner/case-studies',{method:'POST',owner:true,headers:{'Idempotency-Key':caseKey},data:draft});assert.equal(caseSaved.status,201);const caseId=caseSaved.body.caseStudy.id;
assert.equal((await request('/api/owner/case-studies',{method:'POST',owner:true,headers:{'Idempotency-Key':caseKey},data:draft})).body.caseStudy.id,caseId,'draft creation retries do not duplicate');
assert.ok(!(await request('/api/case-studies')).body.caseStudies.some(c=>c.id===caseId),'draft never reaches public API');
const complete={...draft,clientLabel:'Local test only',sector:'Verification',challenge:'Local sample challenge.',approach:'Local sample approach.',outcome:'Local sample outcome.',permissionConfirmed:true,status:'published'};
assert.equal((await request(`/api/owner/case-studies/${caseId}`,{method:'PATCH',owner:true,data:complete})).status,200);
const publicCase=(await request('/api/case-studies')).body.caseStudies.find(c=>c.id===caseId);assert.ok(publicCase);assert.equal(publicCase.permissionConfirmed,undefined,'private editorial fields excluded');
assert.equal((await request(`/api/owner/case-studies/${caseId}`,{method:'PATCH',owner:true,data:{...complete,status:'archived'}})).status,200);
assert.ok(!(await request('/api/case-studies')).body.caseStudies.some(c=>c.id===caseId),'archived story removed from public API');
assert.equal((await request('/api/owner/settings',{method:'PATCH',owner:true,data:{schedulingTimezone:'America/Los_Angeles',schedulingUrl:'javascript:alert(1)',discoveryIntro:'Test'}})).status,400,'unsafe scheduling link rejected');
const inbox=(await request('/api/owner/bootstrap',{owner:true})).body;assert.equal(inbox.leads.find(l=>l.id===saved.body.id).status,'qualified');assert.equal(inbox.bookings.find(b=>b.id===call.body.id).status,'confirmed');
console.log('Integration passed: owner authorization, identity binding, durable inquiry/booking flows, retries, confirmation, case publishing boundaries, and URL validation.');
sqlite.close();
