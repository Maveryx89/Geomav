"use strict";
/* Herramienta «Intersección de Rectas»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcInterseccion(e1,n1,az1,e2,n2,az2){
  const a1=toRad(az1), a2=toRad(az2);
  const D = Math.sin(a2-a1);
  if(Math.abs(D)<1e-9) return null;
  const t1 = ( -(e2-e1)*Math.cos(a2) + Math.sin(a2)*(n2-n1) ) / D;
  const t2 = ( -(e2-e1)*Math.cos(a1) + Math.sin(a1)*(n2-n1) ) / D;
  const E = e1 + t1*Math.sin(a1);
  const N = n1 + t1*Math.cos(a1);
  let ang = Math.abs(normDeg(az2-az1));
  if(ang>180) ang=360-ang;
  if(ang>90) ang=180-ang;
  return {E,N,dist1:t1,dist2:t2,ang};
}
function svgInterseccion(e1,n1,az1,e2,n2,az2,eI,nI){
  const W=320, H=190, EXT=14;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const CB1='var(--blueprint)', CB2='var(--success)', CI='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const s1=Math.sin(toRad(az1)), c1=Math.cos(toRad(az1)), s2=Math.sin(toRad(az2)), c2=Math.cos(toRad(az2));
  const t1=(eI-e1)*s1+(nI-n1)*c1, t2=(eI-e2)*s2+(nI-n2)*c2;                 // distancias con signo estación → I
  let ang=Math.abs(normDeg(az2-az1)); if(ang>180) ang=360-ang; if(ang>90) ang=180-ang;
  const aTxt = v => fmtAngle(v);

  // ---- listado ----
  const rows1=[{k:'E',c:CI,v:fmtNum(eI,3)},{k:'N',c:CI,v:fmtNum(nI,3)},{k:'Ángulo',c:CK,v:aTxt(ang)},{k:'D1',c:CB1,v:`${fmtNum(t1,3)} m`},{k:'D2',c:CB2,v:`${fmtNum(t2,3)} m`}];
  const rows2=[{k:'Az1',c:CB1,v:aTxt(az1)},{k:'Az2',c:CB2,v:aTxt(az2)}];
  const ROW_Y0=12.521, ROW_DY=5.761, FS_L=4.32;
  const w1=Math.max(...rows1.map(q=>eng.tw(`${q.k} = ${q.v}`,FS_L)));
  const OX2=Math.max(80, 10.026+5.2+w1+9);
  const items=[]; rows1.forEach((q,i)=>items.push({q,x:10.026,y:ROW_Y0+i*ROW_DY})); rows2.forEach((q,i)=>items.push({q,x:OX2,y:ROW_Y0+i*ROW_DY}));
  let listRight=0, listBottom=0;
  items.forEach(it=>{ listRight=Math.max(listRight,it.x+5.2+eng.tw(`${it.q.k} = ${it.q.v}`,FS_L)+1); listBottom=Math.max(listBottom,it.y+1); });
  eng.rectFill(8.5,6.5,listRight,listBottom+0.5);
  eng.rectFill(292,3,308,38);

  // ---- geometría a escala (estaciones e I; las prolongaciones tienen largo fijo en pantalla) ----
  const left=78, right=262, top=Math.max(62,listBottom+20), bot=150;
  const Es=[e1,e2,eI], Ns=[n1,n2,nI];
  const minE=Math.min(...Es), maxE=Math.max(...Es), minN=Math.min(...Ns), maxN=Math.max(...Ns);
  const spanE=maxE-minE, spanN=maxN-minN;
  let sc=Math.min((right-left)/Math.max(spanE,1e-9),(bot-top)/Math.max(spanN,1e-9));
  if(!isFinite(sc) || spanE+spanN<1e-9) sc=1;
  const ox=(left+right)/2-(spanE*sc)/2, oy=(top+bot)/2+(spanN*sc)/2;
  const X=e=>ox+(e-minE)*sc, Y=n=>oy-(n-minN)*sc;
  const P1={x:X(e1),y:Y(n1)}, P2={x:X(e2),y:Y(n2)}, I={x:X(eI),y:Y(nI)};
  const d1=[s1,-c1], d2=[s2,-c2];
  const sg1=t1>=0?1:-1, sg2=t2>=0?1:-1;

  let out='';
  const rect=(P,d,sg,col)=>{
    const a={x:P.x-d[0]*sg*EXT, y:P.y-d[1]*sg*EXT}, b={x:I.x+d[0]*sg*EXT, y:I.y+d[1]*sg*EXT};
    out += `<path d="M${f(a.x)} ${f(a.y)} L${f(P.x)} ${f(P.y)}" fill="none" stroke="${col}" stroke-width="0.8" stroke-linecap="round" stroke-dasharray="2 1.6" opacity="0.45"/>\n`;
    out += `<path d="M${f(P.x)} ${f(P.y)} L${f(I.x)} ${f(I.y)}" fill="none" stroke="${col}" stroke-width="0.8" stroke-linecap="round"/>\n`;
    out += `<path d="M${f(I.x)} ${f(I.y)} L${f(b.x)} ${f(b.y)}" fill="none" stroke="${col}" stroke-width="0.8" stroke-linecap="round" stroke-dasharray="2 1.6" opacity="0.45"/>\n`;
    eng.seg(a.x,a.y,b.x,b.y,1);
  };
  rect(P1,d1,sg1,CB1); rect(P2,d2,sg2,CB2);

  // arco del ángulo agudo en I
  const r1=sg1>0?[-d1[0],-d1[1]]:[d1[0],d1[1]];
  let r2=sg2>0?[-d2[0],-d2[1]]:[d2[0],d2[1]];
  if(r1[0]*r2[0]+r1[1]*r2[1]<0) r2=[-r2[0],-r2[1]];
  const L1=Math.hypot(P1.x-I.x,P1.y-I.y), L2=Math.hypot(P2.x-I.x,P2.y-I.y);
  const R=Math.min(9, 0.45*Math.max(0.01,Math.min(L1>0.5?L1:99, L2>0.5?L2:99)));
  const a1=Math.atan2(r1[1],r1[0]), a2=Math.atan2(r2[1],r2[0]), da=(a2-a1+Math.PI)%(2*Math.PI)-Math.PI, sw=da>0?1:0;
  out += `<path d="M${f(I.x+R*Math.cos(a1))} ${f(I.y+R*Math.sin(a1))} A${f(R)} ${f(R)} 0 0 ${sw} ${f(I.x+R*Math.cos(a2))} ${f(I.y+R*Math.sin(a2))}" fill="none" stroke="var(--ink)" stroke-width="0.8" stroke-linecap="round"/>\n`;
  for(let t=0;t<=1.0001;t+=0.1){ const an=a1+da*t; eng.pts.push([I.x+R*Math.cos(an),I.y+R*Math.sin(an)]); }
  out += `<circle cx="${f(P1.x)}" cy="${f(P1.y)}" r="2" fill="var(--ink-soft)"/>\n<circle cx="${f(P2.x)}" cy="${f(P2.y)}" r="2" fill="var(--ink-soft)"/>\n`;
  out += `<circle cx="${f(I.x)}" cy="${f(I.y)}" r="2.7" fill="var(--accent)"/>\n`;
  eng.circle(P1.x,P1.y,2.3); eng.circle(P2.x,P2.y,2.3); eng.circle(I.x,I.y,3);
  out += `<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n`;
  out += `<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`;

  const lab=(t,fs,col,cd)=>{ const q=eng.txtAttrs(cd); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const around=(pt,t,fs,col,pref,r0,rmax)=>{       // rótulo alrededor de un punto, con dirección preferida
    const cands=[];
    for(let r=r0;r<=rmax;r+=1.2) for(let an=0;an<360;an+=15){
      const dx=Math.cos(an*Math.PI/180), dy=Math.sin(an*Math.PI/180);
      const dp=Math.acos(Math.max(-1,Math.min(1,dx*pref[0]+dy*pref[1])))*180/Math.PI;
      cands.push({x:pt.x+dx*r, y:pt.y+dy*r+0.36*fs, anchor:'middle', pen:(r-r0)*1.2+dp*0.08});
    }
    lab(t,fs,col,eng.pick(t,fs,cands));
  };
  around(P1,'Es1',4.5,CS,[-0.3,1],5.2,12); around(P2,'Es2',4.5,CS,[0.3,1],5.2,12);
  around(I,'I',4.5,CI,[0,-1],4.8,12);

  // D y Az de cada recta: a lados opuestos de la línea, hacia el centro del tramo
  const sideLabels=(P,d,sg,other,tD,tA,col)=>{
    const L=Math.hypot(I.x-P.x,I.y-P.y), dx=(I.x-P.x), dy=(I.y-P.y);
    let ux=L>1e-6?dx/L:d[0]*sg, uy=L>1e-6?dy/L:d[1]*sg;
    let angR=Math.atan2(uy,ux)*180/Math.PI; if(angR>90) angR-=180; if(angR<-90) angR+=180;
    const th=angR*Math.PI/180, g=[Math.sin(th),-Math.cos(th)], uu=[Math.cos(th),Math.sin(th)];
    let nx=-uy, ny=ux; if(nx*(other.x-P.x)+ny*(other.y-P.y)>0){ nx=-nx; ny=-ny; }       // normal: lado alejado de la otra estación
    const mx=P.x+ux*L/2, my=P.y+uy*L/2;
    [[tD,1],[tA,-1]].forEach(([t,sd])=>{
      const smax=Math.max(0,L/2-eng.tw(t,4)/2-3)+8, cands=[];
      for(let s=0;s<=smax+1e-6;s+=2.5) for(const sgn of [1,-1]){ if(s===0&&sgn===-1) continue;
        [[sd,0],[sd,3.6],[sd,7.2],[-sd,0],[-sd,3.6]].forEach(([sdd,ex])=>{
          const m=[nx*sdd,ny*sdd], dd=((g[0]*m[0]+g[1]*m[1])>0?1.9:4.8)+ex;
          cands.push({x:mx+uu[0]*s*sgn+m[0]*dd, y:my+uu[1]*s*sgn+m[1]*dd, rot:angR, anchor:'middle', pen:s*0.4+(sdd!==sd?10:0)+ex*1.2});
        });
      }
      if(Math.min(...cands.map(q=>eng.count(eng.box(t,4,q),0.5)))>0) return;        // sin sitio libre: queda solo en el listado
      lab(t,4,col,eng.pick(t,4,cands));
    });
  };
  sideLabels(P1,d1,sg1,P2,`D1 = ${fmtNum(t1,3)} m`,`Az1 = ${aTxt(az1)}`,CB1);
  sideLabels(P2,d2,sg2,P1,`D2 = ${fmtNum(t2,3)} m`,`Az2 = ${aTxt(az2)}`,CB2);

  // ángulo entre rectas: junto al arco, hacia la bisectriz del ángulo agudo o por fuera
  {
    const t=`Áng = ${aTxt(ang)}`, tw=eng.tw(t,4), bis=[r1[0]+r2[0],r1[1]+r2[1]], bl=Math.hypot(bis[0],bis[1])||1, cands=[];
    const b0=[bis[0]/bl,bis[1]/bl];
    for(let r=R+tw/2+2; r<=R+tw/2+36; r+=2) for(let an=0;an<360;an+=15){
      const dx=Math.cos(an*Math.PI/180), dy=Math.sin(an*Math.PI/180), dp=Math.acos(Math.max(-1,Math.min(1,dx*b0[0]+dy*b0[1])))*180/Math.PI;
      cands.push({x:I.x+dx*r, y:I.y+dy*r+1.4, anchor:'middle', pen:(r-R-tw/2-2)*0.25+dp*0.1});
    }
    lab(t,4,CK,eng.pick(t,4,cands));
  }

  items.forEach(it=>{
    out += `<rect x="${f(it.x)}" y="${f(it.y-3.457)}" width="3.457" height="3.457" fill="${it.q.c}"/>\n`;
    out += `<text x="${f(it.x+5.185)}" y="${f(it.y)}" ${FONT} font-size="${FS_L}"><tspan fill="${it.q.c}">${it.q.k}</tspan><tspan fill="var(--ink)"> = ${it.q.v}</tspan></text>\n`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function renderInterseccion(){
  const body = `<div class="field-card">
    <h3>Recta 1</h3>
    ${libretaBloqueHTML('ix_lib1','Punto de la recta 1 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este','ix_e1',EJ_E0)}${fieldRow('Norte','ix_n1',EJ_N0)}</div>
    ${angleFieldHTML('ix_az1', 45, 'Azimut de la recta 1')}
    <h3 style="margin-top:14px;">Recta 2</h3>
    ${libretaBloqueHTML('ix_lib2','Punto de la recta 2 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este','ix_e2',round(EJ_E0+120,2))}${fieldRow('Norte','ix_n2',EJ_N0)}</div>
    ${angleFieldHTML('ix_az2', 135, 'Azimut de la recta 2')}
    <button class="btn" id="btnIX" type="button">Calcular</button>
    <div id="resIX"></div>
  </div>`;
  toolShell('interseccion','Encuentra el punto de intersección de dos visuales (rectas) definidas cada una por un punto y su azimut, y el ángulo entre ambas.', body);
  const ixMetas = [null, null];
  libretaTraerA('ix_lib1','ix_e1','ix_n1', m=>{ ixMetas[0]=m; });
  libretaTraerA('ix_lib2','ix_e2','ix_n2', m=>{ ixMetas[1]=m; });
  document.getElementById('btnIX').addEventListener('click', ()=>{
    const e1=val('ix_e1'),n1=val('ix_n1'),az1=readAngleField('ix_az1');
    const e2=val('ix_e2'),n2=val('ix_n2'),az2=readAngleField('ix_az2');
    const box=document.getElementById('resIX');
    const inc = metasIncompatibles(ixMetas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    if([e1,n1,az1,e2,n2,az2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcInterseccion(e1,n1,az1,e2,n2,az2);
    if(!r){ box.innerHTML=`<p class="err-msg">Las rectas son paralelas — no se intersectan.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Este (E)</span><span class="v accent big">${fmtNum(r.E,3)}</span></div>
      <div class="result-row"><span class="k">Norte (N)</span><span class="v accent big">${fmtNum(r.N,3)}</span></div>
      <div class="result-row"><span class="k">Distancia desde P1</span><span class="v">${fmtNum(r.dist1,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia desde P2</span><span class="v">${fmtNum(r.dist2,3)} m</span></div>
      <div class="result-row"><span class="k">Ángulo entre rectas</span><span class="v">${fmtAngle(r.ang)}</span></div>
      <div class="plot-wrap">${svgInterseccion(e1,n1,az1,e2,n2,az2,r.E,r.N)}</div>
    </div>`;
  });
}

const RENDERERS = { interseccion: renderInterseccion };
