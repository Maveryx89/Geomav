/*
 * Fotos de las partidas: cámara del teléfono + anotaciones (cotas, texto y trazos) grabadas sobre la foto.
 *   PORTICOS_FOTOS.selector(contenedor, {leer, max, onCambio, ocupado}) → { get(), vaciar() }
 *   PORTICOS_FOTOS.hoja({leer, titulo, boton, onSubir}) → hoja a pantalla completa para «+ Fotos»
 *   PORTICOS_FOTOS.anotar(blob) → Promise<Blob|null>   (editor de anotaciones)
 * Las anotaciones se dibujan en coordenadas de la imagen (máx. 1600 px) y quedan fijas en el JPEG que se sube.
 */
(function(){
  "use strict";
  var COLORES = [["#16e08a", "Verde"], ["#ff3b30", "Rojo"], ["#ffd60a", "Amarillo"], ["#ffffff", "Blanco"], ["#0a84ff", "Azul"]];
  var MAX_PX = 1600;

  function css(){
    if(document.getElementById("pf-css")) return;
    var s = document.createElement("style"); s.id = "pf-css";
    s.textContent = ".pf-btns{display:flex;gap:8px;flex-wrap:wrap}.pf-b{font:inherit;font-weight:700;font-size:.82rem;border:1px solid var(--line-strong,#c5ccd6);background:var(--paper-raised,#fff);color:var(--ink,#1b2430);border-radius:10px;padding:9px 12px;cursor:pointer}"
      + ".pf-b.p{background:var(--blueprint,#2F8FA8);border-color:var(--blueprint,#2F8FA8);color:#fff}.pf-b:disabled{opacity:.5}"
      + ".pf-th{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.pf-t{position:relative;width:104px;height:104px}.pf-t img{width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid var(--line,#ccd);display:block}"
      + ".pf-t button{position:absolute;border:0;border-radius:12px;background:rgba(0,0,0,.72);color:#fff;font-size:.8rem;line-height:1;padding:5px 7px;cursor:pointer}.pf-t .e{left:0;right:0;bottom:0;width:100%;border-radius:0 0 8px 8px;background:var(--blueprint,#2F8FA8);font-weight:700;font-size:.78rem;padding:7px 4px}.pf-t .x{right:3px;top:3px}"
      + ".pf-t .ok{position:absolute;left:3px;top:3px;background:#16a34a;color:#fff;font-size:.62rem;border-radius:8px;padding:2px 5px;font-weight:700}"
      + ".pf-ov{position:fixed;inset:0;z-index:100000;background:#0d1117;display:flex;flex-direction:column;color:#fff;font-family:inherit;touch-action:none}"
      + ".pf-top,.pf-bar{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#161b22;flex-wrap:wrap}.pf-top{justify-content:space-between}"
      + ".pf-cv{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px}.pf-cv canvas{max-width:100%;max-height:100%;touch-action:none;background:#000}"
      + ".pf-tb{font:inherit;font-size:.82rem;border:1px solid #39424e;background:#21262d;color:#fff;border-radius:9px;padding:8px 11px;cursor:pointer}.pf-tb.on{border-color:#16e08a;box-shadow:inset 0 0 0 1px #16e08a}"
      + ".pf-co{width:26px;height:26px;border-radius:50%;border:2px solid #39424e;cursor:pointer;padding:0}.pf-co.on{border-color:#fff;box-shadow:0 0 0 2px #0a84ff}"
      + ".pf-in{position:absolute;left:0;right:0;bottom:0;background:#161b22;border-top:1px solid #39424e;padding:12px;display:none;gap:8px;align-items:center;flex-wrap:wrap}"
      + ".pf-in input{flex:1;min-width:140px;font:inherit;font-size:1rem;padding:10px;border-radius:9px;border:1px solid #39424e;background:#0d1117;color:#fff}"
      + ".pf-hint{font-size:.74rem;color:#9aa4b2;padding:0 10px 6px;background:#161b22}"
      + ".pf-hoja{position:fixed;inset:0;z-index:99990;background:rgba(10,20,34,.6);display:flex;align-items:flex-end;justify-content:center}.pf-hoja>div{background:var(--paper,#fff);color:var(--ink,#1b2430);width:min(560px,100%);max-height:88vh;overflow:auto;border-radius:16px 16px 0 0;padding:16px}";
    document.head.appendChild(s);
  }
  function el(t, c, h){ var e = document.createElement(t); if(c) e.className = c; if(h != null) e.innerHTML = h; return e; }
  function cargarImg(blob){
    var viaImg = function(){ return new Promise(function(ok, ko){ var im = new Image(), u = URL.createObjectURL(blob); im.onload = function(){ ok({ src: im, w: im.naturalWidth, h: im.naturalHeight }); }; im.onerror = function(){ URL.revokeObjectURL(u); ko(new Error("img")); }; im.src = u; }); };
    return window.createImageBitmap ? createImageBitmap(blob, { imageOrientation: "from-image" }).then(function(b){ return { src: b, w: b.width, h: b.height }; }).catch(viaImg) : viaImg();
  }

  /* ---------- dibujo de las anotaciones (se usa en pantalla y al grabar) ---------- */
  var TAMS = [["S", .6], ["M", 1], ["L", 1.6], ["XL", 2.4]];
  function caja(ctx, txt, x, y, W, k){
    var fs = Math.max(14, Math.round(W / 30 * Math.max(.7, k))); ctx.font = "700 " + fs + "px system-ui,Segoe UI,Roboto,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var tw = ctx.measureText(txt).width, pw = fs * .55, ph = fs * .42, w = tw + pw * 2, h = fs + ph * 2, r = h / 3;
    ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, r); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill(); ctx.lineWidth = Math.max(1, W / 900); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillText(txt, x, y + fs * .04);
    return { x: x - w / 2, y: y - h / 2, w: w, h: h };
  }
  function etiquetaPos(o, W, H){        /* posición por defecto de la etiqueta de una cota: al lado de la línea, hacia arriba */
    var dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, off = Math.max(18, W / 26) * Math.max(.8, o.k || 1);
    if(ny > 0){ nx = -nx; ny = -ny; }
    return [Math.max(10, Math.min(W - 10, (o.a[0] + o.b[0]) / 2 + nx * off)), Math.max(10, Math.min(H - 10, (o.a[1] + o.b[1]) / 2 + ny * off))];
  }
  function pinta(ctx, im, objs, W, H, sel){
    ctx.drawImage(im.src, 0, 0, W, H);
    objs.forEach(function(o){
      var lw = Math.max(2, W / 190 * (o.k || 1));
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash([]); ctx.strokeStyle = o.c; ctx.fillStyle = o.c; ctx.lineWidth = lw; o._r = null;
      if(o.t === "trazo"){ ctx.beginPath(); o.p.forEach(function(q, i){ if(i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); }
      else if(o.t === "cota"){
        var dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, tk = lw * 3.4;
        ctx.beginPath(); ctx.moveTo(o.a[0], o.a[1]); ctx.lineTo(o.b[0], o.b[1]);
        ctx.moveTo(o.a[0] - nx * tk, o.a[1] - ny * tk); ctx.lineTo(o.a[0] + nx * tk, o.a[1] + ny * tk);
        ctx.moveTo(o.b[0] - nx * tk, o.b[1] - ny * tk); ctx.lineTo(o.b[0] + nx * tk, o.b[1] + ny * tk); ctx.stroke();
        if(o.s){ var lp = o.l || etiquetaPos(o, W, H); o._r = caja(ctx, o.s, lp[0], lp[1], W, o.k || 1); }
      }
      else if(o.t === "texto"){ o._r = caja(ctx, o.s, o.a[0], o.a[1], W, o.k || 1); }
    });
    if(sel){        /* marcas de selección (solo en pantalla, no se graban) */
      var f = Math.max(2, W / 260); ctx.setLineDash([f * 3, f * 2]); ctx.lineWidth = f; ctx.strokeStyle = "#0a84ff"; ctx.fillStyle = "#0a84ff";
      if(sel._r){ ctx.strokeRect(sel._r.x - f * 2, sel._r.y - f * 2, sel._r.w + f * 4, sel._r.h + f * 4); }
      ctx.setLineDash([]);
      if(sel.t === "cota"){ [sel.a, sel.b].forEach(function(q){ ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(9, W / 70), 0, 6.2832); ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke(); }); }
      else if(sel.t === "trazo"){ var xs = sel.p.map(function(q){ return q[0]; }), ys = sel.p.map(function(q){ return q[1]; }), x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys); ctx.setLineDash([f * 3, f * 2]); ctx.strokeRect(x0 - 8, y0 - 8, Math.max.apply(0, xs) - x0 + 16, Math.max.apply(0, ys) - y0 + 16); ctx.setLineDash([]); }
    }
  }
  function aTexto(v){ v = String(v || "").trim(); return /^[0-9]+([.,][0-9]+)?$/.test(v) ? v.replace(".", ",") + " m" : v; }   /* «4,10» → «4,10 m» */
  function dSeg(p, a, b){ var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  function enCaja(p, r, m){ return r && p[0] >= r.x - m && p[0] <= r.x + r.w + m && p[1] >= r.y - m && p[1] <= r.y + r.h + m; }
  function copia(objs){ return JSON.parse(JSON.stringify(objs, function(k, v){ return k === "_r" ? undefined : v; })); }

  /* ---------- editor ---------- */
  function anotar(blob, previas){
    css();
    return cargarImg(blob).then(function(im){
      return new Promise(function(fin){
        var k0 = Math.min(1, MAX_PX / Math.max(im.w, im.h)), W = Math.round(im.w * k0), H = Math.round(im.h * k0);
        var objs = previas && previas.length ? copia(previas) : [], hist = [], herr = "cota", col = COLORES[0][0], tam = 1, act = null, pend = null, selo = null, arr = null;
        var ov = el("div", "pf-ov"), top = el("div", "pf-top"), cvw = el("div", "pf-cv"), cv = el("canvas"), bar = el("div", "pf-bar"), hint = el("div", "pf-hint"), ent = el("div", "pf-in");
        cv.width = W; cv.height = H; cvw.appendChild(cv);
        var bCan = el("button", "pf-tb", "✕ Cancelar"), bOk = el("button", "pf-tb on", "✓ Listo"); bOk.style.borderColor = "#16e08a";
        var tit = el("b", "", "Anotar foto"); top.appendChild(bCan); top.appendChild(tit); top.appendChild(bOk);
        var herrs = [["cota", "📏 Cota"], ["texto", "🔤 Texto"], ["trazo", "✏️ Trazo"], ["mover", "👆 Editar"]], bh = {};
        herrs.forEach(function(h){ var b = el("button", "pf-tb", h[1]); b.onclick = function(){ herr = h[0]; if(herr !== "mover") selo = null; marca(); redib(); }; bh[h[0]] = b; bar.appendChild(b); });
        var bDes = el("button", "pf-tb", "↶ Deshacer"), bLim = el("button", "pf-tb", "🗑 Borrar todo"); bar.appendChild(bDes); bar.appendChild(bLim);
        var fE = el("div", "pf-sel"); fE.style.cssText = "display:flex;visibility:hidden;width:100%;gap:6px;flex-wrap:wrap"; var bTxt = el("button", "pf-tb", "✎ Cambiar texto"), bQuit = el("button", "pf-tb", "🗑 Quitar esta"); fE.appendChild(bTxt); fE.appendChild(bQuit); bar.appendChild(fE);
        var fT = el("div"); fT.style.cssText = "display:flex;gap:6px;align-items:center;width:100%;flex-wrap:wrap"; fT.appendChild(el("span", "", "<small style='color:#9aa4b2'>Grosor</small>")); var bt = [];
        TAMS.forEach(function(t){ var b = el("button", "pf-tb", t[0]); b.style.minWidth = "44px"; b.onclick = function(){ tam = t[1]; if(selo){ empuja(); selo.k = t[1]; } marca(); redib(); }; bt.push([t[1], b]); fT.appendChild(b); });
        var cs = []; COLORES.forEach(function(c){ var b = el("button", "pf-co"); b.style.background = c[0]; b.title = c[1]; b.setAttribute("aria-label", c[1]); b.onclick = function(){ col = c[0]; if(selo){ empuja(); selo.c = c[0]; } marca(); redib(); }; cs.push([c[0], b]); fT.appendChild(b); });
        bar.appendChild(fT);
        var ei = el("input"); ei.type = "text"; ei.maxLength = 60; ei.autocomplete = "off"; var eOk = el("button", "pf-tb on", "Poner"), eNo = el("button", "pf-tb", "Quitar");
        ent.appendChild(ei); ent.appendChild(eOk); ent.appendChild(eNo);
        ov.appendChild(top); ov.appendChild(cvw); ov.appendChild(hint); ov.appendChild(bar); ov.appendChild(ent); document.body.appendChild(ov);
        function empuja(){ hist.push(copia(objs)); if(hist.length > 40) hist.shift(); }
        function recup(v){ var a = JSON.parse(JSON.stringify(v)); return a; }
        function marca(){
          Object.keys(bh).forEach(function(k2){ bh[k2].classList.toggle("on", k2 === herr); });
          var cc = selo ? selo.c : col, kk = selo ? (selo.k || 1) : tam;
          cs.forEach(function(c){ c[1].classList.toggle("on", c[0] === cc); }); bt.forEach(function(t){ t[1].classList.toggle("on", t[0] === kk); });
          fE.style.visibility = selo ? "visible" : "hidden"; bTxt.style.display = selo && selo.t !== "trazo" ? "" : "none";
          hint.textContent = herr === "cota" ? "Arrastra de un punto a otro para medir; luego escribe la medida (ej. 4,10 → «4,10 m»)." : herr === "texto" ? "Toca donde quieres el texto y escríbelo." : herr === "trazo" ? "Dibuja con el dedo."
            : selo ? "Arrastra la pieza para moverla" + (selo.t === "cota" ? ", los círculos para cambiar los extremos o la etiqueta para acomodarla" : "") + ". Grosor y color cambian esta anotación." : "Toca una anotación para moverla o cambiarla.";
        }
        function redib(){ var ctx = cv.getContext("2d"); pinta(ctx, im, act ? objs.concat([act]) : objs, W, H, herr === "mover" ? selo : null); }
        function pt(e){ var r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(W, (e.clientX - r.left) / r.width * W)), Math.max(0, Math.min(H, (e.clientY - r.top) / r.height * H))]; }
        function pedir(titulo, ini, ok){ pend = ok; ei.value = ini || ""; ei.placeholder = titulo; ent.style.display = "flex"; setTimeout(function(){ ei.focus(); ei.select(); }, 30); }
        function cierraEnt(){ ent.style.display = "none"; pend = null; ei.blur(); }
        eOk.onclick = function(){ var f = pend, v = ei.value; cierraEnt(); if(f) f(v); };
        eNo.onclick = function(){ cierraEnt(); act = null; redib(); };
        ei.onkeydown = function(e){ if(e.key === "Enter"){ e.preventDefault(); eOk.onclick(); } };
        function golpe(p){        /* qué anotación hay bajo el punto (la de más arriba primero) */
          var tol = W / 38;
          for(var i = objs.length - 1; i >= 0; i--){
            var o = objs[i];
            if(o._r && enCaja(p, o._r, tol / 3)) return { o: o, parte: o.t === "cota" ? "etiqueta" : "cuerpo" };
            if(o.t === "cota" && dSeg(p, o.a, o.b) < tol) return { o: o, parte: "cuerpo" };
            if(o.t === "trazo"){ for(var j = 1; j < o.p.length; j++) if(dSeg(p, o.p[j - 1], o.p[j]) < tol) return { o: o, parte: "cuerpo" }; }
          }
          return null;
        }
        cv.addEventListener("pointerdown", function(e){
          if(pend) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); var p = pt(e);
          if(herr === "mover"){
            var r2 = Math.max(16, W / 28);
            if(selo && selo.t === "cota"){
              if(Math.hypot(p[0] - selo.a[0], p[1] - selo.a[1]) < r2){ empuja(); arr = { m: "a", o: selo, p0: p, ini: null }; return; }
              if(Math.hypot(p[0] - selo.b[0], p[1] - selo.b[1]) < r2){ empuja(); arr = { m: "b", o: selo, p0: p, ini: null }; return; }
            }
            var g = golpe(p); selo = g ? g.o : null;
            if(g){ empuja(); arr = { m: g.parte, o: g.o, p0: p, ini: copia([g.o])[0] }; }
            marca(); redib(); return;
          }
          act = herr === "trazo" ? { t: "trazo", c: col, k: tam, p: [p] } : herr === "cota" ? { t: "cota", c: col, k: tam, a: p, b: p, s: "" } : { t: "texto", c: col, k: tam, a: p, s: "" };
          if(herr === "texto"){ var o = act; act = null; pedir("Texto", "", function(v){ v = String(v).trim(); if(v){ empuja(); o.s = v; objs.push(o); } redib(); }); return; }
          redib();
        });
        cv.addEventListener("pointermove", function(e){
          var p = pt(e);
          if(arr){
            var o = arr.o, dx = p[0] - arr.p0[0], dy = p[1] - arr.p0[1];
            if(arr.m === "a") o.a = p; else if(arr.m === "b") o.b = p;
            else if(arr.m === "etiqueta"){ var base = arr.ini.l || etiquetaPos(arr.ini, W, H); o.l = [Math.max(0, Math.min(W, base[0] + dx)), Math.max(0, Math.min(H, base[1] + dy))]; }
            else { var q = arr.ini; if(o.t === "texto") o.a = [q.a[0] + dx, q.a[1] + dy]; else if(o.t === "cota"){ o.a = [q.a[0] + dx, q.a[1] + dy]; o.b = [q.b[0] + dx, q.b[1] + dy]; if(q.l) o.l = [q.l[0] + dx, q.l[1] + dy]; } else o.p = q.p.map(function(z){ return [z[0] + dx, z[1] + dy]; }); }
            redib(); return;
          }
          if(!act) return; if(act.t === "trazo") act.p.push(p); else act.b = p; redib();
        });
        function suelta(){
          if(arr){ arr = null; redib(); return; }
          if(!act) return; var o = act; act = null;
          if(o.t === "trazo"){ if(o.p.length > 1){ empuja(); objs.push(o); } redib(); return; }
          if(o.t === "cota"){
            if(Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]) < W / 60){ redib(); return; }
            empuja(); objs.push(o); redib(); pedir("Medida (ej. 4,10)", "", function(v){ o.s = aTexto(v); redib(); });
          }
        }
        cv.addEventListener("pointerup", suelta); cv.addEventListener("pointercancel", suelta);
        cv.addEventListener("dblclick", function(e){ if(herr !== "mover") return; var g = golpe(pt(e)); if(g && g.o.t !== "trazo") cambiaTexto(g.o); });
        function cambiaTexto(o){ pedir(o.t === "cota" ? "Medida (ej. 4,10)" : "Texto", o.s, function(v){ var s = o.t === "cota" ? aTexto(v) : String(v).trim(); if(s){ empuja(); o.s = s; } redib(); }); }
        bTxt.onclick = function(){ if(selo) cambiaTexto(selo); };
        bQuit.onclick = function(){ if(!selo) return; empuja(); objs.splice(objs.indexOf(selo), 1); selo = null; marca(); redib(); };
        bDes.onclick = function(){ if(hist.length){ objs = recup(hist.pop()); selo = null; marca(); redib(); } };
        bLim.onclick = function(){ if(objs.length && window.confirm("¿Borrar todas las anotaciones?")){ empuja(); objs = []; selo = null; marca(); redib(); } };
        function salir(r){ document.removeEventListener("keydown", tecla); ov.remove(); if(im.src && im.src.close) im.src.close(); fin(r); }
        function tecla(e){ if(e.key === "Escape" && !pend) bCan.onclick(); }
        document.addEventListener("keydown", tecla);
        bCan.onclick = function(){ if(objs.length && !window.confirm("¿Descartar las anotaciones?")) return; salir(null); };
        bOk.onclick = function(){
          if(!objs.length) return salir(previas && previas.length ? blob : null);
          var c2 = document.createElement("canvas"); c2.width = W; c2.height = H; pinta(c2.getContext("2d"), im, objs, W, H, null);
          c2.toBlob(function(b){ if(b){ b.nombre = blob.nombre || "foto.jpg"; b.anotada = true; b.orig = blob; b.anot = copia(objs); } salir(b || null); }, "image/jpeg", .88);
        };
        marca(); redib();
      });
    }).catch(function(){ window.alert("No se pudo abrir la foto para anotar."); return null; });
  }

  /* ---------- selector: cámara + galería + miniaturas ---------- */
  function selector(cont, o){
    css(); o = o || {}; var max = o.max || 10, blobs = [], urls = [];
    cont.innerHTML = "";
    var fila = el("div", "pf-btns"), th = el("div", "pf-th"), msg = el("div", "pm-f"); msg.style.cssText = "font-size:.74rem;margin-top:6px";
    function inp(captura){ var i = el("input"); i.type = "file"; i.accept = "image/*"; if(captura) i.setAttribute("capture", "environment"); else i.multiple = true; i.style.display = "none"; i.onchange = function(){ var fs = i.files; if(fs && fs.length) agrega(fs, !!captura); i.value = ""; }; return i; }
    var iCam = inp(true), iGal = inp(false);
    var bC = el("button", "pf-b p", "📷 Tomar foto"), bG = el("button", "pf-b", "🖼 Galería");
    bC.type = bG.type = "button"; bC.onclick = function(){ iCam.click(); }; bG.onclick = function(){ iGal.click(); };
    fila.appendChild(bC); fila.appendChild(bG); fila.appendChild(iCam); fila.appendChild(iGal);
    cont.appendChild(fila); cont.appendChild(th); cont.appendChild(msg);
    function cambio(){ if(o.onCambio) o.onCambio(blobs.slice()); }
    function agrega(fs, camara){
      var libres = max - blobs.length; if(libres <= 0){ msg.textContent = "Máximo " + max + " fotos."; return; }
      msg.textContent = "Leyendo fotos…"; if(o.ocupado) o.ocupado(true);
      o.leer(Array.prototype.slice.call(fs, 0, libres)).then(function(bs){
        blobs = blobs.concat(bs); msg.textContent = fs.length > libres ? "Solo caben " + max + " fotos." : (bs.length < Math.min(fs.length, libres) ? "Algunas fotos no se pudieron leer." : "");
        var primera = blobs.length - bs.length; pinta2(); cambio(); if(camara && bs.length) aviso(primera);
      }).then(function(){ if(o.ocupado) o.ocupado(false); }, function(){ if(o.ocupado) o.ocupado(false); });
    }
    function editar(i){ var b = blobs[i]; if(!b) return; anotar(b.orig || b, b.anot).then(function(nb){ if(nb){ blobs[i] = nb; pinta2(); cambio(); } }); }
    function aviso(i){ msg.innerHTML = ""; var b = el("button", "pf-b p", "✎ Agregar cotas o texto a la foto"); b.type = "button"; b.style.marginTop = "4px"; b.onclick = function(){ msg.innerHTML = ""; editar(i); }; msg.appendChild(b); }
    function pinta2(){
      urls.forEach(function(u){ URL.revokeObjectURL(u); }); urls = []; th.innerHTML = "";
      blobs.forEach(function(b, i){
        var u = URL.createObjectURL(b); urls.push(u);
        var t = el("div", "pf-t"), im = el("img"); im.alt = "Foto " + (i + 1); im.src = u; t.appendChild(im);
        if(b.anotada) t.appendChild(el("span", "ok", "✎"));
        var e = el("button", "e", b.anotada ? "✎ Editar notas" : "✎ Editar / cotas"), x = el("button", "x", "✕"); e.type = x.type = "button"; e.setAttribute("aria-label", "Anotar foto " + (i + 1)); x.setAttribute("aria-label", "Quitar foto " + (i + 1));
        e.onclick = function(){ editar(i); };
        x.onclick = function(){ blobs.splice(i, 1); pinta2(); cambio(); };
        t.appendChild(e); t.appendChild(x); th.appendChild(t);
      });
    }
    return { get: function(){ return blobs.slice(); }, vaciar: function(){ blobs = []; pinta2(); cambio(); } };
  }

  /* hoja inferior para «+ Fotos» de un registro ya guardado */
  function hoja(o){
    css(); var fondo = el("div", "pf-hoja"), caja2 = el("div"), cont = el("div"), pie = el("div", "pf-btns"); pie.style.marginTop = "14px";
    caja2.appendChild(el("b", "", o.titulo || "Agregar fotos")); cont.style.marginTop = "10px"; caja2.appendChild(cont);
    var bS = el("button", "pf-b p", o.boton || "Subir fotos"), bX = el("button", "pf-b", "Cancelar"); bS.type = bX.type = "button"; bS.disabled = true; pie.appendChild(bS); pie.appendChild(bX); caja2.appendChild(pie); fondo.appendChild(caja2); document.body.appendChild(fondo);
    var ocup = false, sel = selector(cont, { leer: o.leer, max: o.max || 10, ocupado: function(v){ ocup = v; bS.disabled = v || !sel || !sel.get().length; }, onCambio: function(b){ bS.disabled = ocup || !b.length; } });
    function cerrar(){ fondo.remove(); }
    bX.onclick = cerrar; fondo.addEventListener("pointerdown", function(e){ if(e.target === fondo) cerrar(); });
    bS.onclick = function(){ var b = sel.get(); if(!b.length) return; cerrar(); o.onSubir(b); };
  }
  window.PORTICOS_FOTOS = { selector: selector, hoja: hoja, anotar: anotar };
})();
