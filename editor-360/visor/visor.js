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

/* ---------- escenas y hotspots ---------- */
var byId={},list=$('list'),cur=null;
var scenes=d.scenes.map(function(s){
  var m=s.multires; // cubo multiresolución (teselas) o imagen equirectangular única
  var lim=Marzipano.RectilinearView.limit.traditional(m?m.levels[m.levels.length-1].size:s.width,100*Math.PI/180);
  var view=new Marzipano.RectilinearView(s.initialViewParameters,lim);
  var sc=viewer.createScene(m?{source:Marzipano.ImageUrlSource.fromString(m.tiles,{cubeMapPreviewUrl:m.preview}),geometry:new Marzipano.CubeGeometry(m.levels),view:view,pinFirstLevel:true}
    :{source:Marzipano.ImageUrlSource.fromString(s.file),geometry:new Marzipano.EquirectGeometry([{width:s.width}]),view:view});
  var o={data:s,scene:sc};byId[s.id]=o;
  var fx=G.adjustEffects(s.adjust);if(fx)sc.layer().setEffects(fx);
  if(s.layer&&s.layer.file){ // capa de comparación (plano, avance anterior...)
    o.op=(s.layer.opacity==null?50:s.layer.opacity)/100;
    o.layerObj=sc.createLayer({source:Marzipano.ImageUrlSource.fromString(s.layer.file),geometry:new Marzipano.EquirectGeometry([{width:s.layer.width||4096}])});
    o.layerObj.setEffects({opacity:o.op});
  }
  function put(el,h,opts){stop(el);sc.hotspotContainer().createHotspot(el,{yaw:h.yaw,pitch:h.pitch},opts)}
  (s.imageHotspots||[]).forEach(function(h){put(G.imageHotspot(h,h.file),h,G.imageOpts)});
  (s.linkHotspots||[]).forEach(function(h){
    var t=byId[h.target]||d.scenes.filter(function(x){return x.id===h.target})[0];
    var el=G.hotspot('link',h,t&&(t.data?t.data.name:t.name));
    el.addEventListener('click',function(){via(h,o)});put(el,h);
  });
  (s.infoHotspots||[]).forEach(function(h){
    var el=G.hotspot('info',h);
    el.addEventListener('click',function(){el.classList.toggle('open')});put(el,h);
  });
  (s.embedHotspots||[]).forEach(function(h){
    var el=G.hotspot('embed',h,h.title||'Ver contenido');
    el.addEventListener('click',function(){openModal(h)});put(el,h);
  });
  var a=document.createElement('a');a.textContent=s.name;a.onclick=function(){go(s.id);list.classList.remove('open')};list.appendChild(a);o.a=a;
  return o;
});

function go(id,instant){
  var o=byId[id];if(!o)return;
  o.scene.view().setParameters(o.data.initialViewParameters);
  o.scene.switchTo({transitionDuration:instant?0:(T.transition==='fade'?600:900)});
  cur=o;
  scenes.forEach(function(x){x.a.className=x===o?'on':''});
  $('ttl').textContent=d.name+(d.scenes.length>1?' · '+o.data.name:'');
  var cp=$('capa');
  if(o.layerObj){cp.className='show';$('capaT').textContent=o.data.layer.name||'Capa';$('capaR').value=Math.round(o.op*100)}
  else cp.className='';
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
  var x=el('button',null,'✕');x.id='iX';x.setAttribute('aria-label','Cerrar');box.appendChild(x);
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
  var b=el('button',null,'ⓘ '+(I.btnLabel||'Info'));b.id='bInfo';b.title='Información del tour';
  bar0.insertBefore(b,$('bList'));
  function open(v){m.className=v?'open':'';if(vw){vw.innerHTML='';if(v){var f=document.createElement('iframe');f.src=vid.src;f.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';f.setAttribute('allowfullscreen','');f.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-presentation');f.title='Video';vw.appendChild(f)}}}
  b.onclick=function(){open(true)};x.onclick=function(){open(false)};m.addEventListener('click',function(e){if(e.target===m)open(false)});
  stop(m);
})();
$('bList').onclick=function(){list.classList.toggle('open')};
$('bFull').onclick=function(){var e=document.documentElement;if(document.fullscreenElement)document.exitFullscreen();else if(e.requestFullscreen)e.requestFullscreen()};
if(scenes.length<2||T.sceneList===false)$('bList').style.display='none';
if(T.fullscreen===false)$('bFull').style.display='none';
if(T.viewControls===false)$('vc').style.display='none';
else{
  var cm=viewer.controls(),pr=function(id,ax,v){cm.registerMethod(id,new Marzipano.ElementPressControlMethod($(id),ax,v,3),true)};
  pr('vUp','y',-0.7);pr('vDown','y',0.7);pr('vLeft','x',-0.7);pr('vRight','x',0.7);pr('vIn','zoom',-0.7);pr('vOut','zoom',0.7);
}
if(scenes.length){go(scenes[Math.min(d.start||0,scenes.length-1)].data.id,true);setAuto(on)}
})();
