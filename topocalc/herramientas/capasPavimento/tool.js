"use strict";
/* Herramienta «Capas de Pavimento»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCapasPavimento(Cras,i,d,e1,e2,e3,capa){
  const espesor = capa===1 ? (e1+e2+e3) : capa===2 ? (e1+e2) : e1;
  const CejeCapa = Cras-espesor;
  const drop = Math.abs(d)*(i/100);
  const CbordeDer = CejeCapa-drop;
  const CbordeIzq = CejeCapa-drop;
  return {CejeCapa, drop, CbordeDer, CbordeIzq};
}
function svgCapasPavimento(Cras,i,d,e1,e2,e3,capa,r){
  const K=svgKit(), col={E:'var(--accent)',B:'var(--blueprint)',c:'var(--success)',d:'var(--ink)',e:'var(--ink-soft)'};
  K.list([[{k:'Eje',c:col.E,v:`${fmtNum(r.CejeCapa,3)} m`},{k:'Izq',c:col.B,v:`${fmtNum(r.CbordeIzq,3)} m`},{k:'Der',c:col.B,v:`${fmtNum(r.CbordeDer,3)} m`},{k:'c',c:col.c,v:`${fmtNum(r.drop,4)} m`},{k:'i',c:col.B,v:`${fmtNum(i,2)} %`}],
    [{k:'Cras',c:col.e,v:`${fmtNum(Cras,3)} m`},{k:'d',c:col.d,v:`${fmtNum(d,2)} m`},{k:'e1',c:col.e,v:`${fmtNum(e1,2)} m`},{k:'e2',c:col.e,v:`${fmtNum(e2,2)} m`},{k:'e3',c:col.e,v:`${fmtNum(e3,2)} m`}]],{perCol:5});
  const xEje=170, xL=60, xR=280, yRas=56, yE1=74, yE2=96, yE3=122, capaY=capa===1?yE3:capa===2?yE2:yE1, dropPx=14, yB=capaY+dropPx;
  const layer=(y,c,sw)=>K.line(xL-14,y,xR+8,y,c,{sw:sw||0.6,noObs:false});
  layer(yRas,'var(--ink-soft)',1.2); layer(yE1,'var(--line-strong)'); layer(yE2,'var(--line-strong)'); layer(yE3,'var(--line-strong)');
  // espesores a la izquierda
  const ex=xL-26; [[yRas,yE1,'e1'],[yE1,yE2,'e2'],[yE2,yE3,'e3']].forEach(([a,b,t])=>{ K.line(ex,a,ex,b,col.e,{sw:0.8}); [a,b].forEach(y=>K.line(ex-2,y,ex+2,y,col.e,{sw:0.7,noObs:false})); K.lineLabel(ex,a,ex,b,t,3.6,col.e,{out:[-1,0],extras:[0,3]}); });
  // eje, líneas con bombeo y bordes
  K.line(xEje,yRas-10,xEje,capaY,col.E,{sw:0.7,dash:'2 2',noObs:false});
  K.line(xEje,capaY,xL,yB,col.B,{sw:1.5}); K.line(xEje,capaY,xR,yB,col.B,{sw:1.5});
  K.dot(xEje,capaY,col.E,2.6); K.dot(xL,yB,col.B,2.2); K.dot(xR,yB,col.B,2.2);
  // caída c (en el borde derecho) y distancia d (abajo)
  const cx=xR+12; K.line(cx,capaY,cx,yB,col.c,{sw:1}); [capaY,yB].forEach(y=>K.line(cx-2,y,cx+2,y,col.c,{sw:0.8,noObs:false})); K.line(xR,capaY,cx+2,capaY,'var(--ink-soft)',{sw:0.5,dash:'1.4 1.6',noObs:false});
  const yd=yB+22; K.line(xEje,yd,xR,yd,col.d,{sw:0.9}); [xEje,xR].forEach(x=>K.line(x,yd-2.5,x,yd+2.5,col.d,{sw:0.8,noObs:false})); K.line(xR,yB+3,xR,yd,'var(--ink-soft)',{sw:0.5,dash:'1.4 1.6',noObs:false}); K.line(xEje,capaY+3,xEje,yd,'var(--ink-soft)',{sw:0.5,dash:'1.4 1.6',noObs:false});
  K.lineLabel(xEje,yd,xR,yd,'d',4.5,col.d,{out:[0,1],extras:[0,3]});
  K.pointLabel('c',cx,(capaY+yB)/2,4.5,col.c,{dir:[1,0],omit:false,rmin:3,rmax:9});
  K.pointLabel('Eje',xEje,capaY,4.5,col.E,{dir:[0.2,-1],omit:false,rmin:4,rmax:12});
  K.pointLabel('Izq',xL,yB,4.5,col.B,{dir:[-0.3,1],omit:false,rmin:4,rmax:12});
  K.pointLabel('Der',xR,yB,4.5,col.B,{dir:[-0.3,1],omit:false,rmin:4,rmax:12});
  K.pointLabel('Rasante',xL-12,yRas,3.6,'var(--ink-soft)',{dir:[0.6,-1],omit:false,rmin:3,rmax:10});
  [[yE1,'Carpeta'],[yE2,'Base'],[yE3,'Subbase']].forEach(([y,t])=>K.pointLabel(t,xR-14,y,3.2,'var(--ink-soft)',{dir:[0,-1],rmin:2.5,rmax:8}));
  return K.svg();
}
function renderCapasPavimento(){
  const body = `<div class="field-card">
    ${fieldRow('Cota de rasante en el eje, Cras (m)','pv_cras',250.000)}
    ${fieldRow('Bombeo transversal, i (%)','pv_i',2.0)}
    ${fieldRow('Distancia del eje al borde, d (m)','pv_d',3.50)}
    ${fieldRow('Espesor de Carpeta/Asfalto, e1 (m)','pv_e1',0.05)}
    ${fieldRow('Espesor de Base, e2 (m)','pv_e2',0.15)}
    ${fieldRow('Espesor de Subbase, e3 (m)','pv_e3',0.20)}
    <div class="field-row"><label for="pv_capa">Capa a calcular</label>
      <select id="pv_capa"><option value="3">Base</option><option value="2">Subbase</option><option value="1" selected>Subrasante</option></select></div>
    <button class="btn" id="btnPV" type="button">Calcular</button>
    <div id="resPV"></div>
  </div>`;
  toolShell('capasPavimento','Cota de trabajo en el eje y en ambos bordes (por bombeo transversal) para la capa de pavimento elegida — Base, Subbase o Subrasante — descontando los espesores de diseño desde la rasante.', body);
  document.getElementById('btnPV').addEventListener('click', ()=>{
    const Cras=val('pv_cras'), i=val('pv_i'), d=val('pv_d'), e1=val('pv_e1'), e2=val('pv_e2'), e3=val('pv_e3');
    const capa=valInt('pv_capa');
    const box=document.getElementById('resPV');
    if([Cras,i,d,e1,e2,e3].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcCapasPavimento(Cras,i,d,e1,e2,e3,capa);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Cota en el eje</span><span class="v accent big">${fmtNum(r.CejeCapa,3)} m</span></div>
      <div class="result-row"><span class="k">Caída por bombeo</span><span class="v">${fmtNum(r.drop,4)} m</span></div>
      <div class="result-row"><span class="k">Cota en el borde izquierdo</span><span class="v">${fmtNum(r.CbordeIzq,3)} m</span></div>
      <div class="result-row"><span class="k">Cota en el borde derecho</span><span class="v">${fmtNum(r.CbordeDer,3)} m</span></div>
      <div class="plot-wrap">${svgCapasPavimento(Cras,i,d,e1,e2,e3,capa,r)}</div>
    </div>`;
  });
}

const RENDERERS = { capasPavimento: renderCapasPavimento };
