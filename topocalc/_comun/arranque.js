"use strict";
/* Arranque de una página de herramienta: dibuja la herramienta de la página.
   Generado a partir del index.html monolítico de topocalc. */

/* ===== Dibujo de la herramienta de esta página ===== */
function render(){
  const id = currentRoute();
  window.scrollTo(0,0);
  registrarAperturaParaAnuncios(id);
  RENDERERS[id]();
  if(flujoRetorno && id !== flujoRetorno && FLUJOS[flujoRetorno] && FLUJOS[flujoRetorno].includes(id)){
    const tv = document.querySelector('.tool-view');
    if(tv){
      const b = document.createElement('button');
      b.type='button'; b.className='btn-sm'; b.style.cssText='width:100%;margin:0 0 12px;';
      b.textContent = '↩ Volver a ' + NOMBRES_FLUJO[flujoRetorno];
      b.addEventListener('click', ()=> go(flujoRetorno));
      tv.prepend(b);
    }
  } else if(id !== flujoRetorno){ flujoRetorno = null; }
  mejorarAccesibilidad();
}
document.getElementById('backBtn').addEventListener('click', ()=> go('home'));
initAds();
render();
comprobarCompraSinAnuncios();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/topocalc/service-worker.js').catch((err) => console.warn('SW registration failed:', err));
  });
}
