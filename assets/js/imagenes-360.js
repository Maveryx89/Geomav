// ─────────────────────────────────────────────
// PORTAFOLIO · IMÁGENES 360°
// Usado solo por portafolio/imagenes-360.html.
//
// A diferencia de las otras categorías (que salen de portafolio-data.js),
// estos proyectos se cargan desde el panel /360/panel/ y viven en Supabase:
//   · públicos  → se listan aquí para cualquier visitante
//   · privados  → solo aparecen si la página se abre con ?v=clave y el
//                 enlace no ha vencido (lo decide el servidor)
// Una vez armada la lista, se carga pagina-categoria.js, que dibuja las
// tarjetas y el visor igual que en el resto del portafolio.
// ─────────────────────────────────────────────
(function () {
  const SB = 'https://xoorsgrgptxvqtfaqdfw.supabase.co';
  const KEY = 'sb_publishable_JsifPijoGET8d5aZwcvHFg_YtTIGyN8';
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

  const grid = document.getElementById('galeriaGrid');
  const contador = document.getElementById('galeriaContador');
  const visor = document.querySelector('.visor-contenedor');
  const aviso = document.getElementById('avisoPrivado');

  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fecha = iso => { const d = new Date(iso); return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear(); };
  const urlVisor = clave => '../360/?k=' + clave;

  const params = new URLSearchParams(location.search);
  const clavePrivada = (params.get('v') || '').toLowerCase();

  async function publicos() {
    const r = await fetch(SB + '/rest/v1/p360_proyectos?select=id,titulo,ubicacion,clave,vertical,p360_imagenes!inner(id)&order=orden.asc,creado.desc', { headers: H });
    if (!r.ok) throw new Error('http' + r.status);
    return (await r.json()).map(p => ({
      id: p.id, titulo: esc(p.titulo), ubicacion: esc(p.ubicacion || 'Imágenes 360°'),
      url: urlVisor(p.clave), real: true, vertical: p.vertical === true
    }));
  }

  async function privado() {
    if (!/^[a-z0-9]{20,40}$/.test(clavePrivada)) return null;
    const r = await fetch(SB + '/rest/v1/rpc/p360_ver', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: JSON.stringify({ k: clavePrivada }) });
    if (!r.ok) throw new Error('http' + r.status);
    const p = await r.json();
    if (!p || p.publico || !Array.isArray(p.imagenes) || !p.imagenes.length) return null;
    return {
      id: 'privado', titulo: esc(p.titulo), icono: '🔒',
      ubicacion: 'Acceso privado' + (p.vence ? ' · disponible hasta el ' + fecha(p.vence) : ''),
      url: urlVisor(clavePrivada), real: true, vertical: p.vertical === true
    };
  }

  function mensaje(texto) {
    if (visor) visor.style.display = 'none';
    if (contador) contador.textContent = '';
    grid.innerHTML = '<p style="grid-column:1/-1; color:var(--color-muted); padding:24px 0;">' + texto + '</p>';
  }

  Promise.all([publicos(), clavePrivada ? privado().catch(() => null) : Promise.resolve(null)]).then(([lista, priv]) => {
    if (clavePrivada && !priv && aviso) aviso.hidden = false;
    if (priv) {
      lista.unshift(priv);
      // Con enlace privado se abre directo el proyecto del cliente.
      if (!params.get('p')) { params.set('p', 'privado'); history.replaceState(null, '', location.pathname + '?' + params.toString()); }
    }
    if (!lista.length) { mensaje('Pronto publicaremos imágenes 360° de nuestros proyectos.'); return; }
    proyectosPortafolio.imagenes360 = lista;
    iconosPorTipo.imagenes360 = '🌐';
    const s = document.createElement('script');
    s.src = '../assets/js/pagina-categoria.js';
    document.body.appendChild(s);
  }).catch(() => mensaje('No se pudieron cargar las imágenes 360°. Inténtalo de nuevo en unos minutos.'));
})();
