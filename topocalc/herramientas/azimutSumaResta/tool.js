"use strict";
/* Herramienta «Suma/Resta de Azimutes»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function renderAzimutSumaResta(){
  const body = `<div class="field-card">
    ${angleFieldHTML('az_base', 105.5, 'Azimut base')}
    <div class="field-row"><label for="az_op">Operación</label>
      <select id="az_op"><option value="mas" selected>Sumar ángulo</option><option value="menos">Restar ángulo</option></select></div>
    ${angleFieldHTML('az_delta', 45.25, 'Ángulo a sumar/restar')}
    <button class="btn" id="btnAZ" type="button">Calcular</button>
    <div id="resAZ"></div>
  </div>`;
  toolShell('azimutSumaResta','Suma o resta un ángulo a un azimut base, normalizando el resultado dentro de 0°–360° (útil para deflexiones o cambios de estación en poligonales).', body);
  document.getElementById('btnAZ').addEventListener('click', ()=>{
    const base=readAngleField('az_base'), delta=readAngleField('az_delta'), op=document.getElementById('az_op').value;
    const box=document.getElementById('resAZ');
    if(isNaN(base)||isNaN(delta)){ box.innerHTML=`<p class="err-msg">Completa el azimut base y el ángulo a operar.</p>`; return; }
    const resultado = normDeg(op==='mas' ? base+delta : base-delta);
    const rumbo = azToRumbo(resultado);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Azimut resultante</span><span class="v accent big">${fmtAngle(resultado)}</span></div>
      <div class="result-row"><span class="k">Rumbo equivalente</span><span class="v">${rumbo.ns} ${fmtAngle(rumbo.ang)} ${rumbo.ew}</span></div>
    </div>`;
  });
}

const RENDERERS = { azimutSumaResta: renderAzimutSumaResta };
