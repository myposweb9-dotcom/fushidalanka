(function(){
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The catalogue section contains independently animated cards. Do not hide the
  // parent section itself, otherwise the cards can be visible but remain invisible
  // behind the parent's opacity: 0 until an intersection callback fires.
  const targets=document.querySelectorAll('main section:not(.hero):not(.sp-hero):not(#products-section), main .category-card, main .product-card, main .catalog-card, main .sp-card, main .benefit, main .faq-item, main .contact-details > div');
  if(!targets.length) return;
  targets.forEach((element,index)=>{element.classList.add('scroll-reveal');element.style.setProperty('--reveal-delay',`${Math.min(index%6,5)*70}ms`)});
  if(reduceMotion){targets.forEach(element=>element.classList.add('is-visible'));return;}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{entry.target.classList.toggle('is-visible',entry.isIntersecting)}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});
  targets.forEach(element=>observer.observe(element));
})();
