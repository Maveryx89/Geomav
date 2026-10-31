"use strict";
/* Herramienta «Curva Circular Compuesta»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCurvaCompuesta(R1, d1Deg, R2, d2Deg){
  const t1r=toRad(d1Deg/2), t2r=toRad(d2Deg/2);
  const T1=R1*Math.tan(t1r), T2=R2*Math.tan(t2r);
  const Lc1=R1*toRad(d1Deg), Lc2=R2*toRad(d2Deg);
  const C1=2*R1*Math.sin(t1r), C2=2*R2*Math.sin(t2r);
  return {T1,T2,Lc1,Lc2,C1,C2, deltaTotal:d1Deg+d2Deg, LcTotal:Lc1+Lc2};
}
function renderCurvaCompuesta(){
  const body = `<div class="field-card">
    <h3>Primer tramo</h3>
    <div class="field-inline2">
      ${fieldRow('Radio R1 (m)','cc_r1',20)}
      ${angleFieldHTML('cc_d1', 30, 'Deflexión Δ1')}
    </div>
    <h3>Segundo tramo</h3>
    <div class="field-inline2">
      ${fieldRow('Radio R2 (m)','cc_r2',20)}
      ${angleFieldHTML('cc_d2', 40, 'Deflexión Δ2')}
    </div>
    <button class="btn" id="btnCC" type="button">Calcular</button>
    <div id="resCC"></div>
  </div>`;
  toolShell('curvaCompuesta','Dos curvas circulares de radios distintos, tangentes entre sí en el punto PCC, curvando hacia el mismo lado.', body, ['R','T','Lc','C','PCC']);
  document.getElementById('btnCC').addEventListener('click', ()=>{
    const R1=val('cc_r1'), d1=readAngleField('cc_d1'), R2=val('cc_r2'), d2=readAngleField('cc_d2');
    const box=document.getElementById('resCC');
    if([R1,d1,R2,d2].some(isNaN) || R1<=0 || R2<=0 || d1<=0 || d2<=0){ box.innerHTML=`<p class="err-msg">Completa ambos radios y ángulos (mayores a 0).</p>`; return; }
    const r = calcCurvaCompuesta(R1,d1,R2,d2);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Deflexión total</span><span class="v accent big">${fmtAngle(r.deltaTotal)}</span></div>
      <div class="table-wrap" style="margin-top:8px;"><table class="data-table"><thead><tr><th>Tramo</th><th>R</th><th>T</th><th>Lc</th><th>Cuerda</th></tr></thead><tbody>
        <tr><td>1</td><td>${fmtNum(R1,2)}</td><td>${fmtNum(r.T1,3)}</td><td>${fmtNum(r.Lc1,3)}</td><td>${fmtNum(r.C1,3)}</td></tr>
        <tr><td>2</td><td>${fmtNum(R2,2)}</td><td>${fmtNum(r.T2,3)}</td><td>${fmtNum(r.Lc2,3)}</td><td>${fmtNum(r.C2,3)}</td></tr>
      </tbody></table></div>
      <div class="result-row" style="margin-top:6px;"><span class="k">Longitud total de curva</span><span class="v">${fmtNum(r.LcTotal,3)} m</span></div>
      <div class="plot-wrap">${svgCurvaDoble(R1,d1,R2,d2,false)}</div>
    </div>`;
  });
}

const RENDERERS = { curvaCompuesta: renderCurvaCompuesta };
