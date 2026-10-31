"use strict";
/* Herramienta «Costo de Brigada»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCostoBrigada(sueldoMensual, leyesPct, diasMes, nPersonas, costosAdicDiarios){
  const costoPersonaDia = (sueldoMensual*(1+leyesPct/100))/diasMes;
  const costoBrigadaDia = costoPersonaDia*nPersonas + (costosAdicDiarios||0);
  return {costoPersonaDia, costoBrigadaDia};
}
function renderCosto(){
  const body = `<div class="field-card">
    ${fieldRow('Sueldo base mensual por persona ($)','co_sueldo',700000)}
    ${fieldRow('Leyes sociales / cargas (%)','co_leyes',22)}
    ${fieldRow('Días trabajados al mes','co_dias',22)}
    ${fieldRow('Personas en la brigada','co_n',3)}
    ${fieldRow('Otros costos diarios — viáticos, combustible ($)','co_extra',15000)}
    <button class="btn" id="btnCO" type="button">Calcular</button>
    <div id="resCO"></div>
  </div>`;
  toolShell('costo','Costo diario real de una brigada topográfica, incluyendo cargas sociales y gastos operativos — base para cotizar trabajos.', body);
  document.getElementById('btnCO').addEventListener('click', ()=>{
    const s=val('co_sueldo'), l=val('co_leyes'), d=val('co_dias'), n=val('co_n'), x=val('co_extra');
    const box=document.getElementById('resCO');
    if([s,l,d,n,x].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcCostoBrigada(s,l,d,n,x);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Costo por persona / día</span><span class="v">$${fmtNum(r.costoPersonaDia,0)}</span></div>
      <div class="result-row"><span class="k">Costo de la brigada / día</span><span class="v accent big">$${fmtNum(r.costoBrigadaDia,0)}</span></div>
    </div>`;
  });
}

const RENDERERS = { costo: renderCosto };
