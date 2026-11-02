"use strict";
/* Herramienta «Distancia Punto-Línea»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcDistanciaPuntoLinea(e1,n1,e2,n2,ep,np){
  const dx=e2-e1, dn=n2-n1;
  const len2 = dx*dx+dn*dn;
  const len = Math.sqrt(len2);
  const t = ((ep-e1)*dx + (np-n1)*dn)/len2;
  const footE = e1+t*dx, footN = n1+t*dn;
  const dist = Math.hypot(ep-footE, np-footN);
  const cross = dx*(np-n1) - dn*(ep-e1);
  const signedDist = cross/len;
  const distDesdeA = t*len;
  return {dist, footE, footN, distDesdeA, len, signedDist, tFraction:t, lado: signedDist>=0 ? 'izquierda' : 'derecha'};
}
function svgDistPuntoLinea(e1, n1, e2, n2, ep, np, r, fuente){
  const K=svgKit(), eng=K.eng, f=K.f;
  K.north();
  K.list([[
    {k:'D',c:'var(--accent)',v:`${fmtNum(r.dist,3)} m`},
    {k:'A→F',c:'var(--success)',v:`${fmtNum(r.distDesdeA,3)} m`},
    {k:'A→B',c:'var(--blueprint)',v:`${fmtNum(r.len,3)} m`},
    {k:'Lado',c:'var(--ink)',v:r.lado},
    {k:'F Este',c:'var(--ink)',v:fmtNum(r.footE,3)},
    {k:'F Norte',c:'var(--ink)',v:fmtNum(r.footN,3)}]]);
  const box={l:62,r:268,t:Math.max(54,K.listBottom+8),b:164};
  const fit=K.fit([[e1,n1],[e2,n2],[ep,np],[r.footE,r.footN]],box);
  const A=[fit.X(e1),fit.Y(n1)], B=[fit.X(e2),fit.Y(n2)], P=[fit.X(ep),fit.Y(np)], F=[fit.X(r.footE),fit.Y(r.footN)];
  const dx=B[0]-A[0], dy=B[1]-A[1], len=Math.hypot(dx,dy)||1, ux=dx/len, uy=dy/len;
  const proj=q=>(q[0]-A[0])*ux+(q[1]-A[1])*uy;               // coordenada sobre la recta, medida desde A
  const tmin=Math.min(0,len,proj(F))-14, tmax=Math.max(0,len,proj(F))+14;
  const at=t=>[A[0]+ux*t, A[1]+uy*t];
  // recta: tramo A–B sólido y prolongaciones tenues
  if(tmin<0) K.line(...at(tmin),...at(0),'var(--blueprint)',{op:0.45,dash:'1.6 1.6'});
  if(tmax>len) K.line(...at(len),...at(tmax),'var(--blueprint)',{op:0.45,dash:'1.6 1.6'});
  K.line(...A,...B,'var(--blueprint)');
  // lado opuesto a P (para cotas y letras de la recta)
  const nrm=[-uy,ux], sP=((P[0]-A[0])*nrm[0]+(P[1]-A[1])*nrm[1])>=0?1:-1, away=[-nrm[0]*sP,-nrm[1]*sP], toP=[nrm[0]*sP,nrm[1]*sP];
  // perpendicular P→F y marca de ángulo recto
  K.line(...P,...F,'var(--accent)');
  const d=Math.hypot(P[0]-F[0],P[1]-F[1]);
  if(d>6){ const k=3, a=[F[0]+ux*k*Math.sign(proj(F)<len/2?1:-1)*1, F[1]+uy*k*Math.sign(proj(F)<len/2?1:-1)*1], v=[toP[0]*k,toP[1]*k], s=Math.sign(proj(F)<len/2?1:-1);
    K.poly([[F[0]+ux*s*k,F[1]+uy*s*k],[F[0]+ux*s*k+v[0],F[1]+uy*s*k+v[1]],[F[0]+v[0],F[1]+v[1]]],{stroke:'var(--ink-soft)',sw:0.6,obs:false}); }
  // cota A→F (success), paralela a la recta, del lado opuesto a P
  const off=5, a0=[A[0]+away[0]*off,A[1]+away[1]*off], f0=[F[0]+away[0]*off,F[1]+away[1]*off];
  if(Math.hypot(F[0]-A[0],F[1]-A[1])>2){
    K.line(...a0,...f0,'var(--success)',{sw:0.7});
    [A,F].forEach((q,i)=>{ const c=i?f0:a0; K.line(q[0]+away[0]*1.5,q[1]+away[1]*1.5,q[0]+away[0]*(off+1.6),q[1]+away[1]*(off+1.6),'var(--success)',{sw:0.6,noObs:false}); });
    K.lineLabel(...a0,...f0,`A→F = ${fmtNum(r.distDesdeA,3)} m`,3,'var(--success)',{out:away,extras:[0,3,6]});
  }
  // puntos y letras
  [A,B,P,F].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  K.lineLabel(...P,...F,`D = ${fmtNum(r.dist,3)} m`,3,'var(--accent)',{out:[ux,uy]});
  K.lineLabel(...A,...B,`A→B = ${fmtNum(r.len,3)} m`,3,'var(--blueprint)',{out:toP,extras:[0,3,6]});
  const pdir=[P[0]-F[0],P[1]-F[1]], pl=Math.hypot(...pdir)||1;
  K.pointLabel('A',A[0],A[1],4.5,'var(--ink-soft)',{dir:away,full:true});
  K.pointLabel('B',B[0],B[1],4.5,'var(--ink-soft)',{dir:away,full:true});
  K.pointLabel('F',F[0],F[1],4.5,'var(--ink-soft)',{dir:away,full:true});
  K.pointLabel('P',P[0],P[1],4.5,'var(--ink-soft)',{dir:[pdir[0]/pl,pdir[1]/pl]});
  return K.svg();
}
function renderDistPuntoLinea(){
  const body = `<div class="field-card">
    <h3>Recta (dos puntos conocidos)</h3>
    ${libretaBloqueHTML('dl_libA','Punto A desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este A','dl_e1',EJ_E0)}${fieldRow('Norte A','dl_n1',EJ_N0)}</div>
    ${libretaBloqueHTML('dl_libB','Punto B desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este B','dl_e2',round(EJ_E0+100,2))}${fieldRow('Norte B','dl_n2',EJ_N0)}</div>
    <h3 style="margin-top:14px;">Punto externo</h3>
    ${libretaBloqueHTML('dl_libP','Punto P desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este P','dl_ep',round(EJ_E0+50,2))}${fieldRow('Norte P','dl_np',round(EJ_N0+30,2))}</div>
    <button class="btn" id="btnDL" type="button">Calcular</button>
    <div id="resDL"></div>
  </div>`;
  toolShell('distPuntoLinea','Distancia perpendicular más corta desde un punto a una recta definida por otros dos puntos de coordenadas conocidas, y coordenadas del pie de la perpendicular sobre la recta.', body);
  const dlMetas = [null, null, null];
  libretaTraerA('dl_libA','dl_e1','dl_n1', m=>{ dlMetas[0]=m; });
  libretaTraerA('dl_libB','dl_e2','dl_n2', m=>{ dlMetas[1]=m; });
  libretaTraerA('dl_libP','dl_ep','dl_np', m=>{ dlMetas[2]=m; });
  document.getElementById('btnDL').addEventListener('click', ()=>{
    const e1=val('dl_e1'),n1=val('dl_n1'),e2=val('dl_e2'),n2=val('dl_n2'),ep=val('dl_ep'),np=val('dl_np');
    const box=document.getElementById('resDL');
    const inc = metasIncompatibles(dlMetas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    if([e1,n1,e2,n2,ep,np].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las seis coordenadas.</p>`; return; }
    if(e1===e2 && n1===n2){ box.innerHTML=`<p class="err-msg">Los puntos A y B de la recta no pueden ser el mismo punto.</p>`; return; }
    const r = calcDistanciaPuntoLinea(e1,n1,e2,n2,ep,np);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia perpendicular</span><span class="v accent big">${fmtNum(r.dist,3)} m</span></div>
      <div class="result-row"><span class="k">Lado respecto de A→B</span><span class="v">${r.lado}</span></div>
      <div class="result-row"><span class="k">Pie de la perpendicular — Este</span><span class="v">${fmtNum(r.footE,3)}</span></div>
      <div class="result-row"><span class="k">Pie de la perpendicular — Norte</span><span class="v">${fmtNum(r.footN,3)}</span></div>
      <div class="result-row"><span class="k">Distancia desde A hasta el pie</span><span class="v">${fmtNum(r.distDesdeA,3)} m</span></div>
      <div class="result-row"><span class="k">Longitud A→B</span><span class="v">${fmtNum(r.len,3)} m</span></div>
      <div class="plot-wrap">${svgDistPuntoLinea(e1,n1,e2,n2,ep,np,r)}</div>
    </div>`;
  });
}

const RENDERERS = { distPuntoLinea: renderDistPuntoLinea };
