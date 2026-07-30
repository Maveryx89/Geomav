// ─────────────────────────────────────────────
// PÁGINA DEDICADA DE UNA CATEGORÍA DEL PORTAFOLIO
// Usado por: topografia.html, drones-mapeo.html, recorridos-360.html,
// timelapse-obra.html.
//
// Requiere, en este orden, antes de este archivo:
//   1. /assets/js/portafolio-data.js   (define proyectosPortafolio, iconosPorTipo)
//   2. Un <script> inline en la página con: const TIPO_CATEGORIA = 'topografia';
//
// Muestra TODOS los proyectos de esa categoría en una cuadrícula (sin
// límite), a diferencia del widget compacto de la portada. Agregar más
// proyectos aquí es automático: solo se editan los datos en
// portafolio-data.js, esta página no necesita tocarse.
// ─────────────────────────────────────────────

(function () {
  const iframeVisor = document.getElementById('iframeVisor');
  const portadaVisor = document.getElementById('portadaVisor');
  const botonIniciar = document.getElementById('botonIniciarVisor');
  const grid = document.getElementById('galeriaGrid');
  const contador = document.getElementById('galeriaContador');

  const lista = [...(proyectosPortafolio[TIPO_CATEGORIA] || [])]
    .sort((a, b) => (b.real === true) - (a.real === true));

  let activoId = lista.length ? (lista.find(p => p.real) || lista[0]).id : null;

  if (contador) {
    contador.textContent = lista.length === 1 ? '1 proyecto' : `${lista.length} proyectos`;
  }

  function cargarEnVisor(url) {
    if (iframeVisor.classList.contains('activo')) {
      iframeVisor.style.opacity = '0';
      setTimeout(() => {
        iframeVisor.src = url;
        iframeVisor.style.opacity = '1';
      }, 300);
    } else {
      iframeVisor.src = url;
    }
    portadaVisor.classList.add('oculto');
    iframeVisor.classList.add('activo');
  }

  function render() {
    grid.innerHTML = '';
    lista.forEach(proyecto => {
      const activo = proyecto.id === activoId;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tour-card' + (activo ? ' activa' : '');
      btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
      btn.innerHTML = `
        <span class="tour-card-icono">${proyecto.icono || iconosPorTipo[TIPO_CATEGORIA]}</span>
        <span class="tour-card-info">
          <strong class="tour-card-titulo">${proyecto.titulo}</strong>
          <span class="tour-card-ubicacion">${proyecto.ubicacion}</span>
        </span>
        ${proyecto.real ? '' : '<span class="tour-card-badge badge-ejemplo">Ejemplo</span>'}
      `;
      btn.addEventListener('click', () => {
        activoId = proyecto.id;
        cargarEnVisor(proyecto.url);
        render();
      });
      grid.appendChild(btn);
    });
  }

  if (botonIniciar) {
    botonIniciar.addEventListener('click', () => {
      const proyecto = lista.find(p => p.id === activoId);
      if (proyecto) cargarEnVisor(proyecto.url);
    });
  }

  render();
})();
