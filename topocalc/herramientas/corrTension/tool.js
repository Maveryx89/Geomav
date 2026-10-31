"use strict";
/* Herramienta «Corrección por Tensión»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCorrTension(L, P, Ps, A_mm2, E_MPa){
  const Cp = ((P-Ps)*L)/(A_mm2*E_MPa);
  return {Cp, Lcorr: L+Cp};
}
function renderCorrTension(){
  const body = `<div class="field-card">
    ${fieldRow('Longitud medida L (m)','cp_l',100)}
    ${fieldRow('Tensión aplicada P (N)','cp_p',80)}
    ${fieldRow('Tensión estándar de la cinta Ps (N)','cp_ps',50)}
    ${fieldRow('Área sección de la cinta (mm²)','cp_a',2.5)}
    ${fieldRow('Módulo de elasticidad del acero E (MPa)','cp_e',200000)}
    <button class="btn" id="btnCP" type="button">Calcular</button>
    <div id="resCP"></div>
  </div>`;
  toolShell('corrTension','Corrige la longitud medida con cinta de acero cuando la tensión aplicada en terreno difiere de la tensión estándar de calibración (elasticidad de la cinta).', body);
  document.getElementById('btnCP').addEventListener('click', ()=>{
    const L=val('cp_l'), P=val('cp_p'), Ps=val('cp_ps'), A=val('cp_a'), E=val('cp_e');
    const box=document.getElementById('resCP');
    if([L,P,Ps,A,E].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcCorrTension(L,P,Ps,A,E);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Corrección (Cp)</span><span class="v">${r.Cp>=0?'+':''}${fmtNum(r.Cp,4)} m</span></div>
      <div class="result-row"><span class="k">Longitud corregida</span><span class="v accent big">${fmtNum(r.Lcorr,4)} m</span></div>
    </div>`;
  });
}

const RENDERERS = { corrTension: renderCorrTension };
