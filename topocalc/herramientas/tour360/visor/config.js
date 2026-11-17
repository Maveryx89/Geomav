/* Configuración de marca y comportamiento del tour. Edita solo este archivo. */
window.TOUR_CONFIG = {
  // Textos de la interfaz
  title: 'Demo Tour 360 · GEOMAV',                      // vacío = usa el título del tour importado
  lang: {
    scenes: 'Escenas',
    search: 'Buscar escena…',
    share: 'Enlace copiado',
    noResults: 'Sin resultados',
    gyroDenied: 'No se pudo activar el giroscopio',
    openLink: 'Ver ubicación',
  },

  // Marca
  logo: '../../../_comun/logo-geomav.png',                       // ej. 'assets/logo.png' (pantalla de carga y barra superior)
  accent: '#1e88e5',              // color principal de la interfaz
  background: '#ffffff',          // fondo de la pantalla de carga

  // Comportamiento
  fov: 100,                       // campo de visión HORIZONTAL inicial (grados)
  maxVfov: 100,                   // tope del FOV vertical (útil en móviles en vertical)
  autorotate: false,              // giro automático al iniciar
  autorotateIdleMs: 0,            // >0 = inicia el giro tras N ms sin interacción
  transitionMs: 900,              // duración del fundido entre escenas
  sceneListOpen: false,           // menú lateral abierto al iniciar (escritorio)
  hotspotRadius: 1000,            // radio de proyección de hotspots (px)
  hotspotRollSign: 1,             // pon -1 si los textos/flechas del tour giran al revés
  zoomFactor: 3,                 // acercamiento máximo: 1 = hasta la nitidez 1:1; 2 = unos 20° de campo vertical; 3 = unos 13° (más pixelado)
};
