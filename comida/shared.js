'use strict';
/* ===== Utilidades comunes (vista cliente + vista dueño) ===== */
const DIAS_NOM = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIAS_KEY = ['dom','lun','mar','mie','jue','vie','sab'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const COLOR_DIA = {lun:'#C8442B',mar:'#2F6B4F',mie:'#2C6B7E',jue:'#B7791F',vie:'#8C3B5A',sab:'#0A2240',dom:'#555555'};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad2 = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dkey = d => DIAS_KEY[d.getDay()];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const money = n => (n == null || n === '' || isNaN(n)) ? '—' : '$' + Math.round(n).toLocaleString('es-CL');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtFecha = s => { const d = parseISO(s); return `${DIAS_NOM[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`; };
const fmtWa = w => /^56\d{9}$/.test(w) ? `+${w.slice(0,2)} ${w[2]} ${w.slice(3,7)} ${w.slice(7)}` : w;

/* ===== Feriados de Chile =====
   2026 verificados contra calendario oficial (oct–dic confirmados: 12-oct, 31-oct, 1-nov, 8-dic, 25-dic).
   Otros años: solo fechas fijas. Los feriados móviles (29-jun, 12-oct, 31-oct, etc.) hay que cargarlos cada año. */
const FER_2026 = {
  '2026-01-01':'Año Nuevo','2026-04-03':'Viernes Santo','2026-04-04':'Sábado Santo','2026-05-01':'Día del Trabajo',
  '2026-06-29':'San Pedro y San Pablo','2026-07-16':'Virgen del Carmen','2026-08-15':'Asunción de la Virgen',
  '2026-09-18':'Fiestas Patrias','2026-09-19':'Glorias del Ejército','2026-10-12':'Encuentro de Dos Mundos',
  '2026-10-31':'Iglesias Evangélicas','2026-11-01':'Todos los Santos','2026-12-08':'Inmaculada Concepción','2026-12-25':'Navidad'
};
const FER_FIJOS = {'01-01':'Año Nuevo','05-01':'Día del Trabajo','05-21':'Glorias Navales','08-15':'Asunción de la Virgen','09-18':'Fiestas Patrias','09-19':'Glorias del Ejército','11-01':'Todos los Santos','12-08':'Inmaculada Concepción','12-25':'Navidad'};
const feriado = s => s.startsWith('2026-') ? (FER_2026[s] || null) : (FER_FIJOS[s.slice(5)] || null);

/* ===== Datos del dueño (localStorage) ===== */
const DB_KEY = 'comida_v1';
const DEF_CFG = {nombre:'La Cocina de Emi', wa:'56984867813', capacidad:20, aviso:''};

function seedDB() {
  const mk = (k, items, guar, precio) => ({
    items: items.map((t, i) => ({id: k + (i + 1), nombre: t[0], revisar: !!t[1]})),
    guar: guar || '', precio: precio ?? null
  });
  return {
    v: 1, cfg: {...DEF_CFG},
    menu: {
      lun: mk('lun', [['Carne de olla'], ['Pollo arvejado'], ['Por confirmar (releer nota del lunes)', 1]], 'Puré · Arroz · Tallarín · Ensalada'),
      mar: mk('mar', [['Porotos con riendas'], ['Chuleta al jugo'], ['Pechuga apanada']], 'Puré · Tallarín · Arroz · Ensalada'),
      mie: mk('mie', [['Charquicán con… (completar)', 1], ['Pescado'], ['Estofado de vacuno']], ''),
      jue: mk('jue', [['Pollo asado'], ['Tallarín con salsa'], ['Chuleta velada al horno (revisar)', 1]], ''),
      vie: mk('vie', [['Chuleta … (revisar)', 1], ['Budín de zapallo'], ['Lentejas']], ''),
      sab: mk('sab', [['Pollo asado con papas'], ['Pollo asado con arroz y papas fritas']], '')
    },
    menuFecha: {}, fotos: {}, clientes: [], pedidos: [], gastos: [], compras: [], bloqueados: {}
  };
}
function loadDB() {
  try { const r = JSON.parse(localStorage.getItem(DB_KEY)); if (r && r.v === 1) return r; } catch (e) {}
  return seedDB();
}
function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); return true; }
  catch (e) { toast('Almacenamiento lleno: exporta un respaldo y quita fotos.'); return false; }
}
function menuDeDB(db, s) {
  const d = parseISO(s), k = dkey(d);
  const m = (db.menuFecha && db.menuFecha[s]) || db.menu[k];
  return m && m.items.length ? m : null;
}

/* ===== Menú publicado para clientes (viaja dentro del enlace) ===== */
function buildPub(db) {
  const hoy = iso(new Date());
  const lite = d => ({i: d.items.filter(x => !x.revisar).map(x => x.nombre), g: d.guar || '', p: d.precio});
  const m = {};
  for (const k of ['lun','mar','mie','jue','vie','sab']) m[k] = lite(db.menu[k]);
  const f = {};
  for (const [s, d] of Object.entries(db.menuFecha || {})) if (s >= hoy) f[s] = lite(d);
  const b = Object.keys(db.bloqueados || {}).filter(s => s >= hoy);
  return {n: db.cfg.nombre, w: db.cfg.wa, a: db.cfg.aviso || '', m, f, b};
}
function pubMenu(pub, s) {
  const x = (pub.f && pub.f[s]) || (pub.m && pub.m[dkey(parseISO(s))]);
  return x && x.i && x.i.length ? x : null;
}
const encodePub = p => btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function decodePub(t) {
  try {
    const b = t.replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(decodeURIComponent(escape(atob(b + '='.repeat((4 - b.length % 4) % 4)))));
    return p && p.m ? p : null;
  } catch (e) { return null; }
}

/* ===== UI: toast, modal, recorrido guiado ===== */
function toast(msg, ms = 2600) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
function modal(html, onClose) {
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = `<div class="box">${html}</div>`;
  const close = () => { ov.remove(); if (onClose) onClose(); };
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.body.appendChild(ov);
  ov.close = close;
  const x = $('[data-close]', ov); if (x) x.addEventListener('click', close);
  return ov;
}
function tour(steps, key, force) {
  if (!force) { try { if (localStorage.getItem(key)) return; } catch (e) {} }
  const ov = document.createElement('div'); ov.className = 'tour-ov';
  const spot = document.createElement('div'); spot.className = 'tour-spot';
  const tip = document.createElement('div'); tip.className = 'tour-tip';
  ov.append(spot, tip); document.body.appendChild(ov);
  let i = 0;
  const end = () => { ov.remove(); try { localStorage.setItem(key, '1'); } catch (e) {} };
  const show = () => {
    const s = steps[i], el = s.sel ? $(s.sel) : null;
    if (s.sel && !el) { i++; return i < steps.length ? show() : end(); }
    if (el) el.scrollIntoView({block: 'center', behavior: 'instant'});
    const r = el ? el.getBoundingClientRect() : null;
    if (r) Object.assign(spot.style, {left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px'});
    else Object.assign(spot.style, {left: '50%', top: '40%', width: '0', height: '0'});
    tip.innerHTML = `<h4>${esc(s.t)}</h4><p>${esc(s.d)}</p><div class="row sb"><button class="btn sm" data-skip>Saltar</button><span class="muted">${i + 1}/${steps.length}</span><button class="btn sm primary" data-next>${i === steps.length - 1 ? 'Listo' : 'Siguiente'}</button></div>`;
    tip.style.left = '50%'; tip.style.transform = 'translateX(-50%)'; tip.style.top = ''; tip.style.bottom = '';
    const below = !r || r.top < innerHeight / 2;
    if (below) tip.style.top = (r ? Math.min(r.bottom + 14, innerHeight - 190) : innerHeight * .3) + 'px';
    else tip.style.bottom = Math.max(innerHeight - r.top + 14, 12) + 'px';
    $('[data-skip]', tip).onclick = end;
    $('[data-next]', tip).onclick = () => { i++; i < steps.length ? show() : end(); };
  };
  show();
}

/* ===== Plantillas de imagen (canvas) ===== */
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function wrapText(c, text, maxW) {
  const lines = []; let cur = '';
  for (const w of String(text).split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

/* o = {dia, fecha:Date, nombre, wa, items:[{nombre, foto(dataURL|null)}], guar, precio} — 1080×1350 */
async function renderDia(canvas, o) {
  const W = 1080, H = 1350; canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d'), col = COLOR_DIA[o.dia] || '#444';
  c.fillStyle = col; c.fillRect(0, 0, W, H);
  c.globalAlpha = .10; c.fillStyle = '#fff';
  c.beginPath(); c.arc(W - 80, 120, 260, 0, 7); c.fill(); c.beginPath(); c.arc(40, H - 60, 300, 0, 7); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '700 34px system-ui,sans-serif'; c.fillText((o.nombre || '').toUpperCase(), 70, 100);
  c.globalAlpha = .85; c.font = '500 30px system-ui,sans-serif'; c.fillText('MENÚ DEL DÍA', 70, 146); c.globalAlpha = 1;
  c.font = '800 128px system-ui,sans-serif'; c.fillText(DIAS_NOM[o.fecha.getDay()], 66, 290);
  c.font = '500 40px system-ui,sans-serif'; c.fillText(`${o.fecha.getDate()} de ${MESES[o.fecha.getMonth()].toLowerCase()}`, 70, 350);
  const cx = 50, cy = 395, cw = W - 100, ch = 800;
  rr(c, cx, cy, cw, ch, 36); c.fillStyle = '#FFF8EE'; c.fill();
  const imgs = await Promise.all(o.items.map(i => loadImg(i.foto)));
  const reserve = o.guar ? 150 : 40, n = Math.max(o.items.length, 1);
  const rowH = Math.min(200, (ch - 40 - reserve) / n);
  if (!o.items.length) { c.fillStyle = '#7A6A5A'; c.font = '500 40px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('Menú por confirmar', W / 2, cy + 200); c.textAlign = 'left'; }
  o.items.forEach((it, i) => {
    const y0 = cy + 30 + i * rowH, r = Math.min(80, rowH / 2 - 14), px = cx + 50 + r, py = y0 + rowH / 2;
    if (imgs[i]) {
      c.save(); c.beginPath(); c.arc(px, py, r, 0, 7); c.clip();
      const im = imgs[i], s = Math.max(2 * r / im.width, 2 * r / im.height), w = im.width * s, h = im.height * s;
      c.drawImage(im, px - w / 2, py - h / 2, w, h); c.restore();
    } else {
      c.fillStyle = '#F0E3CC'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
      c.strokeStyle = '#D6C2A0'; c.lineWidth = 5; c.beginPath(); c.arc(px, py, r * .62, 0, 7); c.stroke();
    }
    c.fillStyle = '#2B1D14';
    const tx = cx + 50 + 2 * r + 36, mw = cw - (tx - cx) - 40;
    let fs = 46; c.font = `700 ${fs}px system-ui,sans-serif`;
    let lines = wrapText(c, it.nombre, mw);
    if (lines.length > 2) { fs = 36; c.font = `700 ${fs}px system-ui,sans-serif`; lines = wrapText(c, it.nombre, mw).slice(0, 2); }
    const lh = fs * 1.15, top = py - (lines.length * lh) / 2 + fs * .85;
    lines.forEach((l, k) => c.fillText(l, tx, top + k * lh));
    if (i < o.items.length - 1) { c.strokeStyle = '#EADFCB'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 40, y0 + rowH); c.lineTo(cx + cw - 40, y0 + rowH); c.stroke(); }
  });
  if (o.guar) {
    c.fillStyle = '#6b5a48'; c.font = 'italic 500 32px system-ui,sans-serif';
    wrapText(c, 'Acompañamientos: ' + o.guar, cw - 330).slice(0, 2).forEach((l, k) => c.fillText(l, cx + 45, cy + ch - 80 + k * 40));
  }
  if (o.precio != null && o.precio !== '') {
    c.fillStyle = '#E8A93A'; c.beginPath(); c.arc(W - 160, cy + ch - 20, 92, 0, 7); c.fill();
    c.fillStyle = '#2B1D14'; c.textAlign = 'center'; c.font = '800 48px system-ui,sans-serif'; c.fillText(money(o.precio), W - 160, cy + ch - 4);
    c.font = '600 24px system-ui,sans-serif'; c.fillText('almuerzo', W - 160, cy + ch + 26); c.textAlign = 'left';
  }
  c.fillStyle = '#fff'; c.font = '500 32px system-ui,sans-serif'; c.fillText('Pedidos por WhatsApp', 70, 1262);
  c.font = '800 46px system-ui,sans-serif'; c.fillText(fmtWa(o.wa || ''), 70, 1316);
}

/* o = {nombre, wa, dias:[{key, items:[nombre], precio}]} — 1080×1920 */
function renderSemana(canvas, o) {
  const W = 1080, H = 1920; canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  c.fillStyle = '#FFF8EE'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#2B1D14'; c.textAlign = 'left';
  c.font = '700 34px system-ui,sans-serif'; c.fillText((o.nombre || '').toUpperCase(), 60, 90);
  c.font = '800 96px system-ui,sans-serif'; c.fillText('Menú de la semana', 56, 190);
  const bh = 232, y0 = 240;
  o.dias.forEach((d, i) => {
    const y = y0 + i * (bh + 14);
    rr(c, 40, y, W - 80, bh, 28); c.fillStyle = COLOR_DIA[d.key]; c.fill();
    c.fillStyle = '#fff'; c.font = '800 54px system-ui,sans-serif'; c.fillText(DIAS_NOM[DIAS_KEY.indexOf(d.key)], 76, y + 82);
    if (d.precio != null && d.precio !== '') { c.font = '700 38px system-ui,sans-serif'; c.fillText(money(d.precio), 76, y + 140); }
    c.font = '600 36px system-ui,sans-serif';
    const txt = d.items.length ? d.items.join(' · ') : 'Por confirmar';
    wrapText(c, txt, 560).slice(0, 4).forEach((l, k) => c.fillText(l, 400, y + 66 + k * 46));
  });
  c.fillStyle = '#2B1D14'; c.font = '500 32px system-ui,sans-serif'; c.fillText('Pedidos por WhatsApp', 60, 1830);
  c.font = '800 46px system-ui,sans-serif'; c.fillText(fmtWa(o.wa || ''), 60, 1884);
}

/* Miniatura cuadrada (recorte centrado) para fotos de platos */
function fileToThumb(file, size = 480) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = cv.height = size;
      const s = Math.min(im.width, im.height), sx = (im.width - s) / 2, sy = (im.height - s) / 2;
      cv.getContext('2d').drawImage(im, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', .8));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('imagen')); };
    im.src = url;
  });
}
function canvasToBlob(cv) { return new Promise(r => cv.toBlob(r, 'image/png')); }
async function descargarOCompartir(cv, nombre, compartir) {
  const blob = await canvasToBlob(cv), file = new File([blob], nombre + '.png', {type: 'image/png'});
  if (compartir && navigator.canShare && navigator.canShare({files: [file]})) {
    try { await navigator.share({files: [file], title: nombre}); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre + '.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
