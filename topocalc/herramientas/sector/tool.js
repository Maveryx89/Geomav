"use strict";
/* Herramienta «Sector Circular»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcAreaSector(R, deltaDeg){
  const dr = toRad(deltaDeg);
  return {area: (dr/2)*R*R, arco: R*dr};
}
function svgSectorCircular(deltaDeg, Rval){
  const K=svgKit(), d=Math.min(Math.max(deltaDeg,2),359.9), rad=a=>a*Math.PI/180;
  const R=Rval!==undefined?Rval:1, rows=[];
  if(Rval!==undefined) rows.push({k:'R',c:'var(--blueprint)',v:`${fmtNum(R,2)} m`});
  rows.push({k:'Δ',c:'var(--ink)',v:fmtAngle(d)});
  if(Rval!==undefined){ rows.push({k:'Arco',c:'var(--success)',v:`${fmtNum(R*rad(d),3)} m`}); rows.push({k:'Área',c:'var(--accent)',v:`${fmtNum(R*R*rad(d)/2,3)} m²`}); }
  K.list([rows]);
  const wp=[[0,0]], n=Math.max(12,Math.ceil(d/3)); for(let i=0;i<=n;i++){ const a=rad(90+d/2-d*i/n); wp.push([Math.cos(a),Math.sin(a)]); }
  const fit=K.fit(wp,{l:70,r:290,t:Math.max(K.listBottom+10,26),b:166});
  const O=[fit.X(0),fit.Y(0)], Rs=fit.sc, P=a=>[O[0]+Rs*Math.cos(rad(a)),O[1]-Rs*Math.sin(rad(a))];
  const A=P(90+d/2), B=P(90-d/2);
  K.poly(wp.map(q=>[fit.X(q[0]),fit.Y(q[1])]),{close:true,fill:'var(--accent)',fo:0.16,obs:false});
  K.line(...O,...A,'var(--blueprint)',{sw:1}); K.line(...O,...B,'var(--blueprint)',{sw:1});
  K.arc(O[0],O[1],Rs,-(90+d/2),-(90-d/2),'var(--success)',{sw:1.6});
  const rd=Math.min(Rs*0.22,14); K.arc(O[0],O[1],rd,-(90+d/2),-(90-d/2),'var(--ink)',{sw:0.8});
  [O,A,B].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  K.pointLabel('O',O[0],O[1],4.5,'var(--ink-soft)',{dir:[0,1],full:d>180,omit:false});
  K.pointLabel('A',A[0],A[1],4.5,'var(--ink-soft)',{dir:[Math.cos(rad(90+d/2)),-Math.sin(rad(90+d/2))],omit:false});
  K.pointLabel('B',B[0],B[1],4.5,'var(--ink-soft)',{dir:[Math.cos(rad(90-d/2)),-Math.sin(rad(90-d/2))],omit:false});
  K.lineLabel(...O,...A,'R',4.5,'var(--blueprint)',{out:[-1,0],extras:[0,3,6]});
  K.lineLabel(...O,...B,'R',4.5,'var(--blueprint)',{out:[1,0],extras:[0,3,6]});
  K.pointLabel('Arco',O[0],O[1]-Rs,4.5,'var(--success)',{dir:[0,-1],rmin:3,rmax:10});
  K.pointLabel('Δ',O[0],O[1]-rd,4.5,'var(--ink)',{dir:[0,-1],rmin:2,rmax:9});
  const al=rad(d/2), cd=d>=359?0:(2/3)*Rs*Math.sin(al)/al;
  K.near('Área',O[0],O[1]-Math.max(cd,rd+8),4.5,'var(--accent)',{rmax:16});
  return K.svg();
}
function renderSector(){
  const body = `<div class="field-card">
    ${fieldRow('Radio R (m)','se_r',20)}
    ${angleFieldHTML('se_delta', 75, 'Ángulo central Δ')}
    <button class="btn" id="btnSE" type="button">Calcular</button>
    <div id="resSE"></div>
  </div>`;
  toolShell('sector','Área y longitud de arco de un sector circular, útil para deslindes con arcos o áreas de rotondas.', body, ['R','Δ']);
  document.getElementById('btnSE').addEventListener('click', ()=>{
    const R=val('se_r'), d=readAngleField('se_delta'); const box=document.getElementById('resSE');
    if(isNaN(R)||isNaN(d)){ box.innerHTML=`<p class="err-msg">Completa radio y ángulo.</p>`; return; }
    const r = calcAreaSector(R,d);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Área</span><span class="v accent big">${fmtNum(r.area,3)} m²</span></div>
      <div class="result-row"><span class="k">Longitud de arco</span><span class="v">${fmtNum(r.arco,3)} m</span></div>
      <div class="plot-wrap">${svgSectorCircular(d, R)}</div>
    </div>`;
  });
}

const RENDERERS = { sector: renderSector };
