"use strict";
/* Herramienta «Chequeo de Teodolito (2 Caras)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function renderChequeoTeodolito(){
  const body = `<div class="field-card">
    <h3>Cara Izquierda (CI / directa)</h3>
    ${angleFieldHTML('ct_hzfl', 84.3025, 'Lectura horizontal a la mira, CI')}
    ${angleFieldHTML('ct_zfl', 89.5514, 'Lectura vertical (cenital) a la mira, CI')}
    <h3 style="margin-top:14px;">Cara Derecha (CD / inversa)</h3>
    ${angleFieldHTML('ct_hzfr', 264.3115, 'Lectura horizontal a la mira, CD')}
    ${angleFieldHTML('ct_zfr', 270.4450, 'Lectura vertical (cenital) a la mira, CD')}
    <button class="btn" id="btnCT" type="button">Calcular</button>
    <div id="resCT"></div>
  </div>${vrDatosHtml('chequeoTeodolito')}`;
  toolShell('chequeoTeodolito','Chequeo por dos caras (CI/CD) apuntando al mismo punto: el error de colimación horizontal debe ser cercano a 0 (CD debería ser CI+180°) y el error de índice vertical también cercano a 0 (CI+CD debería sumar 360°).', body, ['CI','CD','ZI','ZD','C','i']);
  vrWire();
  document.getElementById('btnCT').addEventListener('click', ()=>{
    const hzFL=readAngleField('ct_hzfl'), hzFR=readAngleField('ct_hzfr'), zFL=readAngleField('ct_zfl'), zFR=readAngleField('ct_zfr');
    const box=document.getElementById('resCT');
    if([hzFL,hzFR,zFL,zFR].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las cuatro lecturas de ambas caras.</p>`; return; }
    const r = calcDosCaras(hzFL,hzFR,zFL,zFR);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Error de colimación horizontal (C)</span><span class="v accent big">${fmtNum(r.Csec,1)}"</span></div>
      <div class="result-row"><span class="k">Dirección horizontal corregida</span><span class="v">${fmtAngle(r.hzMean)}</span></div>
      <div class="result-row"><span class="k">Diagnóstico colimación</span><span class="v" style="color:${r.okC?'inherit':'var(--accent)'}">${r.okC?'Dentro de tolerancia (≤20")':'Fuera de tolerancia, requiere ajuste'}</span></div>
      <div class="result-row"><span class="k">Error de índice vertical (i)</span><span class="v accent big">${fmtNum(r.isec,1)}"</span></div>
      <div class="result-row"><span class="k">Ángulo cenital corregido</span><span class="v">${fmtAngle(r.zMean)}</span></div>
      <div class="result-row"><span class="k">Diagnóstico índice vertical</span><span class="v" style="color:${r.okI?'inherit':'var(--accent)'}">${r.okI?'Dentro de tolerancia (≤20")':'Fuera de tolerancia, requiere ajuste'}</span></div>
      <div class="plot-wrap">${svgTeodolitoDosCaras(hzFL,hzFR,zFL,zFR,r)}</div>
    </div>`;
  });
}

const RENDERERS = { chequeoTeodolito: renderChequeoTeodolito };
