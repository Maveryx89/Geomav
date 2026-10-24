'use strict';
(() => {
  /* --- menú publicado: enlace ?m=… > último guardado > menú de ejemplo --- */
  let pub = null;
  const q = new URLSearchParams(location.search).get('m');
  if (q) {
    pub = decodePub(q);
    if (pub) { try { localStorage.setItem('comida_pub', JSON.stringify(pub)); } catch (e) {} history.replaceState(null, '', location.pathname); }
  }
  if (!pub) { try { pub = JSON.parse(localStorage.getItem('comida_pub')); } catch (e) {} }
  if (!pub || !pub.m) pub = buildPub(seedDB());
  migrarPub(pub);
  pub.b = pub.b || []; pub.f = pub.f || {}; window.__pub = pub;

  $('#marca').innerHTML = `${esc(pub.n || 'Almuerzos')}<small>Menú del día · pedidos por WhatsApp</small>`;
  { const fn = $('#foot-n'); if (fn) fn.textContent = pub.n || 'la cocina'; }
  document.title = (pub.n || 'Almuerzos') + ' — Haz tu pedido';
  if (pub.a) { const a = $('#aviso'); a.textContent = pub.a; a.classList.remove('hide'); }

  /* --- retiro + mapa --- */
  if (pub.r) { const r = $('#retiro'); const mapa = ` · <a href="${mapaUrl(pub.r, pub.l)}" target="_blank" rel="noopener">📍 Ver en el mapa</a>`;
    r.innerHTML = `<b>Retiro:</b> ${esc(pub.r)}${mapa}`; r.classList.remove('hide'); }

  /* --- fechas disponibles (próximos 14 días) --- */
  const hoy = new Date(), dias = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i), s = iso(d), m = pubMenu(pub, s);
    let motivo = null;
    if (!m) motivo = 'Sin menú este día';
    else if (pub.b.includes(s)) motivo = 'No hay atención ese día';
    else if (feriado(s) && !pub.f[s]) motivo = 'Feriado: ' + feriado(s);
    dias.push({s, d, m, motivo});
  }
  let sel = (dias.find(x => !x.motivo) || {}).s || null;
  let qty = {}, qtyX = {};

  const pr = () => { const m = sel && pubMenu(pub, sel); return m ? m.p : null; };
  const nPorc = () => Object.values(qty).reduce((a, b) => a + b, 0);
  const xs = pub.x || [], totX = () => xs.reduce((a, e) => a + (qtyX[e.n] || 0) * (e.p || 0), 0), nX = () => Object.values(qtyX).reduce((a, b) => a + b, 0);

  function drawFechas() {
    $('#fechas').innerHTML = dias.filter(x => x.m).map(x =>
      `<button class="chip ${x.s === sel ? 'on' : ''} ${x.motivo ? 'off' : ''}" data-s="${x.s}"><small>${x.s === iso(hoy) ? 'Hoy' : DIAS_CORTO[x.d.getDay()]}</small><b>${x.d.getDate()}</b><small>${MESES[x.d.getMonth()].slice(0, 3)}</small></button>`).join('');
    $$('#fechas .chip').forEach(b => b.onclick = () => {
      const x = dias.find(z => z.s === b.dataset.s);
      if (x.motivo) return toast(x.motivo);
      sel = x.s; qty = {}; drawFechas(); drawPlatos(); drawTotal();
    });
  }
  function drawPlatos() {
    const box = $('#platos');
    if (!sel) { box.innerHTML = '<p class="muted">Por ahora no hay menú disponible. Escríbenos por WhatsApp.</p>'; return; }
    const m = pubMenu(pub, sel);
    box.innerHTML = `<div class="row sb" style="margin-bottom:4px"><b>${fmtFecha(sel)}</b><span class="badge">${m.p != null ? money(m.p) + ' c/u' : 'Precio: consultar'}</span></div>` +
      m.i.map((n, k) => { const f = fotoPlato(n, m.ph); return `<div class="plato">${f ? `<img class="pfoto" src="${f}" alt="" loading="lazy">` : ''}<span class="nm">${esc(n)}</span>
        <div class="stepper"><button data-k="${k}" data-d="-1" aria-label="Quitar">−</button><output>${qty[n] || 0}</output><button class="plus" data-k="${k}" data-d="1" aria-label="Agregar">+</button></div></div>`; }).join('') +
      (m.g ? `<p class="muted" style="margin:8px 0 0">Acompañamientos:<br>${esc(m.g).split(/\s*·\s*|\s*,\s*/).join('<br>')}<br>Indícalo en la nota.</p>` : '');
    $$('#platos .stepper button').forEach(b => b.onclick = () => {
      const n = m.i[+b.dataset.k]; qty[n] = Math.max(0, (qty[n] || 0) + +b.dataset.d); if (!qty[n]) delete qty[n];
      b.parentElement.querySelector('output').textContent = qty[n] || 0; drawTotal();
    });
  }
  function drawExtras() {
    const ok = xs.length > 0; $('#extras').classList.toggle('hide', !ok); $('#h-extras').classList.toggle('hide', !ok); if (!ok) return;
    $('#extras').innerHTML = xs.map((e, k) => `<div class="plato"><span class="nm">${esc(e.n)}<br><small class="muted">${money(e.p)} c/u</small></span>
      <div class="stepper"><button data-k="${k}" data-d="-1" aria-label="Quitar">−</button><output>${qtyX[e.n] || 0}</output><button class="plus" data-k="${k}" data-d="1" aria-label="Agregar">+</button></div></div>`).join('');
    $$('#extras .stepper button').forEach(b => b.onclick = () => { const n = xs[+b.dataset.k].n; qtyX[n] = Math.max(0, (qtyX[n] || 0) + +b.dataset.d); if (!qtyX[n]) delete qtyX[n]; b.parentElement.querySelector('output').textContent = qtyX[n] || 0; drawTotal(); });
  }
  function drawHoy() {
    const x = dias.find(z => !z.motivo); const box = $('#hoy'); if (!x) return;
    box.innerHTML = `<div class="row sb"><b>${x.s === iso(hoy) ? 'Hoy' : 'Próximo almuerzo'} · ${fmtFecha(x.s)}</b><span class="badge ok">${x.m.p != null ? money(x.m.p) : 'consultar'}</span></div>
      <ul class="lista">${x.m.i.map(n => `<li>${esc(n)}</li>`).join('')}</ul><button class="btn primary block" id="hoy-pedir">🍽 Pedir ahora</button>`;
    box.classList.remove('hide');
    $('#hoy-pedir').onclick = () => { sel = x.s; qty = {}; drawFechas(); drawPlatos(); drawTotal(); $('#platos').scrollIntoView({behavior: 'smooth', block: 'start'}); };
  }
  function drawTotal() {
    const n = nPorc(), p = pr();
    const T = (n && p != null ? n * p : 0) + totX(), alg = n + nX() > 0;
    $('#total').textContent = alg ? ((n && p == null) ? 'A confirmar' : money(T)) : '—';
    $('#resumen').innerHTML = alg ? [...Object.entries(qty), ...Object.entries(qtyX)].map(([k, v]) => `${v}× ${esc(k)}`).join('<br>') : 'Aún no has elegido platos.';
    $('#btn-enviar').disabled = !alg;
  }

  /* --- datos recordados --- */
  const horas = ['12:00','12:30','13:00','13:30','14:00','14:30'];
  $('#f-hora').innerHTML = horas.map(h => `<option>${h}</option>`).join('');
  $('#f-hora').value = '13:00';
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } };
  $('#f-nombre').value = ls('comida_nombre'); $('#f-tel').value = ls('comida_tel'); $('#f-dir').value = ls('comida_dir');
  const tipoChg = () => $('#w-dir').classList.toggle('hide', $('#f-tipo').value !== 'despacho');
  $('#f-tipo').onchange = tipoChg;

  $('#btn-enviar').onclick = () => {
    const nombre = $('#f-nombre').value.trim(), tipo = $('#f-tipo').value, dir = $('#f-dir').value.trim();
    if (!nombre) { toast('Escribe tu nombre'); $('#f-nombre').focus(); return; }
    if (tipo === 'despacho' && !dir) { toast('Escribe la dirección de despacho'); $('#f-dir').focus(); return; }
    ls('comida_nombre', nombre); ls('comida_tel', $('#f-tel').value.trim()); ls('comida_dir', dir);
    const d = parseISO(sel), p = pr(), n = nPorc();
    const L = ['🍽 *Pedido de almuerzo*', `Nombre: ${nombre}`];
    if ($('#f-tel').value.trim()) L.push(`Teléfono: ${$('#f-tel').value.trim()}`);
    L.push(`Día: ${DIAS_NOM[d.getDay()]} ${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`, `Hora: ${$('#f-hora').value}`,
      tipo === 'despacho' ? `Entrega: Despacho: ${dir}` : 'Entrega: Retiro', 'Pedido:');
    Object.entries(qty).forEach(([k, v]) => L.push(`- ${v} x ${k}`));
    Object.entries(qtyX).forEach(([k, v]) => L.push(`- ${v} x ${k}`));
    if (p != null || (!n && nX())) L.push(`Total: ${money((n && p != null ? n * p : 0) + totX())}`);
    if ($('#f-nota').value.trim()) L.push(`Nota: ${$('#f-nota').value.trim().replace(/\n/g, ' ')}`);
    window.open(`https://wa.me/${pub.w || '56986200429'}?text=${encodeURIComponent(L.join('\n'))}`, '_blank');
  };

  /* --- ayuda + recorrido --- */
  const PASOS = [
    {t: '¡Bienvenido!', d: 'Aquí ves el menú del día y haces tu pedido en menos de un minuto. Te muestro cómo.'},
    {sel: '#fechas', t: 'Elige el día', d: 'Solo aparecen los días con menú. Toca la fecha en que quieres tu almuerzo.'},
    {sel: '#platos', t: 'Elige tus platos', d: 'Usa + y − para indicar cuántas porciones de cada plato quieres.'},
    {sel: '#datos', t: 'Tus datos', d: 'Nombre, retiro o despacho y hora. Quedan guardados para tu próximo pedido.'},
    {sel: '#btn-enviar', t: 'Envía por WhatsApp', d: 'Se abre WhatsApp con tu pedido ya escrito. Solo presiona enviar.'}
  ];
  $('#btn-ayuda').onclick = () => {
    const m = modal(`<h3>Cómo pedir <button class="ibtn" data-close>✕</button></h3>
      <ol><li>Elige el día con menú disponible.</li><li>Marca cuántas porciones de cada plato quieres.</li><li>Completa tus datos y la hora de retiro o despacho.</li><li>Presiona <b>Enviar pedido por WhatsApp</b>.</li></ol>
      <p class="muted">Tu pedido queda confirmado cuando te respondamos por WhatsApp.</p>
      <button class="btn primary block" id="rep">Ver recorrido guiado</button>`);
    $('#rep', m).onclick = () => { m.close(); tour(PASOS, 'comida_tour_cliente', true); };
  };

  drawFechas(); drawPlatos(); drawExtras(); drawHoy(); drawTotal(); tipoChg();
  setTimeout(() => tour(PASOS, 'comida_tour_cliente'), 500);
})();
