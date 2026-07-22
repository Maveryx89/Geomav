// ─────────────────────────────────────────────
// DATOS COMPARTIDOS DEL PORTAFOLIO
// Este archivo es la ÚNICA fuente de datos de todos los proyectos del
// portafolio (Topografía, Drones/Mapeo, Recorridos 360°, Time-Lapse).
// Lo usan tanto la portada (index.html) como las páginas dedicadas de
// cada categoría (topografia.html, drones-mapeo.html, etc.), así que
// cualquier proyecto que agregues aquí aparece automáticamente en ambos
// lugares — no hace falta tocar nada más.
//
// PARA AGREGAR UN NUEVO PROYECTO: agrega un objeto más al arreglo de la
// categoría correspondiente, con:
//   id        (único dentro de esa categoría)
//   titulo    (nombre del proyecto)
//   ubicacion (ciudad/región o referencia)
//   url       (enlace embebible del mapa/PDF/tour/video)
//   real      (true si ya es un proyecto real, false si es ejemplo/placeholder)
//   icono     (opcional, un emoji; si se omite usa el ícono por defecto de la categoría)
// ─────────────────────────────────────────────

const proyectosPortafolio = {
  topografia: [
    {
      id: 'plano-real-1',
      titulo: 'Plano Topográfico',
      ubicacion: 'Documento PDF',
      // Enlace de Google Drive convertido a formato "preview" para poder
      // embeberlo (incluye zoom nativo del visor de Google).
      url: 'https://drive.google.com/file/d/1nS63Jp2wjZUknOJXReWGOUaiTkc49moz/preview',
      real: true,
      icono: '📄'
    },
    {
      id: 'plano-real-2',
      titulo: 'Plano de Subdivisión',
      ubicacion: 'Documento PDF',
      url: 'https://drive.google.com/file/d/1stbt6yNY7TZmAFCiekQeuoQi3d0lbVTq/preview',
      real: true,
      icono: '📄'
    }
  ],
  drones: [
    {
      id: 'ejemplo-drones-1',
      titulo: 'Mapeo Agrícola (ejemplo)',
      ubicacion: 'Demo',
      url: 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d-71.22!3d-35.42!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1ses!2scl!4v1717145000000!5m2!1ses!2scl',
      real: false
    },
    {
      id: 'ejemplo-drones-2',
      titulo: 'Ortomosaico Industrial (ejemplo)',
      ubicacion: 'Demo',
      url: 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d-72.60!3d-36.82!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1ses!2scl!4v1717147000000!5m2!1ses!2scl',
      real: false
    }
  ],
  tours: [
    {
      id: 'porticos-ohiggins',
      titulo: 'Pórticos',
      ubicacion: "Región de O'Higgins",
      url: 'https://porticos-region-ohhiggins-rev2.netlify.app/',
      real: true,
      icono: '🏠'
    },
    {
      id: 'ejemplo-comercial',
      titulo: 'Edificio Comercial (ejemplo)',
      ubicacion: 'Demo Matterport',
      url: 'https://my.matterport.com/show/?m=SX97bx7Y663',
      real: false,
      icono: '🏢'
    }
  ],
  // ⚠️ RECOMENDACIÓN: sube los videos a YouTube como "No listado" (no
  // aparecen en búsquedas ni en tu canal, pero sí se pueden ver por link
  // o embebidos aquí). Copia el ID del video (lo que va después de
  // "watch?v=" en la URL) y arma el enlace con este formato:
  // https://www.youtube.com/embed/TU_ID_DE_VIDEO
  timelapse: [
    {
      id: 'cesfam-chillan-viejo',
      titulo: 'Cesfam Chillán Viejo',
      ubicacion: 'Chillán Viejo',
      url: 'https://www.youtube.com/embed/6lobJwTEWnQ',
      real: true,
      icono: '🎥'
    },
    {
      id: 'cesfam-curanipe',
      titulo: 'Cesfam Curanipe',
      ubicacion: 'Curanipe',
      url: 'https://www.youtube.com/embed/-BHIaDkDM04',
      real: true,
      icono: '🎥'
    },
    {
      id: 'cesfam-rauco',
      titulo: 'Cesfam Rauco',
      ubicacion: 'Rauco',
      url: 'https://www.youtube.com/embed/hLjBnSkuS3M',
      real: true,
      icono: '🎥'
    }
  ]
};

// Íconos por defecto según la pestaña, usados si el proyecto no define uno propio
const iconosPorTipo = { topografia: '📐', drones: '🛸', tours: '🏠', timelapse: '🎥' };
