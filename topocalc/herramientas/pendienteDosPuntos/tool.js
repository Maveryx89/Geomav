"use strict";
/* Herramienta «Pendiente entre Dos Puntos»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcPendienteDosPuntos(e1,n1,cota1,e2,n2,cota2){
  const distH = Math.sqrt((e2-e1)*(e2-e1)+(n2-n1)*(n2-n1));
  const desnivel = cota2-cota1;
  const pendientePct = distH!==0 ? (desnivel/distH)*100 : Infinity;
  const pendienteDeg = toDeg(Math.atan2(desnivel,distH));
  const distInclinada = Math.sqrt(distH*distH+desnivel*desnivel);
  return {distH, desnivel, pendientePct, pendienteDeg, distInclinada};
}
function renderPendienteDosPuntos(){
  const body = `<div class="field-card">
    <h3>Punto 1</h3>
    <div class="field-inline2">
      ${fieldRow('Este','pd_e1',5000)}
      ${fieldRow('Norte','pd_n1',10000)}
    </div>
    ${fieldRow('Cota','pd_c1',250)}
    <h3>Punto 2</h3>
    <div class="field-inline2">
      ${fieldRow('Este','pd_e2',5080)}
      ${fieldRow('Norte','pd_n2',10040)}
    </div>
    ${fieldRow('Cota','pd_c2',262)}
    <button class="btn" id="btnPD" type="button">Calcular</button>
    <div id="resPD"></div>
  </div>`;
  toolShell('pendienteDosPuntos','Pendiente entre dos puntos con coordenadas y cota conocidas — distancia horizontal, desnivel, pendiente en % y en grados.', body);
  document.getElementById('btnPD').addEventListener('click', ()=>{
    const e1=val('pd_e1'), n1=val('pd_n1'), c1=val('pd_c1'), e2=val('pd_e2'), n2=val('pd_n2'), c2=val('pd_c2');
    const box=document.getElementById('resPD');
    if([e1,n1,c1,e2,n2,c2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcPendienteDosPuntos(e1,n1,c1,e2,n2,c2);
    const relHV = r.pendientePct!==0 ? `1 : ${fmtNum(100/Math.abs(r.pendientePct),2)}` : '—';
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Distancia horizontal</span><span class="v">${fmtNum(r.distH,3)} m</span></div>
      <div class="result-row"><span class="k">Desnivel</span><span class="v">${fmtNum(r.desnivel,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia inclinada</span><span class="v">${fmtNum(r.distInclinada,3)} m</span></div>
      <div class="result-row"><span class="k">Pendiente</span><span class="v accent big">${fmtNum(r.pendientePct,2)} %</span></div>
      <div class="result-row"><span class="k">Pendiente angular</span><span class="v">${fmtAngle(Math.abs(r.pendienteDeg))}</span></div>
      <div class="result-row"><span class="k">Relación H:V</span><span class="v">${relHV}</span></div>
      <div class="plot-wrap">${svgTrianguloVertical(Math.abs(r.pendienteDeg), r.distH, undefined, undefined, r.desnivel, {Di:r.distInclinada, pct:r.pendientePct, star:'a', sign:r.desnivel<0?-1:1})}</div>
    </div>`;
  });
}

const RENDERERS = { pendienteDosPuntos: renderPendienteDosPuntos };
