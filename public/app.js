'use strict';
const solutions = {
  ai: {label:'INTELLIGENCE, WITH INTENTION',title:'Build with AI.\nGovern with confidence.',description:'Make responsible adoption practical. Connect AI use cases, organizational readiness, and risk to a clear governance approach aligned with the NIST AI Risk Management Framework.',focus:['AI-use inventory','Risk classification','Governance roadmap'],icon:'ai',interest:'AI governance & strategy',cta:'Let’s explore AI governance'},
  digital: {label:'READINESS STARTS WITH VISIBILITY',title:'Understand your risk.\nPrioritize your next move.',description:'Bring cybersecurity gaps, readiness evidence, and remediation priorities into focus. Explore NIST SP 800-171 and CMMC readiness through an organized, practical action plan.',focus:['Readiness assessment','Gap prioritization','Action planning'],icon:'digital',interest:'Cybersecurity readiness',cta:'Discuss cybersecurity readiness'},
  automation: {label:'LESS FRICTION. MORE CLARITY.',title:'Make the evidence\neasier to navigate.',description:'Bring structure to the policies, records, and evidence behind your readiness effort. Organize what you have, identify what’s missing, and make the next review more manageable.',focus:['Evidence organization','Policy structure','Review preparation'],icon:'automation',interest:'Compliance organization',cta:'Explore evidence organization'},
  enterprise: {label:'DIRECTION BEFORE DECISIONS',title:'A practical roadmap\nfor what comes next.',description:'Connect operational priorities, technology choices, and risk. Build a prioritized roadmap that gives leadership a clearer picture of the decisions and actions ahead.',focus:['Business alignment','Prioritized roadmap','Implementation planning'],icon:'enterprise',interest:'Strategy & roadmaps',cta:'Let’s discuss your roadmap'}
};
const tabs = [...document.querySelectorAll('[data-solution]')];
function selectSolution(key, focus = false) {
  const data = solutions[key];
  if (!data) return;
  tabs.forEach(tab => { const selected = tab.dataset.solution === key; tab.classList.toggle('active',selected); tab.setAttribute('aria-selected',String(selected)); tab.tabIndex = selected ? 0 : -1; if(selected && focus) tab.focus(); });
  document.querySelector('#solution-panel').setAttribute('aria-labelledby',`tab-${key}`);
  document.querySelector('#solution-label').textContent = data.label;
  const title = document.querySelector('#solution-title'); title.replaceChildren();
  data.title.split('\n').forEach((line, i) => { if(i) title.append(document.createElement('br')); title.append(document.createTextNode(line)); });
  document.querySelector('#solution-description').textContent = data.description;
  document.querySelector('#solution-icon').setAttribute('href',`#icon-${data.icon}`);
  document.querySelector('#solution-focus').replaceChildren(...data.focus.map(text => {const span = document.createElement('span');span.textContent = text;return span;}));
  const link = document.querySelector('#solution-contact'); link.replaceChildren(document.createTextNode(data.cta+' '));
  link.dataset.interest=data.interest;
}
tabs.forEach((tab,index) => {
  tab.addEventListener('click',() => selectSolution(tab.dataset.solution));
  tab.addEventListener('keydown',event => {
    let next = index;
    if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(index+1)%tabs.length;
    else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();selectSolution(tabs[next].dataset.solution,true);
  });
});
document.querySelectorAll('[data-select]').forEach(link => link.addEventListener('click',() => selectSolution(link.dataset.select)));
document.querySelector('#solution-contact').addEventListener('click',event => {document.querySelector('#interest').value=event.currentTarget.dataset.interest || solutions.ai.interest;});
selectSolution('ai');
const menuToggle=document.querySelector('.menu-toggle');const mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation');mobileNav.hidden=true;}
menuToggle.addEventListener('click',() => {const expanded=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!expanded));menuToggle.setAttribute('aria-label',expanded?'Open navigation':'Close navigation');mobileNav.hidden=expanded;});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeMenu();menuToggle.focus();}});
document.querySelector('#year').textContent=new Date().getFullYear();

// Lightweight, seamless ambient hero motion. Respect OS motion and page visibility.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const heroVideo=document.querySelector('.hero-video');
let heroVisible=true;let videoRequested=false;
if(window.matchMedia('(max-width:700px)').matches)heroVideo.src='assets/hero-loop-mobile.mp4';
heroVideo.muted=true;heroVideo.defaultMuted=true;heroVideo.defaultPlaybackRate=.72;heroVideo.playbackRate=.72;
heroVideo.addEventListener('playing',()=>document.body.classList.add('video-ready'));
heroVideo.addEventListener('error',()=>document.body.classList.add('video-error'));
let paused=reducedMotion.matches||Boolean(navigator.connection?.saveData);let animationFrame=0;let lastTime=0;let frameElapsed=0;const canvas=document.querySelector('.hero-particles');const context=canvas.getContext('2d');const motionButton=document.querySelector('.motion-control');let width=0,height=0;
const particles=Array.from({length:30},()=>({x:Math.random(),y:.16+Math.random()*.7,r:.5+Math.random()*1.1,v:.003+Math.random()*.01,alpha:.1+Math.random()*.5}));
function sizeCanvas(){const bounds=canvas.getBoundingClientRect();width=bounds.width;height=bounds.height;const ratio=Math.min(window.devicePixelRatio||1,1.5);canvas.width=width*ratio;canvas.height=height*ratio;context?.setTransform(ratio,0,0,ratio,0,0);}
function animate(time){if(paused||document.hidden||!heroVisible||!context)return;const delta=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;frameElapsed+=delta;
  if(frameElapsed>1/30){frameElapsed=0;context.clearRect(0,0,width,height);for(const p of particles){p.x=(p.x+p.v*delta*2)%1;const x=p.x*width,y=p.y*height;context.beginPath();context.fillStyle=`rgba(64,196,255,${p.alpha*(p.x>.4?1:.3)})`;context.arc(x,y,p.r,0,Math.PI*2);context.fill();} }
  animationFrame=requestAnimationFrame(animate);
}
function syncMotion(){document.body.classList.toggle('motion-paused',paused);motionButton.setAttribute('aria-pressed',String(paused));motionButton.querySelector('.motion-label').textContent=paused?'Play motion':'Pause motion';cancelAnimationFrame(animationFrame);lastTime=0;frameElapsed=0;const shouldPlay=!paused&&!document.hidden&&heroVisible;if(shouldPlay){animationFrame=requestAnimationFrame(animate);if(!videoRequested){videoRequested=true;heroVideo.load();}heroVideo.play().catch(()=>{});}else{heroVideo.pause();}}
motionButton.addEventListener('click',()=>{paused=!paused;syncMotion();});reducedMotion.addEventListener('change',event=>{paused=event.matches;syncMotion();});document.addEventListener('visibilitychange',syncMotion);window.addEventListener('resize',sizeCanvas,{passive:true});sizeCanvas();syncMotion();
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${entry.target.id}`));}}},{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('section[id]').forEach(section=>observer.observe(section));const heroObserver=new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncMotion();},{threshold:0});heroObserver.observe(document.querySelector('.hero'));}
