"use strict";
/* Herramienta «Nivelación Diferencial»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcNivelacionDiferencial(cotaBM, filas){
  // filas: [{bs, fs}] — bs = vista atrás (lectura +), fs = vista adelante (lectura -)
  let cota = cotaBM, hi = null;
  const out = [];
  for(const f of filas){
    if(!isNaN(f.bs)){ hi = cota + f.bs; }
    if(!isNaN(f.fs)){ cota = hi - f.fs; }
    out.push({bs:f.bs, fs:f.fs, hi, cota});
  }
  return out;
}
function svgNivelacionDiferencial(cotas, filas){
  const n = filas.length;
  const nPts = cotas.length;
  if(nPts<2 || n<1) return '';

  // ---- estaciones de nivel: cada fila con BS abre una estación; las filas sin BS son FS adicionales de la misma estación ----
  const stations = [];
  let i = 0;
  while(i<n){
    const fromPt = i;
    const hi = cotas[fromPt] + filas[i].bs;
    const toPts = [];
    let j = i;
    do{
      toPts.push(j+1);
      j++;
    } while(j<n && !isFinite(filas[j].bs));
    stations.push({fromPt, row0:i, toPts, hi});
    i = j;
  }

  // ---- mapa de alturas (esquemático): el valor mínimo va a y=150 y el máximo (cota o HI) a y=95 ----
  const W=320, H=190, yBot=150, yTop=95;
  const allVals = [...cotas, ...stations.map(s=>s.hi)].filter(isFinite);
  const minC=Math.min(...allVals), maxC=Math.max(...allVals);
  const span=Math.max(maxC-minC, 0.001);
  const py = v => yBot - ((v-minC)/span)*(yBot-yTop);

  // ---- posiciones horizontales: separación de la plantilla (67,5), centradas; se comprime si hay muchos puntos ----
  const nSeg = nPts-1;
  const sp = Math.min(67.5, 212/nSeg);
  const x0 = 182.5 - (nSeg*sp)/2;
  const ptX = cotas.map((_,k)=> x0 + k*sp);
  const ptY = cotas.map(c=> py(c));
  const xLast = ptX[nPts-1];
  const ptLbl = k => k===0 ? 'BM' : (k===nPts-1 ? 'PF' : 'PC'+k);
  const stCol = k => (k%2===0) ? 'var(--blueprint)' : 'var(--success)';
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');   // coordenadas compactas
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const HALO = 'stroke="var(--paper-raised)" stroke-width="1" paint-order="stroke" stroke-linejoin="round"';
  const dense = sp < 45;   // muchas estaciones: se simplifica (sin E)
  const eng = svgLblEngine(W,H);
  const val = v => `${fmtNum(v,3)} m`;

  // ---- listado de valores (esquina superior izquierda, columnas de 10 filas) ----
  const rows = [];
  stations.forEach((s,k)=>{
    const r = s.row0+1;
    rows.push({t:'HI'+r, c:stCol(k), v:val(s.hi)});
    rows.push({t:'BS'+r, c:stCol(k), v:val(filas[s.row0].bs)});
    s.toPts.forEach(p=> rows.push({t:'FS'+p, c:stCol(k), v:val(filas[p-1].fs)}));
  });
  const dH = cotas[nPts-1]-cotas[0];
  const dHtxt = (dH>=0 ? '+' : '') + val(dH);
  rows.push({t:'ΔH', c:'var(--accent)', v:dHtxt});
  cotas.forEach((c,k)=> rows.push({t:'Cota '+ptLbl(k), c:'var(--ink-soft)', v:val(c)}));
  const PER_COL=10, COL_W=70, ROW_Y0=12.521, ROW_DY=5.761;
  const nCols = Math.ceil(rows.length/PER_COL);
  const maxRowW = Math.max(...rows.map(r=>eng.tw(`${r.t} = ${r.v}`,4.32)));
  const listRight = 15.2 + COL_W*(nCols-1) + maxRowW + 1;
  const listBottom = ROW_Y0 + (Math.min(rows.length,PER_COL)-1)*ROW_DY + 1;
  eng.rectFill(8.5, 6.5, listRight, listBottom+0.5);
  eng.rectFill(W/2-30, 181.5, W/2+30, 187);

  // ---- altura de cada mira: 65 desde el terreno, y siempre sobre las visuales que toca ----
  const touchY = cotas.map(()=>[]);
  stations.forEach(s=>{
    const y = py(s.hi);
    touchY[s.fromPt].push(y);
    s.toPts.forEach(p=>touchY[p].push(y));
  });
  const staffTop = cotas.map((_,k)=>{
    let top = ptY[k]-65;
    touchY[k].forEach(y=>{ top = Math.min(top, y-12); });
    if(ptX[k]-3 < listRight) top = Math.max(top, listBottom+4);   // no pisar el listado
    return top;
  });

  // ---- desnivel total (parámetros) ----
  const yBM = ptY[0], yFin = ptY[nPts-1];
  const showDH = Math.abs(yBM-yFin) > 0.5;
  const subiendo = yFin < yBM;                         // el punto final está más alto que el BM
  const xd = subiendo ? xLast+4 : xLast+13;            // si baja, se desplaza para no montarse sobre el FS final

  let out = '';

  // ---- terreno ----
  const extL = Math.min(15, x0-4), extR = Math.min(40, 316-xLast);
  let terrainD = `M${f(x0-extL)} ${f(ptY[0]+2.5)}`;
  const tp = [[x0-extL, ptY[0]+2.5]];
  for(let k=0;k<nPts;k++){ terrainD += ` L${f(ptX[k])} ${f(ptY[k])}`; tp.push([ptX[k],ptY[k]]); }
  terrainD += ` L${f(xLast+extR)} ${f(ptY[nPts-1]-2)}`; tp.push([xLast+extR, ptY[nPts-1]-2]);
  out += `<path d="${terrainD}" fill="none" stroke="#8B6B47" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  eng.poly(tp);

  // ---- miras y puntos (neutros) ----
  for(let k=0;k<nPts;k++){
    out += `<rect x="${f(ptX[k]-1)}" y="${f(staffTop[k])}" width="2" height="${f(ptY[k]-staffTop[k])}" fill="none" stroke="var(--ink-soft)" stroke-width="0.6" stroke-linejoin="round"/>\n`;
    eng.rectOutline(ptX[k]-1, staffTop[k], ptX[k]+1, ptY[k]);
  }
  for(let k=0;k<nPts;k++){
    out += `<circle cx="${f(ptX[k])}" cy="${f(ptY[k])}" r="2" fill="var(--ink-soft)"/>\n`;
    eng.circle(ptX[k], ptY[k], 2.3);
  }

  // ---- estaciones (geometría) ----
  const pend = [];   // rótulos pendientes de colocar
  stations.forEach((s,k)=>{
    const col = stCol(k);
    const visY = py(s.hi);
    const xFrom = ptX[s.fromPt];
    const xTo = ptX[s.toPts[s.toPts.length-1]];
    const Vx = xFrom + sp/2;
    const Ey = ptY[s.fromPt] + (ptY[s.fromPt+1]-ptY[s.fromPt])/2;
    const bodyTop = visY-2.45, bodyBot = visY+2.45;

    // visual horizontal
    out += `<line x1="${f(xFrom+1.5)}" y1="${f(visY)}" x2="${f(xTo-1.5)}" y2="${f(visY)}" stroke="${col}" stroke-width="0.7" stroke-linecap="round" stroke-dasharray="3 2"/>\n`;
    eng.seg(xFrom+1.5, visY, xTo-1.5, visY);
    // BS (a la izquierda de su mira) y FS (a la derecha de cada mira de adelante): cota con topes
    const dim = (x, y1, y2, c, w) => { eng.seg(x,y1,x,y2); eng.seg(x-2,y1,x+2,y1); eng.seg(x-2,y2,x+2,y2);
      return `<path d="M${f(x)} ${f(y1)} L${f(x)} ${f(y2)} M${f(x-2)} ${f(y1)} L${f(x+2)} ${f(y1)} M${f(x-2)} ${f(y2)} L${f(x+2)} ${f(y2)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>\n`; };
    const xBS = xFrom-4;
    out += dim(xBS, visY, ptY[s.fromPt], col, 0.7);
    s.toPts.forEach(p=>{ out += dim(ptX[p]+4, visY, ptY[p], col, 0.7); });
    // nivel (cuerpo + trípode)
    out += `<path d="M${f(Vx)} ${f(bodyBot)} L${f(Vx)} ${f(Ey)} M${f(Vx)} ${f(bodyBot)} L${f(Vx-4.3)} ${f(Ey)} M${f(Vx)} ${f(bodyBot)} L${f(Vx+4.3)} ${f(Ey)}" fill="none" stroke="${col}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>\n`;
    out += `<rect x="${f(Vx-4.25)}" y="${f(bodyTop)}" width="8.5" height="4.9" fill="var(--paper-raised)" stroke="${col}" stroke-width="1.4" stroke-linejoin="round"/>\n`;
    out += `<circle cx="${f(Vx)}" cy="${f(Ey)}" r="1.5" fill="var(--ink-soft)"/>\n`;
    eng.seg(Vx,bodyBot,Vx,Ey); eng.seg(Vx,bodyBot,Vx-4.3,Ey); eng.seg(Vx,bodyBot,Vx+4.3,Ey);
    eng.rectFill(Vx-4.5, bodyTop-0.3, Vx+4.5, bodyBot+0.3, 0.8); eng.circle(Vx,Ey,1.8);
    pend.push({kind:'st', k, col, visY, xFrom, xBS, Vx, Ey, s});
  });

  // ---- desnivel total BM → punto final (accent): geometría ----
  if(showDH){
    out += `<line x1="${f(ptX[0]+3)}" y1="${f(yBM)}" x2="${f(xd+20)}" y2="${f(yBM)}" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round" stroke-dasharray="1 2"/>\n`;
    out += `<path d="M${f(xd)} ${f(yBM)} L${f(xd)} ${f(yFin)} M${f(xd-2)} ${f(yBM)} L${f(xd+2)} ${f(yBM)} M${f(xd-2)} ${f(yFin)} L${f(xd+2)} ${f(yFin)}" fill="none" stroke="var(--accent)" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/>\n`;
    eng.seg(ptX[0]+3,yBM,xd+20,yBM); eng.seg(xd,yBM,xd,yFin); eng.seg(xd-2,yBM,xd+2,yBM); eng.seg(xd-2,yFin,xd+2,yFin);
  }

  // ---- rótulos fijos: nombres de los puntos y E (neutros) ----
  const lab = (t, fs, col, c, halo=true) => { const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} ${halo?HALO+' ':''}font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const near = (c, dxs, dys) => { const cc=[]; for(const dx of dxs) for(const dy of dys) cc.push({...c, x:c.x+dx, y:c.y+dy, pen:Math.hypot(dx,dy)*0.5}); return cc; };
  const D6=[0,-1.5,1.5,-3,3,-5,5,-8,8], D5=[0,1,2,3,4,5,7,9];
  for(let k=0;k<nPts;k++){
    let c, fs=4;
    if(k===0){ c={x:ptX[0], y:ptY[0]+6.359, anchor:'middle'}; fs=4.5; }
    else if(k===nPts-1) c={x:ptX[k]+3, y:ptY[k]+5.875, anchor:'end'};
    else c={x:ptX[k], y:ptY[k]+5.875, anchor:'middle'};
    lab(ptLbl(k), fs, 'var(--ink-soft)', eng.pick(ptLbl(k),fs,near(c,D6,D5)));
  }
  pend.forEach(p=>{
    if(!dense){ const c={x:p.Vx+5.3, y:p.Ey-3.6}; lab('E'+(p.k+1),4,p.col,eng.pick('E'+(p.k+1),4,near(c,[0,1,2,3,-1,-2,4,6],[0,-1,-2,-3,1,2,-5,-7]))); }
  });

  // ---- rótulos con valor: ΔH, luego BS/FS, luego HI ----
  if(showDH){
    const t = 'ΔH = '+dHtxt, cc=[], mid=(yBM+yFin)/2, len=Math.abs(yBM-yFin), wT=eng.tw(t,4);
    for(let d=0; d<=40; d+=2) for(const sg of [1,-1]){ if(d===0&&sg===-1) continue;
      for(const dx of [0,4,8]) cc.push({x:xd+3.875+dx, y:mid+d*sg, rot:-90, anchor:'middle', pen:d*0.3+dx*0.8+Math.max(0,wT-len)*0.6});
    }
    for(const dx of [3.5,5,8]) for(let d=-16; d<=16; d+=2) cc.push({x:xd+dx, y:mid+1.4+d, pen:6+Math.abs(d)*0.3+(dx-3.5)*0.5});
    lab(t,4,'var(--accent)',eng.pick(t,4,cc));
  }
  pend.forEach(p=>{
    const s=p.s, col=p.col, r=s.row0+1;
    const bsT = `BS${r} = ${val(filas[s.row0].bs)}`;
    const vert = (t, xBase, ya, yb) => { const cc=[], c0=(ya+yb)/2+1, len=Math.abs(ya-yb), wT=eng.tw(t,4), lo=Math.min(ya,yb), hi=Math.max(ya,yb);
      for(let d=0; d<=70; d+=1.5) for(const sg of [1,-1]){ if(d===0&&sg===-1) continue; const y=c0+d*sg;
        const over=Math.max(0,lo-(y-wT/2))+Math.max(0,(y+wT/2)-hi);
        for(const dx of [0,3,6]) cc.push({x:xBase+dx*(t.startsWith('BS')?-1:1), y, rot:-90, anchor:'middle', pen:d*0.25+over*0.7+dx*0.8}); }
      lab(t,4,col,eng.pick(t,4,cc)); };
    vert(bsT, p.xBS-1.4, p.visY, ptY[s.fromPt]);
    s.toPts.forEach(q=> vert(`FS${q} = ${val(filas[q-1].fs)}`, ptX[q]+7.875, p.visY, ptY[q]));
  });
  pend.forEach(p=>{
    const s=p.s, t=`HI${s.row0+1} = ${val(s.hi)}`, half=sp/2, cc=[];
    const hx = dense ? p.Vx - 0.3*sp : p.Vx + (p.k%2===0 ? -0.55 : 0.6)*half;
    for(let dx=-60; dx<=60; dx+=2) for(let dy=0; dy<=28; dy+=2)
      cc.push({x:hx+dx, y:p.visY-0.94-dy, anchor:'middle', pen:Math.abs(dx)*0.25+dy*0.45});
    lab(t,4,p.col,eng.pick(t,4,cc));
  });

  // ---- listado de valores: el valor a continuación de su descriptor ----
  rows.forEach((r,idx)=>{
    const col = Math.floor(idx/PER_COL), row = idx%PER_COL;
    const ox = COL_W*col, by = ROW_Y0 + row*ROW_DY;
    out += `<rect x="${f(10.026+ox)}" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n`;
    out += `<text x="${f(15.211+ox)}" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.t}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`;
  });

  out += `<text x="${W/2}" y="${H-4}" font-family="var(--font-body)" font-size="4" fill="var(--ink-soft)" text-anchor="middle">(esquemático, no a escala)</text>\n`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
let ndN = 4;
function renderNivelDif(){
  const body = `<div class="field-card">
    ${fieldRow('Cota conocida del punto de partida (BM)','nd_cota0',150.000)}
    <div class="field-row"><label>Número de vistas</label>
      <div class="n-stepper"><button type="button" id="ndMinus">−</button><span class="n-val" id="ndNVal">${ndN}</span><button type="button" id="ndPlus">+</button></div>
    </div>
  </div>
  <div id="ndFilas"></div>
  <div class="field-card">
    ${fieldRow('Cota de llegada conocida (opcional, para cierre)','nd_cotaF','',{placeholder:'dejar vacío si no aplica'})}
  </div>
  <button class="btn" id="btnND" type="button">Calcular</button>
  <div id="resND"></div>`;
  toolShell('nivelDif','Nivelación diferencial por vistas atrás (BS) y adelante (FS): calcula la altura de instrumento y la cota de cada punto de cambio.', body, ['BS','FS','HI']);
  const draw = ()=>{
    let html='';
    for(let i=0;i<ndN;i++){
      html += `<div class="station-block">
        <div class="st-label">Vista ${i+1}</div>
        <div class="field-inline2">
          ${fieldRow('Vista atrás — BS (m)',`nd_bs_${i}`, i===0? 1.520 : '')}
          ${fieldRow('Vista adelante — FS (m)',`nd_fs_${i}`, 1.180+i*0.1)}
        </div>
      </div>`;
    }
    document.getElementById('ndFilas').innerHTML = html;
  };
  draw();
  document.getElementById('ndMinus').addEventListener('click', ()=>{ if(ndN>1){ndN--; document.getElementById('ndNVal').textContent=ndN; draw();}});
  document.getElementById('ndPlus').addEventListener('click', ()=>{ if(ndN<25){ndN++; document.getElementById('ndNVal').textContent=ndN; draw();}});
  document.getElementById('btnND').addEventListener('click', ()=>{
    const cota0=val('nd_cota0'); const box=document.getElementById('resND');
    if(isNaN(cota0)){ box.innerHTML=`<p class="err-msg">Ingresa la cota de partida.</p>`; return; }
    const filas=[];
    for(let i=0;i<ndN;i++){
      const bsRaw=document.getElementById(`nd_bs_${i}`).value, fsRaw=document.getElementById(`nd_fs_${i}`).value;
      filas.push({bs: bsRaw===''?NaN:parseFloat(bsRaw), fs: fsRaw===''?NaN:parseFloat(fsRaw)});
    }
    const out = calcNivelacionDiferencial(cota0, filas);
    let rows='';
    const cotas=[cota0];
    out.forEach((o,i)=>{
      rows += `<tr><td>V${i+1}</td><td>${isNaN(o.bs)?'—':fmtNum(o.bs,3)}</td><td>${isNaN(o.fs)?'—':fmtNum(o.fs,3)}</td><td>${o.hi!==null?fmtNum(o.hi,3):'—'}</td><td>${fmtNum(o.cota,3)}</td></tr>`;
      cotas.push(o.cota);
    });
    const cotaFRaw = document.getElementById('nd_cotaF').value;
    let cierreRow='';
    if(cotaFRaw!==''){
      const cotaFconocida = parseFloat(cotaFRaw);
      const cotaFcalc = out[out.length-1].cota;
      const errCierre = cotaFcalc - cotaFconocida;
      cierreRow = `<div class="result-row"><span class="k">Error de cierre</span><span class="v ${Math.abs(errCierre)<0.01?'accent':''}">${errCierre>=0?'+':''}${fmtNum(errCierre,4)} m</span></div>`;
    }
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      ${cierreRow}
      <div class="table-wrap" style="margin-top:${cierreRow?'10px':'0'};"><table class="data-table"><thead><tr><th>Vista</th><th>BS</th><th>FS</th><th>H.I.</th><th>Cota</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="plot-wrap">${(filas.length>0 && isFinite(filas[0].bs) && filas.every(f=>isFinite(f.fs)) && filas.length<=7) ? svgNivelacionDiferencial(cotas, filas) : svgPerfilNivel(cotas, cotas.map((_,i)=> i===0?'BM':(i===cotas.length-1?'PF':'PC'+i)))}</div>
    </div>`;
  });
}

const RENDERERS = { nivelDif: renderNivelDif };
