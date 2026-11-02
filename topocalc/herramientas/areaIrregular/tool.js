"use strict";
/* Herramienta «Área Irregular por Ordenadas»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcAreaTrapecios(h, ys){
  const n=ys.length-1;
  let suma=0;
  for(let i=1;i<n;i++) suma+=ys[i];
  return h*((ys[0]+ys[n])/2 + suma);
}
function calcAreaSimpson(h, ys){
  const n=ys.length-1;
  if(n%2!==0) return null;
  let sImp=0, sPar=0;
  for(let i=1;i<n;i++){ if(i%2===1) sImp+=ys[i]; else sPar+=ys[i]; }
  return (h/3)*(ys[0]+ys[n]+4*sImp+2*sPar);
}
function svgAreaOrdenadas(hInterval, ys){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const N = ys.length, n = N-1;
  const areaT = calcAreaTrapecios(hInterval, ys), areaS = calcAreaSimpson(hInterval, ys);
  const hasS = areaS!==null;
  const corto = N > 12;
  const mTxt = v => `${fmtNum(v,2)} m`;
  const aTxt = v => `${fmtNum(v,2)} m²`;
  const oTxt = i => corto ? mTxt(ys[i]) : `y${i} = ${mTxt(ys[i])}`;

  // ---- listado: bloque 1 (áreas e intervalo), bloque 2 (ordenadas, columnas de 10 filas) ----
  const blk1 = [];
  blk1.push(hasS ? {k:'Simpson',c:'var(--accent)',v:aTxt(areaS)} : {k:'Simpson',c:'var(--ink-soft)',v:'no aplica'});
  blk1.push({k:'Trapecios', c:hasS?'var(--ink)':'var(--accent)', v:aTxt(areaT)});
  blk1.push({k:'h', c:'var(--ink)', v:mTxt(hInterval)});
  const blk2 = ys.map((y,i)=>({k:`y${i}`, c:'var(--success)', v:mTxt(y)}));
  const ROW_Y0=12.521, ROW_DY=5.761, PER_COL=10;
  const rowW = r => eng.tw(`${r.k} = ${r.v}`,4.32);
  const cols=[]; let x=10.026;
  { const w=Math.max(...blk1.map(rowW)); cols.push({x, rows:blk1, w}); x=Math.max(80.026, x+5.185+w+12); }
  for(let s=0;s<blk2.length;s+=PER_COL){ const rows=blk2.slice(s,s+PER_COL), w=Math.max(...rows.map(rowW)); cols.push({x, rows, w}); x=x+5.185+w+10; }
  const listRight = Math.max(...cols.map(c=>c.x+5.185+c.w))+1;
  const listBottom = ROW_Y0 + (Math.min(Math.max(blk1.length,blk2.length),PER_COL)-1)*ROW_DY + 1;
  eng.rectFill(8.5, 6.5, listRight, listBottom+0.5);

  // ---- terreno (escala vertical independiente, como el diagrama anterior) ----
  const X0=50, X1=270, BY=150;
  const maxPx = Math.max(30, Math.min(80, BY-(listBottom+10)));
  const maxY = Math.max(...ys, 0.001);
  const px = ys.map((y,i)=>({x: X0+(X1-X0)*i/n, y: BY - Math.max(0,y)/maxY*maxPx}));
  const lind = px.map(p=>f(p.x)+' '+f(p.y)).join(' L');
  let out='';
  out += `<path d="M${lind} L${f(px[n].x)} ${BY} L${f(px[0].x)} ${BY} Z" fill="var(--accent)" fill-opacity="0.14" stroke="none"/>\n`;
  out += `<path d="M${X0} ${BY} L${X1} ${BY}" fill="none" stroke="var(--ink-soft)" stroke-width="0.8" stroke-linecap="round"/>\n`;
  out += `<path d="M${lind}" fill="none" stroke="var(--blueprint)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  eng.seg(X0,BY,X1,BY); for(let i=0;i<n;i++) eng.seg(px[i].x,px[i].y,px[i+1].x,px[i+1].y);
  px.forEach(p=>{ out += `<path d="M${f(p.x)} ${BY} L${f(p.x)} ${f(p.y)}" fill="none" stroke="var(--success)" stroke-width="0.7" stroke-dasharray="1.6 1.6" stroke-linecap="round"/>\n`; eng.seg(p.x,BY,p.x,p.y); });
  px.forEach(p=>{
    out += `<circle cx="${f(p.x)}" cy="${BY}" r="1.5" fill="var(--ink-soft)"/><circle cx="${f(p.x)}" cy="${f(p.y)}" r="1.5" fill="var(--success)"/>\n`;
    eng.circle(p.x,BY,1.8); eng.circle(p.x,p.y,1.8);
  });
  // cota del intervalo h (bajo la base, entre y0 e y1)
  const hy=BY+3.634;
  out += `<path d="M${f(px[0].x)} ${f(hy)} L${f(px[1].x)} ${f(hy)}" fill="none" stroke="var(--ink)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M${f(px[0].x)} ${f(hy-1.6)} L${f(px[0].x)} ${f(hy+1.6)}" fill="none" stroke="var(--ink)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M${f(px[1].x)} ${f(hy-1.6)} L${f(px[1].x)} ${f(hy+1.6)}" fill="none" stroke="var(--ink)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  eng.seg(px[0].x,hy-1.6,px[0].x,hy+1.6); eng.seg(px[1].x,hy-1.6,px[1].x,hy+1.6); eng.seg(px[0].x,hy,px[1].x,hy);

  const lab = (t,fs,col,c) => { const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const omit = (t,fs,cands) => !cands.length || Math.min(...cands.map(q=>eng.count(eng.box(t,fs,q),0.5)))>0;
  // h
  { const t=`h = ${mTxt(hInterval)}`, c={x:(px[0].x+px[1].x)/2, y:hy+4.506, anchor:'middle'}; lab(t,3,'var(--ink)',eng.pick(t,3,[c])); }
  // áreas al pie
  { const cx=(X0+X1)/2;
    if(hasS){ const t=`Simpson = ${aTxt(areaS)}`; lab(t,4,'var(--accent)',eng.pick(t,4,[{x:cx,y:178.145,anchor:'middle'}]));
              const u=`Trapecios = ${aTxt(areaT)}`; lab(u,3.5,'var(--ink)',eng.pick(u,3.5,[{x:cx,y:182.5,anchor:'middle'}])); }
    else { const u=`Trapecios = ${aTxt(areaT)}`; lab(u,4,'var(--accent)',eng.pick(u,4,[{x:cx,y:178.145,anchor:'middle'}])); } }
  // ordenadas: a lo largo de su línea, a la derecha; si no cabe se desliza, pasa a la izquierda o se omite
  const FS=3;
  px.forEach((p,i)=>{
    const t=oTxt(i), w=eng.tw(t,FS), L=BY-p.y, lim=L/2-w/2-1.5, cands=[];
    if(lim>=0) for(let off=0; off<=lim+1e-6; off+=1.5) for(const sg of [1,-1]){ if(off===0&&sg===-1) continue;
      cands.push({x:p.x+0.97*FS, y:(p.y+BY)/2 + sg*off, rot:-90, anchor:'middle', pen:off*0.4});
      cands.push({x:p.x-0.4*FS,  y:(p.y+BY)/2 + sg*off, rot:-90, anchor:'middle', pen:off*0.4+6});
    }
    if(omit(t,FS,cands)) return;
    lab(t,FS,'var(--success)',eng.pick(t,FS,cands));
  });
  // listado
  cols.forEach(c=>c.rows.forEach((r,row)=>{
    const by=ROW_Y0+row*ROW_DY;
    out += `<rect x="${f(c.x)}" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n`;
    out += `<text x="${f(c.x+5.185)}" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.k}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`;
  }));
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
let airN = 5;
function renderAreaIrregular(){
  const body = `<div class="field-card">
    ${fieldRow('Intervalo entre ordenadas (m)','ai_h',5)}
    <div class="field-row"><label>Número de ordenadas</label>
      <div class="n-stepper"><button type="button" id="aiMinus">−</button><span class="n-val" id="aiNVal">${airN}</span><button type="button" id="aiPlus">+</button></div>
    </div>
  </div>
  <div id="aiPoints"></div>
  <button class="btn" id="btnAI" type="button">Calcular Área</button>
  <div id="resAI"></div>`;
  toolShell('areaIrregular','Área de un lote con lindero irregular (ej. borde de río o quebrada): mide ordenadas perpendiculares a intervalos iguales desde una línea base hasta el lindero, y calcula el área por Trapecios y por Simpson (más precisa; requiere número par de intervalos, es decir, número impar de ordenadas).', body);
  const draw = ()=>{
    let html='';
    for(let i=0;i<airN;i++){
      const def = (i===0||i===airN-1) ? 0 : round(3+2*Math.sin(i),2);
      html += fieldRow(`Ordenada y${i} (m)`, `ai_y_${i}`, def);
    }
    document.getElementById('aiPoints').innerHTML = html;
  };
  draw();
  document.getElementById('aiMinus').addEventListener('click', ()=>{ if(airN>3){airN--; document.getElementById('aiNVal').textContent=airN; draw();}});
  document.getElementById('aiPlus').addEventListener('click', ()=>{ if(airN<40){airN++; document.getElementById('aiNVal').textContent=airN; draw();}});
  document.getElementById('btnAI').addEventListener('click', ()=>{
    const h=val('ai_h'); const box=document.getElementById('resAI');
    const ys=[];
    for(let i=0;i<airN;i++) ys.push(val(`ai_y_${i}`));
    if(isNaN(h)||h<=0||ys.some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa el intervalo y todas las ordenadas.</p>`; return; }
    const areaTrap = calcAreaTrapecios(h,ys);
    const areaSimp = calcAreaSimpson(h,ys);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Área por Trapecios</span><span class="v">${fmtNum(areaTrap,2)} m²</span></div>
      <div class="result-row"><span class="k">Área por Simpson</span><span class="v accent big">${areaSimp!==null?fmtNum(areaSimp,2)+' m²':'requiere N° impar de ordenadas'}</span></div>
      <div class="plot-wrap">${svgAreaOrdenadas(h,ys)}</div>
    </div>`;
    const csvRows = ['estacion,distancia_acumulada_m,ordenada_m'];
    ys.forEach((y,i)=> csvRows.push(`y${i},${i*h},${y}`));
    addCSVButton(box, 'area_irregular.csv', csvRows.join('\n'));
  });
}

const RENDERERS = { areaIrregular: renderAreaIrregular };
