// ─────────────────────────────────────────────
// PORTAFOLIO EN LA PORTADA (widget de pestañas + visor)
// Requiere que /assets/js/portafolio-data.js esté cargado antes que este
// archivo (define proyectosPortafolio e iconosPorTipo).
// Solo se usa en index.html.
// ─────────────────────────────────────────────

const botonesPestana = document.querySelectorAll('.pestana-boton');
const iframeVisor = document.getElementById('iframeVisor');
const visorScroll = document.getElementById('visorScroll');
const modelVisor = document.getElementById('modelVisor');
const portadaVisor = document.getElementById('portadaVisor');
const visorContenedor = document.querySelector('.visor-contenedor');
const botonIniciar = document.getElementById('botonIniciarVisor');
const proyectosGrid = document.getElementById('toursGrid');
const zoomControles = document.getElementById('visorZoomControles');
const zoomEtiqueta = document.getElementById('zoomEtiqueta');
const botonZoomIn = document.getElementById('zoomIn');
const botonZoomOut = document.getElementById('zoomOut');

// ── Zoom del visor (solo para PDFs de Google Drive) ──
const ZOOM_PASO = 0.25, ZOOM_MIN = 1, ZOOM_MAX = 2.5;
let zoomNivel = 1;

function aplicarZoom() {
  iframeVisor.style.width = (100 * zoomNivel) + '%';
  iframeVisor.style.height = (100 * zoomNivel) + '%';
  zoomEtiqueta.textContent = Math.round(zoomNivel * 100) + '%';
}

botonZoomIn.addEventListener('click', () => {
  zoomNivel = Math.min(ZOOM_MAX, zoomNivel + ZOOM_PASO);
  aplicarZoom();
});
botonZoomOut.addEventListener('click', () => {
  zoomNivel = Math.max(ZOOM_MIN, zoomNivel - ZOOM_PASO);
  aplicarZoom();
});
zoomEtiqueta.addEventListener('click', () => {
  zoomNivel = 1;
  aplicarZoom();
});

// Guarda cuál es el proyecto activo (seleccionado) dentro de cada pestaña.
// Por defecto se elige el primer proyecto REAL de cada pestaña (si existe);
// si aún no hay ninguno real, se usa el primer ejemplo.
function primerActivoPorDefecto(lista) {
  return (lista.find(p => p.real) || lista[0]).id;
}

const activoPorTipo = {
  topografia: primerActivoPorDefecto(proyectosPortafolio.topografia),
  drones: primerActivoPorDefecto(proyectosPortafolio.drones),
  tours: primerActivoPorDefecto(proyectosPortafolio.tours),
  timelapse: primerActivoPorDefecto(proyectosPortafolio.timelapse)
};

// ── Enlace directo a un proyecto puntual desde la portada ──
// Formato: index.html?tipo=drones&p=cesfam-rauco-drones#portafolio
// Si vienen en la URL al cargar la página y son válidos, se usan como
// pestaña/proyecto inicial y el visor se activa de inmediato. Si no vienen
// o no son válidos, el comportamiento es el de siempre.
const parametrosUrl = new URLSearchParams(window.location.search);
const tipoDesdeUrl = parametrosUrl.get('tipo');
const idDesdeUrl = parametrosUrl.get('p');
const tipoValidoDesdeUrl = tipoDesdeUrl && proyectosPortafolio[tipoDesdeUrl] ? tipoDesdeUrl : null;
let proyectoInicialDesdeUrl = null;
if (tipoValidoDesdeUrl && idDesdeUrl) {
  const encontrado = proyectosPortafolio[tipoValidoDesdeUrl].find(p => p.id === idDesdeUrl);
  if (encontrado) {
    activoPorTipo[tipoValidoDesdeUrl] = encontrado.id;
    proyectoInicialDesdeUrl = encontrado;
  }
}

function obtenerTipoActivo() {
  return document.querySelector('.pestana-boton.activa').dataset.tipo;
}

// Ordena los proyectos de una pestaña dejando los reales primero y los
// ejemplos al final, sin alterar el orden en que fueron agregados dentro
// de cada grupo. Así, cualquier proyecto real que agregues más adelante
// sube automáticamente sobre los ejemplos, sin reordenar nada a mano.
function ordenarProyectos(lista) {
  return [...lista].sort((a, b) => (b.real === true) - (a.real === true));
}

function obtenerProyectoActivo(tipo) {
  const lista = proyectosPortafolio[tipo];
  return lista.find(p => p.id === activoPorTipo[tipo]) || lista[0];
}

// Actualiza la URL (sin recargar la página) para que refleje la pestaña y
// el proyecto que se está viendo — así se puede copiar el link tal cual
// aparece en la barra de direcciones y comparte exactamente ese proyecto.
function actualizarUrl(tipo, id) {
  const params = new URLSearchParams(window.location.search);
  params.set('tipo', tipo);
  params.set('p', id);
  const nuevaUrl = `${window.location.pathname}?${params.toString()}#portafolio`;
  history.replaceState(null, '', nuevaUrl);
}

function renderizarGrid(tipo) {
  const lista = ordenarProyectos(proyectosPortafolio[tipo]);
  proyectosGrid.innerHTML = '';
  lista.forEach(proyecto => {
    const activo = proyecto.id === activoPorTipo[tipo];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tour-card' + (activo ? ' activa' : '');
    btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
    btn.innerHTML = `
      <span class="tour-card-icono">${proyecto.icono || iconosPorTipo[tipo]}</span>
      <span class="tour-card-info">
        <strong class="tour-card-titulo">${proyecto.titulo}</strong>
        <span class="tour-card-ubicacion">${proyecto.ubicacion}</span>
      </span>
      ${proyecto.real ? '' : '<span class="tour-card-badge badge-ejemplo">Ejemplo</span>'}
    `;
    btn.addEventListener('click', () => seleccionarProyecto(tipo, proyecto.id));
    proyectosGrid.appendChild(btn);
  });
  proyectosGrid.classList.add('visible');
}

// Carga un proyecto en el visor. Si el proyecto tiene `modelo3d: true` en
// portafolio-data.js, se muestra en el visor de modelos 3D (<model-viewer>,
// para archivos .glb de fotogrametría); si no, se muestra en el iframe de
// siempre (tours 360°, PDFs, videos).
function cargarEnVisor(proyecto) {
  const esModelo3D = proyecto.modelo3d === true;
  const esPdfDrive = !esModelo3D && proyecto.url.includes('drive.google.com');

  visorContenedor.classList.toggle('visor-vertical', proyecto.vertical === true);

  // El zoom siempre arranca en 100% con cada proyecto nuevo que se carga.
  zoomNivel = 1;
  aplicarZoom();
  zoomControles.classList.toggle('visible', esPdfDrive);

  if (esModelo3D) {
    visorScroll.classList.remove('activo');
    iframeVisor.removeAttribute('src');
    modelVisor.setAttribute('src', proyecto.url);
    modelVisor.classList.add('activo');
  } else {
    modelVisor.classList.remove('activo');
    modelVisor.removeAttribute('src');
    if (visorScroll.classList.contains('activo')) {
      iframeVisor.style.opacity = '0';
      setTimeout(() => {
        iframeVisor.src = proyecto.url;
        iframeVisor.style.opacity = '1';
      }, 300);
    } else {
      iframeVisor.src = proyecto.url;
    }
    visorScroll.classList.add('activo');
  }

  portadaVisor.classList.add('oculto');
}

function seleccionarProyecto(tipo, id) {
  activoPorTipo[tipo] = id;
  const proyecto = obtenerProyectoActivo(tipo);
  cargarEnVisor(proyecto);
  renderizarGrid(tipo);
  actualizarUrl(tipo, id);
}

botonesPestana.forEach(boton => {
  boton.addEventListener('click', () => {
    botonesPestana.forEach(b => b.classList.remove('activa'));
    boton.classList.add('activa');

    const tipo = boton.dataset.tipo;
    const proyecto = obtenerProyectoActivo(tipo);

    renderizarGrid(tipo);

    // Si el visor ya estaba activo (el usuario ya había hecho clic en
    // "Iniciar Visualización"), se actualiza de inmediato al cambiar de
    // pestaña; si todavía no se ha iniciado, se espera al clic del botón.
    if (visorScroll.classList.contains('activo') || modelVisor.classList.contains('activo')) {
      cargarEnVisor(proyecto);
      actualizarUrl(tipo, proyecto.id);
    }
  });
});

botonIniciar.addEventListener('click', () => {
  const tipoActivo = obtenerTipoActivo();
  const proyecto = obtenerProyectoActivo(tipoActivo);
  cargarEnVisor(proyecto);
  actualizarUrl(tipoActivo, proyecto.id);
});

// Si se llegó por un enlace directo (?tipo=...&p=...), se activa esa
// pestaña visualmente y se carga el visor de inmediato.
if (tipoValidoDesdeUrl) {
  botonesPestana.forEach(b => b.classList.toggle('activa', b.dataset.tipo === tipoValidoDesdeUrl));
}

// Cuadrícula inicial (Topografía por defecto, o la pestaña indicada en la URL)
renderizarGrid(tipoValidoDesdeUrl || 'topografia');

if (proyectoInicialDesdeUrl) {
  cargarEnVisor(proyectoInicialDesdeUrl);
}
