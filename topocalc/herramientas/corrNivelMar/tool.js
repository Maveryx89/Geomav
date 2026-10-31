"use strict";
/* Herramienta «Corrección Nivel del Mar»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCorrNivelMar(L, altitud, radioTierra=6371000){
  const Cm = -(L*altitud)/radioTierra;
  return {Cm, Lcorr: L+Cm};
}
function renderCorrNivelMar(){
  const body = `<div class="field-card">
    ${fieldRow('Longitud medida L (m)','cm_l',1000)}
    ${fieldRow('Altitud media sobre el nivel del mar (m)','cm_alt',850)}
    <button class="btn" id="btnCM" type="button">Calcular</button>
    <div id="resCM"></div>
  </div>`;
  toolShell('corrNivelMar','Reduce una distancia medida en altura a su equivalente al nivel del mar, para trabajos geodésicos.', body);
  document.getElementById('btnCM').addEventListener('click', ()=>{
    const L=val('cm_l'), alt=val('cm_alt');
    const box=document.getElementById('resCM');
    if(isNaN(L)||isNaN(alt)){ box.innerHTML=`<p class="err-msg">Completa longitud y altitud.</p>`; return; }
    const r = calcCorrNivelMar(L,alt);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Corrección (Cm)</span><span class="v">${fmtNum(r.Cm,4)} m</span></div>
      <div class="result-row"><span class="k">Longitud corregida</span><span class="v accent big">${fmtNum(r.Lcorr,4)} m</span></div>
    </div>`;
  });
}

const RENDERERS = { corrNivelMar: renderCorrNivelMar };
