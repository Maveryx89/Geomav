/* Visor de tours 360° - GEOMAV (usa Marzipano, Apache-2.0). Lee APP_DATA. */
(function(){
'use strict';
var G=window.GEOMAV,d=APP_DATA,T=d.settings||{};
function $(id){return document.getElementById(id)}
var viewer=new Marzipano.Viewer($('pano'),{controls:{mouseViewMode:T.mouseMode==='qtvr'?'qtvr':'drag'}});
function stop(el){['touchstart','touchmove','touchend','touchcancel','wheel','mousewheel','pointerdown'].forEach(function(e){el.addEventListener(e,function(v){v.stopPropagation()})})}

/* ---------- marca (colores y logo) ---------- */
var B=d.brand||{},bv=G.applyBrand(B);
Object.keys(bv).forEach(function(k){document.documentElement.style.setProperty(k,bv[k])});
var bar0=$('bar'),ttl0=$('ttl');
if(B.logo&&B.logo.file){
  var lg=document.createElement(G.https(B.logo.link)?'a':'div');lg.id='logo';
  if(G.https(B.logo.link)){lg.href=G.https(B.logo.link);lg.target='_blank';lg.rel='noopener'}
  var li=document.createElement('img');li.src=B.logo.file;li.alt='Logo';lg.appendChild(li);bar0.insertBefore(lg,ttl0);
}

/* ---------- idioma de los botones ---------- */
var LANG=(T.lang==='en'||(T.lang==='auto'&&/^en/i.test(navigator.language||'')))?'en':'es';
var I18={
  es:{scenes:'Escenas',gyro:'Giroscopio',auto:'Autorrotación',full:'Pantalla completa',info:'Info',infoT:'Información del tour',plan:'Plano',sound:'Sonido',tour:'Recorrido automático',pw:'Protegido con contraseña',pwIn:'Contraseña',enter:'Entrar',pwBad:'Contraseña incorrecta',close:'Cerrar',all:'Todas',
    base:'Base',groups:'Grupos',question:'Pregunta',points:'Puntos',correct:'¡Correcto!',wrong:'Incorrecto. La respuesta correcta está marcada.',next:'Seguir',score:'Puntaje',done:'Evaluación terminada',of:'de',right:'correctas',csv:'Descargar reporte (.csv)',again:'Repetir',review:'Ver resultado',qcsv:'Pregunta,Respuesta,Correcta,Puntos'},
  en:{scenes:'Scenes',gyro:'Gyroscope',auto:'Auto-rotate',full:'Fullscreen',info:'Info',infoT:'Tour information',plan:'Floor plan',sound:'Sound',tour:'Auto tour',pw:'This tour is password protected',pwIn:'Password',enter:'Enter',pwBad:'Wrong password',close:'Close',all:'All',
    base:'Base',groups:'Groups',question:'Question',points:'Points',correct:'Correct!',wrong:'Incorrect. The right answer is highlighted.',next:'Continue',score:'Score',done:'Quiz finished',of:'of',right:'correct',csv:'Download report (.csv)',again:'Try again',review:'See result',qcsv:'Question,Answer,Correct,Points'}
};
function tr(k){return (I18[LANG]&&I18[LANG][k])||I18.es[k]||k}
function nmD(x){return (LANG==='en'&&x.nameEn)?x.nameEn:x.name}
function subD(x){return (LANG==='en'&&x.subEn)?x.subEn:(x.sub||'')}
document.documentElement.lang=LANG;
/* lectura en voz alta (voz del navegador) */
function speak(txt){
  try{if(!T.tts||!window.speechSynthesis)return;window.speechSynthesis.cancel();if(!txt)return;
    var u=new SpeechSynthesisUtterance(txt);u.lang=LANG==='en'?'en-US':'es-CL';window.speechSynthesis.speak(u)}catch(e){}
}
[['bList','scenes'],['bGyro','gyro'],['bAuto','auto'],['bFull','full']].forEach(function(p){var e=$(p[0]);if(e)e.title=tr(p[1])});

/* ---------- analíticas (Google Analytics 4), solo en el tour publicado ---------- */
var GA=null;
(function(){
  var id=T.gaId;if(!/^G-[A-Z0-9]{4,14}$/.test(id||'')||!/^https?:$/.test(location.protocol))return;
  window.dataLayer=window.dataLayer||[];GA=function(){window.dataLayer.push(arguments)};
  GA('js',new Date());GA('config',id,{anonymize_ip:true});
  var sc=document.createElement('script');sc.async=true;sc.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.appendChild(sc);
})();

/* ---------- escenas y hotspots ---------- */
var byId={},list=$('list'),cur=null;
var quiz={n:0,pts:0,ans:{}};
var scenes=d.scenes.map(function(s){
  var m=s.multires; // cubo multiresolución (teselas) o imagen equirectangular única
  var lim=Marzipano.RectilinearView.limit.traditional(m?m.levels[m.levels.length-1].size:s.width,100*Math.PI/180);
  var view=new Marzipano.RectilinearView(s.initialViewParameters,lim);
  var sc=viewer.createScene(m?{source:Marzipano.ImageUrlSource.fromString(m.tiles,{cubeMapPreviewUrl:m.preview}),geometry:new Marzipano.CubeGeometry(m.levels),view:view,pinFirstLevel:true}
    :{source:Marzipano.ImageUrlSource.fromString(s.file),geometry:new Marzipano.EquirectGeometry([{width:s.width}]),view:view});
  var o={data:s,scene:sc};byId[s.id]=o;
  view.addEventListener('change',function(){if(cur===o&&window.__radar)window.__radar()});
  var fx=G.adjustEffects(s.adjust);if(fx)sc.layer().setEffects(fx);
  if(s.layer&&s.layer.file){ // capa de comparación (plano, avance anterior...)
    o.op=(s.layer.opacity==null?50:s.layer.opacity)/100;
    o.layerObj=sc.createLayer({source:Marzipano.ImageUrlSource.fromString(s.layer.file),geometry:new Marzipano.EquirectGeometry([{width:s.layer.width||4096}])});
    o.layerObj.setEffects({opacity:o.op});
  }
  if(s.epochs&&s.epochs.length){ // versiones de la toma (fechas, acabados)
    o.eps=s.epochs.map(function(e){var L=sc.createLayer({source:Marzipano.ImageUrlSource.fromString(e.file),geometry:new Marzipano.EquirectGeometry([{width:e.width||4096}])});L.setEffects({opacity:0});return L});
    o.epv=o.eps.map(function(){return 0});o.epi=0;
  }
  function put(el,h,opts){if(h.grp)el.dataset.grp=h.grp;stop(el);sc.hotspotContainer().createHotspot(el,{yaw:h.yaw,pitch:h.pitch},opts)}
  (s.imageHotspots||[]).forEach(function(h){put(G.imageHotspot(h,h.file),h,G.imageOpts)});
  (s.linkHotspots||[]).forEach(function(h){
    var t=byId[h.target]||d.scenes.filter(function(x){return x.id===h.target})[0];
    var el=G.hotspot('link',h,t&&nmD(t.data?t.data:t));
    el.addEventListener('click',function(){via(h,o)});put(el,h);
  });
  (s.infoHotspots||[]).forEach(function(h){
    var el=G.hotspot('info',h.file?Object.assign({},h,{imgSrc:h.file}):h);
    el.addEventListener('click',function(){var op=el.classList.toggle('open');speak(op?(h.title?h.title+'. ':'')+(h.text||''):'')});put(el,h);
  });
  (s.galleryHotspots||[]).forEach(function(h){
    if(!h.files||!h.files.length)return;
    var el=G.hotspot('galeria',h,h.title||'Galería');
    el.addEventListener('click',function(){G.openGallery(h.files,h.title)});put(el,h);
  });
  (s.embedHotspots||[]).forEach(function(h){
    var el=G.hotspot('embed',h,h.title||'Ver contenido');
    el.addEventListener('click',function(){openModal(h)});put(el,h);
  });
  (s.notaHotspots||[]).forEach(function(h){
    var el=G.hotspot('nota',h);
    el.addEventListener('click',function(){var op=el.classList.toggle('open');speak(op?(h.title?h.title+'. ':'')+(h.text||''):'')});put(el,h);
  });
  (s.videoHotspots||[]).forEach(function(h){put(G.videoHotspot(h,h.file),h,G.imageOpts)});
  (s.quizHotspots||[]).forEach(function(h){
    h._k=quiz.n++;quiz.pts+=h.points||10;
    var el=G.hotspot('quiz',h,h.title||tr('question'));
    h._el=el;el.addEventListener('click',function(){openQuiz(h)});put(el,h);
  });
  if(d.cap&&d.cap.file){var ch=G.imageHotspot({size:d.cap.size||30,title:''},d.cap.file);stop(ch);ch.style.pointerEvents='none';sc.hotspotContainer().createHotspot(ch,{yaw:0,pitch:-Math.PI/2+0.001},G.imageOpts)}
  var a=document.createElement('a');a.dataset.tags=(s.tags||[]).join('|');a.textContent=nmD(s);a.onclick=function(){go(s.id);list.classList.remove('open')};list.appendChild(a);o.a=a;
  return o;
});

(function(){
  var all={};d.scenes.forEach(function(s){(s.tags||[]).forEach(function(t){all[t]=1})});
  var ts=Object.keys(all).sort(function(a,b){return a.localeCompare(b,LANG)});if(!ts.length)return;
  var bar=document.createElement('div');bar.id='tags';
  function pick(t){
    Array.prototype.forEach.call(bar.children,function(b){b.className=b.dataset.t===t?'on':''});
    scenes.forEach(function(o){o.a.style.display=(!t||(o.data.tags||[]).indexOf(t)>=0)?'':'none'});
  }
  [''].concat(ts).forEach(function(t){var b=document.createElement('button');b.type='button';b.dataset.t=t;b.textContent=t||tr('all');b.onclick=function(){pick(t)};bar.appendChild(b)});
  list.insertBefore(bar,list.firstChild);pick('');
  if(scenes.length>1)$('bList').style.display='';
})();

function go(id,instant){
  var o=byId[id];if(!o)return;
  o.scene.view().setParameters(o.data.initialViewParameters);
  o.scene.switchTo({transitionDuration:instant?0:(T.transition==='fade'?600:900)});
  var prevCur=cur;cur=o;
  scenes.forEach(function(x){x.a.className=x===o?'on':''});
  $('ttl').textContent=d.name+(d.scenes.length>1?' · '+nmD(o.data):'');
  var ss=$('ssub');if(!ss){ss=document.createElement('div');ss.id='ssub';document.body.appendChild(ss)}ss.textContent=subD(o.data);
  if(GA&&prevCur!==o)GA('event','scene_view',{scene_id:o.data.id,scene_name:o.data.name});
  var cp=$('capa');
  if(o.layerObj){cp.className='show';$('capaT').textContent=o.data.layer.name||'Capa';$('capaR').value=Math.round(o.op*100)}
  else cp.className='';
  speak('');
  var tl=$('tl');if(!tl){tl=document.createElement('div');tl.id='tl';document.body.appendChild(tl);stop(tl)}
  tl.innerHTML='';tl.className=o.eps?'show':'';
  if(o.eps){[(o.data.epochBase||tr('base'))].concat(o.data.epochs.map(function(e){return e.label||''})).forEach(function(lb,i){var b=document.createElement('button');b.type='button';b.textContent=lb||('#'+(i+1));b.className=i===o.epi?'on':'';b.onclick=function(){setEpoch(o,i)};tl.appendChild(b)})}
  if(window.__onGo)window.__onGo(o);
}
function setEpoch(o,i){
  o.epi=i;Array.prototype.forEach.call($('tl').children,function(b,k){b.className=k===i?'on':''});
  var from=o.epv.slice(),to=o.eps.map(function(_,k){return k===i-1?1:0}),t0=performance.now();
  (function f(t){var p=Math.min(1,(t-t0)/450);o.eps.forEach(function(L,k){o.epv[k]=from[k]+(to[k]-from[k])*p;L.setEffects({opacity:o.epv[k]})});if(p<1)requestAnimationFrame(f)})(t0);
}
$('capaR').addEventListener('input',function(e){if(cur&&cur.layerObj){cur.op=e.target.value/100;cur.layerObj.setEffects({opacity:cur.op})}});
stop($('capa'));
/* Transición al usar un enlace: gira y acerca hacia la flecha y luego cambia de escena. */
function via(h,o){
  if(T.transition==='fade'){go(h.target);return}
  var p=o.scene.view().parameters();
  o.scene.lookTo({yaw:h.yaw,pitch:h.pitch,fov:Math.max(0.5,p.fov*0.5)},{transitionDuration:550},function(){go(h.target)});
}

/* ---------- contenido incrustado ---------- */
function openModal(h){
  var r=G.normEmbed(h.url);if(!r.src)return;
  $('mT').textContent=h.title||'Contenido';
  $('mOpen').href=r.src;
  $('mF').src=r.src;
  $('modal').className='open';
}
function closeModal(){$('modal').className='';$('mF').src='about:blank'}
$('mX').onclick=closeModal;
$('modal').addEventListener('click',function(e){if(e.target===$('modal'))closeModal()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});

/* ---------- autorrotación ---------- */
var auto=Marzipano.autorotate({yawSpeed:0.03,targetPitch:0,targetFov:Math.PI/2}),on=!!T.autorotate,bA=$('bAuto');
function setAuto(v){on=v;bA.className=v?'on':'';if(v){viewer.setIdleMovement(3000,auto);viewer.startMovement(auto)}else{viewer.stopMovement();viewer.setIdleMovement(Infinity)}}
bA.onclick=function(){setAuto(!on)};

/* ---------- giroscopio (celular) ---------- */
var bG=$('bGyro'),gm=null,gOn=false;
var canGyro=T.gyro!==false&&!!window.DeviceOrientationEvent&&(('ontouchstart' in window)||navigator.maxTouchPoints>0);
if(!canGyro)bG.style.display='none';
else{
  gm=new DeviceOrientationControlMethod();
  viewer.controls().registerMethod('deviceOrientation',gm,false);
  var gyroOn=function(){
    if(!cur)return;
    gm.getPitch(function(err,pitch){if(!err)cur.scene.view().setPitch(pitch)});
    viewer.controls().enableMethod('deviceOrientation');
    gOn=true;bG.className='on';
    if(on)setAuto(false);
  };
  var gyroOff=function(){viewer.controls().disableMethod('deviceOrientation');gOn=false;bG.className=''};
  bG.onclick=function(){
    if(gOn){gyroOff();return}
    var DOE=window.DeviceOrientationEvent;
    if(typeof DOE.requestPermission==='function'){DOE.requestPermission().then(function(r){if(r==='granted')gyroOn()}).catch(function(){})}
    else gyroOn();
  };
}

/* ---------- doble toque / doble clic: acercar y alejar ---------- */
var last=0,lx=0,ly=0,dx=0,dy=0;
$('pano').addEventListener('pointerdown',function(e){dx=e.clientX;dy=e.clientY});
$('pano').addEventListener('pointerup',function(e){
  if(!cur||e.target.closest('.hs'))return;
  if(Math.hypot(e.clientX-dx,e.clientY-dy)>8)return; // fue un arrastre
  var now=Date.now();
  if(now-last<320&&Math.hypot(e.clientX-lx,e.clientY-ly)<30){
    last=0;
    var p=cur.scene.view().parameters(),base=cur.data.initialViewParameters.fov;
    cur.scene.lookTo({fov:p.fov>base*0.75?Math.max(0.45,base*0.45):base},{transitionDuration:350});
  }else{last=now;lx=e.clientX;ly=e.clientY}
});

/* ---------- Click & Go: clic en el suelo avanza a la escena enlazada en esa dirección ---------- */
(function(){
  if(!T.clickGo)return;var pa=$('pano'),x0=0,y0=0;
  function cand(e){
    if(!cur)return null;var r=pa.getBoundingClientRect(),c=cur.scene.view().screenToCoordinates({x:e.clientX-r.left,y:e.clientY-r.top});
    if(!c||c.pitch==null||c.pitch>-0.12)return null;
    var best=null,bd=0.6;(cur.data.linkHotspots||[]).forEach(function(h){var a=Math.abs(Math.atan2(Math.sin(h.yaw-c.yaw),Math.cos(h.yaw-c.yaw)));if(a<bd){bd=a;best=h}});return best;
  }
  pa.addEventListener('pointerdown',function(e){x0=e.clientX;y0=e.clientY});
  pa.addEventListener('pointerup',function(e){if(e.target.closest('.hs')||Math.hypot(e.clientX-x0,e.clientY-y0)>8)return;var h=cand(e);if(h)via(h,cur)});
  pa.addEventListener('pointermove',function(e){if(e.buttons)return;pa.style.cursor=cand(e)?'pointer':''});
})();

/* ---------- barra y controles ---------- */
/* ---------- ficha de información del tour ---------- */
(function(){
  var I=d.info;if(!I)return;
  var mail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(I.email||'')?I.email:'',tel=/^[+0-9 ()\-]{6,}$/.test(I.phone||'')?I.phone:'';
  var web=G.https(I.web),pdf=G.https(I.pdf),bu=G.https(I.btnUrl),vid=I.video?G.normEmbed(I.video):{};
  if(!(I.title||I.sub||I.desc||mail||tel||web||pdf||bu||vid.src))return;
  var m=document.createElement('div');m.id='info';
  var box=document.createElement('div');box.id='ibox';m.appendChild(box);
  function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e}
  var x=el('button',null,'✕');x.id='iX';x.setAttribute('aria-label',tr('close'));box.appendChild(x);
  if(I.title)box.appendChild(el('h2',null,I.title));
  if(I.sub)box.appendChild(el('div','isub',I.sub));
  if(I.desc)box.appendChild(el('p',null,I.desc));
  var vw=null;if(vid.src){vw=el('div','ivid');box.appendChild(vw)}
  var acts=el('div','iacts');
  function link(txt,href,cls,ext){var a=el('a',cls,txt);a.href=href;if(ext){a.target='_blank';a.rel='noopener'}acts.appendChild(a)}
  if(tel)link('📞 '+tel,'tel:'+tel.replace(/[^+0-9]/g,''));
  if(mail)link('✉ '+mail,'mailto:'+mail);
  if(web)link('🌐 Sitio web',web,null,true);
  if(pdf)link('📄 '+(I.pdfLabel||'PDF'),pdf,null,true);
  if(bu)link(I.btnText||'Más información',bu,'cta',true);
  if(acts.childNodes.length)box.appendChild(acts);
  document.body.appendChild(m);
  var b=el('button',null,'ⓘ '+(I.btnLabel||tr('info')));b.id='bInfo';b.title=tr('infoT');
  bar0.insertBefore(b,$('bList'));
  function open(v){m.className=v?'open':'';if(vw){vw.innerHTML='';if(v){var f=document.createElement('iframe');f.src=vid.src;f.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';f.setAttribute('allowfullscreen','');f.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-presentation');f.title='Video';vw.appendChild(f)}}}
  b.onclick=function(){open(true)};x.onclick=function(){open(false)};m.addEventListener('click',function(e){if(e.target===m)open(false)});
  stop(m);
})();
$('bList').onclick=function(){list.classList.toggle('open')};
$('bFull').onclick=function(){var e=document.documentElement;if(document.fullscreenElement)document.exitFullscreen();else if(e.requestFullscreen)e.requestFullscreen()};
if(scenes.length<2||T.sceneList===false)$('bList').style.display='none';
if(T.fullscreen===false)$('bFull').style.display='none';
if(T.viewControls===false||(T.ctrlMobile==='hide'&&(('ontouchstart' in window)||navigator.maxTouchPoints>0)))$('vc').style.display='none';
else{
  var cm=viewer.controls(),pr=function(id,ax,v){cm.registerMethod(id,new Marzipano.ElementPressControlMethod($(id),ax,v,3),true)};
  pr('vUp','y',-0.7);pr('vDown','y',0.7);pr('vLeft','x',-0.7);pr('vRight','x',0.7);pr('vIn','zoom',-0.7);pr('vOut','zoom',0.7);
}
/* ---------- plano / mapa con radar ---------- */
(function(){
  var P=d.plan;if(!P||!P.file||!(P.pins||[]).length)return;
  var box=document.createElement('div');box.id='plan';
  var pb=document.createElement('div');pb.id='pbox';
  var im=document.createElement('img');im.src=P.file;im.alt='Plano';im.draggable=false;pb.appendChild(im);
  var rd=document.createElement('div');rd.id='radar';pb.appendChild(rd);
  var pins={};
  P.pins.forEach(function(p){
    if(!byId[p.scene])return;
    var b=document.createElement('button');b.className='pin';b.style.left=p.x+'%';b.style.top=p.y+'%';b.title=byId[p.scene].data.name;b.setAttribute('aria-label',byId[p.scene].data.name);
    b.onclick=function(){go(p.scene)};pb.appendChild(b);pins[p.scene]=p;p.el=b;
  });
  box.appendChild(pb);var nm=document.createElement('div');nm.className='pn';pb.appendChild(nm);
  document.body.appendChild(box);stop(box);
  var bp=document.createElement('button');bp.id='bPlan';bp.title=tr('plan');bp.textContent='🗺';
  bar0.insertBefore(bp,$('bGyro'));
  bp.onclick=function(){box.classList.toggle('open');bp.className=box.classList.contains('open')?'on':''};
  if(P.open)bp.onclick();
  var acc=getComputedStyle(document.documentElement).getPropertyValue('--v-acc')||'#D49A6A';
  window.__radar=function(){
    if(!cur)return;var p=pins[cur.data.id];
    P.pins.forEach(function(q){if(q.el)q.el.classList.toggle('on',q===p)});
    if(!p||P.radar===false){rd.style.display='none';nm.textContent=p?'':'';return}
    nm.textContent=cur.data.name;
    var v=cur.scene.view(),deg=((v.yaw()-(p.north||0))*180/Math.PI),fov=v.fov()*180/Math.PI;
    rd.style.display='block';rd.style.left=p.x+'%';rd.style.top=p.y+'%';
    rd.style.background='conic-gradient(from '+(deg-fov/2)+'deg at 50% 50%,'+acc.trim()+' 0deg,'+acc.trim()+' '+fov+'deg,transparent '+fov+'deg)';
  };
  var prev=window.__onGo;window.__onGo=function(o){if(prev)prev(o);window.__radar()};
})();

/* ---------- audio: música de fondo y narración por escena ---------- */
var snd={on:true,music:null,narr:null,gesture:false,mvol:0.5};
(function(){
  var hasN=d.scenes.some(function(s){return s.audio&&s.audio.file});
  if(!(d.music&&d.music.file)&&!hasN)return;
  var bS=document.createElement('button');bS.id='bSnd';bS.title=tr('sound');bS.textContent='🔊';bar0.insertBefore(bS,$('bFull'));
  if(d.music&&d.music.file){snd.music=new Audio(d.music.file);snd.music.loop=d.music.loop!==false;snd.mvol=(d.music.volume==null?40:d.music.volume)/100;snd.music.volume=snd.mvol}
  function duck(){if(snd.music)snd.music.volume=snd.narr&&!snd.narr.ended&&!snd.narr.paused?snd.mvol*0.35:snd.mvol}
  snd.sync=function(){bS.textContent=snd.on?'🔊':'🔇';bS.className=snd.on?'on':''};
  snd.startMusic=function(){if(snd.music&&snd.on)snd.music.play().catch(function(){})};
  snd.narrate=function(o){
    if(snd.narr){snd.narr.pause();snd.narr=null}
    duck();
    if(!snd.on||!o.data.audio||!o.data.audio.file)return null;
    var a=new Audio(o.data.audio.file);snd.narr=a;a.onplay=a.onpause=a.onended=duck;
    var pr=a.play();if(pr&&pr.catch)pr.catch(function(){snd.narr=null;duck()});
    return a;
  };
  bS.onclick=function(){snd.on=!snd.on;snd.sync();
    if(snd.on){snd.startMusic();if(cur)snd.narrate(cur)}
    else{if(snd.music)snd.music.pause();if(snd.narr){snd.narr.pause();snd.narr=null}}};
  snd.sync();
  var first=function(){if(snd.gesture)return;snd.gesture=true;snd.startMusic();if(cur&&!snd.narr)snd.narrate(cur)};
  ['pointerdown','keydown','touchend'].forEach(function(ev){document.addEventListener(ev,first,{once:false,passive:true})});
  var prev=window.__onGo;window.__onGo=function(o){if(prev)prev(o);if(snd.gesture)snd.narrate(o)};
})();

/* ---------- recorrido automático ---------- */
var pilot={on:false,t:null};
(function(){
  if(T.pilot===false||scenes.length<2)return;
  var bP=document.createElement('button');bP.id='bPilot';bP.title=tr('tour');bP.textContent='▶';bar0.insertBefore(bP,$('bGyro')&&$('bPlan')?$('bPlan'):$('bGyro'));
  function seq(){return scenes.filter(function(o){return !o.data.skip})}
  function wait(){
    clearTimeout(pilot.t);if(!pilot.on||!cur)return;
    var a=snd.narr,next=function(){pilotNext()};
    if(a&&!a.ended){a.addEventListener('ended',function f(){a.removeEventListener('ended',f);if(pilot.on&&snd.narr===a)pilot.t=setTimeout(next,900)})}
    else pilot.t=setTimeout(next,Math.max(2,cur.data.secs||T.pilotSecs||8)*1000);
  }
  function pilotNext(){
    if(!pilot.on)return;var q=seq(),i=q.indexOf(cur),n=q[i+1];
    if(!n){if(T.pilotLoop===false){setPilot(false);return}n=q[0]}
    if(!n){setPilot(false);return}
    go(n.data.id);
  }
  window.pilotNext=pilotNext;
  function wpsRun(o){
    if(!pilot.on||cur!==o)return;var w=o.data.wps;if(!w||!w.length)return;
    viewer.stopMovement();viewer.setIdleMovement(Infinity);
    var leg=Math.max(1500,((o.data.secs||T.pilotSecs||8)*1000)/w.length),i=0;
    (function step(){if(!pilot.on||cur!==o)return;var p=w[i++];if(!p)return;o.scene.lookTo({yaw:p.yaw,pitch:p.pitch,fov:p.fov},{transitionDuration:leg},step)})();
  }
  function setPilot(v){
    pilot.on=v;bP.textContent=v?'❚❚':'▶';bP.className=v?'on':'';clearTimeout(pilot.t);
    if(v){if(on)setAuto(false);setAuto(true);if(cur&&cur.data.skip){var q=seq();if(q[0])go(q[0].data.id)}if(window.__first)window.__first();wait();if(cur)wpsRun(cur)}
  }
  window.setPilot=setPilot;
  bP.onclick=function(){setPilot(!pilot.on)};
  var prev=window.__onGo;window.__onGo=function(o){if(prev)prev(o);if(pilot.on){setTimeout(wait,50);var w=o.data.wps;if(w&&w.length)setTimeout(function(){wpsRun(o)},120);else setAuto(true)}};
  $('pano').addEventListener('pointerdown',function(e){if(pilot.on&&!e.target.closest('.hs'))setPilot(false)});
})();

/* ---------- grupos de hotspots (mostrar u ocultar) y botones del tour ---------- */
(function(){
  var gs={},keys=['linkHotspots','infoHotspots','embedHotspots','imageHotspots','galleryHotspots','quizHotspots','notaHotspots','videoHotspots'];
  d.scenes.forEach(function(s){keys.forEach(function(k){(s[k]||[]).forEach(function(h){if(h.grp)gs[h.grp]=1})})});
  var names=Object.keys(gs).sort(function(a,b){return a.localeCompare(b,LANG)});
  if(names.length){
    var box=document.createElement('div');box.id='grp';box.title=tr('groups');var hid={};
    names.forEach(function(n){var b=document.createElement('button');b.type='button';b.className='on';b.textContent=n;
      b.onclick=function(){hid[n]=!hid[n];b.className=hid[n]?'':'on';Array.prototype.forEach.call(document.querySelectorAll('.hs[data-grp]'),function(e){e.classList.toggle('ghid',!!hid[e.dataset.grp])})};box.appendChild(b)});
    document.body.appendChild(box);stop(box);
  }
  (d.buttons||[]).slice(0,3).forEach(function(b){
    var href=G.https(b.href);if(!href||!b.label)return;
    var a=document.createElement('a');a.className='cbtn';a.href=href;a.target='_blank';a.rel='noopener';a.textContent=String(b.label).slice(0,20);
    bar0.insertBefore(a,$('bFull'));
  });
})();

/* ---------- pantalla de carga con marca ---------- */
(function(){
  if(!T.splash)return;
  var sp=document.createElement('div');sp.id='splash';
  if(B.logo&&B.logo.file){var im=document.createElement('img');im.src=B.logo.file;im.alt='';sp.appendChild(im)}
  var h2=document.createElement('h2');h2.textContent=d.name||'';sp.appendChild(h2);
  if(T.splashText){var p=document.createElement('p');p.textContent=T.splashText;sp.appendChild(p)}
  sp.appendChild(document.createElement('i'));document.body.appendChild(sp);
  var done=false;function hide(){if(done)return;done=true;sp.className='out';setTimeout(function(){sp.remove()},700)}
  sp.addEventListener('click',hide);
  var prev=window.__onGo;window.__onGo=function(o){if(prev)prev(o);setTimeout(hide,1300)};
  setTimeout(hide,9000);
})();

/* ---------- preguntas de seguridad con puntaje ---------- */
var qbtn=null,qz=null;
function allQuiz(){var r=[];d.scenes.forEach(function(s){(s.quizHotspots||[]).forEach(function(h){r.push(h)})});return r}
function qScore(){var s=0,ok=0,n=0;allQuiz().forEach(function(h){var a=quiz.ans[h._k];if(a){n++;if(a.right){ok++;s+=h.points||10}}});return {s:s,ok:ok,n:n}}
function qSync(){
  if(!qbtn)return;var r=qScore();qbtn.textContent='★ '+r.s+'/'+quiz.pts;
  allQuiz().forEach(function(h){if(h._el)h._el.classList.toggle('done',!!quiz.ans[h._k])});
}
function qClose(){if(qz)qz.className=''}
function qShell(){
  if(qz)return $('qbox');
  qz=document.createElement('div');qz.id='qz';qz.innerHTML='<div id="qbox"></div>';document.body.appendChild(qz);stop(qz);
  qz.addEventListener('click',function(e){if(e.target===qz)qClose()});return $('qbox');
}
function qBtn(box,txt,cls,fn){var b=document.createElement('button');b.type='button';b.textContent=txt;if(cls)b.className=cls;b.onclick=fn;box.appendChild(b);return b}
function openQuiz(h){
  var box=qShell(),a=quiz.ans[h._k];box.innerHTML='';
  var t=document.createElement('h3');t.textContent=h.title;box.appendChild(t);
  var opts=document.createElement('div');box.appendChild(opts);
  var fb=document.createElement('div');fb.className='qf';
  (h.opts||[]).forEach(function(o,i){
    var b=document.createElement('button');b.type='button';b.className='qo';b.textContent=o;
    if(a){b.disabled=true;if(i===h.ok)b.className+=' ok';else if(i===a.pick)b.className+=' bad'}
    b.onclick=function(){
      if(quiz.ans[h._k])return;var right=i===h.ok;quiz.ans[h._k]={pick:i,right:right};qSync();
      if(GA)GA('event','quiz_answer',{question:h.title.slice(0,80),correct:right});
      openQuiz(h);
    };
    opts.appendChild(b);
  });
  if(a){fb.textContent=(a.right?tr('correct'):tr('wrong'))+(h.expl?'\n'+h.expl:'');box.appendChild(fb)}
  var act=document.createElement('div');act.className='qa';box.appendChild(act);
  if(a&&qScore().n===allQuiz().length)qBtn(act,tr('review'),'cta',qResult);
  qBtn(act,tr('close'),a?'':'',qClose);
  qz.className='open';
}
function qResult(){
  var box=qShell(),r=qScore();box.innerHTML='';
  var t=document.createElement('h3');t.textContent=tr('done');box.appendChild(t);
  var p=document.createElement('div');p.className='qf';p.textContent=tr('score')+': '+r.s+' '+tr('of')+' '+quiz.pts+' · '+r.ok+' '+tr('of')+' '+r.n+' '+tr('right');box.appendChild(p);
  var act=document.createElement('div');act.className='qa';box.appendChild(act);
  qBtn(act,tr('csv'),'cta',function(){
    function q(x){return '"'+String(x).replace(/"/g,'""')+'"'}
    var rows=[tr('qcsv')];
    allQuiz().forEach(function(h){var a=quiz.ans[h._k];rows.push([q(h.title),q(a?h.opts[a.pick]:''),a&&a.right?'1':'0',a&&a.right?(h.points||10):0].join(','))});
    rows.push(['"Total"','""','"'+r.ok+'"',r.s].join(','));
    var bl=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(bl),l=document.createElement('a');l.href=u;l.download='reporte-evaluacion.csv';document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);
  });
  qBtn(act,tr('again'),'',function(){quiz.ans={};qSync();qClose()});
  qBtn(act,tr('close'),'',qClose);
  if(GA)GA('event','quiz_complete',{score:r.s,max:quiz.pts});
  qz.className='open';
}
if(quiz.n){
  qbtn=document.createElement('button');qbtn.id='bQuiz';qbtn.title=tr('points');
  bar0.insertBefore(qbtn,$('bFull'));qbtn.onclick=function(){if(qScore().n===quiz.n&&quiz.n)qResult()};qSync();
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')qClose()});

/* ---------- contraseña simple (protección débil, solo en el navegador) ---------- */
function startTour(){
  if(scenes.length){go(scenes[Math.min(d.start||0,scenes.length-1)].data.id,true);setAuto(on)}
  if(T.pilotStart&&window.setPilot)window.setPilot(true);
}
(function(){
  var K=T.pass;
  if(!K||!K.hash){startTour();return}
  var ok=false;try{ok=sessionStorage.getItem('gm_'+K.hash)==='1'}catch(e){}
  if(ok){startTour();return}
  var g=document.createElement('div');g.id='gate';
  g.innerHTML='<form><h2></h2><div style="opacity:.8;font-size:13px">'+tr('pw')+'</div><input type="password" id="gPw" placeholder="'+tr('pwIn')+'" autocomplete="off" aria-label="'+tr('pwIn')+'"><div class="er" id="gEr"></div><button type="submit">'+tr('enter')+'</button></form>';
  g.querySelector('h2').textContent=d.name||'Tour 360°';
  document.body.appendChild(g);
  g.querySelector('form').onsubmit=function(e){
    e.preventDefault();
    if(G.sha256(K.salt+$('gPw').value)===K.hash){try{sessionStorage.setItem('gm_'+K.hash,'1')}catch(x){}g.remove();startTour()}
    else{$('gEr').textContent=tr('pwBad');$('gPw').select()}
  };
  setTimeout(function(){$('gPw').focus()},50);
})();
})();

