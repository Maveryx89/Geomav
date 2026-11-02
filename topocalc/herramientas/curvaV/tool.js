"use strict";
/* Herramienta «Curva Vertical»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCurvaVertical(p1,p2,L){
  const A = Math.abs(p1-p2);
  return {A, K: A!==0 ? L/A : Infinity, e: (A*L)/800, tipo: p2>p1 ? 'En columpio (cóncava)' : 'En cima (convexa)'};
}
function calcCurvaVerticalReplanteo(p1, p2, L, paso, pivProg, pivCota){
  const tienePiv = !isNaN(pivProg) && !isNaN(pivCota);
  const pvcProg = tienePiv ? pivProg - L/2 : 0;
  const pvcCota = tienePiv ? pivCota - (p1/100)*(L/2) : null;
  const rows = [];
  const pushRow = (xi)=>{
    const pendiente = p1 + (p2-p1)*xi/L;
    const correccion = ((p1-p2)/(200*L))*xi*xi;
    const row = { x:xi, prog: pvcProg+xi, pendiente, correccion };
    if(tienePiv) row.cota = (pvcCota + (p1/100)*xi) - correccion;
    rows.push(row);
  };
  let x=0;
  while(x < L-1e-9){ pushRow(x); x+=paso; }
  pushRow(L);
  return {rows, pvcProg, pvcCota, tienePiv};
}
function svgCurvaVertical(p1,p2,L,fracs){
  const K=svgKit(), A=Math.abs(p1-p2), e=A*L/800, kk=A!==0?L/A:Infinity;
  K.list([[{k:'p1',c:'var(--success)',v:`${fmtNum(p1,2)} %`},{k:'p2',c:'var(--danger)',v:`${fmtNum(p2,2)} %`},{k:'L',c:'var(--blueprint)',v:`${fmtNum(L,2)} m`},{k:'A',c:'var(--ink)',v:`${fmtNum(A,3)} %`},{k:'K',c:'var(--ink-soft)',v:isFinite(kk)?fmtNum(kk,2):'∞'},{k:'e',c:'var(--accent)',v:`${fmtNum(e,4)} m`}]]);
  const l=34, r=286, t=K.listBottom+12, b=158, half=L/2, col=p2>p1?1:-1;
  const sx=(r-l)/Math.max(L,1e-6), sv=40/((Math.max(Math.abs(p1),Math.abs(p2),0.3)/100)*half);
  const zP=-p1/100*half, zT=p2/100*half, zM=col*e, zs=[zP,zT,0,(zP+zT)/2+0*zM,col*e];
  const zmin=Math.min(...zs,0), zmax=Math.max(...zs,0), hh=(zmax-zmin)*sv;
  const yc=t+((b-t)-hh)/2;                       // parte alta del dibujo
  const X=x=>l+x*sx, Y=z=>yc+(zmax-z)*sv;
  const zc=x=>zP+p1/100*x-(p1-p2)/(200*L)*x*x;
  const PVC=[X(0),Y(zP)], PIV=[X(half),Y(0)], PVT=[X(L),Y(zT)];
  const cv=[]; for(let i=0;i<=60;i++){ const x=L*i/60; cv.push([X(x),Y(zc(x))]); }
  const CM=[X(half),Y(zc(half))];
  K.line(...PVC,...PIV,'var(--success)',{sw:0.7,dash:'3 2'}); K.line(...PIV,...PVT,'var(--danger)',{sw:0.7,dash:'3 2'});
  K.poly(cv,{stroke:'var(--blueprint)',sw:1.5});
  if(e*sv>2) K.line(...PIV,...CM,'var(--accent)',{sw:1});
  // cota de L
  const dy=b+12; K.line(PVC[0],dy,PVT[0],dy,'var(--blueprint)',{sw:0.7}); K.line(PVC[0],dy-3,PVC[0],dy+3,'var(--blueprint)',{sw:0.6,noObs:false}); K.line(PVT[0],dy-3,PVT[0],dy+3,'var(--blueprint)',{sw:0.6,noObs:false});
  K.line(PVC[0],Math.max(PVC[1],0)+0,PVC[0],dy-3,'var(--ink-soft)',{sw:0.4,dash:'1 2',noObs:true,op:0.6}); K.line(PVT[0],PVT[1],PVT[0],dy-3,'var(--ink-soft)',{sw:0.4,dash:'1 2',noObs:true,op:0.6});
  if(fracs&&fracs.length){ const st=thinLabelStep(fracs.length,8); fracs.forEach((f,i)=>{ const q=cv[Math.round(f*60)]; K.dot(q[0],q[1],'var(--ink-soft)',1.6); if(i%st===0&&i!==0&&i!==fracs.length-1) K.pointLabel(String(i+1),q[0],q[1],3,'var(--ink-soft)',{dir:[0,col>0?1:-1],rmin:3.2,rmax:8}); }); }
  [PVC,PVT].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2)); K.dot(PIV[0],PIV[1],'var(--ink-soft)',2);
  const up=col>0?[0,-1]:[0,1];                    // el PIV queda del lado contrario a la curva
  K.pointLabel('PIV',PIV[0],PIV[1],4.5,'var(--ink-soft)',{dir:col>0?[0,1]:[0,-1],omit:false});
  K.pointLabel('PVC',PVC[0],PVC[1],4.5,'var(--ink-soft)',{dir:[-1,p1>0?0.5:-0.5],omit:false});
  K.pointLabel('PVT',PVT[0],PVT[1],4.5,'var(--ink-soft)',{dir:[1,p2>0?-0.5:0.5],omit:false});
  const mid=(a,b2)=>[(a[0]+b2[0])/2,(a[1]+b2[1])/2], awayC=(a,b2)=>{ const m=mid(a,b2); return [col>0?-0.2:0.2, col>0?1:-1]; };
  K.lineLabel(...PVC,...PIV,'p1',4.5,'var(--success)',{out:[0,col>0?1:-1],extras:[0,3,6]});
  K.lineLabel(...PIV,...PVT,'p2',4.5,'var(--danger)',{out:[0,col>0?1:-1],extras:[0,3,6]});
  if(e*sv>5) K.lineLabel(...PIV,...CM,'e',4.5,'var(--accent)',{out:[1,0],extras:[0,3]});
  K.lineLabel(PVC[0],dy,PVT[0],dy,'L',4.5,'var(--blueprint)',{out:[0,1],extras:[0,3]});
  return K.svg();
}
function renderCurvaV(){
  const body = `<div class="field-card">
    <h3>Datos de la curva</h3>
    ${fieldRow('Pendiente de entrada p1 (%)','cv_p1',-3.5)}
    ${fieldRow('Pendiente de salida p2 (%)','cv_p2',2.8)}
    ${fieldRow('Longitud de curva L (m)','cv_l',80)}
    <h3 style="margin-top:14px;">Replanteo (opcional)</h3>
    ${fieldRow('Progresiva del PIV (m)','cv_pivProg','')}
    ${fieldRow('Cota del PIV (m)','cv_pivCota','')}
    ${fieldRow('Paso de replanteo (m)','cv_paso',10)}
    <button class="btn" id="btnCV" type="button">Calcular</button>
    <div id="resCV"></div>
  </div>`;
  toolShell('curvaV','Parámetro K y corrección vertical en el PIV de una curva vertical parabólica simétrica. Si además ingresas el paso de replanteo, genera la tabla de cotas cada cierto avance a lo largo de la curva (con cota real si conoces la progresiva y cota del PIV).', body, ['p1','p2','L','K','A','PIV','PVC','PVT']);
  document.getElementById('btnCV').addEventListener('click', ()=>{
    const p1=val('cv_p1'), p2=val('cv_p2'), L=val('cv_l');
    const box=document.getElementById('resCV');
    if(isNaN(p1)||isNaN(p2)||isNaN(L)){ box.innerHTML=`<p class="err-msg">Completa pendientes y longitud.</p>`; return; }
    const r = calcCurvaVertical(p1,p2,L);

    const paso = val('cv_paso');
    const pivProg = val('cv_pivProg'), pivCota = val('cv_pivCota');
    let tablaHtml = '', fracs = null;
    if(!isNaN(paso) && paso>0){
      const {rows, pvcProg, pvcCota, tienePiv} = calcCurvaVerticalReplanteo(p1,p2,L,paso,pivProg,pivCota);
      fracs = rows.map(row=>row.x/L);
      const encabezadoExtra = tienePiv ? '<th>Progresiva</th><th>Cota</th>' : '<th>Distancia desde PVC</th>';
      const trs = rows.map(row=>{
        const cols = tienePiv
          ? `<td>${fmtNum(row.prog,2)}</td><td>${fmtNum(row.cota,3)}</td>`
          : `<td>${fmtNum(row.x,2)}</td>`;
        return `<tr>${cols}<td>${fmtNum(row.pendiente,3)}</td><td>${fmtNum(row.correccion,4)}</td></tr>`;
      }).join('');
      const pvcInfo = tienePiv
        ? `<div class="result-row"><span class="k">Progresiva / cota del PVC</span><span class="v">${fmtNum(pvcProg,2)} / ${fmtNum(pvcCota,3)}</span></div>`
        : '';
      tablaHtml = `${pvcInfo}
      <div class="section-label" style="margin-top:10px;">Replanteo cada ${fmtNum(paso,2)} m</div>
      <div class="table-wrap"><table class="data-table"><thead><tr>${encabezadoExtra}<th>Pendiente inst. (%)</th><th>Corrección (m)</th></tr></thead><tbody>${trs}</tbody></table></div>`;
    }

    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Tipo de curva</span><span class="v">${r.tipo}</span></div>
      <div class="result-row"><span class="k">Diferencia algebraica (A)</span><span class="v">${fmtNum(r.A,3)} %</span></div>
      <div class="result-row"><span class="k">Parámetro K</span><span class="v">${fmtNum(r.K,2)}</span></div>
      <div class="result-row"><span class="k">Corrección en el PIV</span><span class="v accent big">${fmtNum(r.e,4)} m</span></div>
      <div class="plot-wrap">${svgCurvaVertical(p1,p2,L,fracs)}</div>
      ${tablaHtml}
    </div>`;
  });
}

const RENDERERS = { curvaV: renderCurvaV };
