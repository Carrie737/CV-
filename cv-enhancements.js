/* Progressive motion; original content stays visible without this module. */
(() => {
  'use strict';
  const body = document.body, scenes = [...document.querySelectorAll('.scene')];
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(min-width: 821px) and (hover: hover) and (pointer: fine)');
  const reduced = () => body.classList.contains('reduced') || system.matches;
  const reading = () => body.classList.contains('reading');
  const activeAnimations = new Set(), owners = new WeakMap(), seen = new WeakSet(), candidates = new Map();
  let chapterTimer = 0, visibilityFrame = 0, settling = false, printing = false;
  function animate(el, frames, options = {}) {
    if (!el || reduced() || printing || document.hidden || !el.animate) return;
    owners.get(el)?.cancel();
    const animation = el.animate(frames, {duration:600, easing:ease, fill:'backwards', ...options});
    owners.set(el, animation); activeAnimations.add(animation);
    const release = () => {
      activeAnimations.delete(animation);
      if (owners.get(el) === animation) owners.delete(el);
    };
    animation.finished.then(release, release);
    return animation;
  }
  // Preserve heading text and line breaks; add clipping wrappers only.
  scenes.forEach(scene => {
    scene.querySelectorAll('h1, h2').forEach(heading => {
      if (heading.matches('.hero-title')) {
        const text = heading.textContent;
        heading.textContent = '';
        const line = document.createElement('span');
        line.className = 'reveal-line hero-name';
        [...text].forEach(char => {
          const span = document.createElement('span'); span.textContent = char; line.append(span);
        });
        heading.append(line);
      } else {
        const lines = heading.innerHTML.trim().split(/<br\s*\/?\s*>/i);
        heading.innerHTML = lines.map(line => `<span class="reveal-line"><span>${line}</span></span>`).join('');
      }
    });
    const elements = [...scene.querySelectorAll([
      'h1 .reveal-line > span','h2 .reveal-line > span','.eyebrow','.hero-intro',
      '.hero-copy > .small','.hero-links','.index-row','.section-heading > p','.image-reveal',
      '.education-card','.education-date','.education-card h3','.education-card .degree',
      '.education-card .location','.education-card .course-list','.score-track span',
      '.publication-card','.research-layout > div > p:first-child','#catalogueNumber','.catalogue-bar',
      '.project-overview > div > p','.leadership-item','.project-card','.audience-strip',
      '.feature-card','.roadmap-card','.model-grid > div','.experience-metric','.job','.contact-grid > div','.chapter-actions'
    ].join(','))];
    elements.forEach(el => el.classList.add('motion-item'));
    candidates.set(scene, elements);
  });
  const number = document.querySelector('#catalogueNumber');
  let numberFrame = 0, numberTarget = Number(number.textContent);
  function finishNumber() {
    cancelAnimationFrame(numberFrame); numberFrame = 0; number.textContent = String(numberTarget);
  }
  window.cvSetCatalogueNumber = (value, initial = false) => {
    const from = initial ? 0 : Number(number.textContent);
    numberTarget = value; cancelAnimationFrame(numberFrame);
    // Announce the final data, not every intermediate animation frame.
    number.setAttribute('aria-label', String(value)); number.setAttribute('role','img');
    if (reduced() || printing || document.hidden || !seen.has(number)) { finishNumber(); return; }
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / 600);
      number.textContent = String(Math.round(from + (value - from) * (1 - (1 - t) ** 3)));
      if (t < 1) numberFrame = requestAnimationFrame(tick); else finishNumber();
    };
    numberFrame = requestAnimationFrame(tick);
  };
  function reveal(el, delay = 0) {
    if (seen.has(el) || el.closest('[hidden]')) return;
    seen.add(el);
    if (el === number) { window.cvSetCatalogueNumber(numberTarget, true); return; }
    if (el.matches('.image-reveal')) {
      animate(el,[{clipPath:'inset(0 100% 0 0)',opacity:.7},{clipPath:'inset(0 0% 0 0)',opacity:1}],{duration:850,delay});
    } else if (el.matches('.score-track span, .catalogue-bar')) {
      animate(el,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:850,delay});
    } else if (el.matches('.education-card')) {
      animate(el,[{'--rule-progress':'0'},{'--rule-progress':'1'}],{duration:900,delay});
    } else if (el.matches('.project-card, .publication-card')) {
      // Pointer transforms own the outer card; entrances only own opacity.
      animate(el,[{opacity:0},{opacity:1}],{duration:650,delay});
    } else {
      const heroName = el.closest('.hero-name');
      animate(el,[{opacity:0,transform:`translateY(${heroName ? '108%' : '14px'})`},{opacity:1,transform:'translateY(0)'}],{duration:heroName ? 960 : 600,delay});
    }
  }
  function visible(el, scene) {
    if (el.closest('[hidden]') || !el.getClientRects().length) return false;
    const r = el.getBoundingClientRect(), s = scene.getBoundingClientRect();
    const top = document.querySelector('.site-header').offsetHeight;
    const bottom = innerHeight - document.querySelector('.footer-nav').offsetHeight;
    return r.bottom > Math.max(top,s.top) && r.top < Math.min(bottom,s.bottom) && r.right > 0 && r.left < innerWidth;
  }
  function revealVisible() {
    if (settling || document.hidden) return;
    const list = reading() ? scenes : scenes.filter(scene => scene.classList.contains('active'));
    list.forEach(scene => {
      let order = 0;
      const visibleElements = candidates.get(scene).filter(el => !seen.has(el) && visible(el,scene));
      visibleElements.forEach(el => {
        let delay = Math.min(order++ * 85,420);
        if (scene.id === 'about') {
          if (el.closest('.hero-name')) delay = [...el.parentElement.children].indexOf(el) * 100;
          else if (el.matches('.hero-intro')) delay = 420;
          else if (el.matches('.hero-copy > .small')) delay = 540;
          else if (el.matches('.hero-links')) delay = 660;
          else if (el.matches('.index-row')) delay = 740 + [...el.parentElement.children].indexOf(el) * 100;
        }
        reveal(el,delay);
      });
    });
  }
  function scheduleVisible() {
    if (visibilityFrame) return;
    visibilityFrame = requestAnimationFrame(() => { visibilityFrame = 0; revealVisible(); });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!reading() || settling) return;
      let order = 0;
      entries.forEach(entry => {
        if (entry.isIntersecting && !seen.has(entry.target)) reveal(entry.target,Math.min(order++ * 85,340));
      });
    },{threshold:.12});
    candidates.forEach(elements => elements.forEach(el => observer.observe(el)));
  }
  // One capture listener covers the scrollable canvas chapters too.
  document.addEventListener('scroll',scheduleVisible,{capture:true,passive:true});
  const pointers = [];
  let pointerFrame = 0;
  const pointerEnabled = () => finePointer.matches && !reduced() && !printing && !document.hidden;
  function clearPointers() {
    cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    pointers.forEach(item => {
      item.x = item.y = item.tx = item.ty = 0; item.active = false;
      item.output.style.removeProperty('transform'); item.output.classList.remove('pointer-moving');
    });
  }
  function pointerTick() {
    pointerFrame = 0;
    if (!pointerEnabled()) { clearPointers(); return; }
    let moving = false;
    pointers.forEach(item => {
      if (item.el.closest('[inert]')) { item.tx = item.ty = 0; item.active = false; }
      item.x += (item.tx - item.x) * .09; item.y += (item.ty - item.y) * .09;
      const pending = Math.abs(item.tx - item.x) + Math.abs(item.ty - item.y) > .002;
      if (pending) moving = true;
      if (!pending && !item.active) {
        item.output.style.removeProperty('transform'); item.output.classList.remove('pointer-moving'); return;
      }
      item.output.classList.add('pointer-moving');
      item.output.style.transform = item.photo
        ? `translate3d(${item.x * 9}px,${item.y * 9}px,0) scale(${1 + Math.max(Math.abs(item.x),Math.abs(item.y)) * .04})`
        : `perspective(1200px) rotateX(${-item.y * item.degrees}deg) rotateY(${item.x * item.degrees}deg) translate3d(0,${-Math.max(Math.abs(item.x),Math.abs(item.y)) * 4}px,0)`;
    });
    if (moving) pointerFrame = requestAnimationFrame(pointerTick);
  }
  function addPointer(el,output,photo = false,degrees = 3.5) {
    const item = {el,output,photo,degrees,x:0,y:0,tx:0,ty:0,active:false,rect:null}; pointers.push(item);
    el.addEventListener('pointerenter',event => {
      if (!pointerEnabled() || event.pointerType === 'touch' || el.closest('[inert], [data-v3-static]')) return;
      item.rect = el.getBoundingClientRect(); item.active = true;
    });
    el.addEventListener('pointermove',event => {
      if (!item.active || !pointerEnabled() || el.closest('[inert]')) return;
      item.tx = Math.max(-1,Math.min(1,(event.clientX - item.rect.left) / item.rect.width * 2 - 1));
      item.ty = Math.max(-1,Math.min(1,(event.clientY - item.rect.top) / item.rect.height * 2 - 1));
      if (!pointerFrame) pointerFrame = requestAnimationFrame(pointerTick);
    },{passive:true});
    const leave = () => {
      item.active = false; item.tx = item.ty = 0;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(pointerTick);
    };
    el.addEventListener('pointerleave',leave); el.addEventListener('pointercancel',leave);
  }
  const portrait = document.querySelector('.portrait-frame');
  addPointer(portrait,portrait.querySelector('img'),true);
  document.querySelectorAll('.project-card, .publication-card').forEach(el => addPointer(el,el,false,el.matches('.publication-card') ? 1.6 : 3.5));
  const prototype = document.querySelector('.prototype-figure');
  if (prototype) addPointer(prototype,prototype,false,3);
  function cancelMotion() {
    clearTimeout(chapterTimer); cancelAnimationFrame(visibilityFrame); visibilityFrame = 0; settling = false;
    activeAnimations.forEach(animation => animation.cancel()); activeAnimations.clear(); clearPointers(); finishNumber();
  }
  document.addEventListener('cv:chapter',event => {
    if (!event.detail.changed || event.detail.reading) return;
    cancelMotion(); settling = !!event.detail.duration;
    chapterTimer = setTimeout(() => { settling = false; revealVisible(); },event.detail.duration ? event.detail.duration * .78 : 0);
  });
  document.addEventListener('cv:mode',() => { cancelMotion(); scheduleVisible(); });
  document.addEventListener('cv:motion',() => { cancelMotion(); scheduleVisible(); });
  document.addEventListener('cv:progress',() => {
    queueMicrotask(() => animate(document.querySelector('#counter'),[{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:300}));
  });
  document.addEventListener('visibilitychange',() => { if (document.hidden) cancelMotion(); else scheduleVisible(); });
  addEventListener('resize',() => { clearPointers(); scheduleVisible(); });
  finePointer.addEventListener('change',clearPointers);
  addEventListener('beforeprint',() => { printing = true; cancelMotion(); });
  addEventListener('afterprint',() => { printing = false; scheduleVisible(); });
  // Preserve the existing hook; all routes now share the original spatial camera.
  window.cvTransition = (_button,_immediate,normal) => normal();
  const tabs = [...document.querySelectorAll('.research-tabs [role="tab"]')];
  function selectTab(tab,focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected',String(selected)); item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
    animate(document.getElementById(tab.getAttribute('aria-controls')),[{opacity:.3,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:230});
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
  revealVisible();
})();
