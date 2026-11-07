/* Informe de viaje · Pórticos
   A4 vertical (210 x 297 mm) con los puntos de la ruta del mapa: mapa vectorial, tiempo en cada punto (estancia), tiempo de viaje entre puntos,
   almuerzo opcional y tareas programadas del día. Salida PDF y PNG a 300 ppp. Un informe por día; si la tabla no cabe, sigue en una segunda hoja. */
(function(){
"use strict";
var H = window.PORTICOS_INFORME && window.PORTICOS_INFORME._h;
if(!H){ console.error("informe-viaje: falta informe.js"); return; }
var T = H.T, R = H.R, L = H.L, f = H.f, esc = H.esc, tw = H.tw, fit = H.fit, wrap = H.wrap, circ = H.circ, merc = H.merc, NAVY = H.NAVY, MUTE = H.MUTE, CHIP = H.CHIP, LINE = H.LINE;
var ACC = "#2C6B7E", COP = "#D49A6A", ALM = "#8C949E", FILA = "#FAF8F5";
var DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
var NOTAS = ["Comentarios", "Prevención"];

function dd(n){ return (n < 10 ? "0" : "") + n; }
function hm(t){ var d = new Date(t); return dd(d.getHours()) + ":" + dd(d.getMinutes()); }
function dur(min){ min = Math.round(min); var h = Math.floor(min / 60), m = min % 60; return h ? h + " h " + dd(m) + " min" : m + " min"; }
function fechaLarga(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); if(!m) return ""; var d = new Date(+m[1], +m[2] - 1, +m[3]); return DIAS_L[d.getDay()] + " " + d.getDate() + " de " + H.MESES[d.getMonth()]; }
function fechaCorta(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3] + "-" + m[2] + "-" + m[1] : ""; }
function isoDe(t){ var d = new Date(t); return d.getFullYear() + "-" + dd(d.getMonth() + 1) + "-" + dd(d.getDate()); }

/* ---------- mapa vectorial con la ruta ---------- */
var BOX_MAPA = [14, 51, 182, 98];
function vista(box, filas, geom){
  var MW = box[2], MH = box[3], lats = [], lngs = [];
  filas.forEach(function(r){ lats.push(r.lat); lngs.push(r.lng); });
  (geom || []).forEach(function(c){ lats.push(c[0]); lngs.push(c[1]); });
  var la0 = Math.min.apply(0, lats), la1 = Math.max.apply(0, lats), lo0 = Math.min.apply(0, lngs), lo1 = Math.max.apply(0, lngs);
  var a0 = merc(la0, lo0), a1 = merc(la1, lo1), cx = (a0[0] + a1[0]) / 2, cy = (a0[1] + a1[1]) / 2, spanx = a1[0] - a0[0], spany = a1[1] - a0[1];
  var k = Math.max(spanx / (MW * .86), spany / (MH * .86), 4e-7);
  return { k:k, wx0:cx - k * MW / 2, wy1:cy + k * MH / 2 };
}

/* ---------- teselas OpenStreetMap (mismo mapa base que la app) ---------- */
var TCACHE = {}, TAU2 = 2 * Math.PI;
function dataUrl(blob){ return new Promise(function(ok, no){ var fr = new FileReader(); fr.onload = function(){ ok(fr.result); }; fr.onerror = no; fr.readAsDataURL(blob); }); }
function cargarTeselas(filas, geom){
  if(!window.fetch) return Promise.resolve(null);
  var V = vista(BOX_MAPA, filas, geom), MW = BOX_MAPA[2], MH = BOX_MAPA[3], TAU = 2 * Math.PI;
  var xa = V.wx0, xb = V.wx0 + V.k * MW, yb = V.wy1, ya = V.wy1 - V.k * MH, z = 16, nx, ny, x0, y0;
  for(; z >= 5; z--){
    var n = Math.pow(2, z), t = TAU / n;
    x0 = Math.floor((xa + Math.PI) / t); var x1 = Math.floor((xb + Math.PI) / t);
    y0 = Math.floor((Math.PI - yb) / t); var y1 = Math.floor((Math.PI - ya) / t);
    nx = x1 - x0 + 1; ny = y1 - y0 + 1;
    if(nx * ny <= 64) break;
  }
  var n2 = Math.pow(2, z), key = z + "/" + x0 + "/" + y0 + "/" + nx + "x" + ny;
  if(TCACHE[key]) return TCACHE[key];
  var ps = [];
  for(var i = 0; i < nx; i++) for(var j = 0; j < ny; j++) (function(tx, ty){
    ps.push(fetch("https://tile.openstreetmap.org/" + z + "/" + tx + "/" + ty + ".png", { mode:"cors" })
      .then(function(r){ if(!r.ok) throw new Error("tile"); return r.blob(); }).then(dataUrl)
      .then(function(d){ return { x:tx, y:ty, d:d }; }, function(){ return null; }));
  })(((x0 + i) % n2 + n2) % n2, y0 + j);
  var pr = Promise.all(ps).then(function(a){
    var ok = a.filter(Boolean);
    return ok.length >= a.length * .6 ? { z:z, x0:x0, y0:y0, items:ok } : null;
  }, function(){ return null; });
  TCACHE[key] = pr; return pr;
}

function mapa(o, G, box, filas, geom, TS){
  var MX = box[0], MY = box[1], MW = box[2], MH = box[3];
  var V = vista(box, filas, geom), k = V.k, wx0 = V.wx0, wy1 = V.wy1;
  function P(lat, lng){ var m = merc(lat, lng); return [MX + (m[0] - wx0) / k, MY + (wy1 - m[1]) / k]; }
  function inv(px, py){ var x = wx0 + (px - MX) * k, y = wy1 - (py - MY) * k; return [(2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI, x * 180 / Math.PI]; }
  var laC = inv(MX + MW / 2, MY + MH / 2)[0] * Math.PI / 180, mmPerM = 1 / (k * 6378137 * Math.cos(laC));
  var id = "mclip" + Math.round(Math.random() * 1e6);
  o.push('<defs><clipPath id="' + id + '"><rect x="' + MX + '" y="' + MY + '" width="' + MW + '" height="' + MH + '"/></clipPath></defs>');
  o.push(R(MX, MY, MW, MH, "#F4F3EF"));
  var g = ['<g clip-path="url(#' + id + ')">'];
  function ring(coords, close){
    var ps = coords.map(function(c){ return P(c[1], c[0]); }), all = function(fn){ return ps.every(fn); };
    if(all(function(p){ return p[0] < MX - 5; }) || all(function(p){ return p[0] > MX + MW + 5; }) || all(function(p){ return p[1] < MY - 5; }) || all(function(p){ return p[1] > MY + MH + 5; })) return null;
    return "M" + ps.map(function(p){ return f(p[0]) + " " + f(p[1]); }).join("L") + (close === false ? "" : "Z");
  }
  function polys(geo){ return geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates; }
  var cent = {};
  if(TS){
    var tl = TAU2 / Math.pow(2, TS.z), ts = tl / k;
    TS.items.forEach(function(t){
      var tx0 = -Math.PI + t.x * tl, tyT = Math.PI - t.y * tl;
      g.push('<image x="' + f(MX + (tx0 - wx0) / k) + '" y="' + f(MY + (wy1 - tyT) / k) + '" width="' + f(ts + .15) + '" height="' + f(ts + .15) + '" preserveAspectRatio="none" href="' + t.d + '"/>');
    });
  }
  G.comunas.features.forEach(function(ft){
    var pr = ft.properties, ds = [];
    polys(ft.geometry).forEach(function(poly){ poly.forEach(function(r){ var d = ring(r); if(d) ds.push(d); }); });
    if(ds.length) g.push('<path d="' + ds.join(" ") + '" fill="' + (TS ? "none" : (pr.r6 === 1 ? "#FBFAF6" : "#E9E7E0")) + '" stroke="' + (TS ? "#1B2A4A" : "#BDB8A9") + '" stroke-width="' + (TS ? ".4" : ".3") + '"'  + ' fill-rule="evenodd"/>');
    var big = null; polys(ft.geometry).forEach(function(poly){ if(!big || poly[0].length > big.length) big = poly[0]; });
    var A = 0, Cx = 0, Cy = 0;
    for(var i = 0; i < big.length - 1; i++){ var xa = big[i][0], ya = big[i][1], xb = big[i + 1][0], yb = big[i + 1][1], cr = xa * yb - xb * ya; A += cr; Cx += (xa + xb) * cr; Cy += (ya + yb) * cr; }
    if(A) cent[pr.comuna] = [Cy / (3 * A), Cx / (3 * A), pr.r6 === 1];
  });
  if(!TS) G.vial.features.forEach(function(ft){
    var geo = ft.geometry, lines = geo.type === "MultiLineString" ? geo.coordinates : [geo.coordinates];
    var ds = lines.map(function(l){ return ring(l, false); }).filter(Boolean); if(!ds.length) return;
    var mayor = String((ft.properties || {}).rol || "").toLowerCase().indexOf("ruta") === 0;
    g.push('<path d="' + ds.join(" ") + '" fill="none" stroke="' + (mayor ? "#D49A6A" : "#D9CDB6") + '" stroke-width="' + (mayor ? ".6" : ".25") + '" stroke-linecap="round" stroke-linejoin="round"/>');
  });
  G.provincias.features.forEach(function(ft){
    var ds = []; polys(ft.geometry).forEach(function(poly){ poly.forEach(function(r){ var d = ring(r); if(d) ds.push(d); }); });
    if(ds.length) g.push('<path d="' + ds.join(" ") + '" fill="none" stroke="' + (TS ? "#6B4FA0" : "#000") + '" stroke-width="' + (TS ? ".7" : ".4") + '"' + (TS ? "" : ' stroke-dasharray="1.6 .9"') + '/>');
  });
  var comRuta = {}; filas.forEach(function(r){ if(r.comuna) comRuta[r.comuna] = 1; });
  var occ = [];
  Object.keys(cent).forEach(function(name){
    var c = cent[name], p = P(c[0], c[1]), nm = name.toUpperCase(), sz = c[2] ? 3 : 2.4, wl = tw(nm, sz, 700) + 2;
    if(p[0] > MX + MW - 52 && p[1] > MY + MH - 19) return;
    if(!(MX + wl / 2 + 1 < p[0] && p[0] < MX + MW - wl / 2 - 1 && MY + 6 < p[1] && p[1] < MY + MH - 10)) return;
    g.push(T(p[0], p[1], nm, sz, comRuta[name] ? 700 : 600, comRuta[name] ? NAVY : "#6B7380", { anchor:"middle", ls:.5, italic:!c[2], halo:TS ? ["#ffffff", .85] : null }));
  });
  /* ruta */
  var ln = (geom && geom.length > 1) ? geom : filas.map(function(r){ return [r.lat, r.lng]; });
  var pts = ln.map(function(c){ var q = P(c[0], c[1]); return f(q[0]) + "," + f(q[1]); }).join(" ");
  g.push('<polyline points="' + pts + '" fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>');
  g.push('<polyline points="' + pts + '" fill="none" stroke="' + ACC + '" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"' + ((geom && geom.length > 1) ? "" : ' stroke-dasharray="2 1.2"') + '/>');
  /* puntos (los que comparten coordenada se agrupan: 4·5) */
  var grp = {}, orden = [];
  filas.forEach(function(r, i){ var kk = r.lat.toFixed(5) + "," + r.lng.toFixed(5); if(!grp[kk]){ grp[kk] = { lat:r.lat, lng:r.lng, n:[], nombres:[], base:r.base || r.gps }; orden.push(kk); } grp[kk].n.push(r.tag); grp[kk].nombres.push(r.nombre); });
  var marks = orden.map(function(kk){ var q = grp[kk], p = P(q.lat, q.lng); return { g:q, x:p[0], y:p[1] }; });
  marks.forEach(function(m){ occ.push([m.x - 3, m.y - 3, m.x + 3, m.y + 3]); });
  function inter(a, b){ return !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]); }
  var lsz = 2.5, lab = [];
  marks.forEach(function(m){
    var nm = m.g.nombres.filter(function(v, i, a){ return a.indexOf(v) === i; }).join(" · "), x = m.x, y = m.y, wl = tw(nm, lsz, 700);
    var cands = [["start", x + 3.6, y], ["end", x - 3.6, y], ["middle", x, y - 4.6], ["middle", x, y + 4.6], ["start", x + 3, y - 4], ["end", x - 3, y - 4], ["start", x + 3, y + 4], ["end", x - 3, y + 4]];
    var best = null;
    cands.forEach(function(c){
      var xl = c[0] === "start" ? c[1] : (c[0] === "middle" ? c[1] - wl / 2 : c[1] - wl), b = [xl - .5, c[2] - 1.6, xl + wl + .5, c[2] + 1.6], hit = occ.filter(function(q){ return inter(b, q); }).length * 2;
      if(b[0] < MX + 1 || b[2] > MX + MW - 1 || b[1] < MY + 1 || b[3] > MY + MH - 1) hit += 6;
      if(!best || hit < best[0]) best = [hit, c, b];
    });
    occ.push(best[2]); lab.push([nm, best[1][1], best[1][2], best[1][0]]);
  });
  lab.forEach(function(l){ g.push(T(l[1], l[2], l[0], lsz, 700, NAVY, { anchor:l[3], halo:["#ffffff", .8] })); });
  marks.forEach(function(m){
    var t = m.g.n.join("·"), r = Math.max(2.4, tw(t, 2.6, 700) / 2 + 1.1);
    g.push(circ(m.x, m.y, r, m.g.base ? NAVY : ACC, "#fff", .6)); g.push(T(m.x, m.y + .1, t, 2.6, 700, "#fff", { anchor:"middle" }));
  });
  g.push("</g>"); o = o.concat(g);
  o.push(R(MX, MY, MW, MH, "none", { stroke:NAVY, sw:.35 }));
  /* norte y escala */
  var nx = MX + 7, ny = MY + 11;
  o.push(R(nx - 5, ny - 9, 10, 17, "rgba(255,255,255,.85)", { rx:1 }));
  o.push('<polygon points="' + f(nx) + ',' + f(ny - 6.5) + ' ' + f(nx + 2.4) + ',' + f(ny + 2.6) + ' ' + f(nx) + ',' + f(ny + 1.3) + '" fill="' + NAVY + '"/><polygon points="' + f(nx) + ',' + f(ny - 6.5) + ' ' + f(nx - 2.4) + ',' + f(ny + 2.6) + ' ' + f(nx) + ',' + f(ny + 1.3) + '" fill="#fff" stroke="' + NAVY + '" stroke-width=".25"/>');
  o.push(T(nx, ny + 5.6, "N", 2.8, 700, NAVY, { anchor:"middle" }));
  var kmOpts = [1, 2, 5, 10, 20, 25, 50], km = 1; kmOpts.forEach(function(c){ if(c * 1000 * mmPerM <= MW * .24) km = c; });
  var bw = km * 1000 * mmPerM, sx = MX + MW - bw - 7, sy = MY + MH - 8;
  o.push(R(sx - 4, sy - 5, bw + 8, 10.5, "rgba(255,255,255,.88)", { rx:1 }));
  for(var i = 0; i < 4; i++) o.push(R(sx + i * bw / 4, sy, bw / 4, 1.4, i % 2 === 0 ? NAVY : "#fff", { stroke:NAVY, sw:.2 }));
  o.push(T(sx, sy - 2, "0", 2, 500, NAVY, { anchor:"middle" })); o.push(T(sx + bw, sy - 2, km + " km", 2, 500, NAVY, { anchor:"middle" }));
  if(TS) o.push(T(MX + 2, MY + MH - 1.6, "© colaboradores de OpenStreetMap", 1.9, 400, "#3a3f4a", { halo:["#ffffff", .85] }));
  var esc1 = Math.round(1000 / mmPerM / 1000) * 1000; o.push(T(sx + bw / 2, sy + 3.7, "Escala aprox. 1 : " + String(esc1).replace(/\B(?=(\d{3})+(?!\d))/g, "."), 1.9, 400, MUTE, { anchor:"middle" }));
  return o;
}

/* ---------- modelo: filas con horas, tramos y tareas del día ---------- */
function armar(d, o){
  var prog = (window.PROGRAMACION || []).filter(function(r){ return r.fecha === o.fecha && NOTAS.indexOf(r.partida) < 0; });
  var filas = d.filas.map(function(r, i){
    var tareas = []; if(!r.base && !r.gps){ prog.forEach(function(p){ if(String(p.portico) === String(r.num) && tareas.every(function(x){ return x.n !== p.partida; })) tareas.push({ n:p.partida, ok:/^ejecutado/i.test(p.estado || "") }); }); }
    return { tag:(r.base || r.gps) ? (i === 0 ? "I" : "T") : String(0), nombre:r.nombre, comuna:r.comuna || "", base:!!r.base, gps:!!r.gps, lat:r.lat, lng:r.lng, est:r.est || 0, llega:r.llega, sale:r.alm ? r.alm.a : r.sale, km:r.tramoKm || 0, min:r.tramoMin || 0, alm:r.alm || null, tareas:tareas, num:r.num };
  });
  var n = 0; filas.forEach(function(r){ if(!r.base && !r.gps){ n++; r.tag = String(n); } });
  var i0 = filas[0], iN = filas[filas.length - 1];
  var kmT = filas.reduce(function(a, r){ return a + r.km; }, 0), conMin = filas.reduce(function(a, r){ return a + r.min; }, 0), estMin = filas.reduce(function(a, r){ return a + r.est; }, 0);
  var almMin = filas.reduce(function(a, r){ return a + (r.alm ? (r.alm.b - r.alm.a) / 60000 : 0); }, 0);
  var inicio = d.salida || (i0.llega != null ? i0.llega : i0.sale - i0.est * 60000), fin = iN.llega != null ? iN.llega : iN.sale;
  return { filas:filas, nPort:n, km:kmT, conMin:conMin, estMin:estMin, almMin:almMin, inicio:inicio, fin:fin, geom:d.geom };
}

/* filas de tabla (incluye la fila de almuerzo) */
function filasTabla(M){
  var out = [];
  M.filas.forEach(function(r, i){
    out.push({ t:"p", r:r, i:i });
    if(r.alm) out.push({ t:"a", r:r });
  });
  return out;
}

/* ---------- hoja ---------- */
function marco(o, pag, total, titulo, logo, emitido){
  o.push(R(0, 0, 210, 297, "#fff"));
  if(logo) o.push('<image x="14" y="9" width="11" height="11" href="' + logo + '" xlink:href="' + logo + '"/>');
  o.push(T(logo ? 28 : 14, 12.2, "INFORME DE VIAJE · PÓRTICOS DE VIGILANCIA · REGIÓN DE O'HIGGINS", 2.3, 600, MUTE, { mono:true, ls:.3 }));
  var tsz = 7.4; while(tw(titulo, tsz, 700) > (logo ? 168 : 182) && tsz > 3) tsz -= .1;
  o.push(T(logo ? 28 : 14, 18.2, titulo, tsz, 700, NAVY)); o.push(L(14, 23.5, 196, 23.5, NAVY, .4));
  o.push(L(14, 290, 196, 290, "rgba(10,34,64,.3)", .25));
  o.push(T(14, 293.6, fit("Viaje en vehículo por red vial (OSRM / OpenStreetMap), sin tráfico en vivo · Emitido " + emitido + " · A4, imprimir al 100 %", 2, 400, 128), 2, 400, MUTE));
  o.push(T(196, 293.6, "GeoMAV · geomav.me · Hoja " + pag + " de " + total, 2.2, 600, NAVY, { anchor:"end" }));
}
function cabTabla(o, y){
  var cols = [["N°", 16], ["Punto", 24], ["Llega", 76], ["Estancia", 92], ["Sale", 110], ["Viaje desde el anterior", 124], ["Tareas programadas ese día", 154]];
  o.push(R(14, y, 182, 6, CHIP));
  cols.forEach(function(c){ o.push(T(c[1], y + 3.2, c[0], 2.5, 700, MUTE)); });
}
function filaTabla(o, y, h, it, par){
  if(par) o.push(R(14, y, 182, h, FILA));
  var m = y + h / 2, r = it.r;
  if(it.t === "a"){
    o.push(R(14, y, 182, h, "#F1F2F4"));
    o.push(T(24, m, "Almuerzo", 3, 700, "#4A5360")); o.push(T(76, m, hm(r.alm.a), 3, 700, NAVY)); o.push(T(92, m, dur((r.alm.b - r.alm.a) / 60000), 3, 400, NAVY)); o.push(T(110, m, hm(r.alm.b), 3, 700, NAVY));
    o.push(T(124, m, "después de " + r.nombre, 2.7, 400, MUTE));
    return;
  }
  var col = r.base || r.gps ? NAVY : ACC;
  o.push(circ(19, m, 2.3, col)); o.push(T(19, m + .1, r.tag, 2.4, 700, "#fff", { anchor:"middle" }));
  var nm = r.gps ? "Mi ubicación (GPS)" : r.nombre, sub = r.comuna || (r.base ? "Base" : "");
  o.push(T(24, m - (sub ? 1.5 : 0), fit(nm, 3.2, 700, 48), 3.2, 700, NAVY)); if(sub) o.push(T(24, m + 2.2, fit(sub, 2.2, 400, 48), 2.2, 400, MUTE));
  o.push(T(76, m, r.llega == null ? "—" : hm(r.llega), 3.1, 700, NAVY));
  o.push(T(92, m, r.est ? r.est + " min" : "—", 3.1, 400, NAVY));
  o.push(T(110, m, hm(r.sale), 3.1, 700, NAVY));
  o.push(T(124, m, r.min ? (r.km.toFixed(1) + " km · " + dur(r.min)) : "—", 3.1, 400, ACC));
  var tx = 154;
  if(r.tareas.length){
    var s = r.tareas.map(function(t){ return t.n + (t.ok ? " ✓" : ""); }).join(" · "), ls = wrap(s, 2.6, 400, 40, 2);
    ls.forEach(function(l, k){ o.push(T(tx, m + (k - (ls.length - 1) / 2) * 3.1, l, 2.6, 400, NAVY)); });
  } else o.push(T(tx, m, r.base || r.gps ? "" : "sin tareas ese día", 2.6, 400, MUTE, { italic:true }));
}

function hojas(d, o, G, logo){
  var M = armar(d, o), out = [], emitido = fechaCorta(isoDe(Date.now())) + " " + hm(Date.now());
  var titulo = o.titulo || ("Ruta de terreno · " + fechaLarga(o.fecha)), tab = filasTabla(M);
  var AV = 64, CAP1 = tab.length <= 10 ? tab.length : 8, RH1 = tab.length <= 10 ? Math.min(8.2, AV / Math.max(1, tab.length)) : 7.6, CAP2 = 30, RH2 = 8.2, pags = [tab.slice(0, CAP1)]; for(var q = CAP1; q < tab.length; q += CAP2) pags.push(tab.slice(q, q + CAP2));
  var total = pags.length;
  /* hoja 1 */
  var p = []; marco(p, 1, total, titulo, logo, emitido);
  var ini = M.filas[0], fn = M.filas[M.filas.length - 1];
  var sub = "Salida " + hm(M.inicio) + " desde " + (ini.gps ? "tu ubicación" : ini.nombre) + " · término " + hm(M.fin) + (fn.base ? " en " + fn.nombre : " en " + fn.nombre) + " · " + M.nPort + " pórtico" + (M.nPort === 1 ? "" : "s") + (M.almMin ? " · incluye almuerzo de " + Math.round(M.almMin) + " min" : "");
  p.push(T(14, 28.5, fit(sub, 3, 400, 182), 3, 400, MUTE));
  var kp = [[String(M.nPort), "pórticos"], [M.km.toFixed(0) + " km", "distancia total"], [dur(M.conMin), "conduciendo"], [dur(M.estMin), "en los puntos"], [hm(M.fin), "término"]], gap = 3, bw = (182 - 4 * gap) / 5;
  kp.forEach(function(it, i){
    var bx = 14 + i * (bw + gap); p.push(R(bx, 33, bw, 13.5, CHIP, { rx:1.2 }));
    var sz = 5.4; while(tw(it[0], sz, 700) > bw - 5 && sz > 3) sz -= .2;
    p.push(T(bx + 2.8, 38.6, it[0], sz, 700, NAVY)); p.push(T(bx + 2.8, 43.6, it[1], 2.4, 400, MUTE));
  });
  p = mapa(p, G, BOX_MAPA, M.filas, M.geom, G.teselas);
  /* línea de jornada */
  var ty = 156; p.push(T(14, ty, "Jornada · conducción y tiempo en cada punto", 3.6, 700, NAVY)); p.push(L(14, ty + 2.6, 196, ty + 2.6, NAVY, .35));
  var t0 = M.inicio, t1 = M.fin, X = function(t){ return 14 + (t - t0) / Math.max(1, t1 - t0) * 182; }, by = ty + 6;
  M.filas.forEach(function(r, i){
    if(i === 0 && r.llega == null) { if(r.est) p.push(R(X(r.sale - r.est * 60000), by, X(r.sale) - X(r.sale - r.est * 60000), 7, COP)); return; }
    var a = r.llega;
    if(i > 0 && r.min) p.push(R(X(a - r.min * 60000), by, X(a) - X(a - r.min * 60000), 7, ACC));
    var fe = a + r.est * 60000; if(r.est) p.push(R(X(a), by, X(fe) - X(a), 7, COP));
    if(r.alm) p.push(R(X(r.alm.a), by, X(r.alm.b) - X(r.alm.a), 7, ALM));
  });
  var h0 = new Date(t0); h0.setMinutes(0, 0, 0); var tk = h0.getTime() + 3600000;
  for(; tk < t1; tk += 3600000){ p.push(L(X(tk), by, X(tk), by + 7, "#fff", .25)); if(X(tk) - 14 > 12 && 196 - X(tk) > 12) p.push(T(X(tk), by + 10.2, hm(tk), 2.3, 500, MUTE, { anchor:"middle" })); }
  p.push(T(14, by + 10.2, hm(t0), 2.3, 700, NAVY)); p.push(T(196, by + 10.2, hm(t1), 2.3, 700, NAVY, { anchor:"end" }));
  var lx = 14, ly = by + 15.4;
  [[ACC, "Conducción"], [COP, "En el punto (estancia)"]].concat(M.almMin ? [[ALM, "Almuerzo"]] : []).forEach(function(l){ p.push(R(lx, ly - 1.1, 4, 2.2, l[0])); p.push(T(lx + 5.5, ly, l[1], 2.4, 400, NAVY)); lx += 5.5 + tw(l[1], 2.4) + 8; });
  /* tabla */
  var y = 190; cabTabla(p, y); y += 6;
  pags[0].forEach(function(it, i){ filaTabla(p, y, RH1, it, i % 2 === 1); y += RH1; });
  p.push(L(14, y, 196, y, NAVY, .35));
  if(total === 1){
    p.push(T(14, y + 4.4, "Totales", 3, 700, NAVY)); p.push(T(92, y + 4.4, dur(M.estMin), 3, 700, NAVY)); p.push(T(124, y + 4.4, M.km.toFixed(1) + " km · " + dur(M.conMin), 3, 700, ACC));
  } else p.push(T(14, y + 4.4, "Continúa en la hoja 2 →", 2.8, 600, MUTE, { italic:true }));
  firma(p, o);
  out.push(p);
  /* hojas siguientes */
  for(var k = 1; k < total; k++){
    var q2 = []; marco(q2, k + 1, total, titulo + " · continuación", logo, emitido);
    var yy = 28; cabTabla(q2, yy); yy += 6;
    pags[k].forEach(function(it, i){ filaTabla(q2, yy, RH2, it, i % 2 === 1); yy += RH2; });
    q2.push(L(14, yy, 196, yy, NAVY, .35));
    if(k === total - 1){ q2.push(T(14, yy + 4.4, "Totales", 3, 700, NAVY)); q2.push(T(92, yy + 4.4, dur(M.estMin), 3, 700, NAVY)); q2.push(T(124, yy + 4.4, M.km.toFixed(1) + " km · " + dur(M.conMin), 3, 700, ACC)); firma(q2, o); }
    out.push(q2);
  }
  return out;
}
function firma(p, o){
  var y = 268;
  p.push(R(14, y, 88, 19, "none", { stroke:"rgba(10,34,64,.35)", sw:.3, rx:1 }));
  p.push(T(17, y + 4, "ELABORADO POR", 2.2, 700, MUTE, { ls:.3 }));
  p.push(T(17, y + 9.2, fit(o.autor || "", 3.6, 700, 82), 3.6, 700, NAVY));
  p.push(L(17, y + 13.6, 62, y + 13.6, NAVY, .25)); p.push(T(17, y + 16, "Firma", 2, 400, MUTE));
  p.push(T(70, y + 16, "Fecha del viaje", 2, 400, MUTE)); p.push(T(70, y + 12, fechaCorta(o.fecha), 3, 600, NAVY));
  p.push(R(106, y, 90, 19, "none", { stroke:"rgba(10,34,64,.35)", sw:.3, rx:1 }));
  p.push(T(109, y + 4, "OBSERVACIONES", 2.2, 700, MUTE, { ls:.3 }));
  wrap(o.obs || "", 2.7, 400, 84, 4).forEach(function(l, i){ p.push(T(109, y + 8.6 + i * 3.4, l, 2.7, 400, NAVY)); });
}

function svgDe(body, titulo){
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297">\n<title>' + esc(titulo) + '</title>\n' + body.join("\n") + '\n</svg>\n';
}

/* ---------- ventana ---------- */
function logoSrc(){ try{ var im = document.querySelector("img.brand-logo, img.foot-logo"); return im && /^data:image/.test(im.src) ? im.src : ""; }catch(e){ return ""; } }
function guardado(k){ try{ return localStorage.getItem(k) || ""; }catch(e){ return ""; } }
function guardar(k, v){ try{ if(v) localStorage.setItem(k, v); }catch(e){} }

function generar(d, o){
  var M0 = armar(d, o);
  return Promise.all([H.cargarGeo(), H.cargarFuentes(), H.fuenteEmbebida(), cargarTeselas(M0.filas, M0.geom)]).then(function(r){
    r[0].teselas = r[3];
    var pags = hojas(d, o, r[0], logoSrc());
    return pags.map(function(b){ return H.conFuente(svgDe(b, "Informe de viaje " + o.fecha), r[2]); });
  });
}

function abrir(d){
  var ov = document.createElement("div"); ov.className = "bg-ov"; ov.style.overflow = "auto";
  var autor = guardado("porticos.viaje.autor") || ((window.PORTICOS_AUTOR && window.PORTICOS_AUTOR.get && window.PORTICOS_AUTOR.get()) || "");
  var f0 = isoDe(d.filas[0].sale);
  ov.innerHTML = '<div class="bg-card" role="dialog" aria-modal="true" aria-label="Informe de viaje" style="max-width:760px;max-height:94vh;display:flex;flex-direction:column">'
    + '<div class="bg-h"><strong>📄 Informe de viaje</strong><button type="button" class="bg-x" aria-label="Cerrar">✕</button></div>'
    + '<div class="bg-b" style="overflow:auto"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">'
    + '<label class="bg-pinl">Fecha del viaje<input type="date" class="iv-f" value="' + f0 + '"></label>'
    + '<label class="bg-pinl">Elaborado por<input type="text" class="iv-a" value="' + esc(autor) + '" maxlength="60" placeholder="Nombre y cargo"></label>'
    + '<label class="bg-pinl" style="grid-column:1/-1">Título (opcional)<input type="text" class="iv-t" maxlength="80" placeholder="Ruta de terreno · fecha"></label>'
    + '<label class="bg-pinl" style="grid-column:1/-1">Observaciones (opcional)<textarea class="iv-o" rows="2" maxlength="240" style="font:inherit;padding:6px;border:1px solid var(--line-strong);border-radius:6px;width:100%;box-sizing:border-box"></textarea></label></div>'
    + '<div class="iv-prev" style="margin-top:10px;text-align:center;color:var(--ink-soft);font-size:.8rem">Preparando vista previa…</div>'
    + '<div class="bg-msg iv-msg"></div></div>'
    + '<div class="bg-acc"><button type="button" class="bg-ok iv-pdf">Descargar PDF</button><button type="button" class="bg-ok iv-png" style="background:var(--ink)">Descargar PNG</button><button type="button" class="btn-link bg-no">Cerrar</button></div></div>';
  document.body.appendChild(ov);
  var $ = function(s){ return ov.querySelector(s); }, msg = $(".iv-msg"), cerrar = function(){ ov.remove(); }, SV = [], tm = null;
  $(".bg-x").onclick = cerrar; $(".bg-no").onclick = cerrar;
  function opts(){ return { fecha:$(".iv-f").value || f0, autor:$(".iv-a").value.trim(), titulo:$(".iv-t").value.trim(), obs:$(".iv-o").value.trim() }; }
  function refrescar(){
    clearTimeout(tm); tm = setTimeout(function(){
      generar(d, opts()).then(function(s){
        SV = s;
        $(".iv-prev").innerHTML = s.map(function(x){ return '<div style="margin:0 auto 10px;max-width:520px;border:1px solid var(--line);box-shadow:0 1px 6px rgba(0,0,0,.12)">' + x.replace(/width="210mm" height="297mm"/, 'width="100%" style="display:block"') + '</div>'; }).join("");
        msg.textContent = s.length > 1 ? "El informe tiene " + s.length + " hojas (la tabla continúa en la siguiente)." : "";
      }).catch(function(e){ $(".iv-prev").textContent = ""; msg.textContent = "No se pudo armar el informe: " + (e && e.message ? e.message : e); });
    }, 250);
  }
  ["input", "change"].forEach(function(ev){ ov.addEventListener(ev, function(e){ if(e.target && /^iv-/.test(e.target.className)) refrescar(); }); });
  refrescar();
  function nombre(ext, k){ return "Porticos_Informe_Viaje_" + opts().fecha + (k ? "_hoja" + k : "") + "." + ext; }
  function pre(btn){ if(!SV.length){ msg.textContent = "Espera un momento: la vista previa aún se está preparando."; return false; } guardar("porticos.viaje.autor", opts().autor); btn.disabled = true; return true; }
  $(".iv-pdf").onclick = function(){
    var b = this; if(!pre(b)) return; var pw = Math.round(210 / 25.4 * 300), ph = Math.round(297 / 25.4 * 300), imgs = [], seq = Promise.resolve();
    SV.forEach(function(s, i){ seq = seq.then(function(){ msg.textContent = "Generando hoja " + (i + 1) + " de " + SV.length + "…"; return H.rasterizar(s, pw, ph); }).then(function(j){ imgs.push(j); }); });
    seq.then(function(){ H.bajar(H.pdfDesde(imgs, pw, ph, 595.28, 841.89, "Informe de viaje Porticos"), nombre("pdf")); msg.textContent = "✓ PDF listo."; }).catch(function(e){ msg.textContent = "No se pudo generar el PDF: " + (e && e.message ? e.message : e); }).then(function(){ b.disabled = false; });
  };
  $(".iv-png").onclick = function(){
    var b = this; if(!pre(b)) return; var pw = Math.round(210 / 25.4 * 300), ph = Math.round(297 / 25.4 * 300), seq = Promise.resolve();
    SV.forEach(function(s, i){ seq = seq.then(function(){ msg.textContent = "Generando PNG " + (i + 1) + " de " + SV.length + "…"; return H.rasterizar(s, pw, ph, "image/png"); }).then(function(u8){ H.bajar(new Blob([u8], { type:"image/png" }), nombre("png", SV.length > 1 ? i + 1 : 0)); }); });
    seq.then(function(){ msg.textContent = "✓ PNG listo (300 ppp)."; }).catch(function(e){ msg.textContent = "No se pudo generar el PNG: " + (e && e.message ? e.message : e); }).then(function(){ b.disabled = false; });
  };
}
window.PORTICOS_VIAJE = { abrir:abrir, _t:{ generar:generar, armar:armar, hojas:hojas } };
})();
