/*
 * Carga de fotos 360° propias (equirectangulares 2:1) desde el celular o el computador.
 * Todo se procesa en el equipo: las imágenes no se suben a ningún servidor.
 */
(function () {
  'use strict';
  if (!window.TourAPI) return;
  var MAX_W = 4096;                       // ancho máximo de textura (compatible con celulares)
  var urls = [];

  var ctr = document.getElementById('controls');
  var btn = document.createElement('button');
  btn.className = 'icon-btn'; btn.id = 'btnLoad'; btn.type = 'button';
  btn.title = 'Cargar mis fotos 360°'; btn.setAttribute('aria-label', 'Cargar mis fotos 360°');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/></svg>';
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.hidden = true; inp.id = 'fileLoad';
  ctr.insertBefore(btn, document.getElementById('btnShare'));
  document.body.appendChild(inp);
  btn.addEventListener('click', function () { inp.click(); });

  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg, ms) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 3200);
  }

  function procesar(file, n) {
    return new Promise(function (resolve, reject) {
      var src = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, r = w / h;
        if (r < 1.9 || r > 2.1) { URL.revokeObjectURL(src); reject(new Error('no2a1')); return; }
        var k = Math.min(1, MAX_W / w), cw = Math.round(w * k), ch = Math.round(h * k);
        var c = document.createElement('canvas'); c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img, 0, 0, cw, ch);
        var t = document.createElement('canvas'); t.width = 160; t.height = 80;
        t.getContext('2d').drawImage(img, 0, 0, 160, 80);
        URL.revokeObjectURL(src);
        c.toBlob(function (blob) {
          if (!blob) { reject(new Error('blob')); return; }
          var u = URL.createObjectURL(blob); urls.push(u);
          resolve({
            id: 'foto' + n, name: file.name.replace(/\.[^.]+$/, ''), thumbnail: t.toDataURL('image/jpeg', 0.7),
            equirect: { url: u, width: cw }, initialView: { yaw: 0, pitch: 0 }, hfovMax: 130, links: [], hotspots: []
          });
        }, 'image/jpeg', 0.9);
      };
      img.onerror = function () { URL.revokeObjectURL(src); reject(new Error('img')); };
      img.src = src;
    });
  }

  inp.addEventListener('change', function () {
    var files = Array.prototype.filter.call(inp.files || [], function (f) { return /^image\//.test(f.type); });
    inp.value = '';
    if (!files.length) { toast('Elige imágenes 360° (formato equirectangular 2:1).'); return; }
    toast('Cargando ' + files.length + ' foto' + (files.length > 1 ? 's' : '') + '…', 60000);
    var ok = [], mal = 0, p = Promise.resolve();
    files.forEach(function (f, i) {
      p = p.then(function () { return procesar(f, i + 1); }).then(function (s) { ok.push(s); }, function () { mal++; });
    });
    p.then(function () {
      if (!ok.length) { toast('Ninguna imagen es 360° equirectangular (debe ser 2:1, por ejemplo 8192×4096).', 5000); return; }
      var viejas = urls.slice(0, urls.length - ok.length); viejas.forEach(function (u) { URL.revokeObjectURL(u); }); urls = urls.slice(urls.length - ok.length);
      window.TourAPI.loadScenes(ok, 'Mis fotos 360°');
      toast(ok.length + ' foto' + (ok.length > 1 ? 's' : '') + ' cargada' + (ok.length > 1 ? 's' : '') + (mal ? ' · ' + mal + ' omitida' + (mal > 1 ? 's' : '') + ' (no son 2:1)' : ''), 3500);
    });
  });
})();
