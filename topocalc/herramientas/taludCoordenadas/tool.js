"use strict";
/* Herramienta «Taluceras por Coordenadas»: dado un eje A–B (coordenadas, cota y kilómetro de A), el perfil tipo
   (taludes, plataforma, pendiente transversal, bancos) y un punto del terreno (Este, Norte, Cota), indica si está
   en corte o terraplén, la altura, la distancia inclinada, los bancos y cuánto hay que acercarse o alejarse del eje
   para llegar al pie del talud (chaflán). Mismos datos de entrada y de salida que el programa TALUD de la
   calculadora Casio fx-9860GII. Taludes como H/V. */
let tcN = 2;

/* Datos del eje A–B. Devuelve null si A y B coinciden. */
function calcTaludEje(eA,nA,cA,kmA,eB,nB,cB){
  const de=eB-eA, dn=nB-nA, L=Math.hypot(de,dn);
  if(!(L>1e-9)) return null;
  return {eA,nA,cA,kmA,L, ue:de/L, un:dn/L, az:normDeg(toDeg(Math.atan2(de,dn))), pend:(cB-cA)/L, kmB:kmA+L};
}
/* Punto de terreno respecto del eje y del perfil tipo. pf = {tC,tT,ancho,pt,alt,anchoB}. */
function calcTaludPunto(ej,pf,eP,nP,cP){
  const de=eP-ej.eA, dn=nP-ej.nA;
  const lon = de*ej.ue + dn*ej.un;                 // proyección sobre el eje (d·cos Δaz)
  const tra = de*ej.un - dn*ej.ue;                 // desfase transversal, + a la derecha (d·sin Δaz)
  const km = ej.kmA + lon;
  const cEje = ej.cA + ej.pend*lon;                // cota del eje de la plataforma en ese kilómetro
  const cBorde = cEje + (pf.pt/100)*pf.ancho;      // cota del borde de la plataforma
  const dif = cBorde - cP;
  const r = {km, tra, cEje, cBorde, dif};
  if(dif > 0){                                     // terreno bajo la plataforma: TERRAPLÉN
    r.tipo='Terraplén'; r.banc=0;
    r.dCh = pf.ancho + dif*pf.tT;
    r.h = dif;
    r.dInc = Math.hypot(dif, dif*pf.tT);
  } else {                                         // CORTE
    r.tipo='Corte';
    const a=-dif;
    let B = (pf.alt>0 && a>pf.alt) ? Math.floor(a/pf.alt) : 0;
    r.banc=B;
    r.dCh = B>=1 ? B*pf.anchoB + pf.alt*pf.tC*B + pf.ancho + (a-pf.alt*B)*pf.tC : pf.ancho + a*pf.tC;
    const hh = cP-(cBorde+B*pf.alt);
    r.h = a - pf.alt*B;
    r.dInc = Math.hypot(hh, hh*pf.tC);
  }
  const falta = Math.abs(r.dCh) - Math.abs(tra);
  r.mover = falta>0 ? 'Aléjese' : 'Acérquese';
  r.moverD = Math.abs(falta);
  return r;
}

/* Corte transversal del punto: eje en x=0, el lado del punto hacia la derecha. */
function svgTaludCoord(ej,pf,r,cP){
  const K=svgKit(), f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const ax=Math.abs(r.tra);
  K.list([
    [{k:'Km punto',c:CK,v:fmtNum(r.km,3)},{k:r.tipo,c:CP,v:`H ${fmtNum(r.h,3)} m`},{k:'Dist. inclinada',c:CD,v:`${fmtNum(r.dInc,3)} m`},{k:'Bancos',c:CK,v:String(r.banc)}],
    [{k:r.mover,c:CP,v:`${fmtNum(r.moverD,3)} m`},{k:'Dist. al chaflán',c:CZ,v:`${fmtNum(r.dCh,3)} m`},{k:'Desfase',c:CK,v:`${fmtNum(r.tra,3)} m`}]
  ]);
  // perfil del talud desde el borde de la plataforma
  const pts=[[0,r.cEje],[pf.ancho,r.cBorde]];
  let x=pf.ancho, y=r.cBorde;
  if(r.tipo==='Terraplén'){ pts.push([r.dCh,cP]); }
  else {
    for(let k=0;k<r.banc;k++){ x+=pf.alt*pf.tC; y+=pf.alt; pts.push([x,y]); x+=pf.anchoB; pts.push([x,y]); }
    pts.push([r.dCh,cP]);
  }
  const top=Math.max(44,K.listBottom+12);
  const all=pts.concat([[ax,cP]]);
  const xs=all.map(p=>p[0]), ys=all.map(p=>p[1]);
  const spX=Math.max(...xs)-Math.min(...xs,0), spY=Math.max(...ys)-Math.min(...ys);
  const ex = spY>1e-9 ? Math.max(1,Math.min(5,Math.floor(spX/(spY*2.5)))) : 1;     // exageración vertical entera (solo para que se lea)
  const fit=K.fit(all.map(p=>[p[0],p[1]*ex]),{l:36,r:296,t:top,b:160});
  const S=p=>({x:fit.X(p[0]),y:fit.Y(p[1]*ex)});
  const P=pts.map(S);
  K.line(P[0].x,P[0].y,P[1].x,P[1].y,CD,{sw:1});
  for(let i=1;i+1<P.length;i++) K.line(P[i].x,P[i].y,P[i+1].x,P[i+1].y,CZ,{sw:1});
  const E=S([0,r.cEje]), Pt=S([ax,cP]), Ch=S([r.dCh,cP]), Bd=P[1];
  K.line(E.x,E.y,E.x,Math.min(E.y+10,165),CS,{dash:'2 1.6',sw:0.6});        // eje
  if(Math.abs(Pt.x-Ch.x)>0.4) K.line(Pt.x,Pt.y,Ch.x,Ch.y,CP,{dash:'2 1.6',sw:0.9});
  K.dot(E.x,E.y,CS,2); K.dot(Bd.x,Bd.y,CD,2); K.dot(Ch.x,Ch.y,CZ,2.4); K.dot(Pt.x,Pt.y,CP,2.7);
  K.pointLabel('Eje',E.x,E.y,4.5,CS,{dir:[-1,-0.4]});
  K.pointLabel('Borde',Bd.x,Bd.y,4,CD,{dir:[0,-1]});
  K.pointLabel('Chaflán',Ch.x,Ch.y,4.5,CZ,{dir:[r.dCh>=ax?1:0.3,r.tipo==='Corte'?-0.6:0.9]});
  K.pointLabel('Punto',Pt.x,Pt.y,4.5,CP,{dir:[r.dCh>=ax?-1:0.3,r.tipo==='Corte'?0.9:-0.9]});
  K.lineLabel(Pt.x,Pt.y,Ch.x,Ch.y,`${r.mover} ${fmtNum(r.moverD,2)} m`,3.8,CP,{out:[0,r.tipo==='Corte'?1:-1]});
  K.lineLabel(P[0].x,P[0].y,P[1].x,P[1].y,`${fmtNum(pf.ancho,2)} m`,3.8,CD,{out:[0,r.tipo==='Corte'?1:-1]});
  if(ex>1) K.txt(`Escala vertical ×${ex}`,3.6,CS,{x:292,y:176,anchor:'end'});
  return K.svg();
}

function renderTaludCoordenadas(){
  const body = `<div class="field-card">
    <h3>Eje: punto A</h3>
    ${libretaBloqueHTML('tc_libA','Punto A desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este A','tc_eA',EJ_E0)}${fieldRow('Norte A','tc_nA',EJ_N0)}</div>
    <div class="field-inline2">${fieldRow('Cota A (m)','tc_cA',100)}${fieldRow('Km del punto A','tc_kmA',0)}</div>
    <h3 style="margin-top:14px;">Eje: punto B</h3>
    ${libretaBloqueHTML('tc_libB','Punto B desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este B','tc_eB',round(EJ_E0+80,2))}${fieldRow('Norte B','tc_nB',round(EJ_N0+60,2))}</div>
    ${fieldRow('Cota B (m)','tc_cB',102)}
    <h3 style="margin-top:14px;">Perfil tipo</h3>
    <div class="field-inline2">${fieldRow('Talud de corte (H/V)','tc_tC',0.5)}${fieldRow('Talud de terraplén (H/V)','tc_tT',1.5)}</div>
    <div class="field-inline2">${fieldRow('Ancho plataforma desde el eje (A/2, m)','tc_anc',3.5)}${fieldRow('Pend. transversal (%)','tc_pt',-2)}</div>
    <div class="field-inline2">${fieldRow('Altura de bancos (m)','tc_alt',5)}${fieldRow('Ancho de bancos (m)','tc_ab',3)}</div>
  </div>
  <div class="field-row"><label>Número de puntos de terreno</label>
    <div class="n-stepper"><button type="button" id="tcMinus">−</button><span class="n-val" id="tcNVal">${tcN}</span><button type="button" id="tcPlus">+</button></div>
  </div>
  <div id="tcPoints"></div>
  <button class="btn" id="btnTC" type="button">Calcular</button>
  <div id="resTC"></div>`;
  toolShell('taludCoordenadas','Replanteo de chaflanes (pie de talud) por coordenadas: para cada punto del terreno indica si está en corte o terraplén, la altura, la distancia inclinada, los bancos y cuánto acercarse o alejarse del eje para llegar al pie del talud.', body);
  const metas=[null,null];
  libretaTraerA('tc_libA','tc_eA','tc_nA', m=>{ metas[0]=m; });
  libretaTraerA('tc_libB','tc_eB','tc_nB', m=>{ metas[1]=m; });
  const defP=[[30,28,100.5],[50,40,104.8],[65,52,98]];
  const draw=()=>{
    const prev=[]; for(let i=0;i<tcN;i++){ const e=document.getElementById('tc_pe_'+i); prev.push(e?['tc_pe_','tc_pn_','tc_pc_'].map(p=>document.getElementById(p+i).value):null); }
    let html='';
    for(let i=0;i<tcN;i++){
      const d=defP[i%3], pv=prev[i];
      html += `<div class="station-block"><div class="st-label">Punto de terreno P${i+1}</div>
        ${libretaBloqueHTML('tc_libP_'+i,'Desde la Libreta')}
        <div class="field-inline2">${fieldRow('Este','tc_pe_'+i,pv?pv[0]:round(EJ_E0+d[0],2))}${fieldRow('Norte','tc_pn_'+i,pv?pv[1]:round(EJ_N0+d[1],2))}</div>
        ${fieldRow('Cota del terreno (m)','tc_pc_'+i,pv?pv[2]:d[2])}</div>`;
    }
    document.getElementById('tcPoints').innerHTML=html;
    for(let i=0;i<tcN;i++){ const k=i; libretaTraerA('tc_libP_'+k,'tc_pe_'+k,'tc_pn_'+k, m=>{ metas[2+k]=m; }); }
  };
  draw();
  document.getElementById('tcMinus').addEventListener('click', ()=>{ if(tcN>1){ tcN--; metas.length=2+tcN; document.getElementById('tcNVal').textContent=tcN; draw(); }});
  document.getElementById('tcPlus').addEventListener('click', ()=>{ if(tcN<20){ tcN++; document.getElementById('tcNVal').textContent=tcN; draw(); }});
  document.getElementById('btnTC').addEventListener('click', ()=>{
    const box=document.getElementById('resTC');
    const g=id=>val(id);
    const eA=g('tc_eA'),nA=g('tc_nA'),cA=g('tc_cA'),kmA=g('tc_kmA'),eB=g('tc_eB'),nB=g('tc_nB'),cB=g('tc_cB');
    const pf={tC:g('tc_tC'),tT:g('tc_tT'),ancho:g('tc_anc'),pt:g('tc_pt'),alt:g('tc_alt'),anchoB:g('tc_ab')};
    const inc=metasIncompatibles(metas); if(inc){ box.innerHTML=msgIncompatibles(inc); return; }
    if([eA,nA,cA,kmA,eB,nB,cB,...Object.values(pf)].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los datos del eje y del perfil.</p>`; return; }
    if(pf.tC<0||pf.tT<0||pf.ancho<0||pf.alt<0||pf.anchoB<0){ box.innerHTML=`<p class="err-msg">Taludes, ancho y bancos no pueden ser negativos.</p>`; return; }
    const ej=calcTaludEje(eA,nA,cA,kmA,eB,nB,cB);
    if(!ej){ box.innerHTML=`<p class="err-msg">Los puntos A y B del eje no pueden coincidir.</p>`; return; }
    const res=[], cots=[];
    for(let i=0;i<tcN;i++){
      const eP=g('tc_pe_'+i),nP=g('tc_pn_'+i),cP=g('tc_pc_'+i);
      if([eP,nP,cP].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa Este, Norte y Cota de todos los puntos.</p>`; return; }
      res.push(calcTaludPunto(ej,pf,eP,nP,cP)); cots.push(cP);
    }
    let trs=''; res.forEach((r,i)=>{ trs += `<tr><td>P${i+1}</td><td>${fmtNum(r.km,3)}</td><td>${r.tipo}</td><td>${r.mover} ${fmtNum(r.moverD,3)}</td><td>${fmtNum(r.h,3)}</td><td>${fmtNum(r.dInc,3)}</td><td>${r.banc}</td></tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Pendiente A–B</span><span class="v">${fmtNum(ej.pend*100,3)} %</span></div>
      <div class="result-row"><span class="k">Km del punto B</span><span class="v">${fmtNum(ej.kmB,3)}</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Punto</th><th>Km</th><th>Tipo</th><th>Mover</th><th>H</th><th>Dist. inclinada</th><th>Bancos</th></tr></thead><tbody>${trs}</tbody></table></div>
      ${tcN>1?`<div class="field-row"><label for="tcSel">Corte transversal del punto</label><select id="tcSel">${res.map((_,i)=>`<option value="${i}">P${i+1}</option>`).join('')}</select></div>`:''}
      <div class="plot-wrap" id="tcPlot">${svgTaludCoord(ej,pf,res[0],cots[0])}</div>
    </div>`;
    const sel=document.getElementById('tcSel');
    if(sel) sel.addEventListener('change',()=>{ const i=+sel.value; document.getElementById('tcPlot').innerHTML=svgTaludCoord(ej,pf,res[i],cots[i]); });
  });
}

const RENDERERS = { taludCoordenadas: renderTaludCoordenadas };
