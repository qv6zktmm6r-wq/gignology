(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const state = {loaded:false,section:'inbox',leads:[],bookings:[],caseStudies:[],settings:{},selected:{lead:null,booking:null,case:null},caseKey:null};
  const leadStatuses = ['new','contacted','qualified','closed'];
  const bookingStatuses = ['new','contacted','confirmed','declined'];
  const caseStatuses = ['draft','published','archived'];
  const statusClasses = new Set([...leadStatuses,...bookingStatuses,...caseStatuses]);
  const make = (tag,className,text) => {const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=String(text);return e;};
  const text = value => value == null ? '' : String(value);
  const display = (value,fallback='Not provided') => text(value).trim() || fallback;
  const key = () => window.crypto?.randomUUID?.() || `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function date(value,timezone) {if(!value)return 'Not recorded';const d=new Date(value);if(Number.isNaN(d.getTime()))return 'Date unavailable';try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short',...(timezone?{timeZone:timezone}:{})}).format(d);}catch{return d.toISOString();}}
  function pill(status) {const e=make('span','status-pill',display(status,'new'));if(statusClasses.has(status))e.classList.add(status);return e;}
  function globalMessage(message,isError=false) {const box=byId('global-message');box.hidden=!message;box.textContent=message;box.classList.toggle('error',isError);}
  function formMessage(id,message,isError=false) {const box=byId(id);if(box){box.textContent=message;box.classList.toggle('error',isError);}}
  function setBusy(form,busy) {form.setAttribute('aria-busy',String(busy));form.querySelectorAll('button').forEach(button=>{button.disabled=busy;});}
  async function api(path,method='GET',body,requestKey) {
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
    try {
      const headers={'Accept':'application/json','X-Requested-With':'GignologyOwner'};
      if(body!==undefined)headers['Content-Type']='application/json';
      if(requestKey)headers['Idempotency-Key']=requestKey;
      const response=await fetch(path,{method,credentials:'same-origin',headers,signal:controller.signal,...(body!==undefined?{body:JSON.stringify(body)}:{})});
      let payload={};try{payload=await response.json();}catch{}
      if(!response.ok){const error=new Error(payload.error?.message || payload.error || payload.message || (response.status===403?'This account does not have owner access.':response.status===401?'Sign in to your owner account to continue.':'We couldn’t save that change. Please try again.'));error.status=response.status;throw error;}
      return payload;
    } catch(error) {if(error.name==='AbortError')throw new Error('The request timed out. Your change may have been saved; refresh before trying again.');throw error;}
    finally{clearTimeout(timeout);}
  }
  function section(name,focus=false) {
    if(!['inbox','bookings','cases','settings'].includes(name))return;
    state.section=name;
    document.querySelectorAll('[data-section]').forEach(button=>{if(button.dataset.section===name)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    document.querySelectorAll('.workspace-panel').forEach(panel=>panel.hidden=panel.id!==`panel-${name}`);
    if(focus){const heading=byId(`panel-${name}`).querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  function normalizeSelected() {
    for(const [type,collection] of [['lead',state.leads],['booking',state.bookings],['case',state.caseStudies]]) {
      if(state.selected[type] && collection.some(item=>text(item.id)===text(state.selected[type])))continue;
      state.selected[type]=collection[0]?.id || null;
    }
  }
  async function loadData(quiet=false) {
    if(!quiet){byId('workspace-content').setAttribute('aria-busy','true');globalMessage('');}
    try {
      const data=await api('/api/owner/bootstrap');
      state.leads=Array.isArray(data.leads)?data.leads:[];state.bookings=Array.isArray(data.bookings)?data.bookings:[];state.caseStudies=Array.isArray(data.caseStudies)?data.caseStudies:[];state.settings=data.settings||{};state.loaded=true;
      byId('owner-name').textContent=display(data.user?.name,'Owner');byId('owner-email').textContent=display(data.user?.email,'');
      normalizeSelected();renderSummary();renderLeadList();renderLeadDetail();renderBookingList();renderBookingDetail();renderCaseList();renderCaseDetail();renderSettings();
      byId('load-error').hidden=true;byId('workspace-content').hidden=false;byId('workspace-content').setAttribute('aria-busy','false');return data;
    } catch(error) {
      byId('workspace-content').setAttribute('aria-busy','false');
      if(!state.loaded || error.status===401 || error.status===403){byId('load-error').hidden=false;byId('load-error-text').textContent=error.message;byId('workspace-content').hidden=true;}
      else globalMessage(error.message,true);
      throw error;
    }
  }
  function renderSummary() {
    const newLeads=state.leads.filter(item=>item.status==='new').length;
    const openBookings=state.bookings.filter(item=>!['confirmed','declined'].includes(item.status)).length;
    byId('stat-leads').textContent=state.leads.length;byId('stat-lead-detail').textContent=`${newLeads} new ${newLeads===1?'inquiry':'inquiries'}`;
    byId('stat-bookings').textContent=state.bookings.length;byId('stat-booking-detail').textContent=`${openBookings} awaiting follow-up`;
    byId('stat-cases').textContent=state.caseStudies.filter(item=>item.status==='published').length;
    byId('nav-lead-count').textContent=newLeads;byId('nav-booking-count').textContent=openBookings;
  }
  function filtered(collection,searchId,filterId,fields) {const q=byId(searchId).value.trim().toLowerCase();const status=byId(filterId).value;return collection.filter(item=>(!status||item.status===status)&&(!q||fields.some(field=>text(item[field]).toLowerCase().includes(q))));}
  function emptyList(container,title,message) {const box=make('div','list-empty');box.append(make('strong','',title),make('p','',message));container.replaceChildren(box);}
  function recordButton(item,type,heading,subtitle,preview) {
    const button=make('button','record-button');button.type='button';button.classList.toggle('active',text(state.selected[type])===text(item.id));button.setAttribute('aria-pressed',String(text(state.selected[type])===text(item.id)));
    const head=make('span','record-button-head');head.append(make('strong','',display(heading,'Untitled')),pill(item.status));
    button.append(head,make('span','record-company',display(subtitle,'')),make('span','record-preview',display(preview,'')),make('span','record-date',date(item.createdAt)));
    button.addEventListener('click',()=>{state.selected[type]=item.id;if(type==='lead'){renderLeadList();renderLeadDetail(true);}else if(type==='booking'){renderBookingList();renderBookingDetail(true);}else{renderCaseList();renderCaseDetail(true);}});return button;
  }
  function renderLeadList() {const box=byId('lead-list');const rows=filtered(state.leads,'lead-search','lead-filter',['name','email','company','interest','message']);if(!rows.length){emptyList(box,state.leads.length?'No matching inquiries':'No inquiries yet',state.leads.length?'Try a different search or status.':'New website inquiries will appear here.');return;}box.replaceChildren(...rows.map(item=>recordButton(item,'lead',item.name,item.company||item.email,item.interest||item.message)));}
  function renderBookingList() {const box=byId('booking-list');const rows=filtered(state.bookings,'booking-search','booking-filter',['name','email','company','interest','message']);if(!rows.length){emptyList(box,state.bookings.length?'No matching requests':'No discovery requests yet',state.bookings.length?'Try a different search or status.':'Visitor time preferences will appear here.');return;}box.replaceChildren(...rows.map(item=>recordButton(item,'booking',item.name,item.company||item.email,[item.preferredDate,item.preferredTime,item.timezone].filter(Boolean).join(' · '))));}
  function renderCaseList() {const box=byId('case-list');const rows=filtered(state.caseStudies,'case-search','case-filter',['title','clientLabel','sector']);if(!rows.length){emptyList(box,state.caseStudies.length?'No matching case studies':'No case studies yet',state.caseStudies.length?'Try a different search or status.':'Create a private draft when you have a real project to share.');return;}box.replaceChildren(...rows.map(item=>recordButton(item,'case',item.title,item.clientLabel,item.sector)));}
  function placeholder(container,title,message,eyebrow) {const box=make('div','detail-placeholder');box.append(make('span','',eyebrow),make('h3','',title),make('p','',message));container.replaceChildren(box);}
  function detailHeader(container,title,subtitle,status) {const header=make('div','detail-heading');const left=make('div');const h=make('h3','',title);h.tabIndex=-1;left.append(h,make('p','',subtitle));header.append(left,pill(status));container.append(header);return h;}
  function focusDetail(container,heading) {heading.focus({preventScroll:true});if(matchMedia('(max-width:700px)').matches)container.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}
  function contactLink(email) {const anchor=make('a','contact-link',display(email,'Email not provided'));if(email)anchor.href=`mailto:${encodeURIComponent(text(email)).replace(/%40/gi,'@')}`;return anchor;}
  function meta(entries) {const dl=make('dl','detail-meta');entries.forEach(([label,value])=>{const row=make('div');row.append(make('dt','',label),make('dd','',display(value)));dl.append(row);});return dl;}
  function originalMessage(container,message) {container.append(make('div','message-label','Original message'),make('div','original-message',display(message,'No additional message provided.')));}
  function field(labelText,name,type,value,options={}) {
    const label=make('label','',labelText);let control;
    if(type==='textarea'){control=document.createElement('textarea');control.rows=options.rows||4;}
    else if(type==='select'){control=document.createElement('select');options.values.forEach(value=>{const option=make('option','',value.charAt(0).toUpperCase()+value.slice(1));option.value=value;control.append(option);});}
    else{control=document.createElement('input');control.type=type;}
    control.name=name;control.value=text(value);if(options.maxLength)control.maxLength=options.maxLength;if(options.required)control.required=true;if(options.placeholder)control.placeholder=options.placeholder;label.append(control);if(options.help)label.append(make('small','',options.help));return label;
  }
  function actionStatus(id) {const box=make('span','form-status');box.id=id;box.setAttribute('role','status');return box;}
  function renderLeadDetail(focus=false) {
    const container=byId('lead-detail');const item=state.leads.find(row=>text(row.id)===text(state.selected.lead));
    if(!item){placeholder(container,'Select an inquiry','Contact details, the original message, and follow-up notes will appear here.','CONVERSATIONS START HERE');return;}
    container.replaceChildren();const heading=detailHeader(container,display(item.name,'Website visitor'),display(item.company,''),item.status);container.append(contactLink(item.email),meta([['Area of interest',item.interest],['Received',date(item.createdAt)]]));originalMessage(container,item.message);
    const form=make('form','editor-form');form.append(field('Follow-up status','status','select',item.status,{values:leadStatuses}),field('Private follow-up notes','notes','textarea',item.notes,{maxLength:10000,help:'Only the owner workspace displays these notes.'}));
    const actions=make('div','editor-actions');const save=make('button','button button-primary','Save inquiry');save.type='submit';actions.append(save,actionStatus('lead-form-status'));form.append(actions);container.append(form);
    form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;setBusy(form,true);formMessage('lead-form-status','Saving…');const values=new FormData(form);try{await api(`/api/owner/leads/${encodeURIComponent(item.id)}`,'PATCH',{status:values.get('status'),notes:values.get('notes')});await loadData(true);formMessage('lead-form-status','Inquiry updated.');}catch(error){formMessage('lead-form-status',error.message,true);}finally{setBusy(form,false);}});
    if(focus)focusDetail(container,heading);
  }
  function renderBookingDetail(focus=false) {
    const container=byId('booking-detail');const item=state.bookings.find(row=>text(row.id)===text(state.selected.booking));
    if(!item){placeholder(container,'Select a request','Review the visitor’s preferences before contacting them to agree on a time.','A CONVERSATION WITH DIRECTION');return;}
    container.replaceChildren();const heading=detailHeader(container,display(item.name,'Website visitor'),display(item.company,''),item.status);container.append(contactLink(item.email),meta([['Preferred date',item.preferredDate],['Preferred time',item.preferredTime],['Visitor time zone',item.timezone],['Area of interest',item.interest],['Requested',date(item.createdAt)]]));originalMessage(container,item.message);
    const form=make('form','editor-form');form.append(make('p','detail-note','Confirm the agreed time and meeting details with the visitor directly. Saving this record does not send a message or create a calendar invitation.'));
    const grid=make('div','field-grid');grid.append(field('Request status','status','select',item.status,{values:bookingStatuses}),field('Confirmed time (UTC)','confirmedAt','datetime-local',item.confirmedAt?text(item.confirmedAt).slice(0,16):'',{help:'Enter the agreed time in UTC; leave blank until it is known.'}));form.append(grid,field('Meeting link','meetingUrl','url',item.meetingUrl,{maxLength:2000,placeholder:'https://…',help:'Optional HTTPS link for the agreed meeting.'}),field('Private follow-up notes','notes','textarea',item.notes,{maxLength:10000}));
    const actions=make('div','editor-actions');const save=make('button','button button-primary','Save request');save.type='submit';actions.append(save,actionStatus('booking-form-status'));form.append(actions);container.append(form);
    form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const values=new FormData(form);const meetingUrl=text(values.get('meetingUrl')).trim();if(meetingUrl&&!isHttps(meetingUrl)){formMessage('booking-form-status','Use a complete HTTPS meeting link.',true);return;}const rawTime=text(values.get('confirmedAt'));const confirmedAt=rawTime?`${rawTime}:00.000Z`:null;if(confirmedAt&&Number.isNaN(new Date(confirmedAt).getTime())){formMessage('booking-form-status','Enter a valid confirmed time in UTC.',true);return;}setBusy(form,true);formMessage('booking-form-status','Saving…');try{await api(`/api/owner/bookings/${encodeURIComponent(item.id)}`,'PATCH',{status:values.get('status'),confirmedAt,meetingUrl,notes:values.get('notes')});await loadData(true);formMessage('booking-form-status','Request updated. Contact the visitor directly to share any arrangements.');}catch(error){formMessage('booking-form-status',error.message,true);}finally{setBusy(form,false);}});
    if(focus)focusDetail(container,heading);
  }
  function newCase() {if(!state.loaded){globalMessage('Wait for the workspace to finish loading.');return;}section('cases');state.selected.case=null;state.caseKey=key();renderCaseList();renderCaseDetail(true,true);}
  function renderCaseDetail(focus=false,create=false) {
    const container=byId('case-detail');let item=state.caseStudies.find(row=>text(row.id)===text(state.selected.case));
    if(!item&&!create){placeholder(container,'Your first case study','Create a draft when you have a real project to share. Nothing is prefilled or published automatically.','REAL WORK. A CLEAR STORY.');const button=make('button','button button-secondary','Create a draft');button.type='button';button.addEventListener('click',newCase);container.firstChild.append(button);return;}
    const isNew=!item;let persistedId=isNew?null:text(item.id);item=item||{title:'',clientLabel:'',sector:'',challenge:'',approach:'',outcome:'',permissionConfirmed:false,status:'draft'};if(isNew&&!state.caseKey)state.caseKey=key();
    container.replaceChildren();const heading=detailHeader(container,isNew?'New case study':display(item.title,'Untitled case study'),isNew?'Private until you publish':'Edit the story and its publication status',item.status);container.append(make('p','case-explanation','Use a client description you have permission to share. An anonymous label is fine when it accurately represents the project. Keep outcomes factual and avoid unsupported performance claims.'));
    const form=make('form','editor-form');form.append(field('Case-study title','title','text',item.title,{required:true,maxLength:180,placeholder:'A clear description of the project'}));const grid=make('div','field-grid');grid.append(field('Client or approved description','clientLabel','text',item.clientLabel,{maxLength:180,placeholder:'Approved name or anonymous description'}),field('Sector','sector','text',item.sector,{maxLength:120,placeholder:'Project sector'}));form.append(grid,field('The challenge','challenge','textarea',item.challenge,{maxLength:5000,placeholder:'What real problem needed attention?'}),field('The approach','approach','textarea',item.approach,{maxLength:5000,placeholder:'What work was actually performed?'}),field('The outcome','outcome','textarea',item.outcome,{maxLength:5000,placeholder:'What changed, and what evidence supports it?'}));
    const permission=make('label','case-permission');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.name='permissionConfirmed';checkbox.checked=Boolean(item.permissionConfirmed);permission.append(checkbox,make('span','','I have verified these project details and have permission to publish this client description and outcome.'));form.append(permission);
    const actions=make('div','editor-actions');const draft=make('button','button button-secondary','Save draft');draft.type='submit';draft.name='action';draft.value='draft';const publish=make('button','button button-primary',item.status==='published'?'Update published story':'Publish story');publish.type='submit';publish.name='action';publish.value='published';actions.append(draft,publish);if(!isNew){const archive=make('button','button button-muted','Archive');archive.type='submit';archive.name='action';archive.value='archived';actions.append(archive);}actions.append(actionStatus('case-form-status'));form.append(actions);container.append(form);
    form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const values=new FormData(form);const status=event.submitter?.value||'draft';const payload={title:text(values.get('title')).trim(),clientLabel:text(values.get('clientLabel')).trim(),sector:text(values.get('sector')).trim(),challenge:text(values.get('challenge')).trim(),approach:text(values.get('approach')).trim(),outcome:text(values.get('outcome')).trim(),permissionConfirmed:values.get('permissionConfirmed')==='on',status};
      if(status==='published'&&(!payload.permissionConfirmed||['title','clientLabel','sector','challenge','approach','outcome'].some(name=>!payload[name]))){formMessage('case-form-status','Complete every story field and confirm accuracy and permission before publishing.',true);return;}
      setBusy(form,true);formMessage('case-form-status','Saving…');try{
        if(!persistedId){
          const created=await api('/api/owner/case-studies','POST',payload,state.caseKey);
          const returnedId=created.caseStudy?.id||created.id;
          if(typeof returnedId!=='string'||!returnedId)throw new Error('The case-study record could not be confirmed. Refresh before trying again.');
          persistedId=returnedId;state.selected.case=persistedId;state.caseKey=null;
          if(created.caseStudy?.id){state.caseStudies=[created.caseStudy,...state.caseStudies.filter(record=>text(record.id)!==persistedId)];renderCaseList();renderSummary();}
        }
        // A replayed create may contain an earlier draft. Apply the latest intent
        // to its confirmed ID before reporting any publication outcome.
        const saved=await api(`/api/owner/case-studies/${encodeURIComponent(persistedId)}`,'PATCH',payload);
        const savedStatus=saved.caseStudy?.status;
        if(!caseStatuses.includes(savedStatus))throw new Error('The saved publication status could not be confirmed. Refresh before trying again.');
        state.selected.case=persistedId;await loadData(true);
        formMessage('case-form-status',savedStatus==='published'?'Story published on the website.':savedStatus==='archived'?'Story archived. It is not displayed on the website.':'Draft saved privately.');
      }catch(error){formMessage('case-form-status',error.message,true);}finally{setBusy(form,false);}});
    if(focus)focusDetail(container,heading);
  }
  function isHttps(value) {try{const parsed=new URL(value);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password;}catch{return false;}}
  function renderSettings() {byId('settings-timezone').value=state.settings.schedulingTimezone||'America/Los_Angeles';byId('settings-url').value=state.settings.schedulingUrl||'';byId('settings-intro').value=state.settings.discoveryIntro||'';}
  byId('settings-form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const schedulingTimezone=byId('settings-timezone').value.trim();const schedulingUrl=byId('settings-url').value.trim();try{new Intl.DateTimeFormat('en-US',{timeZone:schedulingTimezone});}catch{formMessage('settings-status','Enter a valid IANA time zone, such as America/Los_Angeles.',true);return;}if(schedulingUrl&&!isHttps(schedulingUrl)){formMessage('settings-status','Use a complete HTTPS booking-page URL.',true);return;}setBusy(form,true);formMessage('settings-status','Saving…');try{await api('/api/owner/settings','PATCH',{schedulingTimezone,schedulingUrl,discoveryIntro:byId('settings-intro').value.trim()});await loadData(true);formMessage('settings-status','Discovery settings saved.');}catch(error){formMessage('settings-status',error.message,true);}finally{setBusy(form,false);}});
  document.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',()=>section(button.dataset.section,true)));
  document.querySelectorAll('.refresh-workspace').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{await loadData();globalMessage('Workspace refreshed.');}catch{}finally{button.disabled=false;}}));
  byId('retry-load').addEventListener('click',()=>loadData().catch(()=>{}));byId('new-case').addEventListener('click',newCase);document.querySelectorAll('.new-case-trigger').forEach(button=>button.addEventListener('click',newCase));
  [['lead-search','input',renderLeadList],['lead-filter','change',renderLeadList],['booking-search','input',renderBookingList],['booking-filter','change',renderBookingList],['case-search','input',renderCaseList],['case-filter','change',renderCaseList]].forEach(([id,event,handler])=>byId(id).addEventListener(event,handler));
  loadData().catch(()=>{});
})();
