/* Visor 3D de pórticos (Tipo T / Tipo L) — modelo paramétrico a partir del plano HOLMING "Pórticos O'Higgins MOP" (28-10-2026).
   Las piezas se pintan según lo ejecutado en el pórtico: fundación, poste y brazo. Modelo referencial (no reemplaza al plano).
   Uso: PORTICOS_3D.abrir({ nombre, comuna, tipo:"T"|"L"|null, ejec:{ "Inst. de Fundación":true, … } }) */
(function(){
"use strict";
var THREE_SRC = "vendor/three.min.js?v=r128";
/* Medidas leídas del DXF (m). Origen: eje del poste, y = 0 en la cara superior de la placa base (placa 20 mm: −0,02…0).
   N.T. = +0,06 (la placa queda 60 mm bajo el terreno, embebida en el grouting). Grouting 150 mm: −0,09…+0,06 (pedestal 500 × 500).
   Hormigón G25 1,40 m: −1,49…−0,09. Emplantillado G5 100 mm: −1,59…−1,49 (N.S.E = −1,65 bajo N.T.).
   Fundaciones (planta, x = a lo largo del brazo): Z55 (Tipo T) 0,55 × 1,40 · Z90 centrada 0,90 × 0,90 · Z90 excéntrica 0,90 × 0,90 con el bloque desplazado 0,20 hacia el brazo (poste al lado contrario). */
var FUND = {
  Z55:  { nom: "Z55×140 (T)", bx: .55, bz: 1.40, ox: 0,   estr: [0, .15, .30, .45, .60, .75, .90, 1.05, 1.20], interior: [0, .15, .30, .45], orejas: false },
  Z90C: { nom: "Z90 centrada", bx: .90, bz: .90, ox: 0,   estr: [0, .15, .30, .60, .90, 1.20], interior: [], orejas: true },
  Z90E: { nom: "Z90 excéntrica", bx: .90, bz: .90, ox: .20, estr: [0, .15, .30, .60, .90, 1.20], interior: [], orejas: true }
};
var Y_NT = .06, Y_HTOP = -.09, H_BLOQ = 1.40, H_EMP = .10, H_MAST = 7.565, PLACA = .42, Y_TS = 7.165;
/* brazo (m desde el eje del poste): 2 cordones inferiores Ø76,1 (separados 230 mm) y 1 superior Ø60,3, diagonales en zigzag */
var BRAZO = { yInf0: 6.464, yInf1: 6.512, ySup: 6.89, xIni: 0.13, xSupFin: 4.15, xBajada: 4.70, sepInf: .115,
  bajos: [0.83, 2.01, 3.31, 4.66], altos: [0.30, 1.36, 2.66, 3.95] };

function cargarThree(cb){
  if(window.THREE) return cb();
  var s = document.createElement("script"); s.src = THREE_SRC; s.onload = cb;
  s.onerror = function(){ alert("No se pudo cargar el visor 3D. Revisa tu conexión."); };
  document.head.appendChild(s);
}

function construir(T, o){
  var raiz = new T.Group(), ej = o.ejec || {}, tipo = o.tipo, brazo = o.brazo;
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
  var F = FUND[o.fund] || FUND.Z55, ox = F.ox;          /* bloque centrado en x = ox (hacia el brazo); el poste queda en x = 0, z = 0 */
  var hF = !!ej["Inst. de Fundación"], mAc = mat(hF, 0xf08a4b);
  var gF = new T.Group(); gF.name = "fundacion";
  caja(F.bx, H_EMP, F.bz, ox, -1.54, 0, mat(!!ej["Emplantillado"], 0x8a7b6a), gF);
  var mHor = o.armaduras && hF ? new T.MeshStandardMaterial({ color: acero(0x7d8590), transparent: true, opacity: .28, depthWrite: false }) : mat(hF, 0x7d8590);
  caja(F.bx, H_BLOQ, F.bz, ox, Y_HTOP - H_BLOQ / 2, 0, mHor, gF);
  var mGr = ej["Grouting"] ? new T.MeshStandardMaterial({ color: acero(0xe8dcae), transparent: true, opacity: .55, depthWrite: false }) : mat(false);
  caja(.50, Y_NT - Y_HTOP, .50, 0, (Y_NT + Y_HTOP) / 2, 0, mGr, gF);
  if(o.armaduras){
    var V3 = function(x, y, z){ return new T.Vector3(x, y, z); }, r8 = .004, r12 = .006, c = .05;
    var x0 = ox - F.bx / 2 + c, x1 = ox + F.bx / 2 - c, z0 = -F.bz / 2 + c, z1 = F.bz / 2 - c;
    function anillo(y, xa, xb, za, zb){
      cil(V3(xa, y, za), V3(xb, y, za), r8, mAc, gF); cil(V3(xb, y, za), V3(xb, y, zb), r8, mAc, gF);
      cil(V3(xb, y, zb), V3(xa, y, zb), r8, mAc, gF); cil(V3(xa, y, zb), V3(xa, y, za), r8, mAc, gF);
    }
    F.estr.forEach(function(d){ anillo(Y_HTOP - .06 - d, x0, x1, z0, z1); });          /* estribos Ø8 perimetrales */
    F.interior.forEach(function(d){ anillo(Y_HTOP - .06 - d, -.25, .25, -.25, .25); });   /* estribos Ø8 interiores (L=210) */
    var yt = Y_HTOP - .03, yb = Y_HTOP - 1.33;                                            /* barras Ø12: 1,30 m + ganchos de 10 cm */
    var pts = [[x0, z0, 1, 1], [x1, z0, -1, 1], [x0, z1, 1, -1], [x1, z1, -1, -1], [ox, z0, 0, 1], [ox, z1, 0, -1], [x0, 0, 1, 0], [x1, 0, -1, 0]];
    pts.forEach(function(p){
      cil(V3(p[0], yb, p[1]), V3(p[0], yt, p[1]), r12, mAc, gF);
      cil(V3(p[0], yt, p[1]), V3(p[0] + p[2] * .10, yt, p[1] + p[3] * .10), r12, mAc, gF);
      cil(V3(p[0], yb, p[1]), V3(p[0] + p[2] * .10, yb, p[1] + p[3] * .10), r12, mAc, gF);
    });
    if(F.orejas){                                                                         /* 2 orejas de izaje, horquilla Ø16 */
      [-.10, .10].forEach(function(zz){
        var ex = .25, rr = .034;
        cil(V3(ex - rr, Y_HTOP - .60, zz), V3(ex - rr, Y_NT + .0, zz), .008, mAc, gF); cil(V3(ex + rr, Y_HTOP - .60, zz), V3(ex + rr, Y_NT + .0, zz), .008, mAc, gF);
        cil(V3(ex - rr, Y_NT, zz), V3(ex + rr, Y_NT, zz), .008, mAc, gF);
      });
    }
  }
  raiz.add(gF);

  /* ---- poste: placa base 420×420×20 con 4 ranuras Ø30×55, cartelas PL 8, jaula de anclaje 4 × 7/8" ---- */
  var gP = new T.Group(), hP = !!ej["Inst. Poste V"], mP = mat(hP, 0x8fb0d0), mPl = mat(hP, 0x5d6975), mH = mat(hP, 0xe6ebef); gP.name = "poste";
  (function(){
    var h = PLACA / 2, rc = .03, sh = new T.Shape();
    sh.moveTo(-h + rc, -h); sh.lineTo(h - rc, -h); sh.quadraticCurveTo(h, -h, h, -h + rc); sh.lineTo(h, h - rc); sh.quadraticCurveTo(h, h, h - rc, h);
    sh.lineTo(-h + rc, h); sh.quadraticCurveTo(-h, h, -h, h - rc); sh.lineTo(-h, -h + rc); sh.quadraticCurveTo(-h, -h, -h + rc, -h);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(q){            /* ranura Ø30 × 55, alargada en arco (tangente) */
      var cx = q[0] * .15, cy = q[1] * .15, a = Math.atan2(cy, cx) + Math.PI / 2, dx = Math.cos(a) * .0125, dy = Math.sin(a) * .0125, hl = new T.Path(), r = .015;
      hl.absarc(cx + dx, cy + dy, r, a - Math.PI / 2, a + Math.PI / 2, false); hl.absarc(cx - dx, cy - dy, r, a + Math.PI / 2, a + Math.PI * 1.5, false); sh.holes.push(hl);
    });
    var g = new T.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -.02, 0);
    gP.add(new T.Mesh(g, mPl));
  })();
  var mBu = mat(hP, 0xf2f4f6), hexG = function(r, h){ return new T.CylinderGeometry(r, r, h, 6); };
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(s){
    var bx = s[0] * .15, bz = s[1] * .15, V = function(y, dx, dz){ return new T.Vector3(bx + (dx || 0), y, bz + (dz || 0)); };
    cil(V(-.69), V(.06), .0111, mBu, gP);                                     /* perno 7/8"-9UNC, L=750 */
    cil(V(-.69), V(-.69, -s[0] * .10, 0), .0111, mBu, gP);                    /* gancho de 100 mm */
    [[.0, .008, .008 + .022], [-.02, -.028, -.028 - .022]].forEach(function(n){          /* golillón 70×70×8 + tuerca, arriba y abajo de la placa */
      var up = n[0] === 0, wy = up ? .004 : -.024, ty = up ? .019 : -.039;
      caja(.07, .008, .07, bx, wy, bz, mBu, gP);
      var nu = new T.Mesh(hexG(.019, .022), mBu); nu.position.set(bx, ty, bz); gP.add(nu);
    });
  });
  [-.20, -.38].forEach(function(y){                                              /* flejes PL 25×5 de la jaula */
    caja(.322, .025, .005, 0, y, .1555, mBu, gP); caja(.322, .025, .005, 0, y, -.1555, mBu, gP);
    caja(.005, .025, .322, .1555, y, 0, mBu, gP); caja(.005, .025, .322, -.1555, y, 0, mBu, gP);
  });
  function tramo(y0, y1, r0, r1){            /* octágono: r = radio circunscrito ≈ ancho entre caras / 2 / cos(22,5°) */
    var k = 1 / Math.cos(Math.PI / 8) / 2, g = new T.CylinderGeometry(r1 * k, r0 * k, y1 - y0, 8, 1);
    g.rotateY(Math.PI / 8); var me = new T.Mesh(g, mP); me.position.set(0, (y0 + y1) / 2, 0); gP.add(me);
    if(!hP){ var ed = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: pal.bp })); ed.position.copy(me.position); gP.add(ed); }
  }
  tramo(0, 5.4, .250, .181);                 /* T.I.: OCT 250-175 x 4 mm, 5,40 m */
  tramo(4.95, Y_TS, .189, .160);             /* T.S.: OCT 189-160 x 4 mm (traslapa con T.I.) */
  /* cartelas PL 8 mm (4): trapecio alto 220, base 80, tope 30 */
  var shp = new T.Shape(); shp.moveTo(.125, 0); shp.lineTo(.205, 0); shp.lineTo(.205, .03); shp.lineTo(.125, .22);
  for(var k = 0; k < 4; k++){
    var gg = new T.ExtrudeGeometry(shp, { depth: .008, bevelEnabled: false }); gg.translate(0, 0, -.004); gg.rotateY(k * Math.PI / 2);
    gP.add(new T.Mesh(gg, mPl));
  }
  /* punta (Detalle B): cartelas PL 4 mm base 160, tubo Ø42 × 400, 2 pernos 1/2" a 150 y 250 mm de la punta */
  var shq = new T.Shape(); shq.moveTo(.021, 0); shq.lineTo(.080, 0); shq.lineTo(.021, .15);
  for(var k2 = 0; k2 < 4; k2++){
    var g2 = new T.ExtrudeGeometry(shq, { depth: .004, bevelEnabled: false }); g2.translate(0, 0, -.002); g2.rotateY(k2 * Math.PI / 2); g2.translate(0, Y_TS, 0);
    gP.add(new T.Mesh(g2, mH));
  }
  cil(new T.Vector3(0, Y_TS, 0), new T.Vector3(0, H_MAST, 0), .021, mH, gP);
  cil(new T.Vector3(.021, H_MAST - .15, 0), new T.Vector3(.04, H_MAST - .15, 0), .008, mBu, gP);
  cil(new T.Vector3(0, H_MAST - .25, .021), new T.Vector3(0, H_MAST - .25, .04), .008, mBu, gP);
  /* ventana de registro (vista frontal: desde 0,44 m) */
  if(hP) caja(.05, .30, .008, 0, .59, .1235, new T.MeshStandardMaterial({ color: 0x20262e }), gP);
  /* cabezal de conexión (Sección C-C): caja 200 x 280 mm, PL 8 mm en las caras del brazo, perfiles 16 mm laterales, 4+4 pernos Ø5/8", coplas 1½" */
  var HT = 7.00, HH = .63, HY = HT - HH / 2, mBol = mat(hP, 0xf2f4f6);
  [-1, 1].forEach(function(sg){
    caja(.008, HH, .28, sg * .096, HY, 0, mH, gP);
    caja(.192, HH, .016, 0, HY, sg * .132, mH, gP);
    [.07, .22, .39, .56].forEach(function(d){
      [-.1, .1].forEach(function(zz){ cil(new T.Vector3(sg * .102, HT - d, zz), new T.Vector3(sg * .116, HT - d, zz), .014, mBol, gP); });
    });
  });
  var mCop = mat(hP, 0xc0502f);
  [[HT - .07, 0], [HT - .475, -.08], [HT - .475, 0], [HT - .475, .08]].forEach(function(c){
    cil(new T.Vector3(-.112, c[0], c[1]), new T.Vector3(.112, c[0], c[1]), .026, mCop, gP);
  });
  raiz.add(gP);

  /* ---- brazo(s) enrejado(s) en lo alto del poste ---- */
  var gB = new T.Group(), hB = !!ej["Inst. Brazo H"], mB = mat(hB, 0xd9a672); gB.name = "brazo";
  var lados = tipo === "T" ? [1, -1] : [1], B = BRAZO, yInf = function(x){ return B.yInf0 + (B.yInf1 - B.yInf0) * Math.min(1, x / 6.1); };
  lados.forEach(function(s){
    var V = function(x, y, z){ return new T.Vector3(s * x, y, z || 0); }, tip = brazo + .116, sp = B.sepInf, xT = B.xBajada + .12;   /* xT: fin del enrejado, luego un solo tubo */
    caja(.008, .63, .28, 0, 0, 0, mB, gB).position.set(s * .108, 6.685, 0);                                   /* placa de unión PL 8 (8 pernos) */
    [-1, 1].forEach(function(q){
      cil(V(B.xIni, yInf(B.xIni), q * sp), V(xT, yInf(xT), q * sp), .038, mB, gB);                             /* cordones inferiores Ø76,1 */
      cil(V(xT, yInf(xT), q * sp), V(xT + .12, yInf(xT + .12), 0), .038, mB, gB);                                /* convergen en un solo tubo */
    });
    cil(V(xT + .12, yInf(xT + .12)), V(tip, yInf(tip)), .038, mB, gB);                                         /* voladizo: tubo único */
    cil(V(B.xIni, B.ySup), V(B.xSupFin, B.ySup), .030, mB, gB);                                               /* cordón superior Ø60,3 */
    cil(V(B.xSupFin, B.ySup), V(B.xBajada, yInf(B.xBajada), 0), .030, mB, gB);
    var nodos = []; B.bajos.forEach(function(x){ nodos.push([x, 0]); }); B.altos.forEach(function(x){ nodos.push([x, 1]); });
    nodos.sort(function(a, b){ return a[0] - b[0]; });
    function P(n, q){ return n[1] ? V(n[0], B.ySup, 0) : V(n[0], yInf(n[0]), q * sp); }
    for(var i = 1; i < nodos.length; i++){
      [-1, 1].forEach(function(q){ cil(P(nodos[i - 1], q), P(nodos[i], q), .022, mB, gB); });                       /* diagonales (2 caras del triángulo) */
    }
    nodos.forEach(function(n){ if(!n[1]) cil(P(n, -1), P(n, 1), .018, mB, gB); });                              /* arriostres transversales inferiores */
  });
  raiz.add(gB);
  return raiz;
}

function abrir(o){
  cargarThree(function(){
    var T = window.THREE, tipo = o.tipo === "L" ? "L" : "T", brazo = 6, sinTipo = !o.tipo, fund = tipo === "L" ? "Z90E" : "Z55", armaduras = false;
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
      + '<div style="position:absolute;top:0;left:0;right:0;padding:10px 14px;pointer-events:none"><b style="font-size:15px">' + String(o.nombre || "").replace(/</g, "&lt;") + ' · 3D</b><div class="v3-sub" style="font-size:12px;color:var(--ink-soft,rgba(232,237,243,.68))"></div></div>'
      + '<button class="v3-x" aria-label="Cerrar" style="position:absolute;top:8px;right:10px;background:var(--paper-raised,#1A222C);color:var(--ink,#E8EDF3);border:1px solid var(--line-strong,#3a465b);border-radius:10px;font-size:18px;padding:4px 12px;cursor:pointer">✕</button>'
      + '<div class="v3-leg" style="position:absolute;left:10px;top:58px;background:var(--paper-raised,#1A222C);border:1px solid var(--line-strong,#3a465b);border-radius:10px;padding:8px 10px;font-size:12px"></div>'
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
    var suelo = new T.Mesh(new T.BoxGeometry(6, 1.8, 3.4), new T.MeshStandardMaterial({ color: 0x7a6a55, transparent: true, opacity: .1, depthWrite: false })); suelo.position.set(0, Y_NT - .9, 0); sc.add(suelo);
    var rejilla = new T.GridHelper(14, 14, pal.claro ? 0xb9b6ab : 0x3a465b, pal.claro ? 0xd3d0c6 : 0x2f3a4d); rejilla.position.y = Y_NT; sc.add(rejilla);
    var st = { yaw: .7, pitch: .35, dist: 16, tx: 0, ty: 3.2, tz: 0 }, modelo = null, corte = false;

    function dibujar(){
      if(modelo) sc.remove(modelo);
      modelo = construir(T, { tipo: tipo, brazo: brazo, ejec: o.ejec, pal: pal, fund: fund, armaduras: armaduras }); sc.add(modelo);
      suelo.material.opacity = (o.ejec && o.ejec["Relleno"]) ? .35 : .08; 
      win.querySelector(".v3-sub").textContent = (o.comuna ? o.comuna + " · " : "") + "Tipo " + tipo + " · brazo " + brazo + " m · fundación " + FUND[fund].nom + (sinTipo ? " (tipo no definido en la ficha)" : "") + " · modelo referencial · girar: arrastrar · mover: clic derecho / Shift / dos dedos · zoom: rueda";
      var e = o.ejec || {}, li = function(ok, c, t){ return '<div><span style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;background:' + (ok ? c : "transparent") + ';border:1px solid ' + (ok ? c : bp) + '"></span>' + t + (ok ? "" : " (pendiente)") + '</div>'; };
      win.querySelector(".v3-leg").innerHTML = li(!!e["Emplantillado"], "#8a7b6a", "Emplantillado") + li(!!e["Inst. de Fundación"], "#7d8590", "Fundación") + li(!!e["Grouting"], "#e8dcae", "Grouting")
        + li(!!e["Inst. Poste V"], "#8fb0d0", "Poste (mástil)") + li(!!e["Inst. Poste V"], "#5d6975", "Placa base y cartelas") + li(!!e["Inst. Poste V"], "#e6ebef", "Cabezal y punta") + li(!!e["Inst. Brazo H"], "#d9a672", "Brazo");
      var b = win.querySelectorAll(".v3-bar button"); b.forEach(function(x){ x.style.borderColor = (x.dataset.k === "t" + tipo || x.dataset.k === "b" + brazo || x.dataset.k === "f" + fund || (x.dataset.k === "ar" && armaduras)) ? cssv("--accent", "#D9A272") : ""; });
    }
    var bar = win.querySelector(".v3-bar");
    [["tT", "Tipo T"], ["tL", "Tipo L"], ["b6", "Brazo 6 m"], ["b7", "Brazo 7 m"], ["v", "Vista general"], ["e", "Elevación"], ["h", "Cabezal"], ["f", "Ver fundación"], ["a", "Ver anclaje"], ["fZ55", "Z55×140"], ["fZ90C", "Z90 centrada"], ["fZ90E", "Z90 excéntrica"], ["ar", "Armaduras"], ["c", "Terreno"], ["z", "Centrar"]].forEach(function(x){
      var bt = document.createElement("button"); bt.textContent = x[1]; bt.dataset.k = x[0].replace(/^t(.)$/, "t$1");
      bt.onclick = function(){
        if(x[0] === "tT"){ tipo = "T"; sinTipo = false; fund = "Z55"; } else if(x[0] === "tL"){ tipo = "L"; sinTipo = false; fund = "Z90E"; }
        else if(/^fZ/.test(x[0])) fund = x[0].slice(1);
        else if(x[0] === "ar"){ armaduras = !armaduras; }
        else if(x[0] === "z"){ st.tx = 0; st.tz = 0; st.ty = 3.2; }
        else if(x[0] === "a"){ st.yaw = .8; st.pitch = .3; st.dist = 1.6; st.tx = 0; st.tz = 0; st.ty = -.15; }
        else if(x[0] === "b6") brazo = 6; else if(x[0] === "b7") brazo = 7;
        else if(x[0] === "v"){ st.dist = 16; st.tx = 0; st.tz = 0; st.ty = 3.2; st.pitch = .35; }
        else if(x[0] === "e"){ st.yaw = 0; st.pitch = 0; st.dist = 22; st.tx = 0; st.tz = 0; st.ty = 3.2; }
        else if(x[0] === "h"){ st.yaw = .9; st.pitch = .2; st.dist = 3.4; st.tx = 0; st.tz = 0; st.ty = 6.7; }
        else if(x[0] === "f"){ st.dist = 5.5; st.tx = 0; st.tz = 0; st.ty = -.8; st.pitch = .25; }
        else if(x[0] === "c"){ suelo.visible = !suelo.visible; }
        dibujar();
      };
      bar.appendChild(bt);
    });
    function tam(){ var w = win.clientWidth, h = win.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    function pinta(){
      cam.position.set(st.tx + Math.sin(st.yaw) * Math.cos(st.pitch) * st.dist, st.ty + Math.sin(st.pitch) * st.dist, st.tz + Math.cos(st.yaw) * Math.cos(st.pitch) * st.dist);
      cam.lookAt(st.tx, st.ty, st.tz); r.render(sc, cam);
    }
    var vivo = true; (function loop(){ if(!vivo) return; pinta(); requestAnimationFrame(loop); })();
    var pts = {}, ult = null;
    cv.addEventListener("pointerdown", function(e){ cv.setPointerCapture(e.pointerId); pts[e.pointerId] = e; ult = null; });
    function pan(dx, dy){                       /* desplaza el centro de visión en el plano de la pantalla */
      var k = .728 * st.dist / Math.max(300, win.clientHeight);
      st.tx -= Math.cos(st.yaw) * dx * k; st.tz += Math.sin(st.yaw) * dx * k; st.ty = Math.max(-3, Math.min(12, st.ty + dy * k));
    }
    cv.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    cv.addEventListener("pointermove", function(e){
      var ids = Object.keys(pts); if(!pts[e.pointerId]) return;
      if(ids.length === 1 && (e.shiftKey || (e.buttons & 6))){ pan(e.clientX - pts[e.pointerId].clientX, e.clientY - pts[e.pointerId].clientY); }
      else if(ids.length === 1){ st.yaw -= (e.clientX - pts[e.pointerId].clientX) * .008; st.pitch = Math.max(-.2, Math.min(1.45, st.pitch + (e.clientY - pts[e.pointerId].clientY) * .008)); }
      else if(ids.length === 2){
        var o2 = ids.filter(function(k){ return +k !== e.pointerId; })[0], a = pts[o2], d0 = Math.hypot(a.clientX - pts[e.pointerId].clientX, a.clientY - pts[e.pointerId].clientY), d1 = Math.hypot(a.clientX - e.clientX, a.clientY - e.clientY);
        st.dist = Math.max(2, Math.min(40, st.dist * d0 / Math.max(1, d1)));
        pan((e.clientX - pts[e.pointerId].clientX) / 2, (e.clientY - pts[e.pointerId].clientY) / 2);
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
