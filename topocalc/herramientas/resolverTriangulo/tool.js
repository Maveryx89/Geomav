"use strict";
/* Herramienta «Resolver Triángulo»: completa un triángulo cualquiera a partir de 3 datos (ángulos A, B, C y lados a, b, c;
   el lado a es el opuesto al ángulo A, etc.). Mismos datos de entrada y de salida que el programa TRISOLVE de la calculadora
   Casio fx-9860GII: ángulos, lados y área, con las dos soluciones cuando el caso lado-lado-ángulo es ambiguo.
   Ángulos en grados decimales. Un dato en blanco (o 0) es desconocido. */
const _sinD=x=>Math.sin(x*Math.PI/180), _cosD=x=>Math.cos(x*Math.PI/180);
const _asinD=x=>Math.asin(x)*180/Math.PI, _acosD=x=>Math.acos(x)*180/Math.PI;

/* A,B,C en grados; a,b,c en metros; NaN o 0 = desconocido. Devuelve {error} o {sols:[{A,a,B,b,C,c,area,per}], tipo, ignorados}. */
function calcResolverTriangulo(A,a,B,b,C,c){
  const pos=v=>(isFinite(v)&&v>0)?v:0;
  const ang=[0,pos(A),pos(B),pos(C)], lad=[0,pos(a),pos(b),pos(c)];
  const nA=[1,2,3].filter(i=>ang[i]).length, nS=[1,2,3].filter(i=>lad[i]).length;
  if(nS===0) return {error:'Ingresa al menos un lado: con solo ángulos el triángulo queda indeterminado (solo se conoce su forma).'};
  if(nS!==3 && nA+nS!==3) return {error:'Ingresa exactamente 3 datos (con al menos un lado).'};
  if([1,2,3].some(i=>ang[i]>=180)) return {error:'Los ángulos deben ser menores que 180° (200 gon).'};
  const nx=i=>i%3+1, pv=i=>(i+1)%3+1;                       // índice siguiente y anterior (1..3)
  const fin=(an,ls,tipo,ign)=>({tipo,ignorados:ign,area:0,sols:[{A:an[1],a:ls[1],B:an[2],b:ls[2],C:an[3],c:ls[3],area:0.5*ls[1]*ls[2]*_sinD(an[3]),per:ls[1]+ls[2]+ls[3]}]});
  let an=ang.slice(), ls=lad.slice(), extra=null, tipo='';
  if(nS===3){                                                // SSS
    tipo='Tres lados (SSS)';
    if(ls[1]+ls[2]<=ls[3]||ls[2]+ls[3]<=ls[1]||ls[1]+ls[3]<=ls[2]) return {error:'Los tres lados no forman un triángulo (cada lado debe ser menor que la suma de los otros dos).'};
    for(let i=1;i<=3;i++){ const j=nx(i), k=nx(j); an[i]=_acosD((ls[j]*ls[j]+ls[k]*ls[k]-ls[i]*ls[i])/(2*ls[j]*ls[k])); }
    return Object.assign(fin(an,ls,tipo,nA>0),{});
  }
  if(nA===2){                                                // ASA / AAS
    tipo='Dos ángulos y un lado';
    const i3=[1,2,3].find(i=>!an[i]); an[i3]=180-an[1]*(an[1]>0)-an[2]*(an[2]>0)-an[3]*(an[3]>0);
    if(an[i3]<=1e-12) return {error:'Los dos ángulos suman 180° o más: no forman un triángulo.'};
    const P=[1,2,3].find(i=>ls[i]);
    for(let i=1;i<=3;i++) if(!ls[i]) ls[i]=_sinD(an[i])*ls[P]/_sinD(an[P]);
    return fin(an,ls,tipo,false);
  }
  // un ángulo y dos lados
  const p=[1,2,3].find(i=>an[i]&&ls[i]);
  if(!p){                                                    // SAS: el ángulo está entre los dos lados
    tipo='Dos lados y el ángulo comprendido (LAL)';
    const ci=[1,2,3].find(i=>an[i]), j=nx(ci), k=nx(j);
    ls[ci]=Math.sqrt(ls[j]*ls[j]+ls[k]*ls[k]-2*ls[j]*ls[k]*_cosD(an[ci]));
    for(let i=1;i<=3;i++){ const jj=nx(i), kk=nx(jj); an[i]=_acosD((ls[jj]*ls[jj]+ls[kk]*ls[kk]-ls[i]*ls[i])/(2*ls[jj]*ls[kk])); }
    return fin(an,ls,tipo,false);
  }
  tipo='Dos lados y un ángulo opuesto (LLA)';                // SSA: puede tener 2 soluciones
  const o=[1,2,3].find(i=>ls[i]&&i!==p);
  const s=ls[o]*_sinD(an[p])/ls[p];
  if(s>1+1e-12) return {error:'No existe el triángulo: el lado opuesto al ángulo dado es demasiado corto.'};
  const X=_asinD(Math.min(1,s));
  if(an[p]+X>=180-1e-12) return {error:'No existe el triángulo con esos datos.'};
  const sol=(angO)=>{ const a2=an.slice(), l2=ls.slice(); a2[o]=angO; const t=6-o-p; a2[t]=180-a2[p]-a2[o]; l2[t]=_sinD(a2[t])*l2[p]/_sinD(a2[p]); return fin(a2,l2,tipo,false).sols[0]; };
  const r1=sol(X), sols=[r1];
  if(an[p]<X-1e-9 && Math.abs(X-90)>1e-9) sols.push(sol(180-X));   // caso ambiguo
  return {tipo,ignorados:false,sols};
}

function svgResolverTriangulo(sol,etq){
  const K=svgKit(), f=K.f;
  const CS='var(--ink-soft)', CK='var(--ink)', CA='var(--blueprint)', CL='var(--success)', CP='var(--accent)';
  const aT=v=>fmtAngle(v);
  K.list([[{k:'A',c:CA,v:aT(sol.A)},{k:'B',c:CA,v:aT(sol.B)},{k:'C',c:CA,v:aT(sol.C)}],
          [{k:'a',c:CL,v:`${fmtNum(sol.a,3)} m`},{k:'b',c:CL,v:`${fmtNum(sol.b,3)} m`},{k:'c',c:CL,v:`${fmtNum(sol.c,3)} m`}],
          [{k:'Área',c:CP,v:`${fmtNum(sol.area,3)} m²`},{k:'Perím.',c:CK,v:`${fmtNum(sol.per,3)} m`}]]);
  // A en el origen, B sobre el eje horizontal (lado c), C arriba
  const Ar=sol.A*Math.PI/180;
  const W={A:[0,0],B:[sol.c,0],C:[sol.b*Math.cos(Ar),sol.b*Math.sin(Ar)]};
  const top=Math.max(44,K.listBottom+12);
  const fit=K.fit([W.A,W.B,W.C],{l:70,r:262,t:top,b:160});
  const S=k=>({x:fit.X(W[k][0]),y:fit.Y(W[k][1])}), A=S('A'),B=S('B'),C=S('C');
  K.poly([[A.x,A.y],[B.x,B.y],[C.x,C.y]],{stroke:CK,close:true,sw:1});
  const sang=(V,P)=>Math.atan2(P.y-V.y,P.x-V.x)*180/Math.PI;
  const arco=(V,P,Q,col)=>{ const m=Math.min(Math.hypot(P.x-V.x,P.y-V.y),Math.hypot(Q.x-V.x,Q.y-V.y)), R=Math.max(2.5,Math.min(8,0.3*m)), a0=sang(V,P), d=((sang(V,Q)-a0+540)%360)-180; K.arc(V.x,V.y,R,a0,a0+d,col); const mm=(a0+d/2)*Math.PI/180; return {R,dir:[Math.cos(mm),Math.sin(mm)]}; };
  const gA=arco(A,B,C,CA), gB=arco(B,C,A,CA), gC=arco(C,A,B,CA);
  [A,B,C].forEach(p=>K.dot(p.x,p.y,CK,2));
  const cx=(A.x+B.x+C.x)/3, cy=(A.y+B.y+C.y)/3, out=p=>{ const dx=p.x-cx, dy=p.y-cy, l=Math.hypot(dx,dy)||1; return [dx/l,dy/l]; };
  K.pointLabel('A',A.x,A.y,4.5,CK,{dir:out(A)}); K.pointLabel('B',B.x,B.y,4.5,CK,{dir:out(B)}); K.pointLabel('C',C.x,C.y,4.5,CK,{dir:out(C)});
  const lado=(U,V,t)=>{ const mx=(U.x+V.x)/2, my=(U.y+V.y)/2, dx=mx-cx, dy=my-cy, l=Math.hypot(dx,dy)||1; K.lineLabel(U.x,U.y,V.x,V.y,t,4,CL,{out:[dx/l,dy/l]}); };
  lado(B,C,`a = ${fmtNum(sol.a,2)} m`); lado(C,A,`b = ${fmtNum(sol.b,2)} m`); lado(A,B,`c = ${fmtNum(sol.c,2)} m`);
  K.pointLabel(aT(sol.A),A.x,A.y,3.8,CA,{dir:gA.dir,rmin:gA.R+4,rmax:gA.R+12});
  K.pointLabel(aT(sol.B),B.x,B.y,3.8,CA,{dir:gB.dir,rmin:gB.R+4,rmax:gB.R+12});
  K.pointLabel(aT(sol.C),C.x,C.y,3.8,CA,{dir:gC.dir,rmin:gC.R+4,rmax:gC.R+12});
  if(etq) K.txt(etq,4.2,CP,{x:292,y:176,anchor:'end'});
  return K.svg();
}

function _optAngHTML(id,label){
  if(angleSystem==='cent') return `<div class="field-row"><label for="${id}_gon">${label} (gon)</label><input type="number" step="any" id="${id}_gon" placeholder="—"></div>`;
  return `<div class="field-row"><label>${label} (° ' ")</label><div class="field-inline">${fieldRow('°',id+'_d','',{placeholder:'—'})}${fieldRow("'",id+'_m','',{placeholder:'0'})}${fieldRow('"',id+'_s','',{placeholder:'0'})}</div></div>`;
}
function _readOptAng(id){
  if(angleSystem==='cent'){ const g=val(id+'_gon'); return (isNaN(g)||g===0)?NaN:gonToDeg(g); }
  const d=val(id+'_d'); if(isNaN(d)) return NaN;
  const v=dmsToDec(1,d,val(id+'_m')||0,val(id+'_s')||0); return v===0?NaN:v;
}

function renderResolverTriangulo(){
  const body = `<div class="field-card">
    <p class="tool-blurb" style="margin:0 0 10px;">Ingresa exactamente 3 datos (al menos un lado) y deja en blanco el resto. El lado a es el opuesto al ángulo A, el b al B y el c al C.</p>
    <div class="field-inline2">${_optAngHTML('rt_A','Ángulo A')}${fieldRow('Lado a (m)','rt_a','',{placeholder:'—'})}</div>
    <div class="field-inline2">${_optAngHTML('rt_B','Ángulo B')}${fieldRow('Lado b (m)','rt_b','',{placeholder:'—'})}</div>
    <div class="field-inline2">${_optAngHTML('rt_C','Ángulo C')}${fieldRow('Lado c (m)','rt_c','',{placeholder:'—'})}</div>
    <button class="btn" id="btnRT" type="button">Resolver</button>
    <div id="resRT"></div>
  </div>`;
  toolShell('resolverTriangulo','Resuelve cualquier triángulo a partir de 3 datos: tres lados, dos lados y el ángulo comprendido, dos ángulos y un lado, o dos lados y un ángulo opuesto (con sus dos soluciones cuando existen). Entrega ángulos, lados, área y perímetro.', body);
  document.getElementById('btnRT').addEventListener('click', ()=>{
    const A=_readOptAng('rt_A'),B=_readOptAng('rt_B'),C=_readOptAng('rt_C'), a=val('rt_a'),b=val('rt_b'),c=val('rt_c');
    const box=document.getElementById('resRT');
    const r=calcResolverTriangulo(A,a,B,b,C,c);
    if(r.error){ box.innerHTML=`<p class="err-msg">${r.error}</p>`; return; }
    const filas=s=>`<div class="result-row"><span class="k">Ángulo A</span><span class="v">${fmtAngle(s.A)}</span></div>
      <div class="result-row"><span class="k">Lado a</span><span class="v">${fmtNum(s.a,3)} m</span></div>
      <div class="result-row"><span class="k">Ángulo B</span><span class="v">${fmtAngle(s.B)}</span></div>
      <div class="result-row"><span class="k">Lado b</span><span class="v">${fmtNum(s.b,3)} m</span></div>
      <div class="result-row"><span class="k">Ángulo C</span><span class="v">${fmtAngle(s.C)}</span></div>
      <div class="result-row"><span class="k">Lado c</span><span class="v">${fmtNum(s.c,3)} m</span></div>
      <div class="result-row"><span class="k">Área</span><span class="v accent big">${fmtNum(s.area,3)} m²</span></div>
      <div class="result-row"><span class="k">Perímetro</span><span class="v">${fmtNum(s.per,3)} m</span></div>`;
    const dos=r.sols.length>1;
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <p class="tool-blurb" style="margin:0 0 8px;">${r.tipo}${dos?' — <strong>hay dos soluciones</strong>':''}.${r.ignorados?' Los ángulos ingresados se recalcularon a partir de los tres lados.':''}</p>
      ${r.sols.map((s,i)=>`${dos?`<h4 style="margin:12px 0 4px;">Solución ${i+1}</h4>`:''}${filas(s)}<div class="plot-wrap">${svgResolverTriangulo(s,dos?`Solución ${i+1}`:'')}</div>`).join('')}
    </div>`;
  });
}

const RENDERERS = { resolverTriangulo: renderResolverTriangulo };
