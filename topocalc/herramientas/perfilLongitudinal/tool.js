"use strict";
/* Herramienta «Perfil Longitudinal»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcPerfilLongitudinal(puntos){
  const tramos=[];
  for(let i=1;i<puntos.length;i++){
    const dd = puntos[i].d-puntos[i-1].d;
    const dh = puntos[i].cota-puntos[i-1].cota;
    tramos.push({d1:puntos[i-1].d, d2:puntos[i].d, cota1:puntos[i-1].cota, cota2:puntos[i].cota,
      pendPct: dd!==0 ? (dh/dd)*100 : NaN});
  }
  return tramos;
}
function svgPerfilLongitudinal(puntos){
  const K=svgKit(), n=puntos.length, nt=n-1, few=nt<=8, acc='var(--accent)';
  if(n<2) return '';
  const pend=i=>{ const dd=puntos[i+1].d-puntos[i].d; return dd!==0?(puntos[i+1].cota-puntos[i].cota)/dd*100:NaN; };
  const L=puntos[n-1].d-puntos[0].d, dz=puntos[n-1].cota-puntos[0].cota;
  const rows=[{k:'Largo',c:'var(--ink)',v:`${fmtNum(L,2)} m`},{k:'Desnivel',c:'var(--ink)',v:`${fmtNum(dz,3)} m`},{k:'Pend. media',c:'var(--ink-soft)',v:L!==0?`${fmtNum(dz/L*100,2)} %`:'—'}];
  const blocks=[rows];
  if(few) blocks.push(Array.from({length:nt},(_,i)=>({k:'p'+(i+1),c:acc,v:isNaN(pend(i))?'—':`${fmtNum(pend(i),2)} %`})));
  K.list(blocks,{gap:12});
  const ds=puntos.map(p=>p.d), cs=puntos.map(p=>p.cota), d0=Math.min(...ds), d1=Math.max(...ds), c0=Math.min(...cs), c1=Math.max(...cs);
  const box={l:24,r:300,t:Math.max(48,K.listBottom+12),b:158}, datum=168;
  const X=d=>box.l+(d-d0)/Math.max(d1-d0,1e-9)*(box.r-box.l), Y=c=>box.b-(c-c0)/Math.max(c1-c0,1e-9)*(box.b-box.t);
  const Q=puntos.map(p=>[X(p.d),Y(p.cota)]);
  K.line(box.l-8,datum,box.r+8,datum,'var(--ink-soft)',{sw:0.7});
  if(n<=14) Q.forEach(q=>K.line(q[0],q[1],q[0],datum,'var(--ink-soft)',{sw:0.5,dash:'1.4 1.8',noObs:false}));
  K.poly(Q,{stroke:'var(--blueprint)',sw:1.3});
  Q.forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  const st=thinLabelStep(n,12);
  for(let i=0;i<nt;i++){ const a=Q[i], b=Q[i+1]; if(Math.hypot(b[0]-a[0],b[1]-a[1])<6) continue;
    if(few) K.lineLabel(...a,...b,'p'+(i+1),4.5,acc,{out:[0,-1],extras:[0,3,6]});
    else if(nt<=16&&!isNaN(pend(i))) K.lineLabel(...a,...b,fmtNum(pend(i),1)+'%',3,acc,{out:[0,-1],extras:[0,3]}); }
  Q.forEach((q,i)=>{ if(i%st!==0&&i!==n-1) return; K.pointLabel('P'+(i+1),q[0],q[1],4.5,'var(--ink-soft)',{dir:[0,-1],omit:false,rmin:3.6,rmax:12}); });
  return K.svg();
}
let perfN = 5;
function renderPerfilLongitudinal(){
  const body = `<div class="field-row"><label>Número de puntos</label>
    <div class="n-stepper"><button type="button" id="pfMinus">−</button><span class="n-val" id="pfNVal">${perfN}</span><button type="button" id="pfPlus">+</button></div>
  </div>
  <div id="pfPoints"></div>
  <button class="btn" id="btnPF" type="button">Generar Perfil</button>
  <div id="resPF"></div>`;
  toolShell('perfilLongitudinal','Perfil longitudinal de un eje (camino, canal, línea) a partir de una serie de puntos con distancia acumulada y cota — calcula la pendiente de cada tramo.', body);
  const draw = ()=>{
    let html='';
    for(let i=0;i<perfN;i++){
      html += `<div class="station-block">
        <div class="st-label">Punto ${i+1}</div>
        <div class="field-inline2">
          ${fieldRow('Distancia acumulada (m)',`pf_d_${i}`, i*20)}
          ${fieldRow('Cota (m)',`pf_c_${i}`, round(100+i*1.5,2))}
        </div>
      </div>`;
    }
    document.getElementById('pfPoints').innerHTML = html;
  };
  draw();
  document.getElementById('pfMinus').addEventListener('click', ()=>{ if(perfN>2){perfN--; document.getElementById('pfNVal').textContent=perfN; draw();}});
  document.getElementById('pfPlus').addEventListener('click', ()=>{ if(perfN<30){perfN++; document.getElementById('pfNVal').textContent=perfN; draw();}});
  document.getElementById('btnPF').addEventListener('click', ()=>{
    const box=document.getElementById('resPF');
    const puntos=[];
    for(let i=0;i<perfN;i++){
      const d=val(`pf_d_${i}`), c=val(`pf_c_${i}`);
      if(isNaN(d)||isNaN(c)){ box.innerHTML=`<p class="err-msg">Completa todos los puntos.</p>`; return; }
      puntos.push({d,cota:c});
    }
    const tramos = calcPerfilLongitudinal(puntos);
    let trs='';
    tramos.forEach((t,i)=>{ trs += `<tr><td>${i+1}</td><td>${fmtNum(t.d1,1)}–${fmtNum(t.d2,1)}</td><td>${fmtNum(t.cota2-t.cota1,3)}</td><td>${fmtNum(t.pendPct,2)}%</td></tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Tramo</th><th>Distancia</th><th>Desnivel</th><th>Pendiente</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgPerfilLongitudinal(puntos)}</div>
    </div>`;
  });
}

const RENDERERS = { perfilLongitudinal: renderPerfilLongitudinal };
