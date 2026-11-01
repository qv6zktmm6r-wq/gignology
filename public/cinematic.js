'use strict';
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const header=document.querySelector('.header');
  const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');header.append(progress);
  let ticking=false;
  function updateHeader(){const y=window.scrollY;header.classList.toggle('is-scrolled',y>45);const range=document.documentElement.scrollHeight-window.innerHeight;header.style.setProperty('--reading-progress',range>0?Math.min(y/range,1):0);ticking=false;}
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateHeader);}},{passive:true});updateHeader();
  if(!reduced.matches){document.body.classList.add('site-enhanced');if('IntersectionObserver' in window){const reveal=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}});},{threshold:.08});document.querySelectorAll('.section-top,.solution-explorer,.approach-step,.about-visual,.about-copy,.sprint-section,.guide-section').forEach(element=>{element.classList.add('reveal-ready');reveal.observe(element);});}}
})();
