"use strict";
/* Herramienta «Progresiva y Offset desde un Eje»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcProgresivaOffset(n1,e1,k1,n2,e2,np,ep){
  const dx=e2-e1, dn=n2-n1;
  const len2=dx*dx+dn*dn, len=Math.sqrt(len2);
  const t=((ep-e1)*dx+(np-n1)*dn)/len2;
  const footE=e1+t*dx, footN=n1+t*dn;
  const distDesdeA=t*len;
  const Kp=k1+distDesdeA;
  const cross=dx*(np-n1)-dn*(ep-e1);
  const offset=-(cross/len); // positivo = derecha, en el sentido de avance P1→P2
  return {footE, footN, Kp, offset, lado: offset>=0?'derecha':'izquierda', az: normDeg(toDeg(Math.atan2(dx,dn)))};
}
function svgProgresivaOffset(n1,e1,k1,n2,e2,np,ep,r){
  const K=svgKit(), len0=Math.hypot(e2-e1,n2-n1);
  K.north();
  K.list([[
    {k:'K',c:'var(--success)',v:`${fmtNum(r.Kp,2)} m`},
    {k:'Off',c:'var(--accent)',v:`${fmtNum(Math.abs(r.offset),3)} m`},
    {k:'Lado',c:'var(--ink)',v:r.lado},
    {k:'Az eje',c:'var(--blueprint)',v:fmtAngle(r.az)},
    {k:'K P1',c:'var(--ink)',v:`${fmtNum(k1,2)} m`},
    {k:'P1→P2',c:'var(--blueprint)',v:`${fmtNum(len0,2)} m`}]]);
  const box={l:62,r:268,t:Math.max(54,K.listBottom+8),b:164};
  const fit=K.fit([[e1,n1],[e2,n2],[ep,np],[r.footE,r.footN]],box);
  const A=[fit.X(e1),fit.Y(n1)], B=[fit.X(e2),fit.Y(n2)], P=[fit.X(ep),fit.Y(np)], F=[fit.X(r.footE),fit.Y(r.footN)];
  const dx=B[0]-A[0], dy=B[1]-A[1], len=Math.hypot(dx,dy)||1, ux=dx/len, uy=dy/len;
  const proj=q=>(q[0]-A[0])*ux+(q[1]-A[1])*uy, pf=proj(F);
  const tmin=Math.min(0,len,pf)-12, tmax=Math.max(0,len,pf)+12, at=t=>[A[0]+ux*t,A[1]+uy*t];
  if(tmin<0) K.line(...at(tmin),...at(0),'var(--blueprint)',{op:0.45,dash:'1.6 1.6'});
  if(tmax>len) K.line(...at(len),...at(tmax),'var(--blueprint)',{op:0.45,dash:'1.6 1.6'});
  K.line(...A,...B,'var(--blueprint)',{sw:1.2});
  const nrm=[-uy,ux], sP=((P[0]-A[0])*nrm[0]+(P[1]-A[1])*nrm[1])>=0?1:-1, away=[-nrm[0]*sP,-nrm[1]*sP], toP=[nrm[0]*sP,nrm[1]*sP];
  const d=Math.hypot(P[0]-F[0],P[1]-F[1]);
  if(d>0.5) K.line(...P,...F,'var(--accent)',{sw:1});
  if(d>6){ const k=3, s=pf<len/2?1:-1, v=[toP[0]*k,toP[1]*k];
    K.poly([[F[0]+ux*s*k,F[1]+uy*s*k],[F[0]+ux*s*k+v[0],F[1]+uy*s*k+v[1]],[F[0]+v[0],F[1]+v[1]]],{stroke:'var(--ink-soft)',sw:0.6,obs:false}); }
  // cota K: de P1 a F, paralela al eje, del lado opuesto a P3
  const off=5, a0=[A[0]+away[0]*off,A[1]+away[1]*off], f0=[F[0]+away[0]*off,F[1]+away[1]*off];
  if(Math.abs(pf)>2){
    K.line(...a0,...f0,'var(--success)',{sw:0.7});
    [A,F].forEach(q=>K.line(q[0]+away[0]*1.5,q[1]+away[1]*1.5,q[0]+away[0]*(off+1.6),q[1]+away[1]*(off+1.6),'var(--success)',{sw:0.6,noObs:false}));
    K.lineLabel(...a0,...f0,'K',4.5,'var(--success)',{out:away,extras:[0,3,6]});
  }
  [A,B].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  K.dot(F[0],F[1],'var(--ink-soft)',1.8); K.dot(P[0],P[1],'var(--accent)',2.4);
  if(d>6) K.lineLabel(...P,...F,'Off',4.5,'var(--accent)',{out:[ux,uy]});
  const pd=d>0.5?[(P[0]-F[0])/d,(P[1]-F[1])/d]:toP;
  K.pointLabel('P1',A[0],A[1],4.5,'var(--ink-soft)',{dir:away,full:true,omit:false});
  K.pointLabel('P2',B[0],B[1],4.5,'var(--ink-soft)',{dir:away,full:true,omit:false});
  K.pointLabel('P3',P[0],P[1],4.5,'var(--accent)',{dir:pd,omit:false});
  K.pointLabel('F',F[0],F[1],4.5,'var(--ink-soft)',{dir:away,full:true});
  return K.svg();
}
function renderProgresivaOffset(){
  const body = `<div class="field-card">
    <h3>Eje (P1 → P2)</h3>
    ${fieldRow('Progresiva de P1, K1 (m)','po_k1',0)}
    ${fieldRow('Este P1','po_e1',500.000)}${fieldRow('Norte P1','po_n1',1000.000)}
    ${fieldRow('Este P2','po_e2',500.000)}${fieldRow('Norte P2','po_n2',1100.000)}
    <h3 style="margin-top:14px;">Punto de terreno (P3)</h3>
    ${fieldRow('Este P3','po_ep',505.000)}${fieldRow('Norte P3','po_np',1040.000)}
    <button class="btn" id="btnPO" type="button">Calcular</button>
    <div id="resPO"></div>
  </div>`;
  toolShell('progresivaOffset','Progresiva y distancia perpendicular (offset) de un punto de terreno respecto a un eje definido por dos puntos — el cálculo inverso de un eje de proyecto. Offset positivo = a la derecha en el sentido de avance P1→P2.', body, ['K']);
  document.getElementById('btnPO').addEventListener('click', ()=>{
    const k1=val('po_k1'), e1=val('po_e1'), n1=val('po_n1'), e2=val('po_e2'), n2=val('po_n2'), ep=val('po_ep'), np=val('po_np');
    const box=document.getElementById('resPO');
    if([k1,e1,n1,e2,n2,ep,np].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las coordenadas del eje y del punto.</p>`; return; }
    if(e1===e2 && n1===n2){ box.innerHTML=`<p class="err-msg">P1 y P2 no pueden ser el mismo punto.</p>`; return; }
    const r = calcProgresivaOffset(n1,e1,k1,n2,e2,np,ep);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Progresiva (K)</span><span class="v accent big">${fmtNum(r.Kp,2)} m</span></div>
      <div class="result-row"><span class="k">Offset</span><span class="v accent big">${fmtNum(Math.abs(r.offset),3)} m — ${r.lado}</span></div>
      <div class="result-row"><span class="k">Azimut del eje</span><span class="v">${fmtAngle(r.az)}</span></div>
      <div class="plot-wrap">${svgProgresivaOffset(n1,e1,k1,n2,e2,np,ep,r)}</div>
    </div>`;
  });
}

const RENDERERS = { progresivaOffset: renderProgresivaOffset };
