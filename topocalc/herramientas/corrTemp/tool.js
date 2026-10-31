"use strict";
/* Herramienta «Corrección por Temperatura»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCorrTemperatura(L, Tact, Test, coefK){
  const Ct = coefK*(Tact-Test)*L;
  return {Ct, Lcorr: L+Ct};
}
function renderCorrTemp(){
  const body = `<div class="field-card">
    ${fieldRow('Longitud medida L (m)','ct_l',100)}
    ${fieldRow('Temperatura al medir (°C)','ct_tact',32)}
    ${fieldRow('Temperatura estándar de la cinta (°C)','ct_test',20)}
    ${fieldRow('Coef. dilatación del acero (1/°C)','ct_k',0.0000116)}
    <button class="btn" id="btnCT" type="button">Calcular</button>
    <div id="resCT"></div>
  </div>`;
  toolShell('corrTemp','Corrige la longitud medida con cinta de acero por la diferencia entre la temperatura de terreno y la temperatura estándar de calibración.', body);
  document.getElementById('btnCT').addEventListener('click', ()=>{
    const L=val('ct_l'), Tact=val('ct_tact'), Test=val('ct_test'), k=val('ct_k');
    const box=document.getElementById('resCT');
    if([L,Tact,Test,k].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcCorrTemperatura(L,Tact,Test,k);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Corrección (Ct)</span><span class="v ${r.Ct<0?'':'accent'}">${r.Ct>=0?'+':''}${fmtNum(r.Ct,4)} m</span></div>
      <div class="result-row"><span class="k">Longitud corregida</span><span class="v accent big">${fmtNum(r.Lcorr,4)} m</span></div>
    </div>`;
  });
}

const RENDERERS = { corrTemp: renderCorrTemp };
