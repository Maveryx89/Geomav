"use strict";
/* Herramienta «Taludes y Pendientes»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcTalud(desnivel,distancia){
  return {
    pendientePct: (desnivel/distancia)*100,
    anguloDeg: toDeg(Math.atan(desnivel/distancia)),
    relacion: distancia/Math.abs(desnivel)
  };
}
function svgTalud(h, d, r, fuente){
  const K=svgKit(), up=h>=0, col={d:'var(--success)',h:'var(--danger)',t:'var(--accent)',a:'var(--blueprint)'};
  K.list([[{k:'Talud',c:col.t,v:`${fmtNum(r.pendientePct,2)} %`},{k:'α',c:col.a,v:fmtAngle(r.anguloDeg)},{k:'H:V',c:'var(--ink)',v:`${fmtNum(r.relacion,2)} : 1`},{k:'d',c:col.d,v:`${fmtNum(d,2)} m`},{k:'h',c:col.h,v:`${fmtNum(h,2)} m`}]],{perCol:3});
  const top=Math.max(K.listBottom+12,46), bot=fuente?160:172, W=190, ang=toRad(Math.min(Math.max(Math.abs(r.anguloDeg),8),60));
  const rise=Math.min(W*Math.tan(ang),bot-top-6), x0=(320-W)/2-6, x1=x0+W, s=up?-1:1;
  const y0=up?(top+bot)/2+rise/2:(top+bot)/2-rise/2, y1=y0+s*rise, A=[x0,y0], B=[x1,y1], C=[x1,y0];
  const real=Math.atan2(y1-y0,x1-x0)*180/Math.PI, k=4;
  K.line(...A,...C,col.d,{sw:1.1}); K.line(...C,...B,col.h,{sw:1.1,dash:'3 2'}); K.line(...A,...B,col.t,{sw:1.6});
  K.poly([[C[0]-k,C[1]],[C[0]-k,C[1]+s*k],[C[0],C[1]+s*k]],{stroke:'var(--ink-soft)',sw:0.6,obs:false});
  K.arc(A[0],A[1],24,0,real,col.a,{sw:0.9});
  [A,B].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  K.lineLabel(...A,...C,'d',4.5,col.d,{out:[0,-s],extras:[0,3,6]});
  K.lineLabel(...C,...B,'h',4.5,col.h,{out:[1,0],extras:[0,3,6]});
  K.lineLabel(...A,...B,'Talud',4.5,col.t,{at:0.5,out:[0,s],extras:[0,3,6]});
  const am=real/2*Math.PI/180; K.pointLabel('α',A[0]+24*Math.cos(am),A[1]+24*Math.sin(am),4.5,col.a,{dir:[Math.cos(am),Math.sin(am)],rmin:2,rmax:9});
  K.pointLabel('A',A[0],A[1],4.5,'var(--ink-soft)',{dir:[-1,-s*0.3],omit:false}); K.pointLabel('B',B[0],B[1],4.5,'var(--ink-soft)',{dir:[1,s*0.3],omit:false});
  if(fuente) K.add(svgFuente(fuente,320,190));
  return K.svg();
}
function renderTalud(){
  const body = `<div class="field-card">
    ${fieldRow('Desnivel (m)','tl_h',3.2)}
    ${fieldRow('Distancia horizontal (m)','tl_d',12.8)}
    <button class="btn" id="btnTL" type="button">Calcular</button>
    <div id="resTL"></div>
  </div>`;
  toolShell('talud','Pendiente porcentual, ángulo y relación horizontal:vertical de un talud.', body);
  document.getElementById('btnTL').addEventListener('click', ()=>{
    const h=val('tl_h'), d=val('tl_d');
    const box=document.getElementById('resTL');
    if(isNaN(h)||isNaN(d)){ box.innerHTML=`<p class="err-msg">Completa desnivel y distancia.</p>`; return; }
    const r = calcTalud(h,d);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Pendiente</span><span class="v accent big">${fmtNum(r.pendientePct,2)} %</span></div>
      <div class="result-row"><span class="k">Ángulo</span><span class="v">${fmtAngle(r.anguloDeg)}</span></div>
      <div class="result-row"><span class="k">Relación H:V</span><span class="v">${fmtNum(r.relacion,2)} : 1</span></div>
      <div class="plot-wrap">${svgTalud(h,d,r)}</div>
    </div>`;
  });
}

const RENDERERS = { talud: renderTalud };
