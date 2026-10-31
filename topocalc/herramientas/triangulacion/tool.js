"use strict";
/* Herramienta «Triangulación»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcTriangulacion(a,b,c){
  if(a+b<=c || a+c<=b || b+c<=a) return null; // no forma triangulo
  const cosA=(b*b+c*c-a*a)/(2*b*c);
  const cosB=(a*a+c*c-b*b)/(2*a*c);
  const cosC=(a*a+b*b-c*c)/(2*a*b);
  const A=toDeg(Math.acos(Math.max(-1,Math.min(1,cosA))));
  const B=toDeg(Math.acos(Math.max(-1,Math.min(1,cosB))));
  const C=180-A-B;
  const s=(a+b+c)/2;
  const area=Math.sqrt(s*(s-a)*(s-b)*(s-c));
  return {A,B,C,area,perimetro:a+b+c};
}
function svgTriangulacion(a, b, c, r){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const CA='var(--blueprint)', CB='var(--success)', CC='var(--ink-soft)', CAR='var(--accent)', CI='var(--ink)';
  const colV = [CA,CB,CC], names=['A','B','C'];
  const per = a+b+c;
  const sTxt = v => fmtNum(v,2);

  // ---- listado ----
  const rows1=[{k:'a',c:CA,v:sTxt(a)},{k:'b',c:CB,v:sTxt(b)},{k:'c',c:CC,v:sTxt(c)},{k:'Perímetro',c:CI,v:sTxt(per),nocol:1},{k:'Área',c:CAR,v:fmtNum(r.area,3)}];
  const rows2=[{k:'A',c:CA,v:fmtAngle(r.A)},{k:'B',c:CB,v:fmtAngle(r.B)},{k:'C',c:CC,v:fmtAngle(r.C)}];
  const ROW_Y0=12.521, ROW_DY=5.761, FS_L=4.32;
  const w1=Math.max(...rows1.map(q=>eng.tw(`${q.k} = ${q.v}`,FS_L)));
  const OX2=Math.max(70, 10.026+5.2+w1+9);
  const items=[]; rows1.forEach((q,i)=>items.push({q,x:10.026,y:ROW_Y0+i*ROW_DY})); rows2.forEach((q,i)=>items.push({q,x:OX2,y:ROW_Y0+i*ROW_DY}));
  let listRight=0, listBottom=0;
  items.forEach(it=>{ listRight=Math.max(listRight,it.x+5.2+eng.tw(`${it.q.k} = ${it.q.v}`,FS_L)+1); listBottom=Math.max(listBottom,it.y+1); });
  eng.rectFill(8.5,6.5,listRight,listBottom+0.5);

  // ---- triángulo a escala: A en el origen, B a la derecha ----
  const cosA=Math.cos(toRad(r.A)), sinA=Math.sin(toRad(r.A));
  const P=[[0,0],[c,0],[b*cosA,b*sinA]];
  const minX=Math.min(...P.map(p=>p[0])), maxX=Math.max(...P.map(p=>p[0])), maxY=P[2][1];
  const left=77, right=248, top=Math.max(62,listBottom+22), bot=150;
  const sc=Math.min((right-left)/Math.max(maxX-minX,1e-6),(bot-top)/Math.max(maxY,1e-6));
  const ox=(left+right)/2-((maxX-minX)*sc)/2-minX*sc, oy=(top+bot)/2+(maxY*sc)/2;
  const V=P.map(p=>({x:ox+p[0]*sc, y:oy-p[1]*sc}));
  const cx=(V[0].x+V[1].x+V[2].x)/3, cy=(V[0].y+V[1].y+V[2].y)/3;
  const side=[[V[1],V[2]],[V[2],V[0]],[V[0],V[1]]];      // a (BC), b (CA), c (AB)
  const sName=['a','b','c'], sVal=[a,b,c], sCol=[CA,CB,CC];
  const len=(p,q)=>Math.hypot(q.x-p.x,q.y-p.y);

  let out='';
  out += `<path d="M${f(V[0].x)} ${f(V[0].y)} L${f(V[1].x)} ${f(V[1].y)} L${f(V[2].x)} ${f(V[2].y)} Z" fill="var(--accent)" fill-opacity="0.14" stroke="none"/>\n`;
  [[2,'c'],[0,'a'],[1,'b']].forEach(([i,n])=>{ const [p,q]=side[i]; eng.seg(p.x,p.y,q.x,q.y);
    out += `<path d="M${f(p.x)} ${f(p.y)} L${f(q.x)} ${f(q.y)}" fill="none" stroke="${sCol[i]}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`; });
  // arcos de ángulo (radio 9 o menos si el lado es corto)
  const arcR=[0,1,2].map(i=>Math.min(9, 0.4*Math.min(len(V[i],V[(i+1)%3]),len(V[i],V[(i+2)%3]))));
  [0,1,2].forEach(i=>{
    const Vv=V[i], P1=V[(i+1)%3], P2=V[(i+2)%3], rr=arcR[i];
    const a1=Math.atan2(P1.y-Vv.y,P1.x-Vv.x), a2=Math.atan2(P2.y-Vv.y,P2.x-Vv.x);
    const d=(a2-a1+Math.PI)%(2*Math.PI)-Math.PI, sw=d>0?1:0;
    const x1=Vv.x+rr*Math.cos(a1), y1=Vv.y+rr*Math.sin(a1), x2=Vv.x+rr*Math.cos(a2), y2=Vv.y+rr*Math.sin(a2);
    out += `<path d="M${f(x1)} ${f(y1)} A${f(rr)} ${f(rr)} 0 0 ${sw} ${f(x2)} ${f(y2)}" fill="none" stroke="${colV[i]}" stroke-width="0.8" stroke-linecap="round"/>\n`;
    for(let t=0;t<=1.0001;t+=0.1){ const an=a1+d*t; eng.pts.push([Vv.x+rr*Math.cos(an),Vv.y+rr*Math.sin(an)]); }
  });
  V.forEach(p=>{ out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="2" fill="var(--ink-soft)"/>\n`; eng.circle(p.x,p.y,2.3); });

  const lab=(t,fs,col,cd)=>{ const q=eng.txtAttrs(cd); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const inside=(x,y)=>{ const s=(p,q)=>(q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x); const d1=s(V[0],V[1]),d2=s(V[1],V[2]),d3=s(V[2],V[0]); return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0)); };

  // letras de vértice (grandes), por fuera: A y B abajo, C arriba
  const FL=9.92;
  [0,1,2].forEach(i=>{
    const e=[-(V[(i+1)%3].x-V[i].x)/len(V[i],V[(i+1)%3])-(V[(i+2)%3].x-V[i].x)/len(V[i],V[(i+2)%3]),
             -(V[(i+1)%3].y-V[i].y)/len(V[i],V[(i+1)%3])-(V[(i+2)%3].y-V[i].y)/len(V[i],V[(i+2)%3])];
    const el=Math.hypot(e[0],e[1])||1, pref=i===2?[0,-1]:[0,1], cands=[];
    for(let ang=0;ang<360;ang+=15) for(let rr=6.5;rr<=15;rr+=1.5){
      const dx=Math.cos(ang*Math.PI/180), dy=Math.sin(ang*Math.PI/180);
      const dp=Math.acos(Math.max(-1,Math.min(1,dx*pref[0]+dy*pref[1])))*180/Math.PI;
      const de=Math.acos(Math.max(-1,Math.min(1,(dx*e[0]+dy*e[1])/el)))*180/Math.PI;
      cands.push({x:V[i].x+dx*rr, y:V[i].y+dy*rr+0.36*FL, anchor:'middle', pen:(rr-6.5)*1.2+Math.min(dp,de)*0.12+Math.max(0,90-de)*0.0});
    }
    lab(names[i],FL,colV[i],eng.pick(names[i],FL,cands));
  });

  // valor de cada ángulo: por dentro, a lo largo de un lado adyacente, pasado su arco
  const angTxt=[fmtAngle(r.A),fmtAngle(r.B),fmtAngle(r.C)];
  const mainSide=[1,0,2];                                   // A→B, B→A, C→A  (índices de vértice destino: 1,0,0)
  const dest=[[1,2],[0,2],[0,1]];                           // destino principal y alterno
  [0,1,2].forEach(i=>{
    const t=`${names[i]} = ${angTxt[i]}`, tw=eng.tw(t,4), cands=[];
    const order = i===2 ? [0,1] : [0,1];
    const dests = i===0 ? [1,2] : (i===1 ? [0,2] : [0,1]);
    dests.forEach((dj,di)=>{
      const p=V[i], q=V[dj], L=len(p,q), ux=(q.x-p.x)/L, uy=(q.y-p.y)/L;
      let ang=Math.atan2(uy,ux)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
      const th=ang*Math.PI/180, g=[Math.sin(th),-Math.cos(th)];
      let nx=uy, ny=-ux; if((cx-p.x)*nx+(cy-p.y)*ny<0){ nx=-nx; ny=-ny; }     // normal hacia el interior
      const s0=arcR[i]+2+tw/2;
      for(let s=s0; s<=L-tw/2-2; s+=2) [[1,0],[1,2.5],[-1,0]].forEach(([sd,ex])=>{
        const m=[nx*sd,ny*sd], dd=((g[0]*m[0]+g[1]*m[1])>0?3:5.5)+ex;
        cands.push({x:p.x+ux*s+m[0]*dd, y:p.y+uy*s+m[1]*dd, rot:ang, anchor:'middle', pen:(s-s0)*0.15+di*4+(sd<0?12:0)+ex*1.2});
      });
    });
    if(!cands.length) cands.push({x:V[i].x, y:V[i].y-14, anchor:'middle', pen:50});
    if(Math.min(...cands.map(q=>eng.count(eng.box(t,4,q),0.5)))>0) return;     // sin sitio libre: se omite del dibujo (queda en el listado)
    lab(t,4,colV[i],eng.pick(t,4,cands));
  });

  // lados: por fuera, a lo largo de su línea
  [0,1,2].forEach(i=>{
    const [p,q]=side[i], L=len(p,q), dx=q.x-p.x, dy=q.y-p.y;
    let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, g=[Math.sin(th),-Math.cos(th)], u=[Math.cos(th),Math.sin(th)];
    let nx=dy/L, ny=-dx/L; if((cx-(p.x+q.x)/2)*nx+(cy-(p.y+q.y)/2)*ny>0){ nx=-nx; ny=-ny; }
    const t=`${sName[i]} = ${sTxt(sVal[i])}`, mx=(p.x+q.x)/2, my=(p.y+q.y)/2, tmax=Math.max(0,L/2-eng.tw(t,4)/2-3), cands=[];
    for(let s=0;s<=tmax+1e-6;s+=2.5) for(const sg of [1,-1]){ if(s===0&&sg===-1) continue;
      [[1,0],[1,3.6],[1,7.2],[-1,0],[-1,3.6]].forEach(([sd,ex])=>{
        const m=[nx*sd,ny*sd], dd=((g[0]*m[0]+g[1]*m[1])>0?1.9:4.8)+ex;
        cands.push({x:mx+u[0]*s*sg+m[0]*dd, y:my+u[1]*s*sg+m[1]*dd, rot:ang, anchor:'middle', pen:s*0.4+(sd<0?10:0)+ex*1.2});
      });
    }
    if(Math.min(...cands.map(q=>eng.count(eng.box(t,4,q),0.5)))>0) return;
    lab(t,4,sCol[i],eng.pick(t,4,cands));
  });

  // área: en el interior, lo más lejos posible de los bordes (si no cabe, al costado)
  {
    const dEdge=(x,y)=>{ let m=1e9; for(let i=0;i<3;i++){ const p=V[i],q=V[(i+1)%3],dx=q.x-p.x,dy=q.y-p.y,l2=dx*dx+dy*dy||1; let t=((x-p.x)*dx+(y-p.y)*dy)/l2; t=Math.max(0,Math.min(1,t)); m=Math.min(m,Math.hypot(x-p.x-t*dx,y-p.y-t*dy)); } return m; };
    const t=`Área = ${fmtNum(r.area,3)}`, cands=[]; let best=0; const pts=[];
    const xs=V.map(p=>p.x), ys=V.map(p=>p.y);
    for(let x=Math.min(...xs);x<=Math.max(...xs);x+=2.5) for(let y=Math.min(...ys);y<=Math.max(...ys);y+=2.5) if(inside(x,y)){ const d=dEdge(x,y); pts.push([x,y,d]); best=Math.max(best,d); }
    pts.forEach(([x,y,d])=>cands.push({x,y:y+1.5,anchor:'middle',pen:(best-d)*0.8}));
    const tw0=eng.tw(t,4.5), my0=(Math.min(...ys)+Math.max(...ys))/2;
    for(let dy=-30;dy<=30;dy+=6){ cands.push({x:Math.max(...xs)+8+tw0/2,y:my0+dy,anchor:'middle',pen:30+Math.abs(dy)*0.1}); cands.push({x:Math.min(...xs)-8-tw0/2,y:my0+dy,anchor:'middle',pen:30+Math.abs(dy)*0.1}); }
    lab(t,4.5,'var(--accent)',eng.pick(t,4.5,cands));
  }

  // listado
  items.forEach(it=>{
    out += `<rect x="${f(it.x)}" y="${f(it.y-3.457)}" width="3.457" height="3.457" fill="${it.q.c}"/>\n`;
    out += it.q.nocol
      ? `<text x="${f(it.x+5.185)}" y="${f(it.y)}" ${FONT} font-size="${FS_L}" fill="var(--ink)">${it.q.k} = ${it.q.v}</text>\n`
      : `<text x="${f(it.x+5.185)}" y="${f(it.y)}" ${FONT} font-size="${FS_L}"><tspan fill="${it.q.c}">${it.q.k}</tspan><tspan fill="var(--ink)"> = ${it.q.v}</tspan></text>\n`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function renderTriangulacion(){
  const body = `<div class="field-card">
    ${fieldRow('Lado a (opuesto a A)','tr_a',3)}
    ${fieldRow('Lado b (opuesto a B)','tr_b',4)}
    ${fieldRow('Lado c (opuesto a C)','tr_c',5)}
    <button class="btn" id="btnTR" type="button">Calcular</button>
    <div id="resTR"></div>
  </div>`;
  toolShell('triangulacion','Resuelve un triángulo conocidos sus tres lados (SSS) mediante la ley de los cosenos — útil para triangulación y verificación de poligonales.', body);
  document.getElementById('btnTR').addEventListener('click', ()=>{
    const a=val('tr_a'), b=val('tr_b'), c=val('tr_c');
    const box=document.getElementById('resTR');
    if([a,b,c].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa los tres lados.</p>`; return; }
    const r = calcTriangulacion(a,b,c);
    if(!r){ box.innerHTML=`<p class="err-msg">Esos tres lados no forman un triángulo válido (la suma de dos lados debe superar al tercero).</p>`; return; }
    const svg = svgTriangulacion(a,b,c,r);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Ángulo A</span><span class="v accent">${fmtAngle(r.A)}</span></div>
      <div class="result-row"><span class="k">Ángulo B</span><span class="v accent">${fmtAngle(r.B)}</span></div>
      <div class="result-row"><span class="k">Ángulo C</span><span class="v accent">${fmtAngle(r.C)}</span></div>
      <div class="result-row"><span class="k">Perímetro</span><span class="v">${fmtNum(r.perimetro,3)}</span></div>
      <div class="result-row"><span class="k">Área (Herón)</span><span class="v big">${fmtNum(r.area,3)}</span></div>
      <div class="plot-wrap">${svg}</div>
    </div>`;
  });
}

const RENDERERS = { triangulacion: renderTriangulacion };
