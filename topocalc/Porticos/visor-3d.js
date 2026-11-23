/* Visor 3D de pórticos (Tipo T / Tipo L) — modelo paramétrico a partir del plano HOLMING "Pórticos O'Higgins MOP" (28-10-2026).
   Las piezas se pintan según lo ejecutado en el pórtico: fundación, poste y brazo. Modelo referencial (no reemplaza al plano).
   Uso: PORTICOS_3D.abrir({ nombre, comuna, tipo:"T"|"L"|null, ejec:{ "Inst. de Fundación":true, … } }) */
(function(){
"use strict";
var THREE_SRC = "vendor/three.min.js?v=r128";
/* Medidas leídas del DXF (metros, N.T. = 0): fundación = emplantillado 5 cm (−1,52…−1,47) + hormigón 1,40 m (−1,47…−0,07) + grouting 5 cm + placa 20 mm.
   Elevación de ambos tipos: fundación de 0,90 m a lo largo del brazo. En planta: Tipo T según detalle Z55x140x140 (1,40 m transversal al brazo); Tipo L = Z90x90x140 excéntrica 0,20 m. */
var DIM = {
  T: { bx: 0.90, bz: 1.40, offz: 0 },
  L: { bx: 0.90, bz: 0.90, offz: 0.20 }
};
var H_BLOQ = 1.40, H_GROUT = 0.05, H_EMP = 0.05, H_MAST = 7.565, PLACA = 0.42;
/* brazo (m desde el eje del poste): tubo inferior Ø76,1 casi horizontal y cordón superior Ø60,3 con diagonales en zigzag */
var BRAZO = { yInf0: 6.464, yInf1: 6.512, ySup: 6.89, xIni: 0.12, xSupFin: 4.15, xBajada: 4.70,
  bajos: [0.83, 2.01, 3.31, 4.66], altos: [0.30, 1.36, 2.66, 3.95] };

function cargarThree(cb){
  if(window.THREE) return cb();
  var s = document.createElement("script"); s.src = THREE_SRC; s.onload = cb;
  s.onerror = function(){ alert("No se pudo cargar el visor 3D. Revisa tu conexión."); };
  document.head.appendChild(s);
}

function construir(T, o){
  var raiz = new T.Group(), ej = o.ejec || {}, tipo = o.tipo, brazo = o.brazo, D = DIM[tipo];
  var sgn = 1, pal = o.pal || { claro: false, bp: 0x5BA8BF };
  function acero(c){ return pal.claro ? new T.Color(c).multiplyScalar(.6) : new T.Color(c); }
  function mat(hecho, color){
    return hecho ? new T.MeshStandardMaterial({ color: acero(color), metalness: .15, roughness: .75 })
                 : new T.MeshStandardMaterial({ color: pal.bp, transparent: true, opacity: pal.claro ? .22 : .16, depthWrite: false });
  }
  function caja(w, h, d, x, y, z, m, g){
    var me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.position.set(x, y, z); g.add(me);
    if(!m.transparent || m.opacity > .5) return me;
    var ed = new T.LineSegments(new T.EdgesGeometry(me.geometry), new T.LineBasicMaterial({ color: pal.bp })); ed.position.copy(me.position); g.add(ed);
    return me;
  }
  function cil(a, b, r, m, g){
    var v = new T.Vector3().subVectors(b, a), len = v.length();
    var me = new T.Mesh(new T.CylinderGeometry(r, r, len, 8), m);
    me.position.copy(a).addScaledVector(v, .5);
    me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize());
    g.add(me); return me;
  }
  var zc = -sgn * D.offz;                    /* centro del bloque: el poste queda en x = 0, z = 0 */
  var gF = new T.Group(); gF.name = "fundacion";
  caja(D.bx + .1, H_EMP, D.bz + .1, 0, -H_BLOQ - .07 - H_EMP / 2, zc, mat(!!ej["Emplantillado"], 0x8a7b6a), gF);
  caja(D.bx, H_BLOQ, D.bz, 0, -.07 - H_BLOQ / 2, zc, mat(!!ej["Inst. de Fundación"], 0xa9afb6), gF);
  caja(PLACA + .06, H_GROUT, PLACA + .06, 0, -.02 - H_GROUT / 2, 0, mat(!!ej["Inst. de Fundación"], 0xcfd3d8), gF);
  raiz.add(gF);

  /* ---- poste: placa base, pernos de anclaje y mástil octogonal ---- */
  var gP = new T.Group(), hP = !!ej["Inst. Poste V"], mP = mat(hP, 0xc4ccd4); gP.name = "poste";
  caja(PLACA, .02, PLACA, 0, -.01, 0, mP, gP);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(s){
    cil(new T.Vector3(s[0] * .15, -.75, s[1] * .15), new T.Vector3(s[0] * .15, .10, s[1] * .15), .011, mat(hP, 0x8d96a0), gP);
  });
  function tramo(y0, y1, r0, r1){            /* octágono: r = radio circunscrito ≈ ancho entre caras / 2 / cos(22,5°) */
    var k = 1 / Math.cos(Math.PI / 8) / 2, g = new T.CylinderGeometry(r1 * k, r0 * k, y1 - y0, 8, 1);
    g.rotateY(Math.PI / 8); var me = new T.Mesh(g, mP); me.position.set(0, (y0 + y1) / 2, 0); gP.add(me);
    if(!hP){ var ed = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: pal.bp })); ed.position.copy(me.position); gP.add(ed); }
  }
  tramo(0, 5.4, .250, .181);                 /* T.I.: OCT 250-175 x 4 mm, 5,40 m */
  tramo(4.95, H_MAST, .189, .160);           /* T.S.: OCT 189-160 x 4 mm (traslapa con T.I.) */
  /* rigidizadores de la placa base (4 cartelas triangulares) */
  var shp = new T.Shape(); shp.moveTo(.125, 0); shp.lineTo(.21, 0); shp.lineTo(.125, .25);
  for(var k = 0; k < 4; k++){
    var gg = new T.ExtrudeGeometry(shp, { depth: .012, bevelEnabled: false }); gg.translate(0, 0, -.006); gg.rotateY(k * Math.PI / 2);
    gP.add(new T.Mesh(gg, mP));
  }
  /* ventana de registro (vista frontal: desde 0,44 m) */
  if(hP) caja(.05, .30, .008, 0, .59, .1235, new T.MeshStandardMaterial({ color: 0x20262e }), gP);
  /* cabezal de conexión (Sección C-C): caja 200 x 280 mm, PL 8 mm en las caras del brazo, perfiles 16 mm laterales, 4+4 pernos Ø5/8", coplas 1½" */
  var HT = 7.00, HH = .63, HY = HT - HH / 2, mBol = mat(hP, 0x8d96a0);
  [-1, 1].forEach(function(sg){
    caja(.008, HH, .28, sg * .096, HY, 0, mP, gP);
    caja(.192, HH, .016, 0, HY, sg * .132, mP, gP);
    [.07, .22, .39, .56].forEach(function(d){
      [-.1, .1].forEach(function(zz){ cil(new T.Vector3(sg * .102, HT - d, zz), new T.Vector3(sg * .116, HT - d, zz), .014, mBol, gP); });
    });
  });
  var mCop = mat(hP, 0xd49a6a);
  [[HT - .07, 0], [HT - .475, -.08], [HT - .475, 0], [HT - .475, .08]].forEach(function(c){
    cil(new T.Vector3(-.112, c[0], c[1]), new T.Vector3(.112, c[0], c[1]), .026, mCop, gP);
  });
  raiz.add(gP);

  /* ---- brazo(s) enrejado(s) en lo alto del poste ---- */
  var gB = new T.Group(), hB = !!ej["Inst. Brazo H"], mB = mat(hB, 0xb9c2cc); gB.name = "brazo";
  var lados = tipo === "T" ? [1, -1] : [1], B = BRAZO, yInf = function(x){ return B.yInf0 + (B.yInf1 - B.yInf0) * Math.min(1, x / 6.1); };
  lados.forEach(function(s){
    var V = function(x, y){ return new T.Vector3(s * x, y, 0); }, tip = brazo + .116;
    cil(V(B.xIni, yInf(B.xIni)), V(tip, yInf(tip)), .038, mB, gB);                         /* tubo inferior Ø76,1 */
    cil(V(B.xIni, B.ySup), V(B.xSupFin, B.ySup), .030, mB, gB);                           /* cordón superior Ø60,3 */
    cil(V(B.xSupFin, B.ySup), V(B.xBajada, yInf(B.xBajada)), .030, mB, gB);               /* bajada del cordón al tubo */
    var nodos = []; B.bajos.forEach(function(x){ nodos.push([x, 0]); }); B.altos.forEach(function(x){ nodos.push([x, 1]); });
    nodos.sort(function(a, b){ return a[0] - b[0]; });
    for(var i = 1; i < nodos.length; i++){
      var a1 = nodos[i - 1], b1 = nodos[i];
      cil(V(a1[0], a1[1] ? B.ySup : yInf(a1[0])), V(b1[0], b1[1] ? B.ySup : yInf(b1[0])), .022, mB, gB);
    }
  });
  raiz.add(gB);
  return raiz;
}

function abrir(o){
  cargarThree(function(){
    var T = window.THREE, tipo = o.tipo === "L" ? "L" : "T", brazo = 6, sinTipo = !o.tipo;
    var cs = getComputedStyle(document.documentElement);
    function cssv(n, fb){ var v = (cs.getPropertyValue(n) || "").trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : fb; }
    var fondo = cssv("--paper-sunken", "#0B1015"), bp = cssv("--blueprint", "#5BA8BF");
    var lum = (function(h){ var n = parseInt(h.slice(1), 16); return (.299 * (n >> 16) + .587 * ((n >> 8) & 255) + .114 * (n & 255)) / 255; })(fondo);
    var pal = { claro: lum > .5, bp: new T.Color(bp) };
    if(!document.getElementById("v3-css")){
      var stl = document.createElement("style"); stl.id = "v3-css";
      stl.textContent = ".v3-ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(10,34,64,.55);font:14px/1.35 var(--font-body,system-ui,sans-serif);color:var(--ink,#E8EDF3);touch-action:none}"
        + ".v3-win{position:relative;width:100%;height:100%;overflow:hidden;background:var(--paper-sunken,#0B1015)}"
        + "@media (min-width:900px) and (min-height:560px){.v3-win{width:min(1100px,92vw);height:min(760px,88vh);border-radius:14px;border:1px solid var(--line-strong,rgba(232,237,243,.28));box-shadow:0 18px 60px -12px rgba(0,0,0,.6)}}"
        + ".v3-bar button{background:var(--paper,#10161D);color:var(--ink,#E8EDF3);border:1px solid var(--line-strong,#3a465b);border-radius:18px;padding:7px 12px;font:inherit;font-size:12.5px;cursor:pointer}"
        + ".v3-bar button:hover{border-color:var(--accent,#D9A272)}";
      document.head.appendChild(stl);
    }
    var ov = document.createElement("div"); ov.className = "v3-ov";
    ov.innerHTML = '<div class="v3-win"><canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas>'
      + '<div style="position:absolute;top:0;left:0;right:0;padding:10px 14px;pointer-events:none;text-shadow:0 1px 3px var(--paper-sunken,#0B1015)"><b style="font-size:15px">' + String(o.nombre || "").replace(/</g, "&lt;") + ' · 3D</b><div class="v3-sub" style="font-size:12px;color:var(--ink-soft,rgba(232,237,243,.68))"></div></div>'
      + '<button class="v3-x" aria-label="Cerrar" style="position:absolute;top:8px;right:10px;background:var(--paper-raised,#1A222C);color:var(--ink,#E8EDF3);border:1px solid var(--line-strong,#3a465b);border-radius:10px;font-size:18px;padding:4px 12px;cursor:pointer">✕</button>'
      + '<div class="v3-leg" style="position:absolute;left:10px;bottom:70px;background:var(--paper-raised,#1A222C);border:1px solid var(--line-strong,#3a465b);border-radius:10px;padding:8px 10px;font-size:12px"></div>'
      + '<div class="v3-bar" style="position:absolute;left:0;right:0;bottom:0;padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:var(--paper-raised,#1A222C);border-top:1px solid var(--line-strong,#3a465b);display:flex;gap:6px;flex-wrap:wrap;justify-content:center"></div></div>';
    document.body.appendChild(ov);
    var win = ov.querySelector(".v3-win");
    ov.addEventListener("pointerdown", function(e){ if(e.target === ov) cerrar(); });
    function tecla(e){ if(e.key === "Escape") cerrar(); }
    document.addEventListener("keydown", tecla);
    var cv = win.querySelector("canvas"), r = new T.WebGLRenderer({ canvas: cv, antialias: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    var sc = new T.Scene(); sc.background = new T.Color(fondo);
    sc.add(new T.HemisphereLight(0xffffff, pal.claro ? 0x9a9686 : 0x445066, .9)); var dl = new T.DirectionalLight(0xffffff, .7); dl.position.set(5, 12, 8); sc.add(dl);
    var cam = new T.PerspectiveCamera(40, 1, .1, 200);
    var suelo = new T.Mesh(new T.BoxGeometry(6, 1.7, 3), new T.MeshStandardMaterial({ color: 0x7a6a55, transparent: true, opacity: .1, depthWrite: false })); suelo.position.set(0, -.85, 0); sc.add(suelo);
    var rejilla = new T.GridHelper(14, 14, pal.claro ? 0xb9b6ab : 0x3a465b, pal.claro ? 0xd3d0c6 : 0x2f3a4d); sc.add(rejilla);
    var st = { yaw: .7, pitch: .35, dist: 16, ty: 3.2 }, modelo = null, corte = false;

    function dibujar(){
      if(modelo) sc.remove(modelo);
      modelo = construir(T, { tipo: tipo, brazo: brazo, ejec: o.ejec, pal: pal }); sc.add(modelo);
      suelo.material.opacity = (o.ejec && o.ejec["Relleno"]) ? .35 : .08; 
      win.querySelector(".v3-sub").textContent = (o.comuna ? o.comuna + " · " : "") + "Tipo " + tipo + " · brazo " + brazo + " m" + (sinTipo ? " (tipo no definido en la ficha)" : "") + " · modelo referencial";
      var e = o.ejec || {}, li = function(ok, c, t){ return '<div><span style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;background:' + (ok ? c : "transparent") + ';border:1px solid ' + (ok ? c : bp) + '"></span>' + t + (ok ? "" : " (pendiente)") + '</div>'; };
      win.querySelector(".v3-leg").innerHTML = li(!!e["Emplantillado"], "#8a7b6a", "Emplantillado") + li(!!e["Inst. de Fundación"], "#a9afb6", "Fundación")
        + li(!!e["Inst. Poste V"], "#c4ccd4", "Poste") + li(!!e["Inst. Brazo H"], "#b9c2cc", "Brazo");
      var b = win.querySelectorAll(".v3-bar button"); b.forEach(function(x){ x.style.borderColor = (x.dataset.k === "t" + tipo || x.dataset.k === "b" + brazo) ? cssv("--accent", "#D9A272") : ""; });
    }
    var bar = win.querySelector(".v3-bar");
    [["tT", "Tipo T"], ["tL", "Tipo L"], ["b6", "Brazo 6 m"], ["b7", "Brazo 7 m"], ["v", "Vista general"], ["e", "Elevación"], ["h", "Cabezal"], ["f", "Fundación"], ["c", "Terreno"]].forEach(function(x){
      var bt = document.createElement("button"); bt.textContent = x[1]; bt.dataset.k = x[0].replace(/^t(.)$/, "t$1");
      bt.onclick = function(){
        if(x[0] === "tT"){ tipo = "T"; sinTipo = false; } else if(x[0] === "tL"){ tipo = "L"; sinTipo = false; }
        else if(x[0] === "b6") brazo = 6; else if(x[0] === "b7") brazo = 7;
        else if(x[0] === "v"){ st.dist = 16; st.ty = 3.2; st.pitch = .35; }
        else if(x[0] === "e"){ st.yaw = 0; st.pitch = 0; st.dist = 22; st.ty = 3.2; }
        else if(x[0] === "h"){ st.yaw = .9; st.pitch = .2; st.dist = 3.4; st.ty = 6.7; }
        else if(x[0] === "f"){ st.dist = 5; st.ty = -.8; st.pitch = .25; }
        else if(x[0] === "c"){ suelo.visible = !suelo.visible; }
        dibujar();
      };
      bar.appendChild(bt);
    });
    function tam(){ var w = win.clientWidth, h = win.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    function pinta(){
      cam.position.set(Math.sin(st.yaw) * Math.cos(st.pitch) * st.dist, st.ty + Math.sin(st.pitch) * st.dist, Math.cos(st.yaw) * Math.cos(st.pitch) * st.dist);
      cam.lookAt(0, st.ty, 0); r.render(sc, cam);
    }
    var vivo = true; (function loop(){ if(!vivo) return; pinta(); requestAnimationFrame(loop); })();
    var pts = {}, ult = null;
    cv.addEventListener("pointerdown", function(e){ cv.setPointerCapture(e.pointerId); pts[e.pointerId] = e; ult = null; });
    cv.addEventListener("pointermove", function(e){
      var ids = Object.keys(pts); if(!pts[e.pointerId]) return;
      if(ids.length === 1){ st.yaw -= (e.clientX - pts[e.pointerId].clientX) * .008; st.pitch = Math.max(-.2, Math.min(1.45, st.pitch + (e.clientY - pts[e.pointerId].clientY) * .008)); }
      else if(ids.length === 2){
        var o2 = ids.filter(function(k){ return +k !== e.pointerId; })[0], a = pts[o2], d0 = Math.hypot(a.clientX - pts[e.pointerId].clientX, a.clientY - pts[e.pointerId].clientY), d1 = Math.hypot(a.clientX - e.clientX, a.clientY - e.clientY);
        st.dist = Math.max(2, Math.min(40, st.dist * d0 / Math.max(1, d1)));
      }
      pts[e.pointerId] = e;
    });
    function sube(e){ delete pts[e.pointerId]; }
    cv.addEventListener("pointerup", sube); cv.addEventListener("pointercancel", sube);
    cv.addEventListener("wheel", function(e){ e.preventDefault(); st.dist = Math.max(2, Math.min(40, st.dist * (1 + e.deltaY * .001))); }, { passive: false });
    function cerrar(){ vivo = false; document.removeEventListener("keydown", tecla); window.removeEventListener("resize", tam); r.dispose(); ov.remove(); }
    win.querySelector(".v3-x").onclick = cerrar;
    window.addEventListener("resize", tam); tam(); dibujar();
  });
}
window.PORTICOS_3D = { abrir: abrir, _construir: construir };
})();
