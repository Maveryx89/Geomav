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
  if (el.dataset.animado === 'true') return;
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
