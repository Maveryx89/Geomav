"use strict";
/* Herramienta «Rendimiento de Brigada»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcDiasNecesarios(areaTotal, rendimientoDiario){ return areaTotal/rendimientoDiario; }
function calcRendimientoBrigada(areaTotal, dias){ return areaTotal/dias; }
function renderRendimientoBrigada(){
  const body = `
  <div class="field-card">
    <h3>Área total y rendimiento → Días necesarios</h3>
    ${fieldRow('Área total a levantar (ha)','rb_area1',12)}
    ${fieldRow('Rendimiento diario de la brigada (ha/día)','rb_rend',2.5)}
    <button class="btn" id="btnRB1" type="button">Calcular</button>
    <div id="resRB1"></div>
  </div>
  <div class="field-card">
    <h3>Área total y días trabajados → Rendimiento</h3>
    ${fieldRow('Área total levantada (ha)','rb_area2',12)}
    ${fieldRow('Días trabajados','rb_dias',5)}
    <button class="btn" id="btnRB2" type="button">Calcular</button>
    <div id="resRB2"></div>
  </div>`;
  toolShell('rendimientoBrigada','Estima el plazo de un trabajo a partir del rendimiento de la brigada, o calcula el rendimiento real de un trabajo ya ejecutado — útil para presupuestar plazos junto con la Cotización de Trabajo.', body);
  document.getElementById('btnRB1').addEventListener('click', ()=>{
    const area=val('rb_area1'), rend=val('rb_rend'); const box=document.getElementById('resRB1');
    if(isNaN(area)||isNaN(rend)||rend<=0){ box.innerHTML=`<p class="err-msg">Completa ambos valores (rendimiento mayor a 0).</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Días necesarios</span><span class="v accent big">${fmtNum(calcDiasNecesarios(area,rend),1)} días</span></div></div>`;
  });
  document.getElementById('btnRB2').addEventListener('click', ()=>{
    const area=val('rb_area2'), dias=val('rb_dias'); const box=document.getElementById('resRB2');
    if(isNaN(area)||isNaN(dias)||dias<=0){ box.innerHTML=`<p class="err-msg">Completa ambos valores (días mayor a 0).</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Rendimiento</span><span class="v accent big">${fmtNum(calcRendimientoBrigada(area,dias),3)} ha/día</span></div></div>`;
  });
}

const RENDERERS = { rendimientoBrigada: renderRendimientoBrigada };
