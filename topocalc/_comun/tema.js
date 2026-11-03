"use strict";
/* Tema claro/oscuro, sistema angular, anuncios y pie de página (menú y herramientas).
   Generado a partir del index.html monolítico de topocalc. */
try{ new MutationObserver(()=>mejorarAccesibilidad()).observe(document.getElementById('main'), {childList:true, subtree:true}); }catch(e){}
function applyAngSysLabel(){
  document.getElementById('angSysLabel').textContent = angleSystem === 'cent' ? 'CEN' : 'SEX';
  document.getElementById('angSysToggle').title = angleSystem === 'cent'
    ? 'Sistema angular: Centesimal (gon) — toca para cambiar a Sexagesimal'
    : 'Sistema angular: Sexagesimal (° \' ") — toca para cambiar a Centesimal';
}
angleSystem = loadAngleSystem();
applyAngSysLabel();
document.getElementById('angSysToggle').addEventListener('click', ()=>{
  angleSystem = angleSystem === 'cent' ? 'sex' : 'cent';
  saveAngleSystem(angleSystem);
  applyAngSysLabel();
  render();
});
function applyThemeIcon(mode){
  const icon = document.getElementById('themeIcon');
  if(mode==='dark'){
    icon.innerHTML = `<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>`;
  } else if(mode==='light'){
    icon.innerHTML = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`;
  } else {
    icon.innerHTML = `<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"/>`;
  }
}
function loadTheme(){
  try{ return localStorage.getItem('topocalc-theme') || 'auto'; }catch(e){ return 'auto'; }
}
function saveTheme(mode){
  try{ localStorage.setItem('topocalc-theme', mode); }catch(e){}
}
let themeMode = loadTheme();
function aplicarColorBarra(){       // color de la barra del navegador según el tema que realmente se ve
  const oscuro = themeMode==='dark' || (themeMode!=='light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', oscuro ? '#10161D' : '#F4F3EF');
}
function setTheme(mode){
  themeMode = mode;
  if(mode==='auto'){ document.documentElement.removeAttribute('data-theme'); }
  else { document.documentElement.setAttribute('data-theme', mode); }
  applyThemeIcon(mode);
  aplicarColorBarra();
  saveTheme(mode);
}
try{ window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicarColorBarra); }catch(e){}
document.getElementById('themeToggle').addEventListener('click', ()=>{
  const order = ['auto','light','dark'];
  const next = order[(order.indexOf(themeMode)+1) % order.length];
  setTheme(next);
});
setTheme(themeMode);
const btnQuitarAnuncios = document.getElementById('btnQuitarAnuncios');
if(btnQuitarAnuncios){
  if(esNativo && !sinAnunciosComprado){
    btnQuitarAnuncios.style.display = '';
  }
  btnQuitarAnuncios.addEventListener('click', ()=>{
    btnQuitarAnuncios.disabled = true;
    const txtOriginal = btnQuitarAnuncios.textContent;
    btnQuitarAnuncios.textContent = 'Abriendo Google Play…';
    comprarQuitarAnuncios((r)=>{
      btnQuitarAnuncios.disabled = false;
      btnQuitarAnuncios.textContent = r.ok ? txtOriginal : txtOriginal;
      if(!r.ok) alert(r.msg);
    });
  });
}
try{ document.getElementById('footYear').textContent = new Date().getFullYear(); }catch(e){}

/* Botón «Acerca de» (módulo compartido GEOMAV: logo, versión, creador y contacto) */
(function(){try{var s=document.createElement('script');s.src=(document.body.getAttribute('data-raiz')||'./')+'_comun/acerca-de.js';s.setAttribute('data-app','Topo de Bolsillo');s.setAttribute('data-desc','Calculadoras de topografía para terreno y oficina. Funciona sin conexión.');s.setAttribute('data-host','.topbar');s.setAttribute('data-clase','theme-toggle');document.head.appendChild(s);}catch(e){}})();
