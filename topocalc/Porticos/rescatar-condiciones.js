/* Rescatar condiciones de las notas existentes (programación semanal y registros) y proponerlas
   para las columnas Fundación / Excavación / Instalaciones. Nada se guarda sin tu revisión y tu PIN. */
(function(){
"use strict";
function sn(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); }
function dm(f){ var m = /^\d{4}-(\d{2})-(\d{2})/.exec(f || ""); return m ? m[2] + "-" + m[1] : ""; }
var EXC_OK = { "Excavación":1, "Comentarios":1, "Prevención":1 };
/* reglas: texto sin tildes -> [campo, valor] */
function leer(texto, partida){
  var t = sn(texto), out = [];
  if(EXC_OK[partida]){
    if(/maquina|maquinaria|retroexcavadora|\bretro\b/.test(t)) out.push(["exc", "Con maquinaria"]);
    else if(/\bmanual|a mano|\bpala\b|pique/.test(t)) out.push(["exc", "A mano"]);
  }
  if(/in[ -]?situ/.test(t)) out.push(["ftipo", "In situ"]);
  else if(/prefabric|\bprefab\b/.test(t)) out.push(["ftipo", "Prefabricada"]);
  if(/excentric/.test(t)) out.push(["fpos", "Excéntrica"]);
  else if(/\bcentrad[ao]\b/.test(t)) out.push(["fpos", "Centrada"]);
  if(/electric/.test(t)) out.push(["inst", "Eléctrica"]);
  if(/\bapr\b|agua potable|matriz de agua|matriz agua|matrices de agua|matriz de ap\b|matriz ap\b|matrices de ap\b|tuberia de agua|canería de agua|caneria de agua/.test(t)) out.push(["inst", "APR agua potable"]);
  return out;
}
function analizar(){
  var api = window.PORTICOS_API, D = window.PORTICOS_DATOS ? window.PORTICOS_DATOS() : null, CD = window.PORTICOS_CONDS || [];
  if(!api || !D || !D.lista || !D.lista.length) return null;
  var nombre = {}; D.lista.forEach(function(p){ nombre[String(p.num)] = p.nombre; });
  var fuentes = [];
  (D.prog || []).forEach(function(r){ var tx = [r.obs, r.accion].filter(Boolean).join(" · "); if(tx) fuentes.push({ num:String(r.portico), partida:r.partida, fecha:r.fecha || "", texto:tx, de:"programación" }); });
  (D.avance || []).forEach(function(a){ if(a.obs) fuentes.push({ num:String(a.portico), partida:a.partida, fecha:a.fecha || "", texto:a.obs, de:"registro" }); });
  var hall = {};   /* num|campo -> {vals:{valor:{fecha,texto}}} */
  fuentes.forEach(function(f){
    leer(f.texto, f.partida).forEach(function(kv){
      var k = f.num + "|" + kv[0], h = hall[k] = hall[k] || { num:f.num, k:kv[0], vals:{} }, v = h.vals[kv[1]];
      if(!v || f.fecha > v.fecha) h.vals[kv[1]] = { fecha:f.fecha, texto:f.texto, partida:f.partida, de:f.de };
    });
  });
  var C = {}; CD.forEach(function(c){ C[c.k] = c; });
  var cur = window.PORTICOS_COND || {}, props = [];
  Object.keys(hall).forEach(function(k){
    var h = hall[k], c = C[h.k]; if(!c) return;
    var vals = Object.keys(h.vals), actual = (cur[k] || "").split(",").map(function(x){ return x.trim(); }).filter(Boolean), nuevo, fuente;
    if(c.multi){
      var set = actual.slice(); vals.forEach(function(v){ if(set.indexOf(v) < 0) set.push(v); });
      nuevo = c.ops.map(function(o){ return o[0]; }).filter(function(v){ return set.indexOf(v) >= 0; }).join(",");
      if(nuevo === actual.join(",")) return;
      fuente = h.vals[vals.filter(function(v){ return actual.indexOf(v) < 0; })[0]];
      props.push({ num:h.num, k:h.k, c:c, antes:actual.join(", "), valor:nuevo, mostrar:nuevo.split(",").join(" + "), src:fuente, grupo: actual.length ? "dif" : "nuevo" });
    } else {
      vals.sort(function(a, b){ return h.vals[b].fecha < h.vals[a].fecha ? -1 : 1; });
      nuevo = vals[0]; fuente = h.vals[nuevo];
      if(actual[0] === nuevo) return;
      props.push({ num:h.num, k:h.k, c:c, antes:actual[0] || "", valor:nuevo, mostrar:nuevo, src:fuente, conflicto: vals.length > 1 ? vals : null, grupo: actual.length ? "dif" : "nuevo" });
    }
  });
  props.sort(function(a, b){ return (Number(a.num) - Number(b.num)) || (a.k < b.k ? -1 : 1); });
  return { props:props, nombre:nombre, n:fuentes.length };
}
function abrir(){
  var A = analizar(), api = window.PORTICOS_API;
  if(!A){ alert("La app aún no cargó los datos de la planilla compartida. Espera unos segundos y reintenta."); return; }
  var ov = document.createElement("div"); ov.className = "bg-ov"; ov.style.overflow = "auto";
  var G = [["nuevo", "Condiciones nuevas (la celda está vacía)", true], ["dif", "Distintas a lo que ya está definido (no se marcan)", false]];
  var h = '<p class="ip-sub">Revisé ' + A.n + ' notas y comentarios. Marca lo que quieres guardar.</p>';
  if(!A.props.length) h += '<p><b>No encontré condiciones nuevas en las notas.</b></p>';
  G.forEach(function(g){
    var l = A.props.filter(function(p){ return p.grupo === g[0]; }); if(!l.length) return;
    h += '<details class="ip-d" open style="margin:8px 0;border:1px solid var(--line);border-radius:8px;padding:6px 10px"><summary style="cursor:pointer"><label style="display:inline-flex;flex-direction:row;gap:8px;align-items:center;font-size:.9rem;color:var(--ink);width:auto"><input type="checkbox" class="rc-g" style="width:16px;height:16px;flex:none;margin:0" data-g="' + g[0] + '"' + (g[2] ? " checked" : "") + '> <b>' + esc(g[1]) + '</b> (' + l.length + ')</label></summary><ul style="margin:6px 0 2px 0;padding:0;list-style:none;font-size:.82rem">'
      + l.map(function(p){ var i = A.props.indexOf(p);
          return '<li style="padding:4px 0;border-top:1px dashed var(--line)"><label style="display:flex;flex-direction:row;gap:8px;align-items:flex-start;font-size:.82rem;color:var(--ink)"><input type="checkbox" class="rc-i" style="width:16px;height:16px;flex:none;margin:1px 0 0" data-i="' + i + '" data-g="' + g[0] + '"' + (g[2] ? " checked" : "") + '><span><b>' + esc(A.nombre[p.num] || p.num) + '</b> · ' + esc(p.c.titulo) + (p.k === "ftipo" ? " (tipo)" : p.k === "fpos" ? " (posición)" : "") + ': '
            + (p.antes ? '<s>' + esc(p.antes) + '</s> → ' : '') + '<b>' + esc(p.mostrar) + '</b>' + (p.conflicto ? ' <em style="color:#8A6A00">(también aparece ' + esc(p.conflicto.slice(1).join(", ")) + '; uso lo más reciente)</em>' : '')
            + '<br><small style="color:var(--ink-soft)">«' + esc(String(p.src.texto).slice(0, 110)) + '» · ' + esc(p.src.partida) + ' ' + esc(dm(p.src.fecha)) + '</small></span></label></li>'; }).join("")
      + '</ul></details>';
  });
  ov.innerHTML = '<div class="bg-card" role="dialog" aria-modal="true" aria-label="Rescatar condiciones" style="max-width:660px;max-height:92vh;display:flex;flex-direction:column"><div class="bg-h"><strong>🔎 Rescatar condiciones de las notas</strong><button type="button" class="bg-x" aria-label="Cerrar">✕</button></div>'
    + '<div class="bg-b" style="overflow:auto">' + h + '<label class="bg-pinl rc-pin" style="' + (A.props.length ? "" : "display:none") + '">PIN de edición<input type="password" class="bg-pin" inputmode="numeric" autocomplete="off" maxlength="8"></label><div class="bg-msg rc-msg"></div></div>'
    + '<div class="bg-acc"><button type="button" class="bg-ok rc-ok" disabled>Guardar seleccionado</button><button type="button" class="btn-link bg-no">Cerrar</button></div></div>';
  document.body.appendChild(ov);
  var $ = function(s){ return ov.querySelector(s); }, msg = $(".rc-msg");
  function cerrar(){ ov.remove(); } $(".bg-x").onclick = cerrar; $(".bg-no").onclick = cerrar;
  function contar(){ var n = ov.querySelectorAll(".rc-i:checked").length; $(".rc-ok").disabled = !n; $(".rc-ok").textContent = n ? n === 1 ? "Guardar 1 condición" : "Guardar " + n + " condiciones" : "Guardar seleccionado"; }
  ov.querySelectorAll(".rc-g").forEach(function(g){ g.onchange = function(){ ov.querySelectorAll('.rc-i[data-g="' + g.dataset.g + '"]').forEach(function(i){ i.checked = g.checked; }); contar(); }; });
  ov.querySelectorAll(".rc-i").forEach(function(i){ i.onchange = contar; }); contar();
  $(".rc-ok").onclick = function(){
    var btn = this, pin = $(".bg-pin").value.trim(); if(!pin){ msg.textContent = "Ingresa el PIN."; $(".bg-pin").focus(); return; }
    var sel = Array.prototype.map.call(ov.querySelectorAll(".rc-i:checked"), function(i){ return A.props[+i.dataset.i]; });
    if(!confirm("Se guardarán " + sel.length + " condiciones para todos. ¿Continuar?")) return;
    if(window.PORTICOS_AUTOR) window.PORTICOS_AUTOR.pedir();
    btn.disabled = true; var hechos = 0, seq = Promise.resolve();
    sel.forEach(function(p){ seq = seq.then(function(){ msg.textContent = "Guardando… " + hechos + " de " + sel.length; return api.condiciones(p.num, [[p.k, p.valor]], pin).then(function(){ hechos++; }); }); });
    seq.then(function(){ api.setPin(pin); msg.textContent = "✓ Listo: " + hechos + " condiciones guardadas para todos."; ov.querySelectorAll(".bg-b > details, .rc-pin").forEach(function(n){ n.style.display = "none"; }); btn.style.display = "none"; })
      .catch(function(e){ if(e && e.pin) api.setPin(""); msg.textContent = "Se detuvo tras " + hechos + " de " + sel.length + ": " + (e && e.message ? e.message : "sin respuesta") + ". Vuelve a abrir esta ventana: solo propondrá lo que falte."; btn.disabled = false; });
  };
}
window.PORTICOS_RESCATE = { abrir:abrir, _t:{ leer:leer, analizar:analizar } };
})();
