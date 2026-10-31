"use strict";
/* Módulo compartido del grupo «Vías y Curvas».
   Generado a partir del index.html monolítico de topocalc. */
function resolveCurvaCircular(mode, v1, v2){
  let R, Ddeg;
  switch(mode){
    case 'R_D':  R=v1; Ddeg=v2; break;
    case 'R_T':  R=v1; Ddeg=toDeg(2*Math.atan(v2/v1)); break;
    case 'R_Lc': R=v1; Ddeg=toDeg(v2/v1); break;
    case 'R_C':  { const a=v2/(2*v1); R=v1; Ddeg=(a<-1||a>1)?NaN:toDeg(2*Math.asin(a)); break; }
    case 'R_E':  { const a=v1/(v1+v2); R=v1; Ddeg=(a<-1||a>1)?NaN:toDeg(2*Math.acos(a)); break; }
    case 'R_M':  { const a=1-v2/v1; R=v1; Ddeg=(a<-1||a>1)?NaN:toDeg(2*Math.acos(a)); break; }
    case 'D_T':  Ddeg=v1; R=v2/Math.tan(toRad(v1)/2); break;
    case 'D_Lc': Ddeg=v1; R=v2/toRad(v1); break;
    case 'D_C':  Ddeg=v1; R=v2/(2*Math.sin(toRad(v1)/2)); break;
    case 'D_E':  Ddeg=v1; R=v2/(1/Math.cos(toRad(v1)/2)-1); break;
    case 'D_M':  Ddeg=v1; R=v2/(1-Math.cos(toRad(v1)/2)); break;
    default: R=NaN; Ddeg=NaN;
  }
  return {R, Ddeg};
}
function calcClotoide(R, Ls){
  const A = Math.sqrt(R*Ls);
  const tau = Ls/(2*R); // radianes
  const l = Ls;
  const Xc = l - Math.pow(l,5)/(40*R*R*Ls*Ls) + Math.pow(l,9)/(3456*Math.pow(R,4)*Math.pow(Ls,4));
  const Yc = Math.pow(l,3)/(6*R*Ls) - Math.pow(l,7)/(336*Math.pow(R,3)*Math.pow(Ls,3));
  const p = Yc - R*(1-Math.cos(tau));
  const k = Xc - R*Math.sin(tau);
  const Tl = Xc - Yc/Math.tan(tau); // tangente larga
  const Tc = Yc/Math.sin(tau); // tangente corta
  return {A, tauDeg: toDeg(tau), Xc, Yc, p, k, Tl, Tc};
}
function clotoidePunto(R, Ls, l){
  // Coordenadas (x,y) de un punto a distancia l sobre la espiral, respecto al origen TE (tangente = eje x)
  const x = l - Math.pow(l,5)/(40*R*R*Ls*Ls);
  const y = Math.pow(l,3)/(6*R*Ls);
  return {x,y};
}
function svgCurvaArco(R, deltaDeg, puntos, fuente, ptLabel, Tval, extras){
  const K=svgKit(), eng=K.eng, ex=extras||{};
  const d=Math.min(Math.max(deltaDeg,60),140), th=toRad(d/2), thDeg=d/2;
  const top=19, bot=fuente?165:176, cx=170;
  const Rs=Math.min((bot-top)*Math.cos(th), 190/(2*Math.sin(th)), 150);
  const O=[cx, top+Rs/Math.cos(th)], PI_=[cx,top];
  const at=a=>[O[0]+Rs*Math.cos(toRad(a)), O[1]+Rs*Math.sin(toRad(a))];
  const PC=at(-90-thDeg), PT=at(-90+thDeg), MA=at(-90), MC=[cx,(PC[1]+PT[1])/2];
  // colores: accent sigue a la magnitud estrella
  const col={R:'var(--blueprint)',T:'var(--accent)',Lc:'var(--success)',C:'var(--danger)',E:'var(--ink-soft)',M:'var(--ink)',D:'var(--ink)'};
  const star=ex.star||'T'; if(star!=='T'&&col[star]&&!ptLabel){ const t=col[star]; col[star]=col.T; col.T=t; }
  const hasT=Tval!==undefined, has=k=>ex[k]!==undefined;
  const rows=[{k:'R',c:col.R,v:`${fmtNum(R,2)} m`}];
  if(has('D')) rows.push({k:'Δ',c:col.D,v:fmtAngle(deltaDeg)});
  if(has('defl')) rows.push({k:'δ',c:col.D,v:fmtAngle(ex.defl)});
  if(hasT) rows.push({k:'T',c:col.T,v:`${fmtNum(Tval,2)} m`});
  if(has('Lc')) rows.push({k:'Lc',c:col.Lc,v:`${fmtNum(ex.Lc,2)} m`});
  if(has('C')) rows.push({k:'C',c:col.C,v:`${fmtNum(ex.C,2)} m`});
  if(has('E')) rows.push({k:'E',c:col.E,v:`${fmtNum(ex.E,2)} m`});
  if(has('M')) rows.push({k:'M',c:col.M,v:`${fmtNum(ex.M,2)} m`});
  K.list([rows]);
  // trazos
  if(hasT){ K.line(...PI_,...PC,col.T,{sw:0.9}); K.line(...PI_,...PT,col.T,{sw:0.9}); }
  K.line(...PC,...O,col.R,{dash:'2.4 2.4',sw:0.7}); K.line(...O,...PT,col.R,{dash:'2.4 2.4',sw:0.7});
  K.arc(O[0],O[1],Rs,-90-thDeg,-90+thDeg,ptLabel?col.Lc:col.Lc,{sw:1.4});
  if(has('C')) K.line(...PC,...PT,col.C,{dash:'3 2',sw:0.8});
  if(has('E')&&hasT) K.line(...PI_,...MA,col.E,{dash:'1.6 1.6',sw:0.8});
  if(has('M')) K.line(...MA,...MC,col.M,{sw:0.9});
  if(has('D')) K.arc(O[0],O[1],Rs*0.22,-90-thDeg,-90+thDeg,col.D,{sw:0.8});
  // deflexión desde el PC (estaca): tangente en el PC y ángulo entre tangente y cuerda
  let dfl=null;
  if(has('defl')){ const tx=Math.cos(th), ty=-Math.sin(th), cl=Math.hypot(PT[0]-PC[0],PT[1]-PC[1]);
    const fl=ty<0?Math.min(cl*0.8,(PC[1]-6)/-ty):cl*0.8;
    K.line(PC[0]-tx*10,PC[1]-ty*10,PC[0]+tx*fl,PC[1]+ty*fl,'var(--ink-soft)',{dash:'1.6 1.6',sw:0.7});
    K.line(...PC,...PT,col.C,{dash:'3 2',sw:0.8});
    const ac=Math.atan2(PT[1]-PC[1],PT[0]-PC[0])*180/Math.PI, at0=Math.atan2(ty,tx)*180/Math.PI, ra=Math.min(18,cl*0.35);
    K.arc(PC[0],PC[1],ra,at0,ac,col.D,{sw:0.8}); dfl={am:(at0+ac)/2*Math.PI/180,ra}; }
  // replanteo: puntos sobre el arco
  if(puntos&&puntos.length){
    const st=thinLabelStep(puntos.length,10), tp=[];
    puntos.forEach((p,i)=>{ const a=-90-thDeg+p.frac*d, q=at(a); K.dot(q[0],q[1],'var(--ink-soft)',1.6); tp.push([i,a,q]); });
    tp.forEach(([i,a,q])=>{ if(i%st===0) K.pointLabel('P'+(i+1),q[0],q[1],3,'var(--ink-soft)',{dir:[Math.cos(toRad(a)),Math.sin(toRad(a))],rmin:3.6,rmax:9}); });
  }
  // puntos fijos
  [PC,O].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2)); K.dot(PT[0],PT[1],ptLabel?'var(--accent)':'var(--ink-soft)',2);
  if(hasT) K.dot(PI_[0],PI_[1],'var(--ink-soft)',2);
  if(has('Lc')||has('E')||has('M')) K.dot(MA[0],MA[1],col.Lc,1.8);
  // letras de puntos (hacia afuera)
  const out=(q)=>{const dx=q[0]-O[0], dy=q[1]-O[1], l=Math.hypot(dx,dy)||1; return [dx/l,dy/l];};
  if(hasT) K.pointLabel('PI',PI_[0],PI_[1],4.5,'var(--ink-soft)',{dir:[0,-1],omit:false});
  K.pointLabel('PC',PC[0],PC[1],4.5,'var(--ink-soft)',{dir:out(PC),omit:false});
  K.pointLabel(ptLabel||'PT',PT[0],PT[1],4.5,ptLabel?'var(--accent)':'var(--ink-soft)',{dir:out(PT),omit:false});
  K.pointLabel('O',O[0],O[1],4.5,'var(--ink-soft)',{dir:[0,1],full:true,omit:false});
  // magnitudes: carácter a lo largo de su trazo
  const L=4.5;
  if(hasT){ K.lineLabel(...PI_,...PC,'T',L,col.T,{at:0.45,out:[-1,0],extras:[0,3,6]}); K.lineLabel(...PI_,...PT,'T',L,col.T,{at:0.45,out:[1,0],extras:[0,3,6]}); }
  K.lineLabel(...O,...PC,'R',L,col.R,{at:0.5,out:[-1,0.3],extras:[0,3,6]});
  if(has('C')) K.lineLabel(...PC,...PT,'C',L,col.C,{at:0.25,out:[0,1],extras:[0,3,6]});
  if(has('E')&&hasT) K.lineLabel(...PI_,...MA,'E',L,col.E,{at:0.5,out:[1,0],extras:[0,3]});
  if(has('M')) K.lineLabel(...MA,...MC,'M',L,col.M,{at:0.5,out:[1,0],extras:[0,3]});
  if(dfl) K.pointLabel('δ',PC[0]+dfl.ra*Math.cos(dfl.am),PC[1]+dfl.ra*Math.sin(dfl.am),L,col.D,{dir:[Math.cos(dfl.am),Math.sin(dfl.am)],rmin:2,rmax:9});
  if(has('Lc')) K.pointLabel('Lc',...at(-90+thDeg*0.55),L,col.Lc,{dir:out(at(-90+thDeg*0.55)),rmin:3,rmax:9});
  if(has('D')){ const a=-90, q=[O[0]+Rs*0.22*Math.cos(toRad(a)),O[1]+Rs*0.22*Math.sin(toRad(a))]; K.pointLabel('Δ',q[0],q[1],L,col.D,{dir:[0,-1],rmin:1.5,rmax:8}); }
  if(fuente) K.add(svgFuente(fuente,320,190));
  return K.svg();
}
function svgClotoide(R, Ls, lEstaca, estLabel, fuente){
  const K=svgKit(), conEst=(lEstaca!==undefined&&lEstaca!==null&&!isNaN(lEstaca));
  const cl=calcClotoide(R,Ls), tau=cl.tauDeg;
  const l=26, r=292, t0=conEst?44:52, rad=a=>a*Math.PI/180;
  const lc=conEst?Math.min(Math.max(lEstaca,0),Ls):Ls, pe=clotoidePunto(R,Ls,lc);
  // geometría del dibujo con el mismo modelo que traza la espiral (el EC dibujado coincide con su extremo)
  const ee=clotoidePunto(R,Ls,Ls), Xd=ee.x, Yd=ee.y, Tcd=Yd/Math.sin(rad(tau));
  const piX=Xd-Tcd*Math.cos(rad(tau)), xExt=Math.max(Xd, conEst?0:piX, 1e-3);
  const bot=fuente?160:176, reserve=conEst?6:20, sc0=(r-l)/xExt, kex=Math.min(3,Math.max(1,26/Math.max(Yd*sc0,1e-6)));
  const sc=Math.min(sc0,(bot-reserve-t0)/Math.max(Yd*kex,1e-6)), H=Yd*sc*kex;
  const b=t0+((bot-reserve-t0)-H)/2+H;
  const X=x=>l+x*sc, Y=y=>b-y*sc*kex;
  const sp=[]; for(let i=0;i<=48;i++){ const p=clotoidePunto(R,Ls,Ls*i/48); sp.push([X(p.x),Y(p.y)]); }
  const TE=[X(0),Y(0)], EC=[X(Xd),Y(Yd)];
  if(!conEst){
    K.list([[{k:'A',c:'var(--accent)',v:fmtNum(cl.A,3)},{k:'τ',c:'var(--ink-soft)',v:fmtAngle(tau)},{k:'Xc',c:'var(--danger)',v:`${fmtNum(cl.Xc,3)} m`},{k:'Yc',c:'var(--ink)',v:`${fmtNum(cl.Yc,3)} m`},{k:'Tl',c:'var(--blueprint)',v:`${fmtNum(cl.Tl,3)} m`},{k:'Tc',c:'var(--success)',v:`${fmtNum(cl.Tc,3)} m`}]]);
    const PI=[X(piX),Y(0)];
    K.line(...TE,...PI,'var(--blueprint)');
    if(Xd>piX+1e-6) K.line(...PI,X(Xd),b,'var(--blueprint)',{op:0.45,dash:'1.6 1.6'});
    K.line(...PI,...EC,'var(--success)');
    K.line(...EC,EC[0],b,'var(--ink)',{dash:'1.6 1.6',sw:0.7});
    K.poly(sp,{stroke:'var(--accent)',sw:1.4});
    const dy=b+8; K.line(TE[0],dy,EC[0],dy,'var(--danger)',{sw:0.7}); K.line(TE[0],b+4,TE[0],dy+2,'var(--danger)',{sw:0.6,noObs:false}); K.line(EC[0],b+4,EC[0],dy+2,'var(--danger)',{sw:0.6,noObs:false});
    const a1=Math.atan2(EC[1]-PI[1],EC[0]-PI[0])*180/Math.PI, ra=Math.min(14,Math.hypot(EC[0]-PI[0],EC[1]-PI[1])*0.4);
    if(ra>3) K.arc(PI[0],PI[1],ra,0,a1,'var(--ink-soft)',{sw:0.8});
    [TE,EC,PI].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
    K.pointLabel('TE',TE[0],TE[1],4.5,'var(--ink-soft)',{dir:[-0.5,1],omit:false});
    K.pointLabel('EC',EC[0],EC[1],4.5,'var(--ink-soft)',{dir:[0.5,-1],omit:false});
    K.pointLabel('PI',PI[0],PI[1],4.5,'var(--ink-soft)',{dir:[0,1],omit:false});
    K.lineLabel(...TE,...PI,'Tl',4.5,'var(--blueprint)',{out:[0,-1],extras:[0,3,6]});
    K.lineLabel(...PI,...EC,'Tc',4.5,'var(--success)',{out:[1,-0.5],extras:[0,3,6]});
    K.lineLabel(EC[0],b,EC[0],EC[1],'Yc',4.5,'var(--ink)',{out:[1,0],extras:[0,3,6]});
    K.lineLabel(TE[0],dy,EC[0],dy,'Xc',4.5,'var(--danger)',{out:[0,1],extras:[0,3]});
    if(ra>3){ const am=a1/2*Math.PI/180; K.pointLabel('τ',PI[0]+ra*Math.cos(am),PI[1]+ra*Math.sin(am),4.5,'var(--ink-soft)',{dir:[Math.cos(am),Math.sin(am)],rmin:2,rmax:8}); }
    const m=sp[24]; K.pointLabel('A',m[0],m[1],4.5,'var(--accent)',{dir:[-0.3,-1],rmin:3,rmax:10});
  } else {
    const P=[X(pe.x),Y(pe.y)], ch=Math.hypot(pe.x,pe.y), defl=Math.atan2(pe.y,pe.x)*180/Math.PI;
    K.list([[{k:'l',c:'var(--accent)',v:`${fmtNum(lc,3)} m`},{k:'Cuerda',c:'var(--danger)',v:`${fmtNum(ch,3)} m`},{k:'Deflexión',c:'var(--ink)',v:fmtAngle(defl)}]]);
    K.line(TE[0],TE[1],X(xExt),TE[1],'var(--ink-soft)',{dash:'1.6 1.6',op:0.8,sw:0.7});
    K.poly(sp,{stroke:'var(--blueprint)',sw:0.9,op:0.5});
    const k=Math.max(2,Math.round(48*lc/Ls)); K.poly(sp.slice(0,k+1),{stroke:'var(--accent)',sw:1.6});
    K.line(...TE,...P,'var(--danger)',{dash:'3 2',sw:0.8});
    const a1=Math.atan2(P[1]-TE[1],P[0]-TE[0])*180/Math.PI, ra=Math.min(16,Math.hypot(P[0]-TE[0],P[1]-TE[1])*0.5);
    if(ra>3&&Math.abs(a1)>0.5) K.arc(TE[0],TE[1],ra,0,a1,'var(--ink)',{sw:0.8});
    K.dot(...TE,'var(--ink-soft)',2); K.dot(...EC,'var(--ink-soft)',2); K.dot(...P,'var(--accent)',2.4);
    K.pointLabel('TE',TE[0],TE[1],4.5,'var(--ink-soft)',{dir:[-0.5,1],omit:false});
    K.pointLabel('EC',EC[0],EC[1],4.5,'var(--ink-soft)',{dir:[0.5,-1],omit:false});
    K.pointLabel(estLabel||'Estaca',P[0],P[1],4.5,'var(--accent)',{dir:[-0.4,-1],rmin:4,rmax:14,omit:false});
    K.lineLabel(...TE,...P,'C',4.5,'var(--danger)',{out:[0.3,1],extras:[0,3,6]});
    if(ra>3&&Math.abs(a1)>0.5){ const am=a1/2*Math.PI/180; K.pointLabel('Δ',TE[0]+ra*Math.cos(am),TE[1]+ra*Math.sin(am),4.5,'var(--ink)',{dir:[Math.cos(am),Math.sin(am)],rmin:2,rmax:9}); }
  }
  if(fuente) K.add(svgFuente(fuente,320,190));
  return K.svg();
}
function curveArcPoints(R, deltaDeg, n, mirror){
  const deltaRad = toRad(deltaDeg);
  const pts=[];
  for(let i=0;i<=n;i++){
    const th = deltaRad*i/n;
    pts.push({x: R*Math.sin(th), y: (mirror?-1:1)*R*(1-Math.cos(th))});
  }
  return pts;
}
function rotateTranslatePts(pts, angleRad, ox, oy){
  const c=Math.cos(angleRad), s=Math.sin(angleRad);
  return pts.map(p=>({x: ox+p.x*c-p.y*s, y: oy+p.x*s+p.y*c}));
}
function svgCurvaDoble(R1, d1Deg, R2, d2Deg, reversa, dt){
  const K=svgKit(), n=24, g=dt>0&&reversa?dt:0, rad=a=>a*Math.PI/180;
  const c1='var(--blueprint)', c2='var(--accent)';
  const T1=R1*Math.tan(rad(d1Deg/2)), T2=R2*Math.tan(rad(d2Deg/2)), Lc1=R1*rad(d1Deg), Lc2=R2*rad(d2Deg), C1=2*R1*Math.sin(rad(d1Deg/2)), C2=2*R2*Math.sin(rad(d2Deg/2));
  const A1=curveArcPoints(R1,d1Deg,n,false), pcc=A1[n], u=[Math.cos(rad(d1Deg)),Math.sin(rad(d1Deg))];
  const prc2=g?{x:pcc.x+g*u[0],y:pcc.y+g*u[1]}:pcc;
  const A2=rotateTranslatePts(curveArcPoints(R2,d2Deg,n,!!reversa), rad(d1Deg), prc2.x, prc2.y);
  const PC=A1[0], PT=A2[n], PI1={x:pcc.x-T1*u[0],y:pcc.y-T1*u[1]}, PI2={x:prc2.x+T2*u[0],y:prc2.y+T2*u[1]};
  const rows1=[{k:'R1',c:c1,v:`${fmtNum(R1,2)} m`},{k:'Δ1',c:c1,v:fmtAngle(d1Deg)},{k:'T1',c:c1,v:`${fmtNum(T1,3)} m`},{k:'Lc1',c:c1,v:`${fmtNum(Lc1,3)} m`},{k:'C1',c:c1,v:`${fmtNum(C1,3)} m`}];
  const rows2=[{k:'R2',c:c2,v:`${fmtNum(R2,2)} m`},{k:'Δ2',c:c2,v:fmtAngle(d2Deg)},{k:'T2',c:c2,v:`${fmtNum(T2,3)} m`},{k:'Lc2',c:c2,v:`${fmtNum(Lc2,3)} m`},{k:'C2',c:c2,v:`${fmtNum(C2,3)} m`}];
  const tot=reversa?[{k:'PI1–PI2',c:'var(--ink)',v:`${fmtNum(T1+g+T2,3)} m`},{k:'Lc total',c:'var(--ink)',v:`${fmtNum(Lc1+Lc2,3)} m`}]:[{k:'Δ total',c:'var(--ink)',v:fmtAngle(d1Deg+d2Deg)},{k:'Lc total',c:'var(--ink)',v:`${fmtNum(Lc1+Lc2,3)} m`}];
  if(g) tot.push({k:'Tang. interm.',c:'var(--ink)',v:`${fmtNum(g,3)} m`});
  K.list([rows1,rows2,tot],{gap:8});
  const all=A1.concat(A2,[PI1,PI2]).map(p=>[p.x,p.y]);
  const fit=K.fit(all,{l:22,r:298,t:Math.max(K.listBottom+8,40),b:176});
  const S=p=>[fit.X(p.x),fit.Y(p.y)];
  const s1=A1.map(S), s2=A2.map(S), sPC=S(PC), sPCC=S(pcc), sPRC2=S(prc2), sPT=S(PT), sPI1=S(PI1), sPI2=S(PI2);
  // tangentes, intermedia y cuerdas
  K.line(...sPC,...sPI1,c1,{sw:0.6,dash:'1.6 1.6'}); K.line(...sPI2,...sPT,c2,{sw:0.6,dash:'1.6 1.6'});
  K.line(...sPI1,...sPCC,c1,{sw:0.6,dash:'1.6 1.6'}); K.line(...sPRC2,...sPI2,c2,{sw:0.6,dash:'1.6 1.6'});
  if(g) K.line(...sPCC,...sPRC2,'var(--ink)',{sw:0.9});
  K.line(...sPC,...sPCC,c1,{sw:0.8,dash:'3 2'}); K.line(...sPRC2,...sPT,c2,{sw:0.8,dash:'3 2'});
  K.poly(s1,{stroke:c1,sw:1.5}); K.poly(s2,{stroke:c2,sw:1.5});
  [sPC,sPCC,sPRC2,sPT,sPI1,sPI2].forEach((q,i)=>{ if(i===2&&!g) return; K.dot(q[0],q[1],'var(--ink-soft)',i<4?2:1.6); });
  // letras de puntos
  const nm=reversa?'PRC':'PCC', un=v=>{const l=Math.hypot(v[0],v[1])||1; return [v[0]/l,v[1]/l];};
  const away=(p,ref)=>un([p[0]-ref[0],p[1]-ref[1]]);
  const m1=s1[n/2], m2=s2[n/2], ch1=[(sPC[0]+sPCC[0])/2,(sPC[1]+sPCC[1])/2], ch2=[(sPRC2[0]+sPT[0])/2,(sPRC2[1]+sPT[1])/2];
  K.pointLabel('PC',sPC[0],sPC[1],4.5,'var(--ink-soft)',{dir:away(sPC,m1),omit:false});
  K.pointLabel(g?nm+'1':nm,sPCC[0],sPCC[1],4.5,'var(--ink-soft)',{dir:away(sPCC,ch1),omit:false});
  if(g) K.pointLabel(nm+'2',sPRC2[0],sPRC2[1],4.5,'var(--ink-soft)',{dir:away(sPRC2,ch2),omit:false});
  K.pointLabel('PT',sPT[0],sPT[1],4.5,'var(--ink-soft)',{dir:away(sPT,m2),omit:false});
  K.pointLabel('PI1',sPI1[0],sPI1[1],3.4,'var(--ink-soft)',{dir:away(sPI1,m1)});
  K.pointLabel('PI2',sPI2[0],sPI2[1],3.4,'var(--ink-soft)',{dir:away(sPI2,m2)});
  // magnitudes de cada tramo
  const outFrom=(a,b,ref)=>{ const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2; return away([mx,my],ref); };
  K.lineLabel(...sPC,...sPI1,'T1',4.5,c1,{out:outFrom(sPC,sPI1,m1),extras:[0,3,6]});
  K.lineLabel(...sPI2,...sPT,'T2',4.5,c2,{out:outFrom(sPI2,sPT,m2),extras:[0,3,6]});
  K.lineLabel(...sPC,...sPCC,'C1',4.5,c1,{out:away(ch1,m1),extras:[0,3,6]});
  K.lineLabel(...sPRC2,...sPT,'C2',4.5,c2,{out:away(ch2,m2),extras:[0,3,6]});
  K.pointLabel('Lc1',m1[0],m1[1],4.5,c1,{dir:away(m1,ch1),rmin:3,rmax:11});
  K.pointLabel('Lc2',m2[0],m2[1],4.5,c2,{dir:away(m2,ch2),rmin:3,rmax:11});
  return K.svg();
}
const CURVA_MODES = {
  R_D:  {label1:'Radio R (m)', type1:'len', def1:20,   label2:'Deflexión Δ',              type2:'ang', def2:42.5},
  R_T:  {label1:'Radio R (m)', type1:'len', def1:20,   label2:'Tangente T (m)',           type2:'len', def2:7.78},
  R_Lc: {label1:'Radio R (m)', type1:'len', def1:20,   label2:'Longitud de curva Lc (m)', type2:'len', def2:14.83},
  R_C:  {label1:'Radio R (m)', type1:'len', def1:20,   label2:'Cuerda larga C (m)',       type2:'len', def2:14.50},
  R_E:  {label1:'Radio R (m)', type1:'len', def1:20,   label2:'Externa E (m)',            type2:'len', def2:1.46},
  R_M:  {label1:'Radio R (m)', type1:'len', def1:20,   label2:'Ordenada media M (m)',     type2:'len', def2:1.36},
  D_T:  {label1:'Deflexión Δ', type1:'ang', def1:42.5, label2:'Tangente T (m)',           type2:'len', def2:7.78},
  D_Lc: {label1:'Deflexión Δ', type1:'ang', def1:42.5, label2:'Longitud de curva Lc (m)', type2:'len', def2:14.83},
  D_C:  {label1:'Deflexión Δ', type1:'ang', def1:42.5, label2:'Cuerda larga C (m)',       type2:'len', def2:14.50},
  D_E:  {label1:'Deflexión Δ', type1:'ang', def1:42.5, label2:'Externa E (m)',            type2:'len', def2:1.46},
  D_M:  {label1:'Deflexión Δ', type1:'ang', def1:42.5, label2:'Ordenada media M (m)',     type2:'len', def2:1.36}
};
const CURVA_MODE_LABELS = {
  R_D:'Radio (R) y Deflexión (Δ)', R_T:'Radio (R) y Tangente (T)', R_Lc:'Radio (R) y Longitud de curva (Lc)',
  R_C:'Radio (R) y Cuerda larga (C)', R_E:'Radio (R) y Externa (E)', R_M:'Radio (R) y Ordenada media (M)',
  D_T:'Deflexión (Δ) y Tangente (T)', D_Lc:'Deflexión (Δ) y Longitud de curva (Lc)', D_C:'Deflexión (Δ) y Cuerda larga (C)',
  D_E:'Deflexión (Δ) y Externa (E)', D_M:'Deflexión (Δ) y Ordenada media (M)'
};
function curvaFieldHtmlFor(type,id,label,def){ return type==='ang' ? angleFieldHTML(id, def, label) : fieldRow(label, id, def); }
function curvaBodyFieldsHtml(mode, idPrefix){
  const m = CURVA_MODES[mode];
  return curvaFieldHtmlFor(m.type1,idPrefix+'v1',m.label1,m.def1) + curvaFieldHtmlFor(m.type2,idPrefix+'v2',m.label2,m.def2);
}
function curvaModeSelectHtml(id, selected){
  return `<select id="${id}">${Object.keys(CURVA_MODE_LABELS).map(k=>`<option value="${k}"${k===selected?' selected':''}>${CURVA_MODE_LABELS[k]}</option>`).join('')}</select>`;
}
function readCurvaModeInputs(mode, idPrefix){
  const m = CURVA_MODES[mode];
  const v1 = m.type1==='ang' ? readAngleField(idPrefix+'v1') : val(idPrefix+'v1');
  const v2 = m.type2==='ang' ? readAngleField(idPrefix+'v2') : val(idPrefix+'v2');
  return {v1, v2};
}
