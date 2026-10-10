/* =====================================================================
   GEOMAV · Last Planner — Informe Excel desde la plantilla de la obra
   Rellena plantilla-informe.xlsx (Minuta, Last Planner, Restricciones,
   Consolidado, Ev. Subcontratista y Plan Maestro) editando el XML del
   libro: conserva formato, logos, fórmulas y gráficos de la planilla.
   Uso: LP_INFORME_XLSX.generar(datos) -> Promise<Blob>
   ===================================================================== */
(function(){
  "use strict";
  var NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  var PLANTILLA = "plantilla-informe.xlsx?v=1";
  var MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];

  /* ---------- utilidades de celdas y fechas ---------- */
  function colNum(l){ var n = 0; for(var i=0;i<l.length;i++) n = n*26 + (l.charCodeAt(i) - 64); return n; }
  function colLet(n){ var s = ""; while(n > 0){ var m = (n-1) % 26; s = String.fromCharCode(65+m) + s; n = Math.floor((n-1)/26); } return s; }
  function ref(c, r){ return colLet(c) + r; }
  function pRef(a){ var m = /^([A-Z]+)(\d+)$/.exec(a); return { c: colNum(m[1]), r: +m[2] }; }
  function pRango(a){ var p = a.split(":"), x = pRef(p[0]), y = pRef(p[1] || p[0]); return { c1:x.c, r1:x.r, c2:y.c, r2:y.r }; }
  function d(iso){ var p = String(iso).slice(0,10).split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
  function iso(dt){ return dt.getFullYear() + "-" + String(dt.getMonth()+1).padStart(2,"0") + "-" + String(dt.getDate()).padStart(2,"0"); }
  function addD(s, n){ var x = d(s); x.setDate(x.getDate() + n); return iso(x); }
  function lunes(s){ var x = d(s); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); }
  function serial(s){ if(!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null; var p = s.slice(0,10).split("-"); return (Date.UTC(+p[0], +p[1]-1, +p[2]) - Date.UTC(1899,11,30)) / 864e5; }
  function dmy(s){ var p = String(s).split("-"); return p[2] + "-" + p[1] + "-" + p[0].slice(2); }
  function semanasEntre(a, b){ return Math.round((d(lunes(b)) - d(lunes(a))) / 6048e5); }
  function iniciales(n){ return String(n || "").trim().split(/\s+/).filter(Boolean).slice(0,3).map(function(w){ return w.charAt(0).toUpperCase(); }).join(""); }
  function el(doc, tag){ return doc.createElementNS(NS, tag); }
  function kids(node, tag){ var o = []; for(var c = node.firstChild; c; c = c.nextSibling) if(c.nodeType === 1 && c.localName === tag) o.push(c); return o; }
  function kid(node, tag){ return kids(node, tag)[0] || null; }

  /* ---------- libro ---------- */
  function Libro(zip){ this.zip = zip; this.docs = {}; this.hojas = {}; this.cacheEst = {}; }
  Libro.prototype.xml = function(path){
    var self = this;
    if(self.docs[path]) return Promise.resolve(self.docs[path]);
    var f = self.zip.file(path); if(!f) return Promise.resolve(null);
    return f.async("string").then(function(t){ var doc = new DOMParser().parseFromString(t, "application/xml"); self.docs[path] = doc; return doc; });
  };
  Libro.prototype.iniciar = function(){
    var self = this;
    return Promise.all([self.xml("xl/workbook.xml"), self.xml("xl/_rels/workbook.xml.rels"), self.xml("xl/styles.xml"), self.xml("xl/sharedStrings.xml")]).then(function(r){
      self.wb = r[0]; self.est = r[2]; self.ss = r[3];
      var rels = {}; Array.prototype.forEach.call(r[1].getElementsByTagName("Relationship"), function(x){ rels[x.getAttribute("Id")] = x.getAttribute("Target"); });
      self.textos = self.ss ? Array.prototype.map.call(self.ss.getElementsByTagNameNS(NS, "si"), function(si){ return Array.prototype.map.call(si.getElementsByTagNameNS(NS, "t"), function(t){ return t.textContent; }).join(""); }) : [];
      self.lista = Array.prototype.map.call(self.wb.getElementsByTagNameNS(NS, "sheet"), function(s){
        var rid = s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || s.getAttribute("r:id");
        return { nombre: s.getAttribute("name"), nodo: s, path: "xl/" + String(rels[rid]).replace(/^\/?xl\//, "") };
      });
      return Promise.all(self.lista.map(function(h){ return self.xml(h.path).then(function(doc){ self.hojas[h.nombre] = new Hoja(self, doc, h); }); }));
    });
  };
  Libro.prototype.hoja = function(n){ return this.hojas[n]; };
  /* estilos: clona un formato de celda cambiando solo su relleno */
  Libro.prototype.relleno = function(s){ var xf = kids(kid(this.est.documentElement, "cellXfs"), "xf")[s || 0]; return xf ? +(xf.getAttribute("fillId") || 0) : 0; };
  Libro.prototype.conRelleno = function(s, fillId){
    s = s || 0; if(this.relleno(s) === fillId) return s;
    var k = s + ":" + fillId; if(this.cacheEst[k] != null) return this.cacheEst[k];
    var cx = kid(this.est.documentElement, "cellXfs"), xfs = kids(cx, "xf"), nuevo = xfs[s].cloneNode(true);
    nuevo.setAttribute("fillId", String(fillId)); nuevo.setAttribute("applyFill", fillId ? "true" : "false");
    cx.appendChild(nuevo); cx.setAttribute("count", String(xfs.length + 1));
    return (this.cacheEst[k] = xfs.length);
  };
  Libro.prototype.renombrar = function(viejo, nuevo){
    var h = this.hojas[viejo]; if(!h || viejo === nuevo) return;
    h.info.nodo.setAttribute("name", nuevo); h.info.nombre = nuevo; this.hojas[nuevo] = h; delete this.hojas[viejo];
    this.reemplazos = (this.reemplazos || []).concat([[viejo, nuevo]]);
  };
  Libro.prototype.graficos = function(fn){ this.cambiosGraf = (this.cambiosGraf || []).concat([fn]); };
  Libro.prototype.generar = function(){
    var self = this, zip = self.zip, ser = new XMLSerializer();
    /* sin nombres definidos vacíos (Excel los reclama) y recálculo completo al abrir */
    var dn = self.wb.getElementsByTagNameNS(NS, "definedName");
    for(var i = dn.length - 1; i >= 0; i--) if(!String(dn[i].textContent).trim() || /#REF!/.test(dn[i].textContent)) dn[i].parentNode.removeChild(dn[i]);
    var dns = self.wb.getElementsByTagNameNS(NS, "definedNames")[0]; if(dns && !kids(dns, "definedName").length) dns.parentNode.removeChild(dns);
    var cp = self.wb.getElementsByTagNameNS(NS, "calcPr")[0]; if(cp){ cp.setAttribute("fullCalcOnLoad", "1"); }
    zip.remove("xl/calcChain.xml");
    Object.keys(self.docs).forEach(function(p){ zip.file(p, ser.serializeToString(self.docs[p])); });
    var rem = self.reemplazos || [];
    var graf = Object.keys(zip.files).filter(function(p){ return /^xl\/charts\/chart\d+\.xml$/.test(p); });
    return Promise.all(graf.map(function(p){
      return zip.file(p).async("string").then(function(t){
        rem.forEach(function(r){ t = t.split("'" + r[0].replace(/'/g, "''") + "'!").join("'" + r[1].replace(/'/g, "''") + "'!").split("&apos;" + r[0] + "&apos;!").join("&apos;" + r[1] + "&apos;!"); });
        (self.cambiosGraf || []).forEach(function(fn){ t = fn(t, p); });
        /* sin cachés: Excel y LibreOffice redibujan con los datos nuevos */
        t = t.replace(/<c:(numCache|strCache)>[\s\S]*?<\/c:\1>/g, "");
        zip.file(p, t);
      });
    })).then(function(){
      return zip.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    });
  };

  /* ---------- hoja ---------- */
  function Hoja(libro, doc, info){
    this.L = libro; this.doc = doc; this.info = info; this.sd = doc.getElementsByTagNameNS(NS, "sheetData")[0]; this.filas = {};
    var self = this; kids(this.sd, "row").forEach(function(r){ self.filas[+r.getAttribute("r")] = r; });
  }
  Hoja.prototype.fila = function(r){
    var f = this.filas[r]; if(f) return f;
    f = el(this.doc, "row"); f.setAttribute("r", String(r));
    var sig = null; kids(this.sd, "row").some(function(x){ if(+x.getAttribute("r") > r){ sig = x; return true; } return false; });
    this.sd.insertBefore(f, sig); this.filas[r] = f; return f;
  };
  Hoja.prototype.celda = function(a, crear){
    var p = pRef(a), f = crear ? this.fila(p.r) : this.filas[p.r]; if(!f) return null;
    var cs = kids(f, "c"), sig = null;
    for(var i=0;i<cs.length;i++){ var cr = cs[i].getAttribute("r"); if(cr === a) return cs[i]; if(colNum(/^[A-Z]+/.exec(cr)[0]) > p.c){ sig = cs[i]; break; } }
    if(!crear) return null;
    var c = el(this.doc, "c"); c.setAttribute("r", a);
    /* hereda el formato de la columna si la celda no existía */
    f.insertBefore(c, sig); return c;
  };
  Hoja.prototype.est = function(a){ var c = this.celda(a); return c ? +(c.getAttribute("s") || 0) : 0; };
  Hoja.prototype.setEst = function(a, s){ this.celda(a, true).setAttribute("s", String(s)); };
  function vaciar(c){ while(c.firstChild) c.removeChild(c.firstChild); c.removeAttribute("t"); }
  Hoja.prototype.val = function(a, v){
    var c = this.celda(a, v != null && v !== ""); if(!c) return;
    vaciar(c); if(v == null || v === "") return;
    var doc = this.doc;
    if(typeof v === "object" && v.f){ var f = el(doc, "f"); f.textContent = v.f.replace(/^=/, ""); c.appendChild(f); return; }
    if(typeof v === "number"){ if(!isFinite(v)) return; var x = el(doc, "v"); x.textContent = String(v); c.appendChild(x); return; }
    c.setAttribute("t", "inlineStr");
    var is = el(doc, "is"), t = el(doc, "t"); t.setAttribute("xml:space", "preserve"); t.textContent = String(v); is.appendChild(t); c.appendChild(is);
  };
  Hoja.prototype.texto = function(a){
    var c = this.celda(a); if(!c) return "";
    var v = kid(c, "v"); if(c.getAttribute("t") === "s" && v) return this.L.textos[+v.textContent] || "";
    if(c.getAttribute("t") === "inlineStr") return c.textContent; return v ? v.textContent : "";
  };
  Hoja.prototype.limpiar = function(rg){
    var R = pRango(rg), self = this;
    for(var r = R.r1; r <= R.r2; r++){ var f = self.filas[r]; if(!f) continue;
      kids(f, "c").forEach(function(c){ var k = colNum(/^[A-Z]+/.exec(c.getAttribute("r"))[0]); if(k >= R.c1 && k <= R.c2) vaciar(c); }); }
  };
  /* quita los valores en caché de las fórmulas: se recalculan al abrir */
  Hoja.prototype.sinCache = function(){
    Array.prototype.forEach.call(this.doc.getElementsByTagNameNS(NS, "f"), function(f){
      var c = f.parentNode, v = kid(c, "v"); if(v) c.removeChild(v); if(c.getAttribute("t") !== "str") c.removeAttribute("t");
    });
  };
  Hoja.prototype.ocultarFilas = function(r1, r2){ for(var r = r1; r <= r2; r++) this.fila(r).setAttribute("hidden", "true"); };
  Hoja.prototype.altoFila = function(r, h){ var f = this.fila(r); f.setAttribute("ht", String(h)); f.setAttribute("customHeight", "true"); };
  Hoja.prototype.ocultarCols = function(c1, c2){
    var cols = this.doc.getElementsByTagNameNS(NS, "cols")[0]; if(!cols) return;
    var doc = this.doc, lista = kids(cols, "col"), nuevos = [];
    lista.forEach(function(x){
      var a = +x.getAttribute("min"), b = +x.getAttribute("max");
      var partes = [[a, Math.min(b, c1 - 1), false], [Math.max(a, c1), Math.min(b, c2), true], [Math.max(a, c2 + 1), b, false]];
      partes.forEach(function(p){ if(p[0] > p[1]) return; var y = x.cloneNode(false); y.setAttribute("min", p[0]); y.setAttribute("max", p[1]); if(p[2]) y.setAttribute("hidden", "true"); nuevos.push(y); });
      cols.removeChild(x);
    });
    kids(cols, "col").forEach(function(y){ nuevos.push(y); cols.removeChild(y); });
    nuevos.sort(function(p, q){ return +p.getAttribute("min") - +q.getAttribute("min"); }).forEach(function(y){ cols.appendChild(y); });
  };
  Hoja.prototype.quitarMerges = function(rg){
    var R = pRango(rg), mc = this.doc.getElementsByTagNameNS(NS, "mergeCells")[0]; if(!mc) return;
    kids(mc, "mergeCell").forEach(function(m){ var x = pRango(m.getAttribute("ref"));
      if(x.c1 >= R.c1 && x.c2 <= R.c2 && x.r1 >= R.r1 && x.r2 <= R.r2) mc.removeChild(m); });
    mc.setAttribute("count", String(kids(mc, "mergeCell").length));
  };
  Hoja.prototype.merge = function(rg){
    var R = pRango(rg); if(R.c1 === R.c2 && R.r1 === R.r2) return;
    var mc = this.doc.getElementsByTagNameNS(NS, "mergeCells")[0];
    if(!mc){ mc = el(this.doc, "mergeCells"); var ws = this.doc.documentElement, ant = this.doc.getElementsByTagNameNS(NS, "sheetData")[0];
      var sig = ant.nextSibling; while(sig && sig.nodeType === 1 && /^(sheetCalcPr|sheetProtection|protectedRanges|scenarios|autoFilter|sortState|dataConsolidate|customSheetViews)$/.test(sig.localName)) sig = sig.nextSibling; ws.insertBefore(mc, sig); }
    var m = el(this.doc, "mergeCell"); m.setAttribute("ref", rg); mc.appendChild(m); mc.setAttribute("count", String(kids(mc, "mergeCell").length));
  };

  /* =========================== rellenos =========================== */
  var CAUSAS_TPL = null;

  function hLastPlanner(L, D){
    var h = L.hoja("Last Planner-65"), F1 = 12, F2 = 311;
    /* paleta de colores por responsable tomada de la plantilla */
    var pal = [], vistos = {};
    for(var r = F1; r <= F2; r++){ var s = h.est("D" + r), f = L.relleno(s); if(f && !vistos[f]){ vistos[f] = 1; pal.push(s); } }
    if(!pal.length) pal.push(h.est("D12"));
    var sv = { A: h.est("A12"), B: h.est("B12"), C: h.est("C12"), dia: h.est("H12"), M: h.est("M12"), N: h.est("N12"), O: h.est("O12"), P: h.est("P12"), Q: h.est("Q12"), R: h.est("R12") };
    var verde = L.relleno(h.est("G12"));
    CAUSAS_TPL = []; for(var t = 2; t <= 10; t++) CAUSAS_TPL.push(h.texto("T" + t));
    h.quitarMerges("B" + F1 + ":B" + F2);
    h.limpiar("A" + F1 + ":R" + F2);
    var sem = D.semanal || { categorias: [], notas: [] }, cats = sem.categorias || [];
    var notas = (sem.notas || []).map(function(n, i){ return { n: n, i: i }; }).sort(function(a, b){ return (a.n.cat - b.n.cat) || (a.n.col - b.n.col) || (a.i - b.i); }).map(function(x){ return x.n; });
    if(notas.length > F2 - F1 + 1) notas = notas.slice(0, F2 - F1 + 1);
    var colorResp = {}, nc = 0;
    var r0 = F1, faseIni = F1, faseAct = null;
    notas.forEach(function(n, i){
      var r = F1 + i, fase = cats[n.cat] || "", resp = String(n.responsable || "").trim();
      if(!(resp in colorResp)) colorResp[resp] = pal[(nc++) % pal.length];
      var sD = colorResp[resp];
      h.setEst("A"+r, sv.A); h.setEst("B"+r, sv.B); h.setEst("C"+r, sv.C); ["D","E","F"].forEach(function(c){ h.setEst(c+r, sD); });
      for(var k = 0; k < 6; k++){ var c = colLet(7 + k); h.setEst(c + r, n.col === k ? L.conRelleno(sv.dia, verde) : sv.dia); }
      h.setEst("M"+r, sv.M); ["N","O","P","Q","R"].forEach(function(c){ h.setEst(c+r, sv[c]); });
      h.val("A"+r, i + 1);
      if(fase !== faseAct){ if(faseAct !== null && r - 1 > faseIni) h.merge("B" + faseIni + ":B" + (r - 1)); faseAct = fase; faseIni = r; h.val("B"+r, fase.toUpperCase()); }
      h.val("C"+r, n.zona || ""); h.val("D"+r, n.tarea || ""); h.val("E"+r, resp); h.val("F"+r, n.supervisor || "");
      var av = (n.avance === "" || n.avance == null) ? 1 : Number(n.avance) / 100; h.val("N"+r, av);
      if(n.real !== "" && n.real != null) h.val("O"+r, Number(n.real) / 100); else if(n.cumplido === true) h.val("O"+r, av);
      if(n.cumplido === true) h.val("P"+r, 1); else if(n.cumplido === false) h.val("P"+r, 0);
      if(n.cumplido === false){ var ci = parseInt(n.causa, 10); h.val("Q"+r, ci >= 1 && ci <= 9 ? CAUSAS_TPL[ci-1] : (n.causa || "")); }
      h.val("R"+r, [n.cumplido === false ? n.accion : "", n.detalle && n.detalle !== "Reprogramada" ? n.detalle : (n.detalle || "")].filter(Boolean).join(" · "));
    });
    var usadas = Math.max(notas.length, 1);
    if(notas.length && F1 + usadas - 1 > faseIni) h.merge("B" + faseIni + ":B" + (F1 + usadas - 1));
    if(usadas < F2 - F1 + 1) h.ocultarFilas(F1 + usadas, F2);
    /* encabezado */
    h.val("H3", D.n); h.val("G8", serial(D.ini)); h.val("B8", { f: "+G8" }); h.val("N8", { f: "+G8+6" });
    for(var k2 = 0; k2 < 7; k2++) h.val(colLet(7 + k2) + "11", d(addD(D.ini, k2)).getDate());
    if(D.obra) h.val("P2", D.obra.toUpperCase());
    if(D.inicioObra) h.val("P3", serial(D.inicioObra));
    if(D.administrador) h.val("P4", D.administrador.toUpperCase());
    h.val("P5", serial(D.hoy));
    h.sinCache();
    L.renombrar("Last Planner-65", "Last Planner-" + String(D.n).padStart(2, "0"));
  }

  function hMinuta(L, D){
    var h = L.hoja("Minuta N° 65"), F1 = 7, F2 = 31, T1 = 34, T2 = 73;
    var m = D.minuta || { fecha: D.ini, lugar: "", tema: "Plan Semanal", asistentes: [], temas: [] };
    var cargo = {}; (D.personas || []).forEach(function(p){ cargo[p[0]] = p[1] || ""; });
    var asis = (m.asistentes || []).slice(), marca = asis.length > 0;
    var lista = marca ? asis : (D.frecuentes || []).map(function(p){ return p[0]; });
    var mitad = Math.max(Math.ceil(lista.length / 2), 1), cap = F2 - F1 + 1;
    if(mitad > cap) mitad = cap;
    h.limpiar("B" + F1 + ":N" + F2);
    lista.slice(0, cap * 2).forEach(function(nom, i){
      var izq = i < mitad, r = F1 + (izq ? i : i - mitad); if(r > F2) return;
      var cs = izq ? ["B","C","D","E","F"] : ["I","J","K","L","M"];
      h.val(cs[0]+r, i + 1); h.val(cs[1]+r, nom); h.val(cs[2]+r, cargo[nom] || ""); h.val(cs[3]+r, iniciales(nom)); if(marca) h.val(cs[4]+r, "✓");
    });
    if(mitad < cap) h.ocultarFilas(F1 + mitad, F2);
    h.val("D4", (m.tema || "Plan Semanal") + "\n" + dmy(D.ini) + " al " + dmy(D.fin));
    h.val("G4", D.n); h.val("J4", serial(m.fecha || D.ini)); h.val("M4", m.lugar || "");
    h.limpiar("A" + T1 + ":N" + T2);
    var temas = (m.temas || []).filter(function(t){ return String(t[0] || "").trim() || String(t[1] || "").trim(); }).slice(0, T2 - T1 + 1);
    temas.forEach(function(t, i){ var r = T1 + i; h.val("A"+r, i + 1); h.val("B"+r, t[0] || ""); h.val("E"+r, t[1] || ""); h.val("M"+r, t[2] || ""); });
    var vis = Math.max(temas.length, 4);
    for(var r = T1 + temas.length; r < T1 + vis; r++) h.val("A"+r, r - T1 + 1);
    if(vis < T2 - T1 + 1) h.ocultarFilas(T1 + vis, T2);
    h.sinCache();
    L.renombrar("Minuta N° 65", "Minuta N° " + D.n);
  }

  function hRestricciones(L, D){
    var h = L.hoja("Pl. Restricciones N°65"), A1 = 9, A2 = 67, B1 = 73, B2 = 809;
    var fin = D.fin, todas = (D.restricciones || []).filter(function(r){ return String(r.desc || "").trim() && (!r.det || r.det <= fin); });
    var abiertas = todas.filter(function(r){ return !(r.ok && (!r.lib || r.lib <= fin)); }).sort(function(a, b){ return String(a.req || "9").localeCompare(String(b.req || "9")); });
    var lev = todas.filter(function(r){ return r.ok && (!r.lib || r.lib <= fin); }).sort(function(a, b){ return String(a.lib || a.det).localeCompare(String(b.lib || b.det)); });
    function poner(r, x, num, estado){
      if(num) h.val("A"+r, num);
      h.val("B"+r, x.zona || ""); h.val("C"+r, serial(x.det)); h.val("D"+r, String(x.fase || "").toUpperCase()); h.val("E"+r, x.partida || ""); h.val("F"+r, x.tipo || "");
      h.val("G"+r, x.desc || ""); h.val("H"+r, x.cliente || ""); h.val("I"+r, x.resp || ""); h.val("J"+r, serial(x.req)); h.val("K"+r, serial(x.lib)); if(estado != null) h.val("L"+r, estado);
    }
    h.limpiar("A" + A1 + ":L" + A2); h.limpiar("A" + B1 + ":L" + B2);
    abiertas.slice(0, A2 - A1 + 1).forEach(function(x, i){ poner(A1 + i, x, 0, null); });
    lev.slice(-(B2 - B1 + 1)).forEach(function(x, i){ poner(B1 + i, x, i + 1, 1); });
    var va = Math.max(abiertas.length, 3), vl = Math.max(lev.length, 3);
    if(A1 + va <= A2) h.ocultarFilas(A1 + va, A2);
    if(B1 + vl <= B2) h.ocultarFilas(B1 + vl, B2);
    h.sinCache();
    L.renombrar("Pl. Restricciones N°65", "Pl. Restricciones N°" + D.n);
  }

  /* semanas del proyecto (N° automático desde la primera semana con información) */
  function porSemana(D){ var o = {}; (D.semanas || []).forEach(function(w){ o[semanasEntre(D.primerLunes, w.ini) + 1] = w; }); return o; }

  function hConsolidado(L, D){
    var h = L.hoja("Consolidado"), C1 = 4, CAP = 156, W = porSemana(D);
    var desde = Math.max(1, D.n - CAP + 1), ult = C1 + (D.n - desde);
    var fillAm = L.relleno(h.est("BP42"));
    h.quitarMerges("D40:" + colLet(C1 + CAP - 1) + "40");
    h.limpiar("D40:" + colLet(C1 + CAP - 1) + "43"); h.limpiar("D47:" + colLet(C1 + CAP - 1) + "55"); h.limpiar("D59:" + colLet(C1 + CAP - 1) + "67");
    var mesAnt = null, iniMes = C1, s40 = h.est("E40");
    for(var k = desde; k <= D.n; k++){
      var c = C1 + (k - desde), L_ = colLet(c), lun = addD(D.primerLunes, (k - 1) * 7), w = W[k];
      var mes = lun.slice(0, 7);
      if(mes !== mesAnt){ if(mesAnt && c - 1 > iniMes) h.merge(colLet(iniMes) + "40:" + colLet(c - 1) + "40"); mesAnt = mes; iniMes = c; h.setEst(L_ + "40", s40); h.val(L_ + "40", serial(mes + "-01")); }
      h.val(L_ + "41", serial(lun));
      ["42","43"].forEach(function(f){ var s = h.est(L_ + f); h.setEst(L_ + f, L.conRelleno(s, k === D.n ? fillAm : 0)); });
      if(w && w.prog) h.val(L_ + "42", Math.round(w.log / w.prog * 1000) / 1000);
      h.val(L_ + "43", 0.8);
      for(var i = 0; i < 9; i++){
        h.val(L_ + (47 + i), w ? ((w.causas || [])[i] || 0) : 0);
        h.val(L_ + (59 + i), { f: "IF(" + L_ + "$56=0,0," + L_ + (47 + i) + "/" + L_ + "$56)" });
      }
    }
    if(ult > iniMes) h.merge(colLet(iniMes) + "40:" + colLet(ult) + "40");
    for(var j = 0; j < 9; j++) h.val("C" + (59 + j), { f: "IF($C$56=0,0,C" + (47 + j) + "/$C$56)" });
    if(ult < C1 + CAP - 1) h.ocultarCols(ult + 1, C1 + CAP - 1);
    if(D.obra) h.val("Z2", D.obra.toUpperCase());
    if(D.inicioObra) h.val("Z3", serial(D.inicioObra));
    if(D.administrador) h.val("Z4", D.administrador.toUpperCase());
    h.val("Z5", serial(D.fin));
    h.sinCache();
    var U = "$" + colLet(ult) + "$";
    L.graficos(function(t){
      return t.replace(/Consolidado!\$D\$41:\$[A-Z]+\$4[12]/g, "Consolidado!$D$41:" + U + "41")
        .replace(/Consolidado!\$D\$42:\$[A-Z]+\$42/g, "Consolidado!$D$42:" + U + "42")
        .replace(/Consolidado!\$D\$43:\$[A-Z]+\$43/g, "Consolidado!$D$43:" + U + "43")
        .replace(/Consolidado!\$(?!C\$)[A-Z]+\$59:\$[A-Z]+\$67/g, "Consolidado!" + U + "59:" + U + "67");
    });
  }

  function hEvaluacion(L, D){
    var h = L.hoja("Ev. Subcontratista"), CAP = 104, F1 = 6, F2 = 45, W = porSemana(D);
    var con = Object.keys(W).map(Number).filter(function(k){ return k <= D.n && W[k].ev && Object.keys(W[k].ev).length; }).sort(function(a, b){ return a - b; });
    var desde = con.length ? con[0] : D.n; if(D.n - desde + 1 > CAP) desde = D.n - CAP + 1;
    var bloques = D.n - desde + 1, ultCol = 1 + bloques * 5;
    var subs = []; con.forEach(function(k){ if(k < desde) return; Object.keys(W[k].ev).forEach(function(s){ if(subs.indexOf(s) < 0) subs.push(s); }); });
    subs.sort(); subs = subs.slice(0, F2 - F1 + 1);
    h.quitarMerges("B3:" + colLet(1 + CAP * 5) + "3");
    h.limpiar("B3:" + colLet(1 + CAP * 5) + "3"); h.limpiar("B4:" + colLet(1 + CAP * 5) + "4"); h.limpiar("A" + F1 + ":" + colLet(1 + CAP * 5) + F2);
    var mesAnt = null, iniMes = 2;
    for(var k = desde; k <= D.n; k++){
      var c = 2 + (k - desde) * 5, lun = addD(D.primerLunes, (k - 1) * 7), mes = lun.slice(0, 7);
      if(mes !== mesAnt){ if(mesAnt) h.merge(colLet(iniMes) + "3:" + colLet(c - 1) + "3"); mesAnt = mes; iniMes = c; h.val(colLet(c) + "3", MESES[+mes.slice(5) - 1]); }
      h.val(colLet(c) + "4", serial(lun));
      var ev = (W[k] && W[k].ev) || {};
      subs.forEach(function(s, i){ (ev[s] || []).forEach(function(v, j){ if(v) h.val(colLet(c + j) + (F1 + i), v); }); });
    }
    h.merge(colLet(iniMes) + "3:" + colLet(ultCol) + "3");
    subs.forEach(function(s, i){ h.val("A" + (F1 + i), s); });
    var vis = Math.max(subs.length, 1);
    if(F1 + vis <= F2) h.ocultarFilas(F1 + vis, F2);
    if(ultCol < 1 + CAP * 5) h.ocultarCols(ultCol + 1, 1 + CAP * 5);
    h.sinCache();
  }

  function hMaestro(L, D){
    var h = L.hoja("PLAN MAESTRO V2"), F1 = 10, F2 = 129, C1 = 4, CAP = 104;
    var M = D.maestro, CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    if(!M || !(M.columnas || []).length){ h.ocultarFilas(F1, F2); return; }
    var meses = M.columnas.map(function(c){ var i = CORTO.indexOf(String(c[0]).slice(0,3)); var y = parseInt(c[1], 10); return (i >= 0 && y) ? y + "-" + String(i + 1).padStart(2, "0") : null; });
    var valid = meses.filter(Boolean); if(!valid.length){ h.ocultarFilas(F1, F2); return; }
    var lun0 = lunes(valid[0] + "-01"); if(addD(lun0, 3).slice(0, 7) < valid[0]) lun0 = addD(lun0, 7);
    var finProy = addD(iso(new Date(+valid[valid.length-1].slice(0,4), +valid[valid.length-1].slice(5), 0)), 0);
    var nW = Math.min(CAP, semanasEntre(lun0, finProy) + 1), ultC = C1 + nW - 1;
    var semMes = []; for(var w = 0; w < nW; w++) semMes.push(addD(lun0, w * 7 + 3).slice(0, 7));
    /* actividades agrupadas como en la carta Gantt */
    var acts = [], idx = {};
    (M.notas || []).forEach(function(n){
      var k = n.cat + "|" + String(n.tarea || "").trim().toLowerCase(); var mes = meses[n.col]; if(!mes) return;
      if(!idx[k]){ idx[k] = { cat: n.cat, nombre: n.tarea, meses: {} }; acts.push(idx[k]); }
      idx[k].meses[mes] = 1;
    });
    acts.sort(function(a, b){ return a.cat - b.cat; });
    acts = acts.slice(0, F2 - F1 + 1);
    var amarillo = L.relleno(h.est("D10")), naranja = L.relleno(h.est("D9"));
    var sSem = L.conRelleno(h.est("K11"), 0), s7 = h.est("K7"), s8 = h.est("K8"), s9 = L.conRelleno(h.est("K9"), naranja);
    var base = {}; for(var c = 1; c <= C1 + CAP - 1; c++) base[c] = c <= 3 ? h.est(colLet(c) + "10") : sSem;
    h.quitarMerges("A" + F1 + ":A" + F2); h.quitarMerges("D7:" + colLet(C1 + CAP - 1) + "7");
    h.limpiar("A" + F1 + ":" + colLet(C1 + CAP - 1) + F2); h.limpiar("D7:" + colLet(C1 + CAP - 1) + "8"); h.limpiar("C9:C9");
    var faseAct = null, faseIni = F1;
    acts.forEach(function(a, i){
      var r = F1 + i, fase = (M.categorias || [])[a.cat] || "";
      for(var c = 1; c <= C1 + CAP - 1; c++) h.setEst(colLet(c) + r, base[c]);
      if(fase !== faseAct){ if(faseAct !== null && r - 1 > faseIni) h.merge("A" + faseIni + ":A" + (r - 1)); faseAct = fase; faseIni = r; h.val("A" + r, fase.toUpperCase()); }
      h.val("B" + r, String(a.nombre || "").toUpperCase()); h.val("C" + r, Object.keys(a.meses).length);
      semMes.forEach(function(mes, w){ if(a.meses[mes]) h.setEst(colLet(C1 + w) + r, L.conRelleno(base[C1 + w], amarillo)); });
    });
    if(acts.length && F1 + acts.length - 1 > faseIni) h.merge("A" + faseIni + ":A" + (F1 + acts.length - 1));
    var vis = Math.max(acts.length, 1); if(F1 + vis <= F2) h.ocultarFilas(F1 + vis, F2);
    /* encabezado de meses y semanas */
    var mesAnt = null, iniC = C1;
    semMes.forEach(function(mes, w){
      var c = C1 + w; if(mes !== mesAnt){ if(mesAnt && c - 1 > iniC) h.merge(colLet(iniC) + "7:" + colLet(c - 1) + "7"); mesAnt = mes; iniC = c; h.val(colLet(c) + "7", MESES[+mes.slice(5) - 1]); }
      h.val(colLet(c) + "8", d(addD(lun0, w * 7)).getDate());
      h.setEst(colLet(c) + "7", s7); h.setEst(colLet(c) + "8", s8); h.setEst(colLet(c) + "9", s9);
    });
    if(ultC > iniC) h.merge(colLet(iniC) + "7:" + colLet(ultC) + "7");
    h.val("C9", valid.length);
    if(D.obra) h.val("D3", "PLAN MAESTRO " + D.obra.toUpperCase());
    if(ultC < C1 + CAP - 1) h.ocultarCols(ultC + 1, C1 + CAP - 1);
    h.sinCache();
  }

  function generar(D){
    if(typeof JSZip === "undefined") return Promise.reject(new Error("No se pudo cargar el generador de Excel (JSZip)."));
    var base = (document.currentScript && document.currentScript.src) || "";
    return fetch(PLANTILLA, { cache: "no-cache" }).then(function(r){ if(!r.ok) throw new Error("No se pudo descargar la plantilla (" + r.status + ")"); return r.arrayBuffer(); })
      .then(function(buf){ return JSZip.loadAsync(buf); })
      .then(function(zip){ var L = new Libro(zip); return L.iniciar().then(function(){ return L; }); })
      .then(function(L){
        hLastPlanner(L, D); hMinuta(L, D); hRestricciones(L, D); hConsolidado(L, D); hEvaluacion(L, D); hMaestro(L, D);
        return L.generar();
      });
  }
  window.LP_INFORME_XLSX = { generar: generar, _u: { semanasEntre: semanasEntre, lunes: lunes, addD: addD } };
})();
