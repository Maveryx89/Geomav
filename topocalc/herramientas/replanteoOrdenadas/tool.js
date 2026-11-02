"use strict";
/* Herramienta «Replanteo por Ordenadas»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcReplanteoOrdenadas(R, deltaDeg, step){
  const deltaRad = toRad(deltaDeg);
  const xMax = R*Math.sin(deltaRad);
  const yMax = R*(1-Math.cos(deltaRad));
  const rows = [];
  let x = step;
  let truncated = false;
  while(x < xMax - 1e-9){
    if(rows.length >= 60){ truncated = true; break; }
    const y = R - Math.sqrt(Math.max(R*R - x*x, 0));
    const theta = Math.asin(Math.min(1, x/R));
    rows.push({x, y, arco: R*theta, esPT:false});
    x += step;
  }
  rows.push({x:xMax, y:yMax, arco:R*deltaRad, esPT:true});
  return {xMax, yMax, Lc:R*deltaRad, rows, truncated};
}
function svgReplanteoOrdenadas(R, deltaDeg, rows, xMax, yMax){
  const K=svgKit(), n=rows.length, many=n>8;
  K.list([[{k:'Lc',c:'var(--accent)',v:`${fmtNum(R*toRad(deltaDeg),3)} m`},{k:'x PT',c:'var(--blueprint)',v:`${fmtNum(xMax,3)} m`},{k:'y PT',c:'var(--success)',v:`${fmtNum(yMax,3)} m`}]]);
  const l=26, r=292, t=K.listBottom+12, b=150;
  const dr=toRad(Math.min(deltaDeg,179.9)), xExt=dr>Math.PI/2?R:xMax, yExt=Math.max(yMax,1e-3);
  const sx=(r-l)/Math.max(xExt,1e-3), sy=Math.min((b-t)/yExt, sx*4);
  const X=x=>l+x*sx, Y=y=>b-y*sy;
  const cp=[]; for(let i=0;i<=60;i++){ const a=dr*i/60; cp.push([X(R*Math.sin(a)),Y(R*(1-Math.cos(a)))]); }
  K.line(l,b,X(xExt),b,'var(--blueprint)');
  rows.forEach(q=>{ if(q.y>1e-9) K.line(X(q.x),b,X(q.x),Y(q.y),'var(--success)',{dash:q.esPT?null:'2 2',sw:0.7}); });
  K.poly(cp,{stroke:'var(--accent)',sw:1.4});
  const st=thinLabelStep(n,9);
  rows.forEach((q,i)=>{ if(!q.esPT) K.dot(X(q.x),Y(q.y),'var(--ink-soft)',1.8); });
  K.dot(l,b,'var(--ink-soft)',2); K.dot(X(xMax),Y(yMax),'var(--ink-soft)',2);
  K.pointLabel('PC',l,b,4.5,'var(--ink-soft)',{dir:[0,1],omit:false});
  K.pointLabel('PT',X(xMax),Y(yMax),4.5,'var(--ink-soft)',{dir:[1,-0.4],omit:false});
  rows.forEach((q,i)=>{ if(!q.esPT && i%st===0) K.pointLabel('P'+(i+1),X(q.x),Y(q.y),3,'var(--ink-soft)',{dir:[0,-1],rmin:3.2,rmax:9}); });
  K.lineLabel(l,b,X(xExt),b,'x',4.5,'var(--blueprint)',{out:[0,1],extras:[0,3,6]});
  K.lineLabel(X(xMax),b,X(xMax),Y(yMax),'y',4.5,'var(--success)',{out:[1,0],extras:[0,3,6]});
  const mid=cp[30]; K.pointLabel('Lc',mid[0],mid[1],4.5,'var(--accent)',{dir:[-0.35,-1],rmin:3,rmax:10});
  if(!many) rows.forEach(q=>{ if(!q.esPT && q.y*sy>14) K.lineLabel(X(q.x),b,X(q.x),Y(q.y),fmtNum(q.y,3),3,'var(--success)',{out:[1,0],extras:[0,3],margin:1}); });
  return K.svg();
}
function renderReplanteoOrdenadas(){
  const body = `<div class="field-card">
    ${fieldRow('Radio R (m)','ro_r',20)}
    ${angleFieldHTML('ro_delta', 42.5, 'Ángulo de deflexión total Δ')}
    ${fieldRow('Intervalo de avance en la tangente (m)','ro_step',0.5,{step:'0.05'})}
    <button class="btn" id="btnRO" type="button">Generar Tabla</button>
    <div id="resRO"></div>
  </div>`;
  toolShell('replanteoOrdenadas','Método con solo cinta métrica, sin teodolito: avanza sobre la línea tangente en tramos iguales desde el PC y mide, en cada punto, la distancia perpendicular (ordenada) hasta la curva.', body, ['R','PC','PT']);
  document.getElementById('btnRO').addEventListener('click', ()=>{
    const R=val('ro_r'), d=readAngleField('ro_delta'), step=val('ro_step');
    const box=document.getElementById('resRO');
    if(isNaN(R)||isNaN(d)||isNaN(step)||R<=0||d<=0||step<=0){ box.innerHTML=`<p class="err-msg">Completa radio, ángulo e intervalo (mayores a 0).</p>`; return; }
    if(step>=R){ box.innerHTML=`<p class="err-msg">El intervalo debe ser menor que el radio.</p>`; return; }
    const {xMax,yMax,Lc,rows,truncated} = calcReplanteoOrdenadas(R,d,step);
    let trs='';
    rows.forEach((row,i)=>{
      trs += `<tr><td>${row.esPT?'PT':'P'+(i+1)}</td><td>${fmtNum(row.x,3)}</td><td>${fmtNum(row.y,3)}</td></tr>`;
    });
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Longitud de curva (Lc)</span><span class="v accent big">${fmtNum(Lc,3)} m</span></div>
      <div class="result-row"><span class="k">Tangente en PT (x, y)</span><span class="v">${fmtNum(xMax,3)} m, ${fmtNum(yMax,3)} m</span></div>
      ${truncated?`<p class="err-msg" style="margin-top:6px;">Tabla acotada a 60 puntos — aumenta el intervalo para cubrir toda la curva.</p>`:''}
      <div class="table-wrap" style="margin-top:10px;"><table class="data-table"><thead><tr><th>Punto</th><th>x (tangente)</th><th>y (ordenada)</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgReplanteoOrdenadas(R,d,rows,xMax,yMax)}</div>
    </div>`;
  });
}

const RENDERERS = { replanteoOrdenadas: renderReplanteoOrdenadas };
