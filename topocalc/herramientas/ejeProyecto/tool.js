"use strict";
/* Herramienta «Eje de Proyecto Vial por Progresiva»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcVerticesEje(v0, tramos){
  const verts=[{...v0}];
  let cur={...v0};
  for(const t of tramos){
    const {E,N} = calcRadiacionPunto(cur.X,cur.Y,t.azDeg,t.long);
    cur = {km: cur.km+t.long, X:E, Y:N};
    verts.push(cur);
  }
  return verts;
}
function calcEstacaEnTramo(vIni, azDeg, km_estaca){
  const d = km_estaca - vIni.km;
  const {E,N} = calcRadiacionPunto(vIni.X,vIni.Y,azDeg,d);
  return {X:E,Y:N};
}
function svgEjePolilinea(verts, estaca, fuente){
  const K=svgKit(), n=verts.length-1, few=n<=8;
  K.north();
  const seg=i=>{ const dx=verts[i+1].X-verts[i].X, dy=verts[i+1].Y-verts[i].Y; return {L:Math.hypot(dx,dy), az:((Math.atan2(dx,dy)*180/Math.PI)%360+360)%360}; };
  const S=[]; for(let i=0;i<n;i++) S.push(seg(i));
  const tot=verts[n].km-verts[0].km;
  const b1=[{k:'Largo total',c:'var(--blueprint)',v:`${fmtNum(tot,2)} m`},{k:'Km inicial',c:'var(--ink)',v:`${fmtNum(verts[0].km,2)} m`},{k:'Km final',c:'var(--ink)',v:`${fmtNum(verts[n].km,2)} m`}];
  if(estaca&&estaca.km!==undefined) b1.push({k:'Estaca',c:'var(--accent)',v:`${fmtNum(estaca.km,2)} m`});
  const blocks=[b1];
  if(few){ blocks.push(S.map((s,i)=>({k:'L'+(i+1),c:'var(--blueprint)',v:`${fmtNum(s.L,2)} m`}))); blocks.push(S.map((s,i)=>({k:'Az'+(i+1),c:'var(--success)',v:fmtAngle(s.az)}))); }
  K.list(blocks,{gap:9});
  const box={l:28,r:272,t:Math.max(44,K.listBottom+8),b:fuente?158:172};
  const pts=verts.map(v=>[v.X,v.Y]); if(estaca) pts.push([estaca.X,estaca.Y]);
  const fit=K.fit(pts,box), P=verts.map(v=>[fit.X(v.X),fit.Y(v.Y)]), E=estaca?[fit.X(estaca.X),fit.Y(estaca.Y)]:null;
  K.poly(P,{stroke:'var(--blueprint)',sw:1.3});
  P.forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  if(E) K.dot(E[0],E[1],'var(--accent)',2.6);
  // letras de vértices hacia el exterior del giro
  const st=thinLabelStep(n+1,12), unit=(a,b)=>{ const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1; return [(b[0]-a[0])/l,(b[1]-a[1])/l]; };
  P.forEach((q,i)=>{ if(i%st!==0&&i!==n) return; let d;
    if(i===0) d=[-unit(q,P[1])[0],-unit(q,P[1])[1]]; else if(i===n) d=unit(P[n-1],q);
    else { const a=unit(P[i-1],q), b=unit(q,P[i]); d=[a[0]-b[0],a[1]-b[1]]; const l=Math.hypot(...d); d=l<0.3?[-a[1],a[0]]:[d[0]/l,d[1]/l]; }
    K.pointLabel('V'+i,q[0],q[1],4.5,'var(--ink-soft)',{dir:d,full:false}); });
  // rótulos de tramo
  for(let i=0;i<n;i++){ const a=P[i], b=P[i+1];
    if(few){ K.lineLabel(...a,...b,'L'+(i+1),3.6,'var(--blueprint)',{out:[0,-1]}); K.lineLabel(...a,...b,'Az'+(i+1),3.6,'var(--success)',{out:[0,1]}); }
    else if(n<=14) K.lineLabel(...a,...b,fmtNum(S[i].L,1),3,'var(--blueprint)',{out:[0,-1]}); }
  if(E){ const lbl=estaca.km!==undefined?`Km ${fmtNum(estaca.km,2)}`:'Estaca'; K.pointLabel(lbl,E[0],E[1],3.6,'var(--accent)',{rmin:5,rmax:16}); }
  if(fuente) K.add(svgFuente(fuente,320,190));
  return K.svg();
}
let ejeN = 2;
let ejeVertsCache = [], ejeTramosCache = [];
function renderEjeProyecto(){
  const body = `<div class="field-card">
    <h3>Punto de partida del eje</h3>
    <div class="field-inline2">
      ${fieldRow('Progresiva inicial (m)','ej_km0',0)}
      ${fieldRow('Coordenada Este inicial','ej_x0',5000)}
    </div>
    ${fieldRow('Coordenada Norte inicial','ej_y0',10000)}
  </div>
  <div class="field-row"><label>Número de tramos (rectos, entre vértices)</label>
    <div class="n-stepper"><button type="button" id="ejMinus">−</button><span class="n-val" id="ejNVal">${ejeN}</span><button type="button" id="ejPlus">+</button></div>
  </div>
  <div id="ejTramos"></div>
  <button class="btn" id="btnEJ" type="button">Calcular Vértices del Eje</button>
  <div id="resEJ"></div>
  <div class="field-card" style="margin-top:14px;">
    <h3>Buscar estaca a una progresiva</h3>
    <p class="tool-blurb" style="margin-top:0;">Primero calcula los vértices del eje arriba; luego ingresa una progresiva dentro de alguno de los tramos.</p>
    ${fieldRow('Progresiva de la estaca (m)','ej_kmBuscar',0)}
    <button class="btn" id="btnEJEst" type="button">Buscar Estaca</button>
    <div id="resEJEst"></div>
  </div>`;
  toolShell('ejeProyecto','Traza el eje de un proyecto vial como una serie de tramos rectos encadenados por azimut y longitud (progresiva), obteniendo las coordenadas de cada vértice — y permite ubicar la estaca correspondiente a cualquier progresiva intermedia.', body);
  const draw = ()=>{
    let html='';
    for(let i=0;i<ejeN;i++){
      html += `<div class="station-block">
        <div class="st-label">Tramo ${i+1}</div>
        ${angleFieldHTML(`ej_az_${i}`, 30+i*20, 'Azimut')}
        <div class="field-row"><label>Longitud (m)</label><input type="number" step="any" id="ej_l_${i}" value="${100+i*50}"></div>
      </div>`;
    }
    document.getElementById('ejTramos').innerHTML = html;
  };
  draw();
  document.getElementById('ejMinus').addEventListener('click', ()=>{ if(ejeN>1){ejeN--; document.getElementById('ejNVal').textContent=ejeN; draw();}});
  document.getElementById('ejPlus').addEventListener('click', ()=>{ if(ejeN<20){ejeN++; document.getElementById('ejNVal').textContent=ejeN; draw();}});
  document.getElementById('btnEJ').addEventListener('click', ()=>{
    const km0=val('ej_km0'), x0=val('ej_x0'), y0=val('ej_y0');
    const box=document.getElementById('resEJ');
    if([km0,x0,y0].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa el punto de partida.</p>`; return; }
    const tramos=[];
    for(let i=0;i<ejeN;i++){
      const az=readAngleField(`ej_az_${i}`), l=val(`ej_l_${i}`);
      if(isNaN(az)||isNaN(l)||l<=0){ box.innerHTML=`<p class="err-msg">Completa azimut y longitud (mayor a 0) de todos los tramos.</p>`; return; }
      tramos.push({azDeg:az, long:l});
    }
    const verts = calcVerticesEje({km:km0,X:x0,Y:y0}, tramos);
    ejeVertsCache = verts; ejeTramosCache = tramos;
    let trs=''; verts.forEach((v,i)=>{ trs += `<tr><td>V${i}</td><td>${fmtNum(v.km,3)}</td><td>${fmtNum(v.X,3)}</td><td>${fmtNum(v.Y,3)}</td></tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Vértice</th><th>Progresiva (m)</th><th>Este</th><th>Norte</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgEjePolilinea(verts, null, "complemento — extiende la progresiva de 'curva'/'clotoide' a tramos rectos")}</div>
    </div>`;
    addCSVButton(box, 'eje_proyecto.csv', 'vertice,progresiva,este,norte\n'+verts.map((v,i)=>`V${i},${v.km},${v.X},${v.Y}`).join('\n'));
  });
  document.getElementById('btnEJEst').addEventListener('click', ()=>{
    const km = val('ej_kmBuscar');
    const box=document.getElementById('resEJEst');
    if(isNaN(km)){ box.innerHTML=`<p class="err-msg">Ingresa una progresiva.</p>`; return; }
    if(!ejeVertsCache.length){ box.innerHTML=`<p class="err-msg">Primero calcula los vértices del eje.</p>`; return; }
    let i=-1;
    for(let k=0;k<ejeTramosCache.length;k++){ if(km>=ejeVertsCache[k].km && km<=ejeVertsCache[k+1].km){ i=k; break; } }
    if(i===-1){ box.innerHTML=`<p class="err-msg">Esa progresiva está fuera del rango del eje calculado (${fmtNum(ejeVertsCache[0].km,3)} a ${fmtNum(ejeVertsCache[ejeVertsCache.length-1].km,3)} m).</p>`; return; }
    const r = calcEstacaEnTramo(ejeVertsCache[i], ejeTramosCache[i].azDeg, km);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Tramo</span><span class="v">${i+1}</span></div>
      <div class="result-row"><span class="k">Coordenadas de la estaca (E, N)</span><span class="v accent big">${fmtNum(r.X,3)}, ${fmtNum(r.Y,3)}</span></div>
      <div class="plot-wrap">${svgEjePolilinea(ejeVertsCache, {X:r.X,Y:r.Y,km:km})}</div>
    </div>`;
    const btnGuardar = document.createElement('button');
    btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px';
    btnGuardar.textContent='💾 Guardar en la Libreta';
    btnGuardar.addEventListener('click', ()=>{ agregarPunto('Km '+fmtNum(km,3), r.X, r.Y, null); btnGuardar.textContent='Guardado ✓'; });
    box.appendChild(btnGuardar);
  });
}

const RENDERERS = { ejeProyecto: renderEjeProyecto };
