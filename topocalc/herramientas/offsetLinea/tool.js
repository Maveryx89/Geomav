"use strict";
/* Herramienta «Offset de una Línea Base»: coordenadas de puntos definidos por su kilómetro (distancia medida
   desde el punto 1 sobre la línea) y su offset (distancia perpendicular: izquierda −, derecha +).
   Mismos datos de entrada y de salida que el programa OFFSET de la calculadora Casio fx-9860GII
   (más la distancia y el azimut al punto desde la estación, que es lo que se usa para replantear).
   Ángulos en grados decimales. Offset: negativo a la izquierda, positivo a la derecha mirando de 1 a 2. */
let ofN = 3;

/* Devuelve null si los puntos 1 y 2 coinciden. Si se indican las coordenadas de la estación (eS,nS)
   entrega además el azimut y la distancia de la estación al punto. A diferencia del programa Casio,
   el kilómetro puede ser negativo (antes del punto 1) o mayor que la longitud de la línea. */
function calcOffsetLinea(e1,n1,e2,n2,km,off,eS,nS){
  const de=e2-e1, dn=n2-n1, L=Math.hypot(de,dn);
  if(!(L>1e-9)) return null;
  const ue=de/L, un=dn/L;
  const fe=e1+km*ue, fn=n1+km*un;                 // pie del offset sobre la línea
  const E=fe+off*un, N=fn-off*ue;                 // derecha de la línea = (un, −ue)
  const r={dist:L, az:normDeg(toDeg(Math.atan2(de,dn))), E, N, fe, fn};
  if(Number.isFinite(eS) && Number.isFinite(nS)){
    r.azPto=normDeg(toDeg(Math.atan2(E-eS,N-nS)));
    r.distPto=Math.hypot(E-eS,N-nS);
  }
  return r;
}

function svgOffsetLinea(e1,n1,e2,n2,eS,nS,pts,res){
  const K=svgKit(), eng=K.eng, f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const hayS=Number.isFinite(eS)&&Number.isFinite(nS), n=pts.length;
  K.north();
  const filas=pts.slice(0,9).map((p,i)=>({k:'P'+(i+1),c:CP,v:`Km ${fmtNum(p.km,2)} · Of ${p.off>0?'+':''}${fmtNum(p.off,2)}`}));
  K.list([[{k:'Dist. línea',c:CD,v:`${fmtNum(res.dist,3)} m`},{k:'Az. línea',c:CD,v:fmtAngle(res.az)}], filas]);
  const top=Math.max(44,K.listBottom+12);
  const all=[[e1,n1],[e2,n2]]; if(hayS) all.push([eS,nS]);
  res.pts.forEach(q=>{ all.push([q.E,q.N]); all.push([q.fe,q.fn]); });
  const fit=K.fit(all,{l:70,r:262,t:top,b:168});
  const A={x:fit.X(e1),y:fit.Y(n1)}, B={x:fit.X(e2),y:fit.Y(n2)};
  // prolongación tenue de la línea base por ambos lados (la ve el que replantea más allá de los extremos)
  const ux=(B.x-A.x), uy=(B.y-A.y), ul=Math.hypot(ux,uy)||1;
  const ext=10; K.line(A.x-ux/ul*ext,A.y-uy/ul*ext,A.x,A.y,CD,{dash:'2 1.6',op:0.45});
  K.line(B.x,B.y,B.x+ux/ul*ext,B.y+uy/ul*ext,CD,{dash:'2 1.6',op:0.45});
  K.line(A.x,A.y,B.x,B.y,CD);
  const S = hayS ? {x:fit.X(eS),y:fit.Y(nS)} : null;
  const P = res.pts.map(q=>({x:fit.X(q.E),y:fit.Y(q.N),fx:fit.X(q.fe),fy:fit.Y(q.fn)}));
  P.forEach(q=>{ if(Math.hypot(q.x-q.fx,q.y-q.fy)>0.4) K.line(q.fx,q.fy,q.x,q.y,CP,{dash:'2 1.6'}); });
  if(S && n<=6) P.forEach(q=>K.line(S.x,S.y,q.x,q.y,CZ,{sw:0.6,op:0.5}));
  K.dot(A.x,A.y,CS,2); K.dot(B.x,B.y,CS,2);
  if(S) K.dot(S.x,S.y,CK,2.7);
  P.forEach(q=>K.dot(q.x,q.y,CP,2));
  // rótulos
  const mid={x:(A.x+B.x)/2,y:(A.y+B.y)/2};
  K.pointLabel('1',A.x,A.y,4.5,CS,{dir:[-ux/ul,-uy/ul]});
  K.pointLabel('2',B.x,B.y,4.5,CS,{dir:[ux/ul,uy/ul]});
  if(S) K.pointLabel('Est.',S.x,S.y,4.5,CK,{full:true});
  P.forEach((q,i)=>{ K.pointLabel('P'+(i+1),q.x,q.y,4.5,CP,{dir:[q.x-q.fx||0,q.y-q.fy||-1],full:false}); });
  K.lineLabel(A.x,A.y,B.x,B.y,`D = ${fmtNum(res.dist,2)} m`,4,CD,{out:[0,1]});
  if(n<=4) P.forEach((q,i)=>{ const d=Math.hypot(q.x-q.fx,q.y-q.fy); if(d>10) K.lineLabel(q.fx,q.fy,q.x,q.y,`${fmtNum(Math.abs(pts[i].off),2)}`,3.6,CP,{}); });
  return K.svg();
}

function renderOffsetLinea(){
  const body = `<div class="field-card">
    <h3>Estación (opcional)</h3>
    ${libretaBloqueHTML('of_libS','Estación desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este estación','of_eS',round(EJ_E0+20,2))}${fieldRow('Norte estación','of_nS',round(EJ_N0-30,2))}</div>
    <p class="tool-blurb" style="margin:0;">Si la dejas en blanco solo se calculan las coordenadas de los puntos.</p>
    <h3 style="margin-top:14px;">Línea base</h3>
    ${libretaBloqueHTML('of_lib1','Punto 1 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este 1','of_e1',EJ_E0)}${fieldRow('Norte 1','of_n1',EJ_N0)}</div>
    ${libretaBloqueHTML('of_lib2','Punto 2 desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este 2','of_e2',round(EJ_E0+80,2))}${fieldRow('Norte 2','of_n2',round(EJ_N0+60,2))}</div>
  </div>
  <div class="field-row"><label>Número de puntos a calcular</label>
    <div class="n-stepper"><button type="button" id="ofMinus">−</button><span class="n-val" id="ofNVal">${ofN}</span><button type="button" id="ofPlus">+</button></div>
  </div>
  <div id="ofPoints"></div>
  <button class="btn" id="btnOF" type="button">Calcular</button>
  <div id="resOF"></div>`;
  toolShell('offsetLinea','Coordenadas de puntos referidos a una línea base: kilómetro (distancia desde el punto 1 a lo largo de la línea) y offset (distancia perpendicular, izquierda − / derecha +). Entrega Este/Norte y el azimut y la distancia desde la estación para replantear.', body);
  const metas=[null,null,null];
  libretaTraerA('of_libS','of_eS','of_nS', m=>{ metas[0]=m; });
  libretaTraerA('of_lib1','of_e1','of_n1', m=>{ metas[1]=m; });
  libretaTraerA('of_lib2','of_e2','of_n2', m=>{ metas[2]=m; });
  const defK=[20,50,80,100,120,140], defO=[5,-8,3,-4,6,-6];
  const draw = ()=>{
    const prev=[]; for(let i=0;i<ofN;i++){ const k=document.getElementById('of_km_'+i), o=document.getElementById('of_of_'+i); prev.push(k?{k:k.value,o:o.value}:null); }
    let html='';
    for(let i=0;i<ofN;i++){
      const pk = prev[i];
      html += `<div class="station-block"><div class="st-label">Punto P${i+1}</div>
        <div class="field-inline2">
          ${fieldRow('Kilómetro (m)','of_km_'+i, pk?pk.k:(defK[i%6]+Math.floor(i/6)*10))}
          ${fieldRow('Offset (m) izq. − / der. +','of_of_'+i, pk?pk.o:defO[i%6])}
        </div></div>`;
    }
    document.getElementById('ofPoints').innerHTML = html;
  };
  draw();
  document.getElementById('ofMinus').addEventListener('click', ()=>{ if(ofN>1){ ofN--; document.getElementById('ofNVal').textContent=ofN; draw(); }});
  document.getElementById('ofPlus').addEventListener('click', ()=>{ if(ofN<20){ ofN++; document.getElementById('ofNVal').textContent=ofN; draw(); }});
  document.getElementById('btnOF').addEventListener('click', ()=>{
    const e1=val('of_e1'),n1=val('of_n1'),e2=val('of_e2'),n2=val('of_n2'), eS=val('of_eS'), nS=val('of_nS');
    const box=document.getElementById('resOF');
    const inc = metasIncompatibles(metas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    if([e1,n1,e2,n2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las coordenadas de la línea base.</p>`; return; }
    if(isNaN(eS)!==isNaN(nS)){ box.innerHTML=`<p class="err-msg">Completa Este y Norte de la estación, o deja ambos en blanco.</p>`; return; }
    const pts=[], out=[];
    for(let i=0;i<ofN;i++){
      const km=val('of_km_'+i), off=val('of_of_'+i);
      if(isNaN(km)||isNaN(off)){ box.innerHTML=`<p class="err-msg">Completa kilómetro y offset de todos los puntos.</p>`; return; }
      const r=calcOffsetLinea(e1,n1,e2,n2,km,off,eS,nS);
      if(!r){ box.innerHTML=`<p class="err-msg">Los puntos 1 y 2 de la línea base no pueden coincidir.</p>`; return; }
      pts.push({km,off}); out.push(r);
    }
    const base=out[0], hayS=Number.isFinite(eS)&&Number.isFinite(nS);
    let trs='';
    out.forEach((r,i)=>{ trs += `<tr><td>P${i+1}</td><td>${fmtNum(pts[i].km,3)}</td><td>${fmtNum(pts[i].off,3)}</td><td>${fmtNum(r.E,3)}</td><td>${fmtNum(r.N,3)}</td>${hayS?`<td>${fmtAngle(r.azPto)}</td><td>${fmtNum(r.distPto,3)}</td>`:''}</tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia de la línea</span><span class="v">${fmtNum(base.dist,3)} m</span></div>
      <div class="result-row"><span class="k">Azimut de la línea</span><span class="v">${fmtAngle(base.az)}</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Punto</th><th>Km</th><th>Offset</th><th>Este</th><th>Norte</th>${hayS?'<th>Az. est.</th><th>Dist. est.</th>':''}</tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgOffsetLinea(e1,n1,e2,n2,eS,nS,pts,Object.assign({pts:out},base))}</div>
    </div>`;
    const csv=['nombre,este,norte,cota']; out.forEach((r,i)=>csv.push(`P${i+1},${r.E},${r.N},`));
    addCSVButton(box,'offset-linea.csv',csv.join('\n'));
    const btn=document.createElement('button');
    btn.type='button'; btn.className='btn-sm'; btn.style.marginTop='8px'; btn.style.marginLeft='8px';
    btn.textContent='💾 Guardar puntos en la Libreta';
    btn.addEventListener('click', ()=>{
      const g='Offset '+fechaCorta();
      out.forEach((r,i)=>agregarPunto(`P${i+1}`, r.E, r.N, null, '', Object.assign({}, metas[1]||metas[2]||{}, {grupo:g})));
      btn.textContent=`Guardado (${out.length} puntos) ✓`;
    });
    box.appendChild(btn);
  });
}

const RENDERERS = { offsetLinea: renderOffsetLinea };
