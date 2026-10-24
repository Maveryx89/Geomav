'use strict';
/* ===== Panel del dueño: calendario, menú, pedidos, clientes, finanzas, compras ===== */
let DB = loadDB();
const save = () => saveDB(DB);
const menuDe = s => menuDeDB(DB, s);
const hoyISO = () => iso(new Date());
const firstOf = d => new Date(d.getFullYear(), d.getMonth(), 1);
const S = {tab: 'cal', month: firstOf(new Date()), sel: hoyISO(), pedF: 'prox', fin: firstOf(new Date()), edit: {kind: 'dia', key: 'lun'}, q: ''};
const ESTADOS = ['nuevo', 'confirmado', 'listo', 'entregado', 'cancelado'];
const LAB_EST = {nuevo: '🆕 Nuevo', confirmado: '👍 Confirmado', listo: '✅ Listo', entregado: '📦 Entregado', cancelado: '✖ Cancelado'};

const pedidosDe = s => DB.pedidos.filter(p => p.fecha === s && p.estado !== 'cancelado');
const nPorc = p => p.items.reduce((a, i) => a + i.cant, 0);
const porciones = s => pedidosDe(s).reduce((a, p) => a + nPorc(p), 0);
const itemsTxt = p => p.items.map(i => `${i.cant}× ${i.nombre}`).join(', ');
const normTel = t => { const d = String(t || '').replace(/\D/g, ''); return d.length === 9 ? '56' + d : d; };
function nextDate(key) { for (let i = 0; i < 8; i++) { const d = new Date(); d.setDate(d.getDate() + i); if (dkey(d) === key) return iso(d); } return hoyISO(); }
function ed() { return S.edit.kind === 'fecha' ? DB.menuFecha[S.edit.iso] : DB.menu[S.edit.key]; }

/* ---------- CALENDARIO ---------- */
function vCal() {
  const y = S.month.getFullYear(), m = S.month.getMonth(), off = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), cap = DB.cfg.capacidad || 1;
  let cells = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<div class="dw">${x}</div>`).join('') + '<div class="cd empty"></div>'.repeat(off);
  for (let d = 1; d <= n; d++) {
    const s = iso(new Date(y, m, d)), fer = feriado(s), bl = DB.bloqueados[s] !== undefined, por = porciones(s), me = menuDe(s);
    const cls = [s === hoyISO() ? 'hoy' : '', s === S.sel ? 'sel' : '', fer ? 'fer' : '', bl ? 'bloq' : '', !me ? 'nomenu' : '', por >= cap ? 'lleno' : ''].join(' ');
    cells += `<button class="cd ${cls}" data-act="selDia" data-d="${s}"><b>${d}</b><i>${bl ? '⛔' : fer ? 'feriado' : por ? por + ' porc.' : '&nbsp;'}</i>${por ? `<span class="bar"><u style="width:${Math.min(100, por / cap * 100)}%"></u></span>` : ''}</button>`;
  }
  return `<div class="calhead"><button class="ibtn" data-act="calPrev">‹</button><h2>${MESES[m]} ${y}</h2><button class="ibtn" data-act="calNext">›</button></div>
    <div class="row wrap" style="margin-bottom:8px"><button class="btn sm" data-act="calHoy">Hoy</button><span class="muted">Capacidad: ${cap} porciones/día · 🟥 feriado · ⬜ sin menú · ⛔ bloqueado</span></div>
    <div class="cal">${cells}</div>${panelDia(S.sel)}`;
}
function panelDia(s) {
  const mn = menuDe(s), fer = feriado(s), bl = DB.bloqueados[s], peds = DB.pedidos.filter(p => p.fecha === s).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  const prod = {}; pedidosDe(s).forEach(p => p.items.forEach(i => prod[i.nombre] = (prod[i.nombre] || 0) + i.cant));
  return `<div class="card" style="margin-top:12px"><div class="row sb wrap"><b>${fmtFecha(s)}</b><span>${fer ? `<span class="badge fer">Feriado: ${esc(fer)}</span> ` : ''}${bl !== undefined ? `<span class="badge bl">⛔ Bloqueado${bl ? ': ' + esc(bl) : ''}</span>` : ''}</span></div>
    <p class="muted" style="margin:6px 0">${mn ? mn.items.map(i => (i.revisar ? '⚠️ ' : '') + esc(i.nombre)).join(' · ') : 'Sin menú este día.'}</p>
    <div class="row wrap">
      <button class="btn sm primary" data-act="nuevoPed" data-d="${s}">+ Pedido</button>
      ${mn ? `<button class="btn sm" data-act="plantillaDia" data-d="${s}">🖼 Plantilla</button>` : ''}
      <button class="btn sm" data-act="menuFecha" data-d="${s}">✏️ Menú de esta fecha</button>
      <button class="btn sm" data-act="bloq">${bl !== undefined ? 'Desbloquear' : 'Bloquear día'}</button></div>
    <p style="margin:10px 0 4px"><b>Producción</b> <span class="muted">(${porciones(s)}/${DB.cfg.capacidad} porciones)</span></p>
    ${Object.keys(prod).length ? Object.entries(prod).map(([k, v]) => `<div class="row sb"><span>${esc(k)}</span><b>${v}</b></div>`).join('') : '<p class="muted" style="margin:0">Aún sin pedidos.</p>'}
    <p style="margin:12px 0 4px"><b>Pedidos</b></p>${peds.length ? peds.map(pedCard).join('') : '<p class="muted" style="margin:0">Sin pedidos para este día.</p>'}</div>`;
}
function pedCard(p) {
  return `<div class="ped est-${p.estado}"><div class="row sb"><b>${esc(p.nombre)}</b><span>${esc(p.hora || '')}</span></div>
    <div class="s">${esc(itemsTxt(p))}${p.nota ? ` · <i>${esc(p.nota)}</i>` : ''}</div>
    <div class="row sb"><span class="muted">${p.tipo === 'despacho' ? '🛵 ' + esc(p.dir) : '🥡 Retiro'}</span><b>${money(p.total)}</b></div>
    <div class="acts"><select data-b="estado" data-id="${p.id}">${ESTADOS.map(e => `<option value="${e}" ${p.estado === e ? 'selected' : ''}>${LAB_EST[e]}</option>`).join('')}</select>
      <button class="btn sm" data-act="pagado" data-id="${p.id}">${p.pagado ? '✅ Pagado' : '💲 Cobrar'}</button>
      <button class="btn sm" data-act="editPed" data-id="${p.id}">✏️</button>${p.tel ? `<button class="btn sm" data-act="waCli" data-t="${esc(p.tel)}">💬</button>` : ''}</div></div>`;
}

/* ---------- MENÚ ---------- */
function vMenu() {
  const e = ed(), isF = S.edit.kind === 'fecha';
  const chips = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(k => `<button class="chip ${!isF && S.edit.key === k ? 'on' : ''}" data-act="editDia" data-k="${k}"><b>${DIAS_CORTO[DIAS_KEY.indexOf(k)]}</b></button>`).join('') +
    (isF ? `<button class="chip on"><small>solo esta fecha</small><b>${parseISO(S.edit.iso).getDate()} ${MESES[parseISO(S.edit.iso).getMonth()].slice(0, 3)}</b></button>` : '');
  return `<h2 style="margin-top:4px">Menú ${isF ? 'de ' + fmtFecha(S.edit.iso) : 'semanal (se repite cada semana)'}</h2><div class="chips">${chips}</div>
    <div class="card">${e.items.map((it, i) => { const f = DB.fotos[it.id]; return `<div class="item-ed"><div class="thumb" data-act="foto" data-i="${i}" ${f ? `style="background-image:url('${f}')"` : ''}>${f ? '' : '📷'}</div>
      <input class="inp" data-b="itemNombre" data-i="${i}" value="${esc(it.nombre)}"><button class="ibtn" data-act="rev" data-i="${i}" title="Por confirmar">${it.revisar ? '⚠️' : '✅'}</button><button class="ibtn" data-act="aCat" data-i="${i}" title="Guardar en catálogo">📚</button><button class="ibtn" data-act="delItem" data-i="${i}">🗑</button></div>`; }).join('') || '<p class="muted">Sin platos.</p>'}
      <div class="row wrap"><button class="btn sm" data-act="addItem">+ Plato nuevo</button><button class="btn sm primary" data-act="catalogo">📚 Elegir del catálogo</button></div>
      <p class="muted" style="margin:8px 0 0">⚠️ = por confirmar: no se muestra a clientes ni en la plantilla. Toca ✅ para confirmarlo. La foto es opcional (📷).</p></div>
    <div class="card"><label class="field"><span>Acompañamientos (texto libre)</span><input data-b="guar" value="${esc(e.guar)}" placeholder="Puré · Arroz · Ensalada"></label>
      <label class="field"><span>Precio del almuerzo (CLP)</span><input data-b="precio" type="number" inputmode="numeric" value="${e.precio ?? ''}" placeholder="Ej: 4500"></label></div>
    <div class="row wrap"><button class="btn primary" data-act="plantillaEd">🖼 Plantilla del día</button><button class="btn" data-act="plantillaSemana">🗓 Plantilla semanal</button><button class="btn wa" data-act="publicar">🔗 Publicar para clientes</button>
      ${isF ? '<button class="btn danger" data-act="quitarFecha">Quitar cambios de esta fecha</button>' : ''}</div>`;
}


/* ---------- CATÁLOGO DE PLATOS ---------- */
function openCatalogo() {
  const m = modal('<div id="cat-box"></div>');
  const draw = () => {
    const l = [...DB.catalogo].sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre, 'es'));
    $('#cat-box', m).innerHTML = `<h3>Catálogo de platos <button class="ibtn" data-close>✕</button></h3>
      <p class="muted" style="margin:0 0 8px">Toca un plato para agregarlo al menú que estás editando. Con ✏️ cambias el nombre y 🗑 lo quita del catálogo.</p>
      ${l.map(c => `<div class="item-ed"><div class="thumb" ${c.foto ? `style="background-image:url('${c.foto}')"` : ''}>${c.foto ? '' : '🍽'}</div>
        <div class="grow"><b>${esc(c.nombre)}</b><br><small class="muted">${c.tipo === 'extra' ? 'Extra / acompañamiento' : 'Almuerzo'}</small></div>
        <button class="btn sm primary" data-add="${c.id}">+ Menú</button><button class="ibtn" data-ren="${c.id}">✏️</button><button class="ibtn" data-del="${c.id}">🗑</button></div>`).join('')}
      <button class="btn block" id="cat-new" style="margin-top:8px">+ Nuevo plato en el catálogo</button>`;
  };
  draw();
  m.addEventListener('click', ev => {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-close')) m.close();
    else if (t.dataset.add) { const c = DB.catalogo.find(x => x.id === t.dataset.add), id = uid(); ed().items.push({id, nombre: c.nombre, revisar: false}); if (c.foto) DB.fotos[id] = c.foto; save(); toast('Agregado: ' + c.nombre); render(); }
    else if (t.dataset.ren) { const c = DB.catalogo.find(x => x.id === t.dataset.ren), n = prompt('Nombre del plato', c.nombre); if (n && n.trim()) { c.nombre = n.trim(); save(); draw(); } }
    else if (t.dataset.del) { const c = DB.catalogo.find(x => x.id === t.dataset.del); if (confirm('¿Quitar "' + c.nombre + '" del catálogo?')) { DB.catalogo = DB.catalogo.filter(x => x !== c); save(); draw(); } }
    else if (t.id === 'cat-new') { const n = prompt('Nombre del plato nuevo', ''); if (n && n.trim()) { DB.catalogo.push({id: 'cat_' + uid(), nombre: n.trim(), tipo: 'almuerzo', foto: ''}); save(); draw(); } }
  });
}

/* ---------- PEDIDOS ---------- */
function vPed() {
  const h = hoyISO(), f = S.pedF;
  let l = DB.pedidos.filter(p => f === 'todos' || (f === 'prox' ? p.fecha >= h : p.fecha < h));
  l.sort((a, b) => f === 'pas' ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || ''));
  let last = '';
  return `<div class="row wrap" style="margin:4px 0 10px"><button class="btn primary" data-act="nuevoPed" data-d="${S.sel}">+ Nuevo pedido</button><button class="btn" data-act="pegarWA">📋 Pegar de WhatsApp</button></div>
    <div class="chips">${[['prox', 'Próximos'], ['pas', 'Pasados'], ['todos', 'Todos']].map(([k, t]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="pedF" data-f="${k}"><b style="font-size:.95rem">${t}</b></button>`).join('')}</div>
    ${l.length ? l.map(p => { const hd = p.fecha !== last ? `<p style="margin:12px 0 4px"><b>${fmtFecha(p.fecha)}</b></p>` : ''; last = p.fecha; return hd + pedCard(p); }).join('') : '<p class="muted">No hay pedidos en esta lista.</p>'}`;
}
function parsePedidoWA(t) {
  const g = re => { const m = t.match(re); return m ? m[1].trim() : ''; };
  const dia = g(/D[ií]a:\s*(.+)/i), f = dia.match(/(\d{1,2})-(\d{1,2})-(\d{4})/), ent = g(/Entrega:\s*(.+)/i), despacho = /despacho/i.test(ent);
  return {nombre: g(/Nombre:\s*(.+)/i), tel: g(/Tel[eé]fono:\s*(.+)/i), fecha: f ? `${f[3]}-${pad2(f[2])}-${pad2(f[1])}` : null, hora: g(/Hora:\s*(\d{1,2}:\d{2})/i),
    items: [...t.matchAll(/^\s*[-•]\s*(\d+)\s*[x×]\s*(.+)$/gim)].map(m => ({cant: +m[1], nombre: m[2].trim()})),
    tipo: despacho ? 'despacho' : 'retiro', dir: despacho ? ent.replace(/^despacho\s*[:\-–]?\s*/i, '').trim() : '', nota: g(/Nota:\s*(.+)/i)};
}
function openPedido(id, fecha, pre) {
  const base = {id: null, fecha: fecha || S.sel, hora: '13:00', nombre: '', tel: '', tipo: 'retiro', dir: '', items: [], total: 0, manual: false, estado: 'confirmado', pagado: false, nota: ''};
  const d = id ? structuredClone(DB.pedidos.find(x => x.id === id)) : Object.assign(base, pre || {});
  if (pre && pre.fecha === null) d.fecha = fecha || S.sel;
  const m = modal(`<h3>${id ? 'Editar' : 'Nuevo'} pedido <button class="ibtn" data-close>✕</button></h3>
    <div class="row"><label class="field grow"><span>Fecha de entrega</span><input type="date" id="p-fecha"></label><label class="field grow"><span>Hora</span><input type="time" id="p-hora"></label></div>
    <label class="field"><span>Cliente</span><input id="p-nombre" list="dl-cli" autocomplete="off"><datalist id="dl-cli">${DB.clientes.map(c => `<option value="${esc(c.nombre)}">`).join('')}</datalist></label>
    <div class="row"><label class="field grow"><span>Teléfono</span><input id="p-tel" type="tel"></label><label class="field grow"><span>Entrega</span><select id="p-tipo"><option value="retiro">Retiro</option><option value="despacho">Despacho</option></select></label></div>
    <label class="field" id="w-pdir"><span>Dirección</span><input id="p-dir"></label>
    <div class="card" id="p-items"></div>
    <label class="field"><span>Nota</span><input id="p-nota"></label>
    <div class="row"><label class="field grow"><span>Total (CLP)</span><input id="p-total" type="number" inputmode="numeric"></label><label class="field grow"><span>Estado</span><select id="p-estado">${ESTADOS.map(e => `<option value="${e}">${LAB_EST[e]}</option>`).join('')}</select></label></div>
    <label class="row" style="margin-bottom:12px"><input type="checkbox" id="p-pagado"> Pagado</label>
    <div class="row"><button class="btn primary grow" id="p-ok">Guardar</button>${id ? '<button class="btn danger" id="p-del">Eliminar</button>' : ''}</div>`);
  const v = k => $('#p-' + k, m);
  const cants = {}; d.items.forEach(i => cants[i.nombre] = i.cant);
  const precio = () => { const mn = menuDe(v('fecha').value); return mn ? mn.precio : null; };
  const calc = () => { if (!d.manual) { const p = precio(), n = Object.values(cants).reduce((a, b) => a + b, 0); v('total').value = p != null ? n * p : (v('total').value || 0); } };
  const drawItems = () => {
    const mn = menuDe(v('fecha').value), names = mn ? mn.items.map(i => i.nombre) : [];
    Object.keys(cants).forEach(k => { if (!names.includes(k) && cants[k]) names.push(k); });
    $('#p-items', m).innerHTML = names.length ? names.map((n, k) => `<div class="plato"><span class="nm">${esc(n)}</span><div class="stepper"><button data-k="${k}" data-d="-1">−</button><output>${cants[n] || 0}</output><button class="plus" data-k="${k}" data-d="1">+</button></div></div>`).join('') : '<p class="muted">No hay menú para esa fecha: revisa la fecha.</p>';
    $$('.stepper button', m).forEach(b => b.onclick = () => { const n = names[+b.dataset.k]; cants[n] = Math.max(0, (cants[n] || 0) + +b.dataset.d); b.parentElement.querySelector('output').textContent = cants[n]; calc(); });
  };
  v('fecha').value = d.fecha; v('hora').value = d.hora || ''; v('nombre').value = d.nombre; v('tel').value = d.tel; v('tipo').value = d.tipo; v('dir').value = d.dir;
  v('nota').value = d.nota; v('total').value = d.total; v('estado').value = d.estado; v('pagado').checked = d.pagado;
  const tipoChg = () => $('#w-pdir', m).classList.toggle('hide', v('tipo').value !== 'despacho');
  v('tipo').onchange = tipoChg; tipoChg();
  v('fecha').onchange = () => { drawItems(); calc(); };
  v('total').oninput = () => { d.manual = true; };
  v('nombre').onchange = () => { const c = DB.clientes.find(x => x.nombre.toLowerCase() === v('nombre').value.trim().toLowerCase()); if (c) { if (!v('tel').value) v('tel').value = c.tel || ''; if (!v('dir').value && c.dir) { v('dir').value = c.dir; } } };
  drawItems();
  $('#p-ok', m).onclick = () => {
    const nombre = v('nombre').value.trim(), items = Object.entries(cants).filter(([, c]) => c > 0).map(([nombre, cant]) => ({nombre, cant}));
    if (!nombre) return toast('Falta el nombre del cliente');
    if (!v('fecha').value) return toast('Falta la fecha');
    if (!items.length) return toast('Agrega al menos un plato');
    const rec = {id: d.id || uid(), fecha: v('fecha').value, hora: v('hora').value, nombre, tel: v('tel').value.trim(), tipo: v('tipo').value, dir: v('dir').value.trim(), items, total: +v('total').value || 0, estado: v('estado').value, pagado: v('pagado').checked, nota: v('nota').value.trim()};
    const k = DB.pedidos.findIndex(x => x.id === rec.id); if (k >= 0) DB.pedidos[k] = rec; else DB.pedidos.push(rec);
    let c = DB.clientes.find(x => x.nombre.toLowerCase() === nombre.toLowerCase());
    if (!c) { c = {id: uid(), nombre, tel: rec.tel, dir: rec.dir, frec: false, nota: ''}; DB.clientes.push(c); } else { if (!c.tel) c.tel = rec.tel; if (!c.dir && rec.dir) c.dir = rec.dir; }
    save(); S.sel = rec.fecha; m.close(); render(); toast('Pedido guardado');
  };
  if (id) $('#p-del', m).onclick = () => { if (confirm('¿Eliminar este pedido?')) { DB.pedidos = DB.pedidos.filter(x => x.id !== id); save(); m.close(); render(); } };
}

/* ---------- CLIENTES ---------- */
function listaCli() {
  const q = S.q.toLowerCase(), ls = DB.clientes.filter(c => !q || c.nombre.toLowerCase().includes(q) || (c.tel || '').includes(q)).sort((a, b) => (b.frec - a.frec) || a.nombre.localeCompare(b.nombre));
  return ls.map(c => { const ps = DB.pedidos.filter(p => p.nombre.toLowerCase() === c.nombre.toLowerCase() && p.estado !== 'cancelado'), tot = ps.reduce((a, p) => a + p.total, 0);
    return `<div class="card"><div class="row sb"><b>${c.frec ? '⭐ ' : ''}${esc(c.nombre)}</b><span class="badge">${ps.length} pedidos · ${money(tot)}</span></div>
      <p class="muted" style="margin:4px 0">${esc(c.tel || 'sin teléfono')}${c.dir ? ' · ' + esc(c.dir) : ''}${c.nota ? ' · ' + esc(c.nota) : ''}</p>
      <div class="row wrap"><button class="btn sm" data-act="editCli" data-id="${c.id}">✏️ Editar</button><button class="btn sm primary" data-act="pedCli" data-id="${c.id}">+ Pedido</button>${c.tel ? `<button class="btn sm" data-act="waCli" data-t="${esc(c.tel)}">💬 WhatsApp</button>` : ''}</div></div>`; }).join('') || '<p class="muted">Sin clientes. Se crean solos al registrar pedidos, o con + Cliente.</p>';
}
function vCli() { return `<div class="row" style="margin:4px 0 10px"><input class="inp grow" placeholder="Buscar cliente…" data-b="busca" value="${esc(S.q)}"><button class="btn primary" data-act="nuevoCli">+ Cliente</button></div><div id="lista-cli">${listaCli()}</div>`; }
function openCliente(id) {
  const c = id ? DB.clientes.find(x => x.id === id) : {id: null, nombre: '', tel: '', dir: '', frec: true, nota: ''};
  const m = modal(`<h3>${id ? 'Editar' : 'Nuevo'} cliente <button class="ibtn" data-close>✕</button></h3>
    <label class="field"><span>Nombre</span><input id="c-nombre" value="${esc(c.nombre)}"></label><label class="field"><span>Teléfono</span><input id="c-tel" type="tel" value="${esc(c.tel)}"></label>
    <label class="field"><span>Dirección</span><input id="c-dir" value="${esc(c.dir)}"></label><label class="field"><span>Nota (alergias, gustos…)</span><input id="c-nota" value="${esc(c.nota)}"></label>
    <label class="row" style="margin-bottom:12px"><input type="checkbox" id="c-frec" ${c.frec ? 'checked' : ''}> ⭐ Cliente frecuente</label>
    <div class="row"><button class="btn primary grow" id="c-ok">Guardar</button>${id ? '<button class="btn danger" id="c-del">Eliminar</button>' : ''}</div>`);
  $('#c-ok', m).onclick = () => {
    const nombre = $('#c-nombre', m).value.trim(); if (!nombre) return toast('Falta el nombre');
    const rec = {id: c.id || uid(), nombre, tel: $('#c-tel', m).value.trim(), dir: $('#c-dir', m).value.trim(), nota: $('#c-nota', m).value.trim(), frec: $('#c-frec', m).checked};
    const k = DB.clientes.findIndex(x => x.id === rec.id); if (k >= 0) DB.clientes[k] = rec; else DB.clientes.push(rec); save(); m.close(); render();
  };
  if (id) $('#c-del', m).onclick = () => { if (confirm('¿Eliminar cliente? (sus pedidos se mantienen)')) { DB.clientes = DB.clientes.filter(x => x.id !== id); save(); m.close(); render(); } };
}

/* ---------- FINANZAS ---------- */
function vFin() {
  const y = S.fin.getFullYear(), mo = S.fin.getMonth(), ym = `${y}-${pad2(mo + 1)}`;
  const ps = DB.pedidos.filter(p => p.fecha.startsWith(ym) && p.estado !== 'cancelado'), gs = DB.gastos.filter(g => g.fecha.startsWith(ym)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ing = ps.filter(p => p.pagado).reduce((a, p) => a + p.total, 0), cobrar = ps.filter(p => !p.pagado && p.estado === 'entregado').reduce((a, p) => a + p.total, 0);
  const gas = gs.reduce((a, g) => a + g.monto, 0), res = ing - gas, top = {};
  ps.forEach(p => p.items.forEach(i => top[i.nombre] = (top[i.nombre] || 0) + i.cant));
  return `<div class="calhead"><button class="ibtn" data-act="finPrev">‹</button><h2>${MESES[mo]} ${y}</h2><button class="ibtn" data-act="finNext">›</button></div>
    <div class="kpis"><div class="kpi pos"><small>Ingresos (pagados)</small><b>${money(ing)}</b></div><div class="kpi"><small>Por cobrar (entregados)</small><b>${money(cobrar)}</b></div>
      <div class="kpi neg"><small>Gastos</small><b>${money(gas)}</b></div><div class="kpi ${res >= 0 ? 'pos' : 'neg'}"><small>Resultado</small><b>${money(res)}</b></div></div>
    <h2>Platos más pedidos</h2><div class="card">${Object.keys(top).length ? Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `<div class="row sb"><span>${esc(k)}</span><b>${v}</b></div>`).join('') : '<p class="muted" style="margin:0">Sin ventas este mes.</p>'}</div>
    <h2>Gastos</h2><div class="card"><div class="row wrap"><input class="inp grow" id="g-con" placeholder="Concepto (gas, pollo, bolsas…)"><input class="inp" id="g-mon" type="number" inputmode="numeric" placeholder="Monto" style="width:110px"><button class="btn primary" data-act="addGasto">+ Gasto</button></div>
      ${gs.length ? `<table class="t" style="margin-top:8px">${gs.map(g => `<tr><td>${g.fecha.slice(8)}/${g.fecha.slice(5, 7)}</td><td>${esc(g.concepto)}</td><td class="r">${money(g.monto)}</td><td class="r"><button class="ibtn" data-act="delGasto" data-id="${g.id}" style="width:30px;height:30px">🗑</button></td></tr>`).join('')}</table>` : '<p class="muted" style="margin:8px 0 0">Sin gastos este mes.</p>'}</div>`;
}

/* ---------- COMPRAS / INSUMOS ---------- */
function vComp() {
  const l = DB.compras, est = l.filter(c => !c.ok).reduce((a, c) => a + (c.precio || 0), 0);
  return `<div class="card"><div class="row wrap"><input class="inp grow" id="k-nom" placeholder="Insumo (pollo, papas, aceite…)"><input class="inp" id="k-can" placeholder="Cant." style="width:80px"><input class="inp" id="k-pre" type="number" inputmode="numeric" placeholder="Costo $" style="width:100px"><button class="btn primary" data-act="addComp">+</button></div></div>
    <div class="row sb" style="margin-bottom:6px"><b>Por comprar (est.): ${money(est)}</b><button class="btn sm" data-act="compGastos">Pasar comprados a gastos</button></div>
    ${l.length ? l.map(c => `<div class="card row" style="padding:8px 10px"><input type="checkbox" data-b="compOk" data-id="${c.id}" ${c.ok ? 'checked' : ''}><span class="grow" style="${c.ok ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(c.nombre)} <span class="muted">${esc(c.cant || '')}</span></span><b>${c.precio ? money(c.precio) : ''}</b><button class="ibtn" data-act="delComp" data-id="${c.id}" style="width:30px;height:30px">🗑</button></div>`).join('') : '<p class="muted">Lista vacía. Anota aquí lo que debes comprar para la semana.</p>'}`;
}

/* ---------- plantillas, publicar, ajustes, ayuda ---------- */
async function openPlantillaDia(s) {
  const mn = menuDe(s); if (!mn) return toast('Ese día no tiene menú');
  const vis = mn.items.filter(i => !i.revisar), oc = mn.items.length - vis.length;
  const m = modal(`<h3>Plantilla del día <button class="ibtn" data-close>✕</button></h3><canvas id="cv"></canvas>
    <div class="row" style="margin-top:10px"><button class="btn primary grow" id="dl">⬇️ Descargar</button><button class="btn wa grow" id="sh">📤 Compartir</button></div>
    <p class="muted">${oc ? `⚠️ ${oc} plato(s) por confirmar no aparecen. ` : ''}Agrega fotos de los platos en la pestaña Menú (📷).</p>`);
  const d = parseISO(s);
  await renderDia($('#cv', m), {dia: dkey(d), fecha: d, nombre: DB.cfg.nombre, wa: DB.cfg.wa, items: vis.map(i => ({nombre: i.nombre, foto: DB.fotos[i.id] || null})), guar: mn.guar, precio: mn.precio});
  $('#dl', m).onclick = () => descargarOCompartir($('#cv', m), 'menu-' + s, false);
  $('#sh', m).onclick = () => descargarOCompartir($('#cv', m), 'menu-' + s, true);
}
function openPlantillaSemana() {
  const m = modal(`<h3>Plantilla semanal <button class="ibtn" data-close>✕</button></h3><canvas id="cv"></canvas>
    <div class="row" style="margin-top:10px"><button class="btn primary grow" id="dl">⬇️ Descargar</button><button class="btn wa grow" id="sh">📤 Compartir</button></div>`);
  renderSemana($('#cv', m), {nombre: DB.cfg.nombre, wa: DB.cfg.wa, dias: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(k => ({key: k, items: DB.menu[k].items.filter(i => !i.revisar).map(i => i.nombre), precio: DB.menu[k].precio}))});
  $('#dl', m).onclick = () => descargarOCompartir($('#cv', m), 'menu-semana', false);
  $('#sh', m).onclick = () => descargarOCompartir($('#cv', m), 'menu-semana', true);
}
function openPublicar() {
  const link = location.href.replace(/dueno\.html.*$/, '').replace(/[?#].*$/, '') + 'index.html?m=' + encodePub(buildPub(DB));
  const m = modal(`<h3>Publicar para clientes <button class="ibtn" data-close>✕</button></h3>
    <p class="muted">Este enlace lleva el menú actual (solo platos confirmados ✅, precios, acompañamientos y días bloqueados). Cuando cambies el menú, vuelve a publicar y reenvía el enlace.</p>
    <textarea id="lk" readonly rows="4">${esc(link)}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn primary grow" id="cp">Copiar enlace</button><button class="btn wa grow" id="ws">Enviar por WhatsApp</button></div>`);
  $('#cp', m).onclick = async () => { try { await navigator.clipboard.writeText(link); toast('Enlace copiado'); } catch (e) { $('#lk', m).select(); document.execCommand('copy'); toast('Enlace copiado'); } };
  $('#ws', m).onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(`🍽 Menú de la semana y pedidos:\n${link}`), '_blank');
}
function openAjustes() {
  const c = DB.cfg;
  const m = modal(`<h3>Ajustes <button class="ibtn" data-close>✕</button></h3>
    <label class="field"><span>Nombre del negocio</span><input id="a-nom" value="${esc(c.nombre)}"></label>
    <label class="field"><span>WhatsApp (con 56, sin +)</span><input id="a-wa" value="${esc(c.wa)}"></label>
    <label class="field"><span>Capacidad diaria (porciones)</span><input id="a-cap" type="number" value="${c.capacidad}"></label>
    <label class="field"><span>Aviso para clientes (opcional)</span><input id="a-avi" value="${esc(c.aviso)}" placeholder="Ej: Pedidos hasta las 11:00 del mismo día"></label>
    <button class="btn primary block" id="a-ok">Guardar</button>
    <h2>Respaldo</h2><p class="muted">Tus datos viven en este dispositivo. Exporta un respaldo de vez en cuando.</p>
    <div class="row wrap"><button class="btn" id="a-exp">⬇️ Exportar respaldo</button><button class="btn" id="a-imp">⬆️ Importar respaldo</button><button class="btn" id="a-tour">Ver recorrido guiado</button></div>
    <input type="file" id="a-file" accept="application/json" class="hide">`);
  $('#a-ok', m).onclick = () => { c.nombre = $('#a-nom', m).value.trim() || 'La Cocina de Emi'; c.wa = $('#a-wa', m).value.replace(/\D/g, ''); c.capacidad = Math.max(1, +$('#a-cap', m).value || 20); c.aviso = $('#a-avi', m).value.trim(); c.avisoEditado = true; save(); m.close(); head(); render(); };
  $('#a-exp', m).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(DB)], {type: 'application/json'})); a.download = `respaldo-comida-${hoyISO()}.json`; a.click(); };
  $('#a-imp', m).onclick = () => $('#a-file', m).click();
  $('#a-file', m).onchange = async e => { try { const j = JSON.parse(await e.target.files[0].text()); if (j.v !== 1 || !j.menu) throw 0; if (confirm('Esto reemplaza todos los datos actuales. ¿Continuar?')) { DB = j; save(); m.close(); head(); render(); toast('Respaldo importado'); } } catch (x) { toast('Archivo de respaldo no válido'); } };
  $('#a-tour', m).onclick = () => { m.close(); tour(PASOS, 'comida_tour_dueno', true); };
}
const PASOS = [
  {t: 'Panel del dueño', d: 'Aquí manejas menú, pedidos, clientes, ventas, gastos y compras. Sin cuentas ni contraseñas: los datos quedan en este dispositivo.'},
  {sel: '#tabs', t: 'Seis secciones', d: 'Calendario (producción y pedidos por día), Menú, Pedidos, Clientes, Finanzas y Compras.'},
  {sel: '#main', t: 'Calendario', d: 'Toca un día para ver el menú, la producción (cuántas porciones preparar), los pedidos, bloquear el día o crear su plantilla.'},
  {sel: '#btn-ajustes', t: 'Ajustes y respaldo', d: 'Cambia nombre, WhatsApp y capacidad diaria. Exporta un respaldo de vez en cuando.'},
  {sel: '#btn-ayuda', t: 'Manual', d: 'Aquí tienes el manual de uso cuando lo necesites.'}
];
function openAyuda() {
  const m = modal(`<h3>Manual de uso <button class="ibtn" data-close>✕</button></h3>
    <p><b>📅 Calendario.</b> Muestra feriados, días bloqueados y cuántas porciones llevas por día contra tu capacidad. Toca un día para ver su producción y pedidos.</p>
    <p><b>🍽 Menú.</b> Edita el menú de cada día de la semana (se repite). Para cambiar solo una fecha, ve al calendario → “Menú de esta fecha”. Marca ⚠️ los platos dudosos: no se publican hasta confirmarlos. Con 📷 agregas la foto de cada plato.</p>
    <p><b>🖼 Plantillas.</b> En Menú → “Plantilla del día” obtienes una imagen lista para WhatsApp/Instagram con los platos, fotos y precio. “Plantilla semanal” junta toda la semana.</p>
    <p><b>🔗 Publicar.</b> Genera el enlace que envías a tus clientes con el menú vigente. Cada vez que cambies el menú, vuelve a publicar y reenvía.</p>
    <p><b>🧾 Pedidos.</b> Cuando llegue un pedido por WhatsApp, usa “Pegar de WhatsApp” y se llena solo. También puedes crear pedidos a mano.</p>
    <p><b>👥 Clientes.</b> Se crean al registrar pedidos. Marca ⭐ a los frecuentes.</p>
    <p><b>💰 Finanzas.</b> Ingresos = pedidos pagados. “Por cobrar” = entregados sin pagar. Anota tus gastos aquí.</p>
    <p><b>🛒 Compras.</b> Lista de insumos; al marcarlos comprados, “Pasar comprados a gastos” los registra en Finanzas.</p>
    <button class="btn primary block" id="rep">Ver recorrido guiado</button>`);
  $('#rep', m).onclick = () => { m.close(); tour(PASOS, 'comida_tour_dueno', true); };
}

/* ---------- eventos ---------- */
const ACT = {
  calPrev: () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() - 1, 1); render(); },
  calNext: () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 1); render(); },
  calHoy: () => { S.month = firstOf(new Date()); S.sel = hoyISO(); render(); },
  selDia: b => { S.sel = b.dataset.d; render(); },
  bloq: () => { if (DB.bloqueados[S.sel] !== undefined) delete DB.bloqueados[S.sel]; else { const r = prompt('Motivo (opcional)', ''); if (r === null) return; DB.bloqueados[S.sel] = r.trim(); } save(); render(); },
  nuevoPed: b => openPedido(null, b.dataset.d),
  editPed: b => openPedido(b.dataset.id),
  pagado: b => { const p = DB.pedidos.find(x => x.id === b.dataset.id); p.pagado = !p.pagado; save(); render(); },
  waCli: b => window.open('https://wa.me/' + normTel(b.dataset.t), '_blank'),
  plantillaDia: b => openPlantillaDia(b.dataset.d),
  menuFecha: b => { const s = b.dataset.d; if (!DB.menuFecha[s]) DB.menuFecha[s] = structuredClone(menuDe(s) || {items: [], guar: '', precio: null}); save(); S.edit = {kind: 'fecha', iso: s}; S.tab = 'menu'; render(); },
  editDia: b => { S.edit = {kind: 'dia', key: b.dataset.k}; render(); },
  catalogo: () => openCatalogo(),
  aCat: b => { const it = ed().items[+b.dataset.i], n = it.nombre.trim(); if (!n) return; const c = DB.catalogo.find(x => x.nombre.toLowerCase() === n.toLowerCase()); const f = DB.fotos[it.id] || '';
    if (c) { if (f) c.foto = f; } else DB.catalogo.push({id: 'cat_' + uid(), nombre: n, tipo: 'almuerzo', foto: f}); save(); toast('Guardado en el catálogo'); },
  addItem: () => { ed().items.push({id: uid(), nombre: 'Nuevo plato', revisar: false}); save(); render(); },
  delItem: b => { const e = ed(), i = +b.dataset.i; delete DB.fotos[e.items[i].id]; e.items.splice(i, 1); save(); render(); },
  rev: b => { const it = ed().items[+b.dataset.i]; it.revisar = !it.revisar; save(); render(); },
  foto: b => { S.fotoI = +b.dataset.i; const f = $('#file-foto'); f.value = ''; f.click(); },
  plantillaEd: () => openPlantillaDia(S.edit.kind === 'fecha' ? S.edit.iso : nextDate(S.edit.key)),
  plantillaSemana: openPlantillaSemana,
  publicar: openPublicar,
  quitarFecha: () => { delete DB.menuFecha[S.edit.iso]; save(); S.edit = {kind: 'dia', key: 'lun'}; render(); },
  pedF: b => { S.pedF = b.dataset.f; render(); },
  pegarWA: () => {
    const m = modal(`<h3>Pegar pedido de WhatsApp <button class="ibtn" data-close>✕</button></h3><textarea id="wa-t" rows="9" placeholder="Pega aquí el mensaje que te llegó…"></textarea><button class="btn primary block" id="wa-ok" style="margin-top:10px">Crear pedido</button>`);
    $('#wa-ok', m).onclick = () => { const p = parsePedidoWA($('#wa-t', m).value); if (!p.nombre || !p.items.length) return toast('No pude leer el pedido: revisa que sea el mensaje de la app'); m.close(); openPedido(null, p.fecha, p); };
  },
  nuevoCli: () => openCliente(null),
  editCli: b => openCliente(b.dataset.id),
  pedCli: b => { const c = DB.clientes.find(x => x.id === b.dataset.id); openPedido(null, hoyISO(), {nombre: c.nombre, tel: c.tel, dir: c.dir, tipo: c.dir ? 'despacho' : 'retiro'}); },
  finPrev: () => { S.fin = new Date(S.fin.getFullYear(), S.fin.getMonth() - 1, 1); render(); },
  finNext: () => { S.fin = new Date(S.fin.getFullYear(), S.fin.getMonth() + 1, 1); render(); },
  addGasto: () => { const c = $('#g-con').value.trim(), mo = +$('#g-mon').value; if (!c || !mo) return toast('Escribe concepto y monto'); const hoy = hoyISO(), y = S.fin.getFullYear(), mm = S.fin.getMonth(); const f = hoy.startsWith(`${y}-${pad2(mm + 1)}`) ? hoy : iso(new Date(y, mm, 1)); DB.gastos.push({id: uid(), fecha: f, concepto: c, monto: mo}); save(); render(); },
  delGasto: b => { DB.gastos = DB.gastos.filter(g => g.id !== b.dataset.id); save(); render(); },
  addComp: () => { const n = $('#k-nom').value.trim(); if (!n) return toast('Escribe el insumo'); DB.compras.push({id: uid(), nombre: n, cant: $('#k-can').value.trim(), precio: +$('#k-pre').value || 0, ok: false}); save(); render(); },
  delComp: b => { DB.compras = DB.compras.filter(c => c.id !== b.dataset.id); save(); render(); },
  compGastos: () => { const ok = DB.compras.filter(c => c.ok && c.precio > 0); if (!ok.length) return toast('Marca insumos comprados con costo'); ok.forEach(c => DB.gastos.push({id: uid(), fecha: hoyISO(), concepto: c.nombre + (c.cant ? ' (' + c.cant + ')' : ''), monto: c.precio})); DB.compras = DB.compras.filter(c => !(c.ok && c.precio > 0)); save(); render(); toast(ok.length + ' gasto(s) registrado(s)'); }
};
const BIND = {
  estado: el => { DB.pedidos.find(x => x.id === el.dataset.id).estado = el.value; save(); render(); },
  itemNombre: el => { ed().items[+el.dataset.i].nombre = el.value; save(); },
  guar: el => { ed().guar = el.value; save(); },
  precio: el => { ed().precio = el.value === '' ? null : +el.value; save(); },
  busca: el => { S.q = el.value; $('#lista-cli').innerHTML = listaCli(); },
  compOk: el => { DB.compras.find(c => c.id === el.dataset.id).ok = el.checked; save(); render(); }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) ACT[b.dataset.act](b, e); });
['input', 'change'].forEach(t => document.addEventListener(t, e => {
  const el = e.target, f = el.dataset && el.dataset.b; if (!f || !BIND[f]) return;
  const live = ['itemNombre', 'guar', 'precio', 'busca'].includes(f); if (t === 'input' ? live : !live) BIND[f](el);
}));
$('#file-foto').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try { const it = ed().items[S.fotoI]; DB.fotos[it.id] = await fileToThumb(file); save(); render(); toast('Foto guardada'); } catch (x) { toast('No pude leer esa imagen'); }
});
$('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) { S.tab = b.dataset.tab; render(); scrollTo(0, 0); } });
$('#btn-ajustes').onclick = openAjustes; $('#btn-ayuda').onclick = openAyuda;

const VIEWS = {cal: vCal, menu: vMenu, ped: vPed, cli: vCli, fin: vFin, comp: vComp};
function render() { $('#main').innerHTML = VIEWS[S.tab](); $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === S.tab)); }
function head() { $('#marca').innerHTML = `${esc(DB.cfg.nombre)}<small>Panel del dueño · pedidos · menú · finanzas</small>`; }
head(); render();
setTimeout(() => tour(PASOS, 'comida_tour_dueno'), 600);
