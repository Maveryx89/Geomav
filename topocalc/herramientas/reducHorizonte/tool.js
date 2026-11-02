"use strict";
/* Herramienta «Reducción al Horizonte»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcReduccionHorizonte(Di, anguloDeg){
  const a = toRad(anguloDeg);
  return {Dh: Di*Math.cos(a), Dv: Di*Math.sin(a)};
}
function svgReduccionHorizonte(anguloDeg, Di, Dh, Dv){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);

  // ---- ángulo visual (con signo) y tamaño del triángulo (esquemático, no a escala) ----
  let a = Math.max(-70, Math.min(anguloDeg, 70));
  if(Math.abs(a) < 3) a = a<0 ? -3 : 3;
  const neg = a < 0, aa = Math.abs(a), ar = toRad(aa);
  const s = neg ? -1 : 1;                                  // +1 sube, −1 baja
  const L = Math.min(194.13, 72.7/Math.sin(ar));          // hipotenusa en px (con 22° reproduce Dh=179,94, Dv=72,7)
  const dh = L*Math.cos(ar), dv = L*Math.sin(ar);
  const E = {x: neg ? Math.max(160 - dh/2, 82) : 160 - dh/2, y: neg ? 62.3 : 135};   // si cuelga hacia abajo, no invade el listado
  const P = {x: E.x+dh, y: E.y - s*dv};
  const B = {x: P.x, y: E.y};                              // pie de la vertical (ángulo recto)

  // ---- terreno de la plantilla (de izquierda a derecha), ajustado a la pendiente y al ancho del triángulo ----
  const TER=[[46.32,161.945],[51.159,161.945],[58.888,161.938],[62.363,161.945],[66.78,161.954],[65.802,161.976],[75.648,161.945],[82.025,160.246],[87.77,159.21],[101.25,157.9],[117.43,153.87],[108.41,154.75],[142.01,149.73],[152.92,144.85],[168.69,149.68],[173.86,147.11],[197.07,135.54],[224.888,121.529],[234.378,114.469],[238.42,111.457],[233.81,91.52],[247.97,91.52],[248.97,91.52],[256.303,91.52],[258.4,91.52],[268.934,91.867],[279.467,92.213],[290.001,92.56]];
  const X0T=46.32, WT=243.681, DYT=-69.385;
  const Wt = Math.max(dh+63.74, 170), kf = Math.min(Math.tan(ar)/Math.tan(toRad(22)), 1.8), dYnew = DYT*s*kf*(Wt/WT);   // pendiente acotada: con ángulos grandes el terreno no se vuelve vertical
  const T = TER.map(([x,y])=>{
    const u = (x-X0T)/WT;
    return [E.x-23.71 + u*Wt, y + (E.y-135) + (dYnew-DYT)*u];
  });
  let terrainD = `M${f(T[0][0])} ${f(T[0][1])}`;
  for(let i=1;i<T.length;i+=3) terrainD += ` C${f(T[i][0])} ${f(T[i][1])} ${f(T[i+1][0])} ${f(T[i+1][1])} ${f(T[i+2][0])} ${f(T[i+2][1])}`;
  const tpoly = [];
  for(let i=0;i+3<T.length;i+=3){
    for(let t=0;t<=1.0001;t+=0.004){
      const m=1-t, c=[m*m*m, 3*m*m*t, 3*m*t*t, t*t*t];
      tpoly.push([0,1].map(k=> c[0]*T[i][k]+c[1]*T[i+1][k]+c[2]*T[i+2][k]+c[3]*T[i+3][k]));
    }
  }
  // primer punto del terreno bajo (x, desde y0 hacia abajo)
  const groundAt = (x,y0,dflt) => { let best=null; tpoly.forEach(q=>{ if(Math.abs(q[0]-x)<0.6 && q[1]>=y0 && (best===null||q[1]<best)) best=q[1]; }); return best===null ? dflt : best; };
  const gE = groundAt(E.x, E.y+8, E.y+27);
  const gP = Math.max(groundAt(P.x, P.y+4, P.y+12), P.y+6);

  // ---- textos (valores en el listado y en el dibujo) ----
  const z0 = v => Math.abs(v)<0.0005 ? 0 : v;   // evita «−0,000»
  const aV = Math.abs(anguloDeg)<1e-9 ? 0 : anguloDeg;
  const rows = [
    {k:'Di', c:'var(--blueprint)', v:`${fmtNum(z0(Di),3)} m`},
    {k:'Dh', c:'var(--accent)',    v:`${fmtNum(z0(Dh),3)} m`},
    {k:'Dv', c:'var(--success)',   v:`${fmtNum(z0(Dv),3)} m`},
    {k:'α',  c:'var(--danger)',    v:fmtAngle(aV)},
    {k:'Z',  c:'var(--ink)',       v:fmtAngle(90-aV)}
  ];
  const tx = {}; rows.forEach(r=> tx[r.k] = `${r.k} = ${r.v}`);

  let out = '';
  const NEUT = 'stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  const brV = (x,y1,y2) => { eng.seg(x,y1,x,y2); eng.seg(x-2,y1,x+2,y1); eng.seg(x-2,y2,x+2,y2);
    return `<path d="M${f(x)} ${f(y1)} L${f(x)} ${f(y2)} M${f(x-2)} ${f(y1)} L${f(x+2)} ${f(y1)} M${f(x-2)} ${f(y2)} L${f(x+2)} ${f(y2)}" ${NEUT}/>\n`; };

  // obstáculos fijos: terreno, listado y nota al pie
  eng.poly(tpoly);
  const listW = Math.max(...rows.map(r=>eng.tw(tx[r.k],4.32)));
  eng.rectFill(8.5, 6.5, 15.2+listW+1.5, 37.2);
  eng.rectFill(W/2-30, 181.5, W/2+30, 187);

  out += `<path d="${terrainD}" fill="none" stroke="#8B6B47" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;

  // ---- instrumento en E (neutro) ----
  out += `<path d="M${f(E.x)} ${f(E.y+2.45)} L${f(E.x)} ${f(gE)} M${f(E.x)} ${f(E.y+2.45)} L${f(E.x-4.3)} ${f(gE)} M${f(E.x)} ${f(E.y+2.45)} L${f(E.x+4.3)} ${f(gE)}" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  out += `<rect x="${f(E.x-4.25)}" y="${f(E.y-2.45)}" width="8.5" height="4.9" fill="var(--paper-raised)" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linejoin="round"/>\n`;
  eng.seg(E.x,E.y+2.45,E.x,gE); eng.seg(E.x,E.y+2.45,E.x-4.3,gE); eng.seg(E.x,E.y+2.45,E.x+4.3,gE);
  eng.rectFill(E.x-4.25,E.y-2.45,E.x+4.25,E.y+2.45,0.8);

  // ---- triángulo: un trazo por magnitud ----
  out += `<path d="M${f(E.x)} ${f(E.y)} L${f(P.x)} ${f(P.y)}" fill="none" stroke="var(--blueprint)" stroke-width="0.8" stroke-linecap="round"/>\n`;
  out += `<path d="M${f(E.x)} ${f(E.y)} L${f(B.x)} ${f(B.y)}" fill="none" stroke="var(--accent)" stroke-width="0.8" stroke-linecap="round"/>\n`;
  out += `<path d="M${f(B.x)} ${f(B.y)} L${f(P.x)} ${f(P.y)}" fill="none" stroke="var(--success)" stroke-width="0.8" stroke-linecap="round"/>\n`;
  out += `<path d="M${f(B.x-4)} ${f(B.y)} L${f(B.x-4)} ${f(B.y-s*4)} L${f(B.x)} ${f(B.y-s*4)}" fill="none" stroke="var(--ink-soft)" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  eng.seg(E.x,E.y,P.x,P.y); eng.seg(E.x,E.y,B.x,B.y); eng.seg(B.x,B.y,P.x,P.y);
  eng.seg(B.x-4,B.y,B.x-4,B.y-s*4); eng.seg(B.x-4,B.y-s*4,B.x,B.y-s*4);
  const R = Math.min(54.5, 0.35*dh, 0.45*L);
  out += `<path d="M${f(E.x+R)} ${f(E.y)} A${f(R)} ${f(R)} 0 0 ${neg?1:0} ${f(E.x+R*Math.cos(ar))} ${f(E.y-s*R*Math.sin(ar))}" fill="none" stroke="var(--danger)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  for(let t=0;t<=1.0001;t+=0.02){ eng.pts.push([E.x+R*Math.cos(ar*t), E.y-s*R*Math.sin(ar*t)]); }

  // ---- puntos E y P (neutros) ----
  out += `<circle cx="${f(E.x)}" cy="${f(E.y)}" r="2" fill="var(--ink-soft)"/>\n`;
  out += `<circle cx="${f(P.x)}" cy="${f(P.y)}" r="2" fill="var(--ink-soft)"/>\n`;
  eng.circle(E.x,E.y,2.3); eng.circle(P.x,P.y,2.3);

  // ---- N: eje vertical con flecha desde E ----
  out += `<path d="M${f(E.x)} ${f(E.y-4)} L${f(E.x)} ${f(E.y-46)}" ${NEUT}/>\n`;
  out += `<path d="M${f(E.x)} ${f(E.y-50)} L${f(E.x-1.8)} ${f(E.y-45.5)} L${f(E.x+1.8)} ${f(E.y-45.5)} Z" fill="var(--ink-soft)" stroke="none"/>\n`;
  eng.seg(E.x,E.y-4,E.x,E.y-50); eng.seg(E.x-1.8,E.y-45.5,E.x+1.8,E.y-45.5);
  // ---- Z: ángulo cenital, desde N hasta Di, en sentido horario ----
  const Zdeg = 90 - s*aa;
  let rZ = Math.min(40, 0.8*L);
  if(neg && Math.abs(rZ-dh/2) < 5.5) rZ = (dh/2-6 >= 18) ? dh/2-6 : dh/2+6;
  out += `<path d="M${f(E.x)} ${f(E.y-rZ)} A${f(rZ)} ${f(rZ)} 0 ${Zdeg>180?1:0} 1 ${f(E.x+rZ*Math.cos(ar))} ${f(E.y-s*rZ*Math.sin(ar))}" fill="none" stroke="var(--ink)" stroke-width="0.7" stroke-linecap="round" stroke-dasharray="2 1.5"/>\n`;
  for(let t=0;t<=1.0001;t+=0.01){ const th=toRad(Zdeg)*t; eng.pts.push([E.x+rZ*Math.sin(th), E.y-rZ*Math.cos(th)]); }
  // ---- Hi: altura del instrumento (esquemática), a la izquierda de las patas ----
  const xHi = E.x-7.667;
  out += brV(xHi, E.y-0.055, gE);
  // ---- hp y ΔH: apilados a la derecha de la vertical (hp: P → terreno bajo P; ΔH: terreno bajo P → terreno bajo E) ----
  const xBr = P.x+2.55;
  out += brV(xBr, P.y, gP);
  out += brV(xBr, gP, gE);
  const dx0 = neg ? xBr+2 : E.x+9.33, dx1 = neg ? xBr+16 : xBr-3.45;
  if(dx1 > dx0+2){ out += `<path d="M${f(dx0)} ${f(gE)} L${f(dx1)} ${f(gE)}" ${NEUT} stroke-dasharray="1 2"/>\n`; eng.seg(dx0,gE,dx1,gE); }

  // ---- rótulos (cada uno elige su posición libre más cercana a la de la plantilla) ----
  const lab = (t, fs, col, c) => { const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const mx=(E.x+P.x)/2, my=(E.y+P.y)/2;

  // Di: a lo largo de su línea
  {
    const rot = -s*aa, g=[Math.sin(toRad(rot)), -Math.cos(toRad(rot))], u=[Math.cos(ar), -s*Math.sin(ar)];
    const wD = eng.tw(tx.Di,4), tmax = Math.max(0, L/2 - wD/2 - 6), cands=[];
    const sides = neg ? [[-1,4.8],[1,1.9]] : [[1,1.9],[-1,4.8]];
    for(let t=0;t<=tmax+1e-6;t+=3) for(const sg of [1,-1]){ if(t===0&&sg===-1) continue;
      sides.forEach(([ns,d],si)=> cands.push({x:mx+u[0]*t*sg+g[0]*ns*d, y:my+u[1]*t*sg+g[1]*ns*d, rot, anchor:'middle', pen:t*0.4+si*6}));
    }
    lab(tx.Di,4,'var(--blueprint)',eng.pick(tx.Di,4,cands));
  }
  // Dh: bajo la base (sobre ella si el triángulo cuelga); si no cabe, se corre a lo largo o más abajo
  {
    const wD = eng.tw(tx.Dh,4), cands=[];
    const ys = neg ? [E.y-1.0, E.y+3.94, E.y+9, E.y-6] : [E.y+3.94, E.y-1.0, E.y+9, E.y+14];
    for(let t=0;t<=130;t+=2) for(const sg of [1,-1]){ if(t===0&&sg===-1) continue;
      const over = Math.max(0, wD/2 - (dh/2-Math.abs(t)) ) ;   // cuánto sobresale del tramo
      ys.forEach((yy,si)=> cands.push({x:mx-0.169+t*sg, y:yy, anchor:'middle', pen:t*0.3+si*6+over*0.8}));
    }
    lab(tx.Dh,4,'var(--accent)',eng.pick(tx.Dh,4,cands));
  }
  // Dv: a la izquierda de la vertical (la derecha lleva hp y ΔH)
  {
    const c0 = (P.y+B.y)/2 + s*11.75, lo=Math.min(P.y,B.y), hi=Math.max(P.y,B.y), wD=eng.tw(tx.Dv,4), cands=[];
    for(let d=0; d<=70; d+=1.5) for(const sg of [1,-1]){ if(d===0&&sg===-1) continue;
      const cc=c0+d*sg; const over = Math.max(0, lo-(cc-wD/2)) + Math.max(0,(cc+wD/2)-hi);
      [[P.x-1.865,0],[P.x+4.424,5]].forEach(([xx,pp])=> cands.push({x:xx, y:cc, rot:-90, anchor:'middle', pen:d*0.3+over*2+pp}));
    }
    lab(tx.Dv,4,'var(--success)',eng.pick(tx.Dv,4,cands));
  }
  // α: a la derecha del arco, junto a su punto medio
  {
    const th=-s*aa/2*Math.PI/180, mxA=E.x+R*Math.cos(th), myA=E.y+R*Math.sin(th), cands=[];
    for(let dx=0.8; dx<=45; dx+=1.5) for(let dy=-16; dy<=16; dy+=1.2)
      cands.push({x:mxA+dx, y:myA+s*1.05+dy, pen:Math.hypot(dx-1,dy)*0.35 + ((s>0 ? myA+s*1.05+dy > E.y-0.5 : myA+s*1.05+dy < E.y+3.5) ? 8 : 0)});
    lab(tx['α'],4.5,'var(--danger)',eng.pick(tx['α'],4.5,cands));
  }
  // Z: fuera del arco, junto a su punto medio
  {
    const zm=toRad(Zdeg/2), mxZ=E.x+rZ*Math.sin(zm), myZ=E.y-rZ*Math.cos(zm), cands=[];
    for(let dx=1; dx<=45; dx+=1.5) for(let dy=-16; dy<=16; dy+=1.2){
      cands.push({x:mxZ+dx, y:myZ+dy, pen:Math.hypot(dx-3,dy+1.5)*0.35});
      cands.push({x:mxZ-dx, y:myZ+dy, anchor:'end', pen:Math.hypot(dx-3,dy+1.5)*0.35+4});
    }
    lab(tx.Z,4.5,'var(--ink)',eng.pick(tx.Z,4.5,cands));
  }
  // E, P, N (neutros): cerca de la posición de la plantilla
  {
    const eC=[]; for(let dx=-16;dx<=16;dx+=1) for(let dy=-8;dy<=10;dy+=1) eC.push({x:E.x+6.98+dx, y:E.y+20.5+dy, anchor:'end', pen:Math.hypot(dx,dy)*0.4});
    lab('E',4.5,'var(--ink-soft)',eng.pick('E',4.5,eC));
    const pC=[]; const py0 = neg ? P.y+6.4 : P.y-3.09;
    for(let dx=-6;dx<=8;dx+=1) for(let dy=-8;dy<=8;dy+=1) pC.push({x:P.x-0.9+dx, y:py0+dy, pen:Math.hypot(dx,dy)*0.4});
    lab('P',4.5,'var(--ink-soft)',eng.pick('P',4.5,pC));
    const nC=[]; for(let dx=-6;dx<=6;dx+=1) for(let dy=-6;dy<=3;dy+=1) nC.push({x:E.x+dx, y:E.y-52.5+dy, anchor:'middle', pen:Math.hypot(dx,dy)*0.4});
    lab('N',4.5,'var(--ink-soft)',eng.pick('N',4.5,nC));
  }
  // Hi, hp y ΔH (neutros, sin valor)
  {
    const hC=[]; for(let dx=-6;dx<=4;dx+=1) for(let dy=-8;dy<=8;dy+=1) hC.push({x:xHi-2+dx, y:(E.y+gE)/2+2.735+dy, anchor:'end', pen:Math.hypot(dx,dy)*0.4});
    lab('Hi',4,'var(--ink-soft)',eng.pick('Hi',4,hC));
    const vl = (t,y1,y2,off) => { const cc=[]; const lo=Math.min(y1,y2), hi=Math.max(y1,y2), m=(y1+y2)/2+off;
      for(let d=0; d<=60; d+=1) for(const sg of [1,-1]){ if(d===0&&sg===-1) continue; const y=m+d*sg;
        for(let dx=0; dx<=8; dx+=4) cc.push({x:xBr+3.875+dx, y, rot:-90, anchor:'middle', pen:d*0.3+dx*0.6+Math.max(0,lo+2-(y-eng.tw(t,4)/2))*3+Math.max(0,(y+eng.tw(t,4)/2)-(hi-2))*3}); }
      lab(t,4,'var(--ink-soft)',eng.pick(t,4,cc)); };
    vl('hp',P.y,gP,3.5);
    vl('ΔH',gP,gE,1.95);
  }

  // ---- listado de valores (esquina superior izquierda): el valor a continuación de su descriptor ----
  rows.forEach((r,i)=>{
    const by = 12.521 + i*5.761;
    out += `<rect x="10.026" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n`;
    out += `<text x="15.211" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.k}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`;
  });

  out += `<text x="${W/2}" y="${H-4}" font-family="var(--font-body)" font-size="4" fill="var(--ink-soft)" text-anchor="middle">(esquemático, no a escala)</text>\n`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function renderReducHorizonte(){
  const body = `<div class="field-card">
    ${fieldRow('Distancia inclinada Di (m)','rh_di',124.680)}
    ${angleFieldHTML('rh_ang', 12.4, 'Ángulo vertical, desde horizonte')}
    <button class="btn" id="btnRH" type="button">Calcular</button>
    <div id="resRH"></div>
  </div>`;
  toolShell('reducHorizonte','Reduce una distancia medida a lo largo de la pendiente (con cinta o distanciómetro) a su distancia horizontal y desnivel.', body, ['Di','Dh','Dv']);
  document.getElementById('btnRH').addEventListener('click', ()=>{
    const Di=val('rh_di'), ang=readAngleField('rh_ang');
    const box=document.getElementById('resRH');
    if(isNaN(Di)||isNaN(ang)){ box.innerHTML=`<p class="err-msg">Completa distancia y ángulo.</p>`; return; }
    const r = calcReduccionHorizonte(Di,ang);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia horizontal (Dh)</span><span class="v accent big">${fmtNum(r.Dh,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia vertical (Dv)</span><span class="v">${fmtNum(r.Dv,3)} m</span></div>
      <div class="plot-wrap">${svgReduccionHorizonte(ang, Di, r.Dh, r.Dv)}</div>
    </div>`;
  });
}

const RENDERERS = { reducHorizonte: renderReducHorizonte };
