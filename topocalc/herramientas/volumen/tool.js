"use strict";
/* Herramienta «Volúmenes de Tierra»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcVolumenTierra(A1,A2,D,Am){
  const vExtremas = D*(A1+A2)/2;
  const vPrismoidal = (Am!==undefined && !isNaN(Am)) ? (D/6)*(A1+4*Am+A2) : null;
  return {vExtremas, vPrismoidal};
}
function cubicacionHomogenea(A1,A2,D){
  const ratio = A2!==0 ? A1/A2 : Infinity;
  if(ratio>0.33 && ratio<3) return {metodo:'promedio', volumen: D*(A1+A2)/2};
  return {metodo:'corregida', volumen: D*(A1+A2+Math.sqrt(A1*A2))/3};
}
function cubicacionMixta(Sc,St,D){
  return { volCorte: (Sc*Sc/(Sc+St))*(D/2), volTerraplen: (St*St/(Sc+St))*(D/2) };
}
function svgVolumen(A1,A2,Am,ext){
  ext=ext||{}; const K=svgKit(), hasM=Am!==undefined&&!isNaN(Am), col={A1:'var(--blueprint)',A2:'var(--success)',Am:'var(--danger)',D:'var(--ink)',V:'var(--accent)'};
  const rows=[]; if(ext.V!==undefined) rows.push({k:'V',c:col.V,v:`${fmtNum(ext.V,2)} m³`}); if(ext.Vp!==undefined&&ext.Vp!==null) rows.push({k:'V prism.',c:col.V,v:`${fmtNum(ext.Vp,2)} m³`});
  rows.push({k:'A1',c:col.A1,v:`${fmtNum(A1,2)} m²`}); rows.push({k:'A2',c:col.A2,v:`${fmtNum(A2,2)} m²`}); if(hasM) rows.push({k:'Am',c:col.Am,v:`${fmtNum(Am,2)} m²`});
  if(ext.D!==undefined) rows.push({k:'D',c:col.D,v:`${fmtNum(ext.D,2)} m`});
  K.list([rows],{perCol:3});
  const top=Math.max(K.listBottom+16,50), base=152, maxA=Math.max(A1,A2,hasM?Am:0,1e-9), hmax=base-top, bw=26;
  const hf=A=>Math.max(3,A/maxA*hmax), x1=66, x2=254, xm=160, h1=hf(A1), h2=hf(A2), hm=hasM?hf(Am):0;
  // volumen entre las secciones
  K.poly([[x1+bw/2,base],[x1+bw/2,base-h1],[x2-bw/2,base-h2],[x2-bw/2,base]],{close:true,fill:col.V,fo:0.22,stroke:col.V,sw:0.8,dash:'2.4 2',obs:false});
  K.line(x1-bw/2-8,base,x2+bw/2+8,base,'var(--ink-soft)',{sw:0.7});
  const bar=(x,h,c)=>K.poly([[x-bw/2,base],[x-bw/2,base-h],[x+bw/2,base-h],[x+bw/2,base]],{close:true,fill:c,fo:0.18,stroke:c,sw:1.3});
  bar(x1,h1,col.A1); bar(x2,h2,col.A2); if(hasM) bar(xm,hm,col.Am);
  // cota D entre ejes de las secciones extremas
  const yd=base+13; K.line(x1,yd,x2,yd,col.D,{sw:0.9}); [x1,x2].forEach(x=>K.line(x,yd-2.5,x,yd+2.5,col.D,{sw:0.9,noObs:false}));
  K.lineLabel(x1,yd,x2,yd,'D',4.5,col.D,{out:[0,1],extras:[0,3]});
  K.pointLabel('A1',x1,base-h1,4.5,col.A1,{dir:[0,-1],omit:false,rmin:4,rmax:10});
  K.pointLabel('A2',x2,base-h2,4.5,col.A2,{dir:[0,-1],omit:false,rmin:4,rmax:10});
  if(hasM) K.pointLabel('Am',xm,base-hm,4.5,col.Am,{dir:[0,-1],omit:false,rmin:4,rmax:10});
  K.near('V',(x1+x2)/2+(hasM?36:0),base-Math.min(h1,h2)*0.45,4.5,col.V,{rmax:30});
  return K.svg();
}
function renderVolumen(){
  const body = `<div class="field-card">
    <h3>Áreas extremas / prismoidal</h3>
    <div class="field-inline2">${fieldRow('Área sección 1 — A1 (m²)','vo_a1',18.4)}${fieldRow('Área sección 2 — A2 (m²)','vo_a2',22.1)}</div>
    ${fieldRow('Distancia entre secciones D (m)','vo_d',20)}
    ${fieldRow('Área sección media — Am (opcional, m²)','vo_am','',{placeholder:'para método prismoidal'})}
    <button class="btn" id="btnVO" type="button">Calcular</button>
    <div id="resVO"></div>
  </div>
  <div class="field-card">
    <h3>Por razón de áreas (secciones muy distintas entre sí)</h3>
    <p class="tool-blurb" style="margin-top:0;">Cuando A1/A2 queda fuera de 0.33–3, el promedio simple de áreas subestima el volumen — usa en su lugar la fórmula corregida D·(A1+A2+√(A1·A2))/3.</p>
    <div class="field-inline2">${fieldRow('Área sección 1 — A1 (m²)','vh_a1',5.2)}${fieldRow('Área sección 2 — A2 (m²)','vh_a2',22.1)}</div>
    ${fieldRow('Distancia entre secciones D (m)','vh_d',20)}
    <button class="btn" id="btnVH" type="button">Calcular</button>
    <div id="resVH"></div>
  </div>
  <div class="field-card">
    <h3>Cubicación mixta (corte y terraplén en la misma sección)</h3>
    <p class="tool-blurb" style="margin-top:0;">Sección de transición donde parte es corte y parte es terraplén — reparte el volumen entre ambos según el área de cada uno.</p>
    <div class="field-inline2">${fieldRow('Área de corte Sc (m²)','vm_sc',12.5)}${fieldRow('Área de terraplén St (m²)','vm_st',8.3)}</div>
    ${fieldRow('Distancia a la siguiente sección D (m)','vm_d',20)}
    <button class="btn" id="btnVM" type="button">Calcular</button>
    <div id="resVM"></div>
  </div>`;
  toolShell('volumen','Volumen de movimiento de tierra entre dos secciones transversales: áreas extremas y prismoidal para el caso general, razón de áreas cuando las secciones son muy distintas entre sí, y reparto corte/terraplén para secciones de transición.', body);
  document.getElementById('btnVO').addEventListener('click', ()=>{
    const A1=val('vo_a1'), A2=val('vo_a2'), D=val('vo_d'), AmRaw=document.getElementById('vo_am').value;
    const Am = AmRaw===''? undefined : parseFloat(AmRaw);
    const box=document.getElementById('resVO');
    if([A1,A2,D].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las áreas y la distancia.</p>`; return; }
    const r = calcVolumenTierra(A1,A2,D,Am);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Volumen (áreas extremas)</span><span class="v accent big">${fmtNum(r.vExtremas,2)} m³</span></div>
      ${r.vPrismoidal!==null?`<div class="result-row"><span class="k">Volumen (prismoidal)</span><span class="v accent">${fmtNum(r.vPrismoidal,2)} m³</span></div>`:''}
      <div class="plot-wrap">${svgVolumen(A1,A2,Am,{D:D,V:r.vExtremas,Vp:r.vPrismoidal})}</div>
    </div>`;
  });
  document.getElementById('btnVH').addEventListener('click', ()=>{
    const A1=val('vh_a1'), A2=val('vh_a2'), D=val('vh_d');
    const box=document.getElementById('resVH');
    if([A1,A2,D].some(isNaN) || A1<0 || A2<0){ box.innerHTML=`<p class="err-msg">Completa las áreas (no negativas) y la distancia.</p>`; return; }
    const r = cubicacionHomogenea(A1,A2,D);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Método aplicado</span><span class="v">${r.metodo==='promedio'?'Promedio de áreas':'Razón de áreas (corregida)'}</span></div>
      <div class="result-row"><span class="k">Volumen</span><span class="v accent big">${fmtNum(r.volumen,2)} m³</span></div>
      <div class="plot-wrap">${svgVolumen(A1,A2,undefined,{D:D,V:r.volumen})}</div>
      <p class="tool-blurb" style="margin-top:6px;">Fórmula: coordenadas_de_una_curva.xlsx · hoja 'cubicacion'.</p>
    </div>`;
  });
  document.getElementById('btnVM').addEventListener('click', ()=>{
    const Sc=val('vm_sc'), St=val('vm_st'), D=val('vm_d');
    const box=document.getElementById('resVM');
    if([Sc,St,D].some(isNaN) || Sc<0 || St<0 || (Sc+St)<=0){ box.innerHTML=`<p class="err-msg">Completa ambas áreas (no negativas, con al menos una mayor a 0) y la distancia.</p>`; return; }
    const r = cubicacionMixta(Sc,St,D);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Volumen de corte</span><span class="v accent">${fmtNum(r.volCorte,2)} m³</span></div>
      <div class="result-row"><span class="k">Volumen de terraplén</span><span class="v accent">${fmtNum(r.volTerraplen,2)} m³</span></div>
      <div class="plot-wrap">${svgCorteTerraplen(Sc,St, "coordenadas_de_una_curva.xlsx · hoja 'cubicacion'")}</div>
    </div>`;
  });
}
function svgCorteTerraplen(Sc, St, fuente){
  const w=280,h=150,pad=26;
  const baseY=h/2;
  const maxA=Math.max(Sc,St,0.001);
  const hFor=A=>(A/maxA)*(h/2-pad);
  const hc=hFor(Sc), ht=hFor(St);
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pad}" y1="${baseY}" x2="${w-pad}" y2="${baseY}" stroke="var(--line-strong)" stroke-width="1.2"/>
    <rect x="${w/2-40}" y="${(baseY-hc).toFixed(1)}" width="80" height="${hc.toFixed(1)}" fill="var(--blueprint-soft)" stroke="var(--blueprint)" stroke-width="1.4"/>
    <rect x="${w/2-40}" y="${baseY.toFixed(1)}" width="80" height="${ht.toFixed(1)}" fill="var(--accent)" fill-opacity="0.18" stroke="var(--accent)" stroke-width="1.4"/>
    <text x="${w/2}" y="${(baseY-hc-8).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--blueprint)" text-anchor="middle">Sc (corte) = ${fmtNum(Sc,2)} m²</text>
    <text x="${w/2}" y="${(baseY+ht+14).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">St (terraplén) = ${fmtNum(St,2)} m²</text>
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}

const RENDERERS = { volumen: renderVolumen };
