"use strict";
/* Herramienta «Replanteo por Cuerda»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcReplanteoCuerda(R, deltaDeg, step){
  const deltaRad = toRad(deltaDeg);
  const Lchord = 2*R*Math.sin(deltaRad/2);
  const d = R*Math.cos(deltaRad/2);
  const half = Lchord/2;
  const rows = [];
  let x = 0;
  let truncated = false;
  while(x <= Lchord + 1e-9){
    if(rows.length >= 61){ truncated = true; break; }
    const dx = x - half;
    const under = R*R - dx*dx;
    const y = under>0 ? Math.sqrt(under) - d : 0;
    rows.push({x, y: Math.max(y,0), esPC: x<1e-9, esPT: Math.abs(x-Lchord)<1e-9});
    x += step;
  }
  if(rows.length && Math.abs(rows[rows.length-1].x - Lchord) > 1e-9 && !truncated){
    rows.push({x:Lchord, y:0, esPC:false, esPT:true});
  }
  const M = R - d;
  return {Lchord, d, M, rows, truncated};
}
function svgReplanteoCuerda(R, deltaDeg, rows, Lchord, M){
  const K=svgKit(), n=rows.length, many=n>8;
  K.list([[{k:'C',c:'var(--accent)',v:`${fmtNum(Lchord,3)} m`},{k:'M',c:'var(--danger)',v:`${fmtNum(M,3)} m`}]]);
  const l=26, r=292, t=K.listBottom+12, b=150, half=Lchord/2, dd=R-M;
  const sx=(r-l)/Math.max(Lchord,1e-3), sy=Math.min((b-t)/Math.max(M,1e-3), sx*4);
  const X=x=>l+x*sx, Y=y=>b-y*sy;
  const cp=[], hd=toRad(Math.min(deltaDeg,179.9))/2; for(let i=0;i<=60;i++){ const a=-hd+2*hd*i/60; cp.push([X(half+R*Math.sin(a)),Y(Math.max(R*Math.cos(a)-dd,0))]); }
  K.line(l,b,X(Lchord),b,'var(--accent)');
  rows.forEach(q=>{ if(q.y>1e-9) K.line(X(q.x),b,X(q.x),Y(q.y),'var(--success)',{dash:(q.esPC||q.esPT)?null:'2 2',sw:0.7}); });
  K.poly(cp,{stroke:'var(--blueprint)',sw:1.4});
  K.line(X(half),b,X(half),Y(M),'var(--danger)',{sw:0.9});
  const st=thinLabelStep(n,9);
  rows.forEach(q=>{ if(!q.esPC&&!q.esPT) K.dot(X(q.x),Y(q.y),'var(--ink-soft)',1.8); });
  K.dot(X(half),Y(M),'var(--danger)',1.8);
  K.dot(l,b,'var(--ink-soft)',2); K.dot(X(Lchord),b,'var(--ink-soft)',2);
  K.pointLabel('PC',l,b,4.5,'var(--ink-soft)',{dir:[-0.6,1],omit:false});
  K.pointLabel('PT',X(Lchord),b,4.5,'var(--ink-soft)',{dir:[0.6,1],omit:false});
  rows.forEach((q,i)=>{ if(!q.esPC&&!q.esPT&&i%st===0) K.pointLabel('P'+i,X(q.x),Y(q.y),3,'var(--ink-soft)',{dir:[0,-1],rmin:3.2,rmax:9}); });
  K.lineLabel(l,b,X(Lchord),b,'C',4.5,'var(--accent)',{out:[0,1],extras:[0,3,6]});
  K.lineLabel(X(half),b,X(half),Y(M),'M',4.5,'var(--danger)',{out:[1,0],extras:[0,3,6]});
  if(!many) rows.forEach(q=>{ if(!q.esPC&&!q.esPT&&q.y*sy>14&&Math.abs(q.x-half)>1e-9) K.lineLabel(X(q.x),b,X(q.x),Y(q.y),fmtNum(q.y,3),3,'var(--success)',{out:[1,0],extras:[0,3],margin:1}); });
  return K.svg();
}
function renderReplanteoCuerda(){
  const body = `<div class="field-card">
    ${fieldRow('Radio R (m)','rc_r',20)}
    ${angleFieldHTML('rc_delta', 42.5, 'Ángulo de deflexión total Δ')}
    ${fieldRow('Intervalo de avance en la cuerda (m)','rc_step',0.5,{step:'0.05'})}
    <button class="btn" id="btnRC" type="button">Generar Tabla</button>
    <div id="resRC"></div>
  </div>`;
  toolShell('replanteoCuerda','Método con solo cinta métrica, por el interior de la curva: tiendes la cuerda entre PC y PT como línea base y avanzas sobre ella en tramos iguales, midiendo en cada punto la ordenada perpendicular a la cuerda hasta la curva.', body, ['R','PC','PT','C']);
  document.getElementById('btnRC').addEventListener('click', ()=>{
    const R=val('rc_r'), d=readAngleField('rc_delta'), step=val('rc_step');
    const box=document.getElementById('resRC');
    if(isNaN(R)||isNaN(d)||isNaN(step)||R<=0||d<=0||step<=0){ box.innerHTML=`<p class="err-msg">Completa radio, ángulo e intervalo (mayores a 0).</p>`; return; }
    if(d>=180){ box.innerHTML=`<p class="err-msg">El ángulo de deflexión debe ser menor a 180°.</p>`; return; }
    const {Lchord, M, rows, truncated} = calcReplanteoCuerda(R,d,step);
    let trs='';
    rows.forEach((row,i)=>{
      const label = row.esPC?'PC':(row.esPT?'PT':'P'+i);
      trs += `<tr><td>${label}</td><td>${fmtNum(row.x,3)}</td><td>${fmtNum(row.y,3)}</td></tr>`;
    });
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Cuerda PC–PT</span><span class="v accent big">${fmtNum(Lchord,3)} m</span></div>
      <div class="result-row"><span class="k">Ordenada media (punto medio)</span><span class="v">${fmtNum(M,3)} m</span></div>
      ${truncated?`<p class="err-msg" style="margin-top:6px;">Tabla acotada — aumenta el intervalo para cubrir toda la cuerda.</p>`:''}
      <div class="table-wrap" style="margin-top:10px;"><table class="data-table"><thead><tr><th>Punto</th><th>x (en la cuerda)</th><th>y (ordenada)</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgReplanteoCuerda(R,d,rows,Lchord,M)}</div>
    </div>`;
  });
}

const RENDERERS = { replanteoCuerda: renderReplanteoCuerda };
