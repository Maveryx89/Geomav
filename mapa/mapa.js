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
    { id: 'prop_rurales', n: 'Propiedades rurales (catastro CIREN)', online: true, sw: { c: '#7a4a00', f: 'rgba(242,193,78,.35)', t: 'pol' } },
    { id: 'ipt_pri', n: 'Plan intercomunal / metropolitano', reg: true, sw: { c: '#fff', f: '#8fb3d9', t: 'pol' } },
    { id: 'ipt_zonas', n: 'Zonificación (plan regulador)', reg: true, sw: { c: '#fff', f: '#e6b84a', t: 'pol' } },
    { id: 'ipt_riesgo', n: 'Áreas de riesgo / restricción', reg: true, sw: { c: '#8b0000', f: 'rgba(214,40,40,.45)', t: 'pol' } },
    { id: 'ipt_patrimonio', n: 'Patrimonio (ZCH e inmuebles ICH)', reg: true, sw: { c: '#4a0f5c', f: 'rgba(123,45,142,.55)', t: 'pol' } },
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
    ['Planificación territorial (IPT)', ['ipt_zonas', 'ipt_pri', 'ipt_prdu', 'ipt_lu', 'ipt_riesgo', 'ipt_patrimonio']],
    ['Propiedades', ['prop_rurales']],
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
    ipt_prdu: { tema: 'Tema', condicion: 'Condición', info: 'Información', instrumento: 'Instrumento' },
    ipt_pri: { zona: 'Zona', comuna: 'Comuna', localidad: 'Localidad / sector', instrumento: 'Instrumento', tipo: 'Tipo', cat: 'Categoría (aprox.)', documento: 'Norma' },
    ipt_riesgo: { zona: 'Zona', comuna: 'Comuna', instrumento: 'Instrumento', cat: 'Categoría', obs: 'Observación' },
    ipt_patrimonio: { comuna: 'Comuna', tipo: 'Tipo', direccion: 'Dirección', rol: 'Rol', estado: 'Estado de conservación', documento: 'Documento' }
  };
  var CATCOL = { 'Residencial / mixta': '#e6b84a', 'Extensión urbana': '#f2d58a', 'Equipamiento': '#d9663d', 'Industrial / productiva': '#8a6fb5', 'Áreas verdes': '#5aa05a', 'Conservación / patrimonio': '#a0693c', 'Riesgo': '#d62828', 'Restricción / faja': '#ef8a17', 'Vialidad': '#7f7f7f', 'Infraestructura': '#5b7c99', 'Otras': '#9aa5ad' };
  var TITULO = { comunas: 'comuna', regiones: 'nombre', provincias: 'provincia', areas_pobladas: 'localidad', snaspe: 'nombre', lagos: 'nombre', hidrografia: 'nombre', red_vial: 'ruta', aerodromos: 'nombre', toponimos: 'nombre', ipt_zonas: 'nombre', ipt_lu: 'nombre', ipt_prdu: 'nombre', ipt_pri: 'nombre', ipt_riesgo: 'nombre', ipt_patrimonio: 'nombre' };
  var HOVER = { comunas: 1, regiones: 1, provincias: 0, areas_pobladas: 1, snaspe: 1, lagos: 1, aerodromos: 1, toponimos: 1, ipt_zonas: 1, ipt_lu: 1, ipt_prdu: 1, ipt_pri: 1, ipt_riesgo: 1, ipt_patrimonio: 1 };

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
      case 'ipt_pri': return function (f) {
        var p = f.properties, col = CATCOL[p.cat] || '#9aa5ad';
        return { renderer: rend, color: '#ffffff', weight: 1, fill: true, fillColor: col, fillOpacity: .55 };
      };
      case 'ipt_riesgo': return function () { return { renderer: rend, color: '#8b0000', weight: 1.2, fill: true, fillColor: '#d62828', fillOpacity: .38 }; };
      case 'ipt_patrimonio': return function () { return { renderer: rend, color: '#4a0f5c', weight: 1.8, fill: true, fillColor: '#7b2d8e', fillOpacity: .55 }; };
      case 'ipt_prdu': return function () { return { renderer: rend, color: '#46600f', weight: 2.2, fill: true, fillColor: '#6b8e23', fillOpacity: .2 }; };
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
  var USOS = { ipt_zonas: 1, ipt_pri: 1, ipt_riesgo: 1, ipt_patrimonio: 1 };
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
      if (USOS[id] && p.k) {
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
      if (d.online) return;
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
      if (id === 'ipt_lu') active[k].eachLayer(function (l) { l.options.interactive = !(has(state.layers, 'ipt_zonas') || has(state.layers, 'ipt_pri')); });
    });
  }
  function legendVial() {
    document.getElementById('leyVial').classList.toggle('on', has(state.layers, 'red_vial') && state.regions.length > 0);
    var z = (has(state.layers, 'ipt_zonas') || has(state.layers, 'ipt_pri')) && state.regions.some(function (c) { return REGBY[c] && (REGBY[c].capas.ipt_zonas || REGBY[c].capas.ipt_pri); });
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
      if (d.online) { pe.textContent = 'por comuna'; return; }
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
    propUI();
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
  function update() { syncUI(); refresh(); propSync(); writeHash(); }

  // ---------- Propiedades rurales (catastro CIREN, respaldo propio por comuna) + descarga SHP ----------
  var PROP_ZOOM = 12, PROP_MAXCOM = 8, PROP_MAX = 150000;
  var PROP_REGNOM = { 1: 'Tarapacá', 3: 'Atacama', 4: 'Coquimbo', 5: 'Valparaíso', 6: "O'Higgins", 7: 'Maule', 8: 'Biobío', 9: 'La Araucanía', 10: 'Los Lagos', 11: 'Aysén', 13: 'Metropolitana', 14: 'Los Ríos', 15: 'Arica y Parinacota', 16: 'Ñuble' };
  var propIdx = null, propIdxP = null, propLoaded = {}, propGroup = null, propN = 0, propMsg = '', propBusy = 0, propTimer = null;
  function propEnsureGroup() {
    if (propGroup) return propGroup;
    propGroup = L.geoJSON(null, { renderer: rend, style: function () { return { renderer: rend, color: '#7a4a00', weight: 1.4, opacity: 1, fill: true, fillColor: '#f2c14e', fillOpacity: .16 }; } });
    propGroup.on('click', function (e) {
      var p = e.propagatedFrom && e.propagatedFrom.feature && e.propagatedFrom.feature.properties; if (!p) return;
      L.popup({ maxWidth: 320 }).setLatLng(e.latlng).setContent('<h4>Rol ' + esc(p.rol || 's/i') + '</h4><div style="font-size:.72rem;color:rgba(10,34,64,.55);margin-bottom:4px">Propiedad rural (catastro CIREN)</div><table><tr><td>Comuna</td><td><b>' + esc(p.comuna || '') + '</b></td></tr><tr><td>Región</td><td><b>' + esc(p.region || '') + '</b></td></tr><tr><td>Año de la información</td><td><b>' + esc(p.anio || '') + '</b></td></tr></table><p style="font-size:.7rem;margin:6px 0 0;color:rgba(10,34,64,.6)">Catastro gráfico referencial: no reemplaza el título ni el CBR.</p>').openOn(map);
    });
    propGroup.on('mouseover', function (e) { var p = e.propagatedFrom.feature.properties; if (p.rol) { tip.setContent('Rol ' + esc(p.rol)).setLatLng(e.latlng); map.openTooltip(tip); } });
    propGroup.on('mouseout', function () { map.closeTooltip(tip); });
    return propGroup;
  }
  function propOn() { return has(state.layers, 'prop_rurales'); }
  function propIndex() {
    if (propIdx) return Promise.resolve(propIdx);
    if (!propIdxP) propIdxP = fetch(BASE + 'prop/index.json').then(function (r) { return r.json(); }).then(function (j) { propIdx = j; return j; });
    return propIdxP;
  }
  function propFetch(cc) {
    return fetch(BASE + 'prop/' + cc + '.json.gz').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (typeof DecompressionStream === 'undefined') throw new Error('navegador sin soporte');
      return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
    });
  }
  function propLoad(cc) {
    if (propLoaded[cc] || !propIdx[cc]) return;
    propLoaded[cc] = 1; propBusy++; propUI();
    propFetch(cc).then(function (gj) {
      var m = propIdx[cc], reg = PROP_REGNOM[m.r] || '', fs = gj.features.map(function (f) {
        return { type: 'Feature', geometry: f.geometry, properties: { rol: f.properties.r, comuna: f.properties.n, region: reg, anio: m.a, cc: cc } };
      });
      propEnsureGroup().addData(fs); propN += fs.length;
      if (propOn()) { propGroup.addTo(map); propGroup.bringToFront(); }
    }).catch(function (e) { delete propLoaded[cc]; propMsg = 'No se pudo cargar una comuna (' + e.message + '). Reintenta.'; })
      .then(function () { propBusy--; propUI(); });
  }
  function propLoadView() {
    clearTimeout(propTimer);
    if (!propOn() || !IDX) { propUI(); return; }
    propTimer = setTimeout(function () {
      propIndex().then(function () {
        var want = [], b = map.getBounds();
        if (state.comuna && propIdx[state.comuna]) want.push(state.comuna);
        propMsg = '';
        if (map.getZoom() >= PROP_ZOOM) {
          var near = [];
          Object.keys(COMBY).forEach(function (cc) {
            var c = COMBY[cc]; if (!propIdx[cc] || has(want, cc)) return;
            if (bboxOf(c.bbox).intersects(b)) near.push(cc);
          });
          if (near.length > PROP_MAXCOM) propMsg = 'Hay demasiadas comunas en la vista: acerca más o elige una comuna.';
          else want = want.concat(near);
        } else if (!state.comuna) propMsg = 'Acerca el mapa (zoom ' + PROP_ZOOM + ' o más) o elige una comuna para ver los predios.';
        else if (!propIdx[state.comuna]) propMsg = 'Esta comuna no tiene catastro rural CIREN (no cubre Antofagasta ni Magallanes).';
        if (propN > PROP_MAX) { propMsg = 'Hay muchos predios cargados; recarga la página para empezar de nuevo.'; want = []; }
        want.forEach(propLoad); propUI();
      }).catch(function () { propMsg = 'No se pudo leer el índice de propiedades.'; propUI(); });
    }, 350);
  }
  function propSync() {
    if (propOn()) { propEnsureGroup().addTo(map); propLoadView(); }
    else { if (propGroup && map.hasLayer(propGroup)) map.removeLayer(propGroup); propUI(); }
  }
  map.on('moveend', function () { if (propOn()) propLoadView(); });
  function propFeatures() {
    var out = []; if (!propGroup) return out;
    propGroup.eachLayer(function (l) { var f = l.feature; if (!state.comuna || f.properties.cc === state.comuna) out.push(f); });
    return out;
  }
  function propUI() {
    var el = document.getElementById('propEstado'); if (!el) return;
    if (!propOn()) { el.style.display = 'none'; return; }
    el.style.display = '';
    var n = propFeatures().length, h = '<b>Propiedades rurales (CIREN)</b><br>';
    if (propBusy) h += 'Cargando predios… ';
    else if (propMsg) h += esc(propMsg);
    else h += n.toLocaleString('es-CL') + ' predios ' + (state.comuna ? 'de la comuna' : 'cargados') + '. Se cargan por comuna al acercar el mapa (zoom ' + PROP_ZOOM + '+).';
    h += '<div class="prop-acc"><button type="button" id="btnPropShp"' + (n ? '' : ' disabled') + '>Descargar SHP (' + n.toLocaleString('es-CL') + ')</button></div>';
    h += '<div class="prop-nota">Catastro CIREN (año según región; trazado ≈100 %). Cita: CIREN. Referencial.</div>';
    el.innerHTML = h;
    var b = document.getElementById('btnPropShp'); if (b) b.onclick = propDownload;
  }
  // --- escritor mínimo de Shapefile + zip (sin dependencias) ---
  function crc32(u8) { var t = crc32.t; if (!t) { t = crc32.t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } } var r = -1; for (var i = 0; i < u8.length; i++) r = t[(r ^ u8[i]) & 255] ^ (r >>> 8); return (r ^ -1) >>> 0; }
  function ringArea(r) { var a = 0; for (var i = 0, n = r.length - 1; i < n; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; }
  function polysOf(g) { return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; }
  function buildShp(feats) {
    var recs = [], xmin = 1e9, ymin = 1e9, xmax = -1e9, ymax = -1e9, total = 100;
    feats.forEach(function (f) {
      var rings = [];
      polysOf(f.geometry).forEach(function (poly) {
        poly.forEach(function (r, i) { var c = r.slice(); var cw = ringArea(c) < 0; if (i === 0 ? !cw : cw) c.reverse(); rings.push(c); });
      });
      if (!rings.length) { recs.push(null); return; }
      var np = 0; rings.forEach(function (r) { np += r.length; });
      var len = 44 + 4 * rings.length + 16 * np, b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, rings: rings, np: np, len: len };
      rings.forEach(function (r) { r.forEach(function (p) { if (p[0] < b.x0) b.x0 = p[0]; if (p[0] > b.x1) b.x1 = p[0]; if (p[1] < b.y0) b.y0 = p[1]; if (p[1] > b.y1) b.y1 = p[1]; }); });
      xmin = Math.min(xmin, b.x0); ymin = Math.min(ymin, b.y0); xmax = Math.max(xmax, b.x1); ymax = Math.max(ymax, b.y1);
      recs.push(b); total += 8 + len;
    });
    var shp = new DataView(new ArrayBuffer(total)), shx = new DataView(new ArrayBuffer(100 + 8 * recs.filter(Boolean).length));
    function head(v, bytes) { v.setInt32(0, 9994); v.setInt32(24, bytes / 2); v.setInt32(28, 1000, true); v.setInt32(32, 5, true); v.setFloat64(36, xmin, true); v.setFloat64(44, ymin, true); v.setFloat64(52, xmax, true); v.setFloat64(60, ymax, true); }
    head(shp, total); head(shx, shx.byteLength);
    var o = 100, k = 0, idx = [];
    recs.forEach(function (b) {
      if (!b) { idx.push(false); return; } idx.push(true);
      shx.setInt32(100 + 8 * k, o / 2); shx.setInt32(104 + 8 * k, (b.len) / 2); k++;
      shp.setInt32(o, k); shp.setInt32(o + 4, b.len / 2); var p = o + 8;
      shp.setInt32(p, 5, true); shp.setFloat64(p + 4, b.x0, true); shp.setFloat64(p + 12, b.y0, true); shp.setFloat64(p + 20, b.x1, true); shp.setFloat64(p + 28, b.y1, true);
      shp.setInt32(p + 36, b.rings.length, true); shp.setInt32(p + 40, b.np, true); p += 44; var st = 0;
      b.rings.forEach(function (r) { shp.setInt32(p, st, true); p += 4; st += r.length; });
      b.rings.forEach(function (r) { r.forEach(function (c) { shp.setFloat64(p, c[0], true); shp.setFloat64(p + 8, c[1], true); p += 16; }); });
      o += 8 + b.len;
    });
    // DBF
    var cols = [['ROL', 20, 'rol'], ['COMUNA', 40, 'comuna'], ['REGION', 40, 'region'], ['ANIO', 4, 'anio']], enc = new TextEncoder();
    var rl = 1 + cols.reduce(function (a, c) { return a + c[1]; }, 0), nrec = feats.filter(function (f, i) { return idx[i]; }).length;
    var dbf = new Uint8Array(32 + 32 * cols.length + 1 + rl * nrec + 1), dv = new DataView(dbf.buffer), d = new Date();
    dbf[0] = 3; dbf[1] = d.getFullYear() - 1900; dbf[2] = d.getMonth() + 1; dbf[3] = d.getDate(); dv.setUint32(4, nrec, true); dv.setUint16(8, 33 + 32 * cols.length, true); dv.setUint16(10, rl, true); dbf[29] = 0x57;
    cols.forEach(function (c, i) { var q = 32 + 32 * i; enc.encode(c[0]).forEach(function (x, j) { dbf[q + j] = x; }); dbf[q + 11] = 67; dbf[q + 16] = c[1]; });
    var w = 32 + 32 * cols.length; dbf[w++] = 13;
    feats.forEach(function (f, i) {
      if (!idx[i]) return; dbf[w] = 32;
      var q = w + 1; cols.forEach(function (c) { var v = f.properties[c[2]]; v = v == null ? '' : String(v); var bytes = enc.encode(v).slice(0, c[1]); dbf.fill(32, q, q + c[1]); dbf.set(bytes, q); q += c[1]; });
      w += rl;
    });
    dbf[w] = 26;
    return { shp: new Uint8Array(shp.buffer), shx: new Uint8Array(shx.buffer), dbf: dbf };
  }
  function zipStore(files) {
    var enc = new TextEncoder(), parts = [], cen = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, f.data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      cen.push(new Uint8Array(c.buffer), nm); off += 30 + nm.length + f.data.length;
    });
    var cl = 0; cen.forEach(function (x) { cl += x.length; });
    var e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  }
  var PRJ = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';
  function propDownload() {
    var feats = propFeatures(); if (!feats.length) return;
    var s = buildShp(feats), enc = new TextEncoder();
    var base = 'propiedades_rurales_' + (state.comuna ? norm(COMBY[state.comuna].n).replace(/[^a-z0-9]+/g, '_') : 'vista');
    var blob = zipStore([{ name: base + '.shp', data: s.shp }, { name: base + '.shx', data: s.shx }, { name: base + '.dbf', data: s.dbf }, { name: base + '.prj', data: enc.encode(PRJ) }, { name: base + '.cpg', data: enc.encode('UTF-8') }]);
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = base + '.zip'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  window.__mapaProp = { buildShp: buildShp, zipStore: zipStore };

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
