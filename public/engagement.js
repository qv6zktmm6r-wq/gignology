(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const form=byId('contact-form');
  const callOption=byId('request-call');
  const callFields=byId('contact-call-fields');
  const timezoneSelect=byId('discovery-timezone');
  const dateInput=byId('discovery-date');
  const timeInput=byId('discovery-time');
  const defaultTimezone='America/Los_Angeles';
  let busy=false,requestKey='',fingerprint='';
  function uuid(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
  function zoneParts(zone){const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const get=type=>parts.find(p=>p.type===type)?.value||'';return {date:`${get('year')}-${get('month')}-${get('day')}`,time:`${get('hour')}:${get('minute')}`};}
  function addTimezone(zone){try{new Intl.DateTimeFormat('en-US',{timeZone:zone});if(![...timezoneSelect.options].some(o=>o.value===zone)){const option=document.createElement('option');option.value=zone;option.textContent=zone.replaceAll('_',' ');timezoneSelect.append(option);}}catch{}}
  function updateMinimum(){try{dateInput.min=zoneParts(timezoneSelect.value).date;}catch{dateInput.min=new Date().toISOString().slice(0,10);}dateInput.setCustomValidity('');timeInput.setCustomValidity('');}
  function setCallMode(enabled){if(!callOption||!callFields)return;callOption.checked=enabled;callOption.setAttribute('aria-expanded',String(enabled));callFields.hidden=!enabled;callFields.disabled=!enabled;dateInput.setCustomValidity('');timeInput.setCustomValidity('');if(enabled)updateMinimum();}
  function showStatus(message,error=false){const status=form.querySelector('.form-status');status.hidden=false;status.textContent=message;status.classList.toggle('engagement-status-error',error);status.classList.toggle('engagement-status-success',!error);status.setAttribute('role',error?'alert':'status');status.tabIndex=-1;return status;}
  function submitting(value){busy=value;if(value)form.setAttribute('aria-busy','true');else form.removeAttribute('aria-busy');form.querySelectorAll('input,select,textarea,button').forEach(control=>control.disabled=value);if(!value)callFields.disabled=!callOption.checked;form.querySelector('button[type="submit"]').textContent=value?'Sending…':'Send request';}
  let visitorZone=defaultTimezone;
  try{visitorZone=Intl.DateTimeFormat().resolvedOptions().timeZone||defaultTimezone;}catch{}
  if(form&&callOption){
    addTimezone(visitorZone);timezoneSelect.value=visitorZone;updateMinimum();setCallMode(location.hash==='#discovery');
    callOption.addEventListener('change',()=>setCallMode(callOption.checked));
    timezoneSelect.addEventListener('change',updateMinimum);
    dateInput.addEventListener('input',()=>{dateInput.setCustomValidity('');timeInput.setCustomValidity('');});
    timeInput.addEventListener('input',()=>timeInput.setCustomValidity(''));
    window.addEventListener('hashchange',()=>{if(location.hash==='#discovery'&&!busy)setCallMode(true);});
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;
      const wantsCall=callOption.checked;
      if(wantsCall){updateMinimum();const now=zoneParts(timezoneSelect.value);if(dateInput.value&&dateInput.value<now.date)dateInput.setCustomValidity('Choose a future date.');else if(dateInput.value===now.date&&timeInput.value&&timeInput.value<=now.time)timeInput.setCustomValidity('Choose a future time in the selected timezone.');}
      if(!form.reportValidity())return;
      const fields=new FormData(form);const keys=['name','email','company','interest','message','website',...(wantsCall?['timezone','preferredDate','preferredTime']:[])];
      const payload=Object.fromEntries(keys.map(key=>[key,String(fields.get(key)||'').trim()]));const endpoint=wantsCall?'/api/bookings':'/api/inquiries';const nextFingerprint=JSON.stringify({endpoint,payload});
      if(nextFingerprint!==fingerprint||!requestKey){requestKey=uuid();fingerprint=nextFingerprint;}payload.requestKey=requestKey;
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
      submitting(true);const pending=showStatus('Saving your request…');pending.classList.remove('engagement-status-success');
      try{
        const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        let data=null;try{data=await response.json();}catch{}
        if(!response.ok||data?.ok!==true)throw new Error(typeof data?.error==='string'?data.error:'We couldn’t save this request. Please try again or email contact@gignologysolutions.com.');
        const reference=typeof data.reference==='string'?` Your reference: ${data.reference}.`:'';
        const message=wantsCall?'Your call request is saved. Gignology will follow up to confirm a time.':'Your message is saved. Gignology can follow up at the email you provided.';
        form.reset();timezoneSelect.value=visitorZone;setCallMode(false);requestKey='';fingerprint='';showStatus(message+reference).focus({preventScroll:true});
      }catch(error){showStatus(error?.name==='AbortError'?'This is taking longer than expected. Try again; your details are still here.':error?.message||'We couldn’t connect. Your details are still here. Please try again.',true).focus({preventScroll:true});}
      finally{clearTimeout(timeout);submitting(false);}
    });
  }
  document.querySelectorAll('[data-contact-interest]').forEach(link=>link.addEventListener('click',()=>{const select=byId('interest');if(select)select.value=link.dataset.contactInterest;}));
  async function loadPublicConfig(){try{const response=await fetch('/api/public/config',{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)return;const config=await response.json();if(typeof config.discoveryIntro==='string'&&config.discoveryIntro.trim())byId('discovery-intro').textContent=config.discoveryIntro;const zone=typeof config.schedulingTimezone==='string'?config.schedulingTimezone:defaultTimezone;const labels={'America/Los_Angeles':'Pacific time','America/Denver':'Mountain time','America/Chicago':'Central time','America/New_York':'Eastern time','Etc/UTC':'UTC','UTC':'UTC'};byId('discovery-home-timezone').textContent=labels[zone]||zone.replaceAll('_',' ');addTimezone(zone);if(typeof config.schedulingUrl==='string'&&config.schedulingUrl){const url=new URL(config.schedulingUrl);if(url.protocol==='https:'&&!url.username&&!url.password){const link=byId('discovery-external');link.href=url.href;link.hidden=false;}}}catch{}}
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function loadCaseStudies() {
    const section = byId('case-studies');
    const list = byId('case-studies-list');
    if (!section || !list) return;
    section.hidden = true;
    try {
      const response = await fetch('/api/case-studies', {credentials: 'same-origin', headers: {Accept: 'application/json'}});
      if (!response.ok) return;
      const data = await response.json();
      const records = Array.isArray(data.caseStudies) ? data.caseStudies.filter(record => record && ['title', 'clientLabel', 'challenge', 'approach', 'outcome'].every(key => typeof record[key] === 'string' && record[key].trim())) : [];
      if (!records.length) return;
      list.replaceChildren(...records.map((record, index) => {
        const card = element('article', 'case-study-card');
        const head = element('div', 'case-study-heading');
        const meta = element('div', 'case-study-meta');
        meta.append(element('span', 'case-study-number', String(index + 1).padStart(2, '0')), element('span', 'case-study-sector', typeof record.sector === 'string' ? record.sector : 'PROJECT STORY'));
        const title = element('div', 'case-study-title');
        title.append(element('p', 'case-study-client', record.clientLabel), element('h3', '', record.title));
        head.append(meta, title);
        const body = element('div', 'case-study-body');
        [['The challenge', record.challenge], ['The approach', record.approach], ['The outcome', record.outcome]].forEach(([label, value]) => {
          const block = element('div', 'case-study-block');block.append(element('h4', '', label), element('p', '', value));body.append(block);
        });
        card.append(head, body);
        return card;
      }));
      section.hidden = false;
    } catch { section.hidden = true; }
  }

  loadPublicConfig();
  loadCaseStudies();
})();
