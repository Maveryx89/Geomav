/*
 * Teselado en el navegador: foto equirectangular 2:1 -> cubo de 6 caras con teselas por niveles
 * (el mismo esquema que usa Marzipano Tool). Todo ocurre en el equipo, sin subir nada.
 */
(function () {
  'use strict';
  var TILE = 512;
  var FACES = ['f', 'r', 'b', 'l', 'u', 'd'];
  // dirección 3D (x derecha, y arriba, z adelante) de un punto (a, b) de la cara; a,b en [-1, 1], b hacia arriba
  var DIR = {
    f: function (a, b) { return [a, b, 1]; },
    r: function (a, b) { return [1, b, -a]; },
    b: function (a, b) { return [-a, b, -1]; },
    l: function (a, b) { return [-1, b, a]; },
    u: function (a, b) { return [a, 1, -b]; },
    d: function (a, b) { return [a, -1, b]; }
  };

  function nextTick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function toBlob(canvas) {
    return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, 'image/jpeg', 0.88); });
  }

  function levelSizes(F) {
    var s = [], v = TILE;
    while (v < F) { s.push(v); v *= 2; }
    s.push(F);
    return s;
  }

  // Muestrea la cara 'face' del cubo (F x F) desde los píxeles de la equirectangular src (ImageData w x h)
  function renderFace(face, F, src, w, h) {
    var out = new ImageData(F, F), o = out.data, s = src.data, dir = DIR[face];
    var TWO_PI = 2 * Math.PI, PI = Math.PI;
    for (var j = 0; j < F; j++) {
      var b = 1 - 2 * (j + 0.5) / F;
      for (var i = 0; i < F; i++) {
        var a = 2 * (i + 0.5) / F - 1;
        var d = dir(a, b), x = d[0], y = d[1], z = d[2];
        var len = Math.sqrt(x * x + y * y + z * z);
        var lon = Math.atan2(x, z), lat = Math.asin(y / len);
        var u = (lon / TWO_PI + 0.5) * w - 0.5, v = (0.5 - lat / PI) * h - 0.5;
        var x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
        var x1 = x0 + 1; if (x0 < 0) x0 += w; if (x1 >= w) x1 -= w; if (x1 < 0) x1 += w; if (x0 >= w) x0 -= w;
        var y1 = y0 + 1; if (y0 < 0) y0 = 0; if (y1 < 0) y1 = 0; if (y0 >= h) y0 = h - 1; if (y1 >= h) y1 = h - 1;
        var p00 = (y0 * w + x0) * 4, p10 = (y0 * w + x1) * 4, p01 = (y1 * w + x0) * 4, p11 = (y1 * w + x1) * 4;
        var w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy, q = (j * F + i) * 4;
        o[q] = s[p00] * w00 + s[p10] * w10 + s[p01] * w01 + s[p11] * w11;
        o[q + 1] = s[p00 + 1] * w00 + s[p10 + 1] * w10 + s[p01 + 1] * w01 + s[p11 + 1] * w11;
        o[q + 2] = s[p00 + 2] * w00 + s[p10 + 2] * w10 + s[p01 + 2] * w01 + s[p11 + 2] * w11;
        o[q + 3] = 255;
      }
    }
    return out;
  }

  /*
   * img: HTMLImageElement (ya cargada). opts: { maxWidth, onProgress(0..1) }
   * Devuelve { faceSize, levels:[{index,size,tileSize}], blobs:{clave:Blob}, urls:{clave:blobURL}, thumb:Blob }
   * clave = "<nivel>/<cara>/<fila>_<columna>"
   */
  function build(img, opts) {
    opts = opts || {};
    var maxW = opts.maxWidth || 8192;
    var W = Math.min(img.naturalWidth, maxW), H = Math.round(W / 2);
    var base = document.createElement('canvas'); base.width = W; base.height = H;
    var bctx = base.getContext('2d'); bctx.imageSmoothingQuality = 'high';
    bctx.drawImage(img, 0, 0, W, H);
    var src = bctx.getImageData(0, 0, W, H);
    base.width = base.height = 1;                                   // libera memoria
    var F = Math.max(TILE, Math.floor(W / 4 / TILE) * TILE);
    var sizes = levelSizes(F);
    var res = { faceSize: F, levels: sizes.map(function (s, i) { return { index: i, size: s, tileSize: TILE }; }), blobs: {}, urls: {}, thumb: null };
    var progress = opts.onProgress || function () {};

    // miniatura 160x80 desde la imagen original
    var t = document.createElement('canvas'); t.width = 160; t.height = 80;
    t.getContext('2d').drawImage(img, 0, 0, 160, 80);

    var chain = Promise.resolve();
    FACES.forEach(function (face, fi) {
      chain = chain.then(function () { return nextTick(); }).then(function () {
        var data = renderFace(face, F, src, W, H);
        var fc = document.createElement('canvas'); fc.width = fc.height = F;
        fc.getContext('2d').putImageData(data, 0, 0);
        var jobs = [];
        sizes.forEach(function (size, li) {
          var lc = fc;
          if (size !== F) {
            lc = document.createElement('canvas'); lc.width = lc.height = size;
            var c = lc.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(fc, 0, 0, size, size);
          }
          var n = size / TILE;
          for (var r = 0; r < n; r++) for (var cI = 0; cI < n; cI++) {
            (function (r, cI) {
              var tc = document.createElement('canvas'); tc.width = tc.height = TILE;
              tc.getContext('2d').drawImage(lc, cI * TILE, r * TILE, TILE, TILE, 0, 0, TILE, TILE);
              var key = li + '/' + face + '/' + r + '_' + cI;
              jobs.push(toBlob(tc).then(function (b) { res.blobs[key] = b; res.urls[key] = URL.createObjectURL(b); }));
            })(r, cI);
          }
        });
        return Promise.all(jobs);
      }).then(function () { progress((fi + 1) / FACES.length); });
    });
    return chain.then(function () { return toBlob(t); }).then(function (tb) { res.thumb = tb; res.thumbUrl = URL.createObjectURL(tb); return res; });
  }

  window.TourTiles = { build: build, TILE: TILE, FACES: FACES };
})();
