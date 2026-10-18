/* Mi proyecto: guardar en archivo y en la planilla de Google de cada usuario.
   Los datos viven siempre en este equipo (localStorage); aquí se respaldan/sincronizan como un solo "proyecto". */
(function(){
"use strict";
var CID = window.LP_GOOGLE_CLIENT_ID || "";
var OBRA2 = /lastplanner-obra2/.test(location.pathname);
var KEYRE = OBRA2 ? /^obra2-(?!tour|remoto)/ : /^(pizarra-(?!theme)|lastplanner-(?!remoto|pin|autor|tour)|pac-)/;
var SCOPE = "https://www.googleapis.com/auth/drive.file";
var NOMBRE = "GeoMAV Last Planner" + (OBRA2 ? " · Obra 2" : "") + " · Datos";
var LSG = "lp-google-v1" + (OBRA2 ? "-o2" : ""), LSMOD = "lp-mod-v1" + (OBRA2 ? "-o2" : ""), LSAV = "lp-aviso-v1";
var MODO = window.LP_MODO || "personal";
var KEYS_RES = OBRA2 ? [["Semanal","obra2-semanal-v1"],["Intermedio","obra2-planificacion-v2"],["Plan Maestro","obra2-maestro-v1"]]
                     : [["Semanal","pizarra-semanal-v1"],["Intermedio","pizarra-planificacion-v2"],["Plan Maestro","pizarra-maestro-v1"]];
var aplicando = false, sucio = null, estG = "", estF = "", fh = null, fhPermiso = false, tok = null, tokExp = 0, ocupado = false, remotoNuevo = null;

function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function jget(k, d){ try{ var v = JSON.parse(lsGet(k) || "null"); return v == null ? d : v; }catch(e){ return d; } }
function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
function hhmm(t){ var d = new Date(t); return ("0"+d.getHours()).slice(-2) + ":" + ("0"+d.getMinutes()).slice(-2); }
function g(){ return jget(LSG, {}); }
function setG(o){ var a = g(); for(var k in o) a[k] = o[k]; lsSet(LSG, JSON.stringify(a)); }
function modLocal(){ return Number(lsGet(LSMOD)) || 0; }

/* ---------- foto del proyecto ---------- */
function snapshot(){
  var datos = {};
  try{ for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(KEYRE.test(k)) datos[k] = localStorage.getItem(k); } }catch(e){}
  return { app:"geomav-lastplanner", v:1, pagina: OBRA2 ? "obra2" : "principal", t: modLocal() || Date.now(), exportado: new Date().toISOString(), datos: datos };
}
function valido(s){ return s && s.app === "geomav-lastplanner" && s.datos && typeof s.datos === "object"; }
function aplicar(s){
  aplicando = true;
  try{
    var borrar = []; for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(KEYRE.test(k) && !(k in s.datos)) borrar.push(k); }
    borrar.forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(s.datos).forEach(function(k){ if(KEYRE.test(k) && typeof s.datos[k] === "string") localStorage.setItem(k, s.datos[k]); });
    lsSet(LSMOD, String(s.t || Date.now()));
  } finally { aplicando = false; }
}
/* detectar cambios en los datos del proyecto */
(function(){
  var P = Storage.prototype, set = P.setItem, rem = P.removeItem;
  function nota(k){ if(aplicando || !KEYRE.test(String(k))) return; try{ set.call(localStorage, LSMOD, String(Date.now())); }catch(e){} cambio(); }
  P.setItem = function(k, v){ var r = set.apply(this, arguments); if(this === localStorage) nota(k); return r; };
  P.removeItem = function(k){ var r = rem.apply(this, arguments); if(this === localStorage) nota(k); return r; };
})();

/* ---------- archivo ---------- */
function descargar(blob, nombre){
  var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function nombreArchivo(){ var d = new Date(); return "LastPlanner" + (OBRA2 ? "_Obra2" : "") + "_" + d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2) + ".json"; }
function guardarArchivo(){
  descargar(new Blob([JSON.stringify(snapshot())], { type:"application/json" }), nombreArchivo());
  estF = "✓ Archivo descargado " + hhmm(Date.now()); lsSet(LSAV, "1"); pintar();
}
function abrirArchivo(){
  var inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
  inp.onchange = function(){
    var f = inp.files && inp.files[0]; if(!f) return;
    f.text().then(function(t){
      var s; try{ s = JSON.parse(t); }catch(e){ s = null; }
      if(!valido(s)){ alert("Ese archivo no es un proyecto de Last Planner."); return; }
      if(confirm("Se reemplazan los datos de este equipo por los del archivo \"" + f.name + "\".\n\nSi tienes cambios que no guardaste, primero usa \"Guardar en un archivo\".\n\n¿Continuar?")){ aplicar(s); location.reload(); }
    });
  };
  inp.click();
}
/* archivo vinculado (Chrome/Edge de escritorio): se guarda solo, sin descargas */
var FSA = !!window.showSaveFilePicker;
function idb(){ return new Promise(function(ok, ko){ var r = indexedDB.open("lp-proyecto", 1); r.onupgradeneeded = function(){ r.result.createObjectStore("h"); }; r.onsuccess = function(){ ok(r.result); }; r.onerror = function(){ ko(r.error); }; }); }
function idbGet(k){ return idb().then(function(d){ return new Promise(function(ok){ var q = d.transaction("h").objectStore("h").get(k); q.onsuccess = function(){ ok(q.result); }; q.onerror = function(){ ok(null); }; }); }).catch(function(){ return null; }); }
function idbSet(k, v){ return idb().then(function(d){ return new Promise(function(ok){ var t = d.transaction("h", "readwrite"); t.objectStore("h").put(v, k); t.oncomplete = ok; t.onerror = ok; }); }).catch(function(){}); }
function idbDel(k){ return idb().then(function(d){ return new Promise(function(ok){ var t = d.transaction("h", "readwrite"); t.objectStore("h").delete(k); t.oncomplete = ok; t.onerror = ok; }); }).catch(function(){}); }
var FHK = "fh-" + (OBRA2 ? "o2" : "p");
function vincular(){
  window.showSaveFilePicker({ suggestedName: nombreArchivo(), types:[{ description:"Proyecto Last Planner", accept:{ "application/json":[".json"] } }] }).then(function(h){
    fh = h; fhPermiso = true; return idbSet(FHK, h).then(escribirArchivo);
  }).catch(function(e){ if(e && e.name !== "AbortError") alert("No se pudo vincular el archivo."); });
}
function reconectar(){
  if(!fh) return;
  fh.requestPermission({ mode:"readwrite" }).then(function(p){ fhPermiso = p === "granted"; if(fhPermiso) escribirArchivo(); pintar(); });
}
function desvincular(){ fh = null; fhPermiso = false; idbDel(FHK).then(function(){ estF = ""; pintar(); }); }
function escribirArchivo(){
  if(!fh || !fhPermiso) return Promise.resolve();
  return fh.createWritable().then(function(w){ return w.write(JSON.stringify(snapshot())).then(function(){ return w.close(); }); })
    .then(function(){ estF = "✓ Guardado en " + fh.name + " · " + hhmm(Date.now()); pintar(); })
    .catch(function(){ estF = "⚠ No se pudo escribir en el archivo vinculado"; pintar(); });
}
if(FSA) idbGet(FHK).then(function(h){
  if(!h) return; fh = h;
  (h.queryPermission ? h.queryPermission({ mode:"readwrite" }) : Promise.resolve("prompt")).then(function(p){ fhPermiso = p === "granted"; estF = fhPermiso ? "Vinculado a " + h.name : "Vinculado a " + h.name + " · falta permitir el acceso"; pintar(); });
});

/* ---------- Google (planilla propia del usuario) ---------- */
function gis(){
  if(window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
  return new Promise(function(ok, ko){ var s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = ok; s.onerror = function(){ ko(new Error("No se pudo cargar Google (¿sin conexión?)")); }; document.head.appendChild(s); });
}
function token(){
  if(tok && Date.now() < tokExp - 60000) return Promise.resolve(tok);
  return gis().then(function(){ return new Promise(function(ok, ko){
    var tc = google.accounts.oauth2.initTokenClient({ client_id: CID, scope: SCOPE,
      callback: function(r){ if(r.error){ ko(new Error(r.error)); return; } tok = r.access_token; tokExp = Date.now() + (r.expires_in || 3600) * 1000; ok(tok); },
      error_callback: function(e){ ko(new Error((e && e.type) || "popup")); } });
    tc.requestAccessToken({ prompt: g().id ? "" : "consent" });
  }); });
}
function gj(url, opt){
  return token().then(function(t){
    opt = opt || {}; opt.headers = Object.assign({ Authorization: "Bearer " + t }, opt.headers || {});
    return fetch(url, opt);
  }).then(function(r){ return r.json().then(function(j){ if(!r.ok){ var e = new Error((j.error && j.error.message) || ("Error " + r.status)); e.status = r.status; throw e; } return j; }); });
}
function post(url, body){ return gj(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) }); }
var SH = "https://sheets.googleapis.com/v4/spreadsheets/";
function buscarPlanilla(){
  var q = "name='" + NOMBRE.replace(/'/g, "\\'") + "' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  return gj("https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(q) + "&fields=files(id,webViewLink)&orderBy=modifiedTime%20desc&pageSize=1").then(function(j){ return j.files && j.files[0] ? { id: j.files[0].id, url: j.files[0].webViewLink } : null; });
}
function crearPlanilla(){
  return post(SH.replace(/\/$/, ""), { properties:{ title: NOMBRE, locale:"es_CL" }, sheets:[{ properties:{ title:"Datos", gridProperties:{ frozenRowCount:1 } } }, { properties:{ title:"Resumen", gridProperties:{ frozenRowCount:1 } } }] })
    .then(function(j){ return { id: j.spreadsheetId, url: j.spreadsheetUrl }; });
}
function planilla(){
  var s = g(); if(s.id) return Promise.resolve(s);
  return buscarPlanilla().then(function(p){ return p || crearPlanilla(); }).then(function(p){ setG({ id:p.id, url:p.url }); return g(); });
}
/* si el usuario borró la planilla, se vuelve a buscar o crear */
function conPlanilla(fn){
  return planilla().then(function(p){ return fn(p.id); }).catch(function(e){
    if(e.status === 404){ setG({ id:"", url:"", t:0, l:0 }); return planilla().then(function(p){ return fn(p.id); }); }
    throw e;
  });
}
function resumen(){
  var out = [["Tablero","Fase","Semana / mes","Tarea","Responsable","Avance %","Cumplido","Causa"]];
  KEYS_RES.forEach(function(kk){
    var st = jget(kk[1], null); if(!st || !st.notes) return;
    var cats = {}, wks = {};
    (st.categories || []).forEach(function(c){ cats[c.id] = c.name; });
    (st.weeks || []).forEach(function(w){ wks[w.id] = [w.label, w.month].filter(String).join(" "); });
    st.notes.forEach(function(n){ out.push([kk[0], cats[n.catId] || "", wks[n.weekId] || "", String(n.text || ""), String(n.responsable || ""), String(n.percent == null ? "" : n.percent), n.cumplido === true ? "Sí" : (n.cumplido === false ? "No" : ""), String(n.causa || "")]); });
  });
  return out;
}
function empujar(){
  var snap = snapshot(), t0 = Date.now(), filas = [["Clave","Parte","Contenido (no editar: lo usa la app)"], ["_meta","0", JSON.stringify({ t: snap.t, app: snap.app, v: snap.v, pagina: snap.pagina })]];
  Object.keys(snap.datos).forEach(function(k){ var s = snap.datos[k]; for(var p = 0, n = 0; p < s.length || n === 0; p += 45000, n++) filas.push([k, String(n), s.substr(p, 45000)]); });
  return conPlanilla(function(id){
    return post(SH + id + "/values:batchClear", { ranges:["Datos!A:C","Resumen!A:H"] }).then(function(){
      return post(SH + id + "/values:batchUpdate", { valueInputOption:"RAW", data:[{ range:"Datos!A1", values: filas }, { range:"Resumen!A1", values: resumen() }] });
    }).then(function(){ setG({ t: snap.t, l: t0 }); });
  });
}
function leerRemoto(soloMeta){
  return conPlanilla(function(id){
    return gj(SH + id + "/values/" + (soloMeta ? "Datos!A2:C2" : "Datos!A:C") + "?majorDimension=ROWS").then(function(j){
      var v = j.values || [], datos = {}, meta = null;
      v.forEach(function(r, i){
        if(r[0] === "_meta"){ try{ meta = JSON.parse(r[2] || "{}"); }catch(e){} return; }
        if(soloMeta || i === 0 && r[0] === "Clave") return;
        datos[r[0]] = (datos[r[0]] || "") + (r[2] || "");
      });
      return meta ? { t: meta.t || 0, snap: soloMeta ? null : { app: meta.app, v: meta.v, t: meta.t, datos: datos } } : null;
    });
  });
}
/* ¿este equipo tiene trabajo real? (tareas en los tableros o registros PAC) */
function contenido(){
  for(var i = 0; i < KEYS_RES.length; i++){ var st = jget(KEYS_RES[i][1], null); if(st && st.notes && st.notes.length) return true; }
  if(!OBRA2){ var r = jget("pac-registros-v1", []); if(Array.isArray(r) && r.some(function(x){ return !x.ej; })) return true; }
  return false;
}
function conflicto(rt){
  return new Promise(function(res){
    var ov = document.createElement("div"); ov.className = "sel-overlay";
    ov.innerHTML = '<div class="sel-box" role="dialog" aria-modal="true"><h3>Tu planilla y este equipo son distintos</h3><p>La planilla de tu Google tiene datos guardados' + (rt ? " (" + new Date(rt).toLocaleString("es-CL") + ")" : "") + ' y este equipo también tiene cambios propios. ¿Cuál conservas?</p><div class="sel-actions" style="flex-wrap:wrap"><button type="button" class="btn-sm" data-c="no">Cancelar</button><button type="button" class="btn-sm" data-c="pla">Usar la planilla</button><button type="button" class="btn-sm sel-ok" data-c="loc">Usar este equipo</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function(e){ var c = e.target.dataset && e.target.dataset.c; if(c || e.target === ov){ ov.remove(); res(c || "no"); } });
  });
}
function sincronizar(manual){
  if(ocupado) return Promise.resolve(); ocupado = true; estG = "Sincronizando…"; pintar();
  return leerRemoto(false).then(function(r){
    var s = g(), hayLocal = contenido(), dirty = modLocal() > (s.l || 0) && hayLocal;
    if(r && r.snap && valido(r.snap) && r.t > (s.t || 0)){
      if(!hayLocal || !dirty){ aplicar(r.snap); setG({ t: r.t, l: Date.now() }); location.reload(); return "recarga"; }
      return conflicto(r.t).then(function(c){
        if(c === "pla"){ aplicar(r.snap); setG({ t: r.t, l: Date.now() }); location.reload(); return "recarga"; }
        if(c === "loc") return empujar();
      });
    }
    if(dirty || !r || manual) return empujar();
  }).then(function(x){ if(x !== "recarga"){ remotoNuevo = null; estG = "✓ Sincronizado con tu planilla · " + hhmm(Date.now()); } })
    .catch(function(e){ estG = "⚠ " + (/popup|access_denied|immediate_failed|user/i.test(e.message) ? "Vuelve a conectar tu Google" : e.message); })
    .then(function(){ ocupado = false; pintar(); });
}
function conectar(){ if(!CID){ alert("La conexión con Google aún no está activada."); return; } sincronizar(true); }
function desconectar(){
  if(!confirm("Se desconecta tu Google de este equipo. Tu planilla en Drive no se borra y tus datos siguen en este equipo.")) return;
  try{ if(tok && window.google) google.accounts.oauth2.revoke(tok, function(){}); }catch(e){}
  tok = null; tokExp = 0; lsSet(LSG, "{}"); estG = ""; pintar();
}
/* autoguardado */
var tAuto = null;
function cambio(){
  clearTimeout(tAuto);
  tAuto = setTimeout(function(){
    if(fh && fhPermiso) escribirArchivo();
    if(g().id && MODO !== "equipo" && tok && Date.now() < tokExp - 60000) sincronizar(false); else if(g().id) { estG = "● Cambios sin sincronizar con tu planilla"; pintar(); }
  }, 4000);
  pintar();
}
/* revisar si otro equipo guardó cambios en tu planilla */
function revisar(){
  if(!g().id || document.visibilityState !== "visible" || !tok || Date.now() > tokExp - 60000 || ocupado) return;
  leerRemoto(true).then(function(r){ if(r && r.t > (g().t || 0)){ remotoNuevo = r.t; pintar(); } }).catch(function(){});
}
setInterval(revisar, 90000);

/* ---------- interfaz ---------- */
var btn = null;
function css(){
  var s = document.createElement("style");
  s.textContent = ".lp-pr-box{max-width:520px;width:100%} .lp-pr-box h4{margin:16px 0 6px;font-size:13px;color:var(--ink)} .lp-pr-box p{margin:4px 0 8px;font-size:13px;color:var(--ink-soft);line-height:1.45}"
    + ".lp-pr-row{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0} .lp-pr-st{font-size:12px;color:var(--ink-soft);margin:2px 0 4px;min-height:16px} .lp-pr-badge{display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--line-strong);color:var(--ink-soft);margin-left:6px;font-weight:500}"
    + "#lpProyecto{position:relative} #lpProyecto .lp-dot{position:absolute;top:-3px;right:-3px;width:9px;height:9px;border-radius:50%;background:#D6A828;display:none} #lpProyecto.pend .lp-dot{display:block} #lpProyecto.nuevo .lp-dot{display:block;background:#3F8FC4}"
    + ".lp-pr-hr{border:0;border-top:1px solid var(--line);margin:14px 0 4px}"
    + "@media(max-width:700px){#lpProyecto .lp-t{display:none}#lpProyecto{padding-left:9px;padding-right:9px}}";
  document.head.appendChild(s);
}
function estado(){
  var s = g(), conectado = !!s.id;
  return { conectado: conectado, sinSync: conectado && modLocal() > (s.l || 0) };
}
function pintar(){
  if(btn){ var e = estado(); btn.classList.toggle("pend", e.sinSync && !remotoNuevo); btn.classList.toggle("nuevo", !!remotoNuevo); }
  var m = document.getElementById("lpPrModal"); if(m) cuerpo(m);
}
function cuerpo(m){
  var s = g(), conectado = !!s.id, equipo = MODO === "equipo";
  var h = '<h3>Mi proyecto<span class="lp-pr-badge">' + (equipo ? "Equipo GeoMAV (PIN)" : "Personal") + '</span></h3>'
    + '<p>' + (equipo ? 'Este equipo trabaja con la planilla compartida de tu equipo. Aquí puedes sacar una copia de seguridad en un archivo.' : 'Tus datos se guardan en este equipo. Respáldalos en un archivo o en <b>tu propia planilla de Google</b>, que la app crea sola en tu Drive.') + '</p>'
    + '<h4>Archivo</h4><div class="lp-pr-row"><button type="button" class="btn-sm sel-ok" data-a="guardar">Guardar en un archivo</button><button type="button" class="btn-sm" data-a="abrir">Abrir archivo…</button>'
    + (FSA ? (fh ? (fhPermiso ? '<button type="button" class="btn-sm" data-a="desvincular">Dejar de vincular</button>' : '<button type="button" class="btn-sm" data-a="reconectar">Permitir acceso al archivo</button>') : '<button type="button" class="btn-sm" data-a="vincular">Vincular archivo (guardado automático)</button>') : '')
    + '</div><div class="lp-pr-st">' + esc(estF) + '</div>';
  if(!equipo){
    h += '<hr class="lp-pr-hr"><h4>Mi planilla de Google</h4>';
    if(!CID) h += '<p>Disponible muy pronto.</p>';
    else if(!conectado) h += '<p>Entra con tu cuenta de Google: la app crea la planilla “' + esc(NOMBRE) + '” en tu Drive y la mantiene al día. Solo accede a esa planilla, no al resto de tu Drive.</p><div class="lp-pr-row"><button type="button" class="btn-sm sel-ok" data-a="conectar">Conectar mi Google</button></div><div class="lp-pr-st">' + esc(estG) + '</div>';
    else h += '<div class="lp-pr-row"><button type="button" class="btn-sm sel-ok" data-a="sync">' + (remotoNuevo ? 'Cargar cambios de la planilla' : 'Sincronizar ahora') + '</button><a class="btn-sm" href="' + esc(s.url || "#") + '" target="_blank" rel="noopener" style="text-decoration:none">Abrir mi planilla ↗</a><button type="button" class="btn-sm" data-a="desconectar">Desconectar</button></div><div class="lp-pr-st">' + esc(remotoNuevo ? "Hay cambios nuevos en tu planilla." : (estG || (estado().sinSync ? "● Cambios sin sincronizar" : ""))) + '</div>';
  }
  h += '<hr class="lp-pr-hr"><h4>Modo de trabajo</h4><p>' + (equipo ? 'Estás en el modo del equipo GeoMAV.' : 'Si perteneces al equipo GeoMAV y tienes el PIN, puedes usar la planilla compartida.') + '</p><div class="lp-pr-row"><button type="button" class="btn-sm" data-a="modo">' + (equipo ? 'Cambiar a modo Personal' : 'Cambiar a modo Equipo GeoMAV') + '</button></div>'
    + '<div class="sel-actions"><button type="button" class="btn-sm" data-a="cerrar">Cerrar</button></div>';
  m.querySelector(".sel-box").innerHTML = h;
}
function abrir(){
  var ov = document.getElementById("lpPrModal"); if(ov) ov.remove();
  ov = document.createElement("div"); ov.id = "lpPrModal"; ov.className = "sel-overlay";
  ov.innerHTML = '<div class="sel-box lp-pr-box" role="dialog" aria-modal="true" aria-label="Mi proyecto"></div>';
  document.body.appendChild(ov); cuerpo(ov);
  function cerrar(){ document.removeEventListener("keydown", tec); ov.remove(); }
  function tec(e){ if(e.key === "Escape") cerrar(); }
  document.addEventListener("keydown", tec);
  ov.addEventListener("click", function(e){
    var a = e.target.dataset && e.target.dataset.a;
    if(e.target === ov || a === "cerrar") return cerrar();
    if(a === "guardar") guardarArchivo();
    else if(a === "abrir") abrirArchivo();
    else if(a === "vincular") vincular();
    else if(a === "reconectar") reconectar();
    else if(a === "desvincular") desvincular();
    else if(a === "conectar") conectar();
    else if(a === "sync") sincronizar(true);
    else if(a === "desconectar") desconectar();
    else if(a === "modo"){
      var n = MODO === "equipo" ? "personal" : "equipo";
      if(confirm(n === "equipo" ? "Se activa la planilla compartida del equipo GeoMAV (necesita el PIN del equipo para guardar). ¿Continuar?" : "Se pasa a modo Personal: la app deja de usar la planilla compartida. Tus datos de este equipo se conservan. ¿Continuar?")){ lsSet("lp-modo", n); location.reload(); }
    }
  });
}
function iniciar(){
  css();
  var ref = document.getElementById("themeToggle"); if(!ref) return;
  btn = document.createElement("button"); btn.type = "button"; btn.className = "btn-sm"; btn.id = "lpProyecto"; btn.title = "Guardar, respaldar y sincronizar tu proyecto";
  btn.innerHTML = '☁ <span class="lp-t">Mi proyecto</span><span class="lp-dot"></span>';
  btn.onclick = abrir; ref.parentNode.insertBefore(btn, ref);
  pintar();
  if(MODO !== "equipo" && !lsGet(LSAV) && !g().id && window.LP_AVISOS && LP_AVISOS.flash){
    lsSet(LSAV, "1"); setTimeout(function(){ LP_AVISOS.flash("Tus datos se guardan en este equipo. Respáldalos en ☁ Mi proyecto."); }, 2500);
  }
  if(g().id && MODO !== "equipo") revisar();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
window.LP_PROYECTO = { abrir: abrir, snapshot: snapshot };
})();
