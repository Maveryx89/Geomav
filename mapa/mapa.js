/* Mapa GEOMAV — capas oficiales BCN por región / comuna */
(function () {
  'use strict';
  var BASE = 'data/';

  // ---------- Definición de capas (orden = de abajo hacia arriba) ----------
  var CAPAS = [
    { id: 'comunas', n: 'Comunas', reg: true, sw: { c: '#c0661b', t: 'pol' } },
    { id: 'ipt_prdu', n: 'Plan regional (PRDU)', reg: true, sw: { c: '#6b8e23', f: 'rgba(107,142,35,.25)', t: 'pol' } },
    { id: 'snaspe', n: 'Áreas protegidas (SNASPE)', reg: true, sw: { c: '#3f7d3b', f: 'rgba(63,125,59,.3)', t: 'pol' } },
    { id: 'lagos', n: 'Lagos, embalses y salares', reg: true, sw: { c: '#2a86ad', f: 'rgba(74,163,199,.6)', t: 'pol' } },
    { id: 'areas_pobladas', n: 'Áreas pobladas', reg: true, sw: { c: '#b57640', f: 'rgba(212,154,106,.55)', t: 'pol' } },
    { id: 'ipt_zonas', n: 'Zonificación (plan regulador)', reg: true, sw: { c: '#fff', f: '#e6b84a', t: 'pol' } },
    { id: 'provincias', n: 'Provincias', nac: true, sw: { c: '#0f5f78', t: 'ln' } },
    { id: 'hidrografia', n: 'Ríos, esteros y canales', reg: true, sw: { c: '#0a62c4', t: 'ln' } },
    { id: 'ferrocarril', n: 'Red ferroviaria', reg: true, sw: { c: '#000', t: 'ln' } },
    { id: 'red_vial', n: 'Red vial (rutas y caminos)', reg: true, sw: { c: '#b00020', t: 'ln' } },
    { id: 'ipt_lu', n: 'Límite urbano (plan regulador)', reg: true, sw: { c: '#a3004f', t: 'ln' } },
    { id: 'regiones', n: 'Regiones', nac: true, sw: { c: '#06152b', t: 'ln' } },
    { id: 'aerodromos', n: 'Aeropuertos y aeródromos', reg: true, sw: { c: '#0A2240', f: '#fff', t: 'pt' } },
    { id: 'toponimos', n: 'Topónimos (lugares)', reg: true, sw: { c: '#7a4a8a', f: '#7a4a8a', t: 'pt' } }
  ];
  var GRUPOS = [
    ['Límites administrativos', ['regiones', 'provincias', 'comunas']],
    ['Planificación territorial (IPT)', ['ipt_zonas', 'ipt_lu']],
    ['Territorio', ['areas_pobladas', 'snaspe', 'lagos', 'hidrografia']],
    ['Infraestructura', ['red_vial', 'ferrocarril', 'aerodromos']],
    ['Nombres', ['toponimos']]
  ];
  var DEF = {}; CAPAS.forEach(function (c, i) { c.z = i; DEF[c.id] = c; });

  var LABELS = {
    comunas: { comuna: 'Comuna', provincia: 'Provincia', region: 'Región', cod_comuna: 'Código', sup_km2: 'Superficie (km²)', dis_elec: 'Distrito electoral', circ_sen: 'Circ. senatorial' },
    regiones: { nombre: 'Región', area_km: 'Superficie (km²)' },
    provincias: { provincia: 'Provincia', region: 'Región' },
    areas_pobladas: { localidad: 'Localidad', entidad: 'Tipo', sup_km2: 'Superficie (km²)' },
    snaspe: { nombre: 'Nombre', tipo: 'Tipo', sup_km2: 'Superficie (km²)' },
    lagos: { nombre: 'Nombre', tipo: 'Tipo', sup_km2: 'Superficie (km²)' },
    hidrografia: { nombre: 'Nombre', tipo: 'Tipo' },
    red_vial: { ruta: 'Nombre', rol: 'Rol MOP', clase: 'Clase de ruta', carpeta: 'Carpeta' },
    ferrocarril: { estado: 'Estado (2016)', km: 'Largo (km)' },
    aerodromos: { nombre: 'Nombre', categoria: 'Categoría', oaci: 'Código OACI', iata: 'Código IATA', comuna: 'Comuna' },
    toponimos: { nombre: 'Nombre', clase: 'Clase', comuna: 'Comuna' },
    ipt_zonas: { zona: 'Zona', comuna: 'Comuna', localidad: 'Localidad / sector', instrumento: 'Instrumento', tipo: 'Tipo', cat: 'Categoría (aprox.)', documento: 'Documento', obs: 'Observación' },
    ipt_lu: { comuna: 'Comuna', instrumento: 'Instrumento', administra: 'Administra', documento: 'Documento', sup_ha: 'Superficie (ha)' },
    ipt_prdu: { categoria: 'Categoría', info: 'Tema', condicion: 'Condición', instrumento: 'Instrumento', emisor: 'Emisor' }
  };
  var CATCOL = { 'Residencial / mixta': '#e6b84a', 'Extensión urbana': '#f2d58a', 'Equipamiento': '#d9663d', 'Industrial / productiva': '#8a6fb5', 'Áreas verdes': '#5aa05a', 'Conservación / patrimonio': '#a0693c', 'Riesgo': '#d62828', 'Restricción / faja': '#ef8a17', 'Vialidad': '#7f7f7f', 'Infraestructura': '#5b7c99', 'Otras': '#9aa5ad' };
  var TITULO = { comunas: 'comuna', regiones: 'nombre', provincias: 'provincia', areas_pobladas: 'localidad', snaspe: 'nombre', lagos: 'nombre', hidrografia: 'nombre', red_vial: 'ruta', aerodromos: 'nombre', toponimos: 'nombre', ipt_zonas: 'nombre', ipt_lu: 'nombre', ipt_prdu: 'nombre' };
  var HOVER = { comunas: 1, regiones: 1, provincias: 0, areas_pobladas: 1, snaspe: 1, lagos: 1, aerodromos: 1, toponimos: 1, ipt_zonas: 1, ipt_lu: 1, ipt_prdu: 1 };

  // ---------- Estado ----------
  var state = { regions: [], comuna: null, onlyComuna: true, layers: ['regiones', 'comunas'], base: 'osm' };
  var IDX = null, REGBY = {}, COMBY = {};
  var active = {};            // key -> L.GeoJSON agregado al mapa
  var built = {};             // key -> L.GeoJSON construido (no necesariamente en el mapa)
  var rawCache = {}, rawOrder = [];
  var pending = 0, token = 0;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function has(a, v) { return a.indexOf(v) !== -1; }
  function fmt(b) { return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  // ---------- Mapa ----------
  var map = L.map('mapaLeaflet', { zoomControl: true, minZoom: 3, maxZoom: 19, preferCanvas: true });
  var rend = L.canvas({ padding: 0.4, tolerance: 6 });
  var BASES = {
    osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imágenes © Esri' }),
    claro: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '© OpenStreetMap © CARTO' })
  };
  map.attributionControl.addAttribution('Datos: <a href="https://www.bcn.cl/siit/mapas_vectoriales" target="_blank" rel="noopener">BCN Mapas Vectoriales</a> · GEOMAV');
  map.fitBounds([[-56, -76], [-17.5, -66.5]]);
  var tip = L.tooltip({ sticky: true, direction: 'top', opacity: 1 });

  // ---------- Estilos ----------
  // grosor según zoom: más gruesas al acercarse
  function zf() { var z = map.getZoom(); return z >= 14 ? 1.7 : z >= 12 ? 1.4 : z >= 10 ? 1.15 : z >= 8 ? 1 : .85; }
  function styleFor(id) {
    switch (id) {
      case 'regiones': return function (f) {
        var sel = has(state.regions, f.properties.cod);
        return { renderer: rend, color: '#06152b', weight: sel ? 5 : 3, opacity: 1, fill: true, fillColor: '#0A2240', fillOpacity: state.regions.length ? 0 : .05 };
      };
      case 'provincias': return function () { return { renderer: rend, color: '#0f5f78', weight: 2.4, opacity: .95, dashArray: '10 6', fill: false }; };
      case 'comunas': return function (f) {
        var sel = state.comuna && f.properties.cod_comuna === state.comuna;
        return { renderer: rend, color: sel ? '#8a3b00' : '#c0661b', weight: (sel ? 4.5 : 2) * Math.min(zf(), 1.3), opacity: 1, fill: true, fillColor: '#D49A6A', fillOpacity: sel ? .16 : 0 };
      };
      case 'ipt_zonas': return function (f) {
        var p = f.properties, col = CATCOL[p.cat] || '#9aa5ad';
        return { renderer: rend, color: '#ffffff', weight: 1, fill: true, fillColor: col, fillOpacity: p.tipo === 'Zonificación' ? .62 : .52 };
      };
      case 'ipt_lu': return function () { return { renderer: rend, color: '#a3004f', weight: 3.6 * Math.min(zf(), 1.3), opacity: 1, dashArray: '2 7', lineCap: 'round', fill: true, fillOpacity: 0 }; };
      case 'areas_pobladas': return function () { return { renderer: rend, color: '#9a5a1f', weight: 1.6, fillColor: '#D49A6A', fillOpacity: .6 }; };
      case 'snaspe': return function () { return { renderer: rend, color: '#2e6b2a', weight: 1.8, fillColor: '#4f8a4b', fillOpacity: .3 }; };
      case 'lagos': return function () { return { renderer: rend, color: '#0b6aa0', weight: 1.4, fillColor: '#2f9ad1', fillOpacity: .7 }; };
      case 'hidrografia': return function (f) {
        var t = f.properties.tipo, w = t === 'Río' ? 2.8 : t === 'Canal' ? 2.2 : 1.6;
        return { renderer: rend, color: t === 'Canal' ? '#0a8f8f' : '#0a62c4', weight: w * zf(), opacity: 1, fill: false };
      };
      case 'ferrocarril': return function () { return { renderer: rend, color: '#000000', weight: 3 * zf(), opacity: 1, dashArray: '12 6', fill: false }; };
      case 'red_vial': return function (f) {
        var c = f.properties.clase;
        var col = c === 1 ? '#b00020' : c === 2 ? '#e65100' : c === 3 ? '#3d3d3d' : '#7a3b00';
        var w = c === 1 ? 4.6 : c === 2 ? 3.4 : c === 3 ? 2.2 : 1.8;
        return { renderer: rend, fill: false, color: col, weight: w * zf(), opacity: 1 };
      };
    }
  }
  function pointFor(id) {
    return function (f, ll) {
      var big = id === 'aerodromos' && f.properties.categoria === 'Aeropuerto';
      return L.circleMarker(ll, id === 'aerodromos'
        ? { renderer: rend, radius: big ? 7 : 4.5, color: '#0A2240', weight: 1.6, fillColor: '#fff', fillOpacity: 1 }
        : { renderer: rend, radius: 2.8, color: '#7a4a8a', weight: .8, fillColor: '#7a4a8a', fillOpacity: .85 });
    };
  }

  // ---------- Datos ----------
  function getJSON(path) {
    if (rawCache[path]) return Promise.resolve(rawCache[path]);
    return fetch(BASE + path).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      rawCache[path] = j; rawOrder.push(path);
      if (rawOrder.length > 14) delete rawCache[rawOrder.shift()];
      return j;
    });
  }
  function popupHTML(id, p) {
    var lab = LABELS[id] || {}, rows = '', t = p[TITULO[id]];
    Object.keys(lab).forEach(function (k) { if (k !== TITULO[id] && p[k] != null) rows += '<tr><td>' + esc(lab[k]) + '</td><td><b>' + esc(p[k]) + '</b></td></tr>'; });
    if (id === 'ipt_zonas' && p.url && /^https?:\/\//.test(p.url)) rows += '<tr><td>Documento</td><td><a href="' + esc(p.url) + '" target="_blank" rel="noopener">Ver ↗</a></td></tr>';
    return '<h4>' + esc(t || DEF[id].n) + '</h4>' + (t ? '<div style="font-size:.72rem;color:rgba(10,34,64,.55);margin-bottom:4px">' + esc(DEF[id].n) + '</div>' : '') + (rows ? '<table>' + rows + '</table>' : '');
  }
  function build(key, id, data, filtered) {
    var g = L.geoJSON(data, {
      renderer: rend,
      interactive: id !== 'provincias',
      style: styleFor(id),
      pointToLayer: pointFor(id),
      filter: filtered ? function (f) { var c = f.properties.c; return c === state.comuna || c == null; } : null
    });
    g.on('click', function (e) {
      var p = e.propagatedFrom && e.propagatedFrom.feature && e.propagatedFrom.feature.properties; if (!p) return;
      if (id === 'regiones' && !state.regions.length) { selectRegion(p.cod, true); return; }
      if (id === 'comunas') { selectComuna(p.cod_comuna); }
      var html = popupHTML(id, p);
      var pop = L.popup({ maxWidth: 340, maxHeight: 380 }).setLatLng(e.latlng).setContent(html).openOn(map);
      if (id === 'ipt_zonas' && p.k) {
        var cod = +g._key.split('|')[1];
        getJSON('r' + (cod < 10 ? '0' : '') + cod + '/ipt_usos.json').then(function (u) {
          var x = u[p.k]; if (!x) return;
          pop.setContent(html + '<div class="usos">' + (x.p ? '<b>Usos permitidos</b><p>' + esc(x.p) + '</p>' : '') + (x.r ? '<b>Usos prohibidos</b><p>' + esc(x.r) + '</p>' : '') + '</div>');
        }).catch(function () { });
      }
    });
    if (HOVER[id]) {
      g.on('mouseover', function (e) { var p = e.propagatedFrom.feature.properties, n = p[TITULO[id]]; if (n) { tip.setContent(esc(n)).setLatLng(e.latlng); map.openTooltip(tip); } });
      g.on('mouseout', function () { map.closeTooltip(tip); });
    }
    g._key = key;
    return g;
  }

  // ---------- Refresco de capas ----------
  function desiredKeys() {
    var out = [];
    state.layers.forEach(function (id) {
      var d = DEF[id];
      if (d.nac) out.push({ key: 'nac|' + id, id: id, path: id + '.json', filtered: false });
      else state.regions.forEach(function (cod) {
        var f = !!state.comuna && state.onlyComuna && id !== 'comunas';
        var rc = REGBY[cod] && REGBY[cod].capas[id]; if (!rc) return;
        var pad = (cod < 10 ? '0' : '') + cod;
        out.push({ key: id + '|' + cod + '|' + (f ? state.comuna : ''), id: id, path: 'r' + pad + '/' + id + '.json', filtered: f });
      });
    });
    return out;
  }
  function setLoading() {
    var el = document.getElementById('mapaCarga');
    el.classList.toggle('on', pending > 0);
    el.textContent = 'Cargando capas… ' + pending;
  }
  function refresh() {
    var want = desiredKeys(), keep = {}, my = ++token;
    want.forEach(function (w) { keep[w.key] = 1; });
    Object.keys(active).forEach(function (k) { if (!keep[k]) { map.removeLayer(active[k]); delete active[k]; delete built[k]; } });
    want.forEach(function (w) {
      if (active[w.key]) return;
      if (built[w.key]) { built[w.key].addTo(map); active[w.key] = built[w.key]; return; }
      pending++; setLoading();
      getJSON(w.path).then(function (data) {
        pending--; setLoading();
        var still = desiredKeys().some(function (x) { return x.key === w.key; });
        if (!still || active[w.key]) return;
        var g = build(w.key, w.id, data, w.filtered); built[w.key] = g; g.addTo(map); active[w.key] = g;
        reorder(); applyInteractive();
      }).catch(function () { pending--; setLoading(); });
    });
    restyle(); reorder(); applyInteractive(); legendVial();
  }
  function reorder() {
    Object.keys(active).sort(function (a, b) { return DEF[a.split('|')[0] === 'nac' ? a.split('|')[1] : a.split('|')[0]].z - DEF[b.split('|')[0] === 'nac' ? b.split('|')[1] : b.split('|')[0]].z; })
      .forEach(function (k) { active[k].bringToFront(); });
  }
  function idOf(k) { var p = k.split('|'); return p[0] === 'nac' ? p[1] : p[0]; }
  var DINAMICAS = { regiones: 1, comunas: 1, ipt_lu: 1, hidrografia: 1, ferrocarril: 1, red_vial: 1 };
  function restyle() {
    Object.keys(active).forEach(function (k) { var id = idOf(k); if (DINAMICAS[id]) active[k].setStyle(styleFor(id)); });
  }
  var zt = null; map.on('zoomend', function () { clearTimeout(zt); zt = setTimeout(restyle, 120); });
  function applyInteractive() {
    Object.keys(active).forEach(function (k) {
      var id = idOf(k);
      if (id === 'regiones') active[k].eachLayer(function (l) { l.options.interactive = !state.regions.length; });
      if (id === 'ipt_lu') active[k].eachLayer(function (l) { l.options.interactive = !has(state.layers, 'ipt_zonas'); });
    });
  }
  function legendVial() {
    document.getElementById('leyVial').classList.toggle('on', has(state.layers, 'red_vial') && state.regions.length > 0);
    var z = has(state.layers, 'ipt_zonas') && state.regions.some(function (c) { return REGBY[c] && REGBY[c].capas.ipt_zonas; });
    var lz = document.getElementById('leyZonas');
    if (!lz.firstChild) lz.innerHTML = '<b>Zonificación (categoría aprox.)</b>' + Object.keys(CATCOL).map(function (k) { return '<div><i style="background:' + CATCOL[k] + '"></i>' + esc(k) + '</div>'; }).join('');
    lz.classList.toggle('on', z);
  }

  // ---------- Selección ----------
  function bboxOf(b) { return L.latLngBounds([b[0], b[1]], [b[2], b[3]]); }
  function selectRegion(cod, exclusive, noFit) {
    if (exclusive) state.regions = [cod];
    else if (has(state.regions, cod)) state.regions = state.regions.filter(function (x) { return x !== cod; });
    else state.regions = state.regions.concat([cod]);
    state.comuna = null;
    if (has(state.regions, cod) && !noFit) map.fitBounds(bboxOf(REGBY[cod].bbox), { padding: [20, 20] });
    var el = document.querySelector('.reg[data-cod="' + cod + '"]'); if (el && exclusive) el.classList.add('abierta');
    update();
  }
  function selectComuna(cc) {
    var c = COMBY[cc]; if (!c) return;
    state.regions = [c.reg]; state.comuna = cc;
    if (!has(state.layers, 'comunas')) state.layers.push('comunas');
    map.fitBounds(bboxOf(c.bbox), { padding: [30, 30] });
    var el = document.querySelector('.reg[data-cod="' + c.reg + '"]'); if (el) el.classList.add('abierta');
    update();
  }
  function clearAll() { state.regions = []; state.comuna = null; map.fitBounds([[-56, -76], [-17.5, -66.5]]); update(); }

  // ---------- Panel ----------
  function buildPanel() {
    var cont = document.getElementById('listaCapas'), h = '';
    GRUPOS.forEach(function (g) {
      h += '<div class="mapa-sec"><div class="mapa-sec-t">' + esc(g[0]) + '</div>';
      g[1].forEach(function (id) {
        var d = DEF[id], sw = d.sw, cls = sw.t === 'pt' ? 'pt' : sw.t === 'ln' ? 'ln' : '';
        var style = sw.t === 'ln' ? 'border-color:' + sw.c : 'border-color:' + sw.c + ';background:' + (sw.f || 'transparent');
        h += '<label class="mapa-capa" data-capa="' + id + '"><input type="checkbox" data-capa="' + id + '"><span class="sw ' + cls + '" style="' + style + '"></span><span class="nm">' + esc(d.n) + '</span><span class="pe"></span></label>';
      });
      h += '</div>';
    });
    cont.innerHTML = h;
    cont.addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-capa'); if (!id) return;
      if (e.target.checked) { if (!has(state.layers, id)) state.layers.push(id); } else state.layers = state.layers.filter(function (x) { return x !== id; });
      update();
    });

    var lr = '';
    IDX.regiones.forEach(function (r) {
      lr += '<div class="reg" data-cod="' + r.cod + '"><div class="reg-cab"><input type="checkbox" aria-label="Cargar ' + esc(r.nombre) + '"><span class="reg-rom">' + esc(r.romano) + '</span>' +
        '<button class="reg-nom" type="button">' + esc(r.nombre) + '</button><svg class="reg-flecha" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div><div class="reg-coms">';
      r.comunas.forEach(function (c) { lr += '<button type="button" class="com" data-c="' + esc(c.c) + '"><i>' + esc(c.c) + '</i>' + esc(c.n) + '</button>'; });
      lr += '</div></div>';
    });
    var rl = document.getElementById('listaRegiones'); rl.innerHTML = lr;
    rl.addEventListener('click', function (e) {
      var reg = e.target.closest('.reg'); if (!reg) return;
      var cod = +reg.getAttribute('data-cod');
      var com = e.target.closest('.com');
      if (com) { selectComuna(com.getAttribute('data-c')); closeDrawer(); return; }
      if (e.target.closest('.reg-flecha')) { reg.classList.toggle('abierta'); return; }
      if (e.target.matches('input[type=checkbox]')) { selectRegion(cod, false); return; }
      if (e.target.closest('.reg-nom')) { reg.classList.toggle('abierta', true); selectRegion(cod, true); closeDrawer(); }
    });
  }
  function syncUI() {
    document.querySelectorAll('#listaCapas input').forEach(function (i) { i.checked = has(state.layers, i.getAttribute('data-capa')); });
    document.querySelectorAll('.reg').forEach(function (r) {
      var cod = +r.getAttribute('data-cod'), sel = has(state.regions, cod);
      r.querySelector('input').checked = sel; r.querySelector('.reg-cab').classList.toggle('sel', sel);
    });
    document.querySelectorAll('.com').forEach(function (b) { b.classList.toggle('sel', b.getAttribute('data-c') === state.comuna); });
    // pesos por capa
    document.querySelectorAll('.mapa-capa').forEach(function (l) {
      var id = l.getAttribute('data-capa'), d = DEF[id], pe = l.querySelector('.pe'); pe.className = 'pe'; pe.textContent = ''; l.classList.remove('off');
      if (d.nac) { pe.textContent = 'todo Chile'; return; }
      if (!state.regions.length) { pe.textContent = 'elige región'; l.classList.add('off'); return; }
      if (state.comuna && state.onlyComuna && id !== 'comunas') { pe.textContent = 'solo comuna'; return; }
      var b = 0; state.regions.forEach(function (c) { var x = REGBY[c].capas[id]; if (x) b += x.bytes; });
      pe.textContent = b ? '≈ ' + fmt(b) : 'sin datos'; if (b > 2.5 * 1048576) pe.className = 'pe alto';
    });
    // estado
    var st = document.getElementById('mapaEstado'), h;
    if (state.comuna) {
      var c = COMBY[state.comuna];
      h = '<b>Comuna de ' + esc(c.n) + '</b><br>Región: ' + esc(REGBY[c.reg].nombre) +
        '<label class="mapa-solo"><input type="checkbox" id="chkSolo"' + (state.onlyComuna ? ' checked' : '') + '><span>Mostrar solo lo que está dentro de esta comuna (más liviano y rápido)</span></label>' +
        '<button type="button" id="btnReg">Ver toda la región</button><button type="button" id="btnTodo">Ver todo Chile</button>';
    } else if (state.regions.length) {
      h = '<b>' + state.regions.map(function (c) { return esc(REGBY[c].nombre); }).join(', ') + '</b><br>Elige una comuna en la lista para cargar solo esa zona.<br><button type="button" id="btnTodo">Ver todo Chile</button>';
    } else h = '<b>Vista nacional.</b> Elige una región (o marca varias) para cargar comunas y capas de detalle.';
    st.innerHTML = h;
    var s = document.getElementById('chkSolo'); if (s) s.onchange = function () { state.onlyComuna = s.checked; update(); };
    var b1 = document.getElementById('btnReg'); if (b1) b1.onclick = function () { selectRegion(state.regions[0], true); };
    var b2 = document.getElementById('btnTodo'); if (b2) b2.onclick = clearAll;
  }

  // ---------- Búsqueda ----------
  function buscar(q) {
    q = norm(q.trim());
    document.querySelectorAll('.reg').forEach(function (r) {
      var rn = norm(r.querySelector('.reg-nom').textContent), any = false;
      r.querySelectorAll('.com').forEach(function (b) { var m = !q || norm(b.textContent).indexOf(q) !== -1 || rn.indexOf(q) !== -1; b.style.display = m ? '' : 'none'; any = any || m; });
      r.style.display = (!q || any || rn.indexOf(q) !== -1) ? '' : 'none';
      if (q) r.classList.toggle('abierta', any);
    });
  }

  // ---------- Hash / base / drawer ----------
  function writeHash() {
    var p = [];
    if (state.regions.length) p.push('r=' + state.regions.join(','));
    if (state.comuna) p.push('c=' + state.comuna);
    p.push('l=' + state.layers.join(','));
    if (state.base !== 'osm') p.push('b=' + state.base);
    try { history.replaceState(null, '', '#' + p.join('&')); } catch (e) { }
  }
  function readHash() {
    var h = {}; location.hash.replace(/^#/, '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) h[a[0]] = decodeURIComponent(a[1] || ''); });
    return h;
  }
  function setBase(b) {
    Object.keys(BASES).forEach(function (k) { if (map.hasLayer(BASES[k])) map.removeLayer(BASES[k]); });
    BASES[b].addTo(map); BASES[b].bringToBack(); state.base = b;
    document.querySelectorAll('.mapa-base button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-b') === b); });
  }
  function closeDrawer() { document.querySelector('.mapa-app').classList.remove('panel-abierto'); }
  function update() { syncUI(); refresh(); writeHash(); }

  // ---------- Inicio ----------
  function setHeaderVar() {
    var c = document.getElementById('cabeceraPrincipal');
    if (c) document.documentElement.style.setProperty('--cab-h', c.offsetHeight + 'px');
    map.invalidateSize();
  }
  window.addEventListener('resize', setHeaderVar);
  document.getElementById('btnPanel').onclick = function () { document.querySelector('.mapa-app').classList.add('panel-abierto'); };
  document.getElementById('btnCerrarPanel').onclick = closeDrawer;
  document.querySelectorAll('.mapa-base button').forEach(function (b) { b.onclick = function () { setBase(b.getAttribute('data-b')); writeHash(); }; });
  document.getElementById('mapaBuscar').addEventListener('input', function (e) { buscar(e.target.value); });
  document.getElementById('mapaBuscar').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var q = norm(e.target.value.trim()); if (!q) return;
    var hit = null; IDX.regiones.forEach(function (r) { r.comunas.forEach(function (c) { if (!hit && norm(c.n).indexOf(q) !== -1) hit = c.c; }); });
    if (hit) { selectComuna(hit); closeDrawer(); return; }
    var rr = IDX.regiones.filter(function (r) { return norm(r.nombre).indexOf(q) !== -1; })[0];
    if (rr) { selectRegion(rr.cod, true); closeDrawer(); }
  });

  fetch(BASE + 'indice.json').then(function (r) { return r.json(); }).then(function (j) {
    IDX = j;
    j.regiones.forEach(function (r) { REGBY[r.cod] = r; r.comunas.forEach(function (c) { COMBY[c.c] = { n: c.n, bbox: c.bbox, reg: r.cod }; }); });
    buildPanel(); setHeaderVar(); setBase('osm');
    var h = readHash();
    if (h.l) state.layers = h.l.split(',').filter(function (x) { return DEF[x]; });
    if (h.b && BASES[h.b]) setBase(h.b);
    if (h.c && COMBY[h.c]) { selectComuna(h.c); return; }
    if (h.r) { var cods = h.r.split(',').map(Number).filter(function (c) { return REGBY[c]; }); if (cods.length) { state.regions = cods; map.fitBounds(bboxOf(REGBY[cods[0]].bbox)); } }
    update();
  }).catch(function () { document.getElementById('mapaEstado').textContent = 'No se pudo cargar el índice de datos.'; });
})();
