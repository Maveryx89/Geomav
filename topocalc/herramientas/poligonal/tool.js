"use strict";
/* Herramienta «Poligonal Cerrada»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function smallUnitLabel(){ return angleSystem === 'cent' ? 'cc' : '"'; }
function degToSmallUnit(deg){ return angleSystem === 'cent' ? deg*(400*10000/360) : deg*3600; }
function smallUnitToDeg(v){ return angleSystem === 'cent' ? v*(360/(400*10000)) : v/3600; }
function calcPoligonal(n, azimutAB, minDivDeg, angDec, estaciones, E0, N0, metodo){
  const sumaObs = angDec.reduce((a,b)=>a+b,0);
  const sumaTeo = 180*(n-2);
  const EcDeg = sumaTeo - sumaObs;
  const maxErrDeg = minDivDeg*Math.sqrt(n);
  const corrPer = EcDeg/n;
  const angCorr = angDec.map(a => a + corrPer);

  const az = new Array(n);
  az[0] = azimutAB;
  const adjust = raw => raw >= 180 ? raw-180 : raw+180;
  for(let i=1;i<n;i++){
    az[i] = adjust(az[i-1] + angCorr[i]);
  }
  const azN = az.map(normDeg);
  const rumbos = azN.map(azToRumbo);

  const dist = estaciones.map(e => e.dist);
  const Eraw = azN.map((a,i) => dist[i]*Math.sin(toRad(a)));
  const Nraw = azN.map((a,i) => dist[i]*Math.cos(toRad(a)));

  const sumEpos = Eraw.filter(v=>v>0).reduce((a,b)=>a+b,0);
  const sumEneg = Eraw.filter(v=>v<0).reduce((a,b)=>a-b,0);
  const sumNpos = Nraw.filter(v=>v>0).reduce((a,b)=>a+b,0);
  const sumNneg = Nraw.filter(v=>v<0).reduce((a,b)=>a-b,0);

  const errEW = round(sumEpos - sumEneg, 3);
  const errNS = round(sumNpos - sumNneg, 3);
  const perimetro = dist.reduce((a,b)=>a+b,0);

  let Eadj, Nadj;
  if(metodo === 'bowditch'){
    // Regla de Bowditch (compás): correccion proporcional a la distancia del lado
    Eadj = Eraw.map((v,i) => v - errEW*(dist[i]/perimetro));
    Nadj = Nraw.map((v,i) => v - errNS*(dist[i]/perimetro));
  } else {
    // Regla del Transito (default): correccion proporcional a la proyeccion absoluta del lado
    const AO = (sumEpos+sumEneg) !== 0 ? errEW/(sumEpos+sumEneg) : 0;
    const AP = (sumNpos+sumNneg) !== 0 ? errNS/(sumNpos+sumNneg) : 0;
    Eadj = Eraw.map(v => v - AO*v);
    Nadj = Nraw.map(v => v - AP*v);
  }

  const coordE = [E0], coordN = [N0];
  for(let i=0;i<n;i++){
    coordE.push(coordE[coordE.length-1] + Eadj[i]);
    coordN.push(coordN[coordN.length-1] + Nadj[i]);
  }

  const errLineal = Math.sqrt(errEW*errEW + errNS*errNS);
  const precision = errLineal > 0 ? perimetro/errLineal : Infinity;

  let area2 = 0;
  for(let i=0;i<n;i++){
    const x1=coordE[i], y1=coordN[i];
    const x2=coordE[(i+1)%n], y2=coordN[(i+1)%n];
    area2 += x1*y2 - x2*y1;
  }
  const areaM2 = Math.abs(area2)/2;

  return {sumaObs,sumaTeo,EcDeg,maxErrDeg,angCorr,az:azN,rumbos,dist,coordE,coordN,
          errEW,errNS,perimetro,errLineal,precision,areaM2,areaHa:areaM2/10000,
          dentroTolerancia: Math.abs(EcDeg) <= maxErrDeg, metodo: metodo==='bowditch'?'bowditch':'transit'};
}
let polN = 5;
function renderPoligonal(){
  const body = `
  <div class="field-card">
    <h3>Datos generales</h3>
    <div class="field-row">
      <label>Número de lados</label>
      <div class="n-stepper">
        <button type="button" id="polMinus">−</button>
        <span class="n-val" id="polNVal">${polN}</span>
        <button type="button" id="polPlus">+</button>
      </div>
    </div>
    ${angleFieldHTML('pol_az', 105.9061111, 'Azimut del lado 1 (A→B)')}
    <div class="field-inline2">
      ${fieldRow(`Mínima div. limbo (${smallUnitLabel()})`,'pol_min', angleSystem==='cent'? 62:20)}
    </div>
    ${libretaBloqueHTML('pol_lib','Punto A (inicial) desde la Libreta')}
    <div class="field-inline2">
      ${fieldRow('Coord. Este inicial','pol_e0',257966.91)}
      ${fieldRow('Coord. Norte inicial','pol_n0',6076388.97)}
    </div>
    <div class="field-row"><label for="pol_metodo">Método de compensación</label>
      <select id="pol_metodo"><option value="transit" selected>Regla del Tránsito</option><option value="bowditch">Regla de Bowditch (Compás)</option></select></div>
  </div>
  <div id="polStations"></div>
  <button class="btn" id="btnPol" type="button">Calcular Poligonal</button>
  <div id="resPol"></div>`;
  toolShell('poligonal','Calcula el cierre angular, ajusta coordenadas por regla del Tránsito o de Bowditch (a elección), obtiene coordenadas, error de cierre y área de una poligonal cerrada de campo.', body, ['Ec']);
  renderPolStations();
  polOrigenMeta = null;
  libretaTraerA('pol_lib','pol_e0','pol_n0', m=>{ polOrigenMeta = m; });
  document.getElementById('polMinus').addEventListener('click', ()=>{ if(polN>3){polN--; document.getElementById('polNVal').textContent=polN; renderPolStations();}});
  document.getElementById('polPlus').addEventListener('click', ()=>{ if(polN<16){polN++; document.getElementById('polNVal').textContent=polN; renderPolStations();}});
  document.getElementById('btnPol').addEventListener('click', calcularPoligonalUI);
}
let polOrigenMeta = null;
function polEjemplo(n){
  const AZ_AB = 105.9061111, paso = 2*Math.PI/n, R = 150/(2*Math.sin(Math.PI/n));
  const irr = Math.min(1, 4/n);   // con más lados, menos irregularidad: el polígono sigue siendo convexo (ángulos < 180°)
  let P = [];
  for(let k=0;k<n;k++){
    const t = paso*(k + 0.2*irr*Math.sin(1.9*k + 0.5)), r = R*(1 + 0.12*irr*Math.sin(2.7*k + 1.1));
    P.push([r*Math.cos(t), r*Math.sin(t)]);   // [Este, Norte]
  }
  const angulos = pts=>{
    const az = pts.map((p,k)=>{ const q = pts[(k+1)%n]; return normDeg(toDeg(Math.atan2(q[0]-p[0], q[1]-p[1]))); });
    const rot = AZ_AB - az[0];
    const azr = az.map(a=>normDeg(a + rot));
    return {ang: azr.map((a,k)=>normDeg(a - azr[(k-1+n)%n] - 180)), dist: pts.map((p,k)=>{ const q = pts[(k+1)%n]; return Math.hypot(q[0]-p[0], q[1]-p[1]); })};
  };
  let g = angulos(P);
  // el cálculo usa ángulos internos: si el recorrido dio los externos, se recorre en el otro sentido
  if(Math.abs(g.ang.reduce((a,b)=>a+b,0) - 180*(n-2)) > 1e-6){ P = [P[0], ...P.slice(1).reverse()]; g = angulos(P); }
  return g.ang.map((a,k)=>({
    deg: Math.round((a + Math.round(3*Math.sin(2.1*k + 0.3))/3600)*3600)/3600,
    dist: Math.round((g.dist[k] + Math.round(2*Math.sin(1.3*k + 0.7))/100)*100)/100
  }));
}
function renderPolStations(){
  const wrap = document.getElementById('polStations');
  let html='';
  const ej = polEjemplo(polN);
  for(let i=0;i<polN;i++){
    const ex = ej[i], exDeg = ex.deg;
    html += `<div class="station-block">
      <div class="st-label">Estación ${POL_LABELS[i]} — ángulo interno</div>
      ${angleFieldHTML(`pol_ang_${i}`, exDeg, 'Ángulo')}
      <div class="field-row"><label>Distancia al siguiente vértice (m)</label>
      <input type="number" step="any" id="pol_dist_${i}" value="${ex.dist}"></div>
    </div>`;
  }
  wrap.innerHTML = html;
}
function calcularPoligonalUI(){
  const box = document.getElementById('resPol');
  const azAB = readAngleField('pol_az');
  const minDiv = smallUnitToDeg(val('pol_min'));
  const E0 = val('pol_e0'), N0 = val('pol_n0');
  const angDec = [], dists = [];
  for(let i=0;i<polN;i++){
    angDec.push(readAngleField(`pol_ang_${i}`));
    dists.push(val(`pol_dist_${i}`));
  }
  if(angDec.some(isNaN) || dists.some(isNaN) || isNaN(azAB) || isNaN(minDiv)){
    box.innerHTML = `<p class="err-msg">Revisa que todos los campos estén completos y sean numéricos.</p>`;
    return;
  }
  const estaciones = dists.map(dist => ({dist}));
  const metodo = document.getElementById('pol_metodo').value;
  const r = calcPoligonal(polN, azAB, minDiv, angDec, estaciones, E0, N0, metodo);

  let tableRows='';
  for(let i=0;i<polN;i++){
    tableRows += `<tr>
      <td>${POL_LABELS[i]}</td>
      <td>${fmtAngle(r.az[i])}</td>
      <td>${r.rumbos[i].ns}${fmtAngle(r.rumbos[i].ang).replace(/^-/,'')} ${r.rumbos[i].ew}</td>
      <td>${fmtNum(r.dist[i],2)}</td>
      <td>${fmtNum(r.coordE[i],3)}</td>
      <td>${fmtNum(r.coordN[i],3)}</td>
    </tr>`;
  }

  const pill = r.dentroTolerancia
    ? `<span class="pill ok"><span class="dot"></span>Dentro de tolerancia</span>`
    : `<span class="pill bad"><span class="dot"></span>Fuera de tolerancia</span>`;

  box.innerHTML = `
  <div class="results" style="margin-top:14px;">
    <h3>Cierre angular</h3>
    <div class="result-row"><span class="k">Suma observada</span><span class="v">${fmtAngle(r.sumaObs)}</span></div>
    <div class="result-row"><span class="k">Suma teórica (n-2)×${angleSystem==='cent'?'200ᵍ':'180°'}</span><span class="v">${fmtAngle(r.sumaTeo)}</span></div>
    <div class="result-row"><span class="k">Error angular (Ec)</span><span class="v accent">${fmtNum(degToSmallUnit(r.EcDeg),1)} ${smallUnitLabel()}</span></div>
    <div class="result-row"><span class="k">Máximo permitido</span><span class="v">± ${fmtNum(degToSmallUnit(r.maxErrDeg),1)} ${smallUnitLabel()}</span></div>
    <div class="result-row"><span class="k">Estado</span><span class="v">${pill}</span></div>
  </div>
  <div class="results" style="margin-top:12px;">
    <h3>Cierre lineal y área</h3>
    <div class="result-row"><span class="k">Método de compensación</span><span class="v">${r.metodo==='bowditch'?'Bowditch (Compás)':'Tránsito'}</span></div>
    <div class="result-row"><span class="k">Perímetro</span><span class="v">${fmtNum(r.perimetro,2)} m</span></div>
    <div class="result-row"><span class="k">Error de cierre lineal</span><span class="v">${fmtNum(r.errLineal,4)} m</span></div>
    <div class="result-row"><span class="k">Precisión relativa</span><span class="v">1 : ${fmtNum(r.precision,0)}</span></div>
    <div class="result-row"><span class="k">Área</span><span class="v accent big">${fmtNum(r.areaHa,4)} ha</span></div>
    <div class="result-row"><span class="k">Área</span><span class="v">${fmtNum(r.areaM2,2)} m²</span></div>
  </div>
  <div class="results" style="margin-top:12px;">
    <h3>Estaciones, azimut y coordenadas</h3>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Est.</th><th>Azimut</th><th>Rumbo</th><th>Dist.</th><th>Este</th><th>Norte</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table></div>
    <div class="plot-wrap">${svgPoligonalCerrada(r.coordE, r.coordN)}</div>
  </div>`;

  const csvRows = ['nombre,este,norte,cota'];
  for(let i=0;i<polN;i++) csvRows.push(`${POL_LABELS[i]},${r.coordE[i]},${r.coordN[i]},`);
  addCSVButton(box, 'poligonal.csv', csvRows.join('\n'));
  addExportButtons(box, 'poligonal', {
    dxf: ()=> coordsToDXFPolyline(r.coordE.slice(0,polN), r.coordN.slice(0,polN), true),
    kml: ()=>{ const pr=loadMapaZonaPref(), om=polOrigenMeta||{}; return coordsToKMLPolygon(r.coordE.slice(0,polN), r.coordN.slice(0,polN), om.huso||pr.zona, om.hemi||pr.hemi, 'Poligonal Cerrada'); }
  });

  const btnGuardar = document.createElement('button');
  btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px'; btnGuardar.style.marginLeft='8px';
  btnGuardar.textContent='💾 Guardar vértices en la Libreta';
  btnGuardar.addEventListener('click', ()=>{
    const grupo = (flujoRetorno==='flujoPredio') ? flujoPredioNombre() : ('Poligonal ' + fechaCorta());
    const meta = Object.assign({}, polOrigenMeta||{}, {grupo});
    for(let i=0;i<polN;i++) agregarPunto(POL_LABELS[i], r.coordE[i], r.coordN[i], null, '', meta);
    btnGuardar.textContent = `Guardado (${polN} puntos, grupo «${grupo}») ✓`;
  });
  box.appendChild(btnGuardar);
}
function svgPoligonalCerrada(coordE, coordN){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const n = coordE.length - 1;
  const P0 = coordE.slice(0,n).map((e,i)=>({e, n:coordN[i]}));
  const dist = P0.map((p,i)=>{ const q=P0[(i+1)%n]; return Math.hypot(q.e-p.e, q.n-p.n); });
  const perim = dist.reduce((a,b)=>a+b,0);
  let a2 = 0; for(let i=0;i<n;i++){ const p=P0[i], q=P0[(i+1)%n]; a2 += p.e*q.n - q.e*p.n; }
  const areaM2 = Math.abs(a2)/2, areaHa = areaM2/10000;
  const sideName = i => POL_LABELS[i] + POL_LABELS[(i+1)%n];
  const corto = n > 8;                         // muchos lados: en el dibujo solo el valor
  const dTxt = i => `${fmtNum(dist[i],2)} m`;

  // ---- listado (arriba a la izquierda, columnas de 10 filas) ----
  const rows = [];
  for(let i=0;i<n;i++) rows.push({k:sideName(i), c:'var(--blueprint)', v:dTxt(i)});
  rows.push({k:'Perímetro', c:'var(--success)', v:`${fmtNum(perim,2)} m`});
  rows.push({k:'Área', c:'var(--accent)', v:`${fmtNum(areaHa,4)} ha`});
  const PER_COL=10, COL_W=70, ROW_Y0=12.521, ROW_DY=5.761;
  const nCols = Math.ceil(rows.length/PER_COL);
  const maxRowW = Math.max(...rows.map(r=>eng.tw(`${r.k} = ${r.v}`,4.32)));
  const listRight = 15.2 + COL_W*(nCols-1) + maxRowW + 1;
  const listBottom = ROW_Y0 + (Math.min(rows.length,PER_COL)-1)*ROW_DY + 1;
  eng.rectFill(8.5, 6.5, listRight, listBottom+0.5);
  eng.rectFill(292, 3, 308, 38);                                  // flecha norte

  // ---- polígono a escala dentro de la caja libre (a la derecha del listado y bajo él) ----
  const top = Math.max(50, listBottom+7), bot = 168;
  const left = 75, right = 265;
  const minE=Math.min(...P0.map(p=>p.e)), maxE=Math.max(...P0.map(p=>p.e));
  const minN=Math.min(...P0.map(p=>p.n)), maxN=Math.max(...P0.map(p=>p.n));
  const spanE=Math.max(maxE-minE,0.001), spanN=Math.max(maxN-minN,0.001);
  const sc = Math.min((right-left)/spanE, (bot-top)/spanN);
  const ox = (left+right)/2 - (spanE*sc)/2, oy = (top+bot)/2 + (spanN*sc)/2;
  const V = P0.map(p=>({x: ox+(p.e-minE)*sc, y: oy-(p.n-minN)*sc}));
  const s2 = V.reduce((s,p,i)=>{ const q=V[(i+1)%n]; return s + p.x*q.y - q.x*p.y; },0);     // orientación en pantalla

  let out = '';
  out += `<path d="M${V.map(p=>f(p.x)+' '+f(p.y)).join(' L')} Z" fill="var(--accent)" fill-opacity="0.14" stroke="none"/>\n`;
  V.forEach((p,i)=>{
    const q=V[(i+1)%n];
    out += `<path d="M${f(p.x)} ${f(p.y)} L${f(q.x)} ${f(q.y)}" fill="none" stroke="var(--blueprint)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
    eng.seg(p.x,p.y,q.x,q.y);
  });
  V.forEach(p=>{ out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="2" fill="var(--ink-soft)"/>\n`; eng.circle(p.x,p.y,2.3); });
  // norte
  out += `<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n`;
  out += `<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`;

  const lab = (t, fs, col, c) => { const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const outN = (i) => { const p=V[i], q=V[(i+1)%n], dx=q.x-p.x, dy=q.y-p.y, l=Math.hypot(dx,dy)||1; const k = s2>0 ? 1 : -1; return [k*dy/l, -k*dx/l]; };

  // lados: a lo largo de su línea, por fuera; si no cabe, se desliza, se aleja o pasa al interior
  for(let i=0;i<n;i++){
    const p=V[i], q=V[(i+1)%n], dx=q.x-p.x, dy=q.y-p.y, len=Math.hypot(dx,dy)||1;
    let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, g=[Math.sin(th), -Math.cos(th)], u=[Math.cos(th), Math.sin(th)], no=outN(i);
    const mx=(p.x+q.x)/2, my=(p.y+q.y)/2;
    const t = corto ? dTxt(i) : `${sideName(i)} = ${dTxt(i)}`;
    const tmax = Math.max(0, len/2 - eng.tw(t,4)/2 - 3), cands=[];
    for(let s=0;s<=tmax+1e-6;s+=2.5) for(const sg of [1,-1]){ if(s===0&&sg===-1) continue;
      [[1,0],[1,3.6],[1,7.2],[1,10.8],[-1,0],[-1,3.6]].forEach(([side,extra],si)=>{
        const nn=[no[0]*side,no[1]*side], d=((g[0]*nn[0]+g[1]*nn[1])>0 ? 1.9 : 4.8)+extra;
        cands.push({x:mx+u[0]*s*sg+nn[0]*d, y:my+u[1]*s*sg+nn[1]*d, rot:ang, anchor:'middle', pen:s*0.4+(side<0?10:0)+extra*1.2});
      });
    }
    lab(t,4,'var(--blueprint)',eng.pick(t,4,cands));
  }
  // vértices: letra hacia afuera
  for(let i=0;i<n;i++){
    const a=outN((i+n-1)%n), b=outN(i); let ux=a[0]+b[0], uy=a[1]+b[1]; const l=Math.hypot(ux,uy)||1; ux/=l; uy/=l;
    const cands=[];
    for(let r=4.6; r<=11; r+=1.2) for(let da=-70; da<=70; da+=14){
      const ca=Math.cos(da*Math.PI/180), sa=Math.sin(da*Math.PI/180), vx=ux*ca-uy*sa, vy=ux*sa+uy*ca;
      cands.push({x:V[i].x+vx*r, y:V[i].y+vy*r+1.6, anchor:'middle', pen:(r-4.6)*1.5+Math.abs(da)*0.05});
    }
    lab(POL_LABELS[i],4.5,'var(--ink-soft)',eng.pick(POL_LABELS[i],4.5,cands));
  }
  // área: en el interior, lo más lejos posible de los bordes
  {
    const inside = (x,y) => { let c=false; for(let i=0,j=n-1;i<n;j=i++){ const a=V[i], b=V[j]; if(((a.y>y)!==(b.y>y)) && (x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)) c=!c; } return c; };
    const dEdge = (x,y) => { let m=1e9; for(let i=0;i<n;i++){ const a=V[i], b=V[(i+1)%n], dx=b.x-a.x, dy=b.y-a.y, l2=dx*dx+dy*dy||1; let t=((x-a.x)*dx+(y-a.y)*dy)/l2; t=Math.max(0,Math.min(1,t)); m=Math.min(m,Math.hypot(x-a.x-t*dx,y-a.y-t*dy)); } return m; };
    const t=`Área = ${fmtNum(areaHa,4)} ha`, cands=[]; let best=0;
    const xs=V.map(p=>p.x), ys=V.map(p=>p.y);
    const pts=[]; for(let x=Math.min(...xs); x<=Math.max(...xs); x+=2.5) for(let y=Math.min(...ys); y<=Math.max(...ys); y+=2.5) if(inside(x,y)){ const d=dEdge(x,y); pts.push([x,y,d]); best=Math.max(best,d); }
    pts.forEach(([x,y,d])=> cands.push({x, y:y+1.5, anchor:'middle', pen:(best-d)*0.8}));
    const tw0=eng.tw(t,4.5), mxx=Math.max(...xs), mnx=Math.min(...xs), my0=(Math.min(...ys)+Math.max(...ys))/2;
    for(let dy=-40; dy<=40; dy+=6){ cands.push({x:mxx+8+tw0/2, y:my0+dy, anchor:'middle', pen:30+Math.abs(dy)*0.1}); cands.push({x:mnx-8-tw0/2, y:my0+dy, anchor:'middle', pen:30+Math.abs(dy)*0.1}); }
    if(!cands.length) cands.push({x:(Math.min(...xs)+Math.max(...xs))/2, y:(Math.min(...ys)+Math.max(...ys))/2, anchor:'middle', pen:0});
    lab(t,4.5,'var(--accent)',eng.pick(t,4.5,cands));
  }

  // listado: el valor a continuación de su descriptor
  rows.forEach((r,idx)=>{
    const col=Math.floor(idx/PER_COL), row=idx%PER_COL, oxl=COL_W*col, by=ROW_Y0+row*ROW_DY;
    out += `<rect x="${f(10.026+oxl)}" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n`;
    out += `<text x="${f(15.211+oxl)}" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.k}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}

const RENDERERS = { poligonal: renderPoligonal };
