/* Informe de avance · Pórticos (Resumen ejecutivo)
   4 hojas A3 vertical (297 x 420 mm): 1 mapa · 2 semanal · 3 intermedio · 4 indicadores.
   Se genera en el navegador con los datos vivos de la app; salida PDF (300 ppp) y SVG (zip). */
(function(){
"use strict";
var NAVY = "#0A2240", MUTE = "rgba(10,34,64,.65)", LINE = "#D8D5CB", CHIP = "#EDEBE4";
var FUENTE = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
var TONOS = { copper:"#D49A6A", neutral:"#8C949E", blueprint:"#2C6B7E", amber:"#D6A828", success:"#26694B", violet:"#7A52AA", sky:"#3F8FC4", danger:"#B23B3B" };
var TONE0 = { "Trazado":"sky", "Excavación":"copper", "Emplantillado":"neutral", "Inst. de Fundación":"blueprint", "Inst. Malla":"amber", "Relleno":"success", "Inst. Pórtico":"violet", "Inst. Cámara":"danger" };
var ABREV = { "san fernando":"S.Fdo.", "santa cruz":"S.Cruz", "chimbarongo":"Chimb.", "nancagua":"Nanc.", "chépica":"Chép.", "placilla":"Plac.", "pichilemu":"Pich.", "peralillo":"Peral.", "palmilla":"Palm.", "pumanque":"Pum.", "paredones":"Pared.", "marchigüe":"March.", "litueche":"Lit.", "navidad":"Nav.", "la estrella":"L.Estr.", "lolol":"Lolol" };
var DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
var MES3 = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
var NOTAS = ["Comentarios","Prevención"];
/* posiciones manuales de las etiquetas del mapa (desplazamiento mm respecto del punto) */
var LABEL_REL = {"P147-a": [-2.74, 2.76, "start"], "P147-b": [-3.35, 3.18, "start"], "P147-c": [-3.26, -3.05, "start"], "P147-d": [-3.54, -2.75, "start"], "P144-a": [-3.33, -2.45, "start"], "P144-b": [-3.17, -2.64, "start"], "P163": [-2.3, 2.63, "start"], "P158-a": [-2.64, 2.89, "start"], "P158-b": [-3.28, -2.85, "start"], "P71": [-2.12, -2.75, "start"], "P84": [1.18, -2.21, "start"], "P85": [1.74, -0.25, "start"], "P86": [0.04, 2.92, "middle"], "P31": [-1.93, 2.7, "start"], "P143-a": [-4.22, -4.65, "start"], "P143-b": [2.49, 1.36, "start"], "P154-a": [-3.35, -3.32, "start"], "P154-b": [-3.47, 2.86, "start"], "P155-a": [-3.19, -2.66, "start"], "P157-a": [-3.24, 2.64, "start"], "P157-b": [-3.5, -2.93, "start"], "P164": [-2.17, -2.85, "start"], "P67": [-1.84, 2.82, "start"], "P82": [-1.85, 2.89, "start"], "P145-a": [2.45, 0.78, "start"], "P145-b": [1.63, -4.1, "start"], "P145-c": [1.4, -1.96, "start"], "P146": [-2.63, 2.86, "start"], "P153": [-2.68, -2.69, "start"], "P69": [-1.57, 2.78, "start"], "P70": [-1.5, 2.74, "start"], "P83": [-1.98, 2.99, "start"]};
var CAUSAS0 = { A:"Mala planificación", B:"Trabajo anterior sin terminar", C:"Terminación de un trabajo anterior propio", D:"Falta de información", E:"Cambios en el diseño", F:"Ausencia no planificada", G:"Falta de personal", H:"Falta o falla de materiales / equipos", I:"Cambios del cliente", J:"Falta de supervisión", K:"Estimación incorrecta de tiempo", L:"Permisos o autorizaciones externas", M:"Clima", N:"Condiciones inseguras de trabajo", O:"Mala definición del proyecto", P:"Mala calidad o retrabajo / no conformidad", Q:"Rendimiento inferior al esperado", R:"Terreno o acceso", S:"Cierre por vacaciones / abandono de la obra", T:"Reorganización de tareas", U:"Avería de maquinaria", V:"Otras" };

var ORDEN = Object.keys(TONE0), COL = {};
function initOrden(){
  var pt = window.PARTIDA_TONE;
  if(pt && Object.keys(pt).length){ ORDEN = Object.keys(pt); }
  COL = {}; ORDEN.forEach(function(p){ COL[p] = TONOS[(pt && pt[p]) || TONE0[p]] || "#8C949E"; });
}

/* ---------- medición de texto (Inter) ---------- */
var _cv = document.createElement("canvas").getContext("2d");
function tw(s, size, w){ _cv.font = (w || 400) + " 200px Inter, system-ui, sans-serif"; return _cv.measureText(String(s)).width / 200 * size; }
function wrap(s, size, w, maxw, maxlines){
  maxlines = maxlines || 99; var words = String(s).split(/\s+/).filter(Boolean), lines = [], cur = "";
  words.forEach(function(wd){ var t = (cur + " " + wd).trim(); if(tw(t, size, w) <= maxw || !cur) cur = t; else { lines.push(cur); cur = wd; } });
  if(cur) lines.push(cur);
  if(lines.length > maxlines){ lines = lines.slice(0, maxlines); var l = lines[maxlines - 1]; while(l && tw(l + "…", size, w) > maxw) l = l.slice(0, -1); lines[maxlines - 1] = l.replace(/\s+$/, "") + "…"; }
  return lines;
}
function fit(s, size, w, maxw){ s = String(s); if(tw(s, size, w) <= maxw) return s; while(s && tw(s + "…", size, w) > maxw) s = s.slice(0, -1); return s.replace(/\s+$/, "") + "…"; }

/* ---------- primitivas SVG (mm) ---------- */
function f(n){ var v = Math.round(n * 100) / 100; return String(v === 0 ? 0 : v); }
function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function T(x, y, s, size, w, fill, o){
  o = o || {}; w = w || 400; fill = fill || NAVY;
  return '<text x="' + f(x) + '" y="' + f(y) + '" font-family="' + esc(o.mono ? MONO : FUENTE) + '" font-size="' + f(size) + '" font-weight="' + w + '" fill="' + fill + '"'
    + (o.anchor && o.anchor !== "start" ? ' text-anchor="' + o.anchor + '"' : "") + (o.ls ? ' letter-spacing="' + f(o.ls) + '"' : "") + (o.italic ? ' font-style="italic"' : "")
    + (o.halo ? ' stroke="' + o.halo[0] + '" stroke-width="' + o.halo[1] + '" stroke-linejoin="round" paint-order="stroke"' : "")
    + ' dominant-baseline="central" xml:space="preserve">' + esc(s) + '</text>';
}
function R(x, y, w, h, fill, o){
  o = o || {}; var sw = o.sw == null ? .25 : o.sw;
  return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' + (o.rx ? ' rx="' + f(o.rx) + '"' : "") + ' fill="' + (fill || "none") + '"'
    + (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + f(sw) + '"' : "") + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + '/>';
}
function L(x1, y1, x2, y2, stroke, sw, dash, extra){
  return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + (stroke || NAVY) + '" stroke-width="' + f(sw == null ? .25 : sw) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + (extra || "") + '/>';
}
function tick(x, y, s, col, sw){ s = s || 1.4; col = col || "#26694B"; sw = sw || .35;
  return '<polyline points="' + f(x) + ',' + f(y + s * .1) + ' ' + f(x + s * .35) + ',' + f(y + s * .5) + ' ' + f(x + s) + ',' + f(y - s * .55) + '" fill="none" stroke="' + col + '" stroke-width="' + f(sw) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
function cross(x, y, s, col, sw){ s = s || 1.1; col = col || "#B23B3B"; sw = sw || .35;
  return L(x, y - s / 2, x + s, y + s / 2, col, sw, null, ' stroke-linecap="round"') + L(x, y + s / 2, x + s, y - s / 2, col, sw, null, ' stroke-linecap="round"'); }
function circ(x, y, r, fill, stroke, sw){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + f(sw) + '"' : "") + '/>'; }
function mix(hex, k){ var h = hex.replace("#", ""), r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
  return "#" + [r,g,b].map(function(c){ var v = Math.round(255 - (255 - c) * k); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }

/* ---------- fechas ---------- */
function pd(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); }
function iso(d){ return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2,"0") + "-" + String(d.getUTCDate()).padStart(2,"0"); }
function addDays(d, n){ return new Date(d.getTime() + n * 86400000); }
function wd(d){ return (d.getUTCDay() + 6) % 7; }
function lunes(s){ var d = pd(s); return addDays(d, -wd(d)); }
function fl(d){ return d.getUTCDate() + " de " + MESES[d.getUTCMonth()]; }
function fdm(s){ var d = pd(s); return String(d.getUTCDate()).padStart(2,"0") + "-" + String(d.getUTCMonth() + 1).padStart(2,"0"); }
function fdmy(s){ var d = pd(s); return String(d.getUTCDate()).padStart(2,"0") + "-" + String(d.getUTCMonth() + 1).padStart(2,"0") + "-" + d.getUTCFullYear(); }
function etqs(s){ var d = pd(s); return d.getUTCDate() + "-" + MES3[d.getUTCMonth()]; }
function etq(c){ var k = String(c).trim().toLowerCase(); return ABREV[k] || (c.length > 8 ? c.slice(0, 4) + "." : c); }
function cmpNat(a, b){ return String(a).localeCompare(String(b), "es", { numeric:true, sensitivity:"base" }); }
function cuenta(arr, fn){ var o = {}; arr.forEach(function(x){ var k = fn(x); o[k] = (o[k] || 0) + 1; }); return o; }

/* ---------- marco de página ---------- */
var TOTAL = 4;
function frame(n, label, title, corte, extra){
  var o = [R(0, 0, 297, 420, "#ffffff")];
  o.push(T(16, 18, label, 2.6, 600, MUTE, { mono:true, ls:.35 }));
  var tsz = 8; while(tw(title, tsz, 700) > 265 && tsz > 3) tsz -= .1;
  o.push(T(16, 26, title, tsz, 700, NAVY)); o.push(L(16, 31, 281, 31, NAVY, .4));
  var yb = 406; o.push(L(16, yb + 3, 281, yb + 3, "rgba(10,34,64,.3)", .25));
  o.push(T(16, yb + 7, "Fuente: app Pórticos (GeoMAV) · " + corte + " · A3 vertical 297 × 420 mm · imprimir al 100 %" + (extra || ""), 2.6, 400, MUTE));
  o.push(T(281, yb + 7, "GeoMAV · geomav.me · Hoja " + n + " de " + TOTAL, 2.6, 600, NAVY, { anchor:"end" }));
  return o;
}
function kpis(items){
  var o = [], gap = 4, bw = (265 - 3 * gap) / 4, y = 34, h = 13;
  items.forEach(function(it, i){
    var bx = 16 + i * (bw + gap), v = String(it[0]), lab = it[1];
    o.push(R(bx, y, bw, h, CHIP, { rx:1.2 })); o.push(T(bx + 3, y + 7.6, v, 7.5, 700, NAVY));
    var wv = tw(v, 7.5, 700), lsz = 3.1, disp = bw - 3 - wv - 2.5 - 2.5;
    if(tw(lab, lsz) > disp) lsz = lsz * disp / tw(lab, lsz);
    o.push(T(bx + 3 + wv + 2.5, y + 7.8, lab, lsz, 400, MUTE));
  });
  return o;
}
function svgDoc(body, title){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="420mm" viewBox="0 0 297 420">\n<title>' + esc(title) + '</title>\n' + body.join("\n") + '\n</svg>\n';
}

/* ---------- modelo ---------- */
function modelo(D){
  var M = { hoy: D.hoy };
  M.PORT = D.lista.map(function(p){ return { num:String(p.num), nombre:p.nombre, comuna:p.comuna, lat:(p.lat === "" || p.lat == null) ? null : +p.lat, lng:(p.lng === "" || p.lng == null) ? null : +p.lng }; });
  M.PN = {}; M.PORT.forEach(function(p){ M.PN[p.num] = p; });
  M.AV = (D.avance || []).map(function(a){ return { portico:String(a.portico), partida:a.partida, fecha:a.fecha, obs:a.obs || "", avance:a.avance, reg:a.registrado || "" }; });
  M.PR = (D.prog || []).map(function(r){ return { fecha:r.fecha, portico:String(r.portico), nombre:r.nombre, comuna:r.comuna, partida:r.partida, estado:r.estado || "", aut:r.autorizacion || "", obs:r.obs || "", resp:r.responsable || "", avance:r.avance, restr:r.restriccion || "", causa:r.causa || "", accion:r.accion || "" }; });
  M.ejec = {}; M.ejecAv = {};
  M.PR.forEach(function(r){ if(/^ejecutado/i.test(r.estado) && ORDEN.indexOf(r.partida) >= 0){ var k = r.portico + "|" + r.partida; if(!M.ejec[k] || r.fecha < M.ejec[k]) M.ejec[k] = r.fecha; } });
  M.AV.forEach(function(a){
    if(NOTAS.indexOf(a.partida) >= 0 || ORDEN.indexOf(a.partida) < 0) return;
    if(a.avance !== "" && a.avance != null && parseFloat(a.avance) < 100) return;
    var k = a.portico + "|" + a.partida;
    if(!M.ejecAv[k] || a.fecha < M.ejecAv[k]) M.ejecAv[k] = a.fecha;
    if(!M.ejec[k] || a.fecha < M.ejec[k]) M.ejec[k] = a.fecha;
  });
  M.NIV = {}; M.PORT.forEach(function(p){ var n = -1; ORDEN.forEach(function(q, i){ if(M.ejec[p.num + "|" + q]) n = i; }); M.NIV[p.num] = n; });
  M.TRAZ = M.PORT.filter(function(p){ return M.NIV[p.num] >= 0; }).map(function(p){ return p.num; }).sort(function(a, b){ return a - b; });
  M.corte = fdmy(D.hoy);
  return M;
}

/* ====================== HOJA 1 · MAPA ====================== */
function merc(lat, lng){ return [lng * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))]; }
function hoja1(M, G){
  var PORT = M.PORT, PN = M.PN, TR = M.TRAZ, NIV = M.NIV;
  var o = frame(1, "INFORME DE AVANCE · PÓRTICOS DE VIGILANCIA · REGIÓN DE O'HIGGINS", "Pórticos trazados · mapa de situación", "corte al " + M.corte);
  var comT = {}; TR.forEach(function(n){ comT[PN[n].comuna] = 1; });
  var post = TR.filter(function(n){ return NIV[n] >= 1; });
  o = o.concat(kpis([[TR.length, "de " + PORT.length + " pórticos trazados"], [post.length, "con partidas posteriores"], [Object.keys(comT).length, "comunas intervenidas"], [Object.keys(M.ejec).length, "partidas ejecutadas"]]));
  var pts = TR.map(function(n){ return PN[n]; }).filter(function(p){ return p.lat != null; });
  if(!pts.length) pts = PORT.filter(function(p){ return p.lat != null; });
  var la0 = Math.min.apply(0, pts.map(function(p){ return p.lat; })), la1 = Math.max.apply(0, pts.map(function(p){ return p.lat; }));
  var lo0 = Math.min.apply(0, pts.map(function(p){ return p.lng; })), lo1 = Math.max.apply(0, pts.map(function(p){ return p.lng; }));
  var MX = 16, MY = 52, MW = 265, MH = 198;
  var a0 = merc(la0, lo0), a1 = merc(la1, lo1), cx = (a0[0] + a1[0]) / 2, cy = (a0[1] + a1[1]) / 2, spanx = a1[0] - a0[0], spany = a1[1] - a0[1];
  var k = Math.max(spanx / (MW * .86), spany / (MH * .84), 1e-7), wx0 = cx - k * MW / 2, wy1 = cy + k * MH / 2;
  function P(lat, lng){ var m = merc(lat, lng); return [MX + (m[0] - wx0) / k, MY + (wy1 - m[1]) / k]; }
  function inv(px, py){ var x = wx0 + (px - MX) * k, y = wy1 - (py - MY) * k; return [(2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI, x * 180 / Math.PI]; }
  var laC = inv(MX + MW / 2, MY + MH / 2)[0] * Math.PI / 180, mmPerM = 1 / (k * 6378137 * Math.cos(laC));
  o.push('<defs><clipPath id="mapclip"><rect x="' + MX + '" y="' + MY + '" width="' + MW + '" height="' + MH + '"/></clipPath></defs>');
  o.push(R(MX, MY, MW, MH, "#F4F3EF"));
  var g = ['<g clip-path="url(#mapclip)">'];
  function ring(coords, close){
    var ps = coords.map(function(c){ return P(c[1], c[0]); }), all = function(fn){ return ps.every(fn); };
    if(all(function(p){ return p[0] < MX - 5; }) || all(function(p){ return p[0] > MX + MW + 5; }) || all(function(p){ return p[1] < MY - 5; }) || all(function(p){ return p[1] > MY + MH + 5; })) return null;
    return "M" + ps.map(function(p){ return f(p[0]) + " " + f(p[1]); }).join("L") + (close === false ? "" : "Z");
  }
  function polys(geom){ return geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates; }
  var cent = {};
  G.comunas.features.forEach(function(ft){
    var pr = ft.properties, ds = [];
    polys(ft.geometry).forEach(function(poly){ poly.forEach(function(r){ var d = ring(r); if(d) ds.push(d); }); });
    var reg = pr.r6 === 1;
    if(ds.length) g.push('<path d="' + ds.join(" ") + '" fill="' + (reg ? "#FBFAF6" : "#E9E7E0") + '" stroke="#BDB8A9" stroke-width=".3" fill-rule="evenodd"/>');
    var big = null; polys(ft.geometry).forEach(function(poly){ if(!big || poly[0].length > big.length) big = poly[0]; });
    var A = 0, Cx = 0, Cy = 0;
    for(var i = 0; i < big.length - 1; i++){ var xa = big[i][0], ya = big[i][1], xb = big[i + 1][0], yb = big[i + 1][1], cr = xa * yb - xb * ya; A += cr; Cx += (xa + xb) * cr; Cy += (ya + yb) * cr; }
    if(A) cent[pr.comuna] = [Cy / (3 * A), Cx / (3 * A), reg];
  });
  G.vial.features.forEach(function(ft){
    var geom = ft.geometry, lines = geom.type === "MultiLineString" ? geom.coordinates : [geom.coordinates];
    var ds = lines.map(function(l){ return ring(l, false); }).filter(Boolean); if(!ds.length) return;
    var mayor = String((ft.properties || {}).rol || "").toLowerCase().indexOf("ruta") === 0;
    g.push('<path d="' + ds.join(" ") + '" fill="none" stroke="' + (mayor ? "#D49A6A" : "#D9CDB6") + '" stroke-width="' + (mayor ? ".7" : ".28") + '" stroke-linecap="round" stroke-linejoin="round"/>');
  });
  G.provincias.features.forEach(function(ft){
    var ds = []; polys(ft.geometry).forEach(function(poly){ poly.forEach(function(r){ var d = ring(r); if(d) ds.push(d); }); });
    if(ds.length) g.push('<path d="' + ds.join(" ") + '" fill="none" stroke="#000000" stroke-width=".45" stroke-dasharray="1.6 .9"/>');
  });
  /* retícula */
  var step = .1, inv0 = inv(MX, MY + MH), inv1 = inv(MX + MW, MY), laA = inv0[0], loA = inv(MX, MY)[1], laB = inv1[0], loB = inv(MX + MW, MY + MH)[1];
  var labGrid = [], v = Math.ceil(laA / step) * step;
  while(v <= laB){ var yy = P(v, loA)[1]; g.push(L(MX, yy, MX + MW, yy, "rgba(10,34,64,.10)", .15, "0.6 0.9")); labGrid.push(["lat", yy, v]); v += step; }
  v = Math.ceil(loA / step) * step;
  while(v <= loB){ var xx = P(laA, v)[0]; g.push(L(xx, MY, xx, MY + MH, "rgba(10,34,64,.10)", .15, "0.6 0.9")); labGrid.push(["lng", xx, v]); v += step; }
  var placed = [];
  function boxOf(x, y, s, size, w, anchor){ var wdt = tw(s, size, w), xl = (!anchor || anchor === "start") ? x : (anchor === "middle" ? x - wdt / 2 : x - wdt); return [xl - .4, y - size * .62, xl + wdt + .4, y + size * .62]; }
  Object.keys(cent).forEach(function(name){
    var c = cent[name], p = P(c[0], c[1]), x = p[0], y = p[1], reg = c[2], nm = name.toUpperCase();
    var wlab = tw(nm, reg ? 3.2 : 2.6, 700) + 2;
    if(!(MX + wlab / 2 + 1 < x && x < MX + MW - wlab / 2 - 1 && MY + 4 < y && y < MY + MH - 4)) return;
    var con = !!comT[name];
    g.push(T(x, y, nm, reg ? 3.2 : 2.6, con ? 700 : 600, con ? NAVY : "#6B7380", { anchor:"middle", ls:.5, italic:!reg }));
    placed.push(boxOf(x, y, nm, 3.2, 700, "middle"));
  });
  var sinTraz = PORT.filter(function(p){ return p.lat != null && TR.indexOf(p.num) < 0; });
  sinTraz.forEach(function(p){ var q = P(p.lat, p.lng); if(MX < q[0] && q[0] < MX + MW && MY < q[1] && q[1] < MY + MH) g.push('<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r=".95" fill="#ffffff" stroke="#8C949E" stroke-width=".25"/>'); });
  var marks = [];
  TR.forEach(function(n){ var p = PN[n]; if(p.lat == null) return; var q = P(p.lat, p.lng); marks.push([n, q[0], q[1]]); });
  var occ = marks.map(function(m){ return [m[1] - 1.8, m[2] - 1.8, m[1] + 1.8, m[2] + 1.8]; });
  function inter(a, b){ return !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]); }
  var lsz = 2.15, labels = [];
  marks.forEach(function(m){
    var nm = PN[m[0]].nombre, rel = LABEL_REL[nm]; if(!rel) return;
    var lx = m[1] + rel[0], ly = m[2] + rel[1]; occ.push(boxOf(lx, ly, nm, lsz, 600, rel[2])); labels.push([nm, lx, ly, rel[2]]);
  });
  marks.filter(function(m){ return !LABEL_REL[PN[m[0]].nombre]; }).sort(function(a, b){ return (a[2] - b[2]) || (a[1] - b[1]); }).forEach(function(m){
    var n = m[0], x = m[1], y = m[2], s = PN[n].nombre;
    var cands = [["start",x+2,y],["end",x-2,y],["middle",x,y-2.9],["middle",x,y+2.9],["start",x+1.6,y-2.5],["end",x-1.6,y-2.5],["start",x+1.6,y+2.5],["end",x-1.6,y+2.5],["start",x+2,y-4.6],["start",x+2,y+4.6],["end",x-2,y-4.6],["end",x-2,y+4.6],["middle",x,y-5.2],["middle",x,y+5.2]];
    var best = null;
    for(var i = 0; i < cands.length; i++){
      var an = cands[i][0], lx = cands[i][1], ly = cands[i][2], b = boxOf(lx, ly, s, lsz, 600, an);
      var hit = occ.filter(function(q){ return inter(b, q); }).length + placed.filter(function(q){ return inter(b, q); }).length;
      if(b[0] < MX + 1 || b[2] > MX + MW - 1 || b[1] < MY + 1 || b[3] > MY + MH - 1) hit += 5;
      if(!best || hit < best[0]) best = [hit, an, lx, ly, b];
      if(hit === 0) break;
    }
    occ.push(best[4]); labels.push([s, best[2], best[3], best[1]]);
  });
  labels.forEach(function(l){ g.push(T(l[1], l[2], l[0], lsz, 600, NAVY, { anchor:l[3], halo:["#ffffff", .7] })); });
  marks.forEach(function(m){ var col = COL[ORDEN[NIV[m[0]]]];
    g.push('<circle cx="' + f(m[1]) + '" cy="' + f(m[2]) + '" r="1.45" fill="' + col + '" stroke="#ffffff" stroke-width=".55"/><circle cx="' + f(m[1]) + '" cy="' + f(m[2]) + '" r="1.45" fill="none" stroke="' + NAVY + '" stroke-width=".18"/>'); });
  g.push("</g>"); o = o.concat(g);
  o.push(R(MX, MY, MW, MH, "none", { stroke:NAVY, sw:.35 }));
  labGrid.forEach(function(q){
    if(q[0] === "lat"){ if(q[1] < MY + 30) return; o.push(T(MX + 1.2, q[1] - 1.3, q[2].toFixed(1) + "°", 2, 500, MUTE, { halo:["#F4F3EF", .6] })); }
    else o.push(T(q[1] + .8, MY + MH - 1.8, q[2].toFixed(1) + "°", 2, 500, MUTE, { halo:["#F4F3EF", .6] }));
  });
  var nx = MX + 8, ny = MY + 12;
  o.push(R(nx - 5.5, ny - 9.5, 11, 18.5, "rgba(255,255,255,.85)", { rx:1 }));
  o.push('<polygon points="' + f(nx) + ',' + f(ny - 7) + ' ' + f(nx + 2.6) + ',' + f(ny + 3) + ' ' + f(nx) + ',' + f(ny + 1.6) + '" fill="' + NAVY + '"/><polygon points="' + f(nx) + ',' + f(ny - 7) + ' ' + f(nx - 2.6) + ',' + f(ny + 3) + ' ' + f(nx) + ',' + f(ny + 1.6) + '" fill="#ffffff" stroke="' + NAVY + '" stroke-width=".25"/>');
  o.push(T(nx, ny + 6.3, "N", 3, 700, NAVY, { anchor:"middle" }));
  var kmOpts = [1, 2, 5, 10, 20, 25], km = 1;
  kmOpts.forEach(function(c){ if(c * 1000 * mmPerM <= MW * .22) km = c; });
  var bw = km * 1000 * mmPerM, sx = MX + MW - bw - 8, sy = MY + MH - 9;
  o.push(R(sx - 4, sy - 5.5, bw + 8, 11.5, "rgba(255,255,255,.88)", { rx:1 }));
  for(var i = 0; i < 4; i++) o.push(R(sx + i * bw / 4, sy, bw / 4, 1.5, i % 2 === 0 ? NAVY : "#ffffff", { stroke:NAVY, sw:.2 }));
  o.push(T(sx, sy - 2.2, "0", 2.1, 500, NAVY, { anchor:"middle" })); o.push(T(sx + bw, sy - 2.2, km + " km", 2.1, 500, NAVY, { anchor:"middle" }));
  var esc1 = Math.round(1000 / mmPerM / 5000) * 5000;
  o.push(T(sx + bw / 2, sy + 4, "Escala aprox. 1 : " + String(esc1).replace(/\B(?=(\d{3})+(?!\d))/g, "."), 2, 400, MUTE, { anchor:"middle" }));
  /* recuadro de situación */
  var IW = 40, IH = 52, IHB = 30.1, ix = MX + MW - IW - 4, iy = MY + 4;
  o.push(R(ix - 1, iy - 1, IW + 2, IHB + 2, "rgba(255,255,255,.92)", { rx:1, stroke:"#BDB8A9", sw:.2 }));
  var allp = []; G.provincias.features.forEach(function(ft){ polys(ft.geometry).forEach(function(poly){ poly.forEach(function(r){ r.forEach(function(c){ allp.push(c); }); }); }); });
  var ax0 = Math.min.apply(0, allp.map(function(c){ return c[0]; })), ax1 = Math.max.apply(0, allp.map(function(c){ return c[0]; })), ay0 = Math.min.apply(0, allp.map(function(c){ return c[1]; })), ay1 = Math.max.apply(0, allp.map(function(c){ return c[1]; }));
  var s_ = Math.min((IW - 3) / (ax1 - ax0), (IH - 9) / (ay1 - ay0));
  function IP(lat, lng){ return [ix + 1.5 + (lng - ax0) * s_, iy + 7 + (ay1 - lat) * s_]; }
  G.provincias.features.forEach(function(ft){
    var ds = []; polys(ft.geometry).forEach(function(poly){ poly.forEach(function(r){ ds.push("M" + r.map(function(c){ var q = IP(c[1], c[0]); return f(q[0]) + " " + f(q[1]); }).join("L") + "Z"); }); });
    o.push('<path d="' + ds.join(" ") + '" fill="#EDEBE4" stroke="#8C949E" stroke-width=".25"/>');
  });
  var qa = IP(la1, lo0), qb = IP(la0, lo1);
  o.push(R(qa[0], qa[1], qb[0] - qa[0], qb[1] - qa[1], "rgba(178,59,59,.12)", { stroke:"#B23B3B", sw:.45 }));
  o.push(T(ix + IW / 2, iy + 3.3, "Región de O'Higgins", 2.2, 600, NAVY, { anchor:"middle" }));
  /* leyenda */
  var ly = MY + MH + 7; o.push(T(16, ly, "Último estado ejecutado", 3, 700, NAVY));
  var cnt = cuenta(TR, function(n){ return NIV[n]; }), px = 16 + tw("Último estado ejecutado", 3, 700) + 6;
  ORDEN.forEach(function(p, i){ if(!cnt[i]) return; o.push(circ(px + 1.5, ly, 1.45, COL[p], "#ffffff", .4)); var lab = p + " " + cnt[i]; o.push(T(px + 4, ly, lab, 3, 400, NAVY)); px += 4 + tw(lab, 3) + 6; });
  o.push(circ(px + 1.5, ly, .95, "#fff", "#8C949E", .25)); o.push(T(px + 4, ly, "Sin trazar (" + sinTraz.length + ")", 3, 400, NAVY));
  var nsc = PORT.filter(function(p){ return p.lat == null; }).map(function(p){ return p.nombre; });
  var nota = "Estado = última partida ejecutada, según programación y registros de avance. Mapa vectorial (comunas, provincias y red vial de los archivos del proyecto)."; if(nsc.length) nota += " Sin coordenadas: " + nsc.join(", ") + ".";
  wrap(nota, 2.4, 400, 265).forEach(function(ln, i){ o.push(T(16, ly + 5.2 + i * 3.1, ln, 2.4, 400, MUTE)); });
  /* resumen por comuna */
  var ty = ly + 17; o.push(T(16, ty, "Resumen por comuna", 3.4, 700, NAVY)); o.push(L(16, ty + 2.6, 281, ty + 2.6, NAVY, .3));
  var comsAll = {}; PORT.forEach(function(p){ comsAll[p.comuna] = 1; });
  var rows = Object.keys(comsAll).map(function(c){
    var pc = PORT.filter(function(p){ return p.comuna === c; }).map(function(p){ return p.num; }), tz = pc.filter(function(n){ return TR.indexOf(n) >= 0; }), ps = tz.filter(function(n){ return NIV[n] >= 1; });
    var ult = tz.length ? ORDEN[Math.max.apply(0, tz.map(function(n){ return NIV[n]; }))] : "—";
    return [c, pc.length, tz.length, ps.length, ult];
  });
  rows.sort(function(a, b){ return (b[2] - a[2]) || (b[1] - a[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); });
  var cols = [["Comuna", 0, "start"], ["Pórticos", 33, "end"], ["Trazados", 52, "end"], ["Con partidas post.", 82, "end"], ["Etapa más avanzada", 86, "start"]];
  var half = Math.floor((rows.length + 1) / 2);
  [rows.slice(0, half), rows.slice(half)].forEach(function(chunk, hi){
    var bx = 16 + hi * 135, wdt = 130, y0 = ty + 6.4;
    o.push(R(bx, y0 - 2.4, wdt, 4.8, CHIP, { rx:.8 }));
    cols.forEach(function(c){ o.push(T(bx + 2 + c[1], y0, c[0], 2.3, 600, MUTE, { anchor:c[2] })); });
    chunk.forEach(function(r, i){
      var y2 = y0 + 5.2 + i * 4.9; if(i % 2) o.push(R(bx, y2 - 2.4, wdt, 4.9, "rgba(10,34,64,.03)"));
      o.push(T(bx + 2, y2, r[0], 2.7, 600, NAVY)); o.push(T(bx + 35, y2, String(r[1]), 2.7, 400, NAVY, { anchor:"end" }));
      o.push(T(bx + 54, y2, String(r[2]), 2.7, r[2] ? 700 : 400, r[2] ? NAVY : MUTE, { anchor:"end" })); o.push(T(bx + 84, y2, String(r[3]), 2.7, 400, r[3] ? NAVY : MUTE, { anchor:"end" }));
      if(r[4] !== "—"){ o.push(circ(bx + 88.2, y2, 1.1, COL[r[4]])); o.push(T(bx + 90.6, y2, r[4], 2.6, 400, NAVY)); } else o.push(T(bx + 88, y2, "—", 2.7, 400, MUTE));
    });
  });
  var yt = ty + 6.4 + 5.2 + half * 4.9 + 1; o.push(L(16, yt - 2.4, 281, yt - 2.4, NAVY, .25));
  o.push(T(18, yt + .6, "Total región: " + PORT.length + " pórticos · " + TR.length + " trazados (" + Math.round(100 * TR.length / Math.max(1, PORT.length)) + " %) · " + post.length + " con partidas posteriores", 2.8, 700, NAVY));
  /* detalle */
  var dy = yt + 9; o.push(T(16, dy, "Pórticos trazados (" + TR.length + ")", 3.4, 700, NAVY)); o.push(L(16, dy + 2.6, 281, dy + 2.6, NAVY, .3));
  var lst = TR.slice().sort(function(a, b){ return (PN[a].comuna < PN[b].comuna ? -1 : PN[a].comuna > PN[b].comuna ? 1 : 0) || cmpNat(PN[a].nombre, PN[b].nombre); });
  var per = Math.floor((lst.length + 2) / 3), cw = 88;
  for(var ci = 0; ci < 3; ci++){
    var chunk = lst.slice(ci * per, (ci + 1) * per), bx = 16 + ci * (cw + .5), y0 = dy + 6.2;
    o.push(R(bx, y0 - 2.2, cw, 4.4, CHIP, { rx:.8 }));
    [["Pórtico", 5], ["Comuna", 25], ["Trazado", 56], ["Último estado", 68]].forEach(function(h){ o.push(T(bx + h[1], y0, h[0], 2.1, 600, MUTE)); });
    chunk.forEach(function(n, i){
      var y2 = y0 + 4.9 + i * 4.3; if(i % 2) o.push(R(bx, y2 - 2.15, cw, 4.3, "rgba(10,34,64,.03)"));
      o.push(circ(bx + 2.4, y2, 1.2, COL[ORDEN[NIV[n]]], "#fff", .3));
      o.push(T(bx + 5, y2, PN[n].nombre, 2.5, 700, NAVY)); o.push(T(bx + 25, y2, fit(PN[n].comuna, 2.4, 400, 30), 2.4, 400, NAVY));
      var tz = M.ejec[n + "|Trazado"]; o.push(T(bx + 56, y2, tz ? fdm(tz) : "—", 2.4, 400, NAVY)); o.push(T(bx + 68, y2, fit(ORDEN[NIV[n]], 2.4, 400, 19), 2.4, 400, NAVY));
    });
  }
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 1 · Mapa de pórticos trazados");
}

/* ====================== tablas comunes ====================== */
function tabla(o, x, y, w, titulo, cols, rows, vacio, rowh){
  rowh = rowh || 4.6;
  o.push(T(x, y, titulo, 3.4, 700, NAVY)); o.push(L(x, y + 2.6, x + w, y + 2.6, NAVY, .3));
  var tot = cols.reduce(function(a, c){ return a + c[1]; }, 0), xs = [], acc = 0;
  cols.forEach(function(c){ xs.push(x + 2 + acc * (w - 4) / tot); acc += c[1]; });
  var yy = y + 6.4; o.push(R(x, yy - 2.4, w, 4.8, CHIP, { rx:.8 }));
  cols.forEach(function(c, j){ o.push(T(xs[j], yy, c[0], 2.2, 600, MUTE)); });
  if(!rows.length){ o.push(T(x + 2, yy + 5.5, vacio, 2.7, 400, MUTE)); return yy + 9; }
  rows.forEach(function(r, i){
    var y2 = yy + 5.2 + i * rowh; if(i % 2) o.push(R(x, y2 - rowh / 2, w, rowh, "rgba(10,34,64,.03)"));
    cols.forEach(function(c, j){ var cw = (w - 4) * c[1] / tot - 1.5; o.push(T(xs[j], y2, fit(String(r[j]), 2.5, j === 0 ? 700 : 400, cw), 2.5, j === 0 ? 700 : 400, NAVY)); });
  });
  return yy + 5.2 + rows.length * rowh;
}
function leyendaPartidas(o, rows){
  var ly = 52.2; o.push(T(16, ly, "Por partida:", 3, 600, NAVY)); var px = 16 + tw("Por partida:", 3, 600) + 4;
  var cp = cuenta(rows, function(r){ return r.partida; }), vis = ORDEN.filter(function(p){ return cp[p]; });
  var need = vis.reduce(function(a, p){ return a + 4.4 + tw(p + " " + cp[p], 3) + 6; }, 0), disp = 281 - px, sz = 3, gap = 6;
  if(need > disp){ sz = Math.max(2.2, 3 * disp / need * .97); gap = 4; }
  vis.forEach(function(p){ o.push(R(px, ly - 1.5, 3, 3, COL[p], { rx:.6 })); var lab = p + " " + cp[p]; o.push(T(px + 4.4, ly, lab, sz, 400, NAVY)); px += 4.4 + tw(lab, sz) + gap; });
}
function diaTxt(s){ var d = pd(s); return DIAS[wd(d)] + " " + d.getUTCDate(); }

/* ====================== HOJA 2 · SEMANAL ====================== */
function hoja2(M, board){
  var d0 = lunes(M.hoy), d1 = addDays(d0, 4), INI = iso(d0), FIN = iso(d1);
  var rows = M.PR.filter(function(r){ return r.fecha >= INI && r.fecha <= FIN; });
  var titulo = "Semana del " + (d0.getUTCMonth() === d1.getUTCMonth() ? d0.getUTCDate() : fl(d0)) + " al " + fl(d1) + " de " + d1.getUTCFullYear();
  var o = frame(2, "PROGRAMACIÓN DE PÓRTICOS DE VIGILANCIA · INFORME SEMANAL", titulo, "corte al " + M.corte);
  var total = rows.length, ejc = rows.filter(function(r){ return /^ejecutado/i.test(r.estado); }).length;
  var pts = {}, cms = {}; rows.forEach(function(r){ pts[r.portico] = 1; cms[r.comuna] = 1; });
  o = o.concat(kpis([[total, "tareas en la semana"], [ejc, "ejecutadas (" + (total ? Math.round(100 * ejc / total) : 0) + " %)"], [Object.keys(pts).length, "pórticos"], [Object.keys(cms).length, Object.keys(cms).length !== 1 ? "comunas" : "comuna"]]));
  leyendaPartidas(o, rows);
  var W = 265, y0 = 58, yb = y0;
  if(board){ var sc = W / board.w; o.push('<g transform="translate(16 ' + f(y0) + ') scale(' + sc.toFixed(6) + ')">' + board.body + '</g>'); yb = y0 + board.h * sc; }
  else o.push(T(16, y0 + 6, "No se pudo leer el tablero semanal.", 3, 400, MUTE)), yb = y0 + 10;
  var y = yb + 9;
  var rest = rows.filter(function(r){ return r.restr || r.aut.toLowerCase().indexOf("pendiente") === 0; }).sort(function(a, b){ return (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0) || cmpNat(a.portico, b.portico); });
  var r1 = rest.map(function(r){ return [r.nombre, etq(r.comuna), r.partida, diaTxt(r.fecha), r.restr || "—", r.obs || "—"]; });
  y = tabla(o, 16, y, 265, "Restricciones de la semana (" + r1.length + ")", [["Pórtico", 9], ["Comuna", 9], ["Partida", 14], ["Día", 8], ["Restricción", 13], ["Autorización / detalle", 40]], r1.slice(0, 9), "Sin restricciones registradas esta semana.");
  var noej = rows.filter(function(r){ return /^no ejecutado/i.test(r.estado); });
  var r2 = noej.map(function(r){ return [r.nombre, etq(r.comuna), r.partida, diaTxt(r.fecha), r.obs || "—", r.causa || "sin causa asignada"]; });
  y = tabla(o, 16, y + 7, 265, "Tareas no ejecutadas / reprogramadas (" + r2.length + ")", [["Pórtico", 9], ["Comuna", 9], ["Partida", 14], ["Día", 8], ["Observación", 30], ["Causa", 23]], r2.slice(0, 9), "No hay tareas marcadas como «no ejecutado».");
  var n0 = addDays(d0, 7), n1 = addDays(n0, 4), nxt = M.PR.filter(function(r){ return r.fecha >= iso(n0) && r.fecha <= iso(n1); });
  var r3 = [];
  ORDEN.forEach(function(p){ var rr = nxt.filter(function(x){ return x.partida === p; }).sort(function(a, b){ return (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0) || cmpNat(a.portico, b.portico); }); if(rr.length) r3.push([p, String(rr.length), rr.map(function(x){ return x.nombre; }).join(", ")]); });
  tabla(o, 16, y + 7, 265, "Vista previa · semana del " + n0.getUTCDate() + " al " + fl(n1) + " (" + nxt.length + " tareas programadas)", [["Partida", 14], ["N°", 4], ["Pórticos programados", 82]], r3, "Sin tareas programadas para la semana siguiente.", 4.4);
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 2 · " + titulo);
}

/* ====================== HOJA 3 · INTERMEDIO ====================== */
var FS = 1.15;
function card(o, x, y, w, r, M){
  var a = FS, col = COL[r.partida] || "#8C949E", lab = etq(r.comuna) + ": " + r.nombre, obs = (r.obs || "").trim();
  if(/^ejecutado/i.test(r.estado) && obs && obs === r.comuna) obs = "";
  var lines = obs ? wrap(obs, 2.1 * a, 500, w - 3.4, 3) : [], h = 5.6 * a + (lines.length ? lines.length * 2.55 * a + .4 : 0);
  if(!o) return h;
  o.push(R(x, y, w, h, mix(col, .16), { rx:.9 }));
  lab = fit(lab, 2.1 * a, 700, w - 16); var pw = tw(lab, 2.1 * a, 700) + 3.2;
  o.push(R(x + 1.2, y + 1.1, pw, 3.4 * a, col, { rx:1.7 * a })); o.push(T(x + 2.8, y + 2.85 * a + .1, lab, 2.1 * a, 700, "#ffffff"));
  var mx = x + 1.2 + pw + 1.4;
  if(/^ejecutado/i.test(r.estado)) o.push(tick(mx, y + 3 * a, 1.5 * a)); else if(/^no ejecutado/i.test(r.estado)) o.push(cross(mx, y + 2.85 * a, 1.2 * a));
  var dtxt = diaTxt(r.fecha); o.push(T(x + w - 1.3, y + 2.85 * a + .1, dtxt, 2.0 * a, 500, "rgba(10,34,64,.55)", { anchor:"end" }));
  if(r.restr) o.push(circ(x + w - 1.3 - tw(dtxt, 2.0 * a, 500) - 1.8, y + 2.85 * a + .1, .8, "#B23B3B"));
  lines.forEach(function(ln, i){ o.push(T(x + 1.7, y + 6.9 * a + i * 2.55 * a, ln, 2.1 * a, 500, NAVY)); });
  return h;
}
function hoja3(M){
  var INI = iso(lunes(M.hoy)), rows = M.PR.filter(function(r){ return r.fecha >= INI; });
  var wk = {}; rows.forEach(function(r){ wk[iso(lunes(r.fecha))] = 1; });
  var semanas = Object.keys(wk).sort(), last = rows.reduce(function(m, r){ return r.fecha > m ? r.fecha : m; }, INI);
  var dl = pd(last), titulo = "Programación intermedia · del " + fl(pd(INI)) + " al " + fl(dl) + " de " + dl.getUTCFullYear();
  var o = frame(3, "PROGRAMACIÓN DE PÓRTICOS DE VIGILANCIA · INFORME INTERMEDIO", titulo, "corte al " + M.corte, " · se omiten las semanas posteriores sin programación");
  var pts = {}, cms = {}, nrest = 0; rows.forEach(function(r){ pts[r.portico] = 1; cms[r.comuna] = 1; if(r.restr) nrest++; });
  o = o.concat(kpis([[rows.length, "actividades programadas"], [nrest, "con restricción abierta"], [Object.keys(pts).length, "pórticos"], [Object.keys(cms).length, "comunas"]]));
  leyendaPartidas(o, rows);
  if(!semanas.length){ o.push(T(16, 70, "No hay actividades programadas desde esta semana.", 3.2, 400, MUTE)); return svgDoc(o, "Pórticos · Informe de avance · Hoja 3 · " + titulo); }
  var LW = 26, X0 = 16, W = 265, cw = (W - LW) / semanas.length, y = 58;
  o.push(R(X0, y, W, 13, CHIP, { rx:1.2 }));
  o.push(T(X0 + LW + 2, y + 3.2, MESES[pd(semanas[0]).getUTCMonth()].toUpperCase(), 2.2, 600, "rgba(10,34,64,.55)", { mono:true, ls:.3 }));
  semanas.forEach(function(s, i){
    var d0 = pd(s), d1 = addDays(d0, 4), cx = X0 + LW + i * cw;
    if(i) o.push(L(cx, y + 5, cx, y + 13, LINE, .25));
    var n = rows.filter(function(r){ return iso(lunes(r.fecha)) === s; }).length, t1 = "Lun " + d0.getUTCDate();
    o.push(T(cx + 2, y + 8.6, t1, 3.2, 700, NAVY)); o.push(T(cx + 2 + tw(t1, 3.2, 700) + 2, y + 8.7, "al " + d1.getUTCDate() + " " + MES3[d1.getUTCMonth()] + " · " + n + " tareas", 2.4, 400, MUTE));
    if(i && pd(semanas[i]).getUTCMonth() !== pd(semanas[i - 1]).getUTCMonth()) o.push(T(cx + 2, y + 3.2, MESES[d0.getUTCMonth()].toUpperCase(), 2.2, 600, "rgba(10,34,64,.55)", { mono:true, ls:.3 }));
  });
  y += 13; var ytop = y;
  ORDEN.forEach(function(p){
    var cell = [], hmax = 8;
    semanas.forEach(function(s, i){
      var its = rows.filter(function(r){ return r.partida === p && iso(lunes(r.fecha)) === s; }).sort(function(a, b){ return (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0) || cmpNat(a.portico, b.portico); });
      var ncol = its.length >= 3 ? 2 : 1, sw_ = (cw - 3 - (ncol === 2 ? 1.2 : 0)) / ncol, tmp = [], yy = 1.6, rowh = 0;
      its.forEach(function(r, k){ var c_ = k % ncol, h = card(null, 0, 0, sw_, r); if(c_ === 0 && k){ yy += rowh + 1.3; rowh = 0; } rowh = Math.max(rowh, h); tmp.push([r, yy, c_, sw_]); });
      if(its.length) yy += rowh + 1.3;
      cell[i] = tmp; hmax = Math.max(hmax, yy + .3);
    });
    var rh = hmax, col = COL[p];
    o.push(R(X0, y, W, rh, "none", { stroke:LINE, sw:.2 })); o.push(R(X0, y, LW, rh, CHIP)); o.push(R(X0, y, 1.1, rh, col));
    wrap(p, 2.9, 700, LW - 5, 3).forEach(function(ln, li){ o.push(T(X0 + 3, y + 3.4 + li * 3.4, ln, 2.9, 700, NAVY)); });
    var nn = cell.reduce(function(a, c){ return a + c.length; }, 0);
    o.push(T(X0 + 3, y + rh - 2.2, nn + " tarea" + (nn === 1 ? "" : "s"), 2, 400, MUTE));
    semanas.forEach(function(s, i){
      var cx = X0 + LW + i * cw; if(i) o.push(L(cx, y, cx, y + rh, LINE, .2));
      if(!cell[i].length) o.push(T(cx + cw / 2, y + 4, "—", 2.6, 400, "rgba(10,34,64,.3)", { anchor:"middle" }));
      cell[i].forEach(function(q){ card(o, cx + 1.5 + q[2] * (q[3] + 1.2), y + q[1], q[3], q[0], M); });
    });
    y += rh;
  });
  o.push(R(X0, ytop - 13, W, y - ytop + 13, "none", { stroke:"#C9C5B7", sw:.3, rx:1.2 }));
  o.push(T(16, y + 5, "✓ ejecutada · ✗ no ejecutada · ● restricción abierta · los textos bajo cada pórtico son las observaciones / autorizaciones registradas en la planilla.", 2.3, 400, MUTE));
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 3 · " + titulo);
}

/* ====================== HOJA 4 · INDICADORES ====================== */
function colPpc(v){ return v >= 80 ? "#26694B" : (v >= 60 ? "#D6A828" : "#B23B3B"); }
function box(o, x, y, w, h, titulo){ o.push(R(x, y, w, h, "#ffffff", { rx:1.4, stroke:"#C9C5B7", sw:.3 })); o.push(T(x + 4, y + 5, titulo, 3.4, 700, NAVY)); o.push(L(x + 4, y + 8, x + w - 4, y + 8, LINE, .25)); }
function hoja4(M, D){
  var hoy = M.hoy, lh = iso(lunes(hoy)), PORT = M.PORT, PN = M.PN;
  var total = PORT.length * ORDEN.length, nreal = Object.keys(M.ejecAv).length;
  var inic = {}; M.AV.forEach(function(a){ if(NOTAS.indexOf(a.partida) < 0) inic[a.portico] = 1; });
  var pend = {}; M.PR.forEach(function(r){ if(r.aut.toLowerCase().indexOf("pendiente") === 0) pend[r.portico] = 1; });
  var sem = {};
  M.PR.forEach(function(r){ var l = iso(lunes(r.fecha)); if(l > lh) return; var s = sem[l] = sem[l] || [0, 0, 0];
    if(/^ejecutado/i.test(r.estado)) s[0]++; else if(/^no ejecutado/i.test(r.estado)) s[1]++; else if(r.fecha < hoy) s[2]++; });
  var semanas = Object.keys(sem).sort().slice(-12);
  var ppcs = semanas.map(function(l){ var s = sem[l], c = s[0] + s[1]; return [l, c ? Math.round(100 * s[0] / c) : null, s]; });
  var con = ppcs.filter(function(p){ return p[1] !== null; }), ult = con.length ? con[con.length - 1] : null, prev = con.length > 1 ? con[con.length - 2] : null;
  var prom = con.length ? Math.round(con.reduce(function(a, p){ return a + p[1]; }, 0) / con.length) : null;
  var o = frame(4, "INFORME DE AVANCE · PÓRTICOS DE VIGILANCIA · INDICADORES", "Indicadores del proyecto", "corte al " + M.corte);
  var tend = (ult && prev) ? " · " + (ult[1] - prev[1] >= 0 ? "▲ +" : "▼ ") + (ult[1] - prev[1]) + " pts" : "";
  o = o.concat(kpis([[Math.round(100 * nreal / Math.max(1, total)) + " %", "avance global · " + nreal + " de " + total + " partidas"], [Object.keys(inic).length, "de " + PORT.length + " pórticos iniciados"],
    [ult ? ult[1] + " %" : "–", "PPC sem. " + (ult ? etqs(ult[0]) : "") + tend], [Object.keys(pend).length, "autorizaciones pendientes"]]));
  var y0 = 52, bh = 66, bw1 = 128;
  box(o, 16, y0, bw1, bh, "Cumplimiento del plan semanal (PPC)");
  var cx0 = 28, cx1 = 16 + bw1 - 5, cy0 = y0 + 13, cy1 = y0 + bh - 14, yy = function(v){ return cy1 - (cy1 - cy0) * v / 100; };
  [0, 20, 40, 60, 80, 100].forEach(function(v){ o.push(L(cx0, yy(v), cx1, yy(v), LINE, .2)); o.push(T(cx0 - 2, yy(v), String(v), 2.3, 400, MUTE, { anchor:"end" })); });
  if(!ppcs.length) o.push(T(cx0 + 4, y0 + 30, "Aún no hay semanas con tareas comprometidas.", 2.7, 400, MUTE));
  var n = ppcs.length, bwd = n ? (cx1 - cx0) / n : 0;
  ppcs.forEach(function(p, i){
    var w = Math.min(bwd * .62, 14), x = cx0 + i * bwd + (bwd - w) / 2, v = p[1], s = p[2];
    if(v !== null){ o.push(R(x, yy(v), w, yy(0) - yy(v), colPpc(v), { rx:.8 })); o.push(T(x + w / 2, yy(v) - 2, v + " %", 2.6, 700, NAVY, { anchor:"middle" })); o.push(T(x + w / 2, cy1 + 7.8, s[0] + " de " + (s[0] + s[1]), 2, 400, MUTE, { anchor:"middle" })); }
    else o.push(T(x + w / 2, yy(0) - 2, "s/d", 2.3, 400, MUTE, { anchor:"middle" }));
    o.push(T(x + w / 2, cy1 + 3.8, etqs(p[0]), 2.4, 500, NAVY, { anchor:"middle" }));
  });
  o.push(L(cx0, yy(80), cx1, yy(80), "#26694B", .35, "1.6 1.2")); o.push(T(cx1, yy(80) - 2, "meta 80 %", 2.2, 600, "#26694B", { anchor:"end" }));
  var sinrep = ppcs.reduce(function(a, p){ return a + p[2][2]; }, 0);
  o.push(T(20, y0 + bh - 2.3, fit("PPC = tareas ejecutadas ÷ comprometidas de la semana" + (prom !== null ? " · promedio " + prom + " %" : "") + (sinrep ? " · " + sinrep + " pendientes de reportar (no cuentan)" : ""), 2.1, 400, bw1 - 8), 2.1, 400, MUTE));
  /* Pareto */
  var px = 16 + bw1 + 5, pw = 265 - bw1 - 5; box(o, px, y0, pw, bh, "Causas de no cumplimiento (Pareto)");
  var causas = {}; (D.causas || []).forEach(function(c){ causas[c[0]] = c[1]; }); if(!Object.keys(causas).length) causas = CAUSAS0;
  var no = M.PR.filter(function(r){ return /^no ejecutado/i.test(r.estado); }), cs = cuenta(no, function(r){ return r.causa || "__"; });
  var lst = Object.keys(cs).map(function(k){ return [k, cs[k]]; }).sort(function(a, b){ return b[1] - a[1]; }), y1_ = y0 + 14;
  if(lst.length){
    var mx = lst[0][1], ac = 0;
    lst.slice(0, 6).forEach(function(q){
      var k = q[0], c = q[1]; ac += c; var t = k === "__" ? "Sin causa asignada" : (k + ". " + (causas[k] || k));
      o.push(T(px + 4, y1_, fit(t, 2.5, 500, 46), 2.5, 500, NAVY));
      var bx = px + 52, bwm = pw - 52 - 22; o.push(R(bx, y1_ - 1.3, bwm, 2.6, CHIP, { rx:.8 })); o.push(R(bx, y1_ - 1.3, bwm * c / mx, 2.6, k === "__" ? "#D6A828" : "#B23B3B", { rx:.8 }));
      o.push(T(px + pw - 14, y1_, String(c), 2.6, 700, NAVY, { anchor:"end" })); o.push(T(px + pw - 4, y1_, Math.round(100 * ac / no.length) + " %", 2.4, 400, MUTE, { anchor:"end" })); y1_ += 5;
    });
    var acc = no.filter(function(r){ return (r.accion || "").trim(); }).sort(function(a, b){ return a.fecha < b.fecha ? 1 : -1; }).slice(0, 3);
    y1_ += 1.5; o.push(T(px + 4, y1_, "Acciones correctivas recientes", 2.6, 700, NAVY)); y1_ += 4.5;
    if(acc.length) acc.forEach(function(r){ wrap(r.nombre + " · " + fdm(r.fecha) + " → " + r.accion, 2.3, 400, pw - 8, 2).forEach(function(ln){ o.push(T(px + 4, y1_, ln, 2.3, 400, NAVY)); y1_ += 3.3; }); });
    else o.push(T(px + 4, y1_, "Sin acciones correctivas registradas.", 2.3, 400, MUTE));
    o.push(T(px + 4, y0 + bh - 2.3, fit(no.length + " tareas no cumplidas · columna derecha = % acumulado · asigna la causa en el Semanal", 2.1, 400, pw - 8), 2.1, 400, MUTE));
  } else o.push(T(px + 4, y1_, "No hay tareas marcadas como «no ejecutado».", 2.7, 400, MUTE));
  /* Curva S */
  var y1 = y0 + bh + 5, ch = 62; box(o, 16, y1, 265, ch, "Curva S · partidas programadas vs. ejecutadas");
  var planK = {};
  M.PR.forEach(function(r){ if(/^no ejecutado/i.test(r.estado) || ORDEN.indexOf(r.partida) < 0) return; var k = r.portico + "|" + r.partida; if(!planK[k] || r.fecha > planK[k]) planK[k] = r.fecha; });
  var fechas = Object.keys(planK).map(function(k){ return planK[k]; }).concat(Object.keys(M.ejecAv).map(function(k){ return M.ejecAv[k]; })).sort();
  if(fechas.length){
    var l0 = lunes(fechas[0]), lN = lunes(fechas[fechas.length - 1]), lH = lunes(hoy); if(lH > lN) lN = lH;
    var ws = []; for(var l = l0; l <= lN; l = addDays(l, 7)) ws.push(l);
    var fin = function(l){ return iso(addDays(l, 6)); }, pk = Object.keys(planK).map(function(k){ return planK[k]; }), rk = Object.keys(M.ejecAv).map(function(k){ return M.ejecAv[k]; });
    var pv = ws.map(function(l){ var fi = fin(l); return pk.filter(function(v){ return v <= fi; }).length; });
    var rv = ws.map(function(l){ var fi = fin(l); return l > lH ? null : rk.filter(function(v){ return v <= fi; }).length; });
    var ymax = Math.max(1, pk.length, nreal), sx0 = 30, sx1 = 273, sy0 = y1 + 13, sy1 = y1 + ch - 12;
    var ys = function(v){ return sy1 - (sy1 - sy0) * v / ymax; }, xs = function(i){ return sx0 + (ws.length > 1 ? (sx1 - sx0) * i / (ws.length - 1) : (sx1 - sx0) / 2); };
    [0, .25, .5, .75, 1].forEach(function(fr){ var v = Math.round(ymax * fr); o.push(L(sx0, ys(v), sx1, ys(v), LINE, .2)); o.push(T(sx0 - 2, ys(v), String(v), 2.3, 400, MUTE, { anchor:"end" })); });
    var paso = Math.ceil(ws.length / 10);
    ws.forEach(function(l, i){ if(i % paso === 0 || i === ws.length - 1) o.push(T(xs(i), sy1 + 4, etqs(iso(l)), 2.3, 400, MUTE, { anchor:"middle" })); });
    var iH = -1; ws.forEach(function(l, i){ if(l.getTime() === lH.getTime()) iH = i; });
    if(iH >= 0){ o.push(L(xs(iH), sy0, xs(iH), sy1, "#B23B3B", .25, "1 1")); o.push(T(xs(iH) + 1.2, sy0 + 1.5, "hoy", 2.2, 600, "#B23B3B")); }
    o.push('<polyline points="' + pv.map(function(v, i){ return f(xs(i)) + "," + f(ys(v)); }).join(" ") + '" fill="none" stroke="#8C949E" stroke-width=".6" stroke-dasharray="2 1.2"/>');
    var rp = []; rv.forEach(function(v, i){ if(v !== null) rp.push([xs(i), ys(v)]); });
    o.push('<polyline points="' + rp.map(function(q){ return f(q[0]) + "," + f(q[1]); }).join(" ") + '" fill="none" stroke="#2C6B7E" stroke-width=".8"/>');
    rp.forEach(function(q){ o.push(circ(q[0], q[1], .9, "#2C6B7E")); });
    var lx = 281 - 4 - 70;
    o.push(L(lx, y1 + 4.6, lx + 6, y1 + 4.6, "#8C949E", .6, "2 1.2")); o.push(T(lx + 7.5, y1 + 4.6, "Programado", 2.4, 400, NAVY));
    o.push(L(lx + 32, y1 + 4.6, lx + 38, y1 + 4.6, "#2C6B7E", .8)); o.push(T(lx + 39.5, y1 + 4.6, "Ejecutado", 2.4, 400, NAVY));
    var iu = iH >= 0 ? iH : rv.length - 1, dif = (rv[iu] || 0) - pv[iu];
    o.push(T(20, y1 + ch - 2.3, "A la fecha: " + (rv[iu] || 0) + " partidas ejecutadas vs " + pv[iu] + " programadas · " + (dif >= 0 ? "al día o adelantado (+" + dif + ")" : "atraso de " + (-dif) + " partidas") + " · ejecutado = registros de avance al 100 %.", 2.1, 400, MUTE));
  } else o.push(T(20, y1 + 20, "Sin programación cargada.", 2.7, 400, MUTE));
  /* estado actual */
  var y2 = y1 + ch + 5, est = {};
  M.AV.forEach(function(a){
    if(NOTAS.indexOf(a.partida) >= 0 || ORDEN.indexOf(a.partida) < 0) return;
    var i = ORDEN.indexOf(a.partida), cur = est[a.portico];
    if(!cur || i > cur[0] || (i === cur[0] && (a.fecha + a.reg) > (cur[1] + cur[3]))) est[a.portico] = [i, a.fecha, a.avance, a.reg];
  });
  var dist = ORDEN.map(function(){ return 0; }), sin = 0;
  PORT.forEach(function(p){ var e = est[p.num]; if(e){ for(var k = 0; k <= e[0]; k++) dist[k]++; } else sin++; });
  var rows = PORT.slice().sort(function(a, b){ return cmpNat(a.nombre, b.nombre); }), nreg = cuenta(M.AV, function(a){ return a.portico; });
  var hrow = 4.45, half = Math.ceil(rows.length / 2), bh2 = 8 + 9 + 6 + half * hrow + 4 + 6;
  box(o, 16, y2, 265, bh2, "Estado actual de los pórticos (" + PORT.length + ")");
  var xx = 20, yd = y2 + 13, items = [["Sin iniciar", sin, "#C9C5B7"]].concat(ORDEN.map(function(nm, i){ return [nm, dist[i], COL[nm]]; }));
  items.forEach(function(it){ o.push(circ(xx + 1.2, yd, 1.2, it[2])); var lab = it[0] + " "; o.push(T(xx + 3.4, yd, lab, 2.5, 400, NAVY)); o.push(T(xx + 3.4 + tw(lab, 2.5), yd, String(it[1]), 2.5, 700, NAVY)); xx += 3.4 + tw(lab + it[1], 2.5, 600) + 6; });
  o.push(T(20, yd + 4.2, "Conteo acumulado: cada partida cuenta los pórticos que ya la ejecutaron, aunque hayan avanzado a la siguiente.", 2.1, 400, MUTE));
  var colw = (265 - 8 - 6) / 2, ty = yd + 9, heads = [["Pórtico", 0], ["Comuna", 17], ["Estado actual", 40], ["Detalle", 80]];
  for(var c = 0; c < 2; c++){ var bx = 20 + c * (colw + 6); o.push(R(bx, ty - 2.2, colw, 4.4, CHIP, { rx:.7 })); heads.forEach(function(h){ o.push(T(bx + 1.5 + h[1], ty, h[0], 2.1, 600, MUTE)); }); o.push(T(bx + colw - 1.5, ty, "Reg.", 2.1, 600, MUTE, { anchor:"end" })); }
  rows.forEach(function(p, i){
    var c = Math.floor(i / half), k = i % half, bx = 20 + c * (colw + 6), y = ty + 4.6 + k * hrow; if(k % 2) o.push(R(bx, y - hrow / 2, colw, hrow, "rgba(10,34,64,.03)"));
    var e = est[p.num]; o.push(T(bx + 1.5, y, p.nombre, 2.4, 700, NAVY)); o.push(T(bx + 18.5, y, fit(p.comuna, 2.3, 400, 21), 2.3, 400, NAVY));
    if(e){ var nm = ORDEN[e[0]], parc = e[2] !== "" && e[2] != null && parseFloat(e[2]) < 100;
      o.push(circ(bx + 41.1, y, 1.1, COL[nm])); o.push(T(bx + 43.2, y, fit(nm, 2.4, 500, 35), 2.4, 500, NAVY));
      o.push(T(bx + 81.5, y, parc ? "en curso " + e[2] + " % · " + fdm(e[1]) : "ejecutado " + fdm(e[1]), 2.2, 400, MUTE));
    } else { o.push('<circle cx="' + f(bx + 41.1) + '" cy="' + f(y) + '" r="1.1" fill="none" stroke="#9aa0a8" stroke-width=".3"/>'); o.push(T(bx + 43.2, y, "Sin iniciar", 2.4, 400, MUTE)); }
    o.push(T(bx + colw - 1.5, y, String(nreg[p.num] || 0), 2.3, 400, NAVY, { anchor:"end" }));
  });
  var y3 = y2 + bh2 + 5, reg = (D.restr || []).filter(function(r){ return r.estado !== "Liberada"; }), pl = Object.keys(pend).sort(function(a, b){ return a - b; });
  o.push(T(16, y3 + 2, "Restricciones: " + (reg.length ? reg.length + " abierta" + (reg.length === 1 ? "" : "s") + " en el registro compartido" : "registro compartido sin restricciones abiertas") + " · autorizaciones pendientes en programación: " + (pl.length ? pl.map(function(q){ return PN[q] ? PN[q].nombre : q; }).join(", ") : "ninguna") + ".", 2.4, 500, NAVY));
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 4 · Indicadores");
}

/* ====================== lectura del tablero semanal (DOM → SVG) ====================== */
function leerSemanal(){
  var sec = document.querySelector('section[data-board="semanal"]'); if(!sec) return null;
  var boardEl = sec.querySelector(".board"), scrollEl = sec.querySelector(".board-scroll"); if(!boardEl || !scrollEl) return null;
  var prevTab = document.body.getAttribute("data-mtab"), de = document.documentElement, tPrev = de.getAttribute("data-theme");
  var stl = document.createElement("style"); stl.textContent = "*,*::before,*::after{transition:none!important;animation:none!important}"; document.head.appendChild(stl);
  var tmp = null, out = null;
  try{
    de.setAttribute("data-theme", "light"); document.body.setAttribute("data-mtab", "semanal");
    if(boardEl.getBoundingClientRect().width < 200){
      scrollEl.setAttribute("data-exp", "1"); tmp = document.createElement("style");
      tmp.textContent = '.pizarra-block .board-scroll[data-exp="1"]{ display:block !important; position:fixed !important; left:-30000px !important; top:0 !important; width:1750px !important; height:auto !important; overflow:visible !important; padding:0 !important; visibility:visible !important; } .pizarra-block .board-scroll[data-exp="1"] .corner, .pizarra-block .board-scroll[data-exp="1"] .month-head, .pizarra-block .board-scroll[data-exp="1"] .week-head, .pizarra-block .board-scroll[data-exp="1"] .row-label{ position:static !important; left:auto !important; top:auto !important; }';
      document.head.appendChild(tmp);
    }
    if(boardEl.getBoundingClientRect().width >= 200) out = convertir(boardEl);
  }catch(e){ out = null; }
  finally{
    scrollEl.removeAttribute("data-exp"); if(tmp && tmp.parentNode) tmp.parentNode.removeChild(tmp);
    if(tPrev == null) de.removeAttribute("data-theme"); else de.setAttribute("data-theme", tPrev);
    if(prevTab == null) document.body.removeAttribute("data-mtab"); else document.body.setAttribute("data-mtab", prevTab);
    if(stl.parentNode) stl.parentNode.removeChild(stl);
  }
  return out;
}
function convertir(root){
  var stx = document.createElement("style"); stx.textContent = ".corner,.month-head,.week-head,.row-label{position:static!important;left:auto!important;top:auto!important}"; document.head.appendChild(stx);
  var Rr = root.getBoundingClientRect(), CUT = Rr.width, out = [];
  var transp = function(c){ return !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c); };
  function boxEl(el, cs, r){
    var bg = cs.backgroundColor, rad = parseFloat(cs.borderTopLeftRadius) || 0; rad = Math.min(rad, r.width / 2, r.height / 2);
    var sides = ["Top","Right","Bottom","Left"], bw = sides.map(function(s){ return parseFloat(cs["border" + s + "Width"]) || 0; }), bc = sides.map(function(s){ return cs["border" + s + "Color"]; }), bs = sides.map(function(s){ return cs["border" + s + "Style"]; });
    var x = r.left - Rr.left, y = r.top - Rr.top, w = r.width, h = r.height; if(w <= 0 || h <= 0) return;
    var has = bw.some(function(v, i){ return v > 0 && bs[i] !== "none"; }), uni = bw.every(function(v){ return v === bw[0]; }) && bc.every(function(c){ return c === bc[0]; }) && bs.every(function(s){ return s === bs[0]; });
    if(!transp(bg)) out.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + f(rad) + '" fill="' + bg + '"/>');
    var bsh = cs.boxShadow;
    if(bsh && bsh !== "none"){ bsh.split(/,(?![^(]*\))/).forEach(function(part){ var m = part.trim().match(/(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?\s*(inset)?|(inset)\s+(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/);
      if(m && m[6] === "inset" && +m[4] === 0){ var ox = +m[2], oy = +m[3]; if(ox > 0 && oy === 0) out.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + ox + '" height="' + f(h) + '" fill="' + m[1] + '"/>'); if(ox === 0 && oy > 0) out.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + oy + '" fill="' + m[1] + '"/>'); } }); }
    if(has && uni){ var sw = bw[0]; out.push('<rect x="' + f(x + sw / 2) + '" y="' + f(y + sw / 2) + '" width="' + f(w - sw) + '" height="' + f(h - sw) + '" rx="' + f(Math.max(0, rad - sw / 2)) + '" fill="none" stroke="' + bc[0] + '" stroke-width="' + sw + '"' + (bs[0] === "dashed" ? ' stroke-dasharray="' + sw * 3 + " " + sw * 2 + '"' : bs[0] === "dotted" ? ' stroke-dasharray="' + sw + " " + sw + '"' : "") + '/>'); }
    else if(has){ var Ln = function(x1, y1, x2, y2, i){ if(bw[i] > 0 && bs[i] !== "none" && !transp(bc[i])) out.push('<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + bc[i] + '" stroke-width="' + bw[i] + '"' + (bs[i] === "dashed" ? ' stroke-dasharray="' + bw[i] * 3 + " " + bw[i] * 2 + '"' : "") + '/>'); };
      Ln(x, y + bw[0] / 2, x + w, y + bw[0] / 2, 0); Ln(x + w - bw[1] / 2, y, x + w - bw[1] / 2, y + h, 1); Ln(x, y + h - bw[2] / 2, x + w, y + h - bw[2] / 2, 2); Ln(x + bw[3] / 2, y, x + bw[3] / 2, y + h, 3); }
  }
  function textNode(node, cs){
    var t = node.nodeValue; if(!t.trim()) return; var rg = document.createRange(), lines = [], cur = null;
    for(var i = 0; i < t.length; i++){
      rg.setStart(node, i); rg.setEnd(node, i + 1); var rs = rg.getClientRects(); if(!rs.length) continue; var q = rs[0];
      if(q.width === 0 && /\s/.test(t[i])){ if(cur) cur.s += " "; continue; }
      if(!cur || Math.abs(q.top - cur.top) > 3){ cur = { s:"", x:q.left, top:q.top, h:q.height }; lines.push(cur); }
      cur.s += t[i];
    }
    var tf = cs.textTransform;
    lines.forEach(function(l){ var s = l.s.replace(/\s+$/, ""); if(!s.trim()) return; s = s.replace(/^\s+/, ""); if(tf === "uppercase") s = s.toUpperCase(); else if(tf === "lowercase") s = s.toLowerCase();
      out.push('<text x="' + f(l.x - Rr.left) + '" y="' + f(l.top - Rr.top + l.h / 2) + '" dominant-baseline="central" fill="' + cs.color + '" font-family="' + esc(cs.fontFamily) + '" font-size="' + cs.fontSize + '" font-weight="' + cs.fontWeight + '"' + (cs.fontStyle !== "normal" ? ' font-style="' + cs.fontStyle + '"' : "") + (cs.letterSpacing !== "normal" ? ' letter-spacing="' + cs.letterSpacing + '"' : "") + ' xml:space="preserve">' + esc(s) + '</text>'); });
  }
  function walk(el){
    var cs = getComputedStyle(el); if(cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return;
    var r = el.getBoundingClientRect(); if(el !== root && r.left - Rr.left >= CUT - 1) return;
    boxEl(el, cs, r);
    ["::before","::after"].forEach(function(pe){ var p = getComputedStyle(el, pe);
      if(p.content && p.content !== "none" && p.content !== "normal" && p.display !== "none"){ var w = parseFloat(p.width), h = parseFloat(p.height);
        if(!transp(p.backgroundColor) && w > 0 && h > 0){ var px = r.left, py = r.top;
          if(p.position === "absolute"){ var l = parseFloat(p.left), t = parseFloat(p.top), rt = parseFloat(p.right), bt = parseFloat(p.bottom);
            px = isNaN(l) ? (isNaN(rt) ? r.left : r.right - rt - w) : r.left + l; py = isNaN(t) ? (isNaN(bt) ? r.top : r.bottom - bt - h) : r.top + t; }
          out.push('<rect x="' + f(px - Rr.left) + '" y="' + f(py - Rr.top) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + f(parseFloat(p.borderTopLeftRadius) || 0) + '" fill="' + p.backgroundColor + '"/>'); } } });
    Array.prototype.forEach.call(el.childNodes, function(c){ if(c.nodeType === 3) textNode(c, cs); else if(c.nodeType === 1 && !/^(SCRIPT|STYLE|SVG|svg)$/.test(c.tagName)) walk(c); });
  }
  walk(root); stx.parentNode.removeChild(stx);
  return { w:CUT, h:Rr.height, body:out.join("\n") };
}

/* ====================== fuente embebida + salida ====================== */
var _fontCss = null;
function b64(buf){ var b = new Uint8Array(buf), s = "", i = 0; for(; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768)); return btoa(s); }
function parseFuentes(css){
  var bloques = [], todos = [], re = /(?:\/\*\s*([a-z0-9-]+)\s*\*\/\s*)?(@font-face\s*\{[^}]*\})/g, m, sub = "";
  while((m = re.exec(css))){ if(m[1]) sub = m[1]; todos.push(m[2]); if(sub === "latin" || sub === "latin-ext") bloques.push(m[2]); }
  if(!bloques.length) bloques = todos;
  var grupos = {};
  bloques.forEach(function(b){
    var u = /url\(([^)]+)\)/.exec(b), w = /font-weight:\s*(\d+)/.exec(b), r = /unicode-range:\s*([^;]+)/.exec(b); if(!u) return;
    var url = u[1].replace(/["']/g, ""), key = url + "|" + (r ? r[1] : "");
    var g = grupos[key] = grupos[key] || { url:url, range:r ? r[1] : "", pesos:[] }; g.pesos.push(w ? +w[1] : 400);
  });
  return Object.keys(grupos).map(function(k){ return grupos[k]; });
}
function cssFuentes(grupos, datos){
  return grupos.map(function(g){
    var mn = Math.min.apply(0, g.pesos), mx = Math.max.apply(0, g.pesos);
    return "@font-face{font-family:'Inter';font-style:normal;font-weight:" + (mn === mx ? mn : mn + " " + mx) + ";src:url(" + datos[g.url] + ") format('woff2');" + (g.range ? "unicode-range:" + g.range + ";" : "") + "}";
  }).join("\n");
}
function fuenteEmbebida(){
  if(_fontCss !== null) return Promise.resolve(_fontCss);
  return fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap").then(function(r){ return r.text(); }).then(function(css){
    var grupos = parseFuentes(css), datos = {}, urls = {}; grupos.forEach(function(g){ urls[g.url] = 1; });
    return Promise.all(Object.keys(urls).map(function(u){ return fetch(u).then(function(r){ return r.arrayBuffer(); }).then(function(buf){ datos[u] = "data:font/woff2;base64," + b64(buf); }); })).then(function(){
      _fontCss = grupos.length ? cssFuentes(grupos, datos) : ""; return _fontCss;
    });
  }).catch(function(){ _fontCss = ""; return ""; });
}
function conFuente(svg, css){ return css ? svg.replace(/(<title>[\s\S]*?<\/title>)/, "$1\n<style>" + css.replace(/<\/style/g, "") + "</style>") : svg; }

function rasterizar(svg, pw, ph){
  return new Promise(function(res, rej){
    var s = svg.replace('width="297mm" height="420mm"', 'width="' + pw + '" height="' + ph + '"');
    var url = URL.createObjectURL(new Blob([s], { type:"image/svg+xml;charset=utf-8" })), im = new Image();
    im.onload = function(){ var c = document.createElement("canvas"); c.width = pw; c.height = ph; var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, pw, ph); x.drawImage(im, 0, 0, pw, ph); URL.revokeObjectURL(url);
      c.toBlob(function(b){ c.width = c.height = 1; if(!b) return rej(new Error("jpeg")); b.arrayBuffer().then(function(ab){ res(new Uint8Array(ab)); }); }, "image/jpeg", .92); };
    im.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("No se pudo dibujar la hoja")); };
    im.src = url;
  });
}
function pdfDesde(imgs, pw, ph){
  var enc = new TextEncoder(), parts = [], len = 0, offs = [];
  function put(x){ var b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; }
  function obj(n, body){ offs[n] = len; put(n + " 0 obj\n"); put(body); put("\nendobj\n"); }
  var W = 841.89, H = 1190.55, n = imgs.length; put("%PDF-1.4\n%âãÏÓ\n");
  var kids = []; for(var i = 0; i < n; i++) kids.push((3 + i * 3) + " 0 R");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>"); obj(2, "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>");
  imgs.forEach(function(jpg, i){
    var pId = 3 + i * 3, cId = pId + 1, iId = pId + 2, cont = "q " + W + " 0 0 " + H + " 0 0 cm /Im0 Do Q";
    obj(pId, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /XObject << /Im0 " + iId + " 0 R >> >> /Contents " + cId + " 0 R >>");
    obj(cId, "<< /Length " + cont.length + " >>\nstream\n" + cont + "\nendstream");
    offs[iId] = len; put(iId + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + pw + " /Height " + ph + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpg.length + " >>\nstream\n"); put(jpg); put("\nendstream\nendobj\n");
  });
  var total = 3 + n * 3, xref = len; put("xref\n0 " + total + "\n0000000000 65535 f \n");
  for(var k = 1; k < total; k++) put(String(offs[k]).padStart(10, "0") + " 00000 n \n");
  put("trailer\n<< /Size " + total + " /Root 1 0 R /Info << /Title (Informe de avance Porticos) /Producer (GeoMAV) >> >>\nstartxref\n" + xref + "\n%%EOF");
  return new Blob(parts, { type:"application/pdf" });
}
var _crc = null;
function crc32(b){ if(!_crc){ _crc = []; for(var n = 0; n < 256; n++){ var c = n; for(var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; _crc[n] = c >>> 0; } } var c2 = 0xFFFFFFFF; for(var i = 0; i < b.length; i++) c2 = _crc[(c2 ^ b[i]) & 255] ^ (c2 >>> 8); return (c2 ^ 0xFFFFFFFF) >>> 0; }
function zipDesde(files){
  var enc = new TextEncoder(), parts = [], cen = [], off = 0;
  function u16(v){ return new Uint8Array([v & 255, (v >> 8) & 255]); } function u32(v){ return new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]); }
  function cat(arr){ var t = 0; arr.forEach(function(a){ t += a.length; }); var o = new Uint8Array(t), p = 0; arr.forEach(function(a){ o.set(a, p); p += a.length; }); return o; }
  files.forEach(function(fl_){
    var nm = enc.encode(fl_.name), data = enc.encode(fl_.data), crc = crc32(data);
    var loc = cat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0), nm, data]);
    cen.push(cat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off), nm]));
    parts.push(loc); off += loc.length;
  });
  var cd = cat(cen), end = cat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cd.length), u32(off), u16(0)]);
  return new Blob(parts.concat([cd, end]), { type:"application/zip" });
}

/* ====================== orquestación y ventana ====================== */
var NOMBRES = ["Hoja1_Mapa", "Hoja2_Semanal", "Hoja3_Intermedio", "Hoja4_Indicadores"];
var _geo = null;
function cargarGeo(){
  if(_geo) return Promise.resolve(_geo);
  var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, "") : "";
  function j(n){ return fetch((window.__INFORME_BASE || base || "") + "capas/" + n + "-ohiggins.geojson").then(function(r){ if(!r.ok) throw new Error(n); return r.json(); }); }
  return Promise.all([j("comunas"), j("provincias"), j("red-vial")]).then(function(a){ _geo = { comunas:a[0], provincias:a[1], vial:a[2] }; return _geo; });
}
function cargarFuentes(){
  if(!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all([400, 500, 600, 700].map(function(w){ return document.fonts.load(w + " 20px Inter"); })).catch(function(){});
}
function generar(paso){
  var D = window.PORTICOS_DATOS ? window.PORTICOS_DATOS() : null;
  if(!D || !D.lista || !D.lista.length) return Promise.reject(new Error("Todavía no hay datos cargados de la planilla."));
  initOrden();
  paso("Cargando mapas y fuentes…");
  return Promise.all([cargarGeo(), cargarFuentes(), fuenteEmbebida()]).then(function(r){
    var G = r[0], css = r[2]; paso("Armando las hojas…");
    var M = modelo(D), hojas = [];
    hojas.push(hoja1(M, G)); var board = leerSemanal(); hojas.push(hoja2(M, board)); hojas.push(hoja3(M)); hojas.push(hoja4(M, D));
    return { hojas:hojas.map(function(s){ return conFuente(s, css); }), M:M };
  });
}
function bajar(blob, nombre){ var a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(u); }, 4000); }

function abrir(){
  var ov = document.createElement("div");
  ov.setAttribute("style", "position:fixed;inset:0;z-index:99999;background:rgba(10,34,64,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif");
  var card = document.createElement("div");
  card.setAttribute("style", "background:var(--paper-raised,#fff);color:var(--ink,#0A2240);border-radius:14px;max-width:760px;width:100%;max-height:92vh;overflow:auto;padding:18px 18px 16px;box-shadow:0 20px 60px rgba(0,0,0,.35)");
  card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3 style="margin:0;font-size:1.05rem">Resumen ejecutivo · Informe de avance</h3><button type="button" data-x style="all:unset;cursor:pointer;font-size:1.4rem;line-height:1;padding:4px 8px" aria-label="Cerrar">×</button></div>'
    + '<p data-msg style="margin:10px 0 12px;font-size:.9rem;opacity:.8">Preparando…</p><div data-prev style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px"></div><div data-acc style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px"></div>';
  ov.appendChild(card); document.body.appendChild(ov);
  var msg = card.querySelector("[data-msg]"), prev = card.querySelector("[data-prev]"), acc = card.querySelector("[data-acc]"), vivo = true;
  function cerrar(){ vivo = false; if(ov.parentNode) ov.parentNode.removeChild(ov); }
  card.querySelector("[data-x]").addEventListener("click", cerrar); ov.addEventListener("click", function(e){ if(e.target === ov) cerrar(); });
  function btn(txt, fn){ var b = document.createElement("button"); b.type = "button"; b.className = "btn-sm"; b.textContent = txt; b.addEventListener("click", function(){ fn(b); }); acc.appendChild(b); return b; }
  generar(function(t){ if(vivo) msg.textContent = t; }).then(function(R_){
    if(!vivo) return; var hojas = R_.hojas, M = R_.M, fecha = M.hoy;
    msg.textContent = "Listo: 4 hojas A3 vertical (mapa · semanal · intermedio · indicadores), con los datos de hoy.";
    hojas.forEach(function(s, i){ var im = document.createElement("img"); im.alt = "Hoja " + (i + 1); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); im.setAttribute("style", "width:100%;border:1px solid var(--line,#D8D5CB);border-radius:6px;background:#fff"); prev.appendChild(im); });
    btn("Descargar PDF (4 hojas, 300 ppp)", function(b){
      var t0 = b.textContent; b.disabled = true; b.textContent = "Generando PDF…";
      var pw = Math.round(297 / 25.4 * 300), ph = Math.round(420 / 25.4 * 300), K = 1;
      if(pw * ph > 16000000){ K = Math.sqrt(16000000 / (pw * ph)); pw = Math.round(pw * K); ph = Math.round(ph * K); }
      var imgs = [], seq = Promise.resolve();
      hojas.forEach(function(s, i){ seq = seq.then(function(){ b.textContent = "Hoja " + (i + 1) + " de 4…"; return rasterizar(s, pw, ph); }).then(function(j){ imgs.push(j); }); });
      seq.then(function(){ bajar(pdfDesde(imgs, pw, ph), "Porticos_Informe_Avance_" + fecha + ".pdf"); b.textContent = t0; b.disabled = false; })
        .catch(function(e){ b.textContent = t0; b.disabled = false; msg.textContent = "No se pudo generar el PDF: " + (e && e.message ? e.message : e); });
    });
    btn("Descargar SVG (4 hojas, .zip)", function(){ bajar(zipDesde(hojas.map(function(s, i){ return { name:"Porticos_Informe_" + NOMBRES[i] + ".svg", data:s }; })), "Porticos_Informe_SVG_" + fecha + ".zip"); });
    btn("Cerrar", cerrar);
  }).catch(function(e){ if(vivo) msg.textContent = "No se pudo armar el informe: " + (e && e.message ? e.message : e); });
}
window.PORTICOS_INFORME = { abrir:abrir, generar:generar, _t:{ parseFuentes:parseFuentes, cssFuentes:cssFuentes, modelo:modelo, hoja1:hoja1, hoja2:hoja2, hoja3:hoja3, hoja4:hoja4, initOrden:initOrden } };
})();
