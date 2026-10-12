(() => {
  'use strict';
  const scenes = [...document.querySelectorAll('.scene')];
  const activeAnimations = new Set();
  let timer;
  const reduced = () => document.body.classList.contains('reduced');
  const animate = (el, frames, options) => {
    if (reduced() || !el.animate) return;
    const animation = el.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    return animation;
  };
  scenes.forEach(scene => {
    scene.querySelectorAll('h1, h2').forEach(heading => {
      const lines = heading.innerHTML.trim().split(/<br\s*\/?\s*>/i);
      heading.innerHTML = lines.map(line => `<span class="reveal-line"><span>${line}</span></span>`).join('');
    });
  });
  function reveal(scene, delay = 0) {
    if (!scene || reduced()) return;
    scene.querySelectorAll('h1 .reveal-line > span, h2 .reveal-line > span').forEach((line,i) => {
      animate(line,[{transform:'translateY(110%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:520,delay:delay+i*65,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
    });
    scene.querySelectorAll('.eyebrow, .hero-intro, .hero-links, .index-row, .feature-card, .roadmap-card').forEach((el,i) => {
      animate(el,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,delay:delay+100+Math.min(i,5)*45,easing:'ease-out',fill:'backwards'});
    });
    scene.querySelectorAll('.image-reveal').forEach(el => {
      animate(el,[{clipPath:'inset(0 100% 0 0)',opacity:.7},{clipPath:'inset(0 0% 0 0)',opacity:1}],{duration:650,delay:delay+60,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
    });
  }
  function cancelMotion() {
    clearTimeout(timer);
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  }
  document.addEventListener('cv:chapter',event => {
    if (!event.detail.changed || event.detail.reading) return;
    cancelMotion();
    timer = setTimeout(() => reveal(scenes[event.detail.current]),360);
  });
  document.addEventListener('cv:motion',event => { if (event.detail.reduced) cancelMotion(); });
  document.addEventListener('cv:mode',cancelMotion);
  const seen = new WeakSet();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!document.body.classList.contains('reading')) return;
      entries.forEach(entry => {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          reveal(entry.target);
        }
      });
    },{threshold:.12});
    scenes.forEach(scene => observer.observe(scene));
  }
  let transitioning = false;
  window.cvTransition = (button, immediate, normal) => {
    if (!button.hasAttribute('data-detail') || reduced() || !document.startViewTransition || document.body.classList.contains('reading') || transitioning) {
      normal(); return;
    }
    cancelMotion();
    transitioning = true;
    const transition = document.startViewTransition(immediate);
    transition.finished.catch(() => {}).finally(() => { transitioning = false; });
  };
  const tabs = [...document.querySelectorAll('.research-tabs [role="tab"]')];
  function selectTab(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected',String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
    animate(document.getElementById(tab.getAttribute('aria-controls')),[{opacity:.3,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'ease-out'});
  }
  tabs.forEach((tab,i) => {
    tab.addEventListener('click',() => selectTab(tab));
    tab.addEventListener('keydown',event => {
      let next;
      if (event.key === 'ArrowRight') next = (i+1)%tabs.length;
      if (event.key === 'ArrowLeft') next = (i+tabs.length-1)%tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length-1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next],true); }
    });
  });
  reveal(document.querySelector('.scene.active'),100);
})();
