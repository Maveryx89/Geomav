/* Visor de tours 360° - GEOMAV (usa Marzipano, Apache-2.0). Lee APP_DATA. */
(function(){
'use strict';
var G=window.GEOMAV,d=APP_DATA,T=d.settings||{};
function $(id){return document.getElementById(id)}
var viewer=new Marzipano.Viewer($('pano'),{controls:{mouseViewMode:T.mouseMode==='qtvr'?'qtvr':'drag'}});
function stop(el){['touchstart','touchmove','touchend','touchcancel','wheel','mousewheel','pointerdown'].forEach(function(e){el.addEventListener(e,function(v){v.stopPropagation()})})}

/* ---------- escenas y hotspots ---------- */
var byId={},list=$('list'),cur=null;
var scenes=d.scenes.map(function(s){
  var lim=Marzipano.RectilinearView.limit.traditional(s.width,100*Math.PI/180);
  var view=new Marzipano.RectilinearView(s.initialViewParameters,lim);
  var sc=viewer.createScene({source:Marzipano.ImageUrlSource.fromString(s.file),geometry:new Marzipano.EquirectGeometry([{width:s.width}]),view:view});
  var o={data:s,scene:sc};byId[s.id]=o;
  function put(el,h){stop(el);sc.hotspotContainer().createHotspot(el,{yaw:h.yaw,pitch:h.pitch})}
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
}
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
