/*
 * Modo edición del Tour 360° GEOMAV (equivalente al de Marzipano Tool):
 * vista inicial, hotspots de enlace entre escenas, hotspots de información, nombres y exportación a ZIP.
 */
(function () {
  'use strict';
  if (!window.TourAPI) return;
  var API = window.TourAPI;
  var $ = function (id) { return document.getElementById(id); };
  var toast = function (m, ms) { if (window.TourToast) window.TourToast(m, ms); };
  var cleanName = function (n) { return String(n || '').replace(/^\s*\d+\s*-\s*/, '').trim(); };

  // ---------- Botón y panel ----------
  var ctr = $('controls');
  var btn = document.createElement('button');
  btn.className = 'icon-btn'; btn.id = 'btnEdit'; btn.type = 'button';
  btn.title = 'Editar tour'; btn.setAttribute('aria-label', 'Editar tour');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>';
  ctr.insertBefore(btn, $('btnShare'));

  var panel = document.createElement('aside');
  panel.id = 'editor'; panel.hidden = true; panel.setAttribute('aria-label', 'Editar tour');
  document.body.appendChild(panel);

  var mode = null;           // null | 'link' | 'info'
  var pending = null;        // {yaw, pitch}
  var confirmDel = false;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function button(text, cls, fn) { var b = el('button', cls || 'ed-btn', text); b.type = 'button'; b.addEventListener('click', fn); return b; }

  function curScene() { var id = API.currentId(); return id ? API.scene(id) : null; }

  function render() {
    panel.innerHTML = '';
    var head = el('div', 'ed-head');
    head.appendChild(el('strong', null, 'Editar tour'));
    head.appendChild(button('×', 'ed-x', cerrar));
    panel.appendChild(head);

    var s = curScene();
    if (!s || !s.editable) {
      panel.appendChild(el('p', 'ed-note', 'Para editar, primero carga tus fotos 360° con el botón de subir (⬆). Aquí podrás fijar la vista inicial, crear enlaces entre escenas, agregar información y exportar el tour.'));
      return;
    }

    var f1 = el('label', 'ed-field', 'Título del tour'); var t = el('input'); t.type = 'text'; t.value = API.title() === 'Mis fotos 360°' ? '' : API.title(); t.placeholder = 'Mi tour 360°';
    t.addEventListener('input', function () { API.setTitle(t.value.trim() || 'Mis fotos 360°'); }); f1.appendChild(t); panel.appendChild(f1);

    var f2 = el('label', 'ed-field', 'Nombre de esta escena'); var n = el('input'); n.type = 'text'; n.value = s.name;
    n.addEventListener('input', function () { s.name = n.value; $('sceneName').textContent = n.value; API.rebuildMenu(); }); f2.appendChild(n); panel.appendChild(f2);

    var row = el('div', 'ed-row');
    row.appendChild(button('📍 Fijar vista inicial', 'ed-btn', function () {
      var v = API.view(); if (!v) return; s.initialView = { yaw: v.yaw, pitch: v.pitch }; toast('Vista inicial guardada para esta escena.');
    }));
    row.appendChild(button('➜ Enlace', 'ed-btn' + (mode === 'link' ? ' on' : ''), function () { setMode(mode === 'link' ? null : 'link'); }));
    row.appendChild(button('ℹ Información', 'ed-btn' + (mode === 'info' ? ' on' : ''), function () { setMode(mode === 'info' ? null : 'info'); }));
    panel.appendChild(row);

    if (mode && !pending) panel.appendChild(el('p', 'ed-note ed-hint', mode === 'link'
      ? 'Toca en la imagen el lugar donde quieres el enlace.' : 'Toca en la imagen el lugar donde quieres la información.'));
    if (mode && pending) panel.appendChild(formulario(s));

    // lista de elementos de esta escena
    var items = [];
    (s.links || []).forEach(function (h) { items.push({ h: h, kind: 'link', label: '➜ ' + (cleanName((API.scene(h.target) || {}).name) || '(escena eliminada)') }); });
    (s.hotspots || []).forEach(function (h) { if (h.kind === 'info') items.push({ h: h, kind: 'info', label: 'ℹ ' + (h.title || 'Información') }); });
    if (items.length) {
      panel.appendChild(el('div', 'ed-sub', 'En esta escena'));
      var ul = el('ul', 'ed-list');
      items.forEach(function (it) {
        var li = el('li'); li.appendChild(el('span', null, it.label));
        li.appendChild(button('Quitar', 'ed-mini', function () {
          var arr = it.kind === 'link' ? s.links : s.hotspots; arr.splice(arr.indexOf(it.h), 1); API.removeHotspot(it.h); render();
        }));
        ul.appendChild(li);
      });
      panel.appendChild(ul);
    }

    var foot = el('div', 'ed-row ed-foot');
    foot.appendChild(button('⬇ Exportar ZIP', 'ed-btn primary', exportar));
    foot.appendChild(button(confirmDel ? '¿Seguro? Toca otra vez' : '🗑 Quitar escena', 'ed-btn' + (confirmDel ? ' warn' : ''), function () {
      if (!confirmDel) { confirmDel = true; render(); setTimeout(function () { if (confirmDel) { confirmDel = false; render(); } }, 3500); return; }
      confirmDel = false; quitarEscena(s.id);
    }));
    panel.appendChild(foot);
  }

  function formulario(s) {
    var f = el('div', 'ed-form');
    if (mode === 'link') {
      var others = API.order().filter(function (id) { return id !== s.id; });
      if (!others.length) { f.appendChild(el('p', 'ed-note', 'Carga al menos otra foto para poder enlazar escenas.')); f.appendChild(button('Cancelar', 'ed-btn', function () { pending = null; render(); })); return f; }
      var lab = el('label', 'ed-field', 'Ir a la escena'); var sel = el('select');
      others.forEach(function (id) { var o = el('option', null, cleanName(API.scene(id).name)); o.value = id; sel.appendChild(o); });
      lab.appendChild(sel); f.appendChild(lab);
      var back = el('label', 'ed-check'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = true; back.appendChild(cb); back.appendChild(document.createTextNode(' Crear también el enlace de regreso'));
      f.appendChild(back);
      var r = el('div', 'ed-row');
      r.appendChild(button('Crear enlace', 'ed-btn primary', function () {
        var h = { yaw: pending.yaw, pitch: pending.pitch, hfov: 8, vfov: 8, target: sel.value, arrival: null };
        s.links.push(h); API.addHotspot(h, 'link');
        if (cb.checked) {
          var dest = API.scene(sel.value), v = API.view() || { yaw: 0, pitch: 0 };
          var back = { yaw: ((pending.yaw + 180 + 540) % 360) - 180, pitch: -10, hfov: 8, vfov: 8, target: s.id, arrival: null };
          dest.links.push(back); API.invalidate(dest.id);
        }
        pending = null; render(); toast('Enlace creado.');
      }));
      r.appendChild(button('Cancelar', 'ed-btn', function () { pending = null; render(); }));
      f.appendChild(r);
    } else {
      var l1 = el('label', 'ed-field', 'Título'); var ti = el('input'); ti.type = 'text'; ti.maxLength = 80; l1.appendChild(ti); f.appendChild(l1);
      var l2 = el('label', 'ed-field', 'Texto'); var tx = el('textarea'); tx.rows = 3; tx.maxLength = 600; l2.appendChild(tx); f.appendChild(l2);
      var r2 = el('div', 'ed-row');
      r2.appendChild(button('Crear información', 'ed-btn primary', function () {
        if (!ti.value.trim() && !tx.value.trim()) { toast('Escribe un título o un texto.'); return; }
        var h = { kind: 'info', yaw: pending.yaw, pitch: pending.pitch, hfov: 7, vfov: 7, title: ti.value.trim(), text: tx.value.trim() };
        s.hotspots.push(h); API.addHotspot(h, 'info'); pending = null; render(); toast('Información agregada.');
      }));
      r2.appendChild(button('Cancelar', 'ed-btn', function () { pending = null; render(); }));
      f.appendChild(r2);
    }
    return f;
  }

  function setMode(m) { mode = m; pending = null; document.body.classList.toggle('placing', !!m); render(); }

  function quitarEscena(id) {
    API.order().forEach(function (oid) {
      var o = API.scene(oid); if (!o || oid === id) return;
      var n = (o.links || []).length; o.links = (o.links || []).filter(function (h) { return h.target !== id; });
      if (o.links.length !== n) API.invalidate(oid);
    });
    API.removeScene(id); pending = null; mode = null; document.body.classList.remove('placing');
    if (!API.order().length) { toast('Quitaste todas las escenas. Carga fotos nuevas con ⬆.'); }
    render();
  }

  function abrir() {
    panel.hidden = false; document.body.classList.add('editing'); btn.classList.add('on');
    API.setEditHook(function () { toast('Modo edición: usa la lista del panel para quitar este elemento.'); return true; });
    render();
  }
  function cerrar() {
    panel.hidden = true; document.body.classList.remove('editing', 'placing'); btn.classList.remove('on');
    mode = null; pending = null; confirmDel = false; API.setEditHook(null);
  }
  btn.addEventListener('click', function () { if (panel.hidden) abrir(); else cerrar(); });

  // Cambió la escena (menú, flechas): refrescar el panel
  var lastId = null;
  setInterval(function () { if (!panel.hidden && API.currentId() !== lastId) { lastId = API.currentId(); pending = null; confirmDel = false; render(); } }, 300);

  // ---------- Colocar hotspots tocando la imagen ----------
  var down = null, pano = $('pano');
  pano.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: Date.now() }; });
  pano.addEventListener('pointerup', function (e) {
    if (!mode || !down || panel.hidden) return;
    var moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y), dt = Date.now() - down.t; down = null;
    if (moved > 8 || dt > 600 || (e.target.closest && e.target.closest('.hs'))) return;
    var c = API.coords(e.clientX, e.clientY); if (!c) return;
    pending = c; render();
  });

  // ---------- Exportar ZIP (sin compresión, formato estándar) ----------
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(entries) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, now = new Date();
    var dt = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    var tm = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    entries.forEach(function (e) {
      var nm = enc.encode(e.name), crc = crc32(e.data), sz = e.data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, nm, e.data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, nm);
      offset += 30 + nm.length + sz;
    });
    var csize = 0; central.forEach(function (b) { csize += b.byteLength; });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }

  function slug(t) { return String(t || 'tour').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tour'; }
  function fetchText(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url); return r.text(); }); }
  var enc = new TextEncoder();

  function exportar() {
    var ids = API.order().filter(function (id) { var s = API.scene(id); return s && s.editable; });
    if (!ids.length) { toast('No hay fotos propias para exportar.'); return; }
    toast('Preparando el ZIP…', 120000);
    var entries = [], title = API.title() === 'Mis fotos 360°' ? 'Mi tour 360°' : API.title();
    var base = ['css/tour.css', 'js/gyro.js', 'js/tour.js', 'lib/marzipano.js', 'config.js'];
    Promise.all([fetchText('index.html')].concat(base.map(fetchText))).then(function (txt) {
      var html = txt[0].split('\n').filter(function (l) { return !/js\/(cargar|teselas|editor)\.js/.test(l); }).join('\n')
        .replace(/<title>[^<]*<\/title>/, '<title>' + title.replace(/[<>&]/g, '') + '</title>');
      entries.push({ name: 'index.html', data: enc.encode(html) });
      base.forEach(function (n, i) { entries.push({ name: n, data: enc.encode(txt[i + 1]) }); });

      var scenes = ids.map(function (id) {
        var s = API.scene(id);
        return {
          id: id, name: s.name, thumbnail: 'media/' + id + '_t.jpg',
          levels: s.levels.map(function (l, i) { return { index: i, size: l.size, tileSize: l.tileSize, url: 'media/' + id + '/' + i + '/{face}/{row}_{column}.jpg' }; }),
          initialView: s.initialView || { yaw: 0, pitch: 0 }, hfovMax: s.hfovMax || 130,
          links: (s.links || []).map(function (h) { return { yaw: h.yaw, pitch: h.pitch, hfov: h.hfov, vfov: h.vfov, target: h.target, arrival: null }; }),
          hotspots: (s.hotspots || []).filter(function (h) { return h.kind === 'info'; }).map(function (h) { return { kind: 'info', yaw: h.yaw, pitch: h.pitch, hfov: h.hfov, vfov: h.vfov, title: h.title, text: h.text }; })
        };
      });
      var data = { title: title, source: 'marzipano-geomav', order: ids, menu: [], scenes: scenes };
      entries.push({ name: 'tour.js', data: enc.encode('window.TOUR = ' + JSON.stringify(data) + ';\n') });
      entries.push({ name: 'LEEME.txt', data: enc.encode(
        'TOUR 360° - ' + title + '\r\n\r\nCómo publicarlo:\r\n1. Sube TODA esta carpeta (index.html, css, js, lib, media, tour.js, config.js) a tu hosting.\r\n' +
        '2. Abre la dirección de la carpeta en el navegador. No funciona abriendo index.html con doble clic: debe ir por http/https.\r\n' +
        '3. Personaliza logo, color y textos editando config.js.\r\n\r\nGenerado con Tour 360° GEOMAV (visor Marzipano, Apache-2.0).\r\n') });

      var jobs = [];
      ids.forEach(function (id) {
        var s = API.scene(id);
        if (s.thumbBlob) jobs.push(s.thumbBlob.arrayBuffer().then(function (b) { entries.push({ name: 'media/' + id + '_t.jpg', data: new Uint8Array(b) }); }));
        Object.keys(s.tileBlobs).forEach(function (k) {
          var p = k.split('/');                                     // nivel/cara/fila_columna
          jobs.push(s.tileBlobs[k].arrayBuffer().then(function (b) { entries.push({ name: 'media/' + id + '/' + p[0] + '/' + p[1] + '/' + p[2] + '.jpg', data: new Uint8Array(b) }); }));
        });
      });
      return Promise.all(jobs);
    }).then(function () {
      var blob = makeZip(entries), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = slug(title) + '.zip'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
      toast('ZIP listo (' + (blob.size / 1048576).toFixed(1) + ' MB). Sube la carpeta a tu hosting.', 6000);
    }).catch(function (e) { toast('No se pudo exportar: ' + (e && e.message ? e.message : e), 6000); });
  }

  window.TourEditor = { open: abrir, close: cerrar, makeZip: makeZip };
})();
