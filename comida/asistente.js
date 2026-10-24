'use strict';
/* ASISTENTE DE LA COCINA DE EMI — respuestas automáticas (sin IA, sin servidor).
   Botones + palabras clave. Las preguntas salen de los comentarios reales de los clientes en Facebook.
   Usa el menú publicado (window.__pub) para responder "¿qué hay hoy?", precio y si atienden. */
(() => {
  const pub = window.__pub; if (!pub) return;
  const WA = pub.w || '56986200429';
  const fmtTel = n => n.replace(/^56(9)(\d{4})(\d{4})$/, '+56 $1 $2 $3');
  const wa = t => 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola ' + (pub.n || 'La Cocina de Emi') + ', ' + t);
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const lc = t => t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
  const hoyS = () => iso(new Date());

  /* estado de un día: {m: menú|null, motivo: texto|null} */
  function estado(s) {
    const m = pubMenu(pub, s);
    if (!m) return {m: null, motivo: 'sin menú publicado'};
    if ((pub.b || []).includes(s)) return {m, motivo: 'ese día no hay atención'};
    if (feriado(s) && !(pub.f || {})[s]) return {m, motivo: 'es feriado (' + feriado(s) + ')'};
    return {m, motivo: null};
  }
  function proximos(n) {
    const out = [], base = new Date();
    for (let i = 0; i < 14 && out.length < n; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i), s = iso(d), e = estado(s);
      if (e.m && !e.motivo) out.push({s, d, m: e.m, i});
    }
    return out;
  }
  const platos = m => '<ul>' + m.i.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + (m.g ? '<small>Con:<br>' + esc(m.g).split(/\s*·\s*|\s*,\s*/).join('<br>') + '</small><br>' : '') + '<strong>' + money(m.p) + '</strong> por almuerzo.';
  const nomDia = (s, i) => (i === 0 ? 'Hoy ' : i === 1 ? 'Mañana ' : '') + fmtFecha(s);

  /* ---- respuestas ---- */
  const R = {
    hoy() {
      const s = hoyS(), e = estado(s);
      if (e.m && !e.motivo) return {h: '<strong>Menú de hoy, ' + fmtFecha(s) + ':</strong>' + platos(e.m), pedir: 1};
      const p = proximos(1)[0];
      return {h: 'Hoy ' + (e.motivo ? e.motivo : 'no hay menú') + '. ' + (p ? '<strong>Próximo almuerzo: ' + nomDia(p.s, p.i) + '</strong>' + platos(p.m) : 'Por ahora no hay menú publicado: escríbenos por WhatsApp.'), pedir: !!p, wa: p ? '' : 'quiero saber cuándo hay menú'};
    },
    semana() {
      const l = proximos(6);
      if (!l.length) return {h: 'Por ahora no hay menú publicado. Escríbenos por WhatsApp y te contamos.', wa: 'quiero saber el menú de la semana'};
      return {h: '<strong>Próximos almuerzos:</strong>' + l.map(x => '<p style="margin:6px 0 2px"><b>' + nomDia(x.s, x.i) + '</b></p><ul style="margin:0 0 0 18px;padding:0">' + x.m.i.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>').join('') + '<p style="margin:8px 0 0"><strong>' + money(l[0].m.p) + '</strong> por almuerzo.</p>', pedir: 1};
    },
    precio() {
      const p = proximos(1)[0], v = p ? p.m.p : null;
      return {h: v != null ? 'El almuerzo cuesta <strong>' + money(v) + '</strong> (plato de fondo del día con sus acompañamientos).' : 'Escríbenos por WhatsApp y te informamos el valor.', pedir: v != null, wa: v != null ? '' : 'quiero saber el valor del almuerzo'};
    },
    atienden() {
      const s = hoyS(), e = estado(s);
      if (e.m && !e.motivo) return {h: '<strong>Sí, hoy atendemos</strong> y hay almuerzo.' + (pub.h ? '<br>Reparto: ' + esc(pub.h) : '') + '<br>Puedes pedir por esta página; el pedido queda confirmado cuando te respondemos por WhatsApp.', pedir: 1};
      const p = proximos(1)[0];
      return {h: '<strong>Hoy no atendemos</strong> (' + e.motivo + ').' + (p ? ' Volvemos <strong>' + nomDia(p.s, p.i) + '</strong>.' : ''), pedir: !!p};
    },
    ubicacion() {
      return {h: pub.r ? '<strong>Retiro:</strong> ' + esc(pub.r) + '<br>Si prefieres, <strong>despachamos a domicilio</strong>: ' + esc(lc(pub.a) || 'despacho gratis en Bicentenario y Valles del Country') + '.' : 'Para <strong>retirar</strong> te indicamos la dirección exacta por WhatsApp al confirmar tu pedido.<br>' + 'Despacho a domicilio: ' + esc(pub.a ? lc(pub.a) : 'despacho gratis en Bicentenario y Valles del Country') + '.', wa: 'quiero saber dónde retirar mi pedido', mapa: pub.r ? mapaUrl(pub.r, pub.l) : null};
    },
    reparto() {
      return {h: '<strong>Despacho a domicilio:</strong> ' + esc(lc(pub.a) || 'despacho gratis en Bicentenario y Valles del Country') + '.' + (pub.h ? '<br><strong>Horario de reparto:</strong> ' + esc(pub.h) + '.' : '<br>La hora la eliges al hacer el pedido (12:00 a 14:30) y la confirmamos por WhatsApp.'), pedir: 1};
    },
    contacto() {
      return {h: '<strong>Pedidos y consultas por WhatsApp:</strong> ' + fmtTel(WA) + '.<br>Es el único número oficial; escribe ahí para evitar confusiones.', wa: 'quiero hacer una consulta', tel: WA};
    },
    pedir() {
      return {h: '<strong>Cómo pedir:</strong><ol><li>Elige el día.</li><li>Elige tu almuerzo con + y −.</li><li>Pon tu nombre y si retiras o despachamos.</li><li>Toca «Enviar pedido por WhatsApp».</li></ol>Tu pedido queda confirmado cuando te respondemos.', pedir: 1};
    },
    extras() {
      const x = pub.x || [];
      return {h: (x.length ? '<strong>Extras que puedes sumar a tu pedido:</strong><ul>' + x.map(e => '<li>' + esc(e.n) + ' — ' + money(e.p) + '</li>').join('') + '</ul>' : '') + 'Además preparamos <strong>empanadas de horno</strong>, <strong>pan amasado</strong> y <strong>ceviche de salmón</strong> según el día: escríbenos para confirmar disponibilidad y valor.', pedir: x.length > 0, wa: 'quiero consultar por empanadas, pan amasado o ceviche'};
    },
    receta() {
      return {h: 'Las recetas son de la casa 😊. Si quieres un plato en especial, escríbenos y vemos si lo preparamos.', wa: 'tengo una consulta sobre una preparación'};
    },
    volver() {
      return {h: '¡Qué gusto leerte! 🍽 Seguimos con <strong>almuerzos caseros</strong> con retiro o despacho.' + '<br>Mira el menú y haz tu pedido aquí mismo.', pedir: 1};
    },
    saludo() { return {h: '¡Hola! 👋 Elige una opción o escribe tu duda.'}; },
    gracias() { return {h: '¡Con gusto! Cuando quieras, haz tu pedido aquí. 🍽', pedir: 1}; }
  };
  const K = {
    hoy: ['hoy', 'menu de hoy', 'que hay', 'que tiene', 'colacion', 'almuerzo de hoy', 'que venden', 'que preparan', 'que cocinan'],
    semana: ['semana', 'manana', 'proximos', 'otros dias', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'menu'],
    precio: ['precio', 'valor', 'cuanto', 'cuesta', 'sale', 'cobran', 'costo', 'tarifa'],
    atienden: ['atienden', 'atencion', 'abierto', 'abren', 'estan', 'trabajan', 'funcionan', 'hay hoy'],
    ubicacion: ['donde', 'queda', 'local', 'direccion', 'ubicacion', 'villa', 'retiro', 'retirar', 'buscar', 'sector'],
    reparto: ['reparto', 'reparten', 'despacho', 'despachan', 'delivery', 'envio', 'envian', 'domicilio', 'bicentenario', 'country', 'hora', 'desde que hora', 'llevan'],
    contacto: ['contacto', 'telefono', 'numero', 'llamar', 'whatsapp', 'wsp', 'fono', 'celular'],
    pedir: ['pedir', 'pedido', 'encargar', 'reservar', 'como compro', 'como ordeno', 'comprar'],
    extras: ['ceviche', 'pan amasado', 'amasado', 'empanada', 'empanadas', 'pino', 'pastel', 'postre', 'ensalada'],
    receta: ['receta', 'como se hace', 'como se ace', 'ingredientes', 'preparar', 'crema'],
    volver: ['volvieron', 'vuelta', 'volvemos', 'extrano', 'regreso', 'cuando vuelven'],
    saludo: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches'],
    gracias: ['gracias', 'genial', 'perfecto', 'bendiciones', 'recomendad']
  };
  function puntuar(t, ks) { let p = 0; const s = ' ' + t + ' '; for (const k of ks) { const n = norm(k); if (n.length <= 3 ? s.includes(' ' + n + ' ') : s.includes(n)) p += n.length >= 7 ? 3 : 2; } return p; }
  function buscar(txt) {
    const t = norm(txt); if (!t) return null;
    const r = Object.keys(K).map(id => ({id, p: puntuar(t, K[id])})).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
    return r.length ? r[0].id : null;
  }
  const MENU = [['¿Qué hay hoy?', 'hoy'], ['Menú de la semana', 'semana'], ['¿Atienden hoy?', 'atienden'], ['Precio', 'precio'], ['Retiro y reparto', 'reparto'], ['¿Dónde retiro?', 'ubicacion'], ['Cómo pedir', 'pedir'], ['Contacto', 'contacto']];

  /* ---- interfaz ---- */
  const lan = document.createElement('button');
  lan.className = 'abot-lan'; lan.type = 'button'; lan.setAttribute('aria-label', 'Abrir asistente'); lan.innerHTML = '💬 <span>¿Dudas?</span>';
  const pan = document.createElement('section');
  pan.className = 'abot-pan'; pan.hidden = true; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Asistente');
  pan.innerHTML = '<header><img src="logo-192.png" alt=""><div><b>Asistente de ' + esc(pub.n || 'La Cocina de Emi') + '</b><small>Respuestas rápidas</small></div><button type="button" class="abot-x" aria-label="Cerrar">✕</button></header><div class="abot-msgs" role="log" aria-live="polite"></div><div class="abot-atajos"></div><form class="abot-form" autocomplete="off"><input class="abot-in" maxlength="160" placeholder="Escribe tu duda…" aria-label="Escribe tu duda"><button type="submit" aria-label="Enviar">➤</button></form>';
  document.body.append(lan, pan);
  const $m = $('.abot-msgs', pan), $a = $('.abot-atajos', pan), $in = $('.abot-in', pan);
  const bajar = () => { $m.scrollTop = $m.scrollHeight; };
  const user = t => { const d = document.createElement('div'); d.className = 'abot-m u'; d.textContent = t; $m.appendChild(d); bajar(); };
  function bot(r) {
    const d = document.createElement('div'); d.className = 'abot-m b'; d.innerHTML = r.h;
    const ch = document.createElement('div'); ch.className = 'abot-chips';
    if (r.pedir) { const b = document.createElement('button'); b.type = 'button'; b.className = 'abot-chip on'; b.textContent = '🍽 Hacer mi pedido'; b.onclick = () => { cerrar(); const x = $('#platos'); if (x) x.scrollIntoView({behavior: 'smooth', block: 'start'}); }; ch.appendChild(b); }
    if (r.wa) { const a = document.createElement('a'); a.className = 'abot-chip wa'; a.href = wa(r.wa); a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Escribir por WhatsApp'; ch.appendChild(a); }
    if (r.mapa) { const a = document.createElement('a'); a.className = 'abot-chip'; a.href = r.mapa; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '📍 Ver en el mapa'; ch.appendChild(a); }
    if (r.tel) { const a = document.createElement('a'); a.className = 'abot-chip'; a.href = 'tel:+' + r.tel; a.textContent = '📞 Llamar'; ch.appendChild(a); }
    if (ch.children.length) d.appendChild(ch);
    $m.appendChild(d); bajar();
  }
  function responder(id) { bot(R[id]()); }
  function propia(t) {   // preguntas y respuestas que agregó el dueño (tienen prioridad)
    const n = norm(t); let mejor = null, bp = 0;
    for (const q of pub.q || []) { const p = puntuar(n, String(q.k).split(',')); if (p > bp) { bp = p; mejor = q; } }
    return bp >= 2 ? mejor : null;
  }
  function texto(t) {
    const q = propia(t); if (q) return bot({h: esc(q.r).replace(/\n/g, '<br>'), wa: 'tengo una consulta: «' + t.slice(0, 120) + '»'});
    const id = buscar(t);
    if (id) responder(id);
    else bot({h: 'No encontré una respuesta exacta para eso. Elige una opción del menú o consúltalo por WhatsApp.', wa: 'tengo una consulta: «' + t.slice(0, 120) + '»'});
  }
  let ini = false;
  function abrir() {
    pan.hidden = false; lan.classList.add('hide');
    if (!ini) { ini = true; bot({h: '¡Hola! 👋 Soy el asistente de <strong>' + esc(pub.n || 'La Cocina de Emi') + '</strong>. ¿En qué te ayudo?'});
      MENU.forEach(([t, id]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'abot-atajo'; b.textContent = t; b.onclick = () => { user(t); responder(id); }; $a.appendChild(b); }); }
    setTimeout(() => $in.focus({preventScroll: true}), 50);
  }
  function cerrar() { pan.hidden = true; lan.classList.remove('hide'); }
  lan.onclick = abrir; $('.abot-x', pan).onclick = cerrar;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pan.hidden) cerrar(); });
  $('.abot-form', pan).onsubmit = e => { e.preventDefault(); const v = $in.value.trim(); if (!v) return; $in.value = ''; user(v); texto(v); };
})();
