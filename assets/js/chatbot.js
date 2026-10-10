// ─────────────────────────────────────────────
// ASISTENTE GEOMAV (bot de preguntas frecuentes)
// Sin IA y sin servidor: respuestas fijas y revisadas, botones + palabras clave.
// Se carga en la portada y en la sección Aprende. Estilos: .gbot-* en estilo.css.
// Las rutas se calculan desde la ubicación de este mismo script, así funciona
// igual desde la raíz y desde /aprende/.
// ─────────────────────────────────────────────
(function asistenteGeomav() {
  if (document.getElementById('gbot-lanzador')) return;

  const WA_NUMERO = '56984867813';
  const BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? new URL('../../', s).href : '/';
  })();
  const url = (ruta) => BASE + ruta;

  const tituloPagina = (document.title || '').split('|')[0].split('—')[0].trim();
  const paginaGenerica = !tituloPagina || /^geomav$/i.test(tituloPagina);

  function enlaceWA(motivo) {
    let t = 'Hola GEOMAV, ' + (motivo || 'necesito ayuda con un proyecto') + '.';
    if (!paginaGenerica) t += ' (Escribo desde la página «' + tituloPagina + '»)';
    return 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(t);
  }

  // ── Guías de Aprende: palabras clave → artículo ─────────────────
  const GUIAS = [
    { f: 'ley-sabag.html', t: 'Ley Sabag (subdivisión rural)', k: ['sabag', '19807', 'subdivision rural', 'subdividir parcela', 'parcelas de agrado', 'subdivision predio rural', 'subdividir', 'subdivision', 'parcela'] },
    { f: 'decreto-ley-3516.html', t: 'DL 3.516 (predios rústicos)', k: ['3516', 'predios rusticos', 'predio rustico', 'subdividir campo', 'sag subdivision', 'subdividir', 'subdivision', 'predio'] },
    { f: 'dl-2695-saneamiento-titulos.html', t: 'DL 2.695 (saneamiento de títulos)', k: ['2695', 'saneamiento', 'sin titulo', 'regularizar titulo', 'bienes nacionales', 'pequena propiedad'] },
    { f: 'ley-del-mono.html', t: 'Ley del Mono', k: ['ley del mono', 'mono', '20898', 'casa sin permiso', 'regularizar casa', 'construccion sin permiso', 'recepcion final'] },
    { f: 'fusion-y-subdivision-simultanea.html', t: 'Fusión y subdivisión simultánea', k: ['fusion', 'fusionar', 'subdivision y fusion', 'unir terrenos', 'unir predios'] },
    { f: 'regularizar-ampliacion-reciente.html', t: 'Regularizar una ampliación', k: ['ampliacion', 'ampliar casa', 'regularizar ampliacion'] },
    { f: 'diferencia-cabida-rectificacion-titulo.html', t: 'Diferencia de cabida', k: ['cabida', 'superficie no coincide', 'titulo no coincide', 'rectificacion', 'metros no calzan'] },
    { f: 'deslindes.html', t: 'Deslindes', k: ['deslinde', 'deslindes', 'limites del terreno', 'limites de mi terreno'] },
    { f: 'demarcacion-y-cerramiento.html', t: 'Demarcación y cerramiento', k: ['demarcacion', 'cerramiento', 'cerco', 'vecino corrio', 'vecino me ocupa'] },
    { f: 'prescripcion-adquisitiva-terreno.html', t: 'Prescripción adquisitiva', k: ['prescripcion', 'usucapion', 'ocupo hace anos', 'posesion de terreno'] },
    { f: 'particion-herencia-terrenos.html', t: 'Partición de herencia con terrenos', k: ['herencia', 'particion', 'posesion efectiva', 'sucesion', 'heredar terreno'] },
    { f: 'extraccion-aridos-rios-doh.html', t: 'Extracción de áridos (DOH)', k: ['aridos', 'extraccion de aridos', 'ripio', 'extraer arena'] },
    { f: 'deslindes-predios-riberenos.html', t: 'Deslindes de predios ribereños', k: ['riberen', 'ribera', 'cauce', 'rio', 'estero', 'doh'] },
    { f: 'zona-riesgo-inundacion-doh.html', t: 'Zonas de riesgo de inundación', k: ['inundacion', 'zona de riesgo', 'crecida', 'anegamiento'] },
    { f: 'plan-de-manejo-forestal.html', t: 'Plan de manejo forestal', k: ['forestal', 'conaf', 'bosque nativo', 'tala', 'plan de manejo', 'plantacion'] },
    { f: 'informe-factibilidad-construcciones-ifc.html', t: 'Informe de Factibilidad (IFC)', k: ['ifc', 'factibilidad', 'construir en campo', 'construccion en terreno agricola', 'art 55', 'articulo 55'] },
    { f: 'fondo-tierras-conadi.html', t: 'Fondo de Tierras CONADI', k: ['conadi', 'fondo de tierras', 'tierras indigenas'] },
    { f: 'certificado-informaciones-previas.html', t: 'Certificado de Informaciones Previas (CIP)', k: ['cip', 'informaciones previas', 'certificado de informaciones'] },
    { f: 'trazado-replanteo-obra.html', t: 'Trazado y replanteo de obra', k: ['replanteo', 'trazado', 'estacado', 'marcar obra'] },
    { f: 'plano-regulador-vs-topografico.html', t: 'Plano regulador vs. topográfico', k: ['plano regulador', 'plano topografico', 'diferencia plano'] },
    { f: 'que-es-fotogrametria.html', t: 'Qué es la fotogrametría con drones', k: ['fotogrametria'] },
    { f: 'ortomosaico-vs-foto-aerea.html', t: 'Ortomosaico vs. foto aérea', k: ['ortomosaico', 'foto aerea'] },
    { f: 'modelos-digitales-elevacion.html', t: 'Modelos digitales de elevación', k: ['dem', 'modelo digital', 'curvas de nivel', 'elevacion'] },
    { f: 'normativa-dgac-drones.html', t: 'Normativa DGAC para drones', k: ['dgac', 'permiso de vuelo', 'volar dron', 'normativa dron'] },
    { f: 'que-es-tour-virtual-360.html', t: 'Qué es un tour virtual 360°', k: ['que es un tour', 'tour virtual'] },
    { f: 'tour-360-vende-mas-rapido.html', t: 'Por qué un tour 360° vende más rápido', k: ['vender propiedad', 'vender mas rapido', 'inmobiliaria tour'] },
    { f: 'que-es-timelapse-obra.html', t: 'Qué es un time-lapse de obra', k: ['que es timelapse', 'que es time lapse'] },
    { f: 'timelapse-respaldo-legal.html', t: 'Time-lapse como respaldo legal', k: ['respaldo legal', 'evidencia de obra', 'registro de obra'] },
    { f: 'faja-caminos-publicos.html', t: 'Faja en caminos públicos (35 m)', k: ['camino publico', 'caminos publicos', 'faja de camino', 'faja de restriccion', 'vialidad', 'ley de caminos', 'ruta nacional', 'frente a camino'] },
    { f: 'faja-servidumbre-acueducto.html', t: 'Faja de servidumbre de canal', k: ['canal', 'acueducto', 'servidumbre de canal', 'servidumbre de acueducto', 'regadio', 'codigo de aguas', 'faja de canal'] },
    { f: 'fiscalizacion-loteos-rurales-oficio-637.html', t: 'Fiscalización de loteos rurales (Oficio 637)', k: ['oficio 637', '637', 'loteo', 'loteos', 'loteo encubierto', 'parcelas de agrado', 'fiscalizacion'] },
    { f: 'servidumbre-electrica-lineas.html', t: 'Servidumbre eléctrica (alta tensión)', k: ['servidumbre electrica', 'alta tension', 'linea electrica', 'lineas electricas', 'tendido electrico', 'torre electrica', 'poste de luz'] }
  ];
  const guiaUrl = (g) => url('aprende/' + g.f);

  // ── Temas con respuesta fija ────────────────────────────────────
  const L = {
    topo: { t: 'Ver Topografía', h: url('portafolio/topografia.html') },
    drones: { t: 'Ver Drones y mapeo', h: url('portafolio/drones-mapeo.html') },
    tours: { t: 'Ver Recorridos 360°', h: url('portafolio/recorridos-360.html') },
    time: { t: 'Ver Time-lapse de obra', h: url('portafolio/timelapse-obra.html') },
    aprende: { t: 'Ir a la sección Aprende', h: url('aprende/index.html') },
    alianzas: { t: 'Ver Alianzas', h: url('alianzas/index.html') }
  };

  const TEMAS = {
    servicios: {
      r: '<strong>GEOMAV ofrece 4 líneas de servicio:</strong><ul><li><strong>Topografía técnica:</strong> levantamientos, planos, deslindes y replanteo de obra.</li><li><strong>Fotogrametría con drones:</strong> ortomosaicos y modelos de terreno.</li><li><strong>Recorridos virtuales 360°:</strong> para vender o mostrar propiedades y obras.</li><li><strong>Time-lapse de obra:</strong> registro del avance y respaldo.</li></ul>¿Cuál te interesa?',
      l: [L.topo, L.drones, L.tours, L.time],
      k: ['servicio', 'que hacen', 'que ofrecen', 'trabajos', 'a que se dedican']
    },
    topografia: {
      r: '<strong>Topografía técnica:</strong> levantamientos de terreno, planos, deslindes y replanteo de obra. Es la base para subdivisiones, regularizaciones y proyectos de construcción.',
      l: [L.topo],
      k: ['topografia', 'topografo', 'levantamiento', 'plano', 'planos', 'medir terreno', 'medicion', 'curvas']
    },
    drones: {
      r: '<strong>Fotogrametría con drones:</strong> ortomosaicos y modelos digitales de elevación, útiles para terrenos grandes, cálculos de volumen y seguimiento de obras.',
      l: [L.drones],
      k: ['dron', 'drones', 'ortofoto', 'mapeo', 'volumen', 'aereo']
    },
    tours: {
      r: '<strong>Recorridos virtuales 360°:</strong> tours navegables de propiedades, parcelas, obras o locales, listos para compartir por link.',
      l: [L.tours],
      k: ['360', 'recorrido', 'tour', 'virtual', 'matterport', 'recorrido virtual']
    },
    timelapse: {
      r: '<strong>Time-lapse de obra:</strong> cámara fija que registra el avance de la construcción. Sirve para comunicar y también como respaldo documental.',
      l: [L.time],
      k: ['timelapse', 'time lapse', 'avance de obra', 'camara de obra']
    },
    cobertura: {
      r: '<strong>Zona de trabajo habitual:</strong> centro-sur de Chile, principalmente las regiones del <strong>Maule</strong> y de <strong>O’Higgins</strong>. Si tu terreno está en otra zona, escríbenos y lo evaluamos.',
      l: [],
      wa: 'quiero consultar si cubren mi zona',
      k: ['zona', 'cobertura', 'donde', 'cubren', 'atienden', 'region', 'talca', 'curico', 'linares', 'rancagua', 'maule', 'ohiggins', 'chillan', 'comuna']
    },
    cotizar: {
      r: '<strong>Para cotizar</strong> necesitamos, idealmente:<ul><li>Ubicación (comuna y sector, o rol del predio)</li><li>Qué necesitas (plano, subdivisión, deslindes, vuelo, tour…)</li><li>Superficie aproximada y plazo</li><li>Título o plano anterior, si existe</li></ul>Mándalo por WhatsApp y te respondemos con una propuesta.',
      l: [],
      wa: 'quiero cotizar un trabajo',
      k: ['cotiz', 'precio', 'valor', 'cuanto cuesta', 'cuanto sale', 'presupuesto', 'tarifa', 'costo']
    },
    perito: {
      r: '<strong>Perito Judicial habilitado</strong> (bienio 2026-2027) ante las Cortes de Apelaciones de <strong>Rancagua, Talca y Chillán</strong>. Realizamos informes periciales topográficos para causas por deslindes, ocupaciones y otros conflictos de terreno.',
      l: [],
      wa: 'necesito un informe pericial topográfico',
      k: ['perito', 'pericial', 'peritaje', 'juicio', 'tribunal', 'corte', 'judicial', 'demanda']
    },
    contacto: {
      r: '<strong>Contacto:</strong> lo más rápido es WhatsApp (+56 9 8486 7813). También puedes escribir por correo a <strong>mverdugoa89@gmail.com</strong> o usar el formulario de la portada. Te respondemos a la brevedad.',
      l: [],
      wa: 'quiero hacer una consulta',
      k: ['contacto', 'telefono', 'whatsapp', 'correo', 'mail', 'email', 'llamar', 'hablar con', 'horario', 'horarios', 'atencion', 'cuando atienden']
    },
    alianzas: {
      r: 'Trabajamos con <strong>profesionales aliados</strong> para los trámites legales que acompañan a la topografía (por ejemplo, un abogado especialista en propiedad).',
      l: [L.alianzas],
      k: ['abogado', 'alianza', 'alianzas', 'legal', 'asesoria legal']
    },
    aprende: {
      r: 'En <strong>Aprende</strong> publicamos guías claras sobre subdivisión de predios, regularización de propiedad, deslindes, trámites ante DOH y SAG, drones, tours 360° y más. Escribe tu tema (ej. “herencia”, “Ley Sabag”, “deslindes”) y te llevo a la guía.',
      l: [L.aprende],
      k: ['aprende', 'guia', 'guias', 'articulo', 'articulos', 'tramite', 'regularizar', 'subdividir', 'subdivision', 'ley']
    },
    saludo: {
      r: '¡Hola! 👋 Cuéntame qué necesitas o elige una opción del menú.',
      l: [],
      k: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches']
    },
    gracias: {
      r: '¡Con gusto! Si quieres avanzar con tu proyecto, el siguiente paso es escribirnos por WhatsApp.',
      l: [],
      wa: 'quiero avanzar con mi proyecto',
      k: ['gracias', 'muchas gracias', 'ok gracias']
    }
  };

  const MENU = [
    ['Servicios', 'servicios'],
    ['Zonas de cobertura', 'cobertura'],
    ['Quiero cotizar', 'cotizar'],
    ['Perito Judicial', 'perito'],
    ['Guías de Aprende', 'aprende'],
    ['Contacto y horarios', 'contacto']
  ];

  // ── Utilidades ──────────────────────────────────────────────────
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  function puntuar(texto, claves) {
    const t = ' ' + texto + ' ';
    let p = 0;
    for (const c of claves) {
      const cn = norm(c);
      if (!cn) continue;
      if (cn.length <= 3 || /^\d+$/.test(cn)) { if (t.includes(' ' + cn + ' ')) p += 3; }
      else if (t.includes(cn)) p += cn.length >= 8 ? 4 : 2;
    }
    return p;
  }

  function buscar(textoUsuario) {
    const t = norm(textoUsuario);
    if (!t) return null;
    const guias = GUIAS.map((g) => ({ g, p: puntuar(t, g.k) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p);
    const temas = Object.keys(TEMAS).map((id) => ({ id, p: puntuar(t, TEMAS[id].k) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p);
    // Una guía específica gana sobre un tema genérico (peso x2)
    if (guias.length && (!temas.length || guias[0].p * 2 >= temas[0].p)) return { tipo: 'guias', guias: guias.slice(0, 3).map((x) => x.g) };
    if (temas.length) return { tipo: 'tema', id: temas[0].id };
    return null;
  }

  // ── Interfaz ────────────────────────────────────────────────────
  const ICONO_BOT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a1 1 0 0 1 1 1v1.1A7 7 0 0 1 19 11v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-1a7 7 0 0 1 6-6.9V3a1 1 0 0 1 1-1Zm-4 8a2 2 0 0 0-2 2v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5a2 2 0 0 0-2-2H8Zm1.5 2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm5 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"/></svg>';
  const ICONO_CERRAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/></svg>';
  const ICONO_ENVIAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>';

  const lanzador = document.createElement('button');
  lanzador.id = 'gbot-lanzador';
  lanzador.className = 'gbot-lanzador';
  lanzador.type = 'button';
  lanzador.setAttribute('aria-label', 'Abrir asistente de GEOMAV');
  lanzador.setAttribute('aria-expanded', 'false');
  lanzador.setAttribute('aria-controls', 'gbot-panel');
  lanzador.innerHTML = ICONO_BOT + '<span class="gbot-lanzador-texto">¿Dudas?</span>';

  const panel = document.createElement('section');
  panel.id = 'gbot-panel';
  panel.className = 'gbot-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Asistente de GEOMAV');
  panel.innerHTML =
    '<header class="gbot-cabecera">' +
      '<div class="gbot-cabecera-info"><span class="gbot-avatar">' + ICONO_BOT + '</span>' +
      '<div><strong>Asistente GEOMAV</strong><small>Respuestas rápidas</small></div></div>' +
      '<button type="button" class="gbot-cerrar" aria-label="Cerrar asistente">' + ICONO_CERRAR + '</button>' +
    '</header>' +
    '<div class="gbot-mensajes" role="log" aria-live="polite"></div>' +
    '<div class="gbot-atajos"></div>' +
    '<form class="gbot-form" autocomplete="off">' +
      '<input type="text" class="gbot-entrada" placeholder="Escribe tu consulta…" maxlength="200" aria-label="Escribe tu consulta">' +
      '<button type="submit" class="gbot-enviar" aria-label="Enviar">' + ICONO_ENVIAR + '</button>' +
    '</form>' +
    '<p class="gbot-aviso">Información general. No reemplaza la asesoría profesional.</p>';

  document.body.appendChild(lanzador);
  document.body.appendChild(panel);

  const $mensajes = panel.querySelector('.gbot-mensajes');
  const $atajos = panel.querySelector('.gbot-atajos');
  const $form = panel.querySelector('.gbot-form');
  const $entrada = panel.querySelector('.gbot-entrada');
  let iniciado = false;

  function bajar() { $mensajes.scrollTop = $mensajes.scrollHeight; }

  function msgUsuario(texto) {
    const d = document.createElement('div');
    d.className = 'gbot-msg gbot-msg-usuario';
    d.textContent = texto;
    $mensajes.appendChild(d);
    bajar();
  }

  function chip(texto, href, clase) {
    const a = document.createElement('a');
    a.className = 'gbot-chip' + (clase ? ' ' + clase : '');
    a.href = href;
    a.textContent = texto;
    if (/^https?:\/\/wa\.me/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }

  function msgBot(html, enlaces, wa) {
    const d = document.createElement('div');
    d.className = 'gbot-msg gbot-msg-bot';
    const c = document.createElement('div');
    c.innerHTML = html;
    d.appendChild(c);
    const acciones = [];
    (enlaces || []).forEach((l) => acciones.push(chip(l.t, l.h)));
    if (wa) acciones.push(chip('Escribir por WhatsApp', enlaceWA(wa), 'gbot-chip-wa'));
    if (acciones.length) {
      const f = document.createElement('div');
      f.className = 'gbot-chips';
      acciones.forEach((a) => f.appendChild(a));
      d.appendChild(f);
    }
    $mensajes.appendChild(d);
    bajar();
  }

  function pintarAtajos() {
    $atajos.innerHTML = '';
    MENU.forEach(([texto, id]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gbot-atajo';
      b.textContent = texto;
      b.addEventListener('click', () => { msgUsuario(texto); responderTema(id); });
      $atajos.appendChild(b);
    });
  }

  function responderTema(id) {
    const t = TEMAS[id];
    msgBot(t.r, t.l, t.wa);
  }

  function responderTexto(texto) {
    const res = buscar(texto);
    if (!res) {
      msgBot('No encontré una respuesta exacta para eso. Puedes elegir una opción del menú o consultarlo directo por WhatsApp para una respuesta personalizada.', [L.aprende], 'tengo una consulta: «' + texto.slice(0, 120) + '»');
    } else if (res.tipo === 'guias') {
      const lista = res.guias.map((g) => ({ t: g.t, h: guiaUrl(g) }));
      msgBot('Esto puede ayudarte. Estas guías de <strong>Aprende</strong> tratan tu tema:', lista, 'tengo una consulta sobre ' + res.guias[0].t);
    } else {
      responderTema(res.id);
    }
  }

  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    msgBot('¡Hola! 👋 Soy el asistente de <strong>GEOMAV</strong>. ¿En qué puedo ayudarte?');
    pintarAtajos();
  }

  function abrir() {
    panel.hidden = false;
    lanzador.classList.add('gbot-oculto');
    lanzador.setAttribute('aria-expanded', 'true');
    iniciar();
    setTimeout(() => $entrada.focus({ preventScroll: true }), 50);
  }
  function cerrar() {
    panel.hidden = true;
    lanzador.classList.remove('gbot-oculto');
    lanzador.setAttribute('aria-expanded', 'false');
    lanzador.focus({ preventScroll: true });
  }

  lanzador.addEventListener('click', abrir);
  panel.querySelector('.gbot-cerrar').addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) cerrar(); });
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $entrada.value.trim();
    if (!v) return;
    $entrada.value = '';
    msgUsuario(v);
    responderTexto(v);
  });
})();
