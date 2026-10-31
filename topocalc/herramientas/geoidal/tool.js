"use strict";
/* Herramienta «Altura Elipsoidal ↔ Ortométrica»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcAlturaElipsoidal(H, N){ return H+N; }
function calcAlturaOrtometrica(h, N){ return h-N; }
function renderGeoidal(){
  const body = `
  <div class="field-card">
    <h3>Ortométrica (H) + N → Elipsoidal (h)</h3>
    ${fieldRow('Altura ortométrica H (m, sobre el nivel medio del mar)','ge_H',520)}
    ${fieldRow('Ondulación geoidal N (m)','ge_N1',35.2)}
    <button class="btn" id="btnGE1" type="button">Calcular</button>
    <div id="resGE1"></div>
  </div>
  <div class="field-card">
    <h3>Elipsoidal (h) − N → Ortométrica (H)</h3>
    ${fieldRow('Altura elipsoidal h (m, dato GNSS)','ge_h',555.2)}
    ${fieldRow('Ondulación geoidal N (m)','ge_N2',35.2)}
    <button class="btn" id="btnGE2" type="button">Calcular</button>
    <div id="resGE2"></div>
  </div>`;
  toolShell('geoidal','h = H + N. Convierte entre altura elipsoidal (la que entrega un GNSS/RTK) y altura ortométrica (la de nivel, sobre el geoide). Necesitas el valor N (ondulación geoidal) del punto, de un modelo oficial (ej. GEOIDCHILE, EGM2008) o de tu equipo GNSS — esta calculadora no calcula N, solo la suma/resta.', body, ['h','H','N']);
  document.getElementById('btnGE1').addEventListener('click', ()=>{
    const H=val('ge_H'), N=val('ge_N1'); const box=document.getElementById('resGE1');
    if(isNaN(H)||isNaN(N)){ box.innerHTML=`<p class="err-msg">Completa ambos valores.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Altura elipsoidal (h)</span><span class="v accent big">${fmtNum(calcAlturaElipsoidal(H,N),3)} m</span></div></div>`;
  });
  document.getElementById('btnGE2').addEventListener('click', ()=>{
    const h=val('ge_h'), N=val('ge_N2'); const box=document.getElementById('resGE2');
    if(isNaN(h)||isNaN(N)){ box.innerHTML=`<p class="err-msg">Completa ambos valores.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Altura ortométrica (H)</span><span class="v accent big">${fmtNum(calcAlturaOrtometrica(h,N),3)} m</span></div></div>`;
  });
}

const RENDERERS = { geoidal: renderGeoidal };
