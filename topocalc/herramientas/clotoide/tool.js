"use strict";
/* Herramienta «Curva de Transición (Clotoide)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function renderClotoide(){
  const body = `<div class="field-card">
    ${fieldRow('Radio de la curva circular R (m)','cl_r',20)}
    ${fieldRow('Longitud de la espiral Ls (m)','cl_ls',15)}
    <button class="btn" id="btnCL" type="button">Calcular</button>
    <div id="resCL"></div>
  </div>`;
  toolShell('clotoide','Curva de transición (clotoide / espiral de Euler) entre una recta y una curva circular de radio R. Cálculo por serie truncada, válido para el rango habitual de curvas viales.', body, ['R','A','τ','EC','Xc','Yc','p','k','Tl','Tc']);
  document.getElementById('btnCL').addEventListener('click', ()=>{
    const R=val('cl_r'), Ls=val('cl_ls'); const box=document.getElementById('resCL');
    if(isNaN(R)||isNaN(Ls)||R<=0||Ls<=0){ box.innerHTML=`<p class="err-msg">Ingresa radio y longitud de espiral (mayores a 0).</p>`; return; }
    if(Ls>=2*R){ box.innerHTML=`<p class="err-msg">Ls es demasiado grande respecto a R para esta aproximación (mantén Ls &lt; 2R).</p>`; return; }
    const r = calcClotoide(R,Ls);
    let trs='';
    for(let i=1;i<=6;i++){ const l=Ls*i/6; const p=clotoidePunto(R,Ls,l); trs += `<tr><td>${fmtNum(l,1)}</td><td>${fmtNum(p.x,3)}</td><td>${fmtNum(p.y,3)}</td></tr>`; }
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Parámetro de la clotoide (A)</span><span class="v accent big">${fmtNum(r.A,3)}</span></div>
      <div class="result-row"><span class="k">Ángulo de la espiral (τ)</span><span class="v">${fmtAngle(r.tauDeg)}</span></div>
      <div class="result-row"><span class="k">Coordenadas del EC (Xc, Yc)</span><span class="v">${fmtNum(r.Xc,3)} m, ${fmtNum(r.Yc,3)} m</span></div>
      <div class="result-row"><span class="k">Retranqueo (p)</span><span class="v">${fmtNum(r.p,4)} m</span></div>
      <div class="result-row"><span class="k">Abscisa del centro desplazado (k)</span><span class="v">${fmtNum(r.k,3)} m</span></div>
      <div class="result-row"><span class="k">Tangente larga / corta</span><span class="v">${fmtNum(r.Tl,3)} m / ${fmtNum(r.Tc,3)} m</span></div>
      <div class="table-wrap" style="margin-top:10px;"><table class="data-table"><thead><tr><th>l (m)</th><th>x (m)</th><th>y (m)</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgClotoide(R,Ls)}</div>
    </div>`;
  });
}

const RENDERERS = { clotoide: renderClotoide };
