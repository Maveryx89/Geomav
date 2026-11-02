"use strict";
/* Herramienta «Curva de Reversa (S)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCurvaReversa(R1, d1Deg, R2, d2Deg, tanIntermedia){
  const t1r=toRad(d1Deg/2), t2r=toRad(d2Deg/2);
  const T1=R1*Math.tan(t1r), T2=R2*Math.tan(t2r);
  const Lc1=R1*toRad(d1Deg), Lc2=R2*toRad(d2Deg);
  const C1=2*R1*Math.sin(t1r), C2=2*R2*Math.sin(t2r);
  const dt = tanIntermedia||0;
  return {T1,T2,Lc1,Lc2,C1,C2, distPI1PI2: T1+dt+T2, LcTotal:Lc1+Lc2};
}
function renderCurvaReversa(){
  const body = `<div class="field-card">
    <h3>Primer tramo</h3>
    <div class="field-inline2">
      ${fieldRow('Radio R1 (m)','cr_r1',20)}
      ${angleFieldHTML('cr_d1', 25, 'Deflexión Δ1')}
    </div>
    <h3>Segundo tramo (sentido contrario)</h3>
    <div class="field-inline2">
      ${fieldRow('Radio R2 (m)','cr_r2',20)}
      ${angleFieldHTML('cr_d2', 25, 'Deflexión Δ2')}
    </div>
    ${fieldRow('Tangente intermedia entre curvas (m, 0 si es directa)','cr_dt',0)}
    <button class="btn" id="btnCR" type="button">Calcular</button>
    <div id="resCR"></div>
  </div>`;
  toolShell('curvaReversa','Curva en S: dos curvas circulares de sentido contrario, tangentes en el punto PRC (o separadas por un tramo recto intermedio).', body, ['R','T','Lc','C','PRC','PI']);
  document.getElementById('btnCR').addEventListener('click', ()=>{
    const R1=val('cr_r1'), d1=readAngleField('cr_d1'), R2=val('cr_r2'), d2=readAngleField('cr_d2'), dt=val('cr_dt');
    const box=document.getElementById('resCR');
    if([R1,d1,R2,d2].some(isNaN) || R1<=0 || R2<=0 || d1<=0 || d2<=0 || isNaN(dt) || dt<0){ box.innerHTML=`<p class="err-msg">Completa ambos radios, ángulos y la tangente intermedia (≥0).</p>`; return; }
    const r = calcCurvaReversa(R1,d1,R2,d2,dt);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Tramo</th><th>R</th><th>T</th><th>Lc</th><th>Cuerda</th></tr></thead><tbody>
        <tr><td>1</td><td>${fmtNum(R1,2)}</td><td>${fmtNum(r.T1,3)}</td><td>${fmtNum(r.Lc1,3)}</td><td>${fmtNum(r.C1,3)}</td></tr>
        <tr><td>2</td><td>${fmtNum(R2,2)}</td><td>${fmtNum(r.T2,3)}</td><td>${fmtNum(r.Lc2,3)}</td><td>${fmtNum(r.C2,3)}</td></tr>
      </tbody></table></div>
      <div class="result-row" style="margin-top:6px;"><span class="k">Distancia entre PI1 y PI2</span><span class="v">${fmtNum(r.distPI1PI2,3)} m</span></div>
      <div class="result-row"><span class="k">Longitud total de curvas</span><span class="v accent big">${fmtNum(r.LcTotal,3)} m</span></div>
      <div class="plot-wrap">${svgCurvaDoble(R1,d1,R2,d2,true,dt)}</div>
    </div>`;
  });
}

const RENDERERS = { curvaReversa: renderCurvaReversa };
