/* Informe de avance · Pórticos (Resumen ejecutivo)
   8 hojas A3 vertical (297 x 420 mm): 1 mapa · 2 trazados · 3 semana presente · 4 semana anterior y siguiente · 5 intermedio · 6 restricciones · 7 indicadores · 8 estado de los pórticos.
   Se genera en el navegador con los datos vivos de la app; salida PDF (300 ppp) y SVG (zip). */
(function(){
"use strict";
var NAVY = "#0A2240", MUTE = "rgba(10,34,64,.65)", LINE = "#D8D5CB", CHIP = "#EDEBE4";
var FUENTE = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
var TONOS = { copper:"#D49A6A", neutral:"#8C949E", blueprint:"#2C6B7E", amber:"#D6A828", success:"#26694B", violet:"#7A52AA", sky:"#3F8FC4", rose:"#C0508A", danger:"#B23B3B" };
var TONE0 = { "Trazado":"sky", "Excavación":"copper", "Emplantillado":"neutral", "Inst. de Fundación":"blueprint", "Inst. Malla":"amber", "Relleno":"success", "Inst. Pórtico":"violet", "Inst. Poste V":"violet", "Inst. Brazo H":"rose", "Inst. Cámara":"danger" };
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
  if(pt && Object.keys(pt).length){ ORDEN = window.PARTIDAS_ORDEN ? window.PARTIDAS_ORDEN() : Object.keys(pt); }
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
var TOTAL = 8;
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
  M.COND = D.cond || {}; M.CONDS = (window.PORTICOS_CONDS || []).slice();
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
  M.CAUSAS = {}; (D.causas || []).forEach(function(c){ M.CAUSAS[c[0]] = c[1]; }); if(!Object.keys(M.CAUSAS).length) M.CAUSAS = CAUSAS0;
  M.corte = fdmy(D.hoy);
  return M;
}

/* ====================== HOJA 1 · MAPA ====================== */
function merc(lat, lng){ return [lng * Math.PI / 180, Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))]; }
function hoja1(M, G){
  var PORT = M.PORT, PN = M.PN, TR = M.TRAZ, NIV = M.NIV;
  var o = frame(1, "INFORME DE AVANCE · PÓRTICOS DE VIGILANCIA · REGIÓN DE O'HIGGINS", "Mapa de situación · pórticos trazados", "corte al " + M.corte);
  var comT = {}; TR.forEach(function(n){ comT[PN[n].comuna] = 1; });
  var post = TR.filter(function(n){ return NIV[n] >= 1; });
  var lun = lunes(M.hoy), SEMS = [["Semana anterior", -7, "#8C949E", null, 2.5], ["Semana presente", 0, NAVY, null, 3.2], ["Semana siguiente", 7, "#B23B3B", "0.9 0.6", 3.9]].map(function(q){
    var a = addDays(lun, q[1]), A = iso(a), B = iso(addDays(a, 6)), rs = M.PR.filter(function(r){ return r.fecha >= A && r.fecha <= B && ORDEN.indexOf(r.partida) >= 0; }), pp = {}; rs.forEach(function(r){ pp[r.portico] = 1; });
    return { nombre:q[0], a:a, rs:rs, col:q[2], dash:q[3], rad:q[4], ports:Object.keys(pp) };
  });
  o = o.concat(kpis([[TR.length, "de " + PORT.length + " pórticos trazados"], [post.length, "con partidas posteriores"], [Object.keys(comT).length, "comunas intervenidas"], [Object.keys(M.ejec).length, "partidas ejecutadas"]]));
  var pts = TR.map(function(n){ return PN[n]; }).filter(function(p){ return p.lat != null; });
  if(!pts.length) pts = PORT.filter(function(p){ return p.lat != null; });
  var la0 = Math.min.apply(0, pts.map(function(p){ return p.lat; })), la1 = Math.max.apply(0, pts.map(function(p){ return p.lat; }));
  var lo0 = Math.min.apply(0, pts.map(function(p){ return p.lng; })), lo1 = Math.max.apply(0, pts.map(function(p){ return p.lng; }));
  var MX = 16, MY = 52, MW = 265, MH = 168, MH0 = 198;
  var a0 = merc(la0, lo0), a1 = merc(la1, lo1), cx = (a0[0] + a1[0]) / 2, cy = (a0[1] + a1[1]) / 2, spanx = a1[0] - a0[0], spany = a1[1] - a0[1];
  var k = Math.max(spanx / (MW * .86), spany / (MH * .84), 1e-7), wx0 = cx - k * MW / 2, wy1 = cy + k * MH0 / 2;
  function P(lat, lng){ var m = merc(lat, lng); return [MX + (m[0] - wx0) / k, MY + (wy1 - m[1]) / k]; }
  function inv(px, py){ var x = wx0 + (px - MX) * k, y = wy1 - (py - MY) * k; return [(2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI, x * 180 / Math.PI]; }
  var laC = inv(MX + MW / 2, MY + MH0 / 2)[0] * Math.PI / 180, mmPerM = 1 / (k * 6378137 * Math.cos(laC));
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
  SEMS.forEach(function(sm){ sm.ports.slice().sort(cmpNat).forEach(function(n){ var p = PN[n]; if(!p || p.lat == null) return; var q = P(p.lat, p.lng);
    if(MX < q[0] && q[0] < MX + MW && MY < q[1] && q[1] < MY + MH) g.push('<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + sm.rad + '" fill="none" stroke="' + sm.col + '" stroke-width=".45"' + (sm.dash ? ' stroke-dasharray="' + sm.dash + '"' : "") + '/>'); }); });
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
  var ly2 = ly + 5.4, px2 = 16;
  o.push(T(px2, ly2, "Anillos · pórticos con programación", 3, 700, NAVY)); px2 += tw("Anillos · pórticos con programación", 3, 700) + 6;
  SEMS.forEach(function(sm){
    o.push('<circle cx="' + f(px2 + 2.5) + '" cy="' + f(ly2) + '" r="' + sm.rad + '" fill="none" stroke="' + sm.col + '" stroke-width=".45"' + (sm.dash ? ' stroke-dasharray="' + sm.dash + '"' : "") + '/>');
    var lab = sm.nombre.toLowerCase() + " (" + sm.ports.length + ")"; o.push(T(px2 + 7, ly2, lab, 3, 400, NAVY)); px2 += 7 + tw(lab, 3) + 7;
  });
  ly += 5.4;
  var nsc = PORT.filter(function(p){ return p.lat == null; }).map(function(p){ return p.nombre; });
  var nota = "Estado = última partida ejecutada, según programación y registros de avance. Mapa vectorial (comunas, provincias y red vial de los archivos del proyecto)."; if(nsc.length) nota += " Sin coordenadas: " + nsc.join(", ") + ".";
  var notaL = wrap(nota, 2.4, 400, 265);
  notaL.forEach(function(ln, i){ o.push(T(16, ly + 5.2 + i * 3.1, ln, 2.4, 400, MUTE)); });
  /* programación por semana (anterior · presente · siguiente) */
  var by = ly + 5.2 + notaL.length * 3.1 + 3;
  o.push(T(16, by, "Programación por semana", 3.4, 700, NAVY)); o.push(L(16, by + 2.6, 281, by + 2.6, NAVY, .3));
  var cw3 = (265 - 2 * 3.1) / 3, ytop = by + 6.2, hmax = 0;
  SEMS.forEach(function(sm, ci){
    var bx = 16 + ci * (cw3 + 3.1), yy = ytop, rs = sm.rs;
    var ne = rs.filter(function(r){ return /^ejecutado/i.test(r.estado); }).length, nn = rs.filter(function(r){ return /^no ejecutado/i.test(r.estado); }).length, npg = rs.length - ne - nn;
    o.push(R(bx, yy - 2.6, cw3, 9.4, CHIP, { rx:.8 })); o.push('<rect x="' + f(bx) + '" y="' + f(yy - 2.6) + '" width="1.1" height="9.4" fill="' + sm.col + '"/>');
    var fri = addDays(sm.a, 4), rango = sm.a.getUTCMonth() === fri.getUTCMonth() ? sm.a.getUTCDate() + "–" + fri.getUTCDate() + " " + MES3[sm.a.getUTCMonth()] : sm.a.getUTCDate() + " " + MES3[sm.a.getUTCMonth()] + " – " + fri.getUTCDate() + " " + MES3[fri.getUTCMonth()];
    o.push(T(bx + 3, yy, sm.nombre, 2.9, 700, NAVY)); o.push(T(bx + cw3 - 2, yy, rango, 2.5, 500, MUTE, { anchor:"end" }));
    var resumen = rs.length + " tareas · " + sm.ports.length + " pórticos · " + ne + " ejecutadas" + (nn ? " · " + nn + " no ejecutadas" : "") + (npg ? " · " + npg + " programadas" : "");
    o.push(T(bx + 3, yy + 4, fit(resumen, 2.3, 400, cw3 - 5), 2.3, 400, MUTE));
    yy += 9;
    ORDEN.forEach(function(p_){
      var seen = {}; rs.forEach(function(r){ if(r.partida === p_) seen[r.portico] = 1; });
      var nm = function(n){ return PN[n] ? PN[n].nombre : n; }, ps = Object.keys(seen).sort(function(a, b){ return cmpNat(nm(a), nm(b)); });
      if(!ps.length) return;
      var nms = ps.map(nm).join(", ");
      o.push(circ(bx + 2.2, yy, 1.05, COL[p_])); o.push(T(bx + 4.6, yy, p_ + " " + ps.length, 2.5, 700, NAVY));
      var ls = wrap(nms, 2.35, 400, cw3 - 6);
      ls.forEach(function(ln, li){ o.push(T(bx + 4.6, yy + 3.1 + li * 2.9, ln, 2.35, 400, NAVY)); });
      yy += 3.1 + ls.length * 2.9 + 1.2;
    });
    hmax = Math.max(hmax, yy - ytop);
  });
  var ty = ytop + hmax + 6; o.push(T(16, ty, "Resumen por comuna", 3.4, 700, NAVY)); o.push(L(16, ty + 2.6, 281, ty + 2.6, NAVY, .3));
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
    cols.forEach(function(c){ o.push(T(bx + 2 + c[1], y0, c[0], 2.6, 600, MUTE, { anchor:c[2] })); });
    chunk.forEach(function(r, i){
      var y2 = y0 + 5.2 + i * 5.6; if(i % 2) o.push(R(bx, y2 - 2.4, wdt, 5.6, "rgba(10,34,64,.03)"));
      o.push(T(bx + 2, y2, r[0], 3, 600, NAVY)); o.push(T(bx + 35, y2, String(r[1]), 3, 400, NAVY, { anchor:"end" }));
      o.push(T(bx + 54, y2, String(r[2]), 3, r[2] ? 700 : 400, r[2] ? NAVY : MUTE, { anchor:"end" })); o.push(T(bx + 84, y2, String(r[3]), 3, 400, r[3] ? NAVY : MUTE, { anchor:"end" }));
      if(r[4] !== "—"){ o.push(circ(bx + 88.2, y2, 1.1, COL[r[4]])); o.push(T(bx + 90.6, y2, r[4], 2.6, 400, NAVY)); } else o.push(T(bx + 88, y2, "—", 3, 400, MUTE));
    });
  });
  var yt = ty + 6.4 + 5.2 + half * 5.6 + 1; o.push(L(16, yt - 2.4, 281, yt - 2.4, NAVY, .25));
  o.push(T(18, yt + .6, "Total región: " + PORT.length + " pórticos · " + TR.length + " trazados (" + Math.round(100 * TR.length / Math.max(1, PORT.length)) + " %) · " + post.length + " con partidas posteriores", 2.8, 700, NAVY));
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 1 · Mapa de pórticos trazados");
}

/* ====================== tablas comunes ====================== */
function tabla(o, x, y, w, titulo, cols, rows, vacio, rowh, fs){
  rowh = rowh || 5.6; fs = fs || 1.25;
  o.push(T(x, y, titulo, 3.6, 700, NAVY)); o.push(L(x, y + 2.7, x + w, y + 2.7, NAVY, .3));
  var tot = cols.reduce(function(a, c){ return a + c[1]; }, 0), xs = [], acc = 0;
  cols.forEach(function(c){ xs.push(x + 2 + acc * (w - 4) / tot); acc += c[1]; });
  var yy = y + 7; o.push(R(x, yy - 2.7, w, 5.4, CHIP, { rx:.8 }));
  cols.forEach(function(c, j){ o.push(T(xs[j], yy, c[0], 2.4 * fs / 1.1, 600, MUTE)); });
  if(!rows.length){ o.push(T(x + 2, yy + 6, vacio, 2.9, 400, MUTE)); return yy + 10; }
  rows.forEach(function(r, i){
    var y2 = yy + 5.8 + i * rowh; if(i % 2) o.push(R(x, y2 - rowh / 2, w, rowh, "rgba(10,34,64,.03)"));
    cols.forEach(function(c, j){ var cw = (w - 4) * c[1] / tot - 1.5, sz = 2.45 * fs, wt = j === 0 ? 700 : 400; o.push(T(xs[j], y2, fit(String(r[j]), sz, wt, cw), sz, wt, NAVY)); });
  });
  return yy + 5.8 + rows.length * rowh;
}
function leyendaPartidas(o, rows){
  var ly = 52.2; o.push(T(16, ly, "Por partida:", 3, 600, NAVY)); var px = 16 + tw("Por partida:", 3, 600) + 4;
  var cp = cuenta(rows, function(r){ return r.partida; }), vis = ORDEN.filter(function(p){ return cp[p]; });
  var need = vis.reduce(function(a, p){ return a + 4.4 + tw(p + " " + cp[p], 3) + 6; }, 0), disp = 281 - px, sz = 3, gap = 6;
  if(need > disp){ sz = Math.max(2.2, 3 * disp / need * .97); gap = 4; }
  vis.forEach(function(p){ o.push(R(px, ly - 1.5, 3, 3, COL[p], { rx:.6 })); var lab = p + " " + cp[p]; o.push(T(px + 4.4, ly, lab, sz, 400, NAVY)); px += 4.4 + tw(lab, sz) + gap; });
}
function diaTxt(s){ var d = pd(s); return DIAS[wd(d)] + " " + d.getUTCDate(); }
function esEj(r){ return /^ejecutado/i.test(r.estado); }
function esNo(r){ return /^no ejecutado/i.test(r.estado); }
function cmpFP(a, b){ return (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0) || cmpNat(a.portico, b.portico) || cmpNat(a.partida, b.partida); }
function rangoSem(d0){ var d1 = addDays(d0, 4); return (d0.getUTCMonth() === d1.getUTCMonth() ? d0.getUTCDate() : fl(d0)) + " al " + fl(d1); }
function tituloSemana(pref, d0){ return pref + " · " + rangoSem(d0); }
function causaTxt(M, c){ return c ? c + ". " + (M.CAUSAS[c] || c) : "sin causa registrada"; }

/* ====================== HOJA 2 · PÓRTICOS TRAZADOS (matriz por partida) ====================== */
function hoja2(M){
  var PN = M.PN, TR = M.TRAZ, NIV = M.NIV, PORT = M.PORT;
  var o = frame(2, "INFORME DE AVANCE · PÓRTICOS DE VIGILANCIA · DETALLE", "Pórticos trazados · avance por partida", "corte al " + M.corte);
  var post = TR.filter(function(n){ return NIV[n] >= 1; }), com = {}; TR.forEach(function(n){ com[PN[n].comuna] = 1; });
  o = o.concat(kpis([[TR.length, "pórticos trazados de " + PORT.length], [post.length, "con partidas posteriores"], [Object.keys(com).length, "comunas"], [Object.keys(M.ejec).length, "partidas ejecutadas"]]));
  var x0 = 16, W = 265, y = 54, CW = 26.6;
  o.push(R(x0, y, W, 11, CHIP, { rx:.8 }));
  o.push(T(x0 + 2, y + 5.5, "Pórtico", 3.2, 700, MUTE)); o.push(T(x0 + 22, y + 5.5, "Comuna", 3.2, 700, MUTE));
  ORDEN.forEach(function(p, i){ var cx = x0 + 52 + i * CW; o.push(circ(cx + 1.6, y + 5.5, 1.3, COL[p])); var hs = Math.max(2.4, Math.min(3, 3 * (CW - 4) / tw(p, 3, 700))); o.push(T(cx + 3.8, y + 5.5, fit(p, hs, 700, CW - 4), hs, 700, NAVY)); });
  var lst = TR.slice().sort(function(a, b){ return PN[a].comuna.localeCompare(PN[b].comuna, "es") || cmpNat(PN[a].nombre, PN[b].nombre); });
  var ng = Object.keys(com).length, avail = 399 - (y + 11), rhG = lst.length ? (avail - ng * 10.9) / lst.length : 8, agrup = rhG >= 6.2;
  var rh = Math.min(8, agrup ? rhG : (lst.length ? avail / lst.length : 8)), k = Math.min(1, rh / 7.2), prev = null, yy = y + 11 + (agrup ? 0 : rh / 2);
  if(!lst.length) o.push(T(x0 + 2, yy + 6, "Aún no hay pórticos trazados.", 3, 400, MUTE));
  lst.forEach(function(n, i){
    var c = PN[n].comuna;
    if(c !== prev){
      if(agrup){ yy += 1.5; o.push(T(x0 + 2, yy + 3.4, c + " · " + lst.filter(function(q){ return PN[q].comuna === c; }).length, 3.5, 700, NAVY)); o.push(L(x0, yy + 6.2, x0 + W, yy + 6.2, NAVY, .25)); yy += 9.4; }
      else if(prev !== null) o.push(L(x0, yy - rh / 2, x0 + W, yy - rh / 2, NAVY, .2));
      prev = c;
    }
    if(i % 2) o.push(R(x0, yy - rh / 2, W, rh, "rgba(10,34,64,.03)"));
    o.push(T(x0 + 2, yy, PN[n].nombre, 3.5 * k, 700, NAVY)); o.push(T(x0 + 22, yy, fit(c, 3.3 * k, 400, 28), 3.3 * k, 400, NAVY));
    ORDEN.forEach(function(p, j){
      var cx = x0 + 52 + j * CW, fe = M.ejec[n + "|" + p];
      if(fe){ o.push(circ(cx + 1.6, yy, 1.2 * Math.max(.7, k), COL[p])); o.push(T(cx + 3.8, yy, fdm(fe), 3.3 * k, 400, NAVY)); } else o.push(T(cx + 3.8, yy, "—", 3.3 * k, 400, "rgba(10,34,64,.3)"));
    });
    yy += rh;
  });
  o.push(T(16, yy + (agrup ? 3 : 4), "Fecha = primer día de ejecución registrado de cada partida (programación y registros de avance). Orden: comuna y número de pórtico.", 2.6, 400, MUTE));
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 2 · Pórticos trazados");
}

/* ====================== HOJA 3 · SEMANA PRESENTE ====================== */
function hoja3(M, board){
  var d0 = lunes(M.hoy), d1 = addDays(d0, 4), INI = iso(d0), FIN = iso(d1);
  var rows = M.PR.filter(function(r){ return r.fecha >= INI && r.fecha <= FIN; });
  var titulo = "Semana presente · del " + rangoSem(d0) + " de " + d1.getUTCFullYear();
  var o = frame(3, "PROGRAMACIÓN DE PÓRTICOS DE VIGILANCIA · INFORME SEMANAL", titulo, "corte al " + M.corte);
  var ejc = rows.filter(esEj).length, noe = rows.filter(esNo).length, pts = {}; rows.forEach(function(r){ pts[r.portico] = 1; });
  o = o.concat(kpis([[rows.length, "tareas en la semana"], [ejc, "ejecutadas"], [noe, "no ejecutadas / reprogramadas"], [Object.keys(pts).length, "pórticos"]]));
  leyendaPartidas(o, rows);
  var y0 = 58, yb = y0 + 10;
  if(board){ var sc = Math.min(265 / board.w, 218 / board.h), W = board.w * sc; o.push('<g transform="translate(' + f(16 + (265 - W) / 2) + ' ' + f(y0) + ') scale(' + sc.toFixed(6) + ')">' + board.body + '</g>'); yb = y0 + board.h * sc; }
  else o.push(T(16, y0 + 6, "No se pudo leer el tablero semanal.", 3, 400, MUTE));
  var y = yb + 8;
  var ap = rows.filter(function(r){ return r.restr || esNo(r) || r.aut.toLowerCase().indexOf("pendiente") === 0; }).sort(cmpFP);
  var r1 = ap.map(function(r){ return [r.nombre, etq(r.comuna), r.partida, diaTxt(r.fecha), r.restr || "—", (esNo(r) ? "No ejecutado · " : "") + (r.obs || "—")]; });
  var k = Math.max(1, Math.floor((404 - y - 16) / 6.4));
  tabla(o, 16, y, 265, "Restricciones y tareas reprogramadas de la semana (" + r1.length + ")" + (r1.length <= k ? "" : " · se muestran " + k),
    [["Pórtico", 9], ["Comuna", 9], ["Partida", 14], ["Día", 8], ["Restricción", 13], ["Detalle", 40]], r1.slice(0, k), "Sin restricciones ni reprogramaciones.", 6.4, 1.35);
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 5 · " + titulo);
}

/* ====================== HOJA 4 · SEMANA ANTERIOR Y SIGUIENTE ====================== */
function tablero(o, y, titulo, d0, rows, hecho, kk){
  kk = kk || 1;
  var x = 16, w = 265, lw = 34, cw = (w - lw) / 5, FSZ = 3.3 * kk, CH = 5.4 * kk, PIT = 6.3 * kk, MINH = 9 * kk;
  var ej = rows.filter(esEj).length, ne = rows.filter(esNo).length;
  var sub = hecho ? rows.length + " tareas · " + ej + " ejecutadas · " + ne + " no ejecutadas · PPC " + (ej + ne ? Math.round(100 * ej / (ej + ne)) : 0) + " %" : rows.length + " tareas programadas";
  o.push(T(x, y, titulo, 4.4, 700, NAVY)); o.push(T(x + w, y, sub, 3.2, 400, MUTE, { anchor:"end" })); o.push(L(x, y + 3.3, x + w, y + 3.3, NAVY, .3));
  var yy = y + 7; o.push(R(x, yy, w, 7, CHIP, { rx:.8 }));
  var dias = [0, 1, 2, 3, 4].map(function(i){ return addDays(d0, i); });
  dias.forEach(function(d, i){
    var n = rows.filter(function(r){ return r.fecha === iso(d); }).length;
    o.push(T(x + lw + i * cw + 2, yy + 3.6, DIAS[i] + " " + d.getUTCDate(), 3.5, 700, NAVY));
    if(n) o.push(T(x + lw + (i + 1) * cw - 2, yy + 3.6, String(n), 3.1, 600, MUTE, { anchor:"end" }));
  });
  yy += 8; var top = yy;
  var partes = ORDEN.filter(function(p){ return rows.some(function(r){ return r.partida === p; }); });
  if(!partes.length){ o.push(T(x + 2, yy + 4, "Sin tareas programadas.", 3.2, 400, MUTE)); yy += 9; }
  partes.forEach(function(p){
    var celdas = [], nl = 1;
    dias.forEach(function(d){
      var cs = rows.filter(function(r){ return r.fecha === iso(d) && r.partida === p; }).sort(function(a, b){ return cmpNat(a.nombre, b.nombre); });
      var chs = [], ln = 0, cx = 0;
      cs.forEach(function(r){
        var mk = (hecho && (esEj(r) || esNo(r))) ? 3 * kk : 0, lab = fit(r.nombre, FSZ, 600, cw - 4 - mk), wc = tw(lab, FSZ, 600) + 2.6 + mk;
        if(cx && cx + wc > cw - 2.4){ ln++; cx = 0; }
        chs.push([ln, cx, r, lab, wc]); cx += wc + .9;
      });
      celdas.push(chs); nl = Math.max(nl, cs.length ? ln + 1 : 1);
    });
    var rh = Math.max(nl * PIT + 1.8, MINH);
    o.push(R(x, yy, lw, rh, mix(COL[p], .16))); o.push(R(x, yy, 1, rh, COL[p]));
    wrap(p, 3.1, 700, lw - 4, 2).forEach(function(l_, j){ o.push(T(x + 2.8, yy + 3.4 + j * 3.7, l_, 3.1, 700, NAVY)); });
    celdas.forEach(function(chs, i){
      chs.forEach(function(q){
        var r = q[2], xx = x + lw + i * cw + 1.2 + q[1], cy = yy + .8 + q[0] * PIT;
        var est = hecho ? (esEj(r) ? "#26694B" : esNo(r) ? "#B23B3B" : COL[p]) : COL[p];
        o.push(R(xx, cy, q[4], CH, mix(est, .22), { rx:.9 })); o.push(T(xx + 1.5, cy + CH / 2 + .05, q[3], FSZ, 600, NAVY));
        if(hecho && esEj(r)) o.push(tick(xx + q[4] - 3.3 * kk, cy + CH / 2, 1.8 * kk)); else if(hecho && esNo(r)) o.push(cross(xx + q[4] - 3.3 * kk, cy + CH / 2, 1.4 * kk));
      });
    });
    o.push(L(x, yy + rh, x + w, yy + rh, LINE, .2)); yy += rh;
  });
  for(var i = 0; i < 6; i++) o.push(L(x + lw + i * cw, top, x + lw + i * cw, yy, LINE, .2));
  return yy;
}
function hoja4(M){
  var d0 = lunes(M.hoy), p0 = addDays(d0, -7), n0 = addDays(d0, 7);
  var g = function(a){ var A = iso(a), B = iso(addDays(a, 4)); return M.PR.filter(function(r){ return r.fecha >= A && r.fecha <= B; }); };
  var prv = g(p0), nxt = g(n0);
  var o = frame(4, "PROGRAMACIÓN DE PÓRTICOS DE VIGILANCIA · INFORME SEMANAL", "Semana anterior y semana siguiente", "corte al " + M.corte);
  var ej = prv.filter(esEj).length, ne = prv.filter(esNo).length;
  o = o.concat(kpis([[prv.length, "tareas semana anterior"], [ej, "ejecutadas (" + (prv.length ? Math.round(100 * ej / prv.length) : 0) + " %)"], [ne, "no ejecutadas"], [nxt.length, "programadas semana siguiente"]]));
  var nos = prv.filter(esNo).sort(cmpFP);
  var rowsNo = nos.map(function(r){ return [r.nombre, r.partida, diaTxt(r.fecha), causaTxt(M, r.causa), [r.obs, r.accion ? "→ " + r.accion : ""].filter(Boolean).join(" ") || "—"]; });
  function dibujar(oo, kk){
    var y = tablero(oo, 56, tituloSemana("Semana anterior", p0), p0, prv, true, kk) + 3;
    if(nos.length) y = tabla(oo, 16, y + 4, 265, "No ejecutadas · por qué (" + nos.length + ")" + (nos.length > 6 ? " · se muestran 6" : ""), [["Pórtico", 9], ["Partida", 16], ["Día", 9], ["Causa", 26], ["Observación / acción", 40]], rowsNo.slice(0, 6), "", 6.6, 1.4);
    else { oo.push(T(16, y + 6, "Sin tareas no ejecutadas en la semana anterior.", 3, 600, "#26694B")); y += 8; }
    return tablero(oo, y + 8, tituloSemana("Semana siguiente", n0), n0, nxt, false, kk);
  }
  var kk = 1, fin = dibujar([], kk);
  while(fin > 402 && kk > .6){ kk -= .05; fin = dibujar([], kk); }
  dibujar(o, kk);
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 4 · Semana anterior y siguiente");
}

/* ====================== HOJA 5 · INTERMEDIO ====================== */
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
function hoja5(M){
  var INI = iso(lunes(M.hoy)), rows = M.PR.filter(function(r){ return r.fecha >= INI; });
  var wk = {}; rows.forEach(function(r){ wk[iso(lunes(r.fecha))] = 1; });
  var semanas = Object.keys(wk).sort(), last = rows.reduce(function(m, r){ return r.fecha > m ? r.fecha : m; }, INI);
  var dl = pd(last), titulo = "Programación intermedia · del " + fl(pd(INI)) + " al " + fl(dl) + " de " + dl.getUTCFullYear();
  var o = frame(5, "PROGRAMACIÓN DE PÓRTICOS DE VIGILANCIA · INFORME INTERMEDIO", titulo, "corte al " + M.corte, " · se omiten las semanas posteriores sin programación");
  var pts = {}, cms = {}, nrest = 0; rows.forEach(function(r){ pts[r.portico] = 1; cms[r.comuna] = 1; if(r.restr) nrest++; });
  o = o.concat(kpis([[rows.length, "actividades programadas"], [nrest, "con restricción abierta"], [Object.keys(pts).length, "pórticos"], [Object.keys(cms).length, "comunas"]]));
  leyendaPartidas(o, rows);
  if(!semanas.length){ o.push(T(16, 70, "No hay actividades programadas desde esta semana.", 3.2, 400, MUTE)); return svgDoc(o, "Pórticos · Informe de avance · Hoja 5 · " + titulo); }
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
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 5 · " + titulo);
}

/* ====================== HOJA 6 · RESTRICCIONES Y AUTORIZACIONES ====================== */
function hoja6(M){
  var o = frame(6, "PROGRAMACIÓN DE PÓRTICOS DE VIGILANCIA · RESTRICCIONES", "Restricciones y autorizaciones", "corte al " + M.corte);
  var rest = M.PR.filter(function(r){ return r.restr; }), lib = M.PR.filter(function(r){ return r.aut.toLowerCase().indexOf("liberada") === 0; }), pend = M.PR.filter(function(r){ return r.aut.toLowerCase().indexOf("pendiente") === 0; });
  var inv = {}; rest.concat(lib).forEach(function(r){ inv[r.portico] = 1; });
  o = o.concat(kpis([[rest.length, "restricciones registradas"], [lib.length, "autorizaciones liberadas"], [pend.length, "autorizaciones pendientes"], [Object.keys(inv).length, "pórticos involucrados"]]));
  var org = cuenta(lib, function(r){ return r.aut.replace(/^Liberada [\d-]+ · /i, ""); }), ks = Object.keys(org).sort(function(a, b){ return org[b] - org[a]; });
  var y = 54; o.push(T(16, y, "Por organismo:", 3, 600, NAVY)); var px = 16 + tw("Por organismo:", 3, 600) + 4;
  ks.forEach(function(k){ var lab = k + " " + org[k]; o.push(R(px, y - 1.5, 3, 3, "#2C6B7E", { rx:.6 })); o.push(T(px + 4.4, y, fit(lab, 3, 400, 281 - px - 4.4), 3, 400, NAVY)); px += 4.4 + tw(lab, 3) + 6; });
  var RH = 6.8, maxTot = Math.max(6, Math.floor((404 - 62 - 2 * 14 - 9) / RH));
  var rr = rest.slice().sort(function(a, b){ return (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0) || cmpNat(b.portico, a.portico); });
  var k1 = rr.length + lib.length <= maxTot ? rr.length : Math.min(rr.length, Math.max(3, maxTot - 3));
  var r1 = rr.map(function(r){ return [r.nombre, etq(r.comuna), r.partida, fdmy(r.fecha), r.restr, r.estado, r.obs || "—"]; });
  y = tabla(o, 16, 62, 265, "Restricciones (" + r1.length + ")" + (k1 < r1.length ? " · se muestran " + k1 : ""), [["Pórtico", 9], ["Comuna", 9], ["Partida", 14], ["Fecha", 11], ["Tipo", 13], ["Estado", 11], ["Detalle", 32]], r1.slice(0, k1), "Sin restricciones.", RH, 1.45);
  var ll = lib.slice().sort(function(a, b){ return (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0) || cmpNat(a.portico, b.portico); });
  var r2 = ll.map(function(r){ return [r.nombre, etq(r.comuna), r.partida, fdmy(r.fecha), r.aut.replace(/^Liberada\s+/i, "").split(" · ")[0], r.aut.replace(/^.* · /, "")]; });
  var k2 = Math.max(3, Math.floor((404 - y - 9 - 14) / RH));
  tabla(o, 16, y + 9, 265, "Autorizaciones liberadas (" + r2.length + ")" + (r2.length <= k2 ? "" : " · se muestran " + k2), [["Pórtico", 9], ["Comuna", 9], ["Partida", 14], ["Programada", 11], ["Liberada el", 12], ["Organismo", 40]], r2.slice(0, k2), "Sin autorizaciones liberadas.", RH, 1.45);
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 6 · Restricciones y autorizaciones");
}

/* ====================== estado actual de cada pórtico ====================== */
function estadoPortico(M){
  var est = {};
  M.AV.forEach(function(a){
    if(NOTAS.indexOf(a.partida) >= 0 || ORDEN.indexOf(a.partida) < 0) return;
    var i = ORDEN.indexOf(a.partida), cur = est[a.portico];
    if(!cur || i > cur[0] || (i === cur[0] && (a.fecha + a.reg) > (cur[1] + cur[3]))) est[a.portico] = [i, a.fecha, a.avance, a.reg];
  });
  var dist = ORDEN.map(function(){ return 0; }), sin = 0;
  M.PORT.forEach(function(p){ var e = est[p.num]; if(e){ for(var k = 0; k <= e[0]; k++) dist[k]++; } else sin++; });
  return { est:est, dist:dist, sin:sin };
}

/* ====================== HOJA 7 · INDICADORES ====================== */
function colPpc(v){ return v >= 80 ? "#26694B" : (v >= 60 ? "#D6A828" : "#B23B3B"); }
function box(o, x, y, w, h, titulo){ o.push(R(x, y, w, h, "#ffffff", { rx:1.4, stroke:"#C9C5B7", sw:.3 })); o.push(T(x + 4, y + 5.2, titulo, 3.8, 700, NAVY)); o.push(L(x + 4, y + 8.6, x + w - 4, y + 8.6, LINE, .25)); }
function hoja7(M){
  var S = 1.3;
  function Ts(x, y, s, size, w, fill, op){ return T(x, y, s, size * S, w, fill, op); }
  function fS(s, size, w, maxw){ return fit(s, size * S, w, maxw); }
  var hoy = M.hoy, lh = iso(lunes(hoy)), PORT = M.PORT, PN = M.PN, ES = estadoPortico(M);
  var total = PORT.length * ORDEN.length, nreal = Object.keys(M.ejecAv).length;
  var inic = {}; M.AV.forEach(function(a){ if(NOTAS.indexOf(a.partida) < 0) inic[a.portico] = 1; });
  var pend = {}; M.PR.forEach(function(r){ if(r.aut.toLowerCase().indexOf("pendiente") === 0) pend[r.portico] = 1; });
  var sem = {};
  M.PR.forEach(function(r){ var l = iso(lunes(r.fecha)); if(l > lh) return; var s = sem[l] = sem[l] || [0, 0, 0];
    if(esEj(r)) s[0]++; else if(esNo(r)) s[1]++; else if(r.fecha < hoy) s[2]++; });
  var semanas = Object.keys(sem).sort().slice(-12);
  var ppcs = semanas.map(function(l){ var s = sem[l], c = s[0] + s[1]; return [l, c ? Math.round(100 * s[0] / c) : null, s]; });
  var con = ppcs.filter(function(p){ return p[1] !== null; }), ult = con.length ? con[con.length - 1] : null, prev = con.length > 1 ? con[con.length - 2] : null;
  var prom = con.length ? Math.round(con.reduce(function(a, p){ return a + p[1]; }, 0) / con.length) : null;
  var o = frame(7, "INFORME DE AVANCE · PÓRTICOS DE VIGILANCIA · INDICADORES", "Indicadores del proyecto", "corte al " + M.corte);
  var tend = (ult && prev) ? " · " + (ult[1] - prev[1] >= 0 ? "▲ +" : "▼ ") + (ult[1] - prev[1]) + " pts" : "";
  o = o.concat(kpis([[Math.round(100 * nreal / Math.max(1, total)) + " %", "avance global · " + nreal + " de " + total + " partidas"], [Object.keys(inic).length, "de " + PORT.length + " pórticos iniciados"],
    [ult ? ult[1] + " %" : "–", "PPC sem. " + (ult ? etqs(ult[0]) : "") + tend], [Object.keys(pend).length, "autorizaciones pendientes"]]));
  var y0 = 52, bh = 96, bw1 = 128;
  box(o, 16, y0, bw1, bh, "Cumplimiento del plan semanal (PPC)");
  var cx0 = 16 + 14, cx1 = 16 + bw1 - 5, cy0 = y0 + 15, cy1 = y0 + bh - 18, yy = function(v){ return cy1 - (cy1 - cy0) * v / 100; };
  [0, 20, 40, 60, 80, 100].forEach(function(v){ o.push(L(cx0, yy(v), cx1, yy(v), LINE, .2)); o.push(Ts(cx0 - 2, yy(v), String(v), 2.3, 400, MUTE, { anchor:"end" })); });
  if(!ppcs.length) o.push(Ts(cx0 + 4, y0 + 30, "Aún no hay semanas con tareas comprometidas.", 2.7, 400, MUTE));
  var n = ppcs.length, bwd = n ? (cx1 - cx0) / n : 0;
  ppcs.forEach(function(p, i){
    var w = Math.min(bwd * .62, 14), x = cx0 + i * bwd + (bwd - w) / 2, v = p[1], s = p[2];
    if(v !== null){ o.push(R(x, yy(v), w, yy(0) - yy(v), colPpc(v), { rx:.8 })); o.push(Ts(x + w / 2, yy(v) - 2.6, v + " %", 2.6, 700, NAVY, { anchor:"middle" })); o.push(Ts(x + w / 2, cy1 + 9.6, s[0] + " de " + (s[0] + s[1]), 2, 400, MUTE, { anchor:"middle" })); }
    else o.push(Ts(x + w / 2, yy(0) - 2.6, "s/d", 2.3, 400, MUTE, { anchor:"middle" }));
    o.push(Ts(x + w / 2, cy1 + 4.6, etqs(p[0]), 2.4, 500, NAVY, { anchor:"middle" }));
  });
  o.push(L(cx0, yy(80), cx1, yy(80), "#26694B", .35, "1.6 1.2")); o.push(Ts(cx1, yy(80) - 2.6, "meta 80 %", 2.2, 600, "#26694B", { anchor:"end" }));
  var sinrep = ppcs.reduce(function(a, p){ return a + p[2][2]; }, 0);
  o.push(Ts(20, y0 + bh - 3, fS("PPC = ejecutadas ÷ comprometidas" + (prom !== null ? " · promedio " + prom + " %" : "") + (sinrep ? " · " + sinrep + " sin reportar (no cuentan)" : ""), 2.1, 400, bw1 - 8), 2.1, 400, MUTE));
  /* Pareto */
  var px = 16 + bw1 + 5, pw = 265 - bw1 - 5; box(o, px, y0, pw, bh, "Causas de no cumplimiento (Pareto)");
  var no = M.PR.filter(esNo), cs = cuenta(no, function(r){ return r.causa || "__"; });
  var lst = Object.keys(cs).map(function(k){ return [k, cs[k]]; }).sort(function(a, b){ return b[1] - a[1]; }), y1_ = y0 + 16;
  if(lst.length){
    var mx = lst[0][1], ac = 0;
    lst.slice(0, 7).forEach(function(q){
      var k = q[0], c = q[1]; ac += c; var t = k === "__" ? "Sin causa asignada" : (k + ". " + (M.CAUSAS[k] || k));
      o.push(Ts(px + 4, y1_, fS(t, 2.5, 500, 56), 2.5, 500, NAVY));
      var bx = px + 62, bwm = pw - 62 - 26; o.push(R(bx, y1_ - 1.6, bwm, 3.2, CHIP, { rx:.8 })); o.push(R(bx, y1_ - 1.6, bwm * c / mx, 3.2, k === "__" ? "#D6A828" : "#B23B3B", { rx:.8 }));
      o.push(Ts(px + pw - 15, y1_, String(c), 2.6, 700, NAVY, { anchor:"end" })); o.push(Ts(px + pw - 4, y1_, Math.round(100 * ac / no.length) + " %", 2.4, 400, MUTE, { anchor:"end" })); y1_ += 6.2;
    });
    var acc = no.filter(function(r){ return (r.accion || "").trim(); }).sort(function(a, b){ return a.fecha < b.fecha ? 1 : -1; }).slice(0, 3);
    y1_ += 2; o.push(Ts(px + 4, y1_, "Acciones correctivas recientes", 2.6, 700, NAVY)); y1_ += 5.6;
    if(acc.length) acc.forEach(function(r){ wrap(r.nombre + " · " + fdm(r.fecha) + " → " + r.accion, 2.3 * S, 400, pw - 8, 2).forEach(function(ln){ o.push(Ts(px + 4, y1_, ln, 2.3, 400, NAVY)); y1_ += 4.1; }); });
    else o.push(Ts(px + 4, y1_, "Sin acciones correctivas registradas.", 2.3, 400, MUTE));
    o.push(Ts(px + 4, y0 + bh - 3, fS(no.length + " tareas no cumplidas · columna derecha = % acumulado", 2.1, 400, pw - 8), 2.1, 400, MUTE));
  } else o.push(Ts(px + 4, y1_, "No hay tareas marcadas como «no ejecutado».", 2.7, 400, MUTE));
  /* Curva S */
  var y1 = y0 + bh + 5, ch = 92; box(o, 16, y1, 265, ch, "Curva S · partidas programadas vs. ejecutadas");
  var planK = {};
  M.PR.forEach(function(r){ if(esNo(r) || ORDEN.indexOf(r.partida) < 0) return; var k = r.portico + "|" + r.partida; if(!planK[k] || r.fecha > planK[k]) planK[k] = r.fecha; });
  var fechas = Object.keys(planK).map(function(k){ return planK[k]; }).concat(Object.keys(M.ejecAv).map(function(k){ return M.ejecAv[k]; })).sort();
  if(fechas.length){
    var l0 = lunes(fechas[0]), lN = lunes(fechas[fechas.length - 1]), lH = lunes(hoy); if(lH > lN) lN = lH;
    var ws = []; for(var l = l0; l <= lN; l = addDays(l, 7)) ws.push(l);
    var fin = function(l){ return iso(addDays(l, 6)); }, pk = Object.keys(planK).map(function(k){ return planK[k]; }), rk = Object.keys(M.ejecAv).map(function(k){ return M.ejecAv[k]; });
    var pv = ws.map(function(l){ var fi = fin(l); return pk.filter(function(v){ return v <= fi; }).length; });
    var rv = ws.map(function(l){ var fi = fin(l); return l > lH ? null : rk.filter(function(v){ return v <= fi; }).length; });
    var ymax = Math.max(1, pk.length, nreal), sx0 = 16 + 17, sx1 = 273, sy0 = y1 + 15, sy1 = y1 + ch - 15;
    var ys = function(v){ return sy1 - (sy1 - sy0) * v / ymax; }, xs = function(i){ return sx0 + (ws.length > 1 ? (sx1 - sx0) * i / (ws.length - 1) : (sx1 - sx0) / 2); };
    [0, .25, .5, .75, 1].forEach(function(fr){ var v = Math.round(ymax * fr); o.push(L(sx0, ys(v), sx1, ys(v), LINE, .2)); o.push(Ts(sx0 - 2, ys(v), String(v), 2.3, 400, MUTE, { anchor:"end" })); });
    var paso = Math.ceil(ws.length / 10);
    ws.forEach(function(l, i){ if(i % paso === 0 || i === ws.length - 1) o.push(Ts(xs(i), sy1 + 5, etqs(iso(l)), 2.3, 400, MUTE, { anchor:"middle" })); });
    var iH = -1; ws.forEach(function(l, i){ if(l.getTime() === lH.getTime()) iH = i; });
    if(iH >= 0){ o.push(L(xs(iH), sy0, xs(iH), sy1, "#B23B3B", .25, "1 1")); o.push(Ts(xs(iH) + 1.2, sy0 + 2, "hoy", 2.2, 600, "#B23B3B")); }
    o.push('<polyline points="' + pv.map(function(v, i){ return f(xs(i)) + "," + f(ys(v)); }).join(" ") + '" fill="none" stroke="#8C949E" stroke-width=".7" stroke-dasharray="2 1.2"/>');
    var rp = []; rv.forEach(function(v, i){ if(v !== null) rp.push([xs(i), ys(v)]); });
    o.push('<polyline points="' + rp.map(function(q){ return f(q[0]) + "," + f(q[1]); }).join(" ") + '" fill="none" stroke="#2C6B7E" stroke-width=".9"/>');
    rp.forEach(function(q){ o.push(circ(q[0], q[1], 1, "#2C6B7E")); });
    var lx = 281 - 4 - 84;
    o.push(L(lx, y1 + 5.2, lx + 6, y1 + 5.2, "#8C949E", .7, "2 1.2")); o.push(Ts(lx + 7.5, y1 + 5.2, "Programado", 2.4, 400, NAVY));
    o.push(L(lx + 38, y1 + 5.2, lx + 44, y1 + 5.2, "#2C6B7E", .9)); o.push(Ts(lx + 45.5, y1 + 5.2, "Ejecutado", 2.4, 400, NAVY));
    var iu = iH >= 0 ? iH : rv.length - 1, dif = (rv[iu] || 0) - pv[iu];
    o.push(Ts(20, y1 + ch - 3, fS("A la fecha: " + (rv[iu] || 0) + " ejecutadas vs " + pv[iu] + " programadas · " + (dif >= 0 ? "al día o adelantado (+" + dif + ")" : "atraso de " + (-dif) + " partidas") + " · ejecutado = registros de avance al 100 %.", 2.1, 400, 265 - 8), 2.1, 400, MUTE));
  } else o.push(Ts(20, y1 + 20, "Sin programación cargada.", 2.7, 400, MUTE));
  /* avance por partida */
  var yb = y1 + ch + 8, pit = Math.min(8.6, (402 - yb - 9) / Math.max(1, ORDEN.length));
  o.push(T(16, yb, "Avance por partida · pórticos que ya la ejecutaron", 3.8, 700, NAVY)); o.push(L(16, yb + 2.9, 281, yb + 2.9, NAVY, .3));
  ORDEN.forEach(function(p, i){
    var y = yb + 9.5 + i * pit, c = ES.dist[i];
    o.push(T(16, y, p, 3.4, 600, NAVY)); o.push(R(60, y - 2.1, 188, 4.2, CHIP, { rx:1 })); o.push(R(60, y - 2.1, 188 * c / Math.max(1, PORT.length), 4.2, COL[p], { rx:1 }));
    o.push(T(252, y, c + " de " + PORT.length, 3.4, 700, NAVY)); o.push(T(281, y, Math.round(100 * c / Math.max(1, PORT.length)) + " %", 3.2, 400, MUTE, { anchor:"end" }));
  });
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 7 · Indicadores");
}

/* ====================== HOJA 8 · ESTADO DE LOS PÓRTICOS ====================== */
function icono(x, y, sz, col, tipo){
  var k = sz / 12, P = tipo === "Eléctrica" ? "M7 1 L2.5 7.2 H6 L5 11 L9.5 4.8 H6 Z" : "M6 1.2 C6 1.2 2.6 5.2 2.6 7.3 A3.4 3.4 0 0 0 9.4 7.3 C9.4 5.2 6 1.2 6 1.2 Z";
  return '<path transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(k) + ')" d="' + P + '" fill="' + col + '"/>';
}
function hoja8(M){
  var PORT = M.PORT, ES = estadoPortico(M), est = ES.est, dist = ES.dist, sin = ES.sin;
  var o = frame(8, "INFORME DE AVANCE · PÓRTICOS DE VIGILANCIA · ESTADO", "Estado actual de los " + PORT.length + " pórticos", "corte al " + M.corte);
  o = o.concat(kpis([[PORT.length, "pórticos en total"], [PORT.length - sin, "con avance registrado"], [sin, "sin iniciar"], [dist[0] || 0, "con trazado ejecutado"]]));
  var y = 53, xx = 16;
  [["Sin iniciar", sin, "#C9C5B7"]].concat(ORDEN.map(function(nm, i){ return [nm, dist[i], COL[nm]]; })).forEach(function(it){
    o.push(circ(xx + 1.4, y, 1.4, it[2])); var lab = it[0] + " "; o.push(T(xx + 3.8, y, lab, 3, 400, NAVY)); o.push(T(xx + 3.8 + tw(lab, 3), y, String(it[1]), 3, 700, NAVY)); xx += 3.8 + tw(lab + it[1], 3, 600) + 6;
  });
  o.push(T(16, y + 5, "Conteo acumulado: cada partida cuenta los pórticos que ya la ejecutaron, aunque hayan avanzado a la siguiente.", 2.6, 400, MUTE));
  /* leyenda de condiciones constructivas (ticket por valor) */
  var CD = M.CONDS || [], lx = 16, ly2 = y + 10.4;
  if(CD.length){
    var GR = [["Fund. posición", 0], ["Fund. tipo", 1], ["Excavación", 2], ["Instalaciones", 3]];
    GR.forEach(function(g, gi){
      var c = CD[g[1]]; if(!c) return; var lab = g[0] + ":"; o.push(T(lx, ly2, lab, 2.5, 700, NAVY)); lx += tw(lab, 2.5, 700) + 1.8;
      c.ops.forEach(function(op){ var w0 = tw(op[0], 2.3, 600) + 5.2; o.push(R(lx, ly2 - 2.1, w0, 3.6, mix(op[1], .17), { rx:1.8, sw:0 })); o.push(c.multi ? icono(lx + 1.3, ly2 - 1.5, 2.2, op[1], op[0]) : tick(lx + 1.4, ly2 - .1, 1.2, op[1], .3)); o.push(T(lx + 3.4, ly2, op[0], 2.3, 600, op[1])); lx += w0 + 1.6; });
      lx += 5;
    });
  }
  var rows = PORT.slice().sort(function(a, b){ return cmpNat(a.nombre, b.nombre); }), nreg = cuenta(M.AV, function(a){ return a.portico; });
  var half = Math.ceil(rows.length / 2), colw = (265 - 8) / 2, ty = 73, hrow = Math.min(7.3, (402 - ty - 7.2) / Math.max(1, half)), k = Math.min(1, hrow / 6.4);
  for(var c = 0; c < 2; c++){
    var bx = 16 + c * (colw + 8); o.push(R(bx, ty - 3, colw, 6, CHIP, { rx:.8 }));
    [["Pórtico", 1.5], ["Comuna", 17], ["Estado actual", 37], ["Detalle", 65.5]].forEach(function(h){ o.push(T(bx + h[1], ty, h[0], 2.8, 600, MUTE)); });
    (CD || []).forEach(function(cc, ci){ if(!cc.multi) o.push(circ(bx + 79 + ci * 11, ty - .9, .8, COL[cc.partida])); o.push(T(bx + 80.4 + ci * 11, ty - .6, ["Posición", "Tipo", "Excav.", "Instal."][ci] || cc.titulo, 2.3, 600, MUTE)); });
    o.push(T(bx + colw - 1.5, ty, "Reg.", 2.8, 600, MUTE, { anchor:"end" }));
  }
  rows.forEach(function(p, i){
    var c = Math.floor(i / half), kk = i % half, bx = 16 + c * (colw + 8), yy = ty + 7.2 + kk * hrow;
    if(kk % 2) o.push(R(bx, yy - hrow / 2, colw, hrow, "rgba(10,34,64,.03)"));
    var e = est[p.num];
    o.push(T(bx + 1.5, yy, p.nombre, 3.2 * k, 700, NAVY)); o.push(T(bx + 17, yy, fit(p.comuna, 3 * k, 400, 17.5), 3 * k, 400, NAVY));
    (CD || []).forEach(function(cc, ci){
      var v = M.COND[p.num + "|" + cc.k], op = null, cx = bx + 79 + ci * 11;
      if(cc.multi){
        var vs = String(v || "").split(",").filter(Boolean), n0 = 0;
        if(!vs.length){ o.push(T(cx + 1, yy, "—", 2.8 * k, 400, "rgba(10,34,64,.3)")); return; }
        cc.ops.forEach(function(q){ if(vs.indexOf(q[0]) >= 0){ o.push(R(cx - 1.2 + n0 * 5.6, yy - 1.9 * k, 5, 3.8 * k, mix(q[1], .2), { rx:1.9 * k, sw:0 })); o.push(icono(cx - .3 + n0 * 5.6, yy - 1.5 * k, 2.9 * k, q[1], q[0])); n0++; } });
        return;
      }
      cc.ops.forEach(function(q){ if(q[0] === v) op = q; });
      if(op){ var lab = op[2] || op[0], w1 = Math.min(10.6, tw(lab, 2.1 * k, 600) + 4.6); o.push(R(cx - 1.3, yy - 1.9 * k, w1, 3.8 * k, mix(op[1], .17), { rx:1.9 * k, sw:0 })); o.push(tick(cx + .2, yy - .1, 1.2 * k, op[1], .3)); o.push(T(cx + 2.4, yy, lab, 2.1 * k, 600, op[1])); }
      else o.push(T(cx + 1, yy, "—", 2.8 * k, 400, "rgba(10,34,64,.3)"));
    });
    if(e){
      var nm = ORDEN[e[0]], parc = e[2] !== "" && e[2] != null && parseFloat(e[2]) < 100;
      o.push(circ(bx + 38.3, yy, 1.3, COL[nm])); o.push(T(bx + 40.5, yy, fit(nm, 2.8 * k, 500, 23), 2.8 * k, 500, NAVY));
      o.push(T(bx + 65.5, yy, fit(parc ? e[2] + " % · " + fdm(e[1]) : fdm(e[1]), 2.7 * k, 400, 13), 2.7 * k, 400, MUTE));
    } else { o.push('<circle cx="' + f(bx + 38.3) + '" cy="' + f(yy) + '" r="1.3" fill="none" stroke="#9aa0a8" stroke-width=".3"/>'); o.push(T(bx + 40.5, yy, "Sin iniciar", 2.8 * k, 400, MUTE)); }
    o.push(T(bx + colw - 1.5, yy, String(nreg[p.num] || 0), 2.9 * k, 400, NAVY, { anchor:"end" }));
  });
  return svgDoc(o, "Pórticos · Informe de avance · Hoja 8 · Estado de los pórticos");
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
var NOMBRES = ["Hoja1_Mapa", "Hoja2_Trazados", "Hoja3_Semana_presente", "Hoja4_Semana_anterior_y_siguiente", "Hoja5_Intermedio", "Hoja6_Restricciones", "Hoja7_Indicadores", "Hoja8_Estado_porticos"];
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
    hojas.push(hoja1(M, G)); hojas.push(hoja2(M)); var board = leerSemanal(); hojas.push(hoja3(M, board)); hojas.push(hoja4(M)); hojas.push(hoja5(M)); hojas.push(hoja6(M)); hojas.push(hoja7(M)); hojas.push(hoja8(M));
    return { hojas:hojas.map(function(s){ return conFuente(s, css); }), M:M };
  });
}
function bajar(blob, nombre){ var a = document.createElement("a"), u = URL.createObjectURL(blob); a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(u); }, 4000); }

function pdfDirecto(btn){
  var t0 = btn ? btn.innerHTML : "";
  function estado(t){ if(btn){ btn.textContent = t; } }
  if(btn) btn.disabled = true;
  function fin(){ if(btn){ btn.innerHTML = t0; btn.disabled = false; } }
  estado("Generando…");
  return generar(estado).then(function(R_){
    var hojas = R_.hojas, pw = Math.round(297 / 25.4 * 300), ph = Math.round(420 / 25.4 * 300), imgs = [], seq = Promise.resolve();
    if(pw * ph > 16000000){ var K = Math.sqrt(16000000 / (pw * ph)); pw = Math.round(pw * K); ph = Math.round(ph * K); }
    hojas.forEach(function(s, i){ seq = seq.then(function(){ estado("Hoja " + (i + 1) + " de " + hojas.length + "…"); return rasterizar(s, pw, ph); }).then(function(j){ imgs.push(j); }); });
    return seq.then(function(){ bajar(pdfDesde(imgs, pw, ph), "Porticos_Informe_Avance_" + R_.M.hoy + ".pdf"); });
  }).then(fin, function(e){ fin(); alert("No se pudo generar el informe: " + (e && e.message ? e.message : e)); });
}
window.PORTICOS_INFORME = { pdf:pdfDirecto, generar:generar, _t:{ parseFuentes:parseFuentes, cssFuentes:cssFuentes, modelo:modelo, hoja1:hoja1, hoja2:hoja2, hoja3:hoja3, hoja4:hoja4, hoja5:hoja5, hoja6:hoja6, hoja7:hoja7, hoja8:hoja8, initOrden:initOrden } };
})();
