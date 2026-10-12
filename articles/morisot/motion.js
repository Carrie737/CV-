/* Motion only: keep layout, colours and content in the existing stylesheets. */
(() => {
  'use strict';
  const all = s => [...document.querySelectorAll(s)];
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const animations = new Set(), owners = new WeakMap(), seen = new WeakSet();
  const floating = new Set(), closing = new WeakSet(), imageJobs = new WeakMap();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  let frame = 0, pendingChapter = null;
  const enabled = () => !system.matches && !document.body.matches('.reduce,.reading');
  let lastEnabled = enabled();

  function stop(el) { owners.get(el)?.cancel(); }
  function animate(el, keys, duration = 650, delay = 0) {
    if (!el || !enabled() || !el.animate) return null;
    stop(el);
    const a = el.animate(keys, {duration, delay, easing:ease, fill:'backwards'});
    owners.set(el, a); animations.add(a);
    const release = () => { animations.delete(a); if (owners.get(el) === a) owners.delete(el); };
    a.finished.then(release, release);
    return a;
  }
  function reveal(el, delay = 0) {
    const card = el.matches('.work-card');
    // A short lateral entrance echoes the reference gallery; touch uses vertical motion.
    const x = card && desktop.matches ? (Number(el.querySelector('[data-work]').dataset.work) % 2 ? 18 : -18) : 0;
    animate(el, [{opacity:0, transform:`translate3d(${x}px,${card ? 22 : 14}px,0)`}, {opacity:1, transform:'none'}], desktop.matches ? 760 : 480, delay);
  }
  const entrances = new IntersectionObserver(entries => {
    let order = 0;
    entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting || target.hidden) return;
      entrances.unobserve(target);
      if (seen.has(target)) return;
      seen.add(target); reveal(target, Math.min(order++ * 65, 195));
    });
  }, {threshold:.08});
  all('.work-card,.scene .eyebrow,.footnotes,.duo,.exhibition-intro,.exhibition-name,.closing h3').forEach(el => entrances.observe(el));

  // No perpetual animation loop: at most one frame per scroll, only visible images.
  const images = all('.work-image img');
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      const img = target.querySelector('img');
      if (isIntersecting) floating.add(img);
      else { floating.delete(img); img.style.removeProperty('translate'); img.style.removeProperty('will-change'); }
    });
    schedule();
  }, {rootMargin:'60px 0px'});
  images.forEach(img => visibility.observe(img.parentElement));
  function update() {
    frame = 0;
    if (document.hidden || document.querySelector('dialog[open]')) return;
    if (pendingChapter) {
      const {target,expires} = pendingChapter;
      const top = target.getBoundingClientRect().top;
      if (Math.abs(top - document.querySelector('header').offsetHeight) < 36) {
        const label = target.querySelector('.eyebrow');
        if (label && seen.has(label)) reveal(label);
        pendingChapter = null;
      } else if (performance.now() > expires) pendingChapter = null;
    }
    if (!enabled() || !desktop.matches) return;
    const reads = [...floating].filter(img => !img.closest('[hidden]')).map(img => ({img,rect:img.parentElement.getBoundingClientRect()}));
    reads.forEach(({img,rect}) => {
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / (innerHeight / 2 + rect.height / 2)));
      img.style.willChange = 'translate';
      img.style.translate = `0 ${(progress * 10).toFixed(2)}px`;
    });
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(update); }
  function reset() {
    if (!enabled()) { [...animations].forEach(a => a.cancel()); pendingChapter = null; }
    if (!enabled() || !desktop.matches) images.forEach(img => { img.style.removeProperty('translate'); img.style.removeProperty('will-change'); });
    schedule();
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  desktop.addEventListener('change', reset);
  system.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) {cancelAnimationFrame(frame);frame=0;} else schedule(); });
  new MutationObserver(() => {
    const next = enabled();
    if (next !== lastEnabled) { lastEnabled = next; reset(); }
  }).observe(document.body, {attributes:true,attributeFilter:['class']});
  document.addEventListener('focusin', e => {
    const card = e.target.closest('.work-card');
    if (card) { stop(card); seen.add(card); entrances.unobserve(card); }
  });

  function closeDialog(dialog) {
    if (!dialog.open || closing.has(dialog)) return;
    if (!enabled()) {dialog.close();return;}
    closing.add(dialog);dialog.classList.add('motion-closing');
    const a = animate(dialog, [{opacity:1,transform:'none'},{opacity:0,transform:'translateY(8px) scale(.99)'}], 160);
    const finish = () => {dialog.classList.remove('motion-closing');closing.delete(dialog);if(dialog.open)dialog.close();};
    if (a) a.finished.then(finish, finish); else finish();
  }
  all('dialog').forEach(dialog => {
    // Observe native open state; this also works where the dialog toggle event is absent.
    new MutationObserver(() => {
      if (!dialog.open) {stop(dialog);schedule();return;}
      animate(dialog, [{opacity:0,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'none'}], 360);
      if (dialog.id === 'map') all('#map-grid button').forEach((el,i) => {
        animate(el,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],460,Math.min(i*35,245));
      });
    }).observe(dialog, {attributes:true,attributeFilter:['open']});
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(dialog); });
  });
  document.addEventListener('click', e => {
    const button = e.target.closest('#close-map,#close-figure,#close-art,#exhibition-close');
    if (button) {e.preventDefault();e.stopImmediatePropagation();closeDialog(button.closest('dialog'));}
  }, true);

  function snapshot(cards) {
    return new Map(cards.filter(el=>!el.hidden).map(el=>{stop(el);return [el,el.getBoundingClientRect()];}));
  }
  function reflow(cards, before) {
    // Read geometry once, then write animations. Large grid movements are capped.
    const positions = cards.filter(el=>!el.hidden).map(el=>[el,el.getBoundingClientRect()]);
    positions.forEach(([el,rect],i) => {
      if (rect.bottom < 0 || rect.top > innerHeight + 80) return;
      seen.add(el);entrances.unobserve(el);
      const old = before.get(el);
      if (!old) {reveal(el,Math.min(i*45,135));return;}
      const x=Math.max(-48,Math.min(48,old.left-rect.left)),y=Math.max(-64,Math.min(64,old.top-rect.top));
      if (x || y) animate(el,[{transform:`translate(${x}px,${y}px)`},{transform:'none'}],460);
    });
    schedule();
  }
  function swap(img, caption, direction) {
    const job = {}; imageJobs.set(img,job);
    // The caption changes immediately. Only the latest decoded image may animate.
    stop(img);stop(caption);
    const done = () => {
      if (imageJobs.get(img)!==job || !img.closest('dialog')?.open) return;
      animate(img,[{opacity:.25,transform:`translateX(${direction*12}px)`},{opacity:1,transform:'none'}],320);
    };
    if (img.complete && img.naturalWidth) done(); else img.decode().then(done,()=>{});
    animate(caption,[{opacity:.35,transform:`translateX(${direction*8}px)`},{opacity:1,transform:'none'}],320);
  }
  // Existing data controls keep their handlers; animate only the resulting feedback.
  document.addEventListener('click',e=>{
    if (!e.target.closest('.bar-row,.column')) return;
    const panel=e.target.closest('.chart-panel');
    animate(panel?.querySelector('.insight'),[{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'none'}],260);
  });
  document.addEventListener('change',e=>{
    if (e.target.id==='period') all('#peer-chart .bar-fill').forEach((el,i)=>animate(el,[{transform:'scaleX(.2)'},{transform:'scaleX(1)'}],550,i*45));
  });
  window.SiteMotion = {closeDialog,snapshot,reflow,swap,chapter(target){pendingChapter={target,expires:performance.now()+2400};schedule();}};
})();
