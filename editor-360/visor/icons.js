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
  web:      {t:'Web',        d:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z'}
};
// Íconos ofrecidos para cada tipo de hotspot.
G.SETS={
  link:['flecha','puerta','escalera','punto','mas'],
  info:['info','alerta','foto','medida','punto'],
  embed:['video','mapa','documento','web','foto']
};
G.COLORS=[
  {n:'Cobre',    v:'#D49A6A'},
  {n:'Turquesa', v:'#6FD0C0'},
  {n:'Blanco',   v:'#FFFFFF'},
  {n:'Amarillo', v:'#F2C94C'},
  {n:'Rojo',     v:'#E5604D'}
];
G.DEF={link:{icon:'flecha',color:'#D49A6A'},info:{icon:'info',color:'#6FD0C0'},embed:{icon:'video',color:'#FFFFFF'}};

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
  if(type==='info')html+='<div class="bubble"><b>'+G.esc(h.title||'Información')+'</b>'+G.esc(h.text||'')+'</div>';
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
  if(h==='maps.app.goo.gl'||h==='goo.gl'||(h==='google.com'&&u.pathname.indexOf('/maps')===0))
    return {err:'Ese enlace de Google Maps no se puede incrustar. En Google Maps usa Compartir → Insertar un mapa y pega el código completo.'};
  return {src:u.href};
};
})();
