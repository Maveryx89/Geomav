"use strict";
/* Herramienta «Cota por Progresiva y Pendiente»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCotaProgresiva(Kini,Cini,S,Keval){
  const D = Keval-Kini;
  const dH = D*(S/100);
  const Ceval = Cini+dH;
  return {D, dH, Ceval};
}
function svgCotaProgresiva(Kini,Cini,S,Keval,r){
  const K=svgKit(), col={S:'var(--blueprint)',D:'var(--success)',dH:'var(--danger)',C:'var(--accent)'};
  K.list([[{k:'Ceval',c:col.C,v:`${fmtNum(r.Ceval,3)} m`},{k:'Cini',c:'var(--ink)',v:`${fmtNum(Cini,3)} m`},{k:'S',c:col.S,v:`${fmtNum(S,2)} %`},{k:'D',c:col.D,v:`${fmtNum(r.D,2)} m`},{k:'ΔH',c:col.dH,v:`${fmtNum(r.dH,3)} m`},{k:'Kini',c:'var(--ink-soft)',v:`${fmtNum(Kini,2)} m`},{k:'Keval',c:'var(--ink-soft)',v:`${fmtNum(Keval,2)} m`}]],{perCol:4});
  const flat=Math.abs(S)<1e-9, up=S>=0, s=up?-1:1, top=Math.max(K.listBottom+12,48), bot=168, W=190;
  const ang=toRad(Math.min(Math.max(Math.abs(Math.atan(S/100))*180/Math.PI*6,7),32)), rise=flat?0:Math.min(W*Math.tan(ang),bot-top-8);
  const x0=(320-W)/2-6, x1=x0+W, y0=up?(top+bot)/2+rise/2:(top+bot)/2-rise/2, y1=y0+s*rise, A=[x0,y0], B=[x1,y1], C=[x1,y0];
  K.line(...A,...C,col.D,{sw:1.1,dash:'3 2'}); if(!flat) K.line(...C,...B,col.dH,{sw:1.1}); K.line(...A,...B,col.S,{sw:1.6});
  K.dot(...A,'var(--ink-soft)',2); K.dot(...B,col.C,2.6);
  K.lineLabel(...A,...C,'D',4.5,col.D,{out:[0,-s],extras:[0,3,6]});
  if(!flat) K.lineLabel(...C,...B,'ΔH',4.5,col.dH,{out:[1,0],extras:[0,3,6]});
  K.lineLabel(...A,...B,'S',4.5,col.S,{at:0.5,out:[0,s],extras:[0,3,6]});
  K.pointLabel('Kini',A[0],A[1],4.5,'var(--ink-soft)',{dir:[-1,-s*0.4],omit:false,rmin:4.5,rmax:12});
  K.pointLabel('Keval',B[0],B[1],4.5,col.C,{dir:[1,s*0.4],omit:false,rmin:4.5,rmax:12});
  return K.svg();
}
function renderCotaProgresiva(){
  const body = `<div class="field-card">
    ${fieldRow('Progresiva de origen, Kini (m)','cp_kini',0)}
    ${fieldRow('Cota de origen, Cini (m)','cp_cini',100.000)}
    ${fieldRow('Pendiente del tramo, S (%)','cp_s',-2.50)}
    ${fieldRow('Progresiva a evaluar, Keval (m)','cp_keval',45.00)}
    <button class="btn" id="btnCP" type="button">Calcular</button>
    <div id="resCP"></div>
  </div>`;
  toolShell('cotaProgresiva','Cota teórica de rasante en cualquier progresiva de un tramo con pendiente constante, a partir de una cota y progresiva de origen conocidas.', body, ['K']);
  document.getElementById('btnCP').addEventListener('click', ()=>{
    const Kini=val('cp_kini'), Cini=val('cp_cini'), S=val('cp_s'), Keval=val('cp_keval');
    const box=document.getElementById('resCP');
    if([Kini,Cini,S,Keval].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa progresivas, cota y pendiente.</p>`; return; }
    const r = calcCotaProgresiva(Kini,Cini,S,Keval);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia parcial (D)</span><span class="v">${fmtNum(r.D,2)} m</span></div>
      <div class="result-row"><span class="k">Desnivel (ΔH)</span><span class="v">${fmtNum(r.dH,3)} m</span></div>
      <div class="result-row"><span class="k">Cota en Keval</span><span class="v accent big">${fmtNum(r.Ceval,3)} m</span></div>
      <div class="plot-wrap">${svgCotaProgresiva(Kini,Cini,S,Keval,r)}</div>
    </div>`;
  });
}

const RENDERERS = { cotaProgresiva: renderCotaProgresiva };
