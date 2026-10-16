/* Resumen ejecutivo de Last Planner: PDF directo (A3, 300 ppp) con Semanal + Intermedio + Plan Maestro + Indicadores. GeoMAV */
(function(){
  "use strict";
  function aBytes(cv){
    return new Promise(function(ok, no){
      cv.toBlob(function(b){ if(!b) return no(new Error("No se pudo generar la imagen.")); b.arrayBuffer().then(function(a){ ok(new Uint8Array(a)); }, no); }, "image/jpeg", 0.92);
    });
  }
  function pdfDesde(pags, titulo){
    var enc = new TextEncoder(), parts = [], len = 0, offs = [], n = pags.length;
    function put(x){ var b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(k, body){ offs[k] = len; put(k + " 0 obj\n"); put(body); put("\nendobj\n"); }
    put("%PDF-1.4\n%âãÏÓ\n");
    var kids = []; for(var i = 0; i < n; i++) kids.push((3 + i * 3) + " 0 R");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>"); obj(2, "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>");
    pags.forEach(function(p, i){
      var pId = 3 + i * 3, cId = pId + 1, iId = pId + 2, W = p.W, H = p.H, cont = "q " + W + " 0 0 " + H + " 0 0 cm /Im0 Do Q";
      obj(pId, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /XObject << /Im0 " + iId + " 0 R >> >> /Contents " + cId + " 0 R >>");
      obj(cId, "<< /Length " + cont.length + " >>\nstream\n" + cont + "\nendstream");
      offs[iId] = len; put(iId + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + p.pw + " /Height " + p.ph + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + p.jpg.length + " >>\nstream\n"); put(p.jpg); put("\nendstream\nendobj\n");
    });
    var total = 3 + n * 3, xref = len; put("xref\n0 " + total + "\n0000000000 65535 f \n");
    for(var k = 1; k < total; k++) put(String(offs[k]).padStart(10, "0") + " 00000 n \n");
    put("trailer\n<< /Size " + total + " /Root 1 0 R /Info << /Title (" + String(titulo).replace(/[^\x20-\x7E]/g, "").replace(/[()\\]/g, "") + ") /Producer (GeoMAV) >> >>\nstartxref\n" + xref + "\n%%EOF");
    return new Blob(parts, { type:"application/pdf" });
  }
  function pdf(btn){
    var B = window.PIZARRA_BOARDS || {}, ORD = ["semanal", "intermedio", "maestro", "indicadores"], pags = [], body = document.body;
    var prev = body.getAttribute("data-mtab"), txt = btn ? btn.textContent : "";
    if(btn){ btn.disabled = true; btn.textContent = "Generando…"; }
    function fin(){
      window.__LP_HOJA = ""; if(prev === null) body.removeAttribute("data-mtab"); else body.setAttribute("data-mtab", prev);
      if(btn){ btn.disabled = false; btn.textContent = txt; }
    }
    var cadena = Promise.resolve();
    ORD.forEach(function(k, i){
      cadena = cadena.then(function(){
        if(btn) btn.textContent = "Hoja " + (i + 1) + " de 4…";
        window.__LP_HOJA = "Hoja " + (i + 1) + " de 4";
        body.setAttribute("data-mtab", k);
        return new Promise(function(r){ requestAnimationFrame(function(){ setTimeout(r, 60); }); }).then(function(){
          if(k === "indicadores"){
            if(!window.LP_IND || !window.LP_IND.pagina) throw new Error("No están disponibles los indicadores.");
            return window.LP_IND.pagina(window.__LP_HOJA);
          }
          if(!B[k] || !B[k].exportCanvas) throw new Error("No se encontró el tablero " + k + ".");
          return B[k].exportCanvas();
        }).then(function(r){
          var cv = r.cv, W = r.PW / 25.4 * 72, H = r.PH / 25.4 * 72, pw = cv.width, ph = cv.height;
          return aBytes(cv).then(function(jpg){ pags.push({ jpg:jpg, pw:pw, ph:ph, W:+W.toFixed(2), H:+H.toFixed(2) }); cv.width = cv.height = 1; });
        });
      });
    });
    return cadena.then(function(){
      var D = new Date(), f = D.getFullYear() + "-" + String(D.getMonth() + 1).padStart(2, "0") + "-" + String(D.getDate()).padStart(2, "0");
      var blob = pdfDesde(pags, "Resumen ejecutivo Last Planner"), a = document.createElement("a"), u = URL.createObjectURL(blob);
      a.href = u; a.download = "LastPlanner_Resumen_ejecutivo_" + f + ".pdf"; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); }, 4000); fin();
    }, function(e){ fin(); throw e; });
  }
  window.LP_INFORME = { pdf: pdf };
})();
