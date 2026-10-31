"use strict";
/* Herramienta «Rumbo y Distancia»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function svgRumboAzimut(e1, n1, e2, n2, r, fuente){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);
  const rum = `${r.rumbo.ns} ${fmtAngle(r.rumbo.ang)} ${r.rumbo.ew}`;
  const rows = [{k:'Distancia',c:'var(--accent)',v:`${fmtNum(r.dist,3)} m`},{k:'Azimut',c:'var(--success)',v:fmtAngle(r.az)},{k:'Rumbo',c:'var(--blueprint)',v:rum}];
  const ROW_Y0=12.521, ROW_DY=5.761;
  const maxRowW = Math.max(...rows.map(q=>eng.tw(`${q.k} = ${q.v}`,4.32)));
  eng.rectFill(8.5, 6.5, 15.2+maxRowW+1, ROW_Y0+2*ROW_DY+1.5);
  eng.rectFill(292, 3, 308, 38);
  // ---- geometría a escala (A y B dentro de la caja libre) ----
  const de=e2-e1, dn=n2-n1, deg=r.dist>1e-9;
  const left=62, right=268, top=56, bot=146;
  const spanE=Math.max(Math.abs(de),0.001), spanN=Math.max(Math.abs(dn),0.001);
  const sc=Math.min((right-left)/spanE,(bot-top)/spanN);
  const midX=(left+right)/2, midY=(top+bot)/2;
  const Ax=midX-de*sc/2, Ay=midY+dn*sc/2, Bx=midX+de*sc/2, By=midY-dn*sc/2;
  let out='';
  const R1=14, R2=24, az=r.az, pol=(rr,a)=>[Ax+rr*Math.sin(a*Math.PI/180), Ay-rr*Math.cos(a*Math.PI/180)];
  const sNorth = r.rumbo.ns==='S';
  // meridiano punteado por A
  const my0=Ay-28, my1=sNorth ? Math.min(Ay+34, H-5) : Ay+0;
  out += `<path d="M${f(Ax)} ${f(my0)} L${f(Ax)} ${f(my1)}" fill="none" stroke="var(--ink-soft)" stroke-width="0.6" stroke-dasharray="1.6 1.6" stroke-linecap="round"/>\n`;
  eng.seg(Ax,my0,Ax,my1);
  // arcos
  const arc=(rr,a0,a1,col)=>{ let d=((a1-a0)%360+540)%360-180; const sw=d>0?1:0, big=Math.abs(d)>180?1:0; const p=pol(rr,a0), q=pol(rr,a1);
    out += `<path d="M${f(p[0])} ${f(p[1])} A${rr} ${rr} 0 ${big} ${sw} ${f(q[0])} ${f(q[1])}" fill="none" stroke="${col}" stroke-width="0.8" stroke-linecap="round"/>\n`;
    for(let k=0;k<=14;k++){ const pp=pol(rr,a0+d*k/14); eng.pts.push(pp); } return d; };
  let bisAz=null, bisRu=null;
  if(deg && az>0.3 && az<359.7){ // arco de azimut: del norte hacia AB, siempre horario
    const sw=1, p=pol(R1,0), q=pol(R1,az); out += `<path d="M${f(p[0])} ${f(p[1])} A${R1} ${R1} 0 ${az>180?1:0} ${sw} ${f(q[0])} ${f(q[1])}" fill="none" stroke="var(--success)" stroke-width="0.8" stroke-linecap="round"/>\n`;
    for(let k=0;k<=14;k++) eng.pts.push(pol(R1,az*k/14)); bisAz=az/2; }
  const ra = r.rumbo.ang;
  if(deg && ra>0.3 && ra<179.7 && !(r.rumbo.ns==='N' && r.rumbo.ew==='E')){ const start = sNorth?180:0; const d=arc(R2,start,az,'var(--blueprint)'); bisRu=start+d/2; }
  // puntos
  out += `<path d="M${f(Ax)} ${f(Ay)} L${f(Bx)} ${f(By)}" fill="none" stroke="var(--accent)" stroke-width="0.8" stroke-linecap="round"/>\n`;
  eng.seg(Ax,Ay,Bx,By);
  [[Ax,Ay],[Bx,By]].forEach(p=>{ out += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="2" fill="var(--ink-soft)"/>\n`; eng.circle(p[0],p[1],2.3); });
  // norte
  out += `<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`;
  const lab=(t,fs,col,c)=>{ const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const omit=(t,fs,cands)=>!cands.length || Math.min(...cands.map(q=>eng.count(eng.box(t,fs,q),0.5)))>0;
  // N / S del meridiano
  lab('N',3,'var(--ink-soft)',eng.pick('N',3,[{x:Ax+3.6,y:my0+2.4,anchor:'middle'},{x:Ax-3.6,y:my0+2.4,anchor:'middle'}]));
  if(sNorth) lab('S',3,'var(--ink-soft)',eng.pick('S',3,[{x:Ax+3.6,y:my1-0.4,anchor:'middle'},{x:Ax-3.6,y:my1-0.4,anchor:'middle'}]));
  // distancia a lo largo de la línea (ambos lados, deslizando)
  if(deg){
    const dx=Bx-Ax, dy=By-Ay, len=Math.hypot(dx,dy); let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, u=[Math.cos(th),Math.sin(th)], g=[Math.sin(th),-Math.cos(th)];
    const t=`D = ${fmtNum(r.dist,3)} m`, w=eng.tw(t,3), tmax=Math.max(0,len/2-w/2-3), cands=[];
    for(let s=0;s<=tmax+1e-6;s+=2.5) for(const sg of [1,-1]){ if(s===0&&sg===-1) continue;
      for(const side of [1,-1]){ const nn=[g[0]*side,g[1]*side]; const d=(side===1?1.5:4.1)+0; // up (side 1) = glifo hacia afuera
        cands.push({x:(Ax+Bx)/2+u[0]*s*sg+nn[0]*d, y:(Ay+By)/2+u[1]*s*sg+nn[1]*d, rot:ang, anchor:'middle', pen:s*0.4+(side<0?1:0)}); } }
    if(!omit(t,3,cands)) lab(t,3,'var(--accent)',eng.pick(t,3,cands));
  }
  // azimut y rumbo sobre la bisectriz, a lo largo de ella
  const alongBis=(t,col,bis,rr)=>{
    if(bis===null) return; const w=eng.tw(t,3); let a=bis-90; while(a>90) a-=180; while(a<=-90) a+=180;
    const th=a*Math.PI/180, up=[Math.sin(th),-Math.cos(th)], cands=[];
    for(let g=rr+1.8; g<=rr+16; g+=1.5){ const c=pol(g+w/2,bis); cands.push({x:c[0]-up[0]*0.364*3, y:c[1]-up[1]*0.364*3, rot:a, anchor:'middle', pen:(g-rr)*0.5}); }
    if(omit(t,3,cands)) return; lab(t,3,col,eng.pick(t,3,cands)); };
  alongBis(`Az = ${fmtAngle(r.az)}`,'var(--success)',bisAz,R1);
  alongBis(`Rumbo = ${rum}`,'var(--blueprint)',bisRu,R2);
  // letras A y B hacia afuera de la línea
  [['A',Ax,Ay,-1],['B',Bx,By,1]].forEach(([nm,x,y,sg])=>{
    const dx=(Bx-Ax)*sg, dy=(By-Ay)*sg, l=Math.hypot(dx,dy)||1, ux=-dx/l, uy=-dy/l, cands=[];
    for(let rr=4.6; rr<=11; rr+=1.2) for(let da=-80; da<=80; da+=16){ const ca=Math.cos(da*Math.PI/180), sa=Math.sin(da*Math.PI/180); cands.push({x:x+(ux*ca-uy*sa)*rr, y:y+(ux*sa+uy*ca)*rr+1.6, anchor:'middle', pen:(rr-4.6)*1.5+Math.abs(da)*0.05}); }
    if(!deg) { cands.length=0; cands.push({x:x+6*sg*-1,y:y+1.6,anchor:'middle',pen:0}); }
    lab(nm,4.5,'var(--ink-soft)',eng.pick(nm,4.5,cands)); });
  // listado
  rows.forEach((q,i)=>{ const by=ROW_Y0+i*ROW_DY;
    out += `<rect x="10.03" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${q.c}"/>\n<text x="15.21" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${q.c}">${q.k}</tspan><tspan fill="var(--ink)"> = ${q.v}</tspan></text>\n`; });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function renderRumbo(){
  const body = `<div class="field-card">
    <h3>Punto 1</h3>
    ${libretaBloqueHTML('r_lib1','Punto 1 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este','r_e1',EJ_E0)}${fieldRow('Norte','r_n1',EJ_N0)}</div>
    <h3 style="margin-top:14px;">Punto 2</h3>
    ${libretaBloqueHTML('r_lib2','Punto 2 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este','r_e2',round(EJ_E0+159.87,2))}${fieldRow('Norte','r_n2',round(EJ_N0+54.45,2))}</div>
    <button class="btn" id="btnR" type="button">Calcular</button>
    <div id="resR"></div>
  </div>`;
  toolShell('rumbo','Distancia, azimut y rumbo entre dos puntos con coordenadas conocidas.', body);
  const rMetas = [null, null];
  libretaTraerA('r_lib1','r_e1','r_n1', m=>{ rMetas[0]=m; });
  libretaTraerA('r_lib2','r_e2','r_n2', m=>{ rMetas[1]=m; });
  document.getElementById('btnR').addEventListener('click', ()=>{
    const e1=val('r_e1'),n1=val('r_n1'),e2=val('r_e2'),n2=val('r_n2');
    const box=document.getElementById('resR');
    const inc = metasIncompatibles(rMetas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    if([e1,n1,e2,n2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las cuatro coordenadas.</p>`; return; }
    const r = calcRumboDistancia(e1,n1,e2,n2);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia</span><span class="v accent big">${fmtNum(r.dist,3)} m</span></div>
      <div class="result-row"><span class="k">Azimut</span><span class="v">${fmtAngle(r.az)}</span></div>
      <div class="result-row"><span class="k">Rumbo</span><span class="v">${r.rumbo.ns} ${fmtAngle(r.rumbo.ang)} ${r.rumbo.ew}</span></div>
      <div class="plot-wrap">${svgRumboAzimut(e1,n1,e2,n2,r)}</div>
    </div>`;
  });
}

const RENDERERS = { rumbo: renderRumbo };
