/*
 * Pórtico 3D montado sobre la foto 360° (prototipo).
 * Capa three.js transparente sincronizada con la cámara de Marzipano. El pórtico se apoya en el suelo del punto
 * que se toca: con la cámara a H m del suelo, la distancia horizontal es d = H / tan(depresión); en Marzipano el pitch positivo mira hacia abajo.
 * Reutiliza el modelo paramétrico de la app Pórticos (PORTICOS_3D._construir) y lo pinta con acabado real
 * (acero galvanizado, hormigón), sombra proyectada en el suelo y control de sol.
 */
(function () {
  'use strict';
  if (!window.TourAPI) return;
  var API = window.TourAPI, $ = function (id) { return document.getElementById(id); };
  var BASE = '../../../Porticos/';
  var Y_NT = .06;                                         /* cota N.T. del modelo (m): el suelo de la foto queda a esta altura */
  var toast = function (m, ms) { if (window.TourToast) window.TourToast(m, ms); };

  var DEF = { yaw: 0, pitch: 20, giro: 0, tipo: 'T', brazo: 6, fund: 'Z55', escala: 1, H: 7.2, az: 330, el: 55, brillo: 1, calidez: 0, sombra: .45, suave: .4, visible: true };
  var T = null, listo = false, cargando = false;
  var r, sc, cam, grupo, suelo, sol, hemi, cv, modelo, hash = '';

  function cargar(cb) {
    if (listo) return cb(); if (cargando) return; cargando = true;
    function js(src, ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { cargando = false; toast('No se pudo cargar el modelo 3D del pórtico.'); }; document.head.appendChild(s); }
    js(BASE + 'vendor/three.min.js?v=r128', function () { js(BASE + 'visor-3d.js?v=20261123j', function () { T = window.THREE; iniciar(); listo = true; cargando = false; cb(); }); });
  }
  function iniciar() {
    cv = document.createElement('canvas'); cv.id = 'm3dc'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;display:none';
    document.body.appendChild(cv);
    r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true });
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1;
    r.setClearColor(0x000000, 0); r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    sc = new T.Scene(); cam = new T.PerspectiveCamera(60, 1, .1, 500); cam.rotation.order = 'YXZ';
    hemi = new T.HemisphereLight(0xffffff, 0x8a8a80, .9); sc.add(hemi);
    sol = new T.DirectionalLight(0xffffff, .95); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
    var sh = sol.shadow.camera; sh.left = -10; sh.right = 10; sh.top = 10; sh.bottom = -10; sh.near = .5; sh.far = 80; sol.shadow.bias = -.0004;
    sc.add(sol); sc.add(sol.target);
    suelo = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({ opacity: .55 })); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; sc.add(suelo);
    grupo = new T.Group(); sc.add(grupo);
  }

  /* reflejos: la propia foto 360 (borrosa y girada al sistema de three.js) como mapa de entorno; sin foto equirectangular, un degradado cielo-suelo */
  var envTex = null, envDe = null;
  function entorno(id, s) {
    if (envDe === id) return; envDe = id; hash = '';
    function fija(cvs) { if (envTex) envTex.dispose(); envTex = new T.CanvasTexture(cvs); envTex.mapping = T.EquirectangularReflectionMapping; envTex.encoding = T.sRGBEncoding; hash = ''; }
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#9cc4ee'); g.addColorStop(.5, '#e4ecf4'); g.addColorStop(.5, '#8d8a82'); g.addColorStop(1, '#5d5b56'); x.fillStyle = g; x.fillRect(0, 0, 1024, 512); fija(c);
    if (s && s.equirect && s.equirect.url) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        if (envDe !== id) return;
        var c2 = document.createElement('canvas'); c2.width = 1024; c2.height = 512; var y = c2.getContext('2d');
        try { y.filter = 'blur(3px)'; } catch (e) { /* sin filtro */ }
        y.drawImage(im, -256, 0, 1024, 512); y.drawImage(im, 768, 0, 1024, 512);   /* u3 = u_foto − 1/4 (el centro de la foto, yaw 0, cae en −z) */
        fija(c2);
      };
      im.src = s.equirect.url;
    }
  }
  /* acabado real: galvanizado y hormigón; sin armaduras ni contornos */
  var ACERO = { mti: 1, mts: 1, ven: 1, pun: 1, cab: 1, pcb: 1, pbr: 1, cop: 1, bra: 1, sop: 1, pla: 1, car: 1, anc: 1, tue: 1, fle: 1 }, HORM = { hor: 1, gro: 1, emp: 1 };
  function construye(p) {
    if (modelo) { grupo.remove(modelo); }
    var all = { "Emplantillado": true, "Inst. de Fundación": true, "Inst. Poste V": true, "Inst. Brazo H": true, "Grouting": true };
    modelo = window.PORTICOS_3D._construir(T, { tipo: p.tipo, brazo: p.brazo, ejec: all, pal: { claro: false, bp: new T.Color(0x5BA8BF) }, fund: p.fund, armaduras: false });
    var quitar = [];
    modelo.traverse(function (n) {
      if (n.isLineSegments) { quitar.push(n); return; }
      if (!n.isMesh) return;
      var g = n.userData.tag && n.userData.tag.g;
      n.castShadow = true; n.receiveShadow = true;
      if (g === 'arm' || g === 'ore') { quitar.push(n); return; }
      if (HORM[g]) n.material = new T.MeshStandardMaterial({ color: g === 'gro' ? 0x8f8c84 : 0x9a978f, roughness: .96, metalness: 0, envMap: envTex, envMapIntensity: .45 });
      else if (ACERO[g]) n.material = new T.MeshStandardMaterial({ color: 0xb4babe, roughness: .42, metalness: .72, envMap: envTex, envMapIntensity: 1 });
    });
    quitar.forEach(function (n) { if (n.parent) n.parent.remove(n); });
    grupo.add(modelo);
  }

  /* ---------- sincronía con la cámara de Marzipano ---------- */
  function pinta() {
    requestAnimationFrame(pinta);
    var id = API.currentId(), s = id && API.scene(id), p = s && s.portico, v = API.viewRaw();
    if (!listo || !p || !p.visible || !v) { if (cv) cv.style.display = 'none'; return; }
    cv.style.display = 'block';
    var w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * r.getPixelRatio()) || cv.height !== Math.round(h * r.getPixelRatio())) { r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h, false); }
    entorno(id, s);
    var k = p.tipo + p.brazo + p.fund; if (k !== hash) { hash = k; construye(p); }
    var H = p.H, d = H / Math.tan(Math.max(.5, p.pitch) * Math.PI / 180), yw = p.yaw * Math.PI / 180;
    grupo.scale.setScalar(p.escala);
    grupo.position.set(d * Math.sin(yw), -H - Y_NT * p.escala, -d * Math.cos(yw)); grupo.rotation.y = -p.giro * Math.PI / 180;
    suelo.position.set(grupo.position.x, -H + .004, grupo.position.z);
    var az = p.az * Math.PI / 180, el = p.el * Math.PI / 180, L = 25;
    sol.position.set(grupo.position.x + L * Math.sin(az) * Math.cos(el), -H + L * Math.sin(el), grupo.position.z - L * Math.cos(az) * Math.cos(el));
    sol.target.position.set(grupo.position.x, -H + 3.5, grupo.position.z); sol.target.updateMatrixWorld();
    var c = new T.Color(1, 1, 1).lerp(new T.Color(p.calidez > 0 ? 1 : .8, p.calidez > 0 ? .86 : .92, p.calidez > 0 ? .68 : 1), Math.abs(p.calidez));
    sol.color.copy(c); sol.intensity = 1.1 * p.brillo; hemi.intensity = .45 * p.brillo; hemi.color.copy(c);
    suelo.material.opacity = p.sombra; cv.style.filter = p.suave > .01 ? 'blur(' + (p.suave * .8).toFixed(2) + 'px)' : '';
    r.clippingPlanes = [new T.Plane(new T.Vector3(0, 1, 0), H)];                       /* corta lo enterrado (por debajo del suelo de la foto) */
    cam.aspect = w / h; cam.fov = v.fov * 180 / Math.PI; cam.rotation.set(-v.pitch, -v.yaw, 0); cam.updateProjectionMatrix();
    r.render(sc, cam);
  }
  requestAnimationFrame(pinta);

  /* ---------- panel ---------- */
  var btn = document.createElement('button'); btn.className = 'icon-btn'; btn.id = 'btnM3d'; btn.type = 'button'; btn.title = 'Pórtico 3D sobre la foto'; btn.setAttribute('aria-label', 'Pórtico 3D');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3v18M12 6h8M12 6H4M9 21h6M10 15h4"/></svg>';
  $('controls').insertBefore(btn, $('btnShare'));
  var panel = document.createElement('aside'); panel.id = 'm3dp'; panel.hidden = true; document.body.appendChild(panel);
  var st = document.createElement('style');
  st.textContent = '#m3dp{position:fixed;z-index:25;top:calc(70px + env(safe-area-inset-top));right:12px;width:min(320px,calc(100vw - 24px));max-height:calc(100vh - 170px);overflow-y:auto;background:#fff;color:#1b2430;border-radius:12px;box-shadow:0 6px 28px rgba(0,0,0,.3);padding:12px;font:13px/1.35 system-ui,sans-serif}'
    + '#m3dp h4{margin:10px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#5b6675}#m3dp label{display:block;margin:5px 0}#m3dp input[type=range]{width:100%}'
    + '#m3dp .r{display:flex;gap:6px;flex-wrap:wrap}#m3dp button.c{border:1px solid #c5ccd6;background:#fff;border-radius:16px;padding:5px 10px;font:inherit;cursor:pointer}#m3dp button.c.on{border-color:#1e88e5;box-shadow:inset 0 0 0 1px #1e88e5}'
    + '#m3dp button.p{background:#1e88e5;color:#fff;border:0;border-radius:8px;padding:8px 12px;font:inherit;cursor:pointer}body.m3d-colocando #pano{cursor:crosshair}#m3dp small{color:#5b6675}';
  document.head.appendChild(st);
  var colocando = false;

  function datos() { var id = API.currentId(), s = id && API.scene(id); return s && s.portico; }
  function ctl(p, tit, k, min, max, step, fmt) {
    var l = document.createElement('label'), v = document.createElement('span'); l.textContent = tit + ': '; l.appendChild(v);
    var i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = p[k]; v.textContent = fmt ? fmt(p[k]) : p[k];
    i.oninput = function () { p[k] = +i.value; v.textContent = fmt ? fmt(p[k]) : p[k]; }; l.appendChild(i); return l;
  }
  function chip(txt, on, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'c' + (on ? ' on' : ''); b.textContent = txt; b.onclick = fn; return b; }
  function fila(items) { var d = document.createElement('div'); d.className = 'r'; items.forEach(function (x) { d.appendChild(x); }); return d; }
  function tit(t) { var h = document.createElement('h4'); h.textContent = t; return h; }
  function render() {
    panel.innerHTML = '';
    var cab = document.createElement('div'); cab.style.cssText = 'display:flex;justify-content:space-between;align-items:center'; cab.innerHTML = '<strong>Pórtico 3D sobre la foto</strong>';
    var x = chip('×', false, function () { panel.hidden = true; setColocando(false); }); cab.appendChild(x); panel.appendChild(cab);
    var p = datos();
    if (!p) {
      var n = document.createElement('p'); n.textContent = 'Toca el botón y luego el punto del suelo donde quieres el pórtico. La cámara de la foto se asume a 7,2 m del suelo (se puede cambiar).'; panel.appendChild(n);
      var b = document.createElement('button'); b.className = 'p'; b.textContent = 'Colocar pórtico en el suelo'; b.onclick = function () { setColocando(true); }; panel.appendChild(b);
      if (colocando) { var q = document.createElement('p'); q.innerHTML = '<b>Toca en la imagen el punto de apoyo del poste.</b>'; panel.appendChild(q); }
      return;
    }
    var fila1 = fila([chip(p.visible ? 'Visible' : 'Oculto', p.visible, function () { p.visible = !p.visible; render(); }), chip(colocando ? 'Toca el suelo…' : 'Reubicar', colocando, function () { setColocando(!colocando); }),
      chip('Quitar', false, function () { var id = API.currentId(); delete API.scene(id).portico; render(); })]);
    panel.appendChild(fila1);
    panel.appendChild(tit('Modelo'));
    panel.appendChild(fila([chip('Tipo T', p.tipo === 'T', function () { p.tipo = 'T'; p.fund = 'Z55'; render(); }), chip('Tipo L', p.tipo === 'L', function () { p.tipo = 'L'; p.fund = 'Z90E'; render(); }),
      chip('Brazo 6 m', p.brazo === 6, function () { p.brazo = 6; render(); }), chip('Brazo 7 m', p.brazo === 7, function () { p.brazo = 7; render(); })]));
    panel.appendChild(ctl(p, 'Giro del brazo', 'giro', 0, 360, 1, function (v) { return v + '°'; }));
    panel.appendChild(tit('Ubicación'));
    panel.appendChild(ctl(p, 'Altura de la cámara', 'H', 1, 20, .1, function (v) { return (+v).toFixed(1).replace('.', ',') + ' m'; }));
    panel.appendChild(ctl(p, 'Ajuste de escala', 'escala', .7, 1.3, .01, function (v) { return '×' + (+v).toFixed(2).replace('.', ','); }));
    var d = p.H / Math.tan(Math.max(.5, p.pitch) * Math.PI / 180); var inf = document.createElement('small'); inf.textContent = 'Distancia horizontal al poste: ' + d.toFixed(1).replace('.', ',') + ' m'; panel.appendChild(inf);
    panel.appendChild(tit('Luz y acabado'));
    panel.appendChild(ctl(p, 'Sol: dirección', 'az', 0, 360, 1, function (v) { return v + '°'; }));
    panel.appendChild(ctl(p, 'Sol: altura', 'el', 10, 85, 1, function (v) { return v + '°'; }));
    panel.appendChild(ctl(p, 'Brillo', 'brillo', .4, 1.6, .01, function (v) { return Math.round(v * 100) + '%'; }));
    panel.appendChild(ctl(p, 'Tono (frío ↔ cálido)', 'calidez', -1, 1, .05, function (v) { return v; }));
    panel.appendChild(ctl(p, 'Sombra', 'sombra', 0, .9, .01, function (v) { return Math.round(v * 100) + '%'; }));
    panel.appendChild(ctl(p, 'Suavizado (nitidez de la foto)', 'suave', 0, 2, .05, function (v) { return v; }));
    var nota = document.createElement('small'); nota.style.display = 'block'; nota.style.marginTop = '8px'; nota.textContent = 'Prototipo: no oculta el pórtico tras objetos que estén delante y no se incluye aún en «Exportar ZIP».'; panel.appendChild(nota);
  }
  function setColocando(v) { colocando = v; document.body.classList.toggle('m3d-colocando', v); render(); }
  btn.onclick = function () { panel.hidden = !panel.hidden; if (!panel.hidden) cargar(render); else setColocando(false); };
  panel.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

  /* colocar: un toque (sin arrastrar) sobre el suelo */
  var dn = null;
  $('pano').addEventListener('pointerdown', function (e) { dn = { x: e.clientX, y: e.clientY }; }, true);
  $('pano').addEventListener('pointerup', function (e) {
    if (!colocando || !dn || Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 6) return;
    var c = API.coords(e.clientX, e.clientY); if (!c) return;
    if (c.pitch < 3) { toast('Toca más abajo: el punto debe estar en el suelo, bajo el horizonte.'); return; }
    var id = API.currentId(), s = API.scene(id); var o = s.portico || JSON.parse(JSON.stringify(DEF));
    o.yaw = c.yaw; o.pitch = c.pitch; o.visible = true; s.portico = o; hash = ''; setColocando(false);
  }, true);
  window.M3D = { datos: datos };
})();
