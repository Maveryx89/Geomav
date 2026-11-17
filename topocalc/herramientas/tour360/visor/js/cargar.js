/*
 * Carga de fotos 360° propias (equirectangulares 2:1) desde el celular o el computador.
 * Cada foto se convierte en el navegador a cubo con teselas por niveles (como Marzipano Tool).
 * Nada se sube a un servidor.
 */
(function () {
  'use strict';
  if (!window.TourAPI || !window.TourTiles) return;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var MAX_W = coarse ? 4096 : 8192;       // celular: 4096 px (cara de 1024); computador: 8192 px (cara de 2048)
  var counter = 0;

  var ctr = document.getElementById('controls');
  var btn = document.createElement('button');
  btn.className = 'icon-btn'; btn.id = 'btnLoad'; btn.type = 'button';
  btn.title = 'Cargar mis fotos 360°'; btn.setAttribute('aria-label', 'Cargar mis fotos 360°');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/></svg>';
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/*'; inp.multiple = true; inp.hidden = true; inp.id = 'fileLoad';
  ctr.insertBefore(btn, document.getElementById('btnShare'));
  document.body.appendChild(inp);
  btn.addEventListener('click', function () { inp.click(); });

  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg, ms) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 3200);
  }
  window.TourToast = toast;

  function cargarImagen(file) {
    return new Promise(function (resolve, reject) {
      var src = URL.createObjectURL(file), img = new Image();
      img.onload = function () { URL.revokeObjectURL(src); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(src); reject(new Error('img')); };
      img.src = src;
    });
  }

  function procesar(file, n, total) {
    return cargarImagen(file).then(function (img) {
      var r = img.naturalWidth / img.naturalHeight;
      if (r < 1.9 || r > 2.1) throw new Error('no2a1');
      var etiqueta = total > 1 ? n + '/' + total + ' · ' : '';
      return window.TourTiles.build(img, {
        maxWidth: MAX_W,
        onProgress: function (p) { toast('Procesando ' + etiqueta + Math.round(p * 100) + '%…', 120000); }
      });
    }).then(function (t) {
      var id = 'foto' + (++counter);
      return {
        id: id, name: file.name.replace(/\.[^.]+$/, ''), thumbnail: t.thumbUrl, thumbBlob: t.thumb,
        levels: t.levels, tileUrls: t.urls, tileBlobs: t.blobs, faceSize: t.faceSize,
        initialView: { yaw: 0, pitch: 0 }, hfovMax: 130, links: [], hotspots: [], editable: true
      };
    });
  }

  inp.addEventListener('change', function () {
    var files = Array.prototype.filter.call(inp.files || [], function (f) { return /^image\//.test(f.type); });
    inp.value = '';
    if (!files.length) { toast('Elige imágenes 360° (formato equirectangular 2:1).'); return; }
    toast('Procesando…', 120000);
    var ok = [], mal = 0, p = Promise.resolve();
    files.forEach(function (f, i) {
      p = p.then(function () { return procesar(f, i + 1, files.length); }).then(function (s) { ok.push(s); }, function () { mal++; });
    });
    p.then(function () {
      if (!ok.length) { toast('Ninguna imagen es 360° equirectangular (debe ser 2:1, por ejemplo 8192×4096).', 5000); return; }
      var agregar = window.TourAPI.hasUser();
      window.TourAPI.loadScenes(ok, 'Mis fotos 360°');
      toast(ok.length + ' foto' + (ok.length > 1 ? 's' : '') + (agregar ? ' agregada' : ' cargada') + (ok.length > 1 ? 's' : '') +
        (mal ? ' · ' + mal + ' omitida' + (mal > 1 ? 's' : '') + ' (no son 2:1)' : '') + '. Toca ✎ para editar y exportar.', 4500);
    });
  });
})();
