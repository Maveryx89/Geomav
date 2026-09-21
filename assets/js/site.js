// ─────────────────────────────────────────────
// COMPORTAMIENTO GENERAL DEL SITIO
// Compartido por todas las páginas: portada y las páginas de categoría
// del portafolio (Topografía, Drones/Mapeo, Recorridos 360°, Time-Lapse).
// Maneja: cabecera al hacer scroll, menú móvil, submenú de Portafolio
// (desplegable en escritorio al pasar el mouse, acordeón en móvil),
// efecto de revelación al hacer scroll y animación de contadores.
// ─────────────────────────────────────────────

// 1. Cabecera con fondo al hacer scroll
const cabecera = document.getElementById('cabeceraPrincipal');
if (cabecera) {
  window.addEventListener('scroll', () => {
    cabecera.classList.toggle('cabecera-activa', window.scrollY > 50);
  });
}

// 2. Menú móvil (overlay a pantalla completa)
const botonMenu = document.getElementById('botonMenuMovil');
const menuOverlay = document.getElementById('menuOverlay');
const cerrarMenu = document.getElementById('cerrarMenuMovil');

function abrirMenuMovil() {
  menuOverlay.classList.add('abierto');
  document.body.classList.add('menu-abierto'); // bloquea el scroll de fondo
  botonMenu.setAttribute('aria-expanded', 'true');
  botonMenu.style.visibility = 'hidden'; // evita que quede encima de la X al cerrar
  cerrarMenu.focus();
}

function cerrarMenuMovil() {
  menuOverlay.classList.remove('abierto');
  document.body.classList.remove('menu-abierto');
  botonMenu.setAttribute('aria-expanded', 'false');
  botonMenu.style.visibility = 'visible';
  botonMenu.focus();
}

if (botonMenu && menuOverlay && cerrarMenu) {
  botonMenu.addEventListener('click', abrirMenuMovil);
  cerrarMenu.addEventListener('click', cerrarMenuMovil);

  // Cerrar el menú móvil con la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOverlay.classList.contains('abierto')) {
      cerrarMenuMovil();
    }
  });

  document.querySelectorAll('.overlay-enlace').forEach(enlace => {
    enlace.addEventListener('click', cerrarMenuMovil);
  });
}

// 3. Submenú de "Portafolio" dentro del menú móvil (acordeón, ya que en
// móvil no existe el hover que sí se usa en el submenú de escritorio).
const toggleSubmenuMovil = document.getElementById('toggleSubmenuMovil');
const submenuMovil = document.getElementById('submenuMovil');
if (toggleSubmenuMovil && submenuMovil) {
  toggleSubmenuMovil.addEventListener('click', () => {
    const abierto = submenuMovil.classList.toggle('abierto');
    toggleSubmenuMovil.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
}

// 4. Efecto de Revelación (Intersection Observer)
const opcionesRevelar = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
const observadorRevelar = new IntersectionObserver((entradas) => {
  entradas.forEach(entrada => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('revelar-visible');
      // Si el elemento tiene contadores, iniciarlos
      const contadores = entrada.target.querySelectorAll('.beneficio-metrica');
      contadores.forEach(cont => animarContador(cont));
    }
  });
}, opcionesRevelar);

document.querySelectorAll('.revelar').forEach(el => observadorRevelar.observe(el));

// 5. Animación de Contadores Numéricos (usa data-objetivo / data-prefijo / data-sufijo)
function animarContador(el) {
  if (el.dataset.animado === 'true' || !el.dataset.objetivo) return;
  const objetivo = parseInt(el.dataset.objetivo, 10);
  const prefijo = el.dataset.prefijo || '';
  const sufijo = el.dataset.sufijo || '';
  const duracion = 2000;
  const incremento = objetivo / (duracion / 16);
  let actual = 0;

  const actualizar = () => {
    actual += incremento;
    if (actual < objetivo) {
      el.textContent = prefijo + Math.floor(actual) + sufijo;
      requestAnimationFrame(actualizar);
    } else {
      el.textContent = prefijo + objetivo + sufijo;
      el.dataset.animado = 'true';
    }
  };
  actualizar();
}

// 6. Botón flotante de WhatsApp (se inyecta en todas las páginas que cargan este script).
// El mensaje prellenado incluye el título de la página, para saber desde qué
// artículo o sección llegó el contacto. Se oculta mientras la sección de
// contacto de la portada está a la vista (ahí ya hay botones de WhatsApp).
(function botonWhatsApp() {
  if (document.querySelector('.wa-flotante')) return;
  const titulo = (document.title || '').split('|')[0].split('—')[0].trim();
  const esGenerica = !titulo || /^geomav$/i.test(titulo);
  const texto = esGenerica
    ? 'Hola GEOMAV, necesito ayuda con un proyecto.'
    : 'Hola GEOMAV, vengo de la página «' + titulo + '» y necesito ayuda con un proyecto.';

  const enlace = document.createElement('a');
  enlace.className = 'wa-flotante';
  enlace.href = 'https://wa.me/56984867813?text=' + encodeURIComponent(texto);
  enlace.target = '_blank';
  enlace.rel = 'noopener noreferrer';
  enlace.setAttribute('aria-label', 'Escribir a GEOMAV por WhatsApp');
  enlace.title = 'Escríbenos por WhatsApp';
  enlace.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.2 4.79 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m5.98 14.02c-.25.71-1.45 1.36-2 1.44-.51.08-1.15.11-1.86-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07s.76-2.18 1.03-2.48c.27-.29.59-.36.79-.36l.56.01c.18.01.42-.07.66.5.25.6.84 2.07.91 2.22.07.15.12.33.02.53-.09.2-.14.32-.28.5-.14.17-.29.38-.42.51-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.87.27.13.45.2.51.31.07.11.07.65-.18 1.36Z"/></svg>';
  document.body.appendChild(enlace);

  const contacto = document.getElementById('contacto');
  if (contacto && 'IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      entradas.forEach(e => enlace.classList.toggle('wa-oculto', e.isIntersecting));
    }, { threshold: 0.25 }).observe(contacto);
  }
})();

// 7. Carga diferida del visor 3D (<model-viewer>, ~1 MB desde unpkg).
// Antes se descargaba en cada visita desde el <head>; ahora solo se pide cuando
// se abre un proyecto con `modelo3d: true`. El elemento <model-viewer> del HTML
// se "activa" solo al definirse el componente, así que basta con inyectar el script.
let _promesaModelViewer = null;
function cargarModelViewer() {
  if (window.customElements && customElements.get('model-viewer')) return Promise.resolve();
  if (_promesaModelViewer) return _promesaModelViewer;
  _promesaModelViewer = new Promise((resolver, rechazar) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    script.onload = resolver;
    script.onerror = () => { _promesaModelViewer = null; rechazar(new Error('No se pudo cargar el visor 3D')); };
    document.head.appendChild(script);
  });
  return _promesaModelViewer;
}

