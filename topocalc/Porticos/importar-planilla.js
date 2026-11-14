/* Importar planilla (Hoja Maestra .xlsx o Plan de trabajo por día) -> programación compartida de Pórticos.
   Lee las hojas "Programacion ..." (Hoja Maestra) y las hojas de lista con columnas Fecha · Pórtico · Tarea (Plan de trabajo), compara con lo que hay en la app, muestra las diferencias
   y, con el PIN de edición, guarda solo lo que el usuario deja marcado. La planilla manda. */
(function(){
"use strict";
var PM = { "trazado excavacion":"Trazado", "trazado":"Trazado", "excavacion":"Excavación", "emplantillado":"Emplantillado", "instalacion fundacion":"Inst. de Fundación",
  "instalacion barra tierra":"Inst. Malla", "instalacion malla":"Inst. Malla", "relleno lateral":"Relleno", "instalacion portico":"Inst. Pórtico", "instalacion portico (poste)":"Inst. Poste V", "instalacion portico (brazo)":"Inst. Brazo H", "instalacion poste":"Inst. Poste V", "instalacion poste v":"Inst. Poste V", "instalacion brazo":"Inst. Brazo H", "instalacion brazo h":"Inst. Brazo H", "instalacion camaras":"Inst. Cámara" };
var NOTAS = ["Comentarios", "Prevención"];
function sinTilde(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); }
function pad(n){ return String(n).padStart(2, "0"); }
function isoD(d){ return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
function dm(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? m[3] + "-" + m[2] : (iso || ""); }
function nuevoId(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c){ var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
}
function valor(c){
  var v = c && c.value; if(v == null) return null;
  if(v instanceof Date) return v;
  if(typeof v === "object"){ if(v.richText) return v.richText.map(function(t){ return t.text; }).join(""); if("result" in v) return v.result instanceof Date ? v.result : (v.result == null ? null : String(v.result)); if(v.text) return String(v.text); return null; }
  return v;
}

/* ---------- Plan de trabajo por día: lista con columnas Fecha · Pórtico · Tarea (· Equipo) ---------- */
function fechaCelda(v){
  if(v instanceof Date) return isoD(v);
  var s = String(v == null ? "" : v).trim(), m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(s); if(m) return m[3] + "-" + pad(m[2]) + "-" + pad(m[1]);
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? m[1] + "-" + m[2] + "-" + m[3] : null;
}
/* equipo del plan -> responsable de la app (abreviado) y forma de excavar */
function equipoInfo(eq){
  var t = String(eq || ""), par = (/\(([^)]*)\)/.exec(t) || [])[1] || "", nom = sinTilde(t.replace(/\([^)]*\)/g, "")), pk = sinTilde(par), r = { resp:"", obs:"", exc:"" };
  if(nom === "oscar gonzalez") r.resp = "O.G"; else if(nom === "jose ramirez") r.resp = "JR \u00b7 Jefe de Obra"; else if(nom) r.obs = t.replace(/\([^)]*\)/g, "").trim();
  if(/^manual/.test(pk)){ r.exc = "A mano"; r.obsx = "FORMA MANUAL"; } else if(/^maquin/.test(pk)){ r.exc = "Con maquinaria"; r.obsx = "MAQUINA"; }
  return r;
}
function leerLista(ws, buscar){
  var cel = function(r, c){ var row = ws.getRow(r); return valor(row.getCell(c)); }, nR = ws.rowCount, nC = Math.max(ws.columnCount, 8), hdr = 0, col = {};
  for(var r = 1; r <= Math.min(nR, 15) && !hdr; r++){
    var cc = {}; for(var c = 1; c <= nC; c++){ var k = sinTilde(cel(r, c)); if(k) cc[k] = c; }
    if(cc.fecha && cc.portico && cc.tarea){ hdr = r; col = cc; }
  }
  if(!hdr) return null;
  var ev = [], nh = {}, ign = 0;
  for(var r2 = hdr + 1; r2 <= nR; r2++){
    var f = fechaCelda(cel(r2, col.fecha)), port = cel(r2, col.portico), tar = cel(r2, col.tarea);
    if(!f || port == null || port === "" || tar == null || tar === "") continue;
    var part = PM[sinTilde(tar)]; if(!part){ ign++; continue; }
    var nom = String(port).replace(/\([^)]*\)/g, "").trim(), p = buscar(nom); if(!p){ nh[nom] = 1; continue; }
    var eq = col.equipo ? cel(r2, col.equipo) : null, hc = col.hecho ? sinTilde(cel(r2, col.hecho)) : "", ob = col.observacion ? cel(r2, col.observacion) : null;
    /* columna «Hecho»: Listo -> ejecutada; No / A medias -> no ejecutada (el motivo va en Observación); vacío o «En proceso» -> sigue programada */
    var est = hc === "listo" ? "Ejecutado" : (hc === "no" || hc === "a medias" ? "No ejecutado" : "Programado");
    ev.push({ p:p, partida:part, f:f, e:est, eq:eq == null ? "" : String(eq).trim(), obs:ob == null ? "" : String(ob).replace(/\s+/g, " ").trim() });
  }
  return { ev:ev, nh:Object.keys(nh), ign:ign };
}

/* ---------- lectura de la planilla ---------- */
function leerPlanilla(buf, anio, lista){
  var wb = new ExcelJS.Workbook();
  return wb.xlsx.load(buf).then(function(){
    var porNombre = {}; lista.forEach(function(p){ porNombre[sinTilde(p.nombre)] = p; });
    function buscar(n){
      var k = sinTilde(n).replace(/\([^)]*\)/g, "").replace(/\s+/g, ""); if(porNombre[k]) return porNombre[k]; if(porNombre[k + "-a"]) return porNombre[k + "-a"];
      var k2 = k.replace(/^(p\d+)([a-z])$/, "$1-$2"); return porNombre[k2] || null;
    }
    var ev = [], auth = {}, noHallados = {}, hojas = [], esLista = false, matriz = false, ignoradas = 0;
    wb.worksheets.forEach(function(ws){
      var lf = /^programacion/.test(sinTilde(ws.name)) ? null : leerLista(ws, buscar);
      if(lf){ hojas.push(ws.name.trim()); esLista = true; ignoradas += lf.ign; lf.nh.forEach(function(n){ noHallados[n] = 1; }); lf.ev.forEach(function(e){ ev.push(e); }); return; }
      if(!/^programacion/.test(sinTilde(ws.name))) return; hojas.push(ws.name.trim()); matriz = true;
      var rows = []; ws.eachRow({ includeEmpty:true }, function(r, i){ rows[i] = r; });
      var cel = function(r, c){ return rows[r] ? valor(rows[r].getCell(c)) : null; };
      var nR = ws.rowCount, nC = Math.max(ws.columnCount, 16), hdr = null;
      for(var r = 1; r <= nR; r++){
        if(sinTilde(cel(r + 2, 1)) === "quien autoriza"){ hdr = r; continue; }
        if(!hdr) continue;
        var lab = cel(r, 1); if(lab == null || typeof lab !== "string") continue;
        var kl = sinTilde(lab), esAuth = kl === "estado autorizacion", esOrg = kl === "quien autoriza", part = PM[kl];
        if(!esAuth && !esOrg && !part) continue;
        for(var c = 2; c <= nC; c++){
          var nom = cel(hdr, c); if(nom == null || nom === "") continue;
          var p = buscar(nom); if(!p){ noHallados[String(nom).trim()] = 1; continue; }
          var v = cel(r, c);
          if(esOrg){ (auth[p.nombre] = auth[p.nombre] || {}).org = v; continue; }
          if(esAuth){ (auth[p.nombre] = auth[p.nombre] || {}).est = v; continue; }
          if(v == null || v === "") continue;
          if(v instanceof Date){ ev.push({ p:p, partida:part, f:isoD(v), e:"Programado" }); continue; }
          var s = String(v), re = /([X✓✔xX])\s*(\d{1,2})-(\d{1,2})-(\d{4})/g, m, hay = false;
          while((m = re.exec(s))){ hay = true; ev.push({ p:p, partida:part, f:m[4] + "-" + pad(m[3]) + "-" + pad(m[2]), e:/^[✓✔]$/.test(m[1]) ? "Ejecutado" : "No ejecutado" }); }
          if(!hay){ var m2 = /^\s*(\d{1,2})-(\d{1,2})(?:-(\d{4}))?\s*$/.exec(s); if(m2) ev.push({ p:p, partida:part, f:(m2[3] || anio) + "-" + pad(m2[2]) + "-" + pad(m2[1]), e:"Programado" }); }
        }
      }
    });
    /* la misma actividad puede venir de la hoja de lista y de la Hoja Maestra: se deja una sola, con el equipo si alguna lo trae */
    var vis = {}, unico = [];
    ev.forEach(function(e){ var k = e.p.num + "|" + e.partida + "|" + e.f + "|" + e.e, x = vis[k]; if(!x){ vis[k] = e; unico.push(e); } else { if(!x.eq && e.eq) x.eq = e.eq; if(!x.obs && e.obs) x.obs = e.obs; } });
    ev = unico;
    var rango = null, partL = {};
    if(esLista && !matriz && ev.length){ ev.forEach(function(e){ partL[e.partida] = 1; if(!rango) rango = { d:e.f, h:e.f }; if(e.f < rango.d) rango.d = e.f; if(e.f > rango.h) rango.h = e.f; }); }
    return { ev:ev, auth:auth, noHallados:Object.keys(noHallados), hojas:hojas, rango:rango, partL:partL, ignoradas:ignoradas };
  });
}

/* ---------- comparación ---------- */
function comparar(pl, prog, avance, lista, cond){
  var porNum = {}; lista.forEach(function(p){ porNum[String(p.num)] = p; });
  var cubiertos = {}; pl.ev.forEach(function(e){ cubiertos[e.p.num] = 1; });
  var execK = {}; pl.ev.forEach(function(e){ if(e.e !== "Programado") execK[e.p.num + "|" + e.partida] = 1; });
  var keys = {};   /* clave pórtico|partida -> {p, partida, T:[objetivos], A:[filas app]} */
  function K(p, partida){ var k = p.num + "|" + partida; return keys[k] = keys[k] || { p:p, partida:partida, T:[], A:[] }; }
  pl.ev.forEach(function(e){ K(e.p, e.partida).T.push({ f:e.f, e:e.e, eq:e.eq || "", obs:e.obs || "" }); });
  prog.forEach(function(r){
    if(NOTAS.indexOf(r.partida) >= 0) return; if(!cubiertos[String(r.portico)]) return;
    if(pl.rango && (r.fecha < pl.rango.d || r.fecha > pl.rango.h || !pl.partL[r.partida]) && !(pl.partL[r.partida] && execK[r.portico + "|" + r.partida] && /^programado/i.test(r.estado))) return;   /* fuera del período solo entra lo programado de una tarea que la planilla da por ejecutada o no ejecutada: se reutiliza en vez de duplicarla */   /* plan de trabajo: solo se compara el período y las partidas que trae */ if(!PM[sinTilde(r.partida)] && !/^inst\./i.test(r.partida) && !/^(trazado|excavaci|emplantillado|relleno)/i.test(r.partida)) return;
    var p = porNum[String(r.portico)]; if(!p) return; K(p, r.partida).A.push(r);
  });
  /* si una partida ejecutada también trae "X" antes, el ✓ es lo definitivo; si hay ✓ no se agrega "programado" */
  var ops = [], avisos = [];
  var clase = function(s){ return /^ejecutado/i.test(s) ? "Ejecutado" : (/^no ejecutado/i.test(s) ? "No ejecutado" : "Programado"); };
  Object.keys(keys).forEach(function(k){
    var g = keys[k], T = g.T.slice(), A = g.A.slice();
    if(T.some(function(t){ return t.e === "Ejecutado"; })) T = T.filter(function(t){ return t.e !== "Programado"; });
    /* 1) coincidencias exactas */
    for(var i = T.length - 1; i >= 0; i--){
      var j = -1; A.forEach(function(a, x){ if(j < 0 && a.fecha === T[i].f && clase(a.estado) === T[i].e) j = x; });
      if(j >= 0){ T.splice(i, 1); A.splice(j, 1); }
    }
    /* 2) pares por prioridad de estado */
    ["Ejecutado", "No ejecutado", "Programado"].forEach(function(est){
      for(var i = T.length - 1; i >= 0; i--){
        if(T[i].e !== est) continue;
        var orden = est === "Ejecutado" ? ["Ejecutado", "Programado", "No ejecutado"] : (est === "No ejecutado" ? ["No ejecutado", "Programado"] : ["Programado"]), j = -1;
        orden.forEach(function(oc){ if(j < 0) A.forEach(function(a, x){ if(j < 0 && clase(a.estado) === oc) j = x; }); });
        if(j >= 0){
          var a = A.splice(j, 1)[0], t = T.splice(i, 1)[0], antes = clase(a.estado) + " " + dm(a.fecha);
          var n = {}; for(var f in a) n[f] = a[f]; n.fecha = t.f; n.estado = t.e; if(t.obs && String(n.obs || "").indexOf(t.obs) < 0) n.obs = (n.obs ? n.obs + " \u00b7 " : "") + t.obs; if(t.e === "Ejecutado" && !/^\d/.test(String(n.avance || ""))) n.avance = "100"; if(t.e === "Ejecutado" && String(n.avance || "") === "") n.avance = "100";
          ops.push({ g: t.e === "Ejecutado" && clase(a.estado) !== "Ejecutado" ? "ejec" : (t.e === "No ejecutado" ? "noej" : "fecha"), tipo:"upd", nota:n, texto:g.p.nombre + " · " + g.partida + ": " + antes + " → " + t.e + " " + dm(t.f) });
        }
      }
    });
    /* 3) lo que falta: crear */
    T.forEach(function(t){
      var eqi = equipoInfo(t.eq), otra = prog.filter(function(r){ return String(r.portico) === String(g.p.num); }).sort(function(x, y){ return x.fecha < y.fecha ? 1 : -1; })[0];
      var n = { id:nuevoId(), fecha:t.f, portico:Number(g.p.num), nombre:g.p.nombre, comuna:g.p.comuna, partida:g.partida, estado:t.e, autorizacion:(otra && otra.autorizacion) || "Sí", obs:[eqi.obs || eqi.obsx || "", t.obs || ""].filter(Boolean).join(" \u00b7 "), responsable:eqi.resp, avance:t.e === "Ejecutado" ? "100" : "", restriccion:"", causa:"", accion:"" };
      ops.push({ g: t.e === "Ejecutado" ? "ejec" : (t.e === "No ejecutado" ? "noej" : "prog"), tipo:"new", nota:n, texto:g.p.nombre + " · " + g.partida + ": nueva " + t.e.toLowerCase() + " " + dm(t.f) });
    });
    /* 4) sobrantes de la app: se borra solo lo "programado"; lo ejecutado o no ejecutado nunca se toca */
    A.forEach(function(a){
      if(clase(a.estado) === "Programado") ops.push({ g:"del", tipo:"del", id:a.id, texto:g.p.nombre + " · " + g.partida + ": programada " + dm(a.fecha) + " ya no está en la planilla" });
      else avisos.push(g.p.nombre + " · " + g.partida + ": en la app figura " + clase(a.estado).toLowerCase() + " " + dm(a.fecha) + " y la planilla no lo trae (no se toca)");
    });
  });
  /* avance oficial (registros al 100 %) que faltan para lo ejecutado en la planilla */
  var tieneAv = {}; avance.forEach(function(a){ if(NOTAS.indexOf(a.partida) >= 0) return; if(a.avance === "" || a.avance == null || parseFloat(a.avance) >= 100) tieneAv[String(a.portico) + "|" + a.partida] = 1; });
  var vistos = {};
  pl.ev.forEach(function(e){
    if(e.e !== "Ejecutado") return; var k = e.p.num + "|" + e.partida; if(tieneAv[k] || vistos[k]) return; vistos[k] = 1;
    ops.push({ g:"avance", tipo:"reg", body:{ accion:"registrar", portico:Number(e.p.num), partida:e.partida, fecha:e.f, obs:e.obs || "Importado de la Hoja Maestra", avance:"100" }, texto:e.p.nombre + " · " + e.partida + ": registro de avance 100 % (" + dm(e.f) + ")" });
  });
  /* forma de excavar (a mano / con maquinaria) que trae el plan: queda como condición del pórtico */
  var cv = {}; pl.ev.forEach(function(e){
    if(e.partida !== "Excavación" || !e.eq) return; var x = equipoInfo(e.eq).exc; if(!x) return;
    var k = e.p.num; if(cv[k] || (cond || {})[k + "|exc"] === x) return; cv[k] = 1;
    ops.push({ g:"cond", tipo:"reg", body:{ accion:"registrar", portico:Number(e.p.num), partida:"Comentarios", fecha:e.f, obs:"[COND] exc=" + x, avance:"" }, texto:e.p.nombre + " · excavación " + x.toLowerCase() });
  });
  ops.sort(function(a, b){ return a.texto < b.texto ? -1 : 1; });
  return { ops:ops, avisos:avisos };
}

/* tareas repetidas el mismo día (mismo pórtico, partida y fecha, ambas programadas): se conserva la que trae más datos (responsable, observación); si empatan, la más nueva */
function duplicadas(prog){
  var g = {}, ops = [], avisos = [];
  prog.forEach(function(r, i){ if(NOTAS.indexOf(r.partida) >= 0) return; var k = r.portico + "|" + r.partida + "|" + r.fecha; (g[k] = g[k] || []).push({ r:r, i:i }); });
  Object.keys(g).forEach(function(k){
    var l = g[k]; if(l.length < 2) return;
    var est = l.map(function(x){ return /^ejecutado/i.test(x.r.estado) ? "E" : (/^no ejecutado/i.test(x.r.estado) ? "N" : "P"); });
    if(est.some(function(e){ return e !== "P"; })){ avisos.push(l[0].r.nombre + " · " + l[0].r.partida + " " + dm(l[0].r.fecha) + ": figura repetida con estados distintos (" + l.map(function(x){ return x.r.estado; }).join(" / ") + "); revísala a mano."); return; }
    var sc = function(x){ return (x.r.responsable ? 2 : 0) + (x.r.obs ? 1 : 0); };
    var best = l.reduce(function(a, b){ return sc(b) >= sc(a) ? b : a; });
    l.forEach(function(x){
      if(x === best) return;
      var perd = (x.r.obs && x.r.obs !== best.r.obs ? " · pierde obs. «" + x.r.obs + "»" : "") + (x.r.responsable && x.r.responsable !== best.r.responsable ? " · pierde resp. " + x.r.responsable : "");
      ops.push({ g:"dup", tipo:"del", id:x.r.id, texto:x.r.nombre + " · " + x.r.partida + " " + dm(x.r.fecha) + ": se elimina la copia repetida" + perd });
    });
  });
  ops.sort(function(a, b){ return a.texto < b.texto ? -1 : 1; });
  return { ops:ops, avisos:avisos };
}

/* ---------- interfaz ---------- */
var GRUPOS = [ ["ejec", "Pasan a ejecutadas", true], ["fecha", "Cambian de fecha", true], ["prog", "Nuevas programadas", true], ["noej", "No ejecutadas", true], ["cond", "Excavación: a mano o con maquinaria (condición del pórtico)", true], ["dup", "Tareas repetidas el mismo día (se elimina la copia sobrante)", true], ["del", "Programadas que ya no están en la planilla (se borran)", true], ["avance", "Registros de avance 100 % (opcional, sin fotos)", false] ];
function abrir(){
  var api = window.PORTICOS_API; if(!api){ alert("Sin conexión con la planilla compartida."); return; }
  var ov = document.createElement("div"); ov.className = "bg-ov"; ov.style.overflow = "auto";
  ov.innerHTML = '<div class="bg-card" role="dialog" aria-modal="true" aria-label="Importar planilla" style="max-width:620px;max-height:92vh;display:flex;flex-direction:column">'
    + '<div class="bg-h"><strong>📥 Importar planilla</strong><button type="button" class="bg-x" aria-label="Cerrar">✕</button></div>'
    + '<div class="bg-b" style="overflow:auto"><p class="bg-t ip-t">Elige la Hoja Maestra o el Plan de trabajo por día (.xlsx). Se compara con lo que hay en la app y tú decides qué guardar. La planilla manda.</p>'
    + '<input type="file" class="ip-file" accept=".xlsx,.xlsm"> <button type="button" class="btn-sm ip-dup">🧹 Buscar tareas repetidas</button><div class="ip-res"></div>'
    + '<label class="bg-pinl ip-pin" style="display:none">PIN de edición<input type="password" class="bg-pin" inputmode="numeric" autocomplete="off" maxlength="8"></label>'
    + '<div class="bg-msg ip-msg"></div></div>'
    + '<div class="bg-acc"><button type="button" class="bg-ok ip-ok" disabled>Guardar seleccionado</button><button type="button" class="btn-link bg-no">Cerrar</button></div></div>';
  document.body.appendChild(ov);
  var $ = function(s){ return ov.querySelector(s); }, msg = $(".ip-msg"), cerrar = function(){ ov.remove(); }, R = null;
  $(".bg-x").onclick = cerrar; $(".bg-no").onclick = cerrar;
  function cargarExcelJS(){
    if(typeof ExcelJS !== "undefined") return Promise.resolve();
    return new Promise(function(ok, no){ var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"; sc.onload = function(){ typeof ExcelJS !== "undefined" ? ok() : no(new Error("ExcelJS")); }; sc.onerror = function(){ no(new Error("ExcelJS")); }; document.head.appendChild(sc); });
  }
  function contar(){ var n = 0; ov.querySelectorAll(".ip-g").forEach(function(cb){ if(cb.checked) n += +cb.dataset.n; }); $(".ip-ok").disabled = !n; $(".ip-ok").textContent = n ? "Guardar " + n + " cambio" + (n === 1 ? "" : "s") : "Guardar seleccionado"; }
  function pintar(pl){
      var por = {}; R.ops.forEach(function(o){ (por[o.g] = por[o.g] || []).push(o); });
      var h = !pl ? '' : '<p class="ip-sub">Hojas leídas: ' + esc(pl.hojas.join(", ")) + ' · ' + pl.ev.length + ' marcas de actividad' + (pl.rango ? ' entre el ' + dm(pl.rango.d) + ' y el ' + dm(pl.rango.h) : '') + (pl.ignoradas ? ' · ' + pl.ignoradas + ' tareas que no son partidas de pórtico se ignoran' : '') + '.</p>';
      if(!R.ops.length) h += '<p><b>' + (pl ? 'La app ya coincide con la planilla.' : 'No hay tareas repetidas.') + '</b></p>';
      GRUPOS.forEach(function(g){
        var l = por[g[0]] || []; if(!l.length) return;
        h += '<details class="ip-d" style="margin:8px 0;border:1px solid var(--line);border-radius:8px;padding:6px 10px"><summary style="cursor:pointer"><label style="display:inline-flex;gap:8px;align-items:center"><input type="checkbox" class="ip-g" data-g="' + g[0] + '" data-n="' + l.length + '"' + (g[2] ? " checked" : "") + '> <b>' + esc(g[1]) + '</b> (' + l.length + ')</label></summary>'
          + '<ul style="margin:6px 0 2px 18px;font-size:.82rem">' + l.map(function(o){ return "<li>" + esc(o.texto) + "</li>"; }).join("") + "</ul></details>";
      });
      if(R.avisos.length) h += '<details style="margin:8px 0"><summary><b>Avisos (' + R.avisos.length + ')</b> · no se modifican</summary><ul style="margin:6px 0 2px 18px;font-size:.82rem">' + R.avisos.map(function(a){ return "<li>" + esc(a) + "</li>"; }).join("") + "</ul></details>";
      if(pl && pl.noHallados.length) h += '<p class="ip-sub">Pórticos de la planilla que no existen en la app (se ignoran): ' + esc(pl.noHallados.join(", ")) + '.</p>';
    return h;
  }
  $(".ip-dup").onclick = function(){
    var D = window.PORTICOS_DATOS ? window.PORTICOS_DATOS() : null; if(!D || !D.prog || !D.prog.length){ msg.textContent = "La app aún no cargó la programación. Espera unos segundos y reintenta."; return; }
    R = duplicadas(D.prog); R.pl = null; $(".ip-file").value = "";
    var h = pintar(null); $(".ip-res").innerHTML = h; msg.textContent = ""; $(".ip-pin").style.display = R.ops.length ? "" : "none";
    ov.querySelectorAll(".ip-g").forEach(function(cb){ cb.onchange = contar; }); contar();
  };
  $(".ip-file").onchange = function(){
    var f = this.files && this.files[0]; if(!f) return; msg.textContent = "Leyendo planilla…"; $(".ip-res").innerHTML = "";
    var D = window.PORTICOS_DATOS ? window.PORTICOS_DATOS() : null; if(!D || !D.lista || !D.lista.length){ msg.textContent = "La app aún no cargó los datos de la planilla compartida. Espera unos segundos y reintenta."; return; }
    var anio = (D.hoy || new Date().toISOString()).slice(0, 4);
    Promise.all([cargarExcelJS(), f.arrayBuffer()]).then(function(r){ return leerPlanilla(r[1], anio, D.lista); }).then(function(pl){
      if(!pl.hojas.length) throw new Error("No encontré hojas de programación en este archivo (Hoja Maestra «Programacion …» o una lista con columnas Fecha, Pórtico y Tarea).");
      R = comparar(pl, D.prog || [], D.avance || [], D.lista, D.cond || {}); R.pl = pl;
      var h = pintar(pl);
      $(".ip-res").innerHTML = h; msg.textContent = ""; $(".ip-pin").style.display = R.ops.length ? "" : "none";
      ov.querySelectorAll(".ip-g").forEach(function(cb){ cb.onchange = contar; }); contar();
    }).catch(function(e){ msg.textContent = "No se pudo leer la planilla: " + (e && e.message ? e.message : e); });
  };
  $(".ip-ok").onclick = function(){
    var btn = this, pin = $(".bg-pin").value.trim(); if(!pin){ msg.textContent = "Ingresa el PIN."; $(".bg-pin").focus(); return; }
    var sel = {}; ov.querySelectorAll(".ip-g").forEach(function(cb){ if(cb.checked) sel[cb.dataset.g] = 1; });
    var ops = R.ops.filter(function(o){ return sel[o.g]; }); if(!ops.length) return;
    if(!confirm("Se guardarán " + ops.length + " cambios en la planilla compartida, para todos. ¿Continuar?")) return;
    btn.disabled = true; if(window.PORTICOS_AUTOR) window.PORTICOS_AUTOR.pedir();
    var notas = ops.filter(function(o){ return o.tipo === "upd" || o.tipo === "new"; }).map(function(o){ return o.nota; }),
        dels = ops.filter(function(o){ return o.tipo === "del"; }).map(function(o){ return o.id; }),
        regs = ops.filter(function(o){ return o.tipo === "reg"; }).map(function(o){ return o.body; }), hechos = 0, total = ops.length, ultimo = null;
    function lote(arr, n){ var o = []; for(var i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }
    function prog(){ msg.textContent = "Guardando… " + hechos + " de " + total; }
    function sec(fns){ return fns.reduce(function(p, fn){ return p.then(fn); }, Promise.resolve()); }
    function chk(j){ if(!j || !j.ok){ if(j && /PIN/.test(j.error || "")) api.setPin(""); throw new Error((j && j.error) || "El servidor no aceptó el cambio."); } ultimo = j; return j; }
    var pasos = [];
    lote(notas, 20).forEach(function(l){ pasos.push(function(){ prog(); var p = api.v2() ? api.enviar({ accion:"guardarNotas", pin:pin, notas:l }).then(chk) : sec(l.map(function(n){ return function(){ return api.enviar({ accion:"guardarNota", pin:pin, nota:n }).then(chk); }; })); return p.then(function(){ hechos += l.length; }); }); });
    lote(dels, 30).forEach(function(l){ pasos.push(function(){ prog(); return api.enviar({ accion:"borrarNotas", ids:l, pin:pin }).then(chk).then(function(){ hechos += l.length; }); }); });
    regs.forEach(function(b){ pasos.push(function(){ prog(); var body = {}; for(var k in b) body[k] = b[k]; body.pin = pin; body.id = nuevoId(); return api.enviar(body).then(chk).then(function(){ hechos++; }); }); });
    sec(pasos).then(function(){
      api.setPin(pin); if(ultimo) api.aplicar(ultimo);
      msg.innerHTML = "✓ Listo: " + hechos + " cambios guardados para todos. <button type=\"button\" class=\"btn-link ip-rec\">Recargar la app</button>";
      var b = msg.querySelector(".ip-rec"); if(b) b.onclick = function(){ location.reload(); };
      $(".ip-res").innerHTML = ""; $(".ip-pin").style.display = "none"; btn.style.display = "none";
    }).catch(function(e){
      msg.textContent = "Se detuvo tras " + hechos + " de " + total + " cambios: " + (e && e.message ? e.message : "sin respuesta del servidor") + ". Vuelve a importar la planilla: solo se propondrá lo que falte."; btn.disabled = false;
    });
  };
}
window.PORTICOS_IMPORTAR = { abrir:abrir, _t:{ leerPlanilla:leerPlanilla, comparar:comparar, duplicadas:duplicadas } };
})();
