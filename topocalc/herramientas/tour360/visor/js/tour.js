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
    var levels = s.levels.map(function (l, i) {
      return { tileSize: l.tileSize, size: l.size, fallbackOnly: i === 0 && s.levels.length > 1 };
    });
    var geometry = new Marzipano.CubeGeometry(levels);
    var source = new Marzipano.ImageUrlSource(function (tile) {
      var lv = s.levels[tile.z];
      return { url: lv.url.replace('{face}', tile.face).replace('{row}', tile.y).replace('{column}', tile.x) };
    });
    var top = s.levels[s.levels.length - 1].size;
    var limiter = Marzipano.RectilinearView.limit.traditional(top, rad(Math.min(s.hfovMax || 130, 130)));
    var iv = s.initialView || { yaw: 0, pitch: 0 };
    var view = new Marzipano.RectilinearView({ yaw: rad(iv.yaw), pitch: rad(iv.pitch), fov: initialFov() }, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
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

    if (kind === 'label') {
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
        el.addEventListener('click', function () { hideTip(); go(h.target, h.arrival); });
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
    scene.hotspotContainer().createHotspot(el, { yaw: rad(h.yaw), pitch: rad(h.pitch) },
      { perspective: { radius: R, extraTransforms: transforms.trim() } });
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
  var empty = document.createElement('li'); empty.className = 'empty'; empty.textContent = L.noResults || 'Sin resultados'; empty.hidden = true;
  listEl.appendChild(empty);
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
    else if (e.key === 'Escape') toggleDrawer(false);
  });

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
