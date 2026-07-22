// ─────────────────────────────────────────────
// PORTAFOLIO EN LA PORTADA (widget de pestañas + visor)
// Requiere que /assets/js/portafolio-data.js esté cargado antes que este
// archivo (define proyectosPortafolio e iconosPorTipo).
// Solo se usa en index.html.
// ─────────────────────────────────────────────

const botonesPestana = document.querySelectorAll('.pestana-boton');
const iframeVisor = document.getElementById('iframeVisor');
const portadaVisor = document.getElementById('portadaVisor');
const botonIniciar = document.getElementById('botonIniciarVisor');
const proyectosGrid = document.getElementById('toursGrid');

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

function seleccionarProyecto(tipo, id) {
  activoPorTipo[tipo] = id;
  const proyecto = obtenerProyectoActivo(tipo);
  cargarEnVisor(proyecto.url);
  renderizarGrid(tipo);
}

botonesPestana.forEach(boton => {
  boton.addEventListener('click', () => {
    botonesPestana.forEach(b => b.classList.remove('activa'));
    boton.classList.add('activa');

    const tipo = boton.dataset.tipo;
    const proyecto = obtenerProyectoActivo(tipo);

    renderizarGrid(tipo);

    if (iframeVisor.classList.contains('activo')) {
      iframeVisor.style.opacity = '0';
      setTimeout(() => {
        iframeVisor.src = proyecto.url;
        iframeVisor.style.opacity = '1';
      }, 300);
    }
  });
});

botonIniciar.addEventListener('click', () => {
  const tipoActivo = obtenerTipoActivo();
  const proyecto = obtenerProyectoActivo(tipoActivo);
  cargarEnVisor(proyecto.url);
});

// Cuadrícula inicial (la pestaña Topografía está activa por defecto al cargar)
renderizarGrid('topografia');
