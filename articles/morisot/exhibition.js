/* Artwork records from 画作.docx and Berthe_Morisot_auction_records.docx. */
(() => {
  'use strict';
  const works = [
    {image:'image1.jpeg',title:'费康港口',name:'Fécamp Harbor',year:1874,medium:'布面油画',size:'47 × 55.2 cm',category:'landscape',records:['1968—1969 · 成交价 124,000 美元']},
    {image:'image3.png',title:'朱莉·马奈和长尾小鹦鹉',name:'Julie Manet à la perruche',year:1890,medium:'布面油画',size:'83.8 × 55.2 cm',category:'portrait',records:['1990.05.17 · 苏富比纽约 · 成交价 1,045,000 美元','2023.11.14 · 苏富比纽约 · 流拍；估价 2,000,000—3,000,000 美元']},
    {image:'image4.jpeg',title:'午餐后',name:'Après le déjeuner',year:1881,medium:'布面油画',size:'81 × 100 cm',category:'portrait',records:['1997.05.14 · 佳士得纽约 · 成交价 3,250,000 美元','2013.02.06 · 佳士得伦敦 · 成交价 10,940,299 美元'],note:'文档题名为《午饭后》，此处与正文统一为《午餐后》。'},
    {image:'cache-cache.jpg',title:'捉迷藏',name:'Cache-cache',year:1873,medium:'布面油画',size:'46.3 × 55.2 cm',category:'landscape',records:['1999.05.10 · 苏富比纽约 · 成交价 3,500,000 美元','2000.11.10 · 苏富比纽约 · 成交价 4,405,750 美元','2005.11.03 · 苏富比纽约 · 成交价 5,168,000 美元']},
    {image:'image6.jpeg',title:'女孩和猫',name:'La jeune fille au chat',year:1892,medium:'布面油画',size:'55.5 × 46.6 cm',category:'portrait',records:['2007.02.06 · 佳士得伦敦 · 成交价 1,981,837 美元']},
    {image:'image7.png',title:'诺曼底的奶牛',name:'Vaches en Normandie',year:1864,medium:'纸上粉彩',size:'23.5 × 34.8 cm',category:'landscape',records:[]},
    {image:'image8.jpeg',title:'莫尔库尔花园',name:'Jardin à Maurecourt',year:1884,medium:'布面油画',size:'54 × 65.1 cm',category:'landscape',records:[]},
    {image:'image9.jpeg',title:'朱莉的梦',name:'Julie rêveuse',year:1894,medium:'布面油画',size:'65 × 54 cm',category:'portrait',records:[]},
    {image:'supplement-image1.jpeg',title:'摇篮',name:'The Cradle',year:1872,medium:'布面油画',size:'56 × 46.5 cm',category:'portrait',records:[]},
    {image:'supplement-image2.jpeg',title:'捕蝶',name:'The Butterfly Hunt',year:1874,medium:'布面油画',size:'46 × 56 cm',category:'landscape',records:[]},
    {image:'supplement-image3.jpeg',title:'画家的妹妹坐在窗边',name:"The Artist's Sister at a Window",year:1869,medium:'布面油画',size:'54.8 × 46.3 cm',category:'portrait',records:[]},
    {image:'supplement-image4.jpeg',title:'在阳台上',name:'Dans la véranda',year:1884,medium:'布面油画',size:'81.2 × 100.2 cm',category:'portrait',records:['2015.05.14 · 佳士得纽约 · 成交价 2,517,000 美元']},
    {image:'supplement-image5.jpeg',title:'提篮子的女孩',name:'Fillette portant un panier',year:1888,medium:'布面油画',size:'70 × 51 cm',category:'portrait',records:['2021.11.11 · 佳士得纽约 · 成交价 5,310,000 美元']},
    {image:'supplement-image6.jpeg',title:'室内',name:'Intérieur',year:1872,medium:'布面油画',size:'60 × 73 cm',category:'portrait',records:['2006.06.20 · 佳士得伦敦（国王街） · 成交价 1,352,000 英镑']},
    {image:'supplement-image7.jpeg',title:'拿着扇子的女人',name:'Femme à l’éventail',year:1876,medium:'布面油画',size:'62 × 52 cm',category:'portrait',records:['2013.05.07 · 苏富比纽约 · 成交价 4,365,000 美元']},
    {image:'supplement-image8.jpeg',title:'阳台上的女人和孩子',name:'Femme et enfant au balcon',year:1872,medium:'布面油画',size:'60 × 50 cm',category:'portrait',records:['2017.02.28 · 佳士得伦敦 · 成交价 4,085,000 英镑']},
    {image:'supplement-image9.jpeg',title:'黑衣女子（剧院之前）',name:'Femme en noir / Avant le théâtre',year:1875,medium:'布面油画',size:'57.3 × 30.7 cm',category:'portrait',records:['2017.02.28 · 佳士得伦敦 · 成交价 2,045,000 英镑']},
    {image:'supplement-image10.jpeg',title:'坐在梳妆台前的女人',name:'Woman at Her Toilette',year:'1875—1880',medium:'布面油画',size:'60.3 × 80.4 cm',category:'portrait',records:[]},
    {image:'supplement-image11.jpeg',title:'怀特岛上的尤金·马奈',name:'Eugène Manet on the Isle of Wight',year:1875,medium:'布面油画',size:'38 × 46 cm',category:'portrait',records:[]},
    {image:'supplement-image12.jpeg',title:'自画像',name:'Self-Portrait',year:1885,medium:'布面油画',size:'50 × 61 cm',category:'portrait',records:[]},
    {image:'supplement-image13.jpeg',title:'在舞会上',name:'At the Ball',year:1875,medium:'布面油画',size:'52 × 65 cm',category:'portrait',records:[]},
    {image:'supplement-image14.jpeg',title:'朱莉·马奈和她的格力犬莱尔提斯',name:'Julie Manet with her Greyhound Laerte',year:1893,medium:'布面油画',size:'73 × 80 cm',category:'portrait',records:[]},
    {image:'supplement-image15.jpeg',title:'玫瑰园里的孩子',name:'Child in the Rose Garden',year:1881,medium:'布面油画',size:'50 × 42 cm',category:'landscape',records:[]},
    {image:'supplement-image16.jpeg',title:'洛里昂海港',name:'The Harbor at Lorient',year:1869,medium:'布面油画',size:'43 × 72 cm',category:'landscape',records:[]},
    {image:'supplement-image17.jpeg',title:'阅读',name:'Reading',year:1873,medium:'布面油画',size:'46 × 71.8 cm',category:'portrait',records:[],collection:'克利夫兰艺术博物馆藏'},
    {image:'supplement-image18.jpeg',title:'夏日',name:'Summer Day',year:1879,medium:'布面油画',size:'45.7 × 75.2 cm',category:'landscape',records:[]},
    {image:'supplement-image19.jpeg',title:'沐浴（整理头发的女孩）',name:'The Bath (Girl Arranging Her Hair)',year:'1885—1886',medium:'布面油画',size:'66 × 81.5 cm',category:'portrait',records:[]},
    {image:'supplement-image20.jpeg',title:'在餐厅里',name:'In the Dining Room',year:1886,medium:'布面油画',size:'61.3 × 50 cm',category:'portrait',records:[]},
    {image:'supplement-image21.jpeg',title:'冬日（戴手笼的女人）',name:'Winter / Woman with a Muff',year:1880,medium:'布面油画',size:'73.5 × 58.5 cm',category:'portrait',records:[]},
    {image:'supplement-image22.jpeg',title:'身穿舞会礼服的年轻女孩',name:'Young Girl in a Ball Gown',year:1879,medium:'布面油画',size:'54 × 71 cm',category:'portrait',records:[]}
  ];
  const grid = document.querySelector('#exhibition-grid');
  const caption = (w) => `<p class="work-artist">Berthe Morisot · ${w.year}</p><h3>${w.title}</h3><p class="work-name">${w.name}</p><p class="work-material">${w.medium} · ${w.size}</p>${w.collection?`<p class="work-material">${w.collection}</p>`:''}${w.records.length ? `<details class="work-record"><summary>拍卖记录 <span>＋</span></summary>${w.records.map(r=>`<p>${r}</p>`).join('')}</details>`:''}${w.note?`<p class="work-note">${w.note}</p>`:''}`;
  document.querySelector('#exhibition-count').textContent=`${works.length} 件作品`;
  grid.innerHTML = works.map((w,i)=>`<figure class="work-card" data-category="${w.category}"><button class="work-image" data-work="${i}" aria-label="放大欣赏《${w.title}》"><img src="assets/exhibition/${w.image}" alt="贝尔特·莫里索《${w.title}》，${w.year} 年" loading="lazy" decoding="async"><span class="work-index">${String(i+1).padStart(2,'0')}</span><span class="work-open">欣赏画作 ↗</span></button><figcaption>${caption(w)}</figcaption></figure>`).join('');
  const dialog=document.querySelector('#exhibition-dialog');
  let selected=0,opener=null,visible=works.map((_,i)=>i),zoomed=false;
  function show(index, direction = 0) {
    selected=index; zoomed=false; dialog.classList.remove('is-zoomed');
    document.querySelector('#exhibition-zoom').setAttribute('aria-pressed','false');
    const w=works[index],img=document.querySelector('#exhibition-image');
    img.src='assets/exhibition/'+w.image; img.alt=`贝尔特·莫里索《${w.title}》，${w.year} 年`;
    document.querySelector('#exhibition-caption').innerHTML=caption(w);
    document.querySelector('#exhibition-position').textContent=`${String(visible.indexOf(index)+1).padStart(2,'0')} / ${String(visible.length).padStart(2,'0')}`;
    if(dialog.open)window.SiteMotion?.swap(img,document.querySelector('#exhibition-caption'),direction);
    // Warm only adjacent works while the viewer is in use, not the entire exhibition.
    for(const delta of [-1,1]){
      const next=visible[(visible.indexOf(index)+delta+visible.length)%visible.length];
      const preload=new Image();preload.src='assets/exhibition/'+works[next].image;
    }
  }
  grid.addEventListener('click',e=>{
    const b=e.target.closest('[data-work]');if(!b)return;
    opener=b;show(Number(b.dataset.work));dialog.showModal();document.documentElement.style.overflow='hidden';
  });
  document.querySelector('#exhibition-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){if(window.SiteMotion)SiteMotion.closeDialog(dialog);else dialog.close()}});
  dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';opener?.focus({preventScroll:true})});
  function step(delta){show(visible[(visible.indexOf(selected)+delta+visible.length)%visible.length],delta)}
  document.querySelector('#exhibition-prev').onclick=()=>step(-1);
  document.querySelector('#exhibition-next').onclick=()=>step(1);
  document.querySelector('#exhibition-zoom').onclick=()=>{
    zoomed=!zoomed;dialog.classList.toggle('is-zoomed',zoomed);
    document.querySelector('#exhibition-zoom').setAttribute('aria-pressed',String(zoomed));
  };
  dialog.addEventListener('keydown',e=>{if(e.target.closest('summary'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1)}});
  let touch=null;
  dialog.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
  dialog.addEventListener('touchend',e=>{if(!zoomed&&touch!==null){const d=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(d)>65&&Math.abs(d)>Math.abs(dy)*1.4)step(d<0?1:-1)}touch=null},{passive:true});
  dialog.addEventListener('touchcancel',()=>{touch=null},{passive:true});
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{
    if(button.getAttribute('aria-pressed')==='true')return;
    const filter=button.dataset.filter;
    const cards=[...grid.children],before=window.SiteMotion?.snapshot(cards);
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    visible=[];
    [...grid.children].forEach((card,i)=>{card.hidden=filter!=='all'&&card.dataset.category!==filter;if(!card.hidden)visible.push(i)});
    document.querySelector('#exhibition-count').textContent=`${String(visible.length).padStart(2,'0')} 件作品`;
    if(before)window.SiteMotion.reflow(cards,before);
    window.ScrollTrigger?.refresh();
  });
})();
