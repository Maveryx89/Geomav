"use strict";
/* Herramienta «Ajuste de Cuadrilátero (Trilateración)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function heronArea(a,b,c){ const s=(a+b+c)/2; const t=s*(s-a)*(s-b)*(s-c); return t>0?Math.sqrt(t):0; }
function trilateracionCuadrilatero(a,b,c,d,e,f){
  const areaBCE = heronArea(b,c,e);
  const areaADE = heronArea(a,d,e);
  // Ángulos en el vértice común por LEY DE COSENOS: acos devuelve 0°-180° y por eso sirve también para ángulos obtusos
  // (el asin anterior nunca pasaba de 90°: un ángulo de 100° se mostraba como 80°).
  const clamp = x => Math.max(-1, Math.min(1, x));
  const alpha1 = toDeg(Math.acos(clamp((b*b + e*e - c*c)/(2*b*e))));   // entre b y e (triángulo BCE)
  const alpha2 = toDeg(Math.acos(clamp((a*a + e*e - d*d)/(2*a*e))));   // entre a y e (triángulo ADE)
  const alphaT = alpha1+alpha2;
  const ladoCalc = Math.sqrt(a*a+b*b-2*a*b*Math.cos(toRad(alphaT)));
  const cierre = f-ladoCalc;
  const errorRelativo = ladoCalc!==0 ? Math.abs(f/cierre) : Infinity;
  return {areaBCE, areaADE, alpha1, alpha2, alphaT, ladoCalc, cierre, errorRelativo};
}
function renderCuadrilateroTrilateracion(){
  const body = `<div class="field-card">
    <p class="tool-blurb" style="margin-top:0;">Cuadrilátero con 6 lados medidos: 4 perimetrales (a, b, c, d) + 2 diagonales (e = diagonal entre los vértices de a-b y c-d; f = la otra diagonal, la que se compara con el lado calculado como control de cierre).</p>
    <div class="field-inline2">${fieldRow('Lado a (m)','qt_a',120.50)}${fieldRow('Lado b (m)','qt_b',95.30)}</div>
    <div class="field-inline2">${fieldRow('Lado c (m)','qt_c',110.20)}${fieldRow('Lado d (m)','qt_d',105.80)}</div>
    <div class="field-inline2">${fieldRow('Diagonal e (m)','qt_e',150.60)}${fieldRow('Diagonal / lado de control f (m)','qt_f',160.40)}</div>
    <button class="btn" id="btnQT" type="button">Calcular</button>
    <div id="resQT"></div>
  </div>`;
  toolShell('cuadrilateroTrilateracion','Compensación de un cuadrilátero por trilateración: a partir de los 6 lados medidos, obtiene las áreas de los triángulos por la fórmula de Herón, deriva los ángulos en el vértice común y controla el cierre comparando el lado f medido contra el que resulta de la ley de cosenos.', body);
  document.getElementById('btnQT').addEventListener('click', ()=>{
    const a=val('qt_a'), b=val('qt_b'), c=val('qt_c'), d=val('qt_d'), e=val('qt_e'), f=val('qt_f');
    const box=document.getElementById('resQT');
    if([a,b,c,d,e,f].some(isNaN) || [a,b,c,d,e].some(v=>v<=0)){ box.innerHTML=`<p class="err-msg">Completa los 6 lados (mayores a 0).</p>`; return; }
    const triOk = (x,y,z)=> x+y>z && x+z>y && y+z>x;
    if(!triOk(b,c,e) || !triOk(a,d,e)){ box.innerHTML=`<p class="err-msg">Los lados no forman triángulos válidos: en cada triángulo (b, c, e) y (a, d, e) un lado debe ser menor que la suma de los otros dos.</p>`; return; }
    const r = trilateracionCuadrilatero(a,b,c,d,e,f);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Ángulo α1</span><span class="v">${fmtAngle(r.alpha1)}</span></div>
      <div class="result-row"><span class="k">Ángulo α2</span><span class="v">${fmtAngle(r.alpha2)}</span></div>
      <div class="result-row"><span class="k">Ángulo total (α1+α2)</span><span class="v">${fmtAngle(r.alphaT)}</span></div>
      <div class="result-row"><span class="k">Lado f calculado (ley de cosenos)</span><span class="v accent big">${fmtNum(r.ladoCalc,3)} m</span></div>
      <div class="result-row"><span class="k">Cierre (f medido − f calculado)</span><span class="v">${fmtNum(r.cierre,4)} m</span></div>
      <div class="result-row"><span class="k">Área del triángulo BCE</span><span class="v">${fmtNum(r.areaBCE,3)} m²</span></div>
      <div class="result-row"><span class="k">Área del triángulo ADE</span><span class="v">${fmtNum(r.areaADE,3)} m²</span></div>
      <div class="plot-wrap">${svgCuadrilatero('lados', "coordenadas_de_una_curva.xlsx · hoja 'trilateracion'")}</div>
    </div>`;
  });
}

const RENDERERS = { cuadrilateroTrilateracion: renderCuadrilateroTrilateracion };
