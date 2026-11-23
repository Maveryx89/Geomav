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
  var cur = null;
  function tg(g, n, info){ cur = { g: g, n: n, i: info || [] }; }          /* etiqueta (capa + datos) de las piezas que se crean a continuación */
  function add(g, me){ if(cur) me.userData.tag = cur; g.add(me); return me; }
  function caja(w, h, d, x, y, z, m, g){
    var me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.position.set(x, y, z); if(cur) me.userData.tag = cur; g.add(me);
    if(!m.transparent || m.opacity > .5) return me;
    var ed = new T.LineSegments(new T.EdgesGeometry(me.geometry), new T.LineBasicMaterial({ color: pal.bp })); ed.position.copy(me.position); g.add(ed);
    return me;
  }
  function cil(a, b, r, m, g){
    var v = new T.Vector3().subVectors(b, a), len = v.length();
    var me = new T.Mesh(new T.CylinderGeometry(r, r, len, 8), m);
    me.position.copy(a).addScaledVector(v, .5);
    me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize());
    if(cur) me.userData.tag = cur; g.add(me); return me;
  }
  var F = FUND[o.fund] || FUND.Z55, ox = F.ox;          /* bloque centrado en x = ox (hacia el brazo); el poste queda en x = 0, z = 0 */
  var hF = !!ej["Inst. de Fundación"], mAc = mat(hF, 0x76ff03);
  var gF = new T.Group(); gF.name = "fundacion";
  var dimF = Math.round(F.bx * 1000) + " × " + Math.round(F.bz * 1000) + " mm (planta) × 1400 mm (alto)";
  tg("emp", "Emplantillado G5", [["Material", "Hormigón G5"], ["Espesor", "100 mm"], ["Planta", Math.round(F.bx * 1000) + " × " + Math.round(F.bz * 1000) + " mm"], ["Nota", "La sobreexcavación puede rellenarse con hormigón pobre o áridos compactados"]]);
  caja(F.bx, H_EMP, F.bz, ox, -1.54, 0, mat(!!ej["Emplantillado"], 0x7a5230), gF);
  tg("hor", "Fundación " + F.nom, [["Hormigón", "G25"], ["Dimensiones", dimF], ["Posición", ox ? "Excéntrica: bloque desplazado 200 mm hacia el brazo (poste al lado contrario)" : "Centrada respecto al poste"], ["Nota", "Puede ser prefabricada o in situ; la geometría puede ajustarse si la topografía lo requiere"]]);
  var mHor = o.armaduras && hF ? new T.MeshStandardMaterial({ color: acero(0xb9b4a6), transparent: true, opacity: .28, depthWrite: false }) : mat(hF, 0xb9b4a6);
  caja(F.bx, H_BLOQ, F.bz, ox, Y_HTOP - H_BLOQ / 2, 0, mHor, gF);
  var mGr = ej["Grouting"] ? new T.MeshStandardMaterial({ color: acero(0xffd23f), transparent: true, opacity: .6, depthWrite: false }) : mat(false);
  tg("gro", "Grouting", [["Dimensiones", "500 × 500 mm, e = 150 mm"], ["Función", "Cubre la placa base (a 60 mm bajo N.T.), tuercas y golillones"], ["Nota", "Una vez instalado el pórtico se cubre la conexión de anclaje con hormigón in situ"]]);
  caja(.50, Y_NT - Y_HTOP, .50, 0, (Y_NT + Y_HTOP) / 2, 0, mGr, gF);
  if(o.armaduras){
    var V3 = function(x, y, z){ return new T.Vector3(x, y, z); }, r8 = .004, r12 = .006, c = .05;
    var x0 = ox - F.bx / 2 + c, x1 = ox + F.bx / 2 - c, z0 = -F.bz / 2 + c, z1 = F.bz / 2 - c;
    function anillo(y, xa, xb, za, zb){
      cil(V3(xa, y, za), V3(xb, y, za), r8, mAc, gF); cil(V3(xb, y, za), V3(xb, y, zb), r8, mAc, gF);
      cil(V3(xb, y, zb), V3(xa, y, zb), r8, mAc, gF); cil(V3(xa, y, zb), V3(xa, y, za), r8, mAc, gF);
    }
    tg("arm", "Estribos Ø8", [["Acero", "Ø8"], ["Distribución", o.fund === "Z55" ? "9 @15 L=370 + 4 @15 L=210 (interiores)" : "3 @15 + 3 @30"], ["Recubrimiento", "≈ 50 mm"], ["Nota", "Armadura simplificada (referencial)"]]);
    F.estr.forEach(function(d){ anillo(Y_HTOP - .06 - d, x0, x1, z0, z1); });          /* estribos Ø8 perimetrales */
    F.interior.forEach(function(d){ anillo(Y_HTOP - .06 - d, -.25, .25, -.25, .25); });   /* estribos Ø8 interiores (L=210) */
    tg("arm", "Barras Ø12", [["Acero", "Ø12"], ["Largo", "L=150 (10+130+10), con ganchos de 10 cm"], ["Cantidad en plano", o.fund === "Z55" ? "1+1, 7+7, 2+2, 3+3 (por zona)" : "4+4, 2+2"], ["Nota", "Se dibujan 8 barras de forma referencial"]]);
    var yt = Y_HTOP - .03, yb = Y_HTOP - 1.33;                                            /* barras Ø12: 1,30 m + ganchos de 10 cm */
    var pts = [[x0, z0, 1, 1], [x1, z0, -1, 1], [x0, z1, 1, -1], [x1, z1, -1, -1], [ox, z0, 0, 1], [ox, z1, 0, -1], [x0, 0, 1, 0], [x1, 0, -1, 0]];
    pts.forEach(function(p){
      cil(V3(p[0], yb, p[1]), V3(p[0], yt, p[1]), r12, mAc, gF);
      cil(V3(p[0], yt, p[1]), V3(p[0] + p[2] * .10, yt, p[1] + p[3] * .10), r12, mAc, gF);
      cil(V3(p[0], yb, p[1]), V3(p[0] + p[2] * .10, yb, p[1] + p[3] * .10), r12, mAc, gF);
    });
    if(F.orejas){ tg("ore", "Oreja de izaje", [["Acero", "Horquilla Ø16"], ["Largo", "L=150, alto de la oreja 68 mm"], ["Cantidad", "2 por fundación (Z90)"]]);                                                                         /* 2 orejas de izaje, horquilla Ø16 */
      [-.10, .10].forEach(function(zz){
        var ex = .25, rr = .034;
        cil(V3(ex - rr, Y_HTOP - .60, zz), V3(ex - rr, Y_NT + .0, zz), .008, mAc, gF); cil(V3(ex + rr, Y_HTOP - .60, zz), V3(ex + rr, Y_NT + .0, zz), .008, mAc, gF);
        cil(V3(ex - rr, Y_NT, zz), V3(ex + rr, Y_NT, zz), .008, mAc, gF);
      });
    }
  }
  raiz.add(gF);

  /* ---- poste: placa base 420×420×20 con 4 ranuras Ø30×55, cartelas PL 8, jaula de anclaje 4 × 7/8" ---- */
  var gP = new T.Group(), hP = !!ej["Inst. Poste V"], mP = mat(hP, 0x2f80ed), mPl = mat(hP, 0xe53935), mH = mat(hP, 0xffffff); gP.name = "poste";
  tg("pla", "Placa base", [["Perfil", "PL 420 × 420 × 20 mm"], ["Acero", "A270ES, A36 o superior"], ["Perforaciones", "4 alargadas en arco Ø30 × 55 mm (R212)"], ["Posición", "60 mm bajo N.T."]]);
  (function(){
    var h = PLACA / 2, rc = .03, sh = new T.Shape();
    sh.moveTo(-h + rc, -h); sh.lineTo(h - rc, -h); sh.quadraticCurveTo(h, -h, h, -h + rc); sh.lineTo(h, h - rc); sh.quadraticCurveTo(h, h, h - rc, h);
    sh.lineTo(-h + rc, h); sh.quadraticCurveTo(-h, h, -h, h - rc); sh.lineTo(-h, -h + rc); sh.quadraticCurveTo(-h, -h, -h + rc, -h);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(q){            /* ranura Ø30 × 55, alargada en arco (tangente) */
      var cx = q[0] * .15, cy = q[1] * .15, a = Math.atan2(cy, cx) + Math.PI / 2, dx = Math.cos(a) * .0125, dy = Math.sin(a) * .0125, hl = new T.Path(), r = .015;
      hl.absarc(cx + dx, cy + dy, r, a - Math.PI / 2, a + Math.PI / 2, false); hl.absarc(cx - dx, cy - dy, r, a + Math.PI / 2, a + Math.PI * 1.5, false); sh.holes.push(hl);
    });
    var g = new T.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -.02, 0);
    add(gP, new T.Mesh(g, mPl));
  })();
  tg("anc", "Perno de anclaje 7/8\"", [["Material", "A-36 galvanizado"], ["Rosca", "7/8\"-9 UNC"], ["Largo", "L=750 (650+10), hilo 120 mm, gancho 100 mm"], ["Cantidad", "4 (separación 300 × 300 mm)"], ["Placa plantilla", "PL 420×420×5 mm, se retira antes del montaje (no modelada)"]]);
  var mBu = mat(hP, 0x00e5ff), hexG = function(r, h){ return new T.CylinderGeometry(r, r, h, 6); };
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(s){
    var bx = s[0] * .15, bz = s[1] * .15, V = function(y, dx, dz){ return new T.Vector3(bx + (dx || 0), y, bz + (dz || 0)); };
    cil(V(-.69), V(.06), .0111, mBu, gP);                                     /* perno 7/8"-9UNC, L=750 */
    cil(V(-.69), V(-.69, -s[0] * .10, 0), .0111, mBu, gP);                    /* gancho de 100 mm */
    tg("tue", "Tuerca y golillón", [["Tuerca", "Hexagonal galv. A-563 Gr.A 7/8\"-9 UNC"], ["Golillón", "Galv. 70 × 70 × 8 mm"], ["Cantidad", "2+2 tuercas y 2+2 golillones por perno (arriba y abajo de la placa)"]]);
    [[.0, .008, .008 + .022], [-.02, -.028, -.028 - .022]].forEach(function(n){          /* golillón 70×70×8 + tuerca, arriba y abajo de la placa */
      var up = n[0] === 0, wy = up ? .004 : -.024, ty = up ? .019 : -.039;
      caja(.07, .008, .07, bx, wy, bz, mBu, gP);
      var nu = new T.Mesh(hexG(.019, .022), mBu); nu.position.set(bx, ty, bz); add(gP, nu);
    });
  });
  tg("fle", "Fleje de la jaula", [["Perfil", "PL 25 × 5 mm"], ["Cantidad", "2 niveles (≈ 200 y 380 mm bajo la placa)"]]);
  [-.20, -.38].forEach(function(y){                                              /* flejes PL 25×5 de la jaula */
    caja(.322, .025, .005, 0, y, .1555, mBu, gP); caja(.322, .025, .005, 0, y, -.1555, mBu, gP);
    caja(.005, .025, .322, .1555, y, 0, mBu, gP); caja(.005, .025, .322, -.1555, y, 0, mBu, gP);
  });
  function tramo(y0, y1, r0, r1){            /* octágono: r = radio circunscrito ≈ ancho entre caras / 2 / cos(22,5°) */
    var k = 1 / Math.cos(Math.PI / 8) / 2, g = new T.CylinderGeometry(r1 * k, r0 * k, y1 - y0, 8, 1);
    g.rotateY(Math.PI / 8); var me = new T.Mesh(g, mP); me.position.set(0, (y0 + y1) / 2, 0); add(gP, me);
    if(!hP){ var ed = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: pal.bp })); ed.position.copy(me.position); gP.add(ed); }
  }
  tg("mti", "Mástil tramo inferior (T.I.)", [["Perfil", "OCT 250–175 × 4 mm"], ["Acero", "A36 galvanizado"], ["Largo", "5400 mm"], ["Nota", "Postes tipo T y L son iguales"]]);
  tramo(0, 5.4, .250, .181);                 /* T.I.: OCT 250-175 x 4 mm, 5,40 m */
  tg("mts", "Mástil tramo superior (T.S.)", [["Perfil", "OCT 189–160 × 4 mm"], ["Acero", "A36 galvanizado"], ["Inicio", "Ø189 a +4,89 m de N.T. (traslapa con T.I.)"], ["Fin", "Ø160"]]);
  tramo(4.95, Y_TS, .189, .160);             /* T.S.: OCT 189-160 x 4 mm (traslapa con T.I.) */
  /* cartelas PL 8 mm (4): trapecio alto 220, base 80, tope 30 */
  tg("car", "Cartela de la placa base", [["Perfil", "PL 8 mm"], ["Geometría", "Trapecio: alto 220 mm, base 80 mm"], ["Cantidad", "4"]]);
  var shp = new T.Shape(); shp.moveTo(.125, 0); shp.lineTo(.205, 0); shp.lineTo(.205, .03); shp.lineTo(.125, .22);
  for(var k = 0; k < 4; k++){
    var gg = new T.ExtrudeGeometry(shp, { depth: .008, bevelEnabled: false }); gg.translate(0, 0, -.004); gg.rotateY(k * Math.PI / 2);
    add(gP, new T.Mesh(gg, mPl));
  }
  /* punta (Detalle B): cartelas PL 4 mm base 160, tubo Ø42 × 400, 2 pernos 1/2" a 150 y 250 mm de la punta */
  tg("pun", "Punta del mástil (Detalle B)", [["Tubo", "Ø42 × 400 mm"], ["Cartelas", "PL 4 mm, base 160 mm"], ["Pernos", "1/2\" UNC a 150 y 250 mm de la punta"]]);
  var shq = new T.Shape(); shq.moveTo(.021, 0); shq.lineTo(.080, 0); shq.lineTo(.021, .15);
  for(var k2 = 0; k2 < 4; k2++){
    var g2 = new T.ExtrudeGeometry(shq, { depth: .004, bevelEnabled: false }); g2.translate(0, 0, -.002); g2.rotateY(k2 * Math.PI / 2); g2.translate(0, Y_TS, 0);
    add(gP, new T.Mesh(g2, mH));
  }
  cil(new T.Vector3(0, Y_TS, 0), new T.Vector3(0, H_MAST, 0), .021, mH, gP);
  cil(new T.Vector3(.021, H_MAST - .15, 0), new T.Vector3(.04, H_MAST - .15, 0), .008, mBu, gP);
  cil(new T.Vector3(0, H_MAST - .25, .021), new T.Vector3(0, H_MAST - .25, .04), .008, mBu, gP);
  /* ventana de registro (vista frontal: desde 0,44 m) */
  tg("ven", "Ventana de registro", [["Ubicación", "Vista frontal, desde 440 mm sobre la placa"], ["Nota", "Dimensiones referenciales"]]);
  if(hP) caja(.05, .30, .008, 0, .59, .1235, new T.MeshStandardMaterial({ color: 0x20262e }), gP);
  /* cabezal de conexión (Sección C-C): caja 200 x 280 mm, PL 8 mm en las caras del brazo, perfiles 16 mm laterales, 4+4 pernos Ø5/8", coplas 1½" */
  var HT = 7.00, HH = .63, HY = HT - HH / 2, mBol = mat(hP, 0x00e5ff);
  [-1, 1].forEach(function(sg){
    tg("cab", "Cabezal de conexión", [["Caja", "200 × 280 × 630 mm"], ["Placas", "PL 8 mm 280 × 630, perforaciones Ø18"], ["Laterales", "Perfil 16 mm; AT 6 mm internas (4, no modeladas); PL 8 mm plegada"], ["Pernos", "4+4 Ø5/8\" Gr.5 UNC galv. por cara, filas a 70/150/170/170 mm"]]);
    caja(.008, HH, .28, sg * .096, HY, 0, mH, gP);
    caja(.192, HH, .016, 0, HY, sg * .132, mH, gP);
    tg("pcb", "Perno del cabezal", [["Perno", "Ø5/8\" Gr.5 UNC galvanizado"], ["Cantidad", "4+4 por cara (8 por brazo)"], ["Perforación", "Ø18 mm"]]);
    [.07, .22, .39, .56].forEach(function(d){
      [-.1, .1].forEach(function(zz){ cil(new T.Vector3(sg * .102, HT - d, zz), new T.Vector3(sg * .116, HT - d, zz), .014, mBol, gP); });
    });
  });
  tg("cop", "Copla 1½\" NPT H/I", [["Tipo", "Copla 1-1/2\" NPT hembra/interior"], ["Cantidad", "4 (1 arriba + 3 abajo)"]]);
  var mCop = mat(hP, 0xab47bc);
  [[HT - .07, 0], [HT - .475, -.08], [HT - .475, 0], [HT - .475, .08]].forEach(function(c){
    cil(new T.Vector3(-.112, c[0], c[1]), new T.Vector3(.112, c[0], c[1]), .026, mCop, gP);
  });
  raiz.add(gP);

  /* ---- brazo(s) enrejado(s) en lo alto del poste ---- */
  var gB = new T.Group(), hB = !!ej["Inst. Brazo H"], mB = mat(hB, 0xff9800); gB.name = "brazo";
  var lados = tipo === "T" ? [1, -1] : [1], B = BRAZO, yInf = function(x){ return B.yInf0 + (B.yInf1 - B.yInf0) * Math.min(1, x / 6.1); };
  lados.forEach(function(s){
    var V = function(x, y, z){ return new T.Vector3(s * x, y, z || 0); }, tip = brazo + .116, sp = B.sepInf, xT = B.xBajada + .12;   /* xT: fin del enrejado, luego un solo tubo */
    tg("pbr", "Placa de unión del brazo", [["Perfil", "PL 8 mm, 280 × 630"], ["Unión", "8 pernos Ø5/8\" al cabezal"]]);
    caja(.008, .63, .28, 0, 0, 0, mB, gB).position.set(s * .108, 6.685, 0);                                   /* placa de unión PL 8 (8 pernos) */
    tg("bra", "Cordón inferior del brazo", [["Tubo", "CAÑ Ø2½\" 76,1 mm, ISO-R65 serie liviana (3,2 mm)"], ["Cordones", "2, separados 230 mm; convergen en un tubo único en el voladizo"], ["Largo", brazo + " m (brazo de 6 m = brazo de 7 m con 1 m menos de voladizo)"], ["Contraflecha", brazo === 7 ? "50 mm (no aplicada)" : "40 mm (no aplicada)"]]);
    [-1, 1].forEach(function(q){
      cil(V(B.xIni, yInf(B.xIni), q * sp), V(xT, yInf(xT), q * sp), .038, mB, gB);                             /* cordones inferiores Ø76,1 */
      cil(V(xT, yInf(xT), q * sp), V(xT + .12, yInf(xT + .12), 0), .038, mB, gB);                                /* convergen en un solo tubo */
    });
    cil(V(xT + .12, yInf(xT + .12)), V(tip, yInf(tip)), .038, mB, gB);                                         /* voladizo: tubo único */
    tg("bra", "Cordón superior del brazo", [["Tubo", "CAÑ Ø2\" 60,3 mm, ISO-R65 serie liviana (2,9 mm)"], ["Altura del enrejado", "410 mm"]]);
    cil(V(B.xIni, B.ySup), V(B.xSupFin, B.ySup), .030, mB, gB);                                               /* cordón superior Ø60,3 */
    cil(V(B.xSupFin, B.ySup), V(B.xBajada, yInf(B.xBajada), 0), .030, mB, gB);
    var nodos = []; B.bajos.forEach(function(x){ nodos.push([x, 0]); }); B.altos.forEach(function(x){ nodos.push([x, 1]); });
    nodos.sort(function(a, b){ return a[0] - b[0]; });
    function P(n, q){ return n[1] ? V(n[0], B.ySup, 0) : V(n[0], yInf(n[0]), q * sp); }
    tg("bra", "Diagonal del brazo", [["Tubo", "CAÑ Ø2\" 60,3 mm (2,9 mm)"], ["Vanos", "700 + 650 mm (según elevación del plano)"]]);
    for(var i = 1; i < nodos.length; i++){
      [-1, 1].forEach(function(q){ cil(P(nodos[i - 1], q), P(nodos[i], q), .030, mB, gB); });                       /* diagonales (2 caras del triángulo) */
    }
    tg("bra", "Arriostre transversal inferior", [["Tubo", "Referencial (no acotado en el plano)"]]);
    nodos.forEach(function(n){ if(!n[1]) cil(P(n, -1), P(n, 1), .018, mB, gB); });                              /* arriostres transversales inferiores */
  });
  raiz.add(gB);
  var ms = []; raiz.traverse(function(n){ if(n.isMesh && n.material && !n.material.transparent) ms.push(n); });
  var lm = new T.LineBasicMaterial({ color: pal.claro ? 0x1b1b1b : 0x000000, transparent: true, opacity: .75 });
  ms.forEach(function(n){ var l = new T.LineSegments(new T.EdgesGeometry(n.geometry, 28), lm); n.add(l); });   /* contorno oscuro para separar piezas */
  return raiz;
}

/* capas: código de etiqueta → capa (nombre, color) */
var CAPAS = [
  ["emp", "Emplantillado", "#7a5230", ["emp"]], ["hor", "Hormigón", "#b9b4a6", ["hor"]], ["gro", "Grouting", "#ffd23f", ["gro"]],
  ["arm", "Armaduras", "#76ff03", ["arm", "ore"]], ["anc", "Anclajes", "#00e5ff", ["anc", "tue", "fle"]], ["pla", "Placa base", "#e53935", ["pla", "car"]],
  ["mas", "Mástil", "#2f80ed", ["mti", "mts", "ven", "pun"]], ["cab", "Cabezal", "#ffffff", ["cab", "pcb", "pbr"]], ["cop", "Coplas", "#ab47bc", ["cop"]], ["bra", "Brazo", "#ff9800", ["bra"]]
];
function capaDe(g){ for(var i = 0; i < CAPAS.length; i++) if(CAPAS[i][3].indexOf(g) >= 0) return i; return -1; }
/* niveles (m respecto de N.T. = ±0,00) → cota en el modelo */
var NIVELES = [["Punta del mástil", 7.505], ["Tope del cabezal", 6.94], ["Empalme T.I./T.S.", 4.89], ["N.T.", 0], ["Placa base (cara sup.)", -.06], ["Tope hormigón", -.15], ["Base hormigón", -1.55], ["N.S.E.", -1.65]];
var NOTAS = [
  ["i", "Fuente: plano HOLMING «Pórticos O'Higgins MOP» del 28-10-2026 (plantas, elevaciones, secciones y detalles)."],
  ["i", "Niveles en m respecto de N.T. = ±0,00. La placa base queda 60 mm bajo N.T., embebida en el grouting de 150 mm."],
  ["i", "Brazo de 6 m = brazo de 7 m con 1 m menos de voladizo. Postes tipo T y L son iguales; cambia el número de brazos."],
  ["i", "Soldaduras: filete 6 mm salvo indicación; aceros A36 galvanizado; placas A270ES o superior (según plano)."],
  ["i", "La fundación puede ser prefabricada o in situ; la sobreexcavación puede rellenarse con hormigón pobre o áridos compactados."],
  ["i", "Fundación Z55: 0,55 × 1,40 m en planta y 1,40 m de alto (confirmado por GEOMAV)."],
  ["w", "Armaduras referenciales: estribos Ø8 y 8 barras Ø12 dibujadas; la cantidad exacta por zona está en el plano."],
  ["w", "Soporte del gabinete (2 barras, 605 mm libres, transversal al brazo): sin cara ni altura definidas, no está modelado."],
  ["w", "Placa plantilla PL 420×420×5 (se retira antes del montaje), contraflecha del brazo (5 cm en 7 m / 4 cm en 6 m) y AT 6 mm internas del cabezal: no modelados."],
  ["w", "Arriostres transversales del brazo: referenciales (no están acotados en el plano)."]
];
function fm(v){ return (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toFixed(2).replace(".", ","); }

function abrir(o){
  cargarThree(function(){
    var T = window.THREE, tipo = o.tipo === "L" ? "L" : "T", brazo = 6, sinTipo = !o.tipo, fund = tipo === "L" ? "Z90E" : "Z55", armaduras = false;
    var cs = getComputedStyle(document.documentElement);
    function cssv(n, fb){ var v = (cs.getPropertyValue(n) || "").trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : fb; }
    var fondo = cssv("--paper-sunken", "#0B1015"), bp = cssv("--blueprint", "#5BA8BF"), acc = cssv("--accent", "#D9A272");
    var lum = (function(h){ var n = parseInt(h.slice(1), 16); return (.299 * (n >> 16) + .587 * ((n >> 8) & 255) + .114 * (n & 255)) / 255; })(fondo);
    var pal = { claro: lum > .5, bp: new T.Color(bp) };
    if(!document.getElementById("v3-css")){
      var stl = document.createElement("style"); stl.id = "v3-css";
      stl.textContent = ".v3-ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(10,34,64,.55);font:14px/1.35 var(--font-body,system-ui,sans-serif);color:var(--ink,#E8EDF3);touch-action:none}"
        + ".v3-win{position:relative;width:100%;height:100%;overflow:hidden;background:var(--paper-sunken,#0B1015)}"
        + "@media (min-width:900px) and (min-height:560px){.v3-win{width:min(1100px,92vw);height:min(760px,88vh);border-radius:14px;border:1px solid var(--line-strong,rgba(232,237,243,.28));box-shadow:0 18px 60px -12px rgba(0,0,0,.6)}}"
        + ".v3-c{background:var(--paper,#10161D);color:var(--ink,#E8EDF3);border:1px solid var(--line-strong,#3a465b);border-radius:18px;padding:6px 11px;font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap}"
        + ".v3-c:hover{border-color:var(--accent,#D9A272)}.v3-c.on{border-color:var(--accent,#D9A272);box-shadow:inset 0 0 0 1px var(--accent,#D9A272)}"
        + ".v3-bar{display:flex;justify-content:space-around;gap:2px}.v3-t{flex:1;max-width:120px;background:none;border:0;color:var(--ink-soft,rgba(232,237,243,.68));font:inherit;font-size:11px;padding:4px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;border-radius:8px}"
        + ".v3-t i{font-style:normal;font-size:18px;line-height:1.1}.v3-t.on{color:var(--ink,#E8EDF3);background:var(--paper,#10161D);box-shadow:inset 0 -2px 0 var(--accent,#D9A272)}"
        + ".v3-sh{position:absolute;left:0;right:0;background:var(--paper-raised,#1A222C);border-top:1px solid var(--line-strong,#3a465b);padding:10px 12px;max-height:46%;overflow:auto;display:none;touch-action:pan-y}"
        + ".v3-sh h4{margin:8px 0 6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft,rgba(232,237,243,.68));font-weight:600}.v3-sh h4:first-child{margin-top:0}"
        + ".v3-row{display:flex;flex-wrap:wrap;gap:6px}.v3-sh input[type=range]{width:100%;accent-color:var(--accent,#D9A272)}"
        + ".v3-info{position:absolute;top:58px;right:10px;width:min(300px,60vw);max-height:55%;overflow:auto;background:var(--paper-raised,#1A222C);border:1px solid var(--accent,#D9A272);border-radius:10px;padding:10px 12px;font-size:12.5px;display:none}"
        + ".v3-info table{width:100%;border-collapse:collapse}.v3-info td{padding:3px 0;vertical-align:top;border-top:1px solid var(--line-strong,#3a465b)}.v3-info td:first-child{color:var(--ink-soft,rgba(232,237,243,.68));padding-right:8px;white-space:nowrap}"
        + ".v3-lb{position:absolute;pointer-events:none;font-size:11px;white-space:nowrap;color:var(--ink,#E8EDF3);background:var(--paper-raised,#1A222C);border:1px solid var(--accent,#D9A272);border-radius:6px;padding:1px 6px;transform:translate(-100%,-50%)}"
        + "@media (max-width:700px){.v3-info{top:auto;left:8px;right:8px;width:auto;bottom:var(--v3-bh,64px);max-height:38%}}";
      document.head.appendChild(stl);
    }
    var ov = document.createElement("div"); ov.className = "v3-ov";
    ov.innerHTML = '<div class="v3-win"><canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas><div class="v3-cot" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>'
      + '<div style="position:absolute;top:0;left:0;right:46px;padding:10px 14px;pointer-events:none"><b style="font-size:15px">' + String(o.nombre || "").replace(/</g, "&lt;") + ' · 3D</b><div class="v3-sub" style="font-size:12px;color:var(--ink-soft,rgba(232,237,243,.68))"></div><div style="font-size:11px;color:var(--ink-soft,rgba(232,237,243,.68))">Plano HOLMING · Pórticos O\'Higgins MOP · 28-10-2026 · niveles en m (N.T. = ±0,00)</div></div>'
      + '<button class="v3-x" aria-label="Cerrar" style="position:absolute;top:8px;right:10px;background:var(--paper-raised,#1A222C);color:var(--ink,#E8EDF3);border:1px solid var(--line-strong,#3a465b);border-radius:10px;font-size:18px;padding:4px 12px;cursor:pointer">✕</button>'
      + '<div class="v3-leg" style="position:absolute;left:10px;top:76px;background:var(--paper-raised,#1A222C);border:1px solid var(--line-strong,#3a465b);border-radius:10px;padding:8px 10px;font-size:12px"></div>'
      + '<div class="v3-info"></div><div class="v3-hint" style="position:absolute;left:0;right:0;pointer-events:none;text-align:center;font-size:11.5px;color:var(--ink-soft,rgba(232,237,243,.68))"></div>'
      + '<div class="v3-sh" data-s="modelo"></div><div class="v3-sh" data-s="vista"></div><div class="v3-sh" data-s="capas"></div><div class="v3-sh" data-s="corte"></div><div class="v3-sh" data-s="notas"></div>'
      + '<div class="v3-bar" style="position:absolute;left:0;right:0;bottom:0;padding:6px 6px calc(6px + env(safe-area-inset-bottom));background:var(--paper-raised,#1A222C);border-top:1px solid var(--line-strong,#3a465b)"></div></div>';
    document.body.appendChild(ov);
    var win = ov.querySelector(".v3-win"), bar = win.querySelector(".v3-bar"), info = win.querySelector(".v3-info"), hint = win.querySelector(".v3-hint"), cot = win.querySelector(".v3-cot");
    ov.addEventListener("pointerdown", function(e){ if(e.target === ov) cerrar(); });
    function tecla(e){ if(e.key === "Escape") cerrar(); }
    document.addEventListener("keydown", tecla);
    var cv = win.querySelector("canvas"), r = new T.WebGLRenderer({ canvas: cv, antialias: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    var sc = new T.Scene(); sc.background = new T.Color(fondo);
    sc.add(new T.HemisphereLight(0xffffff, pal.claro ? 0x9a9686 : 0x6a7690, 1.05)); var dl2 = new T.DirectionalLight(0xffffff, .55); dl2.position.set(-6, 5, -9); sc.add(dl2); var dl = new T.DirectionalLight(0xffffff, .7); dl.position.set(5, 12, 8); sc.add(dl);
    var camP = new T.PerspectiveCamera(40, 1, .1, 200), camO = new T.OrthographicCamera(-1, 1, 1, -1, .1, 200), cam = camP;
    var suelo = new T.Mesh(new T.BoxGeometry(6, 1.8, 3.4), new T.MeshStandardMaterial({ color: 0x7a6a55, transparent: true, opacity: .1, depthWrite: false })); suelo.position.set(0, Y_NT - .9, 0); sc.add(suelo);
    var rejilla = new T.GridHelper(14, 14, pal.claro ? 0xb9b6ab : 0x3a465b, pal.claro ? 0xd3d0c6 : 0x2f3a4d); rejilla.position.y = Y_NT; sc.add(rejilla);
    var shOff = 0;
    var st = { yaw: .7, pitch: .35, dist: 16, tx: 0, ty: 3.2, tz: 0 }, modelo = null;
    var S = { sheet: null, modo: "sol", ortho: false, capas: CAPAS.map(function(){ return true; }), corte: false, cut: 0, cotas: false, sel: null }, selOrig = null;
    var plano = new T.Plane(new T.Vector3(0, -1, 0), 0);                       /* conserva y ≤ cut */
    /* cotas: líneas de nivel en la escena + rótulos HTML */
    var gCot = new T.Group(); gCot.visible = false; sc.add(gCot);
    var lmc = new T.LineBasicMaterial({ color: new T.Color(acc), depthTest: false, transparent: true, opacity: .9 });
    var rot = [];
    NIVELES.forEach(function(n){
      var y = Y_NT + n[1], g = new T.BufferGeometry().setFromPoints([new T.Vector3(-1.2, y, 0), new T.Vector3(1.2, y, 0)]);
      var l = new T.Line(g, lmc); l.renderOrder = 5; gCot.add(l);
      var d = document.createElement("div"); d.className = "v3-lb"; d.textContent = n[0] + "  " + fm(n[1]); d.style.display = "none"; cot.appendChild(d); rot.push({ el: d, p: new T.Vector3(-1.2, y, 0) });
    });
    var ejeL = document.createElement("div"); ejeL.className = "v3-lb"; ejeL.textContent = "Eje del poste"; ejeL.style.display = "none"; ejeL.style.transform = "translate(-50%,-100%)"; cot.appendChild(ejeL);
    var ejeP = new T.Vector3(0, Y_NT + 7.505 + .45, 0);
    var axL = new T.BufferGeometry().setFromPoints([new T.Vector3(0, Y_NT - 1.7, 0), new T.Vector3(0, Y_NT + 7.505 + .4, 0)]);
    var axLn = new T.Line(axL, new T.LineDashedMaterial({ color: new T.Color(acc), dashSize: .12, gapSize: .08, depthTest: false, transparent: true, opacity: .8 })); axLn.computeLineDistances(); axLn.renderOrder = 5; gCot.add(axLn);

    function aplicaMateriales(){
      if(!modelo) return;
      modelo.traverse(function(n){
        if(!n.isMesh || !n.userData.tag) return;
        var c = capaDe(n.userData.tag.g); n.visible = c < 0 || S.capas[c];
        var m = n.material;
        if(m.userData.v3 === undefined) m.userData.v3 = { t: m.transparent, o: m.opacity, w: m.depthWrite };
        var b = m.userData.v3;
        m.visible = S.modo !== "ari";
        if(S.modo === "rx" && !b.t){ m.transparent = true; m.opacity = .22; m.depthWrite = false; } else { m.transparent = b.t; m.opacity = b.o; m.depthWrite = b.w; }
      });
    }
    function selecciona(me){
      if(selOrig){ selOrig.me.material = selOrig.m; selOrig = null; }
      S.sel = me;
      if(me){
        var cl = me.material.clone(); cl.userData = {}; cl.emissive = new T.Color(0xff1493); cl.emissiveIntensity = .75; cl.transparent = false; cl.opacity = 1; cl.depthWrite = true; cl.visible = true;
        selOrig = { me: me, m: me.material }; me.material = cl;
        var tg = me.userData.tag, bb = new T.Box3().setFromObject(me), c = capaDe(tg.g);
        info.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><b style="font-size:13.5px">' + tg.n + '</b><span class="v3-ix" style="cursor:pointer;padding:0 4px">✕</span></div><table>'
          + [["Capa", c >= 0 ? CAPAS[c][1] : "—"]].concat(tg.i).concat([["Cota inf. / sup.", fm(bb.min.y - Y_NT) + " / " + fm(bb.max.y - Y_NT) + " m (N.T.=0)"]]).map(function(f){ return "<tr><td>" + f[0] + "</td><td>" + f[1] + "</td></tr>"; }).join("") + "</table>";
        info.style.display = "block"; info.querySelector(".v3-ix").onclick = function(){ selecciona(null); };
      } else info.style.display = "none";
    }
    function dibujar(){
      selecciona(null);
      if(modelo) sc.remove(modelo);
      modelo = construir(T, { tipo: tipo, brazo: brazo, ejec: o.ejec, pal: pal, fund: fund, armaduras: armaduras }); sc.add(modelo);
      suelo.material.opacity = (o.ejec && o.ejec["Relleno"]) ? .35 : .08;
      win.querySelector(".v3-sub").textContent = (o.comuna ? o.comuna + " · " : "") + "Tipo " + tipo + " · brazo " + brazo + " m · fundación " + FUND[fund].nom + (sinTipo ? " (tipo no definido en la ficha)" : "") + " · modelo referencial";
      var e = o.ejec || {}, li = function(ok, c, t){ return '<div><span style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;background:' + (ok ? c : "transparent") + ';border:1px solid ' + (ok ? c : bp) + '"></span>' + t + (ok ? "" : " (pendiente)") + '</div>'; };
      win.querySelector(".v3-leg").innerHTML = li(!!e["Emplantillado"], "#7a5230", "Emplantillado") + li(!!e["Inst. de Fundación"], "#b9b4a6", "Fundación") + li(!!e["Grouting"], "#ffd23f", "Grouting")
        + li(!!e["Inst. Poste V"], "#2f80ed", "Poste (mástil)") + li(!!e["Inst. Poste V"], "#e53935", "Placa base y cartelas") + li(!!e["Inst. Poste V"], "#ffffff", "Cabezal y punta") + li(!!e["Inst. Poste V"], "#00e5ff", "Pernos y anclajes") + li(!!e["Inst. Poste V"], "#ab47bc", "Coplas 1½\"") + li(!!e["Inst. Brazo H"], "#ff9800", "Brazo");
      aplicaMateriales(); render();
    }
    /* ---- paneles ---- */
    function chip(txt, cls, fn){ var b = document.createElement("button"); b.className = "v3-c" + (cls ? " " + cls : ""); b.innerHTML = txt; b.onclick = fn; return b; }
    function fila(sh, tit, items){ if(tit){ var h = document.createElement("h4"); h.textContent = tit; sh.appendChild(h); } var d = document.createElement("div"); d.className = "v3-row"; items.forEach(function(x){ d.appendChild(x); }); sh.appendChild(d); return d; }
    function vista(y, p, d, ty, tx){ st.yaw = y; st.pitch = p; st.dist = d; st.tx = tx || 0; st.tz = 0; st.ty = ty; }
    function render(){
      var sh;
      sh = win.querySelector('[data-s="modelo"]'); sh.innerHTML = "";
      fila(sh, "Tipo de pórtico", [chip("Tipo T (2 brazos)", tipo === "T" ? "on" : "", function(){ tipo = "T"; sinTipo = false; fund = "Z55"; dibujar(); }), chip("Tipo L (1 brazo)", tipo === "L" ? "on" : "", function(){ tipo = "L"; sinTipo = false; fund = "Z90E"; dibujar(); })]);
      fila(sh, "Largo del brazo", [chip("6 m", brazo === 6 ? "on" : "", function(){ brazo = 6; dibujar(); }), chip("7 m", brazo === 7 ? "on" : "", function(){ brazo = 7; dibujar(); })]);
      fila(sh, "Fundación", [["Z55", "Z55×140"], ["Z90C", "Z90 centrada"], ["Z90E", "Z90 excéntrica"]].map(function(x){ return chip(x[1], fund === x[0] ? "on" : "", function(){ fund = x[0]; dibujar(); }); }));
      fila(sh, "Elementos", [chip("Armaduras", armaduras ? "on" : "", function(){ armaduras = !armaduras; dibujar(); }), chip("Terreno", suelo.visible ? "on" : "", function(){ suelo.visible = !suelo.visible; render(); })]);
      sh = win.querySelector('[data-s="vista"]'); sh.innerHTML = "";
      fila(sh, "Vistas", [["Perspectiva", function(){ vista(.7, .35, 16, 3.2); }], ["Elevación", function(){ vista(0, 0, 22, 3.2); }], ["Planta", function(){ vista(0, 1.45, 18, 0); }], ["Cabezal", function(){ vista(.9, .2, 3.4, 6.7); }], ["Fundación", function(){ vista(.7, .25, 5.5, -.8); }], ["Anclaje", function(){ vista(.8, .3, 1.6, -.15); }]].map(function(x){ return chip(x[0], "", x[1]); }));
      fila(sh, "Modo de dibujo", [["sol", "Sólido"], ["rx", "Rayos X"], ["ari", "Aristas"]].map(function(x){ return chip(x[1], S.modo === x[0] ? "on" : "", function(){ S.modo = x[0]; aplicaMateriales(); render(); }); }));
      fila(sh, "Proyección", [chip("Perspectiva", !S.ortho ? "on" : "", function(){ S.ortho = false; render(); }), chip("Ortogonal", S.ortho ? "on" : "", function(){ S.ortho = true; render(); })]);
      sh = win.querySelector('[data-s="capas"]'); sh.innerHTML = "";
      var cnt = CAPAS.map(function(){ return 0; }); modelo.traverse(function(n){ if(n.isMesh && n.userData.tag){ var c = capaDe(n.userData.tag.g); if(c >= 0) cnt[c]++; } });
      var its = []; CAPAS.forEach(function(c, i){ if(!cnt[i]) return; its.push(chip('<span style="display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;background:' + c[2] + '"></span>' + c[1] + ' <small style="opacity:.65">' + cnt[i] + '</small>', S.capas[i] ? "on" : "", function(){ S.capas[i] = !S.capas[i]; aplicaMateriales(); render(); })); });
      fila(sh, "Capas (piezas dibujadas)", its);
      fila(sh, "Atajos", [chip("Mostrar todo", "", function(){ S.capas = CAPAS.map(function(){ return true; }); aplicaMateriales(); render(); }), chip("Solo hormigón", "", function(){ S.capas = CAPAS.map(function(c){ return ["emp", "hor", "gro", "arm"].indexOf(c[0]) >= 0; }); aplicaMateriales(); render(); }), chip("Solo acero", "", function(){ S.capas = CAPAS.map(function(c){ return ["emp", "hor", "gro"].indexOf(c[0]) < 0; }); aplicaMateriales(); render(); })]);
      sh = win.querySelector('[data-s="corte"]'); sh.innerHTML = "";
      var rg = document.createElement("input"); rg.type = "range"; rg.min = -1.7; rg.max = 7.6; rg.step = .01; rg.value = S.cut;
      var lb = document.createElement("div"); lb.style.cssText = "margin:4px 0 8px;font-size:13px"; lb.innerHTML = S.corte ? "Corte a <b>" + fm(S.cut) + " m</b> (N.T. = ±0,00): se oculta lo que está más arriba" : "Corte desactivado: mueve el deslizador para cortar por altura";
      rg.oninput = function(){ S.cut = +rg.value; S.corte = true; lb.innerHTML = "Corte a <b>" + fm(S.cut) + " m</b> (N.T. = ±0,00): se oculta lo que está más arriba"; aplicaCorte(); };
      sh.appendChild(lb); sh.appendChild(rg);
      fila(sh, "Niveles", [chip("Sin corte", !S.corte ? "on" : "", function(){ S.corte = false; aplicaCorte(); render(); })].concat(NIVELES.slice().reverse().map(function(n){ return chip(n[0] + " " + fm(n[1]), "", function(){ S.cut = n[1]; S.corte = true; aplicaCorte(); render(); }); })));
      sh = win.querySelector('[data-s="notas"]'); sh.innerHTML = "";
      var h = document.createElement("h4"); h.textContent = "Supuestos y advertencias"; sh.appendChild(h);
      NOTAS.forEach(function(n){ var d = document.createElement("div"); d.style.cssText = "padding:5px 0;border-top:1px solid var(--line-strong,#3a465b);font-size:12.5px"; d.innerHTML = (n[0] === "w" ? '<span style="color:#ffb300">⚠ </span>' : '<span style="color:' + bp + '">ⓘ </span>') + n[1]; sh.appendChild(d); });
      var ct = document.createElement("div"); ct.style.cssText = "margin-top:8px;font-size:11.5px;opacity:.7"; ct.textContent = "Toca una pieza para ver sus datos. Modelo referencial: no reemplaza al plano."; sh.appendChild(ct);
      /* barra */
      bar.innerHTML = "";
      [["modelo", "🏗", "Modelo"], ["vista", "👁", "Vista"], ["capas", "☰", "Capas"], ["corte", "✂", "Corte"], ["cotas", "📏", "Cotas"], ["notas", "⚠", "Notas"], ["centrar", "⌖", "Encuadrar"]].forEach(function(x){
        var b = document.createElement("button"); b.className = "v3-t" + ((S.sheet === x[0] || (x[0] === "cotas" && S.cotas)) ? " on" : ""); b.innerHTML = "<i>" + x[1] + "</i>" + x[2];
        b.onclick = function(){
          if(x[0] === "centrar"){ st.tx = 0; st.tz = 0; st.ty = 3.2; }
          else if(x[0] === "cotas"){ S.cotas = !S.cotas; gCot.visible = S.cotas; }
          else S.sheet = S.sheet === x[0] ? null : x[0];
          render();
        };
        bar.appendChild(b);
      });
      var bh = bar.offsetHeight || 60; win.style.setProperty("--v3-bh", (bh + 6) + "px");
      win.querySelectorAll(".v3-sh").forEach(function(s){ s.style.display = s.dataset.s === S.sheet ? "block" : "none"; s.style.bottom = bh + "px"; });
      var sa = S.sheet && win.querySelector('[data-s="' + S.sheet + '"]'); shOff = sa ? sa.offsetHeight / 2 : 0;
      hint.style.bottom = (bh + (S.sheet ? 0 : 6)) + "px"; hint.style.display = S.sheet ? "none" : "block";
      hint.textContent = "Arrastra: girar · clic derecho / Shift / dos dedos: mover · rueda: zoom · toca una pieza: datos";
    }
    function aplicaCorte(){ r.clippingPlanes = S.corte ? [plano] : []; plano.constant = Y_NT + S.cut + .002; }
    function tam(){ var w = win.clientWidth, h = win.clientHeight; r.setSize(w, h, false); camP.aspect = w / h; camP.updateProjectionMatrix(); }
    var v3 = new T.Vector3();
    function pinta(){
      var w = win.clientWidth, h = win.clientHeight; cam = S.ortho ? camO : camP;
      if(S.ortho){ var hh = st.dist * Math.tan(20 * Math.PI / 180); camO.left = -hh * w / h; camO.right = hh * w / h; camO.top = hh; camO.bottom = -hh; camO.updateProjectionMatrix(); }
      cam.position.set(st.tx + Math.sin(st.yaw) * Math.cos(st.pitch) * st.dist, st.ty + Math.sin(st.pitch) * st.dist, st.tz + Math.cos(st.yaw) * Math.cos(st.pitch) * st.dist);
      cam.lookAt(st.tx, st.ty, st.tz); if(shOff) cam.setViewOffset(w, h, 0, shOff, w, h); else cam.clearViewOffset(); cam.updateProjectionMatrix(); r.render(sc, cam);
      if(S.cotas){
        var ys = rot.map(function(x){ v3.copy(x.p).project(cam); x.sx = (v3.x + 1) / 2 * w; x.sy = (1 - v3.y) / 2 * h; x.ok = v3.z < 1; return x; }).sort(function(a, b){ return a.sy - b.sy; }), prev = -99;
        ys.forEach(function(x){ if(x.sy < prev + 17) x.sy = prev + 17; prev = x.sy; x.el.style.display = x.ok ? "block" : "none"; x.el.style.left = x.sx + "px"; x.el.style.top = x.sy + "px"; });   /* separa rótulos que se solapan */
        v3.copy(ejeP).project(cam); ejeL.style.display = "block"; ejeL.style.left = ((v3.x + 1) / 2 * w) + "px"; ejeL.style.top = ((1 - v3.y) / 2 * h) + "px";
      } else { rot.forEach(function(x){ x.el.style.display = "none"; }); ejeL.style.display = "none"; }
    }
    var vivo = true; (function loop(){ if(!vivo) return; pinta(); requestAnimationFrame(loop); })();
    var pts = {}, ini = null, rc = new T.Raycaster();
    cv.addEventListener("pointerdown", function(e){ cv.setPointerCapture(e.pointerId); pts[e.pointerId] = e; ini = Object.keys(pts).length === 1 ? { x: e.clientX, y: e.clientY, mov: 0, t: Date.now() } : null; });
    function pan(dx, dy){                       /* desplaza el centro de visión en el plano de la pantalla */
      var k = (S.ortho ? 2 * Math.tan(20 * Math.PI / 180) : .728) * st.dist / Math.max(300, win.clientHeight);
      st.tx -= Math.cos(st.yaw) * dx * k; st.tz += Math.sin(st.yaw) * dx * k; st.ty = Math.max(-3, Math.min(12, st.ty + dy * k));
    }
    cv.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    cv.addEventListener("pointermove", function(e){
      var ids = Object.keys(pts); if(!pts[e.pointerId]) return;
      if(ini){ ini.mov = Math.max(ini.mov, Math.hypot(e.clientX - ini.x, e.clientY - ini.y)); }
      if(ids.length === 1 && (e.shiftKey || (e.buttons & 6))){ pan(e.clientX - pts[e.pointerId].clientX, e.clientY - pts[e.pointerId].clientY); }
      else if(ids.length === 1){ st.yaw -= (e.clientX - pts[e.pointerId].clientX) * .008; st.pitch = Math.max(-.2, Math.min(1.45, st.pitch + (e.clientY - pts[e.pointerId].clientY) * .008)); }
      else if(ids.length === 2){
        var o2 = ids.filter(function(k){ return +k !== e.pointerId; })[0], a = pts[o2], d0 = Math.hypot(a.clientX - pts[e.pointerId].clientX, a.clientY - pts[e.pointerId].clientY), d1 = Math.hypot(a.clientX - e.clientX, a.clientY - e.clientY);
        st.dist = Math.max(2, Math.min(40, st.dist * d0 / Math.max(1, d1)));
        pan((e.clientX - pts[e.pointerId].clientX) / 2, (e.clientY - pts[e.pointerId].clientY) / 2);
      }
      pts[e.pointerId] = e;
    });
    function elige(e){
      var rect = cv.getBoundingClientRect(), p = new T.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height * 2 - 1));
      rc.setFromCamera(p, cam);
      var ms = []; modelo.traverse(function(n){ if(n.isMesh && n.userData.tag && n.visible && !n.material.transparent || (n.isMesh && n.userData.tag && n.visible && S.modo === "rx")) ms.push(n); });
      var hs = rc.intersectObjects(ms, false).filter(function(h){ return !S.corte || h.point.y <= Y_NT + S.cut + .001; });
      selecciona(hs.length ? hs[0].object : null);
    }
    function sube(e){
      if(ini && ini.mov < 6 && Date.now() - ini.t < 600 && e.type === "pointerup" && !(e.button > 0)){ var cl = ini; ini = null; if(S.sheet){ S.sheet = null; render(); } elige(e); }
      delete pts[e.pointerId]; if(!Object.keys(pts).length) ini = null;
    }
    cv.addEventListener("pointerup", sube); cv.addEventListener("pointercancel", sube);
    cv.addEventListener("wheel", function(e){ e.preventDefault(); st.dist = Math.max(2, Math.min(40, st.dist * (1 + e.deltaY * .001))); }, { passive: false });
    function cerrar(){ vivo = false; document.removeEventListener("keydown", tecla); window.removeEventListener("resize", tam); r.dispose(); ov.remove(); }
    win.querySelector(".v3-x").onclick = cerrar;
    window.addEventListener("resize", tam); tam(); dibujar();
  });
}
window.PORTICOS_3D = { abrir: abrir, _construir: construir };
})();
