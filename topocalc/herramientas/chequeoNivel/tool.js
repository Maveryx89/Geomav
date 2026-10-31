"use strict";
/* Herramienta «Chequeo de Nivel (2 Estacas)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function svgNivelDosEstacas(a1,b1,a2,b2,D,d,r){
  const K=svgKit(), c1='var(--blueprint)', c2='var(--accent)';
  K.list([[{k:'E',c:c2,v:`${fmtNum(Math.abs(r.errMM30)<0.05?0:r.errMM30,1)} mm/30 m`},{k:'ΔH ver.',c:c1,v:`${fmtNum(r.dhTrue,4)} m`},{k:'ΔH apar.',c:c2,v:`${fmtNum(r.dhApp,4)} m`},{k:'b2 corr.',c:c2,v:`${fmtNum(r.bCorrecta,4)} m`}],
    [{k:'a1',c:c1,v:`${fmtNum(a1,3)} m`},{k:'b1',c:c1,v:`${fmtNum(b1,3)} m`},{k:'a2',c:c2,v:`${fmtNum(a2,3)} m`},{k:'b2',c:c2,v:`${fmtNum(b2,3)} m`}],
    [{k:'D',c:'var(--ink)',v:`${fmtNum(D,2)} m`},{k:'d',c:'var(--ink-soft)',v:`${fmtNum(d,2)} m`}]],{perCol:4});
  const xA=52, xB=268, maxV=Math.max(Math.abs(a1),Math.abs(b1),Math.abs(a2),Math.abs(b2),0.01), kk=36/maxV, sh=34;
  const xi2=xA+Math.min(Math.max(d/Math.max(D,1e-9),0),1)*(xB-xA), xi1=(xA+xB)/2;
  const panel=(g,a,b,xi,col,name)=>{
    const ya=g-a*kk, yb=g-b*kk, yi=ya+(yb-ya)*(xi-xA)/(xB-xA);
    K.line(xA-18,g,xB+18,g,'#8B6B47',{sw:1,noObs:false});
    K.line(xA,g,xA,g-sh-10,'var(--ink-soft)',{sw:1.2,noObs:false}); K.line(xB,g,xB,g-sh-10,'var(--ink-soft)',{sw:1.2,noObs:false});
    K.line(xA-8,yi,xB+8,yi,'var(--ink-soft)',{sw:0.6,dash:'1.6 1.6'});
    K.line(xA,ya,xB,yb,col,{sw:1.1}); K.line(xi,yi,xi,g,'var(--ink)',{sw:0.9,noObs:false});
    K.dot(xA,ya,col,2); K.dot(xB,yb,col,2); K.dot(xi,yi,'var(--ink)',2.4);
    K.pointLabel(name==='1'?'a1':'a2',xA,ya,4.5,col,{dir:[-1,0],omit:false,rmin:3.5,rmax:10});
    K.pointLabel(name==='1'?'b1':'b2',xB,yb,4.5,col,{dir:[1,0],omit:false,rmin:3.5,rmax:10});
    K.pointLabel('A',xA,g,4.5,'var(--ink-soft)',{dir:[0,1],omit:false,rmin:3.5,rmax:10}); K.pointLabel('B',xB,g,4.5,'var(--ink-soft)',{dir:[0,1],omit:false,rmin:3.5,rmax:10});
    K.pointLabel('Nivel '+name,xi,g,3.6,col,{dir:[0,1],omit:false,rmin:3.5,rmax:12});
    return {ya,yb,yi};
  };
  panel(94,a1,b1,xi1,c1,'1'); panel(160,a2,b2,xi2,c2,'2');
  // D y d al pie
  const yD=179; K.line(xA,yD,xB,yD,'var(--ink)',{sw:0.8}); [xA,xB].forEach(x=>K.line(x,yD-2,x,yD+2,'var(--ink)',{sw:0.8,noObs:false})); K.lineLabel(xA,yD,xB,yD,'D',4.5,'var(--ink)',{at:0.7,out:[0,1],extras:[0,2]});
  if(xi2-xA>6){ K.line(xA,yD,xi2,yD,'var(--ink-soft)',{sw:1.4,noObs:false}); K.lineLabel(xA,yD,xi2,yD,'d',4.5,'var(--ink-soft)',{at:0.5,out:[0,-1],extras:[0,2]}); }
  return K.svg();
}
function renderChequeoNivel(){
  const body = `<div class="field-card">
    <h3>Posición 1 — nivel centrado entre A y B</h3>
    ${fieldRow('Distancia total A–B, D (m)','cn_D',60)}
    ${fieldRow('Lectura en mira A, a1 (m)','cn_a1',1.534)}
    ${fieldRow('Lectura en mira B, b1 (m)','cn_b1',1.298)}
    <h3 style="margin-top:14px;">Posición 2 — nivel cerca de A</h3>
    ${fieldRow('Distancia del nivel a A, d (m)','cn_d',3)}
    ${fieldRow('Lectura en mira A, a2 (m)','cn_a2',1.612)}
    ${fieldRow('Lectura en mira B, b2 (m)','cn_b2',1.381)}
    <button class="btn" id="btnCN" type="button">Calcular</button>
    <div id="resCN"></div>
  </div>${vrDatosHtml('chequeoNivel')}`;
  toolShell('chequeoNivel','Prueba de las dos estacas: determina el error de colimación de un nivel (línea de fe no horizontal) comparando el desnivel A–B medido desde el centro con el medido desde cerca de una de las miras.', body, []);
  vrWire();
  document.getElementById('btnCN').addEventListener('click', ()=>{
    const D=val('cn_D'), d=val('cn_d'), a1=val('cn_a1'), b1=val('cn_b1'), a2=val('cn_a2'), b2=val('cn_b2');
    const box=document.getElementById('resCN');
    if([D,d,a1,b1,a2,b2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todas las lecturas y distancias.</p>`; return; }
    if(D<=0 || d<0 || d>=D){ box.innerHTML=`<p class="err-msg">La distancia d debe ser menor que D y mayor o igual a 0.</p>`; return; }
    const r = calcNivelDosEstacas(a1,b1,a2,b2,D,d);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Desnivel verdadero A–B (posición 1)</span><span class="v">${fmtNum(r.dhTrue,4)} m</span></div>
      <div class="result-row"><span class="k">Desnivel aparente A–B (posición 2)</span><span class="v">${fmtNum(r.dhApp,4)} m</span></div>
      <div class="result-row"><span class="k">Error de colimación</span><span class="v accent big">${fmtNum(r.errMM30,1)} mm / 30 m</span></div>
      <div class="result-row"><span class="k">Lectura correcta en B (para ajustar)</span><span class="v">${fmtNum(r.bCorrecta,4)} m</span></div>
      <div class="result-row"><span class="k">Diagnóstico</span><span class="v" style="color:${r.ok?'inherit':'var(--accent)'}">${r.ok?'Dentro de tolerancia (≤3 mm/30 m)':'Fuera de tolerancia, requiere ajuste'}</span></div>
      <div class="plot-wrap">${svgNivelDosEstacas(a1,b1,a2,b2,D,d,r)}</div>
    </div>`;
  });
}

const RENDERERS = { chequeoNivel: renderChequeoNivel };
