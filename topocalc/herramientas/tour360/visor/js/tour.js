/*
 * Visor de tour 360 sobre Marzipano (Apache-2.0).
 * Lee window.TOUR (generado por tools/import-3dvista.js) y window.TOUR_CONFIG.
 * Los ángulos de tour.js están en grados; Marzipano trabaja en radianes.
 */
(function () {
  'use strict';

  var CFG = window.TOUR_CONFIG || {};
  var TOUR = window.TOUR;
  var L = CFG.lang || {};
  var rad = Marzipano.util.degToRad;
  var $ = function (id) { return document.getElementById(id); };
  var R = CFG.hotspotRadius || 1000;
  var ROLL_SIGN = CFG.hotspotRollSign || 1;       // 1 o -1 si los textos giran al revés

  if (!TOUR || !TOUR.scenes || !TOUR.scenes.length) {
    document.body.insertAdjacentHTML('beforeend', '<p style="position:fixed;z-index:99;top:40%;width:100%;text-align:center">No se encontró tour.js</p>');
    return;
  }

  // ---------- Marca / configuración visual ----------
  var root = document.documentElement.style;
  if (CFG.accent) root.setProperty('--accent', CFG.accent);
  if (CFG.background) root.setProperty('--bg', CFG.background);
  var tourTitle = CFG.title || TOUR.title || '';
  document.title = tourTitle || document.title;
  $('tourTitle').textContent = tourTitle;
  $('search').placeholder = L.search || 'Buscar escena…';
  $('btnMenu').title = L.scenes || 'Escenas';
  if (CFG.logo) {
    ['loaderLogo', 'topLogo'].forEach(function (id) { var im = $(id); im.src = CFG.logo; im.hidden = false; });
  }

  // ---------- Datos ----------
  var SC = {};                                   // id -> datos de escena
  TOUR.scenes.forEach(function (s) { SC[s.id] = s; });
  var ORDER = (TOUR.order && TOUR.order.length ? TOUR.order : TOUR.scenes.map(function (s) { return s.id; }))
    .filter(function (id) { return SC[id]; });
  var cleanName = function (n) { return String(n || '').replace(/^\s*\d+\s*-\s*/, '').trim(); };
  var norm = function (t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };

  // ---------- Visor ----------
  var viewer = new Marzipano.Viewer($('pano'), { controls: { mouseViewMode: 'drag' } });
  var built = {};                                // id -> escena Marzipano
  var current = null;

  // Marzipano usa FOV *vertical*. CFG.fov es el FOV horizontal deseado (como en 3DVista);
  // se convierte según la proporción de la pantalla y se acota para móviles verticales.
  function initialFov() {
    var st = viewer.stage(), w = st.width() || 1280, h = st.height() || 720;
    var v = Marzipano.util.convertFov.htov(rad(CFG.fov || 100), w, h);
    return Math.max(rad(55), Math.min(rad(CFG.maxVfov || 100), v));
  }
  var autorotate = Marzipano.autorotate({ yawSpeed: 0.04, targetPitch: 0, targetFov: Infinity });
  var autoOn = false;

  function buildScene(id) {
    if (built[id]) return built[id];
    var s = SC[id];
    var geometry, source, top;
    if (s.equirect) {                              // foto 360 equirectangular cargada por el usuario
      geometry = new Marzipano.EquirectGeometry([{ width: s.equirect.width }]);
      source = Marzipano.ImageUrlSource.fromString(s.equirect.url);
      top = Math.round(s.equirect.width / 2);
    } else {                                       // cubo en teselas (export 3DVista)
      var levels = s.levels.map(function (l, i) {
        return { tileSize: l.tileSize, size: l.size, fallbackOnly: i === 0 && s.levels.length > 1 };
      });
      geometry = new Marzipano.CubeGeometry(levels);
      source = new Marzipano.ImageUrlSource(function (tile) {
        var lv = s.levels[tile.z];
        if (s.tileUrls) return { url: s.tileUrls[tile.z + '/' + tile.face + '/' + tile.y + '_' + tile.x] };
        return { url: lv.url.replace('{face}', tile.face).replace('{row}', tile.y).replace('{column}', tile.x) };
      });
      top = s.levels[s.levels.length - 1].size;
    }
    top = Math.round(top * (CFG.zoomFactor || 2));   // más zoom que el límite de nitidez (digital); 1 = solo hasta 1:1
    var limiter = Marzipano.RectilinearView.limit.traditional(top, rad(Math.min(s.hfovMax || 130, 130)));
    var iv = s.initialView || { yaw: 0, pitch: 0 };
    var view = new Marzipano.RectilinearView({ yaw: rad(iv.yaw), pitch: rad(iv.pitch), fov: initialFov() }, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: !s.equirect });
    var sprites = [];
    (s.links || []).forEach(function (h) { addHotspot(scene, h, 'link', sprites); });
    (s.hotspots || []).forEach(function (h) { addHotspot(scene, h, h.kind, sprites); });
    built[id] = { scene: scene, sprites: sprites };
    return built[id];
  }

  // ---------- Hotspots ----------
  function stopPropagation(el) {
    ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'].forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
  }
  function px(deg) { return 2 * R * Math.tan(rad(deg) / 2); }

  var hsMap = new WeakMap();       // dato del hotspot -> { hs, el } (para poder quitarlo)
  var editHook = null;             // el editor lo define: si devuelve true, se cancela la acción normal
  function editing(h, kind) { return editHook ? !!editHook(h, kind) : false; }

  function showInfo(title, text) {
    var o = $('infoCard');
    if (!o) {
      o = document.createElement('div'); o.id = 'infoCard'; o.className = 'info-card';
      o.innerHTML = '<div class="box" role="dialog" aria-modal="true"><button type="button" class="x" aria-label="Cerrar">&times;</button><h3></h3><p></p></div>';
      o.addEventListener('click', function (e) { if (e.target === o || e.target.className === 'x') o.classList.remove('show'); });
      document.body.appendChild(o);
    }
    o.querySelector('h3').textContent = title || '';
    o.querySelector('p').textContent = text || '';
    o.classList.add('show');
  }
  function hideInfo() { var o = $('infoCard'); if (o) o.classList.remove('show'); }

  function addHotspot(scene, h, kind, sprites) {
    if (kind === 'decor' && !h.sprite && !h.text) return;
    var el = document.createElement('div');
    var w = px(h.hfov || 10), hgt = px(h.vfov || h.hfov || 10);
    el.className = 'hs';
    el.style.width = w + 'px';
    el.style.height = hgt + 'px';

    var transforms = '';
    if (h.roll) transforms += ' rotateZ(' + (ROLL_SIGN * h.roll) + 'deg)';
    if (h.rotationX) transforms += ' rotateX(' + (-h.rotationX) + 'deg)';
    if (h.rotationY) transforms += ' rotateY(' + h.rotationY + 'deg)';

    if (kind === 'info') {
      el.classList.add('hs-info');
      el.innerHTML = '<span>i</span>';
      el.style.fontSize = (hgt * 0.62) + 'px';
      el.addEventListener('click', function () { if (editing(h, kind)) return; hideTip(); showInfo(h.title, h.text); });
      bindTip(el, h.title || 'Información');
    } else if (kind === 'label') {
      el.classList.add('hs-label');
      el.textContent = h.text;
      el.style.fontSize = (hgt * 0.62) + 'px';
    } else {
      el.classList.add('hs-link');
      if (h.sprite && h.image) {
        el.style.backgroundImage = 'url("' + h.image + '")';
        el.style.backgroundSize = (h.sprite.cols * 100) + '% ' + (h.sprite.rows * 100) + '%';
        sprites.push({ el: el, sp: h.sprite });
        setFrame(el, h.sprite, 0);
      } else if (h.image) {
        el.style.backgroundImage = 'url("' + h.image + '")';
        el.style.backgroundSize = '100% 100%';
      } else {
        el.classList.add('nosprite');
      }
      if (kind === 'link') {
        var name = cleanName((SC[h.target] || {}).name);
        el.addEventListener('click', function () { if (editing(h, kind)) return; hideTip(); go(h.target, h.arrival); });
        bindTip(el, name);
      } else if (kind === 'url') {
        el.addEventListener('click', function () { window.open(h.url, '_blank', 'noopener'); });
        bindTip(el, L.openLink || 'Abrir enlace');
      } else {
        el.style.cursor = 'default';
        el.style.pointerEvents = kind === 'decor' ? 'none' : 'auto';
      }
    }
    stopPropagation(el);
    var hs = scene.hotspotContainer().createHotspot(el, { yaw: rad(h.yaw), pitch: rad(h.pitch) },
      { perspective: { radius: R, extraTransforms: transforms.trim() } });
    hsMap.set(h, { hs: hs, el: el });
  }

  function setFrame(el, sp, n) {
    var col = n % sp.cols, row = Math.floor(n / sp.cols);
    var x = sp.cols > 1 ? col / (sp.cols - 1) * 100 : 0;
    var y = sp.rows > 1 ? row / (sp.rows - 1) * 100 : 0;
    el.style.backgroundPosition = x + '% ' + y + '%';
  }
  var frameN = 0;
  setInterval(function () {
    if (!current || !built[current]) return;
    frameN++;
    built[current].sprites.forEach(function (o) { setFrame(o.el, o.sp, frameN % o.sp.frames); });
  }, 41);

  // ---------- Tooltip ----------
  var tip = $('tip');
  function bindTip(el, text) {
    el.addEventListener('mouseenter', function () {
      var r = el.getBoundingClientRect();
      tip.textContent = text; tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top + r.height / 2) + 'px';
      tip.classList.add('show');
    });
    el.addEventListener('mouseleave', hideTip);
  }
  function hideTip() { tip.classList.remove('show'); }

  // ---------- Navegación ----------
  var first = true;
  function go(id, view) {
    var s = SC[id]; if (!s) return;
    var b = buildScene(id);
    var v = view || s.initialView || { yaw: 0, pitch: 0 };
    b.scene.view().setParameters({ yaw: rad(v.yaw), pitch: rad(v.pitch), fov: initialFov() });
    viewer.stopMovement();
    b.scene.switchTo({ transitionDuration: first ? 0 : (CFG.transitionMs == null ? 900 : CFG.transitionMs) });
    first = false;
    current = id; frameN = 0;
    $('sceneName').textContent = cleanName(s.name);
    markCurrent(id);
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
    if (autoOn) viewer.startMovement(autorotate);
    if (window.matchMedia('(max-width: 900px)').matches) toggleDrawer(false);
  }
  function step(d) {
    var i = ORDER.indexOf(current);
    go(ORDER[(i + d + ORDER.length) % ORDER.length]);
  }

  // ---------- Menú lateral ----------
  var listEl = $('sceneList');
  var empty;
  function buildMenu() {
    listEl.innerHTML = '';
    ORDER.forEach(function (id) {
      var s = SC[id], li = document.createElement('li');
      li.dataset.id = id; li.dataset.q = norm(cleanName(s.name));
      var im = document.createElement('img'); im.loading = 'lazy'; im.alt = '';
      if (s.thumbnail) im.src = s.thumbnail;
      var sp = document.createElement('span'); sp.textContent = cleanName(s.name);
      li.appendChild(im); li.appendChild(sp);
      li.addEventListener('click', function () { go(id); });
      listEl.appendChild(li);
    });
    empty = document.createElement('li'); empty.className = 'empty'; empty.textContent = L.noResults || 'Sin resultados'; empty.hidden = true;
    listEl.appendChild(empty);
  }
  buildMenu();
  function markCurrent(id) {
    Array.prototype.forEach.call(listEl.children, function (li) { li.classList.toggle('current', li.dataset.id === id); });
    var cur = listEl.querySelector('li.current'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  $('search').addEventListener('input', function () {
    var q = norm(this.value.trim()), n = 0;
    Array.prototype.forEach.call(listEl.children, function (li) {
      if (li === empty) return;
      var ok = !q || li.dataset.q.indexOf(q) >= 0; li.hidden = !ok; if (ok) n++;
    });
    empty.hidden = n > 0;
  });
  // Sectores: botones "Ir a <lugar>" del tour original
  (TOUR.menu || []).filter(function (m) { return /Btn_Ir_/i.test(m.name); }).forEach(function (m) {
    var chip = document.createElement('button'); chip.className = 'chip';
    chip.textContent = m.name.replace(/^\s*\d+\s*-\s*/, '').replace(/^Btn_Ir_/i, '').replace(/_/g, ' ');
    chip.addEventListener('click', function () { go(m.scene); });
    $('sectors').appendChild(chip);
  });
  function toggleDrawer(open) {
    var o = open == null ? !document.body.classList.contains('drawer-open') : open;
    document.body.classList.toggle('drawer-open', o);
    $('drawer').setAttribute('aria-hidden', String(!o));
  }
  $('btnMenu').addEventListener('click', function () { toggleDrawer(); });
  $('btnCloseDrawer').addEventListener('click', function () { toggleDrawer(false); });

  // ---------- Controles ----------
  $('btnPrev').addEventListener('click', function () { step(-1); });
  $('btnNext').addEventListener('click', function () { step(1); });

  function setAuto(on) {
    autoOn = on; $('btnAuto').classList.toggle('on', on);
    if (on) viewer.startMovement(autorotate); else viewer.stopMovement();
  }
  $('btnAuto').addEventListener('click', function () { setAuto(!autoOn); });
  $('pano').addEventListener('pointerdown', function () { if (autoOn) setAuto(false); });
  if (CFG.autorotateIdleMs > 0) viewer.setIdleMovement(CFG.autorotateIdleMs, autorotate);

  // ---------- Zoom (+ / −): toque = un paso suave; mantener presionado = acercamiento continuo ----------
  function curView() { return current && built[current] ? built[current].scene.view() : null; }
  var zoomRaf = 0;
  function zoomTween(factor) {
    var v = curView(); if (!v) return;
    var from = v.fov(), to = from * factor, t0 = null;
    cancelAnimationFrame(zoomRaf);
    (function frame(ts) {
      if (t0 == null) t0 = ts;
      var k = Math.min(1, (ts - t0) / 220), e = 1 - Math.pow(1 - k, 3);
      v.setFov(from + (to - from) * e);
      if (k < 1) zoomRaf = requestAnimationFrame(frame);
    })(performance.now());
  }
  function bindZoom(id, factor) {
    var el = $(id), hold = 0, loop = 0, moved = false;
    function stop() { clearTimeout(hold); cancelAnimationFrame(loop); }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); if (autoOn) setAuto(false); moved = false; stop();
      hold = setTimeout(function () {
        moved = true; var step = Math.pow(factor, 1 / 8);
        (function run() { var v = curView(); if (v) v.setFov(v.fov() * step); loop = requestAnimationFrame(run); })();
      }, 300);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      el.addEventListener(ev, function () { stop(); if (ev === 'pointerup' && !moved) zoomTween(factor); moved = false; });
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomTween(factor); } });
  }
  bindZoom('btnZoomIn', 0.7);
  bindZoom('btnZoomOut', 1 / 0.7);

  var fsEl = document.documentElement;
  var fsReq = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
  if (!fsReq) { $('btnFull').hidden = true; }
  $('btnFull').addEventListener('click', function () {
    var on = document.fullscreenElement || document.webkitFullscreenElement;
    if (on) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else fsReq.call(fsEl);
  });
  document.addEventListener('fullscreenchange', function () { $('btnFull').classList.toggle('on', !!document.fullscreenElement); });

  var toastT;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  $('btnShare').addEventListener('click', function () {
    var url = location.href.split('#')[0] + '#' + current;
    if (navigator.share) { navigator.share({ title: tourTitle, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast(L.share || 'Enlace copiado'); });
  });

  var gyroMethod = null;
  if (window.TourGyro && TourGyro.supported()) {
    $('btnGyro').hidden = false;
    $('btnGyro').addEventListener('click', function () {
      var btn = $('btnGyro');
      if (gyroMethod) {
        viewer.controls().unregisterMethod('gyro'); gyroMethod.destroy(); gyroMethod = null; btn.classList.remove('on'); return;
      }
      TourGyro.request().then(function (ok) {
        if (!ok) { toast(L.gyroDenied || 'No se pudo activar el giroscopio'); return; }
        if (autoOn) setAuto(false);
        gyroMethod = TourGyro.create();
        viewer.controls().registerMethod('gyro', gyroMethod, true);
        btn.classList.add('on');
      }).catch(function () { toast(L.gyroDenied || 'No se pudo activar el giroscopio'); });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' && e.shiftKey) step(1);
    else if (e.key === 'ArrowLeft' && e.shiftKey) step(-1);
    else if (e.key === '+' || e.key === '=') zoomTween(0.7);
    else if (e.key === '-' || e.key === '_') zoomTween(1 / 0.7);
    else if (e.key === 'Escape') { hideInfo(); toggleDrawer(false); }
  });

  // ---------- API pública (la usan js/cargar.js y js/editor.js) ----------
  var userMode = false;
  window.TourAPI = {
    // Reemplaza la demo por las escenas del usuario; las siguientes cargas se agregan a las existentes.
    loadScenes: function (scenes, title) {
      if (!scenes || !scenes.length) return;
      if (userMode) {
        scenes.forEach(function (s) { SC[s.id] = s; ORDER.push(s.id); });
        buildMenu();
        first = false;
        go(scenes[0].id);
        return;
      }
      Object.keys(built).forEach(function (k) { try { viewer.destroyScene(built[k].scene); } catch (e) { /* ya liberada */ } });
      built = {}; current = null; SC = {};
      scenes.forEach(function (s) { SC[s.id] = s; });
      ORDER = scenes.map(function (s) { return s.id; });
      $('sectors').innerHTML = '';
      buildMenu();
      first = true; userMode = true;
      if (title) { tourTitle = title; $('tourTitle').textContent = title; }
      go(ORDER[0]);
    },
    hasUser: function () { return userMode; },
    currentId: function () { return current; },
    scene: function (id) { return SC[id]; },
    order: function () { return ORDER.slice(); },
    title: function () { return tourTitle; },
    setTitle: function (t) { tourTitle = t; $('tourTitle').textContent = t; document.title = t || document.title; },
    go: function (id) { go(id); },
    // yaw/pitch (grados) del punto de la pantalla (x, y en px de la ventana) o null
    coords: function (x, y) {
      var v = curView(); if (!v) return null;
      var r = $('pano').getBoundingClientRect();
      var c = v.screenToCoordinates({ x: x - r.left, y: y - r.top });
      return { yaw: +(c.yaw * 180 / Math.PI).toFixed(2), pitch: +(c.pitch * 180 / Math.PI).toFixed(2) };
    },
    viewRaw: function () { var v = curView(); if (!v) return null; var st = viewer.stage(); return { yaw: v.yaw(), pitch: v.pitch(), fov: v.fov(), w: st.width(), h: st.height() }; },   /* radianes, fov vertical */
    view: function () { var v = curView(); return v ? { yaw: +(v.yaw() * 180 / Math.PI).toFixed(2), pitch: +(v.pitch() * 180 / Math.PI).toFixed(2) } : null; },
    addHotspot: function (h, kind) { var b = built[current]; if (b) addHotspot(b.scene, h, kind, b.sprites); },
    removeHotspot: function (h) {
      var b = built[current], r = hsMap.get(h); if (!b || !r) return;
      try { b.scene.hotspotContainer().destroyHotspot(r.hs); } catch (e) { /* ya quitado */ }
      b.sprites = b.sprites.filter(function (o) { return o.el !== r.el; });
      hsMap.delete(h);
    },
    removeScene: function (id) {
      if (!SC[id]) return;
      if (built[id]) { try { viewer.destroyScene(built[id].scene); } catch (e) { /* nada */ } delete built[id]; }
      delete SC[id]; ORDER = ORDER.filter(function (x) { return x !== id; });
      buildMenu();
      if (current === id) { current = null; if (ORDER.length) { first = true; go(ORDER[0]); } }
    },
    invalidate: function (id) {      // fuerza reconstruir una escena (p. ej. tras cambiar sus enlaces)
      var b = built[id]; if (!b) return;
      var cur = id === current, v = b.scene.view(), p = { yaw: v.yaw(), pitch: v.pitch(), fov: v.fov() };
      try { viewer.destroyScene(b.scene); } catch (e) { /* nada */ }
      delete built[id];
      if (cur) { var nb = buildScene(id); nb.scene.view().setParameters(p); nb.scene.switchTo({ transitionDuration: 0 }); }
    },
    rebuildMenu: function () { buildMenu(); markCurrent(current); },
    setEditHook: function (fn) { editHook = fn; },
    showInfo: showInfo
  };

  // ---------- Arranque ----------
  var hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  var startId = SC[hash] ? hash : ORDER[0];
  go(startId);
  if (CFG.autorotate) setAuto(true);
  if (CFG.sceneListOpen && !window.matchMedia('(max-width: 900px)').matches) toggleDrawer(true);

  var hidden = false;
  function hideLoader() { if (hidden) return; hidden = true; $('loader').classList.add('done'); }
  viewer.stage().addEventListener('renderComplete', function (stable) { if (stable) hideLoader(); });
  setTimeout(hideLoader, 7000);

  window.addEventListener('hashchange', function () {
    var id = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (SC[id] && id !== current) go(id);
  });
})();
