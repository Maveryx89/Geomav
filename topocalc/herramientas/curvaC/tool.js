"use strict";
/* Herramienta «Curva Circular»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCurvaCircular(R, deltaDeg){
  const dr = toRad(deltaDeg);
  return {
    T: R*Math.tan(dr/2),
    Lc: R*dr,
    C: 2*R*Math.sin(dr/2),
    E: R*(1/Math.cos(dr/2) - 1),
    M: R*(1-Math.cos(dr/2))
  };
}
function renderCurvaC(){
  const MODES = CURVA_MODES, labels = CURVA_MODE_LABELS;
  const bodyFieldsHtml = (mode)=> curvaBodyFieldsHtml(mode, 'cc_');
  const body = `<div class="field-card">
    <div class="field-row"><label>Datos que conoces</label>${curvaModeSelectHtml('cc_mode','R_D')}</div>
    <div id="cc_fields">${bodyFieldsHtml('R_D')}</div>
    ${fieldRow('Progresiva del PI (opcional, m)','cc_pi','')}
    <button class="btn" id="btnCC" type="button">Calcular</button>
    <div id="resCC"></div>
  </div>`;
  toolShell('curvaC','Elementos de una curva circular simple. Ingresa el radio o la deflexión junto con cualquier otro elemento conocido (tangente, longitud de curva, cuerda larga, externa u ordenada media) y se completan todos los demás.', body, ['R','Δ','T','Lc','C','E','M','G','PC','PT','PI','O']);

  const modeSelect = document.getElementById('cc_mode');
  const fieldsDiv = document.getElementById('cc_fields');
  modeSelect.addEventListener('change', ()=>{ fieldsDiv.innerHTML = bodyFieldsHtml(modeSelect.value); });

  document.getElementById('btnCC').addEventListener('click', ()=>{
    const mode = modeSelect.value;
    const {v1, v2} = readCurvaModeInputs(mode, 'cc_');
    const box=document.getElementById('resCC');
    if(isNaN(v1)||isNaN(v2)){ box.innerHTML=`<p class="err-msg">Completa ambos valores.</p>`; return; }
    const {R,Ddeg} = resolveCurvaCircular(mode, v1, v2);
    if(!isFinite(R) || !isFinite(Ddeg) || R<=0 || Ddeg<=0 || Ddeg>=180){
      box.innerHTML=`<p class="err-msg">Esa combinación de valores no forma una curva válida — revisa los datos (por ejemplo, una cuerda no puede ser mayor que el diámetro).</p>`; return;
    }
    const r = calcCurvaCircular(R,Ddeg);
    if(![r.T,r.Lc,r.C,r.E,r.M].every(isFinite)){
      box.innerHTML=`<p class="err-msg">Esa combinación de valores no forma una curva válida — revisa los datos.</p>`; return;
    }
    const G = 2*toDeg(Math.asin(Math.min(1,10/R))); // grado de curvatura, cuerda de 20 m
    const piProg = val('cc_pi');
    let progHtml = '';
    if(!isNaN(piProg)){
      const pcProg = piProg - r.T, ptProg = pcProg + r.Lc;
      progHtml = `
      <div class="result-row"><span class="k">Progresiva PC</span><span class="v">${fmtNum(pcProg,3)}</span></div>
      <div class="result-row"><span class="k">Progresiva PT</span><span class="v">${fmtNum(ptProg,3)}</span></div>`;
    }
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Radio (R)</span><span class="v${mode[0]==='R'?'':' accent'}">${fmtNum(R,3)} m</span></div>
      <div class="result-row"><span class="k">Deflexión (Δ)</span><span class="v${mode[0]==='D'?'':' accent'}">${fmtAngle(Ddeg)}</span></div>
      <div class="result-row"><span class="k">Tangente (T)</span><span class="v">${fmtNum(r.T,3)} m</span></div>
      <div class="result-row"><span class="k">Longitud de curva (Lc)</span><span class="v">${fmtNum(r.Lc,3)} m</span></div>
      <div class="result-row"><span class="k">Cuerda larga (C)</span><span class="v">${fmtNum(r.C,3)} m</span></div>
      <div class="result-row"><span class="k">Externa (E)</span><span class="v">${fmtNum(r.E,3)} m</span></div>
      <div class="result-row"><span class="k">Ordenada media (M)</span><span class="v">${fmtNum(r.M,3)} m</span></div>
      <div class="result-row"><span class="k">Grado de curvatura (cuerda 20 m)</span><span class="v">${fmtAngle(G)}</span></div>
      ${progHtml}
      <div class="plot-wrap">${svgCurvaArco(R,Ddeg,null,null,null,r.T,Object.assign({D:Ddeg},r))}</div>
    </div>`;
  });
}

const RENDERERS = { curvaC: renderCurvaC };
