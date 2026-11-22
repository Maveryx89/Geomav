/* GEOMAV - íconos, colores y construcción de hotspots (compartido por el editor y el visor del tour). */
(function(){
'use strict';
var G=window.GEOMAV=window.GEOMAV||{};

// Íconos de 24x24 (trazo). Cada uno es el contenido de un <path d="...">.
G.ICONS={
  flecha:   {t:'Flecha',     d:'M12 19V5M5 12l7-7 7 7'},
  puerta:   {t:'Puerta',     d:'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M4 21h16M14.5 12.5h.01'},
  escalera: {t:'Escalera',   d:'M4 20h4v-4h4v-4h4V8h4'},
  punto:    {t:'Punto',      d:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'},
  mas:      {t:'Más',        d:'M12 5v14M5 12h14'},
  info:     {t:'Info',       d:'M12 7h.01M11 11h1v6h1'},
  alerta:   {t:'Alerta',     d:'M12 4l9 16H3zM12 10v4M12 17h.01'},
  foto:     {t:'Foto',       d:'M4 7h3l2-2h6l2 2h3v12H4zM12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'},
  medida:   {t:'Medida',     d:'M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2'},
  video:    {t:'Video',      d:'M8 5v14l11-7z'},
  mapa:     {t:'Mapa',       d:'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'},
  documento:{t:'Documento',  d:'M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6'},
  galeria:  {t:'Galería',    d:'M3 7h14v12H3zM7 7V4h14v12h-4M6 16l3-3 2 2 3-3 3 4'},
  pregunta: {t:'Pregunta',   d:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.7 9.3a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.6M12 16.8h.01'},
  web:      {t:'Web',        d:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z'}
};
// Íconos ofrecidos para cada tipo de hotspot.
G.SETS={
  link:['flecha','puerta','escalera','punto','mas'],
  info:['info','alerta','foto','medida','punto'],
  embed:['video','mapa','documento','web','foto'],
  galeria:['galeria','foto','mas','punto','info'],
  quiz:['pregunta','alerta','info','punto','mas']
};
G.COLORS=[
  {n:'Cobre',    v:'#D49A6A'},
  {n:'Turquesa', v:'#6FD0C0'},
  {n:'Blanco',   v:'#FFFFFF'},
  {n:'Amarillo', v:'#F2C94C'},
  {n:'Rojo',     v:'#E5604D'}
];
G.DEF={link:{icon:'flecha',color:'#D49A6A'},info:{icon:'info',color:'#6FD0C0'},embed:{icon:'video',color:'#FFFFFF'},galeria:{icon:'galeria',color:'#F2C94C'},quiz:{icon:'pregunta',color:'#F2C94C'}};

G.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
G.icon=function(type,h){var n=h&&h.icon;return (n&&G.ICONS[n])?n:G.DEF[type].icon};
G.color=function(type,h){var c=h&&h.color;return (typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))?c:G.DEF[type].color};
G.svg=function(name){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+G.ICONS[name].d+'"/></svg>'};

/* Elemento DOM de un hotspot. type: 'link' | 'info' | 'embed'. label: nombre mostrado bajo el ícono. */
G.hotspot=function(type,h,label){
  var el=document.createElement('div');
  el.className='hs '+type;
  el.style.setProperty('--c',G.color(type,h));
  var html='<div class="dot">'+G.svg(G.icon(type,h))+'</div>';
  if(type==='info')html+='<div class="bubble">'+(h.imgSrc?'<img class="fimg" alt="" src="'+G.esc(h.imgSrc)+'">':'')+'<b>'+G.esc(h.title||'Información')+'</b>'+G.esc(h.text||'')+'</div>';
  else html+='<div class="lbl">'+G.esc(label||'')+'</div>';
  el.innerHTML=html;
  var rot=h.rotation!=null?h.rotation:h.rot;
  if(type==='link'&&rot)el.querySelector('svg').style.transform='rotate('+rot+'deg)';
  return el;
};

/* Normaliza el enlace de contenido incrustado. Devuelve {src} o {err}. Solo https. */
G.normEmbed=function(raw){
  raw=String(raw||'').trim();
  if(!raw)return {err:'Pega un enlace.'};
  var m=raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);if(m)raw=m[1];
  var u;try{u=new URL(raw)}catch(e){return {err:'El enlace no es válido.'}}
  if(u.protocol!=='https:')return {err:'Solo se aceptan enlaces que empiecen con https://'};
  var h=u.hostname.replace(/^www\./,''),id=null;
  if(h==='youtu.be')id=u.pathname.slice(1);
  else if(h==='youtube.com'||h==='m.youtube.com'||h==='youtube-nocookie.com'){
    if(u.pathname==='/watch')id=u.searchParams.get('v');
    else{var pm=u.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);if(pm)id=pm[2]}
  }
  if(id&&/^[\w-]{6,}$/.test(id))return {src:'https://www.youtube-nocookie.com/embed/'+id};
  if(h==='vimeo.com'){var vm=u.pathname.match(/^\/(\d+)/);if(vm)return {src:'https://player.vimeo.com/video/'+vm[1]}}
  if(h==='player.vimeo.com')return {src:u.href};
  if(h==='drive.google.com'){var dm=u.pathname.match(/\/file\/d\/([\w-]+)/);if(dm)return {src:'https://drive.google.com/file/d/'+dm[1]+'/preview'}}
  if(h==='google.com'&&u.pathname.indexOf('/maps/embed')===0)return {src:u.href};
  if(h==='google.com'&&u.pathname==='/maps'&&u.searchParams.get('output')==='embed'&&u.searchParams.get('q'))return {src:u.href};
  if(h==='maps.app.goo.gl'||h==='goo.gl'||(h==='google.com'&&u.pathname.indexOf('/maps')===0))
    return {err:'Ese enlace de Google Maps no se puede incrustar. En Google Maps usa Compartir → Insertar un mapa y pega el código completo.'};
  return {src:u.href};
};

/* Ajustes de imagen (brillo, contraste, saturación: -100..100) -> efectos de color de Marzipano. null si no hay cambios. */
G.adjustEffects=function(a){
  a=a||{};var b=+a.b||0,c=+a.c||0,sa=+a.s||0;
  if(!b&&!c&&!sa)return null;
  var k=1+c/100,s=1+sa/100,lr=.2126,lg=.7152,lb=.0722,o=.5*(1-k)+b/200;
  var m=[[s+(1-s)*lr,(1-s)*lg,(1-s)*lb],[(1-s)*lr,s+(1-s)*lg,(1-s)*lb],[(1-s)*lr,(1-s)*lg,s+(1-s)*lb]];
  var M=[m[0][0]*k,m[0][1]*k,m[0][2]*k,0, m[1][0]*k,m[1][1]*k,m[1][2]*k,0, m[2][0]*k,m[2][1]*k,m[2][2]*k,0, 0,0,0,1];
  return {colorMatrix:M,colorOffset:[o,o,o,0]};
};

/* Mapa de Google por dirección o coordenadas (sin clave de API). */
G.mapEmbed=function(q){return 'https://www.google.com/maps?q='+encodeURIComponent(String(q||'').trim().slice(0,200))+'&output=embed'};

/* Imagen anclada al panorama (logo, señal, plano...). h: {yaw,pitch,size (grados de ancho),title}. */
G.PERSP_R=1000;
G.imageHotspot=function(h,src){
  var el=document.createElement('div');el.className='hs imagen';
  var im=document.createElement('img');im.src=src;im.alt=G.esc(h.title||'');im.draggable=false;
  im.style.width=(2*G.PERSP_R*Math.tan((Math.max(3,Math.min(120,+h.size||20)))*Math.PI/360))+'px';
  el.appendChild(im);
  if(h.title){var l=document.createElement('div');l.className='lbl';l.textContent=h.title;el.appendChild(l)}
  return el;
};
G.imageOpts={perspective:{radius:G.PERSP_R}};

/* Marca: color de acento y color de barras. Devuelve las variables CSS del visor y ajusta el color por defecto de los enlaces. */
G.HEX=/^#[0-9a-f]{6}$/i;
G.applyBrand=function(b){
  b=b||{};var acc=G.HEX.test(b.accent)?b.accent:'#D49A6A';G.DEF.link.color=acc;
  var bar=G.HEX.test(b.bar)?b.bar:null;
  function rgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
  function lum(h){var c=rgb(h);return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255}
  var v={'--v-acc':acc,'--v-onacc':lum(acc)>0.55?'#0A1118':'#FFFFFF'};
  if(bar){var c=rgb(bar);v['--v-bar']=bar;v['--v-bbg']='rgba('+c.join(',')+',.72)';v['--v-pbg']='rgba('+c.join(',')+',.95)'}
  return v;
};
/* URLs seguras para la ficha de información */
G.https=function(u){u=String(u||'').trim();return /^https:\/\/[^\s]+\.[^\s]+$/i.test(u)?u:''};

/* SHA-256 (hex) en JS puro: sirve también al abrir el tour desde un archivo local. */
G.sha256=function(str){
  function R(n,x){return (x>>>n)|(x<<(32-n))}
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var b=unescape(encodeURIComponent(str)),l=b.length,w=[],i,j;
  for(i=0;i<l;i++)w[i>>2]|=b.charCodeAt(i)<<(24-(i%4)*8);
  w[l>>2]|=0x80<<(24-(l%4)*8);w[(((l+8)>>6)<<4)+15]=l*8;
  for(var o=0;o<w.length;o+=16){
    var W=[],a=H[0],bb=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(j=0;j<64;j++){
      if(j<16)W[j]=w[o+j]|0;else{var s0=R(7,W[j-15])^R(18,W[j-15])^(W[j-15]>>>3),s1=R(17,W[j-2])^R(19,W[j-2])^(W[j-2]>>>10);W[j]=(W[j-16]+s0+W[j-7]+s1)|0}
      var S1=R(6,e)^R(11,e)^R(25,e),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[j]+W[j])|0,S0=R(2,a)^R(13,a)^R(22,a),mj=(a&bb)^(a&c)^(bb&c),t2=(S0+mj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0;H[1]=(H[1]+bb)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
  }
  return H.map(function(x){return ('00000000'+(x>>>0).toString(16)).slice(-8)}).join('');
};

/* Galería a pantalla completa (imágenes por URL). Estilos en línea: sirve en el visor y en el editor. */
G.openGallery=function(urls,title){
  if(!urls||!urls.length)return;
  var i=0,timer=null,ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;font:14px system-ui,sans-serif;color:#fff';
  var top=document.createElement('div');top.style.cssText='position:absolute;top:0;left:0;right:0;display:flex;gap:10px;align-items:center;padding:10px 14px';
  var tt=document.createElement('b');tt.style.cssText='flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';tt.textContent=title||'Galería';
  function btn(txt,label){var b=document.createElement('button');b.textContent=txt;b.setAttribute('aria-label',label);b.style.cssText='background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:8px;min-width:38px;height:38px;font-size:16px;cursor:pointer;padding:0 10px';return b}
  var play=btn('▶ Pase','Pase automático'),x=btn('✕','Cerrar'),cnt=document.createElement('span');cnt.style.cssText='opacity:.8;font-size:13px';
  top.appendChild(tt);top.appendChild(cnt);top.appendChild(play);top.appendChild(x);
  var im=document.createElement('img');im.style.cssText='max-width:94vw;max-height:78vh;object-fit:contain;border-radius:6px;user-select:none';im.alt='';
  var pv=btn('‹','Anterior'),nx=btn('›','Siguiente');
  [pv,nx].forEach(function(b){b.style.cssText+='position:absolute;top:50%;transform:translateY(-50%);width:46px;height:56px;font-size:28px'});pv.style.left='10px';nx.style.right='10px';
  ov.appendChild(top);ov.appendChild(im);if(urls.length>1){ov.appendChild(pv);ov.appendChild(nx)}else play.style.display='none';
  function show(n){i=(n+urls.length)%urls.length;im.src=urls[i];cnt.textContent=(i+1)+' / '+urls.length}
  function stopP(){clearInterval(timer);timer=null;play.textContent='▶ Pase'}
  function close(){stopP();document.removeEventListener('keydown',key);ov.remove()}
  function key(e){if(e.key==='Escape')close();else if(e.key==='ArrowRight')show(i+1);else if(e.key==='ArrowLeft')show(i-1)}
  pv.onclick=function(){show(i-1)};nx.onclick=function(){show(i+1)};x.onclick=close;
  play.onclick=function(){if(timer)stopP();else{play.textContent='❚❚ Pausa';timer=setInterval(function(){show(i+1)},4000)}};
  ov.addEventListener('click',function(e){if(e.target===ov)close()});
  var sx=0;ov.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  ov.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(i+(dx<0?1:-1))},{passive:true});
  document.addEventListener('keydown',key);document.body.appendChild(ov);show(0);
};
})();
