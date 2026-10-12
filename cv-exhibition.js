/* V3: independent exhibition islands inside the existing Prezi canvas. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const body = document.body;
  const controllers = [];
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 821px) and (pointer: fine)');
  let printing = false, settleTimer = 0;
  const reduced = () => body.classList.contains('reduced') || system.matches;
  const simple = () => reduced() || printing || body.classList.contains('reading');
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function node(tag, className, html = '') {
    const el = document.createElement(tag); el.className = className; el.innerHTML = html; return el;
  }
  function button(text, label, fn, className = '') {
    const el = node('button', className, text); el.type = 'button';
    if (label) el.setAttribute('aria-label', label);
    if (fn) el.addEventListener('click', fn);
    return el;
  }
  function dossier(label, content) {
    const el = node('details', 'v3-dossier');
    el.append(node('summary', '', `${label}<span aria-hidden="true">＋</span>`), content); return el;
  }
  function controlBar(prev, next, reset) {
    const el = node('div', 'v3-controls');
    el.append(prev, next); if (reset) el.append(reset); return el;
  }
  // A gesture stays within its island. Clicks survive taps; drags never click a card.
  function drag(surface, change, end) {
    surface.dataset.cvInteractive = '';
    let gesture = null, suppressUntil = 0;
    surface.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.isPrimary === false || gesture || simple() || e.target.closest('.v3-controls')) return;
      gesture = {id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false,touch:e.pointerType === 'touch'};
    });
    surface.addEventListener('pointermove', e => {
      if (!gesture || e.pointerId !== gesture.id) return;
      const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
      if (gesture.touch && !gesture.dragged && Math.abs(dy) > Math.abs(dx)) return;
      if (Math.hypot(dx,dy) > 6 && !gesture.dragged) {
        gesture.dragged = true;
        surface.setPointerCapture(e.pointerId);
      }
      if (gesture.dragged) change(dx,dy);
    }, {passive:true});
    const finish = e => {
      if (!gesture || e.pointerId !== gesture.id) return;
      const dragged = gesture.dragged;
      if (surface.hasPointerCapture(e.pointerId)) surface.releasePointerCapture(e.pointerId);
      gesture = null;
      if (dragged) { suppressUntil = performance.now() + 300; end(e.type === 'pointercancel'); }
    };
    surface.addEventListener('pointerup', finish);
    surface.addEventListener('pointercancel', finish);
    surface.addEventListener('lostpointercapture', e => { if (gesture) finish(e); });
    surface.addEventListener('click', e => {
      if (performance.now() < suppressUntil) { suppressUntil=0;e.preventDefault();e.stopImmediatePropagation(); }
    }, true);
    surface.addEventListener('dragstart', e => e.preventDefault());
    return () => {
      const pending=gesture;gesture=null;
      if(pending&&surface.hasPointerCapture(pending.id))surface.releasePointerCapture(pending.id);
    };
  }
  function register(controller) {
    controller.visible = false; controllers.push(controller);
    return controller;
  }
  function sync() {
    controllers.forEach(c => {
      const active = !simple() && !document.hidden && c.scene.classList.contains('active') && c.visible && !$('#world').classList.contains('camera-moving');
      c.setActive(active);
      c.access?.();
    });
  }

  // 01 / Project cover. All original nodes survive in the cover or dossier.
  const projects = $('#projects');
  const overview = $('.project-overview', projects), copy = overview.firstElementChild;
  const originalProject = $('.project-card', projects);
  const cover = node('div', 'project-cover');
  const title = node('div', 'project-title-block');
  title.append($('.eyebrow', copy), $('.project-role', originalProject), $('h3', originalProject), $('h2', copy), $('.project-tagline', originalProject));
  const stage = node('div', 'project-stage v3-only', `
    <div class="project-space"><div class="project-orbit">
      <div class="project-floor" aria-hidden="true"></div>
      <button class="v3-plane stage-archive" type="button" aria-pressed="true"><img src="assets/archive/christies-cover.jpg" width="570" height="810" alt="论文所载佳士得图录封面"><span>01 / 艺术档案</span></button>
      <button class="v3-plane stage-art" type="button" aria-pressed="false"><img src="articles/morisot/assets/exhibition/image4.jpeg" alt="研究案例：贝尔特·莫里索《午餐后》" loading="lazy"><span>02 / 艺术作品</span></button>
      <button class="v3-plane stage-platform" type="button" aria-pressed="false"><img src="assets/platform-artists.jpg" width="650" height="812" alt="原始项目计划书中的页面概念稿"><span>03 / 数字平台构想</span></button>
    </div></div>
    <p class="stage-caption" aria-live="polite">论文原图 · 佳士得图录封面</p>
    <span class="v3-gesture-hint">拖动旋转 · 点击资料</span>
  `);
  stage.tabIndex = 0; stage.setAttribute('role','group'); stage.setAttribute('aria-label','艺术档案、作品与平台概念的三维关系舞台');
  const actions = node('div', 'project-cover-actions');
  const explore = button('探索项目 <span aria-hidden="true">↗</span>', null, null, 'solid-button project-explore');
  explore.dataset.step = '5'; explore.dataset.detail = '';
  actions.append(explore, $('.source-link', originalProject));
  cover.append(title, stage, actions);
  const originalDossier = dossier('项目背景、竞赛与领导力 · 完整档案', overview);
  projects.append(cover, originalDossier);
  originalProject.dataset.v3Static = '';
  projects.classList.add('v3-ready');
  let stageX = -5, stageY = 0, targetX = -5, targetY = 0, stageFrame = 0, stageActive = false;
  let stageBaseX = -5, stageBaseY = 0, stageDragging = false, stageRect;
  const orbit = $('.project-orbit', stage);
  function drawStage() { orbit.style.transform = `rotateX(${stageX}deg) rotateY(${stageY}deg)`; }
  function stageTick() {
    stageFrame = 0;
    stageX += (targetX-stageX)*.12; stageY += (targetY-stageY)*.12; drawStage();
    if (Math.abs(targetX-stageX)+Math.abs(targetY-stageY) > .02 && stageActive) stageFrame = requestAnimationFrame(stageTick);
  }
  function moveStage(x,y) {
    targetX = clamp(x,-14,12); targetY = clamp(y,-25,25);
    if (simple() || !stageActive) { stageX=targetX; stageY=targetY; drawStage(); }
    else if (!stageFrame) stageFrame=requestAnimationFrame(stageTick);
  }
  const clearStageDrag = drag(stage,(dx,dy) => {
    if (!stageDragging) { stageBaseX=stageX; stageBaseY=stageY; stageDragging=true; }
    moveStage(stageBaseX-dy*.07,stageBaseY+dx*.11);
  },() => { stageDragging=false; stageBaseX=targetX; stageBaseY=targetY; });
  stage.addEventListener('pointerenter', () => { stageRect=stage.getBoundingClientRect(); });
  stage.addEventListener('pointermove', e => {
    if (!stageActive || !desktop.matches || e.buttons || stageDragging || !stageRect) return;
    moveStage(stageBaseX-(e.clientY-stageRect.top-stageRect.height/2)/stageRect.height*4,stageBaseY+(e.clientX-stageRect.left-stageRect.width/2)/stageRect.width*7);
  },{passive:true});
  stage.addEventListener('pointerleave', () => { if (!stageDragging) moveStage(stageBaseX,stageBaseY); });
  const captions = ['论文原图 · 佳士得图录封面','研究案例 · 贝尔特·莫里索《午餐后》；并非平台藏品','项目计划书第 24 页 · 原始概念稿'];
  $$('.v3-plane',stage).forEach((plane,i) => plane.addEventListener('click',() => {
    $$('.v3-plane',stage).forEach((el,j) => { el.classList.toggle('is-selected',i===j); el.setAttribute('aria-pressed',String(i===j)); });
    $('.stage-caption',stage).textContent=captions[i];
  }));
  stage.append(controlBar(
    button('↶','向左旋转关系舞台',() => { stageBaseY=clamp(stageBaseY-8,-25,25); moveStage(stageBaseX,stageBaseY); }),
    button('↷','向右旋转关系舞台',() => { stageBaseY=clamp(stageBaseY+8,-25,25); moveStage(stageBaseX,stageBaseY); }),
    button('复位','复位关系舞台',() => { stageBaseX=-5; stageBaseY=0; moveStage(-5,0); })
  ));
  stage.addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation(); stageBaseY=clamp(stageBaseY+(e.key==='ArrowLeft'?-8:8),-25,25); moveStage(stageBaseX,stageBaseY);
  });
  drawStage();
  register({scene:projects,container:stage,setActive(active) {
    stageActive=active; stage.dataset.rendering=String(active);
    if (!active) { cancelAnimationFrame(stageFrame); stageFrame=0; clearStageDrag(); stageDragging=false; stageBaseX=-5; stageBaseY=0; stageX=targetX=-5; stageY=targetY=0; drawStage(); }
  }});

  // 02 / Product explorer. Original feature articles are the actual detail panels.
  const platform = $('#platform-design'), platformLayout = $('.platform-layout',platform);
  const platformCopy = platformLayout.firstElementChild;
  const features = $$('.feature-card',platform), featureGrid = $('.feature-grid',platform);
  const prototype = $('.prototype-figure',platform); prototype.dataset.v3Static='';
  const audience = $('.audience-strip',platformCopy); platformLayout.before(audience);
  const explorer = node('div','product-explorer v3-only');
  const ring = node('div','product-ring', '<div class="product-ring-floor" aria-hidden="true"></div>');
  ring.tabIndex=0; ring.setAttribute('role','group'); ring.setAttribute('aria-label','可拖动的四模块产品构想展示器，左右键选择模块');
  const names=['ARCHIVE','DISCOVER','CONNECT','COLLECT'];
  const media=[
    '<img src="assets/archive/christies-cover.jpg" alt="论文所载图录封面">',
    '<img src="assets/platform-artists.jpg" alt="艺术家展示页面原始概念稿">',
    '<div class="connection-study" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><span class="media-note">关系示意</span>',
    '<img src="assets/archive/christies-price-list.jpg" alt="论文所载历史拍卖价目表，研究材料">'
  ];
  const ringCards = features.map((feature,i) => {
    const card=button(`<span class="orbit-number">0${i+1}</span><div class="orbit-media">${media[i]}</div><strong>${names[i]}</strong><span>${$('h3',feature).textContent}</span>`, `探索 ${names[i]}：${$('h3',feature).textContent}`,()=>selectModule(i),'orbit-card');
    card.dataset.module=String(i); ring.append(card); return card;
  });
  const switcher=node('div','module-switcher'); switcher.setAttribute('role','tablist'); switcher.setAttribute('aria-label','项目功能构想');
  const moduleTabs=names.map((name,i) => {
    const tab=button(`0${i+1} <span>${name}</span>`,name,()=>selectModule(i),'module-tab');
    tab.id=`module-tab-${i}`; tab.setAttribute('role','tab'); tab.setAttribute('aria-controls',`module-panel-${i}`);
    features[i].id=`module-panel-${i}`; features[i].setAttribute('role','tabpanel'); features[i].setAttribute('aria-labelledby',tab.id);
    features[i].tabIndex=0;
    switcher.append(tab); return tab;
  });
  const moduleStatus=node('span','module-status'); moduleStatus.setAttribute('aria-live','polite');
  const moduleControls=controlBar(button('←','上一个功能模块',()=>selectModule(selectedModule-1)),button('→','下一个功能模块',()=>selectModule(selectedModule+1)));
  moduleControls.prepend(moduleStatus);
  explorer.append(node('p','v3-kicker','产品构想 · 拖动或选择卡片'),ring,moduleControls,switcher);
  const conceptDossier=dossier('查看原始项目概念稿',prototype);
  platformCopy.append(explorer,conceptDossier); platformLayout.append(featureGrid);
  platform.classList.add('v3-ready');
  let selectedModule=0, ringAngle=0, ringTarget=0, ringFrame=0, ringActive=false, ringDragBase=0, ringDragging=false;
  function drawRing() {
    const radius=ring.clientWidth<480 ? 152 : 225;
    ringCards.forEach((card,i) => {
      const a=(i*90+ringAngle)*Math.PI/180, depth=(Math.cos(a)+1)/2;
      card.style.transform=`translate(-50%,-50%) translate3d(${Math.sin(a)*radius}px,${(1-depth)*-22}px,${Math.cos(a)*145}px) rotateY(${-Math.sin(a)*27}deg) scale(${.76+depth*.28})`;
      card.style.zIndex=String(Math.round(depth*100)); card.style.opacity=String(.38+depth*.62);
    });
    ring.dataset.rotation=ringAngle.toFixed(2);
  }
  function ringTick() {
    ringFrame=0; ringAngle+=(ringTarget-ringAngle)*.12; drawRing();
    if (Math.abs(ringTarget-ringAngle)>.04 && ringActive) ringFrame=requestAnimationFrame(ringTick);
    else { ringAngle=ringTarget; drawRing(); }
  }
  function runRing() {
    if (simple() || !ringActive) { cancelAnimationFrame(ringFrame); ringFrame=0; ringAngle=ringTarget; drawRing(); }
    else if (!ringFrame) ringFrame=requestAnimationFrame(ringTick);
  }
  function moduleAccess() {
    features.forEach((feature,i) => {
      const hidden=body.classList.contains('presentation') && !printing && selectedModule!==i;
      feature.toggleAttribute('inert',hidden);
      if (hidden) feature.setAttribute('aria-hidden','true'); else feature.removeAttribute('aria-hidden');
    });
  }
  function selectModule(value,focus=false) {
    selectedModule=(value+4)%4;
    ringTarget+=((( -selectedModule*90-ringTarget+180)%360+360)%360)-180;
    ringCards.forEach((card,i) => { card.classList.toggle('is-selected',selectedModule===i); card.setAttribute('aria-pressed',String(selectedModule===i)); });
    moduleTabs.forEach((tab,i) => { tab.setAttribute('aria-selected',String(selectedModule===i)); tab.tabIndex=selectedModule===i?0:-1; features[i].classList.toggle('is-current',selectedModule===i); });
    moduleStatus.textContent=`0${selectedModule+1} / 04`;
    moduleAccess(); runRing(); if (focus) moduleTabs[selectedModule].focus();
  }
  const clearRingDrag=drag(ring,dx => {
    if (!ringDragging) { ringDragBase=ringAngle; ringDragging=true; }
    ringTarget=ringDragBase+dx*.32; runRing();
  },()=>{ringDragging=false; selectModule(((Math.round(-ringTarget/90)%4)+4)%4);});
  function moduleKey(e) {
    let index;
    if(e.key==='ArrowLeft') index=selectedModule-1;
    if(e.key==='ArrowRight') index=selectedModule+1;
    if(e.key==='Home') index=0;
    if(e.key==='End') index=3;
    if(index!==undefined) {e.preventDefault();e.stopPropagation();selectModule(index,e.currentTarget===switcher);}
  }
  ring.addEventListener('keydown',moduleKey); switcher.addEventListener('keydown',moduleKey);
  selectModule(0);
  register({scene:platform,container:ring,access:moduleAccess,setActive(active) {
    ringActive=active; ring.dataset.rendering=String(active);
    if (!active) {cancelAnimationFrame(ringFrame);ringFrame=0;clearRingDrag();ringDragging=false;ringTarget=-selectedModule*90;ringAngle=ringTarget;drawRing();}
  }});

  // 03 / Historical catalogue. Facsimiles are real; the binding is a labelled model.
  const research=$('#research'), researchCopy=$('.research-layout',research).firstElementChild;
  const researchTabs=$$('.research-tabs [role="tab"]',research);
  const archiveFigure=$('.archive-figure',research);
  const researchSummary=researchCopy.firstElementChild;
  const sourceLink=$('.source-link',researchCopy);
  const archiveOriginals=node('div','archive-originals'); archiveOriginals.append(researchSummary,archiveFigure,sourceLink);
  const archiveDossier=dossier('研究背景与原始图版',archiveOriginals);
  const catalogue=node('div','catalogue-exhibit v3-only',`
    <p class="v3-kicker">HISTORICAL AUCTION CATALOGUE · 交互装帧示意</p>
    <div class="catalogue-viewport" tabindex="0" role="group" aria-label="可拖动旋转、点击开合的三维图录，左右键旋转，回车开合">
      <div class="catalogue-fallback"><img class="fallback-cover" src="assets/archive/christies-cover.jpg" alt="论文第 39 页所载佳士得图录封面"><img class="fallback-page" src="assets/archive/christies-price-list.jpg" alt="论文第 39 页所载历史价目表" hidden></div>
      <canvas class="catalogue-canvas" aria-hidden="true"></canvas>
      <span class="catalogue-mode">原始资料 · 可用按钮探索</span>
    </div>
    <div class="catalogue-hotspots" role="group" aria-label="图录研究热点"></div>
    <p class="catalogue-source" aria-live="polite">封面与价目表 · 论文第 39 页</p>
    <p class="catalogue-disclosure">三维装帧为示意。封面与价目表来自论文原图；费用与结论展示为论文节选，并非历史图录内页复原。</p>
  `);
  const bookViewport=$('.catalogue-viewport',catalogue), canvas=$('.catalogue-canvas',catalogue);
  const pageSources=['assets/archive/christies-price-list.jpg','assets/archive/research-rules-p41.jpg','assets/archive/research-conclusion-p43.jpg'];
  const pageLabels=['封面与价目表 · 论文第 39 页','费用与规则 · 论文第 41 页节选','市场与启示 · 论文第 43 页'];
  const hotspots=researchTabs.map((tab,i)=>{
    const el=button(`0${i+1} <span>${tab.textContent}</span>`, `探索${tab.textContent}`,()=>{tab.click();setBookOpen(true);},'catalogue-hotspot');
    el.dataset.researchHotspot=String(i);el.setAttribute('aria-controls',tab.getAttribute('aria-controls'));
    $('.catalogue-hotspots',catalogue).append(el);return el;
  });
  let bookOpen=false,bookPage=0,bookActive=false,bookFrame=0,bookLoading=false,bookFailed=false;
  let bookRenderer,bookScene,bookCamera,bookRig,bookHinge,bookPageMesh,THREE,bookTextures=[],bookTextureResources=[];
  let bookX=-.10,bookY=-.22,bookTX=-.10,bookTY=-.22,bookOpening=0,bookDragBaseX,bookDragBaseY,bookDragging=false;
  let bookRenderCount=0;
  const openButton=button('翻开图录','翻开或合上图录',()=>setBookOpen(!bookOpen),'catalogue-open');
  const resetBook=button('复位','复位图录方向',()=>{bookTX=-.10;bookTY=-.22;setBookOpen(false);requestBook();});
  catalogue.insertBefore(controlBar(openButton,button('↶','向左旋转图录',()=>{bookTY=clamp(bookTY-.22,-.9,.9);requestBook();},'catalogue-turn'),button('↷','向右旋转图录',()=>{bookTY=clamp(bookTY+.22,-.9,.9);requestBook();},'catalogue-turn')), $('.catalogue-hotspots',catalogue));
  $('.v3-controls',catalogue).append(resetBook);
  researchCopy.prepend(catalogue);researchCopy.append(archiveDossier);
  const researchReading=node('div','research-reading');
  researchReading.append($('.research-tabs',research),...$$('.research-panel',research),$('.chart-panel',research));
  $('.research-layout',research).append(researchReading);research.classList.add('v3-ready');
  function setBookOpen(value) {
    bookOpen=value;catalogue.classList.toggle('is-open',value);openButton.textContent=value?'合上图录':'翻开图录';
    openButton.setAttribute('aria-expanded',String(value));
    $('.fallback-page',catalogue).hidden=!value;requestBook();
  }
  function researchSelection() {
    bookPage=Math.max(0,researchTabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true'));
    hotspots.forEach((el,i)=>el.setAttribute('aria-pressed',String(i===bookPage)));
    $('.catalogue-source',catalogue).textContent=pageLabels[bookPage];
    const fallback=$('.fallback-page',catalogue);fallback.src=pageSources[bookPage];fallback.alt=pageLabels[bookPage];
    if(bookPageMesh&&bookTextures.length){bookPageMesh.material.map=bookTextures[bookPage];bookPageMesh.material.needsUpdate=true;}
    requestBook();
  }
  const researchObserver=new MutationObserver(()=>{researchSelection();setBookOpen(true);});
  researchTabs.forEach(tab=>researchObserver.observe(tab,{attributes:true,attributeFilter:['aria-selected']}));
  function bookCanRender() {return bookActive&&desktop.matches&&!simple()&&!document.hidden&&!!bookRenderer&&!!bookHinge;}
  function drawBook() {
    if(!bookCanRender())return;
    bookRig.rotation.set(bookX,bookY,.025);
    bookRig.position.x=bookOpening*.48;
    bookHinge.rotation.y=-bookOpening*2.6;
    bookRenderer.render(bookScene,bookCamera);
    bookViewport.dataset.frameCount=String(++bookRenderCount);
    bookViewport.dataset.rotation=bookY.toFixed(3);
    bookViewport.dataset.opening=bookOpening.toFixed(3);
  }
  function bookTick() {
    bookFrame=0;if(!bookCanRender())return;
    const target=bookOpen?1:0;
    bookX+=(bookTX-bookX)*.13;bookY+=(bookTY-bookY)*.13;bookOpening+=(target-bookOpening)*.10;
    const pending=Math.abs(bookTX-bookX)+Math.abs(bookTY-bookY)+Math.abs(target-bookOpening)>.001;
    if(!pending){bookX=bookTX;bookY=bookTY;bookOpening=target;}
    drawBook();
    if(pending)bookFrame=requestAnimationFrame(bookTick);
  }
  function requestBook() {if(bookCanRender()&&!bookFrame)bookFrame=requestAnimationFrame(bookTick);}
  function sizeBook() {
    if(!bookRenderer||!bookViewport.clientWidth||!bookViewport.clientHeight)return;
    bookRenderer.setSize(bookViewport.clientWidth,bookViewport.clientHeight,false);
    bookCamera.aspect=bookViewport.clientWidth/bookViewport.clientHeight;bookCamera.updateProjectionMatrix();requestBook();
  }
  function fallbackBook() {
    bookFailed=true;bookViewport.classList.remove('webgl-ready');bookViewport.dataset.modelStatus='fallback';bookViewport.dataset.rendering='false';
    catalogue.classList.add('fallback-view');
    $('.catalogue-mode',catalogue).textContent='原始资料 · 三维显示不可用，可继续用按钮探索';
    cancelAnimationFrame(bookFrame);bookFrame=0;
    if(bookRenderer){
      bookScene.traverse(object=>{object.geometry?.dispose();if(object.material){const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});
      bookTextureResources.forEach(texture=>texture.dispose());bookRenderer.dispose();bookRenderer=null;
    }
  }
  async function ensureBook() {
    if(bookRenderer||bookLoading||bookFailed||!desktop.matches||simple())return;
    bookLoading=true;bookViewport.dataset.modelStatus='loading';
    try {
      THREE=await import('./assets/vendor/three.module.js');
      if(!bookActive||!desktop.matches||simple()){bookViewport.dataset.modelStatus='idle';return;}
      const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
      bookRenderer=renderer;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xeeefeb,1);
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      bookScene=new THREE.Scene();bookCamera=new THREE.PerspectiveCamera(40,1,.1,50);bookCamera.position.set(0,.15,6.5);
      bookScene.add(new THREE.HemisphereLight(0xf7f7f3,0x667f88,2.2));
      const light=new THREE.DirectionalLight(0xffffff,2.4);light.position.set(-3,6,7);light.castShadow=true;light.shadow.mapSize.set(1024,1024);bookScene.add(light);
      const ground=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.77;ground.receiveShadow=true;bookScene.add(ground);
      bookRig=new THREE.Group();bookScene.add(bookRig);
      const loader=new THREE.TextureLoader();
      const loadedTextures=await Promise.all(['assets/archive/christies-cover.jpg',...pageSources].map(src=>loader.loadAsync(src)));
      bookTextureResources=[...loadedTextures];
      loadedTextures.forEach(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());});
      const coverTexture=loadedTextures.shift();bookTextures=loadedTextures;
      const paper=new THREE.MeshStandardMaterial({color:0xf7f7f3,roughness:.96});
      const edge=new THREE.MeshStandardMaterial({color:0xe7e2d9,roughness:1});
      const back=new THREE.Mesh(new THREE.BoxGeometry(2.3,3.15,.055),new THREE.MeshStandardMaterial({color:0xb5aa98,roughness:1}));back.position.z=-.13;back.castShadow=true;bookRig.add(back);
      const pages=new THREE.Mesh(new THREE.BoxGeometry(2.23,3.08,.18),[edge,edge,edge,edge,paper,paper]);pages.castShadow=true;bookRig.add(pages);
      // These are photographic facsimiles, not generated historical pages.
      bookPageMesh=new THREE.Mesh(new THREE.PlaneGeometry(2.17,3.02),new THREE.MeshBasicMaterial({map:bookTextures[bookPage]}));bookPageMesh.position.z=.101;bookRig.add(bookPageMesh);
      bookHinge=new THREE.Group();bookHinge.position.set(-1.15,0,.14);bookRig.add(bookHinge);
      const coverMaterial=new THREE.MeshStandardMaterial({map:coverTexture,roughness:.9});
      const insideCover=new THREE.MeshBasicMaterial({color:0xe7e2d9});
      const front=new THREE.Mesh(new THREE.BoxGeometry(2.3,3.15,.055),[edge,edge,edge,edge,coverMaterial,insideCover]);front.position.x=1.15;front.castShadow=true;bookHinge.add(front);
      front.add(new THREE.LineSegments(new THREE.EdgesGeometry(front.geometry),new THREE.LineBasicMaterial({color:0xb5aa98,transparent:true,opacity:.7})));
      const spine=new THREE.Mesh(new THREE.BoxGeometry(.07,3.15,.28),new THREE.MeshStandardMaterial({color:0xb5aa98,roughness:1}));spine.position.x=-1.15;bookRig.add(spine);
      for(let i=0;i<12;i++){
        const line=new THREE.Mesh(new THREE.BoxGeometry(2.2,.006,.003),new THREE.MeshBasicMaterial({color:0xccd1cc}));line.position.set(0,-1.54,-.075+i*.014);line.rotation.x=Math.PI/2;bookRig.add(line);
      }
      bookViewport.classList.add('webgl-ready');bookViewport.dataset.modelStatus='ready';
      $('.catalogue-mode',catalogue).textContent='拖动旋转 · 点击图录开合';sizeBook();sync();requestBook();
    } catch (_) {fallbackBook();}
    finally {bookLoading=false;}
  }
  const clearBookDrag=drag(bookViewport,(dx,dy)=>{
    if(!desktop.matches||!bookActive)return;
    if(!bookDragging){bookDragBaseX=bookX;bookDragBaseY=bookY;bookDragging=true;}
    bookTX=clamp(bookDragBaseX+dy*.005,-.55,.5);bookTY=clamp(bookDragBaseY+dx*.008,-.9,.9);requestBook();
  },()=>{bookDragging=false;});
  canvas.addEventListener('click',e=>{
    if(!bookCanRender())return;
    const rect=canvas.getBoundingClientRect();
    const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),bookCamera);
    if(ray.intersectObject(bookRig,true).length)setBookOpen(!bookOpen);
  });
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallbackBook();});
  bookViewport.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Enter',' '].includes(e.key))return;
    e.preventDefault();e.stopPropagation();
    if(e.key==='Enter'||e.key===' ')setBookOpen(!bookOpen);
    else if(simple()||!desktop.matches||bookFailed){researchTabs[(bookPage+(e.key==='ArrowLeft'?2:1))%3].click();setBookOpen(true);}
    else{bookTY=clamp(bookTY+(e.key==='ArrowLeft'?-.22:.22),-.9,.9);requestBook();}
  });
  researchSelection();setBookOpen(false);
  register({scene:research,container:bookViewport,setActive(active){
    bookActive=active;bookViewport.dataset.rendering=String(active&&desktop.matches&&!!bookHinge&&!!bookRenderer&&!simple());
    if(active&&desktop.matches&&!simple()){ensureBook();requestBook();}
    else{cancelAnimationFrame(bookFrame);bookFrame=0;clearBookDrag();bookDragging=false;}
    bookViewport.classList.toggle('show-fallback',simple()||!desktop.matches);
    const fallback=simple()||!desktop.matches||bookFailed;
    catalogue.classList.toggle('fallback-view',fallback);
    bookViewport.setAttribute('aria-label',fallback?'原始资料浏览器，左右键切换研究资料，回车开合':'可拖动旋转、点击开合的三维图录，左右键旋转，回车开合');
  }});
  new ResizeObserver(sizeBook).observe(bookViewport);

  // 04 / Spatial roadmap. Nodes focus the original stage prose, never rewrite it.
  const model=$('#platform-model'), roadmap=$('.roadmap-grid',model), roadmapCards=$$('.roadmap-card',model);
  const routeExplorer=node('div','route-explorer');
  const routeStage=node('div','route-stage v3-only',`<p class="v3-kicker">项目发展路径 · 选择阶段</p><div class="route-perspective"><div class="route-plane"><svg class="route-lines" viewBox="0 0 1000 450" aria-hidden="true"><path d="M150 310 L500 220 L850 130"/><circle cx="150" cy="310" r="62"/><circle cx="500" cy="220" r="62"/><circle cx="850" cy="130" r="62"/></svg></div></div>`);
  routeStage.dataset.cvInteractive='';
  const routePlane=$('.route-plane',routeStage);routePlane.setAttribute('role','tablist');routePlane.setAttribute('aria-label','项目发展阶段');
  const routeNodes=roadmapCards.map((card,i)=>{
    const label=$('.feature-number',card).textContent.split('/')[1].trim();
    const el=button(`<span>0${i+1}</span><strong>${label}</strong>`,label,()=>selectStage(i),'route-node');
    el.id=`route-tab-${i}`;el.setAttribute('role','tab');el.setAttribute('aria-controls',`route-panel-${i}`);
    card.id=`route-panel-${i}`;card.setAttribute('role','tabpanel');card.setAttribute('aria-labelledby',el.id);card.tabIndex=0;routePlane.append(el);return el;
  });
  const routeStatus=node('span','module-status');routeStatus.setAttribute('aria-live','polite');
  const routeControls=controlBar(button('←','上一个发展阶段',()=>selectStage(routeSelection-1)),button('→','下一个发展阶段',()=>selectStage(routeSelection+1)));routeControls.prepend(routeStatus);routeStage.append(routeControls);
  roadmap.before(routeExplorer);routeExplorer.append(routeStage,roadmap);
  const business=$('.model-grid',model);
  [...business.children].forEach(article=>business.append(dossier(`${$('.eyebrow',article).textContent} · ${$('h3',article).textContent}`,article)));
  let routeSelection=0;
  function routeAccess(){roadmapCards.forEach((card,i)=>{const hidden=body.classList.contains('presentation')&&!printing&&i!==routeSelection;card.toggleAttribute('inert',hidden);if(hidden)card.setAttribute('aria-hidden','true');else card.removeAttribute('aria-hidden');});}
  function selectStage(value,focus=false){
    routeSelection=(value+3)%3;
    routeNodes.forEach((el,i)=>{el.setAttribute('aria-selected',String(i===routeSelection));el.tabIndex=i===routeSelection?0:-1;roadmapCards[i].classList.toggle('is-current',i===routeSelection);});
    routeStage.dataset.selected=String(routeSelection);routeStatus.textContent=`0${routeSelection+1} / 03`;routeAccess();if(focus)routeNodes[routeSelection].focus();
  }
  routeStage.addEventListener('keydown',e=>{
    let value;if(e.key==='ArrowLeft')value=routeSelection-1;if(e.key==='ArrowRight')value=routeSelection+1;if(e.key==='Home')value=0;if(e.key==='End')value=2;
    if(value!==undefined){e.preventDefault();e.stopPropagation();selectStage(value,true);}
  });
  model.classList.add('v3-ready');selectStage(0);
  register({scene:model,container:routeStage,access:routeAccess,setActive(active){routeStage.dataset.rendering='false';routeStage.classList.toggle('is-engaged',active);}});

  // Lifecycle hooks are shared with the original CV instead of polling the page.
  const viewportObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{const c=controllers.find(c=>c.container===entry.target);if(c)c.visible=entry.isIntersecting;});sync();
  },{threshold:.08});
  controllers.forEach(c=>viewportObserver.observe(c.container));
  function modeChanged() {
    clearTimeout(settleTimer);
    $$('.v3-dossier').forEach(el=>{
      if (body.classList.contains('reading') || printing) {if(el.dataset.wasOpen===undefined)el.dataset.wasOpen=String(el.open);el.open=true;}
      else if(el.dataset.wasOpen!==undefined) {el.open=el.dataset.wasOpen==='true';delete el.dataset.wasOpen;}
    });
    sync();
  }
  document.addEventListener('cv:chapter',e=>{sync();clearTimeout(settleTimer);settleTimer=setTimeout(sync,(e.detail.duration||0)+30);});
  document.addEventListener('cv:mode',modeChanged);
  document.addEventListener('cv:motion',sync);
  document.addEventListener('visibilitychange',sync);
  addEventListener('beforeprint',()=>{printing=true;modeChanged();});
  addEventListener('afterprint',()=>{printing=false;modeChanged();});
  addEventListener('resize',()=>{drawRing();sync();});
  desktop.addEventListener('change',sync);
  window.cvExhibits={sync,getState:()=>controllers.map(c=>({id:c.scene.id,active:c.container.dataset.rendering==='true'}))};
  document.dispatchEvent(new CustomEvent('cv:exhibit-ready'));
  sync();
})();
