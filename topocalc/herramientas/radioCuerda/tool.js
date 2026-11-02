"use strict";
/* Herramienta «Radio y Cuerda»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcRadioPorFlecha(C,f){ return (C*C)/(8*f) + f/2; }
function calcRadioPorCuerdaDelta(C,deltaDeg){ return C/(2*Math.sin(toRad(deltaDeg/2))); }
function renderRadioCuerda(){
  const body = `
  <div class="field-card">
    <h3>Desde cuerda y flecha (sagita)</h3>
    ${fieldRow('Cuerda C (m)','rc_c1',99.99)}
    ${fieldRow('Flecha f (m)','rc_f',13.397)}
    <button class="btn" id="btnRC1" type="button">Calcular Radio</button>
    <div id="resRC1"></div>
  </div>
  <div class="field-card">
    <h3>Desde cuerda y ángulo de deflexión</h3>
    ${fieldRow('Cuerda C (m)','rc_c2',99.99)}
    ${angleFieldHTML('rc_delta', 60, 'Ángulo de deflexión Δ')}
    <button class="btn" id="btnRC2" type="button">Calcular Radio</button>
    <div id="resRC2"></div>
  </div>`;
  toolShell('radioCuerda','Obtiene el radio de una curva circular a partir de mediciones de terreno: la cuerda con su flecha (sagita), o la cuerda con el ángulo de deflexión.', body, ['R','C','Δ']);
  document.getElementById('btnRC1').addEventListener('click', ()=>{
    const C=val('rc_c1'), f=val('rc_f'); const box=document.getElementById('resRC1');
    if(isNaN(C)||isNaN(f)||f<=0){ box.innerHTML=`<p class="err-msg">Completa cuerda y flecha (flecha &gt; 0).</p>`; return; }
    const R = calcRadioPorFlecha(C,f);
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Radio (R)</span><span class="v accent big">${fmtNum(R,3)} m</span></div></div>`;
  });
  document.getElementById('btnRC2').addEventListener('click', ()=>{
    const C=val('rc_c2'), d=readAngleField('rc_delta'); const box=document.getElementById('resRC2');
    if(isNaN(C)||isNaN(d)){ box.innerHTML=`<p class="err-msg">Completa cuerda y ángulo.</p>`; return; }
    const R = calcRadioPorCuerdaDelta(C,d);
    const Tval = R*Math.tan(toRad(d/2));
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Radio (R)</span><span class="v accent big">${fmtNum(R,3)} m</span></div>
    <div class="plot-wrap">${svgCurvaArco(R,d,null,null,null,undefined,{C:C,D:d,star:'R'})}</div></div>`;
  });
}

const RENDERERS = { radioCuerda: renderRadioCuerda };
