"use strict";
/* Módulo compartido del grupo «Levantamiento y Coordenadas Planas».
   Generado a partir del index.html monolítico de topocalc. */
function calcRumboDistancia(e1,n1,e2,n2){
  const de=e2-e1, dn=n2-n1;
  const dist=Math.sqrt(de*de+dn*dn);
  const az=normDeg(toDeg(Math.atan2(de,dn)));
  return {dist, az, rumbo: azToRumbo(az)};
}
function libretaBloqueHTML(selId, label){
  if(!PUNTOS.length) return `<div class="field-row" style="margin-top:14px;"><label>${label}</label><p class="tool-blurb" style="margin:0;">La Libreta está vacía: guarda puntos desde otra herramienta para poder traerlos aquí.</p></div>`;
  return `<div class="field-row" style="margin-top:14px;"><label for="${selId}">${label}</label><select id="${selId}">${libretaOpcionesHTML()}</select></div><p class="tool-blurb" id="${selId}_msg" style="margin:0;"></p>`;
}
function svgRadiacion(E0,N0,points){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const n = points.length, corto = n > 6;
  const dist = points.map(p=>Math.hypot(p.E-E0,p.N-N0));
  const dTxt = i => `${fmtNum(dist[i],2)} m`, aTxt = i => fmtAngle(points[i].az);

  // ---- listado: columnas de 10 filas, primero distancias y luego azimutes ----
  const PER_COL=10, ROW_Y0=12.521, ROW_DY=5.761, FS_L=4.32;
  const dRows=[], aRows=[];
  for(let i=0;i<n;i++){ dRows.push({k:'D'+(i+1), c:CD, v:dTxt(i)}); aRows.push({k:'Az'+(i+1), c:CZ, v:aTxt(i)}); }
  const place = (rows, x0) => {
    const nc=Math.ceil(rows.length/PER_COL), items=[]; let x=x0;
    for(let c=0;c<nc;c++){
      const part=rows.slice(c*PER_COL,(c+1)*PER_COL);
      const w=Math.max(...part.map(r=>eng.tw(`${r.k} = ${r.v}`,FS_L)))+5.2;
      part.forEach((r,j)=>items.push({r,x,y:ROW_Y0+j*ROW_DY}));
      x += Math.max(w+9, 62);
    }
    return {items,xEnd:x};
  };
  const L1=place(dRows,10.026), L2=place(aRows,L1.xEnd), items=L1.items.concat(L2.items);
  let listRight=0, listBottom=0;
  items.forEach(it=>{ listRight=Math.max(listRight,it.x+5.2+eng.tw(`${it.r.k} = ${it.r.v}`,FS_L)+1); listBottom=Math.max(listBottom,it.y+1); });
  eng.rectFill(8.5,6.5,listRight,listBottom+0.5);
  eng.rectFill(292,3,308,38);

  // ---- geometría a escala ----
  const left=75, right=265, top=Math.max(42,listBottom+9), bot=166;
  const Es=points.map(p=>p.E).concat([E0]), Ns=points.map(p=>p.N).concat([N0]);
  const minE=Math.min(...Es), maxE=Math.max(...Es), minN=Math.min(...Ns), maxN=Math.max(...Ns);
  const spanE=maxE-minE, spanN=maxN-minN;
  let sc=Math.min((right-left)/Math.max(spanE,1e-9),(bot-top)/Math.max(spanN,1e-9));
  if(!isFinite(sc) || spanE+spanN<1e-9) sc=1;
  const ox=(left+right)/2-(spanE*sc)/2, oy=(top+bot)/2+(spanN*sc)/2;
  const X=e=>ox+(e-minE)*sc, Y=n_=>oy-(n_-minN)*sc;
  const S={x:X(E0),y:Y(N0)}, P=points.map(p=>({x:X(p.E),y:Y(p.N)}));

  let out='';
  P.forEach(p=>{ out += `<path d="M${f(S.x)} ${f(S.y)} L${f(p.x)} ${f(p.y)}" fill="none" stroke="var(--blueprint)" stroke-width="0.8" stroke-linecap="round"/>\n`; eng.seg(S.x,S.y,p.x,p.y); });
  out += `<circle cx="${f(S.x)}" cy="${f(S.y)}" r="2.7" fill="var(--ink)"/>\n`; eng.circle(S.x,S.y,3);
  P.forEach(p=>{ out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="2" fill="var(--accent)"/>\n`; eng.circle(p.x,p.y,2.3); });
  out += `<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n`;
  out += `<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`;

  const lab=(t,fs,col,cd)=>{ const q=eng.txtAttrs(cd); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const around=(pt,t,fs,col,pref,r0,rmax)=>{
    const cands=[];
    for(let r=r0;r<=rmax;r+=1.2) for(let an=0;an<360;an+=15){
      const dx=Math.cos(an*Math.PI/180), dy=Math.sin(an*Math.PI/180);
      const dp=Math.acos(Math.max(-1,Math.min(1,dx*pref[0]+dy*pref[1])))*180/Math.PI;
      cands.push({x:pt.x+dx*r, y:pt.y+dy*r+0.36*fs, anchor:'middle', pen:(r-r0)*1.2+dp*0.08});
    }
    lab(t,fs,col,eng.pick(t,fs,cands));
  };
  // estación: hacia el mayor hueco entre rayos
  {
    const angs=P.map(p=>Math.atan2(p.y-S.y,p.x-S.x)).sort((a,b)=>a-b);
    let best=0, mid=Math.PI/2;
    if(angs.length){ for(let i=0;i<angs.length;i++){ const a=angs[i], b=i+1<angs.length?angs[i+1]:angs[0]+2*Math.PI, g=b-a; if(g>best){ best=g; mid=a+g/2; } } }
    around(S,'Est.',4.5,CK,[Math.cos(mid),Math.sin(mid)],5.4,13);
  }
  // puntos: hacia afuera de la estación
  P.forEach((p,i)=>{ const dx=p.x-S.x, dy=p.y-S.y, l=Math.hypot(dx,dy)||1; around(p,'P'+(i+1),4.5,CP,[dx/l,dy/l],5.2,12); });

  // D y Az de cada rayo: a lados opuestos, hacia el 60 % del rayo (letra de 3)
  const FS=3;
  P.forEach((p,i)=>{
    const dx=p.x-S.x, dy=p.y-S.y, L=Math.hypot(dx,dy); if(L<3) return;
    let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, g=[Math.sin(th),-Math.cos(th)], nl=[dy/L,-dx/L];
    [[corto?dTxt(i):`D${i+1} = ${dTxt(i)}`,CD,1],[corto?aTxt(i):`Az${i+1} = ${aTxt(i)}`,CZ,-1]].forEach(([t,col,sd])=>{
      const w=eng.tw(t,FS), cands=[];
      const centers=[]; for(let s=0.6*L; s<=L-w/2-1; s+=2) centers.push(s); for(let s=0.6*L-2; s>=w/2+4; s-=2) centers.push(s);
      if(!centers.length) centers.push(L/2);
      centers.forEach(s=>{
        [[sd,0],[sd,2.5],[-sd,0]].forEach(([sdd,ex])=>{
          const m=[nl[0]*sdd,nl[1]*sdd], dd=((g[0]*m[0]+g[1]*m[1])>0?1.5:4.1)+ex;
          cands.push({x:S.x+dx/L*s+m[0]*dd, y:S.y+dy/L*s+m[1]*dd, rot:ang, anchor:'middle', pen:Math.abs(s-0.6*L)*0.15+(sdd!==sd?10:0)+ex*1.2});
        });
      });
      if(Math.min(...cands.map(q=>eng.count(eng.box(t,FS,q),0.5)))>0) return;
      lab(t,FS,col,eng.pick(t,FS,cands));
    });
  });

  items.forEach(it=>{
    out += `<rect x="${f(it.x)}" y="${f(it.y-3.457)}" width="3.457" height="3.457" fill="${it.r.c}"/>\n`;
    out += `<text x="${f(it.x+5.185)}" y="${f(it.y)}" ${FONT} font-size="${FS_L}"><tspan fill="${it.r.c}">${it.r.k}</tspan><tspan fill="var(--ink)"> = ${it.r.v}</tspan></text>\n`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function svgCuadrilatero(mode, fuente){
  const w=300,h=210;
  const A={x:50,y:160}, B={x:110,y:30}, C={x:260,y:55}, D={x:225,y:175};
  const pts=[A,B,C,D];
  const poly = pts.map(p=>p.x+','+p.y).join(' ');
  let labels='';
  if(mode==='tri'){
    const names=['A1,B1','A2,B2','A3,B3','A4,B4'];
    pts.forEach((p,i)=>{
      const dx=p.x-161, dy=p.y-105, len=Math.hypot(dx,dy)||1;
      const lx=p.x+dx/len*20, ly=p.y+dy/len*20;
      labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="8.5" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">${names[i]}</text>`;
    });
  } else {
    const sideNames=['a','b','c','d'];
    for(let i=0;i<4;i++){
      const p1=pts[i], p2=pts[(i+1)%4];
      const mx=(p1.x+p2.x)/2, my=(p1.y+p2.y)/2;
      labels += `<text x="${mx.toFixed(1)}" y="${(my-6).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">${sideNames[i]}</text>`;
    }
    labels += `<text x="${((A.x+C.x)/2).toFixed(1)}" y="${((A.y+C.y)/2-6).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--blueprint)" text-anchor="middle">e</text>`;
    labels += `<text x="${((B.x+D.x)/2+12).toFixed(1)}" y="${((B.y+D.y)/2).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--blueprint)" text-anchor="middle">f</text>`;
  }
  const vNames=['A','B','C','D'];
  const dots = pts.map((p,i)=>{
    const dx=p.x-161, dy=p.y-105, len=Math.hypot(dx,dy)||1;
    const lx=p.x+dx/len*-16, ly=p.y+dy/len*-16;
    return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--ink)"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">${vNames[i]}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="${poly}" fill="var(--blueprint-soft)" fill-opacity="0.25" stroke="var(--blueprint)" stroke-width="1.8"/>
    <line x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="${B.x}" y1="${B.y}" x2="${D.x}" y2="${D.y}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/>
    ${dots}${labels}
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
