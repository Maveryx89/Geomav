"use strict";
/* Herramienta «Tour 360° GEOMAV»: recorrido virtual 360° (visor Marzipano, Apache-2.0) con la interfaz de entrega de GEOMAV.
   El tour vive en visor/ (index.html + tour.js + media/). Para publicar otro tour se reemplazan tour.js y media/. */
function renderTour360(){
  const body = `<style>
    .t3-wrap{position:relative; width:100%; aspect-ratio:16/10; background:#000; border-radius:12px; overflow:hidden; margin-top:12px;}
    .t3-wrap iframe{position:absolute; inset:0; width:100%; height:100%; border:0;}
    .t3-btns{display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 0;}
    .t3-btns a{text-decoration:none; display:inline-flex; align-items:center;}
    @media (max-width:640px){ .t3-wrap{aspect-ratio:3/4;} }
  </style>
  <div class="field-card">
    <p>Recorrido virtual 360° con menú de escenas, buscador, giro automático, giroscopio y pantalla completa. Abajo ves una <strong>demostración</strong> con escenas de prueba. Para ver tus propias fotos 360° (formato equirectangular 2:1, desde el celular o el computador), toca el botón <strong>⬆</strong> de la barra inferior del visor. Las fotos se procesan en tu equipo y no se suben a ningún servidor.</p>
    <div class="t3-btns">
      <a class="btn" id="t3_full" href="visor/index.html" target="_blank" rel="noopener">⛶ Abrir a pantalla completa</a>
      <a class="btn-sm" href="https://geomav.me/?utm_source=topocalc&amp;utm_medium=app&amp;utm_campaign=tour360" target="_blank" rel="noopener">Cotiza tu tour 360° en geomav.me</a>
    </div>
    <div class="t3-wrap"><iframe src="visor/index.html" title="Tour 360° GEOMAV" allow="fullscreen; gyroscope; accelerometer" allowfullscreen loading="lazy"></iframe></div>
  </div>`;
  toolShell('tour360', 'Recorre un tour virtual 360° con la interfaz de GEOMAV. Arrastra para mirar, toca las flechas para avanzar entre escenas y usa el menú para saltar a cualquier sala.', body);
  const ab = document.querySelector('.tool-view .action-bar'); if(ab) ab.style.display = 'none';
}

const RENDERERS = { tour360: renderTour360 };
