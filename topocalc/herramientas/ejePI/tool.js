"use strict";
/* Herramienta «Alineamiento por PI (Roadvias)»: eje vial definido por sus vértices (PI) con curvas circulares o
   con espirales de transición (clotoides, simétricas o asimétricas); calcula elementos, progresivas y coordenadas
   de TE/EC/CE/ET (o PC/PT) y replantea cualquier progresiva con desfase lateral desde una estación (azimut y
   distancia con factor de corrección F). Incluye el replanteo de taludes con banquetas del programa ROADVIAS de la
   calculadora Casio fx-9860GII. Ángulos internos en grados decimales.
   Lateral — convención Casio: en tangente + a la derecha; en curva + hacia el exterior de la curva. */
const EP_K = 57.29577951;
let epN = 2;
let epModelo = null, epStake = null, epEst = null;

/* Serie de la clotoide: s = longitud recorrida, G = ángulo de la tangente (rad) en ese punto. */
function epSer(s,G){
  const X = s*(1-G**2/10+G**4/216-G**6/9360+G**8/685440-G**10/76204800);
  const Y = s*(G/3-G**3/42+G**5/1320-G**7/75600+G**9/6894720);
  return [X,Y];
}
const epU  = az => { const a=toRad(az); return [Math.cos(a),Math.sin(a)]; };      // [N,E] de la dirección
const epRt = az => { const u=epU(az); return [-u[1],u[0]]; };                      // a la derecha de la dirección

/* ini {N,E,prog}; pis [{N,E,R,L1,L2,prog|NaN}]; fin {N,E,prog|NaN}. Devuelve {err} o el modelo del eje. */
function calcEjePI(ini, pis, fin){
  const pts=[ini,...pis,fin], m=pis.length;
  if(m<1) return {err:'Ingresa al menos un PI.'};
  const seg=[];
  for(let k=0;k<=m;k++){
    const dN=pts[k+1].N-pts[k].N, dE=pts[k+1].E-pts[k].E, D=Math.hypot(dN,dE);
    if(!(D>1e-9)) return {err:`Los puntos ${k===0?'de inicio':'PI '+k} y ${k+1===m+1?'final':'PI '+(k+1)} coinciden.`};
    seg.push({az:normDeg(toDeg(Math.atan2(dE,dN))), D});
  }
  const cv=[]; let endPrev=ini.prog, ToutPrev=0;
  for(let j=1;j<=m;j++){
    const p=pis[j-1], az1=seg[j-1].az, az2=seg[j].az;
    let defl=az2-az1; if(defl>180) defl-=360; if(defl<-180) defl+=360;
    const I=Math.abs(defl), R=p.R, L1=p.L1>0?p.L1:0, L2=p.L2>0?p.L2:0;
    if(!(R>0)) return {err:`PI ${j}: el radio debe ser mayor que 0.`};
    if(I<1e-6) return {err:`PI ${j}: los tres puntos están alineados (no hay deflexión).`};
    if(I>179.99) return {err:`PI ${j}: la deflexión es demasiado cerrada (retorno).`};
    const side=defl>0?1:-1, sp=L1>0||L2>0;
    const t1=L1/(2*R), t2=L2/(2*R);                    // ángulos de espiral (rad)
    const [X1,Y1]=L1>0?epSer(L1,t1):[0,0], [X2,Y2]=L2>0?epSer(L2,t2):[0,0];
    const p1=L1>0?Y1-R*(1-Math.cos(t1)):0, k1=L1>0?X1-R*Math.sin(t1):0;
    const p2=L2>0?Y2-R*(1-Math.cos(t2)):0, k2=L2>0?X2-R*Math.sin(t2):0;
    const th1=toDeg(t1), th2=toDeg(t2), Dc=I-(th1+th2);
    if(!(Dc>1e-9)) return {err:`PI ${j}: la deflexión (${fmtAngle(I)}) es menor que la suma de los ángulos de las espirales (${fmtAngle(th1+th2)}). Aumenta el radio o acorta las espirales.`};
    const Dr=toRad(I);
    const b=((R+p1)-(R+p2)*Math.cos(Dr))/Math.sin(Dr), a=-b*Math.cos(Dr)+(R+p2)*Math.sin(Dr);
    const Tin=a+k1, Tout=b+k2;
    const Dg=seg[j-1].D-ToutPrev-Tin;                 // recta entre la curva anterior y ésta
    if(Dg<-1e-6) return {err:`Las curvas de los PI ${j-1>0?j-1:'inicio'} y ${j} se traslapan: faltan ${fmtNum(-Dg,3)} m de recta entre ellas. Reduce los radios o las espirales.`};
    const start = Number.isFinite(p.prog) ? p.prog : endPrev+Dg;
    const Lcc=R*toRad(Dc), end=start+L1+Lcc+L2;
    const PI=[p.N,p.E], u1=epU(az1), u2=epU(az2), r1=epRt(az1), r2=epRt(az2);
    const TE=[PI[0]-Tin*u1[0], PI[1]-Tin*u1[1]], ET=[PI[0]+Tout*u2[0], PI[1]+Tout*u2[1]];
    const EC=[TE[0]+X1*u1[0]+side*Y1*r1[0], TE[1]+X1*u1[1]+side*Y1*r1[1]];
    const CE=[ET[0]-X2*u2[0]+side*Y2*r2[0], ET[1]-X2*u2[1]+side*Y2*r2[1]];
    const C =[TE[0]+k1*u1[0]+side*(R+p1)*r1[0], TE[1]+k1*u1[1]+side*(R+p1)*r1[1]];
    const Tcc=R*Math.tan(toRad(Dc)/2);
    const c={j,sp,R,L1,L2,side,I,defl,az1,az2,PI,Tin,Tout,TE,EC,CE,ET,C,Lcc,Tcc,Dc,th1,th2,
      X1,Y1,k1,p1,X2,Y2,k2,p2,chi1:L1>0?toDeg(Math.atan(Y1/X1)):0,chi2:L2>0?toDeg(Math.atan(Y2/X2)):0,
      cuerda1:Math.hypot(X1,Y1),cuerda2:Math.hypot(X2,Y2),
      tl1:L1>0?X1-Y1/Math.tan(t1):0, tc1:L1>0?Y1/Math.sin(t1):0, tl2:L2>0?X2-Y2/Math.tan(t2):0, tc2:L2>0?Y2/Math.sin(t2):0,
      ext:Math.tan(toRad(I)/4)*Math.tan(toRad(I)/2)*R,
      start, pEC:start+L1, pCE:start+L1+Lcc, end, auto:!Number.isFinite(p.prog)};
    cv.push(c); endPrev=end; ToutPrev=Tout;
  }
  const Dlast=seg[m].D-ToutPrev;
  if(Dlast<-1e-6) return {err:`La última curva se pasa del PI final en ${fmtNum(-Dlast,3)} m.`};
  const progFin = Number.isFinite(fin.prog) ? fin.prog : endPrev+Dlast;
  return {ini,fin,pts,seg,cv,progFin,progFinAuto:!Number.isFinite(fin.prog)};
}

/* Punto del eje de una curva a la progresiva A (dentro de [start,end]): posición [N,E] y azimut de la tangente. */
function epPuntoCurva(c,A){
  const s=A-c.start, [u1,u2]=[epU(c.az1),epU(c.az2)], r1=epRt(c.az1), r2=epRt(c.az2);
  if(c.L1>0 && s<=c.L1){
    const G=s*s/(2*c.R*c.L1), [X,Y]=epSer(s,G);
    return {P:[c.TE[0]+X*u1[0]+c.side*Y*r1[0], c.TE[1]+X*u1[1]+c.side*Y*r1[1]], ta:c.az1+c.side*toDeg(G), parte:'Espiral de entrada'};
  }
  if(c.L2>0 && A>c.pCE){
    const s2=c.end-A, G=s2*s2/(2*c.R*c.L2), [X,Y]=epSer(s2,G);
    return {P:[c.ET[0]-X*u2[0]+c.side*Y*r2[0], c.ET[1]-X*u2[1]+c.side*Y*r2[1]], ta:c.az2-c.side*toDeg(G), parte:'Espiral de salida'};
  }
  const d=A-c.pEC, a0=toDeg(Math.atan2(c.EC[1]-c.C[1],c.EC[0]-c.C[0])), al=a0+c.side*toDeg(d/c.R), ar=toRad(al);
  return {P:[c.C[0]+c.R*Math.cos(ar), c.C[1]+c.R*Math.sin(ar)], ta:al+c.side*90, parte:c.sp?'Circular central':'Curva circular'};
}

/* Replanteo de la progresiva A con desfase lateral T. conv: 'casio' (+ exterior en curva) o 'der' (+ derecha). */
function stakeEjePI(M,A,T,conv){
  const cv=M.cv, m=cv.length;
  if(!(A>=M.ini.prog-1e-9 && A<=M.progFin+1e-9)) return {err:`La progresiva ${fmtNum(A,3)} está fuera del eje (${fmtNum(M.ini.prog,3)} a ${fmtNum(M.progFin,3)} m).`};
  let P,ta,tipo,pi,curved=false,side=0;
  if(A<=cv[0].start){                                     // tangente anterior (desde TE/PC hacia atrás)
    const c=cv[0], d=c.start-A, u=epU(c.az1);
    P=[c.TE[0]-u[0]*d, c.TE[1]-u[1]*d]; ta=c.az1; tipo='Tangente anterior al PI 1'; pi=1;
  } else {
    for(let j=0;j<m;j++){
      const c=cv[j];
      if(A>c.start && A<=c.end){ const r=epPuntoCurva(c,A); P=r.P; ta=r.ta; tipo=`${r.parte} · PI ${j+1}`; pi=j+1; curved=true; side=c.side; break; }
      if(A>c.end && (j===m-1 || A<=cv[j+1].start)){      // tangente posterior (desde TS/PT hacia adelante)
        const d=A-c.end, u=epU(c.az2);
        P=[c.ET[0]+u[0]*d, c.ET[1]+u[1]*d]; ta=c.az2; tipo=j===m-1?`Tangente posterior al PI ${j+1}`:`Tangente entre PI ${j+1} y PI ${j+2}`; pi=j+1; break;
      }
    }
  }
  if(!P) return {err:'No se pudo ubicar la progresiva en el eje (revisa que las progresivas de PC/TE sean crecientes).'};
  const lat = curved && conv!=='der' ? -side*T : T;        // desfase positivo a la derecha del eje
  const r=epRt(ta);
  return {A,T,N:P[0]+lat*r[0],E:P[1]+lat*r[1],axN:P[0],axE:P[1],ta,tipo,pi,curved,side,lat};
}

/* Azimut y distancia (distancia/F) desde la estación. */
function epDesdeEstacion(st,sN,sE,F){
  const dN=st.N-sN, dE=st.E-sE;
  return {az:normDeg(toDeg(Math.atan2(dE,dN))), dist:Math.hypot(dN,dE)/F, distGrid:Math.hypot(dN,dE)};
}

/* ---------- Taludes con banquetas (SUB5R) ---------- */
function epPlanillaDer(pl){
  const Hs=pl.nb*pl.Hb;
  return {Hs, V:pl.ap+pl.nb*pl.Ab+Hs*pl.Tc, U:pl.cp+Hs};
}
/* Con la cota del terreno W y el desfase |T| del estaca: corte o relleno, distancia requerida y diferencias. */
function epTaludCota(pl,Tabs,W){
  const {V,U}=epPlanillaDer(pl), dz=U-W;
  const corte = dz<0;
  const Dreq = corte ? Math.abs(dz)*pl.Tc+(V+pl.Cn) : dz*pl.Tr+V;
  return {V,U,dz,corte,alt:Math.abs(dz),Dreq,Dh:Tabs-V,Rf:Tabs-Dreq,Tabs};
}
/* Con la coordenada leída (rN,rE,rZ) desde la estación (sN,sE) y el punto de replanteo st (el eje a la progresiva + lateral). */
function epTaludCoor(pl,st,sN,sE,F,rN,rE,rZ){
  const N9=sN+F*(rN-sN), E9=sE+F*(rE-sE);
  const p=[N9-st.N,E9-st.E];
  let T,gam;
  if(!st.curved){
    const u=epU(st.ta), d=[-u[0],-u[1]];             // hacia atrás por la tangente
    T=d[1]*p[0]-d[0]*p[1]; gam=p[0]*d[0]+p[1]*d[1];
  } else {
    const d=epU(st.ta+st.side*90);                   // hacia el centro de la curva
    T=p[0]*d[0]+p[1]*d[1]; const g0=d[0]*p[1]-d[1]*p[0]; gam=st.side<0?-g0:g0;
  }
  const r=epTaludCota(pl,Math.abs(T),rZ);
  return {...r,T,gam,N9,E9};
}

/* ---------- Dibujo en planta ---------- */
function svgEjePI(M,st,est){
  const K=svgKit(), CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  K.north();
  const nC=M.cv.length, esp=M.cv.filter(c=>c.sp).length;
  K.list([[{k:'Largo del eje',c:CD,v:`${fmtNum(M.progFin-M.ini.prog,2)} m`},{k:'PI',c:CK,v:String(nC)},{k:'Con espiral',c:CK,v:String(esp)}]]);
  const top=Math.max(44,K.listBottom+8);
  // eje muestreado
  const L=M.progFin-M.ini.prog, n=Math.max(60,Math.min(400,Math.ceil(L/3))), axis=[];
  for(let i=0;i<=n;i++){ const r=stakeEjePI(M,M.ini.prog+L*i/n,0,'der'); if(!r.err) axis.push([r.E,r.N]); }
  const all=axis.slice(); M.pts.forEach(p=>all.push([p.E,p.N])); if(st) all.push([st.E,st.N]); if(est) all.push([est.E,est.N]);
  const fit=K.fit(all,{l:30,r:290,t:top,b:168});
  const S=p=>[fit.X(p[0]),fit.Y(p[1])];
  K.poly(M.pts.map(p=>S([p.E,p.N])),{stroke:CS,sw:0.6,dash:'2 1.6',obs:false});
  K.poly(axis.map(S),{stroke:CD,sw:1.4});
  M.pts.forEach((p,i)=>{ const q=S([p.E,p.N]); K.dot(q[0],q[1],CS,i===0||i===nC+1?2:1.6); });
  const few=nC<=8;
  M.pts.forEach((p,i)=>{ const q=S([p.E,p.N]); const lab=i===0?'Inicio':i===nC+1?'Final':'PI'+i;
    if(few||i===0||i===nC+1) K.pointLabel(lab,q[0],q[1],4,CS,{full:true}); });
  if(est){ const q=S([est.E,est.N]); K.dot(q[0],q[1],CK,2.7); K.pointLabel('Est.',q[0],q[1],4.5,CK,{full:true}); }
  if(st){ const q=S([st.E,st.N]);
    if(est){ const e=S([est.E,est.N]); K.line(e[0],e[1],q[0],q[1],CZ,{sw:0.7,op:0.7}); }
    if(Math.abs(st.lat)>1e-9){ const a=S([st.axE,st.axN]); K.line(a[0],a[1],q[0],q[1],CP,{dash:'2 1.6'}); K.dot(a[0],a[1],CD,1.6); }
    K.dot(q[0],q[1],CP,2.7); K.pointLabel('Km '+fmtNum(st.A,2),q[0],q[1],4,CP,{rmin:5,rmax:16}); }
  return K.svg();
}

/* ---------- Tablas ---------- */
function epFila(k,v,cls){ return `<div class="result-row"><span class="k">${k}</span><span class="v${cls?' '+cls:''}">${v}</span></div>`; }
function epTablaCurva(c){
  const pts = c.sp
    ? [['TE',c.start,c.TE],['EC',c.pEC,c.EC],['CE',c.pCE,c.CE],['ET',c.end,c.ET]]
    : [['PC',c.start,c.TE],['PT',c.end,c.ET]];
  const trs=pts.map(p=>`<tr><td>${p[0]}</td><td>${fmtNum(p[1],3)}</td><td>${fmtNum(p[2][0],3)}</td><td>${fmtNum(p[2][1],3)}</td></tr>`).join('');
  let h=`<div class="station-block"><div class="st-label">PI ${c.j} · ${c.sp?(c.L1===c.L2?'Curva con espirales':'Curva con espirales asimétricas'):'Curva circular'} ${c.side>0?'derecha':'izquierda'}</div>`;
  h+=epFila('Radio',`${fmtNum(c.R,3)} m`)+epFila('Ángulo de deflexión',fmtAngle(c.I));
  if(c.sp){
    h+=epFila('Largo espiral 1 / 2',`${fmtNum(c.L1,3)} / ${fmtNum(c.L2,3)} m`)+epFila('Ángulo espiral 1 / 2',`${fmtAngle(c.th1)} / ${fmtAngle(c.th2)}`)
      +epFila('Ángulo circular central',fmtAngle(c.Dc))+epFila('Largo circular central',`${fmtNum(c.Lcc,3)} m`)+epFila('Tangente circular central',`${fmtNum(c.Tcc,3)} m`)
      +epFila('Tangente total 1 (PI–TE)',`${fmtNum(c.Tin,3)} m`)+epFila('Tangente total 2 (PI–ET)',`${fmtNum(c.Tout,3)} m`);
  } else {
    h+=epFila('Largo de la curva',`${fmtNum(c.Lcc,3)} m`)+epFila('Tangente',`${fmtNum(c.Tin,3)} m`)+epFila('Externa',`${fmtNum(c.ext,3)} m`);
  }
  h+=`<div class="table-wrap"><table class="data-table"><thead><tr><th>Punto</th><th>Progresiva</th><th>Norte</th><th>Este</th></tr></thead><tbody>${trs}</tbody></table></div>`;
  if(c.sp){
    const e1=c.L1>0, e2=c.L2>0;
    h+=`<details style="margin-top:6px;"><summary>Detalle de las espirales</summary>`;
    if(e1) h+=`<div class="st-label" style="margin-top:6px;">Espiral 1</div>`+epFila('Abscisa X (a lo largo de la tangente)',`${fmtNum(c.X1,4)} m`)+epFila('Ordenada Y',`${fmtNum(c.Y1,4)} m`)
      +epFila('Desplazamiento (k)',`${fmtNum(c.k1,4)} m`)+epFila('Retranqueo (p)',`${fmtNum(c.p1,4)} m`)+epFila('Tangente larga',`${fmtNum(c.tl1,4)} m`)+epFila('Tangente corta',`${fmtNum(c.tc1,4)} m`)
      +epFila('Cuerda larga',`${fmtNum(c.cuerda1,4)} m`)+epFila('Ángulo de la espiral',fmtAngle(c.th1))+epFila('Ángulo de deflexión',fmtAngle(c.chi1));
    if(e2) h+=`<div class="st-label" style="margin-top:6px;">Espiral 2</div>`+epFila('Abscisa X (a lo largo de la tangente)',`${fmtNum(c.X2,4)} m`)+epFila('Ordenada Y',`${fmtNum(c.Y2,4)} m`)
      +epFila('Desplazamiento (k)',`${fmtNum(c.k2,4)} m`)+epFila('Retranqueo (p)',`${fmtNum(c.p2,4)} m`)+epFila('Tangente larga',`${fmtNum(c.tl2,4)} m`)+epFila('Tangente corta',`${fmtNum(c.tc2,4)} m`)
      +epFila('Cuerda larga',`${fmtNum(c.cuerda2,4)} m`)+epFila('Ángulo de la espiral',fmtAngle(c.th2))+epFila('Ángulo de deflexión',fmtAngle(c.chi2));
    h+=`</details>`;
  }
  return h+`</div>`;
}
function epCSV(M){
  const rows=['pi,punto,progresiva,norte,este'];
  M.cv.forEach(c=>{ const pts=c.sp?[['TE',c.start,c.TE],['EC',c.pEC,c.EC],['CE',c.pCE,c.CE],['ET',c.end,c.ET]]:[['PC',c.start,c.TE],['PT',c.end,c.ET]];
    pts.forEach(p=>rows.push(`${c.j},${p[0]},${p[1]},${p[2][0]},${p[2][1]}`)); });
  return rows.join('\n');
}

/* Tabla de planilla por progresiva (texto: prog cotaIzq anchoIzq cotaDer anchoDer). Interpola linealmente. */
function epLeerPlanilla(txt){
  const rows=txt.split(/\n/).map(l=>l.trim().split(/[\s;,]+/).map(Number)).filter(r=>r.length>=5&&r.slice(0,5).every(Number.isFinite)).sort((a,b)=>a[0]-b[0]);
  return rows;
}
function epPlanillaEn(rows,A){
  if(rows.length<1) return null;
  if(rows.length===1) return Math.abs(rows[0][0]-A)<1e-6?rows[0]:null;
  if(A<rows[0][0]-1e-9||A>rows[rows.length-1][0]+1e-9) return null;
  for(let i=0;i+1<rows.length;i++){ const a=rows[i], b=rows[i+1];
    if(A>=a[0]-1e-9 && A<=b[0]+1e-9){ const t=b[0]===a[0]?0:(A-a[0])/(b[0]-a[0]); return a.map((v,k)=>v+(b[k]-v)*t); } }
  return null;
}

/* ---------- Pantalla ---------- */
function renderEjePI(){
  const body = `<div class="field-card">
    <h3>Punto de inicio del eje</h3>
    <div class="field-inline2">${fieldRow('Norte','ep_Ni',1000)}${fieldRow('Este','ep_Ei',1000)}</div>
    ${fieldRow('Progresiva del inicio (PT o ET anterior)','ep_Pi',0)}
  </div>
  <div class="field-row"><label>Número de PI (vértices con curva)</label>
    <div class="n-stepper"><button type="button" id="epMinus">−</button><span class="n-val" id="epNVal">${epN}</span><button type="button" id="epPlus">+</button></div>
  </div>
  <div id="epPIs"></div>
  <div class="field-card">
    <h3>PI final</h3>
    <div class="field-inline2">${fieldRow('Norte','ep_Nf',1330)}${fieldRow('Este','ep_Ef',1700)}</div>
    <div class="field-row"><label for="ep_Pf">Progresiva final (opcional)</label><input type="number" step="any" id="ep_Pf" placeholder="automática"></div>
  </div>
  <button class="btn" id="btnEP" type="button">Calcular alineamiento</button>
  <div id="resEP"></div>
  <div class="field-card" style="margin-top:14px;">
    <h3>Replanteo por progresiva</h3>
    <p class="tool-blurb" style="margin-top:0;">Primero calcula el alineamiento. La estación es opcional: con ella obtienes el azimut y la distancia para replantear.</p>
    ${libretaBloqueHTML('ep_libS','Estación desde la Libreta')}
    <div class="field-inline2">${fieldRow('Norte estación','ep_sN',900)}${fieldRow('Este estación','ep_sE',1050)}</div>
    ${fieldRow('Factor de corrección F','ep_F',1,{step:'any'})}
    ${fieldRow('Progresiva a replantear (m)','ep_A',100)}
    ${fieldRow('Lateral (m)','ep_T',0)}
    <div class="field-row"><label for="ep_conv">Signo del lateral</label>
      <select id="ep_conv"><option value="casio" selected>Como la Casio: tangente + derecha · curva + exterior</option><option value="der">Siempre + derecha / − izquierda</option></select></div>
    <button class="btn" id="btnEPR" type="button">Replantear</button>
    <div id="resEPR"></div>
  </div>
  <div class="field-card" style="margin-top:14px;">
    <h3>Talud y banquetas en esa progresiva</h3>
    <p class="tool-blurb" style="margin-top:0;">Usa el punto de la progresiva y lateral calculados arriba (el eje con lateral 0 mide el desfase desde el eje). Taludes como H/V.</p>
    <div class="field-row"><label for="ep_side">Lado de la planilla</label><select id="ep_side"><option value="i">Izquierdo</option><option value="d" selected>Derecho</option></select></div>
    <div class="field-inline2">${fieldRow('Cota planilla izq.','ep_cpI',100)}${fieldRow('Ancho planilla izq.','ep_apI',3.5)}</div>
    <div class="field-inline2">${fieldRow('Cota planilla der.','ep_cpD',100)}${fieldRow('Ancho planilla der.','ep_apD',3.5)}</div>
    <div class="field-row"><label for="ep_tabla">Tabla de planilla por progresiva (opcional)</label>
      <textarea id="ep_tabla" rows="3" placeholder="prog  cotaIzq  anchoIzq  cotaDer  anchoDer" style="width:100%;font-family:inherit;"></textarea></div>
    <div class="field-inline2">${fieldRow('Cunetas tipo (ancho)','ep_Cn',1)}${fieldRow('N.º de banquetas','ep_nb',0)}</div>
    <div class="field-inline2">${fieldRow('Haltura banqueta','ep_Hb',8)}${fieldRow('Ancho banqueta','ep_Ab',3)}</div>
    <div class="field-inline2">${fieldRow('Talud corte (H/V)','ep_Tc',0.5)}${fieldRow('Talud relleno (H/V)','ep_Tr',1.5)}</div>
    <div class="field-row"><label for="ep_tm">Dato de campo</label>
      <select id="ep_tm"><option value="cota" selected>Cota de la estaca</option><option value="coor">Coordenadas leídas (N, E, Z)</option></select></div>
    <div id="epTmCampos"></div>
    <button class="btn" id="btnEPT" type="button">Calcular talud</button>
    <div id="resEPT"></div>
  </div>`;
  toolShell('ejePI','Alineamiento por PI como el programa ROADVIAS: define el eje con vértices (Norte, Este, radio y largos de espiral), obtén elementos, progresivas y coordenadas de PC/PT o TE/EC/CE/ET, y replantea cualquier progresiva con lateral desde una estación (azimut y distancia con factor F), con el cálculo de taludes y banquetas.', body);
  libretaTraerA('ep_libS','ep_sE','ep_sN', ()=>{});
  const defs=[[1100,1250,120,40,40],[1350,1400,200,0,0],[1400,1500,150,30,30],[1450,1700,180,0,0],[1500,1800,150,0,0],[1550,1900,150,0,0]];
  const draw=()=>{
    const prev=[]; for(let i=0;i<epN;i++){ const q=document.getElementById('ep_N_'+i); prev.push(q?['N','E','R','L1','L2','P'].map(k=>document.getElementById(`ep_${k}_${i}`).value):null); }
    let h='';
    for(let i=0;i<epN;i++){
      const d=prev[i]||(defs[i]||[1500+i*60,1900+i*60,150,0,0]).concat(['']);
      h+=`<div class="station-block"><div class="st-label">PI ${i+1}</div>
        <div class="field-inline2">${fieldRow('Norte','ep_N_'+i,d[0])}${fieldRow('Este','ep_E_'+i,d[1])}</div>
        <div class="field-inline2">${fieldRow('Radio','ep_R_'+i,d[2])}${fieldRow('L.Esp 1','ep_L1_'+i,d[3])}</div>
        <div class="field-inline2">${fieldRow('L.Esp 2','ep_L2_'+i,d[4])}<div class="field-row"><label for="ep_P_${i}">Prog. PC / TE</label><input type="number" step="any" id="ep_P_${i}" value="${d[5]??''}" placeholder="automática"></div></div>
      </div>`;
    }
    document.getElementById('epPIs').innerHTML=h;
  };
  draw();
  document.getElementById('epMinus').addEventListener('click',()=>{ if(epN>1){ epN--; document.getElementById('epNVal').textContent=epN; draw(); }});
  document.getElementById('epPlus').addEventListener('click',()=>{ if(epN<30){ epN++; document.getElementById('epNVal').textContent=epN; draw(); }});
  const tmDraw=()=>{
    const m=document.getElementById('ep_tm').value;
    document.getElementById('epTmCampos').innerHTML = m==='cota'
      ? fieldRow('Cota de la estaca (terreno)','ep_W',112)
      : `<div class="field-inline2">${fieldRow('N. leído','ep_rN',1000)}${fieldRow('E. leído','ep_rE',1100)}</div>${fieldRow('Z. leído','ep_rZ',112)}`;
  };
  tmDraw();
  document.getElementById('ep_tm').addEventListener('change',tmDraw);

  const leerModelo=()=>{
    const ini={N:val('ep_Ni'),E:val('ep_Ei'),prog:val('ep_Pi')}, fin={N:val('ep_Nf'),E:val('ep_Ef'),prog:val('ep_Pf')};
    if([ini.N,ini.E,ini.prog,fin.N,fin.E].some(isNaN)) return {err:'Completa las coordenadas y la progresiva del inicio y las coordenadas del PI final.'};
    const pis=[];
    for(let i=0;i<epN;i++){
      const p={N:val('ep_N_'+i),E:val('ep_E_'+i),R:val('ep_R_'+i),L1:val('ep_L1_'+i)||0,L2:val('ep_L2_'+i)||0,prog:val('ep_P_'+i)};
      if([p.N,p.E,p.R].some(isNaN)) return {err:`Completa Norte, Este y Radio del PI ${i+1}.`};
      pis.push(p);
    }
    return calcEjePI(ini,pis,fin);
  };
  document.getElementById('btnEP').addEventListener('click',()=>{
    const box=document.getElementById('resEP'); const M=leerModelo();
    if(M.err){ box.innerHTML=`<p class="err-msg">${M.err}</p>`; return; }
    epModelo=M; epStake=null;
    box.innerHTML=`<div class="results" style="margin-top:12px;">
      ${epFila('Progresiva inicial',`${fmtNum(M.ini.prog,3)} m`)}${epFila('Progresiva final',`${fmtNum(M.progFin,3)} m${M.progFinAuto?' (automática)':''}`)}
      ${M.cv.map(epTablaCurva).join('')}
      <div class="plot-wrap">${svgEjePI(M,null,null)}</div></div>`;
    addCSVButton(box,'alineamiento_pi.csv',epCSV(M));
  });
  document.getElementById('btnEPR').addEventListener('click',()=>{
    const box=document.getElementById('resEPR');
    if(!epModelo){ box.innerHTML=`<p class="err-msg">Primero calcula el alineamiento.</p>`; return; }
    const A=val('ep_A'), T=val('ep_T'), sN=val('ep_sN'), sE=val('ep_sE'), F=val('ep_F')||1, conv=document.getElementById('ep_conv').value;
    if(isNaN(A)||isNaN(T)){ box.innerHTML=`<p class="err-msg">Ingresa la progresiva y el lateral.</p>`; return; }
    if(isNaN(sN)!==isNaN(sE)){ box.innerHTML=`<p class="err-msg">Completa Norte y Este de la estación, o deja ambos en blanco.</p>`; return; }
    const st=stakeEjePI(epModelo,A,T,conv);
    if(st.err){ box.innerHTML=`<p class="err-msg">${st.err}</p>`; return; }
    epStake=st; const hayE=!isNaN(sN); epEst=hayE?{N:sN,E:sE,F}:null;
    const r=hayE?epDesdeEstacion(st,sN,sE,F):null;
    const latTxt = Math.abs(T)<1e-12 ? '0' : (st.curved&&conv!=='der') ? `${fmtNum(Math.abs(T),3)} ${T>0?'exterior':'interior'}` : `${fmtNum(Math.abs(T),3)} ${st.lat>0?'derecha':'izquierda'}`;
    box.innerHTML=`<div class="results" style="margin-top:12px;">
      ${epFila('Tramo',st.tipo)}${epFila('Lateral',latTxt)}
      ${r?epFila('Azimut desde la estación',fmtAngle(r.az),'accent big')+epFila(F!==1?'Distancia (= D / F)':'Distancia',`${fmtNum(r.dist,3)} m`,'accent big'):''}
      ${epFila('Norte del punto',fmtNum(st.N,3))}${epFila('Este del punto',fmtNum(st.E,3))}
      ${epFila('Azimut de la tangente en el eje',fmtAngle(normDeg(st.ta)))}
      <div class="plot-wrap">${svgEjePI(epModelo,st,hayE?{N:sN,E:sE}:null)}</div></div>`;
    const b=document.createElement('button'); b.type='button'; b.className='btn-sm'; b.style.marginTop='8px'; b.textContent='💾 Guardar en la Libreta';
    b.addEventListener('click',()=>{ agregarPunto('Km '+fmtNum(A,3), st.E, st.N, null); b.textContent='Guardado ✓'; });
    box.appendChild(b);
  });
  document.getElementById('btnEPT').addEventListener('click',()=>{
    const box=document.getElementById('resEPT');
    if(!epStake){ box.innerHTML=`<p class="err-msg">Primero calcula el replanteo de la progresiva.</p>`; return; }
    const lado=document.getElementById('ep_side').value, A=epStake.A;
    let cp=lado==='i'?val('ep_cpI'):val('ep_cpD'), ap=lado==='i'?val('ep_apI'):val('ep_apD');
    const tab=epLeerPlanilla(document.getElementById('ep_tabla').value);
    if(tab.length){ const f=epPlanillaEn(tab,A); if(!f){ box.innerHTML=`<p class="err-msg">La progresiva ${fmtNum(A,3)} no está en la tabla de planilla.</p>`; return; }
      cp=lado==='i'?f[1]:f[3]; ap=lado==='i'?f[2]:f[4]; }
    const pl={cp,ap,Cn:val('ep_Cn'),nb:Math.round(val('ep_nb')),Hb:val('ep_Hb'),Ab:val('ep_Ab'),Tc:val('ep_Tc'),Tr:val('ep_Tr')};
    if(Object.values(pl).some(isNaN)||pl.nb<0){ box.innerHTML=`<p class="err-msg">Completa los datos de planilla, cunetas, banquetas y taludes.</p>`; return; }
    const modo=document.getElementById('ep_tm').value; let h='', info=pl.nb>0?epFila('Banquetas',`${pl.nb} · cota ${fmtNum(epPlanillaDer(pl).U,3)}`):'';
    const base = epFila('Cota planilla / ancho',`${fmtNum(cp,3)} / ${fmtNum(ap,3)} m`)+info;
    const resumen=(r)=>epFila('Línea central (desfase)',`${fmtNum(r.Tabs,2)} m`)+epFila(r.corte?'Corte':'Relleno',`${fmtNum(r.alt,2)} m`)
      +epFila('Dh. subrasante',`${fmtNum(r.Dh,2)} m`)+epFila(r.corte?'Rf. hombro de corte':'Rf. pie de relleno',`${fmtNum(r.Rf,2)} m`);
    if(modo==='cota'){
      const W=val('ep_W'); if(isNaN(W)){ box.innerHTML=`<p class="err-msg">Ingresa la cota de la estaca.</p>`; return; }
      const r=epTaludCota(pl,Math.abs(epStake.lat),W);
      h=base+epFila('Distancia requerida',`${fmtNum(r.Dreq,2)} m`,'accent big')+epFila('Distancia existente',`${fmtNum(r.Tabs,2)} m`)
        +epFila(r.Rf<0?'Alejar':'Entrar',`${fmtNum(Math.abs(r.Rf),2)} m`,'accent big')+resumen(r);
    } else {
      if(!epEst){ box.innerHTML=`<p class="err-msg">Para usar coordenadas leídas ingresa la estación en el replanteo.</p>`; return; }
      const rN=val('ep_rN'), rE=val('ep_rE'), rZ=val('ep_rZ');
      if([rN,rE,rZ].some(isNaN)){ box.innerHTML=`<p class="err-msg">Ingresa N, E y Z leídos.</p>`; return; }
      const r=epTaludCoor(pl,epStake,epEst.N,epEst.E,epEst.F,rN,rE,rZ);
      h=base+epFila(r.gam<0?'Regrese':'Avance',`${fmtNum(Math.abs(r.gam),2)} m`,'accent big')+epFila('Distancia requerida',`${fmtNum(r.Dreq,2)} m`)
        +epFila('Distancia existente',`${fmtNum(r.Tabs,2)} m`)+epFila(r.Rf<0?'Alejar':'Entrar',`${fmtNum(Math.abs(r.Rf),2)} m`,'accent big')+resumen(r);
    }
    box.innerHTML=`<div class="results" style="margin-top:12px;">${h}</div>`;
  });
}

const RENDERERS = { ejePI: renderEjePI };
