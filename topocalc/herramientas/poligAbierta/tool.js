"use strict";
/* Herramienta «Poligonal Abierta»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcPoligonalAbierta(E0,N0,tramos){
  // tramos: [{az, dist}] en grados decimales / metros
  const coordE=[E0], coordN=[N0];
  for(const t of tramos){
    const r = toRad(t.az);
    coordE.push(coordE[coordE.length-1] + t.dist*Math.sin(r));
    coordN.push(coordN[coordN.length-1] + t.dist*Math.cos(r));
  }
  const perimetro = tramos.reduce((a,t)=>a+t.dist,0);
  return {coordE, coordN, perimetro};
}
let paN = 4;
function renderPoligAbierta(){
  const body = `
  <div class="field-card">
    <h3>Punto de partida</h3>
    <div class="field-inline2">${fieldRow('Este inicial','pa_e0',5000)}${fieldRow('Norte inicial','pa_n0',10000)}</div>
    <div class="field-row"><label>Número de tramos</label>
      <div class="n-stepper">
        <button type="button" id="paMinus">−</button><span class="n-val" id="paNVal">${paN}</span><button type="button" id="paPlus">+</button>
      </div>
    </div>
  </div>
  <div id="paTramos"></div>
  <button class="btn" id="btnPA" type="button">Calcular</button>
  <div id="resPA"></div>`;
  toolShell('poligAbierta','Propaga coordenadas tramo a tramo a partir de azimutes y distancias — sin verificación de cierre, para levantamientos que no cierran sobre sí mismos.', body);
  const drawTramos = ()=>{
    let html='';
    for(let i=0;i<paN;i++){
      html += `<div class="station-block">
        <div class="st-label">Tramo ${i+1}</div>
        ${angleFieldHTML(`pa_az_${i}`, 60+i*15, 'Azimut')}
        <div class="field-row"><label>Distancia (m)</label><input type="number" step="any" id="pa_d_${i}" value="${(40+i*8).toFixed(1)}"></div>
      </div>`;
    }
    document.getElementById('paTramos').innerHTML = html;
  };
  drawTramos();
  document.getElementById('paMinus').addEventListener('click', ()=>{ if(paN>1){paN--; document.getElementById('paNVal').textContent=paN; drawTramos();}});
  document.getElementById('paPlus').addEventListener('click', ()=>{ if(paN<15){paN++; document.getElementById('paNVal').textContent=paN; drawTramos();}});
  document.getElementById('btnPA').addEventListener('click', ()=>{
    const E0=val('pa_e0'), N0=val('pa_n0');
    const tramos=[];
    for(let i=0;i<paN;i++){ tramos.push({az:readAngleField(`pa_az_${i}`), dist:val(`pa_d_${i}`)}); }
    const box=document.getElementById('resPA');
    if(isNaN(E0)||isNaN(N0)||tramos.some(t=>isNaN(t.az)||isNaN(t.dist))){ box.innerHTML=`<p class="err-msg">Revisa que todos los campos estén completos.</p>`; return; }
    const r = calcPoligonalAbierta(E0,N0,tramos);
    let rows='';
    for(let i=0;i<r.coordE.length;i++){
      rows += `<tr><td>${i===0?'Inicio':'P'+i}</td><td>${fmtNum(r.coordE[i],3)}</td><td>${fmtNum(r.coordN[i],3)}</td></tr>`;
    }
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Distancia total recorrida</span><span class="v accent big">${fmtNum(r.perimetro,2)} m</span></div>
      <div class="table-wrap" style="margin-top:10px;"><table class="data-table"><thead><tr><th>Punto</th><th>Este</th><th>Norte</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="plot-wrap">${svgOpenPath(r.coordE, r.coordN)}</div>
    </div>`;
  });
}
function svgOpenPath(coordE, coordN){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const n = coordE.length - 1;                       // tramos
  const dist=[], az=[];
  for(let i=0;i<n;i++){
    const dE=coordE[i+1]-coordE[i], dN=coordN[i+1]-coordN[i];
    dist.push(Math.hypot(dE,dN));
    az.push(((Math.atan2(dE,dN)*180/Math.PI)%360+360)%360);
  }
  const total = dist.reduce((a,b)=>a+b,0);
  const ptName = i => i===0 ? 'Inicio' : 'P'+i;
  const corto = n > 8;
  const dTxt = i => `${fmtNum(dist[i],2)} m`;
  const aTxt = i => fmtAngle(az[i]);

  // ---- listado: columnas de 10 filas (tramos + total) y luego (azimutes) ----
  const PER_COL=10, ROW_Y0=12.521, ROW_DY=5.761, FS_L=4.32;
  const dRows=[]; for(let i=0;i<n;i++) dRows.push({k:'T'+(i+1), c:'var(--blueprint)', v:dTxt(i)});
  dRows.push({k:'Total recorrido', c:'var(--accent)', v:`${fmtNum(total,2)} m`});
  const aRows=[]; for(let i=0;i<n;i++) aRows.push({k:'Az'+(i+1), c:'var(--success)', v:aTxt(i)});
  const place = (rows, x0) => {                      // devuelve {items, xEnd}
    const nc=Math.ceil(rows.length/PER_COL), items=[]; let x=x0;
    for(let c=0;c<nc;c++){
      const part=rows.slice(c*PER_COL,(c+1)*PER_COL);
      const w=Math.max(...part.map(r=>eng.tw(`${r.k} = ${r.v}`,FS_L)))+5.2;
      part.forEach((r,j)=>items.push({r, x, y:ROW_Y0+j*ROW_DY}));
      x += Math.max(w+9, 70);
    }
    return {items, xEnd:x};
  };
  const L1 = place(dRows, 10.026), L2 = place(aRows, L1.xEnd);
  const items = L1.items.concat(L2.items);
  let listRight=0, listBottom=0;
  items.forEach(it=>{ const w=eng.tw(`${it.r.k} = ${it.r.v}`,FS_L); listRight=Math.max(listRight,it.x+5.2+w+1); listBottom=Math.max(listBottom,it.y+1); });
  eng.rectFill(8.5, 6.5, listRight, listBottom+0.5);
  eng.rectFill(292, 3, 308, 38);                      // flecha norte

  // ---- recorrido a escala ----
  const left=50, right=270, top=Math.max(52, listBottom+8), bot=160;
  const minE=Math.min(...coordE), maxE=Math.max(...coordE), minN=Math.min(...coordN), maxN=Math.max(...coordN);
  const spanE=maxE-minE, spanN=maxN-minN;
  let sc = Math.min((right-left)/Math.max(spanE,1e-6), (bot-top)/Math.max(spanN,1e-6));
  if(!isFinite(sc) || spanE+spanN<1e-6) sc=1;
  const ox=(left+right)/2-(spanE*sc)/2, oy=(top+bot)/2+(spanN*sc)/2;
  const V=coordE.map((e,i)=>({x:ox+(e-minE)*sc, y:oy-(coordN[i]-minN)*sc}));

  let out='';
  out += `<path d="M${V.map(p=>f(p.x)+' '+f(p.y)).join(' L')}" fill="none" stroke="var(--blueprint)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  for(let i=0;i<n;i++) eng.seg(V[i].x,V[i].y,V[i+1].x,V[i+1].y);
  V.forEach((p,i)=>{ const r=i===0?2.686:2; out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${r}" fill="${i===0?'var(--ink)':'var(--ink-soft)'}"/>\n`; eng.circle(p.x,p.y,r+0.3); });
  out += `<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n`;
  out += `<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`;

  const lab=(t,fs,col,c)=>{ const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  // normal del tramo i hacia el lado convexo del giro (el otro lado queda para el azimut)
  const nrm = i => {
    const a=V[i], b=V[i+1], dx=b.x-a.x, dy=b.y-a.y, l=Math.hypot(dx,dy)||1; let nx=dy/l, ny=-dx/l, turn=0;
    if(i>0){ const p=V[i-1]; turn+=(a.x-p.x)*dy-(a.y-p.y)*dx; }
    if(i<n-1){ const q=V[i+2]; turn+=dx*(q.y-b.y)-dy*(q.x-b.x); }
    return turn<=0 ? [nx,ny] : [-nx,-ny];
  };

  // vértices: hacia el lado exterior; Inicio y último, "detrás" de su tramo
  for(let i=0;i<=n;i++){
    let ux,uy;
    if(i===0){ const d=Math.hypot(V[1].x-V[0].x,V[1].y-V[0].y)||1; ux=(V[0].x-V[1].x)/d; uy=(V[0].y-V[1].y)/d; }
    else if(i===n){ const d=Math.hypot(V[n].x-V[n-1].x,V[n].y-V[n-1].y)||1; ux=(V[n].x-V[n-1].x)/d; uy=(V[n].y-V[n-1].y)/d; }
    else { const a=nrm(i-1), b=nrm(i); ux=a[0]+b[0]; uy=a[1]+b[1]; const l=Math.hypot(ux,uy)||1; ux/=l; uy/=l; }
    const t=ptName(i), cands=[];
    for(let r=(i===0?5.2:4.8); r<=12; r+=1.2) for(let da=-80; da<=80; da+=16){
      const ca=Math.cos(da*Math.PI/180), sa=Math.sin(da*Math.PI/180), vx=ux*ca-uy*sa, vy=ux*sa+uy*ca;
      cands.push({x:V[i].x+vx*r, y:V[i].y+vy*r+1.6, anchor:'middle', pen:(r-4.8)*1.5+Math.abs(da)*0.05});
    }
    lab(t,4.7,i===0?'var(--ink)':'var(--ink-soft)',eng.pick(t,4.7,cands));
  }

  // tramos: distancia por el lado convexo, azimut por el opuesto; se desliza, se aleja o cambia de lado si no cabe
  const sideLabel = (i, t, col, sgn) => {
    const p=V[i], q=V[i+1], dx=q.x-p.x, dy=q.y-p.y, len=Math.hypot(dx,dy)||1;
    let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, g=[Math.sin(th),-Math.cos(th)], u=[Math.cos(th),Math.sin(th)], no=nrm(i);
    const mx=(p.x+q.x)/2, my=(p.y+q.y)/2, tmax=Math.max(0,len/2-eng.tw(t,4)/2-3), cands=[];
    for(let s=0;s<=tmax+1e-6;s+=2.5) for(const sg of [1,-1]){ if(s===0&&sg===-1) continue;
      [[sgn,0],[sgn,3.6],[sgn,7.2],[sgn,10.8],[-sgn,0],[-sgn,3.6]].forEach(([side,extra],si)=>{
        const nn=[no[0]*side,no[1]*side], d=((g[0]*nn[0]+g[1]*nn[1])>0?1.9:4.8)+extra;
        cands.push({x:mx+u[0]*s*sg+nn[0]*d, y:my+u[1]*s*sg+nn[1]*d, rot:ang, anchor:'middle', pen:s*0.4+(side!==sgn?10:0)+extra*1.2});
      });
    }
    // si ninguna posición queda libre, el rótulo se omite del dibujo (el valor sigue en el listado)
    if(Math.min(...cands.map(c=>eng.count(eng.box(t,4,c),0.5)))>0) return;
    lab(t,4,col,eng.pick(t,4,cands));
  };
  for(let i=0;i<n;i++){
    sideLabel(i, corto?dTxt(i):`T${i+1} = ${dTxt(i)}`, 'var(--blueprint)', 1);
    sideLabel(i, corto?aTxt(i):`Az${i+1} = ${aTxt(i)}`, 'var(--success)', -1);
  }

  // listado
  items.forEach(it=>{
    out += `<rect x="${f(it.x)}" y="${f(it.y-3.457)}" width="3.457" height="3.457" fill="${it.r.c}"/>\n`;
    out += `<text x="${f(it.x+5.185)}" y="${f(it.y)}" ${FONT} font-size="${FS_L}"><tspan fill="${it.r.c}">${it.r.k}</tspan><tspan fill="var(--ink)"> = ${it.r.v}</tspan></text>\n`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}

const RENDERERS = { poligAbierta: renderPoligAbierta };
