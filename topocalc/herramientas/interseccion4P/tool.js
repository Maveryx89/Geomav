"use strict";
/* Herramienta «Intersección por 4 Puntos»: coordenadas del cruce de dos rectas, cada una definida por dos puntos.
   Mismos datos de entrada y de salida que el programa INTERSEC de la calculadora Casio fx-9860GII (Norte y Este de la
   intersección). A diferencia del programa Casio, que solo da el resultado correcto cuando el cruce está por delante del
   punto 1 y del punto 1', aquí vale para cualquier posición (prolongaciones hacia atrás o adelante). */

/* Rectas P1–P2 y P3–P4 (P3 = 1', P4 = 2'). Devuelve {error} o el resultado. t y s: posición del cruce sobre cada recta
   (0 = primer punto, 1 = segundo punto). */
function calcInterseccion4P(e1,n1,e2,n2,e3,n3,e4,n4){
  const a=e2-e1, b=n2-n1, c=e4-e3, d=n4-n3, L1=Math.hypot(a,b), L2=Math.hypot(c,d);
  if(!(L1>1e-9) || !(L2>1e-9)) return {error:'Los dos puntos de cada recta no pueden coincidir.'};
  const den=a*d-b*c;
  if(Math.abs(den) < 1e-9*L1*L2) return {error:'Las rectas son paralelas (o coincidentes): no se intersectan en un punto.'};
  const w1=e3-e1, w2=n3-n1;
  const t=(w1*d-w2*c)/den, s=(w1*b-w2*a)/den;
  const E=e1+t*a, N=n1+t*b;
  let ang=Math.abs(toDeg(Math.atan2(den,a*c+b*d))); if(ang>90) ang=180-ang;
  return {E,N,t,s,L1,L2,ang,d1:t*L1,d2:s*L2,
          dP1:Math.hypot(E-e1,N-n1), dP2:Math.hypot(E-e2,N-n2), dP3:Math.hypot(E-e3,N-n3), dP4:Math.hypot(E-e4,N-n4),
          fuera1:(t<0||t>1), fuera2:(s<0||s>1)};
}

function svgInterseccion4P(P,r){
  const K=svgKit(), f=K.f;
  const CB1='var(--blueprint)', CB2='var(--success)', CI='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  K.north();
  K.list([[{k:'N',c:CI,v:fmtNum(r.N,3)},{k:'E',c:CI,v:fmtNum(r.E,3)},{k:'Ángulo',c:CK,v:fmtAngle(r.ang)}],
          [{k:'D 1–I',c:CB1,v:`${fmtNum(r.dP1,3)} m`},{k:'D 2–I',c:CB1,v:`${fmtNum(r.dP2,3)} m`},{k:"D 1'–I",c:CB2,v:`${fmtNum(r.dP3,3)} m`},{k:"D 2'–I",c:CB2,v:`${fmtNum(r.dP4,3)} m`}]]);
  const top=Math.max(44,K.listBottom+12);
  const fit=K.fit([[P[0],P[1]],[P[2],P[3]],[P[4],P[5]],[P[6],P[7]],[r.E,r.N]],{l:70,r:262,t:top,b:166});
  const q=i=>({x:fit.X(P[2*i]),y:fit.Y(P[2*i+1])}), A=q(0),B=q(1),C=q(2),D=q(3), I={x:fit.X(r.E),y:fit.Y(r.N)};
  const recta=(U,V,col,t)=>{                      // tramo U–V sólido; si el cruce queda fuera, prolongación punteada hasta I
    K.line(U.x,U.y,V.x,V.y,col);
    const dU=Math.hypot(I.x-U.x,I.y-U.y), dV=Math.hypot(I.x-V.x,I.y-V.y), L=Math.hypot(V.x-U.x,V.y-U.y);
    if(t<0) K.line(U.x,U.y,I.x,I.y,col,{dash:'2 1.6',op:0.55});
    else if(t>1) K.line(V.x,V.y,I.x,I.y,col,{dash:'2 1.6',op:0.55});
  };
  recta(A,B,CB1,r.t); recta(C,D,CB2,r.s);
  // arco del ángulo agudo en I
  const dir=(U,V)=>{ const dx=V.x-U.x, dy=V.y-U.y, l=Math.hypot(dx,dy)||1; return [dx/l,dy/l]; };
  const u1=dir(A,B); let u2=dir(C,D); if(u1[0]*u2[0]+u1[1]*u2[1]<0) u2=[-u2[0],-u2[1]];
  const a0=Math.atan2(u1[1],u1[0])*180/Math.PI, a1=Math.atan2(u2[1],u2[0])*180/Math.PI, da=((a1-a0+540)%360)-180, R=8;
  K.arc(I.x,I.y,R,a0,a0+da,CK);
  [A,B,C,D].forEach((p,i)=>K.dot(p.x,p.y,CS,2)); K.dot(I.x,I.y,CI,2.7);
  const cx=(A.x+B.x+C.x+D.x)/4, cy=(A.y+B.y+C.y+D.y)/4, out=p=>{ const dx=p.x-cx, dy=p.y-cy, l=Math.hypot(dx,dy)||1; return [dx/l,dy/l]; };
  K.pointLabel('1',A.x,A.y,4.5,CB1,{dir:out(A)}); K.pointLabel('2',B.x,B.y,4.5,CB1,{dir:out(B)});
  K.pointLabel("1'",C.x,C.y,4.5,CB2,{dir:out(C)}); K.pointLabel("2'",D.x,D.y,4.5,CB2,{dir:out(D)});
  K.pointLabel('I',I.x,I.y,4.5,CI,{dir:[0,-1],full:true});
  const m=a0+da/2, bis=[Math.cos(m*Math.PI/180),Math.sin(m*Math.PI/180)];
  K.pointLabel(fmtAngle(r.ang),I.x,I.y,4,CK,{dir:bis,rmin:R+5,rmax:R+16});
  return K.svg();
}

function renderInterseccion4P(){
  const body = `<div class="field-card">
    <h3>Recta 1</h3>
    ${libretaBloqueHTML('i4_lib1','Punto 1 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este 1','i4_e1',EJ_E0)}${fieldRow('Norte 1','i4_n1',EJ_N0)}</div>
    ${libretaBloqueHTML('i4_lib2','Punto 2 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este 2','i4_e2',round(EJ_E0+40,2))}${fieldRow('Norte 2','i4_n2',round(EJ_N0+30,2))}</div>
    <h3 style="margin-top:14px;">Recta 2</h3>
    ${libretaBloqueHTML('i4_lib3',"Punto 1' desde la Libreta")}
    <div class="field-inline2">${fieldRow("Este 1'",'i4_e3',round(EJ_E0+60,2))}${fieldRow("Norte 1'",'i4_n3',round(EJ_N0-10,2))}</div>
    ${libretaBloqueHTML('i4_lib4',"Punto 2' desde la Libreta")}
    <div class="field-inline2">${fieldRow("Este 2'",'i4_e4',round(EJ_E0+80,2))}${fieldRow("Norte 2'",'i4_n4',round(EJ_N0+25,2))}</div>
    <button class="btn" id="btnI4" type="button">Calcular</button>
    <div id="resI4"></div>
  </div>`;
  toolShell('interseccion4P','Coordenadas del punto de cruce de dos rectas, cada una definida por dos puntos conocidos (1–2 y 1′–2′). Funciona también cuando el cruce queda en la prolongación de las rectas.', body);
  const metas=[null,null,null,null];
  [1,2,3,4].forEach(k=>libretaTraerA('i4_lib'+k,'i4_e'+k,'i4_n'+k, m=>{ metas[k-1]=m; }));
  document.getElementById('btnI4').addEventListener('click', ()=>{
    const P=[]; for(let k=1;k<=4;k++){ P.push(val('i4_e'+k),val('i4_n'+k)); }
    const box=document.getElementById('resI4');
    const inc=metasIncompatibles(metas); if(inc){ box.innerHTML=msgIncompatibles(inc); return; }
    if(P.some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todas las coordenadas.</p>`; return; }
    const r=calcInterseccion4P(...P);
    if(r.error){ box.innerHTML=`<p class="err-msg">${r.error}</p>`; return; }
    const aviso=(r.fuera1||r.fuera2)?`<p class="tool-blurb" style="margin:8px 0 0;">El cruce queda en la prolongación de ${r.fuera1&&r.fuera2?'ambas rectas':(r.fuera1?'la recta 1–2':"la recta 1′–2′")} (fuera de los puntos medidos).</p>`:'';
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Norte de la intersección</span><span class="v accent big">${fmtNum(r.N,3)}</span></div>
      <div class="result-row"><span class="k">Este de la intersección</span><span class="v accent big">${fmtNum(r.E,3)}</span></div>
      <div class="result-row"><span class="k">Ángulo entre rectas</span><span class="v">${fmtAngle(r.ang)}</span></div>
      <div class="result-row"><span class="k">Distancia punto 1 → I</span><span class="v">${fmtNum(r.dP1,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia punto 2 → I</span><span class="v">${fmtNum(r.dP2,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia punto 1′ → I</span><span class="v">${fmtNum(r.dP3,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia punto 2′ → I</span><span class="v">${fmtNum(r.dP4,3)} m</span></div>
      ${aviso}
      <div class="plot-wrap">${svgInterseccion4P(P,r)}</div>
    </div>`;
    const btn=document.createElement('button');
    btn.type='button'; btn.className='btn-sm'; btn.style.marginTop='8px';
    btn.textContent='💾 Guardar en la Libreta';
    btn.addEventListener('click', ()=>{ agregarPunto('Intersección', r.E, r.N, null, '', metas.find(Boolean)||undefined); btn.textContent='Guardado ✓'; });
    box.appendChild(btn);
  });
}

const RENDERERS = { interseccion4P: renderInterseccion4P };
