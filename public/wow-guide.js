(() => {
  'use strict';
  const root = document.querySelector('#start');
  if (!root) return;
  const get = id => root.querySelector(`#guide-${id}`);
  const questions = [
    {title:'What would you like to bring into focus?',hint:'Choose the area that is most relevant today.',options:[
      ['ai','Responsible AI adoption','Governance, oversight, and a clearer AI direction'],
      ['cyber','Cybersecurity readiness','Understand gaps and organize next steps'],
      ['evidence','Policies and evidence','Bring structure to readiness information'],
      ['strategy','Technology and business priorities','Connect ambition to a practical roadmap']
    ]},
    {title:'What kind of organization are you supporting?',hint:'A little context helps shape the conversation.',options:[
      ['government','Government contractor','Supporting public-sector or defense work'],
      ['healthcare','Healthcare organization','Care delivery, health technology, or related operations'],
      ['professional','Professional services','Client-focused teams and regulated services'],
      ['other','Another organization','A different setting or an emerging business']
    ]},
    {title:'What brings this into focus now?',hint:'There is no wrong starting point.',options:[
      ['explore','Exploring the possibilities','We want to understand our options'],
      ['plan','Planning our next quarter','We need priorities and a practical direction'],
      ['review','Preparing for an upcoming review','We want to organize our readiness effort']
    ]}
  ];
  const directions = {
    ai:{title:'AI governance & strategy',reason:'Start by making AI use, ownership, and oversight visible. A governance conversation can connect responsible adoption to your business priorities.',points:['Where is AI already being used, and who owns those decisions?','Which use cases and risks deserve attention first?','What policies, approval paths, or oversight are needed?']},
    cyber:{title:'Cybersecurity readiness',reason:'Start with a clearer view of your current environment, relevant requirements, and gaps. An organized readiness plan can help prioritize the work ahead.',points:['Which security requirements are relevant to our organization?','What existing controls and evidence can we build on?','Which gaps should lead the action plan?']},
    evidence:{title:'Compliance organization',reason:'Start by bringing policies, records, and supporting evidence into one understandable structure. The conversation can identify what exists and what needs attention.',points:['Where do our policies and supporting evidence live today?','What information is missing, outdated, or difficult to review?','Who should own each part of the readiness effort?']},
    strategy:{title:'Strategy & roadmaps',reason:'Start by connecting business priorities, technology choices, and risk. A roadmap conversation can turn competing needs into a more practical sequence of decisions.',points:['Which business outcomes should technology support first?','What constraints and tradeoffs shape our choices?','What should happen next, and who should own it?']}
  };
  const contexts = {
    government:'Bring the requirements and evidence expectations relevant to your public-sector or defense work.',
    healthcare:'Bring the operational priorities, governance needs, and responsibilities that shape your healthcare setting.',
    professional:'Bring your client obligations, internal workflows, and the risks most relevant to your services.',
    other:'Bring your organization’s goals, current ways of working, and the constraints that matter most.'
  };
  let step = 0;
  const answers = [null,null,null];
  let previousSummary = '';
  function answerLabel(index) {return questions[index].options.find(option => option[0] === answers[index])?.[1] || '';}
  function focusQuestion() {get('question').focus({preventScroll:true});}
  function render(focus = true) {
    get('question-view').hidden = false;
    get('result').hidden = true;
    get('question').textContent = questions[step].title;
    get('subtext').textContent = questions[step].hint;
    get('progress').textContent = `Question ${step + 1} of 3`;
    root.querySelectorAll('.guide-track > span').forEach((bar,index) => bar.classList.toggle('guide-track-active',index <= step));
    get('options').replaceChildren(...questions[step].options.map(([value,label,detail]) => {
      const row = document.createElement('label');row.className='guide-option';
      const input=document.createElement('input');input.type='radio';input.name='guide-answer';input.value=value;input.checked=answers[step]===value;
      const text=document.createElement('span');const strong=document.createElement('strong');const small=document.createElement('small');strong.textContent=label;small.textContent=detail;text.append(strong,small);row.append(input,text);
      input.addEventListener('change',()=>{answers[step]=value;get('next').disabled=false;});
      return row;
    }));
    get('back').hidden=step===0;
    get('next').disabled=!answers[step];
    get('next').textContent=step===2?'See my direction':'Continue';
    if(focus) focusQuestion();
  }
  function showResult() {
    const direction=directions[answers[0]];
    if(!direction || answers.some(answer => !answer)) return;
    get('question-view').hidden=true;get('result').hidden=false;get('progress').textContent='Your starting point';
    root.querySelectorAll('.guide-track > span').forEach(bar=>bar.classList.add('guide-track-active'));
    get('result-title').textContent=direction.title;get('result-reason').textContent=direction.reason;get('result-context').textContent=contexts[answers[1]];
    get('discussion').replaceChildren(...direction.points.map(point=>{const item=document.createElement('li');item.textContent=point;return item;}));
    get('result-title').focus({preventScroll:true});
  }
  get('next').addEventListener('click',()=>{if(!answers[step])return;if(step<2){step++;render();}else showResult();});
  get('back').addEventListener('click',()=>{if(step>0){step--;render();}});
  get('edit').addEventListener('click',()=>{step=2;render();});
  get('restart').addEventListener('click',()=>{answers.fill(null);step=0;render();});
  get('discuss').addEventListener('click',()=>{
    const direction=directions[answers[0]];if(!direction)return;
    const form=document.querySelector('#contact-form');const interest=form?.querySelector('#interest');const message=form?.querySelector('textarea[name="message"]');
    if(interest && [...interest.options].some(option=>option.value===direction.title)) interest.value=direction.title;
    const summary=`[Starting-point guide]\nFocus: ${answerLabel(0)}\nOrganization: ${answerLabel(1)}\nTiming: ${answerLabel(2)}\nDirection to discuss: ${direction.title}\n\nQuestions for our conversation:\n${direction.points.map((point,index)=>`${index+1}. ${point}`).join('\n')}`;
    if(message){let existing=message.value;if(previousSummary && existing.includes(previousSummary))existing=existing.replace(previousSummary,'').trim();message.value=(existing.trim()?`${existing.trim()}\n\n`:'')+summary;previousSummary=summary;message.dispatchEvent(new Event('input',{bubbles:true}));}
    const contact=document.querySelector('#contact');if(contact){contact.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});history.replaceState(null,'','#contact');requestAnimationFrame(()=>interest?.focus({preventScroll:true}));}
  });
  render(false);
})();
