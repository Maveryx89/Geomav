"use strict";
/* Herramienta «Estación Libre»: coordenadas de la estación a partir de 2 puntos conocidos,
   las distancias estación→punto y el ángulo medido en la estación entre ambos.
   Mismos datos de entrada y de salida que el programa EST~LIBR de la calculadora Casio fx-9860GII.
   Ángulos internos en grados decimales (la app los muestra en gon o sexagesimal según el sistema elegido). */

/* lado = +1: la estación queda a la DERECHA mirando de P1 a P2 (como el programa Casio); -1: a la izquierda.
   Devuelve null si P1 = P2, o {error} si los datos no forman un triángulo. */
function calcEstacionLibre(e1,n1,e2,n2,d1,d2,angDeg,lado){
  lado = lado === -1 ? -1 : 1;
  const de=e2-e1, dn=n2-n1, L=Math.hypot(de,dn);
  if(!(L>1e-9)) return null;
  if(!(d1>0) || !(d2>0)) return {error:'Las distancias estación→punto deben ser mayores que cero.'};
  if(!(angDeg>0 && angDeg<180)) return {error:'El ángulo en la estación debe estar entre 0 y 180° (0 y 200 gon).'};
  const az12 = normDeg(toDeg(Math.atan2(de,dn)));
  const s = Math.sin(toRad(angDeg)), a = d2*s/L, b = d1*s/L;
  if(Math.abs(a)>1+1e-12 || Math.abs(b)>1+1e-12) return {error:'Datos incompatibles: con esas distancias y ese ángulo no se forma el triángulo.'};
  let J = toDeg(Math.asin(Math.min(1,a))), K = toDeg(Math.asin(Math.min(1,b)));
  // ángulo obtuso en P1 / P2: el seno es ambiguo, se decide con las longitudes de los lados
  if(d1*d1 + L*L - d2*d2 < 0) J = 180 - J;
  if(d2*d2 + L*L - d1*d1 < 0) K = 180 - K;
  const azE1 = az12 + lado*J;                      // acimut P1 → estación
  const E = e1 + d1*Math.sin(toRad(azE1)), N = n1 + d1*Math.cos(toRad(azE1));
  const azE2 = az12 + 180 - lado*K;                // acimut P2 → estación (control)
  const E2 = e2 + d2*Math.sin(toRad(azE2)), N2 = n2 + d2*Math.cos(toRad(azE2));
  const suma = angDeg + J + K;
  return {dist12:L, az12, J, K, E, N, suma, desvSuma:suma-180, E2, N2, ctrl:Math.hypot(E2-E,N2-N), lado};
}

function svgEstacionLibre(e1,n1,e2,n2,r,d1,d2,angDeg){
  const K=svgKit(), eng=K.eng, f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const aT = v => fmtAngle(v);
  K.north();
  K.list([
    [{k:'D 1-2',c:CD,v:`${fmtNum(r.dist12,3)} m`},{k:'Az 1-2',c:CD,v:aT(r.az12)},{k:'N est.',c:CP,v:fmtNum(r.N,3)},{k:'E est.',c:CP,v:fmtNum(r.E,3)}],
    [{k:'D E-1',c:CZ,v:`${fmtNum(d1,3)} m`},{k:'D E-2',c:CZ,v:`${fmtNum(d2,3)} m`},{k:'Áng E',c:CK,v:aT(angDeg)}],
    [{k:'Áng 1',c:CK,v:aT(r.J)},{k:'Áng 2',c:CK,v:aT(r.K)},{k:'Suma',c:CK,v:aT(r.suma)}]
  ]);
  const top=Math.max(44,K.listBottom+12);
  const fit=K.fit([[e1,n1],[e2,n2],[r.E,r.N]],{l:80,r:260,t:top,b:168});
  const P1={x:fit.X(e1),y:fit.Y(n1)}, P2={x:fit.X(e2),y:fit.Y(n2)}, S={x:fit.X(r.E),y:fit.Y(r.N)};
  K.line(P1.x,P1.y,P2.x,P2.y,CD);
  K.line(S.x,S.y,P1.x,P1.y,CZ);
  K.line(S.x,S.y,P2.x,P2.y,CZ);
  // arcos de los tres ángulos
  const sang = (V,A) => Math.atan2(A.y-V.y,A.x-V.x)*180/Math.PI;
  const arco = (V,A,B,col) => {
    const lenMin = Math.min(Math.hypot(A.x-V.x,A.y-V.y),Math.hypot(B.x-V.x,B.y-V.y));
    const R = Math.max(2.5,Math.min(8,0.32*lenMin));
    const a0 = sang(V,A); let d = ((sang(V,B)-a0+540)%360)-180;
    K.arc(V.x,V.y,R,a0,a0+d,col);
    const m=(a0+d/2)*Math.PI/180; return {R, dir:[Math.cos(m),Math.sin(m)]};
  };
  const aE=arco(S,P1,P2,CK), a1=arco(P1,P2,S,CK), a2=arco(P2,P1,S,CK);
  K.dot(P1.x,P1.y,CS,2); K.dot(P2.x,P2.y,CS,2); K.dot(S.x,S.y,CP,2.7);
  // rótulos: nombres de punto (hacia fuera del triángulo), lados y ángulos
  const cx=(P1.x+P2.x+S.x)/3, cy=(P1.y+P2.y+S.y)/3;
  const fuera = P => { const dx=P.x-cx, dy=P.y-cy, l=Math.hypot(dx,dy)||1; return [dx/l,dy/l]; };
  K.pointLabel('1',P1.x,P1.y,4.5,CS,{dir:fuera(P1)});
  K.pointLabel('2',P2.x,P2.y,4.5,CS,{dir:fuera(P2)});
  K.pointLabel('E',S.x,S.y,4.5,CP,{dir:fuera(S)});
  const lados=(A,B,t,col)=>{ const mx=(A.x+B.x)/2, my=(A.y+B.y)/2, dx=mx-cx, dy=my-cy, l=Math.hypot(dx,dy)||1; K.lineLabel(A.x,A.y,B.x,B.y,t,4,col,{out:[dx/l,dy/l]}); };
  lados(P1,P2,`D = ${fmtNum(r.dist12,2)} m`,CD);
  lados(S,P1,`F = ${fmtNum(d1,2)} m`,CZ);
  lados(S,P2,`G = ${fmtNum(d2,2)} m`,CZ);
  K.pointLabel(aT(angDeg),S.x,S.y,4,CK,{dir:aE.dir,rmin:aE.R+4,rmax:aE.R+14});
  K.pointLabel(aT(r.J),P1.x,P1.y,4,CK,{dir:a1.dir,rmin:a1.R+4,rmax:a1.R+14});
  K.pointLabel(aT(r.K),P2.x,P2.y,4,CK,{dir:a2.dir,rmin:a2.R+4,rmax:a2.R+14});
  return K.svg();
}

function renderEstacionLibre(){
  const body = `<div class="field-card">
    <h3>Punto 1 (conocido)</h3>
    ${libretaBloqueHTML('el_lib1','Punto 1 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este 1','el_e1',EJ_E0)}${fieldRow('Norte 1','el_n1',EJ_N0)}</div>
    <h3 style="margin-top:14px;">Punto 2 (conocido)</h3>
    ${libretaBloqueHTML('el_lib2','Punto 2 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este 2','el_e2',round(EJ_E0+100,2))}${fieldRow('Norte 2','el_n2',EJ_N0)}</div>
    <h3 style="margin-top:14px;">Mediciones desde la estación</h3>
    ${fieldRow('Distancia Estación → 1 (m)','el_d1',50)}
    ${fieldRow('Distancia Estación → 2 (m)','el_d2',67.082)}
    ${angleFieldHTML('el_ang', 116.5651, 'Ángulo en la estación (1 – E – 2)')}
    <div class="field-row"><label for="el_lado">Ubicación de la estación mirando de 1 a 2</label>
      <select id="el_lado"><option value="1" selected>A la derecha (como el programa Casio)</option><option value="-1">A la izquierda</option></select></div>
    <button class="btn" id="btnEL" type="button">Calcular</button>
    <div id="resEL"></div>
  </div>`;
  toolShell('estacionLibre','Estación libre con dos puntos de coordenadas conocidas: a partir de las distancias medidas a ambos puntos y del ángulo entre ellos, obtiene las coordenadas de la estación y controla el cierre del triángulo.', body);
  const metas=[null,null];
  libretaTraerA('el_lib1','el_e1','el_n1', m=>{ metas[0]=m; });
  libretaTraerA('el_lib2','el_e2','el_n2', m=>{ metas[1]=m; });
  document.getElementById('btnEL').addEventListener('click', ()=>{
    const e1=val('el_e1'),n1=val('el_n1'),e2=val('el_e2'),n2=val('el_n2'),d1=val('el_d1'),d2=val('el_d2'),ang=readAngleField('el_ang');
    const lado=parseInt(document.getElementById('el_lado').value,10);
    const box=document.getElementById('resEL');
    const inc = metasIncompatibles(metas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    if([e1,n1,e2,n2,d1,d2,ang].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcEstacionLibre(e1,n1,e2,n2,d1,d2,ang,lado);
    if(!r){ box.innerHTML=`<p class="err-msg">Los puntos 1 y 2 no pueden coincidir.</p>`; return; }
    if(r.error){ box.innerHTML=`<p class="err-msg">${r.error}</p>`; return; }
    const dev = r.desvSuma;
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia 1-2</span><span class="v">${fmtNum(r.dist12,3)} m</span></div>
      <div class="result-row"><span class="k">Azimut 1-2</span><span class="v">${fmtAngle(r.az12)}</span></div>
      <div class="result-row"><span class="k">Norte de la estación</span><span class="v accent big">${fmtNum(r.N,3)}</span></div>
      <div class="result-row"><span class="k">Este de la estación</span><span class="v accent big">${fmtNum(r.E,3)}</span></div>
      <div class="result-row"><span class="k">Suma de ángulos internos</span><span class="v">${fmtAngle(r.suma)}</span></div>
      <div class="result-row"><span class="k">Desviación respecto de 180° (200ᵍ)</span><span class="v">${fmtAngle(dev)}</span></div>
      <div class="result-row"><span class="k">Ángulo en el punto 1</span><span class="v">${fmtAngle(r.J)}</span></div>
      <div class="result-row"><span class="k">Ángulo en el punto 2</span><span class="v">${fmtAngle(r.K)}</span></div>
      <div class="result-row"><span class="k">Control: diferencia de posición desde el punto 2</span><span class="v">${fmtNum(r.ctrl,3)} m</span></div>
      <div class="plot-wrap">${svgEstacionLibre(e1,n1,e2,n2,r,d1,d2,ang)}</div>
    </div>`;
    const btn = document.createElement('button');
    btn.type='button'; btn.className='btn-sm'; btn.style.marginTop='8px';
    btn.textContent='💾 Guardar en la Libreta';
    btn.addEventListener('click', ()=>{ agregarPunto('Estación libre', r.E, r.N, null, '', metas[0]||metas[1]||undefined); btn.textContent='Guardado ✓'; });
    box.appendChild(btn);
  });
}

const RENDERERS = { estacionLibre: renderEstacionLibre };
