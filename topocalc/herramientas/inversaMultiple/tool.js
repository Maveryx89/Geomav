"use strict";
/* Herramienta «Inversa Múltiple»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function svgInversaMultiple(pts, tramos){
  const K=svgKit(), n=pts.length, many=tramos.length>8, f=K.f;
  const total=tramos.reduce((s,t)=>s+t.dist,0);
  K.north();
  const rows=[{k:'Total',c:'var(--accent)',v:`${fmtNum(total,3)} m`}];
  if(!many) tramos.forEach((t,i)=>rows.push({k:`${POL_LABELS[i]}→${POL_LABELS[i+1]}`,c:'var(--accent)',v:`${fmtNum(t.dist,3)} m`}));
  K.list([rows]);
  const fit=K.fit(pts.map(p=>[p.e,p.n]),{l:22,r:288,t:Math.max(22,K.listBottom+7),b:176});
  const Q=pts.map(p=>[fit.X(p.e),fit.Y(p.n)]);
  K.poly(Q,{stroke:'var(--accent)',sw:0.9});
  Q.forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  // letras de los puntos: hacia afuera de la quebrada
  const unit=(a,b)=>{const dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy); return l>1e-6?[dx/l,dy/l]:null;};
  Q.forEach((q,i)=>{
    const v1=i>0?unit(q,Q[i-1]):null, v2=i<n-1?unit(q,Q[i+1]):null;
    let d=null;
    if(v1&&v2){ const s=[v1[0]+v2[0],v1[1]+v2[1]], l=Math.hypot(...s); d=l>0.3?[-s[0]/l,-s[1]/l]:[-v1[1],v1[0]]; }
    else if(v1) d=[-v1[0],-v1[1]]; else if(v2) d=[-v2[0],-v2[1]];
    K.pointLabel(POL_LABELS[i],q[0],q[1],4.5,'var(--ink-soft)',{dir:d||undefined,full:!d||(v1&&v2),omit:false});
  });
  // distancia de cada tramo, a lo largo de él (lado exterior del giro si lo hay)
  tramos.forEach((t,i)=>{
    const a=Q[i], b=Q[i+1]; if(Math.hypot(b[0]-a[0],b[1]-a[1])<6) return;
    K.lineLabel(a[0],a[1],b[0],b[1],many?fmtNum(t.dist,2):`${fmtNum(t.dist,2)} m`,3,'var(--accent)',{extras:[0,3,6]});
  });
  return K.svg();
}
let invN = 4;
function renderInversaMultiple(){
  const body = `<div class="field-row">
    <label>Número de puntos</label>
    <div class="n-stepper"><button type="button" id="invMinus">−</button><span class="n-val" id="invNVal">${invN}</span><button type="button" id="invPlus">+</button></div>
  </div>
  ${grupoSelectHTML('inv_grupo', 2)}
  <div id="invPoints"></div>
  <button class="btn" id="btnINV" type="button">Calcular Inversa Múltiple</button>
  <div id="resINV"></div>`;
  toolShell('inversaMultiple','Cálculo inverso (distancia y azimut) entre cada par consecutivo de una serie de puntos de coordenadas conocidas — útil para verificar un recorrido o itinerario completo de una sola vez.', body);
  const draw = ()=>{
    let html='';
    for(let i=0;i<invN;i++){
      html += `<div class="station-block">
        <div class="st-label">Punto ${POL_LABELS[i]} <small id="inv_tag_${i}" style="color:var(--ink-soft);font-weight:400;"></small></div>
        ${libretaCompactoHTML(`inv_lib_${i}`)}
        <div class="field-inline2">
          ${fieldRow('Este',`inv_e_${i}`, round(EJ_E0+i*45,2))}
          ${fieldRow('Norte',`inv_n_${i}`, round(EJ_N0+(i%2===0?i*30:-i*20),2))}
        </div>
      </div>`;
    }
    document.getElementById('invPoints').innerHTML = html;
    invMetas = new Array(invN).fill(null);
    for(let i=0;i<invN;i++) libretaTraerA(`inv_lib_${i}`, `inv_e_${i}`, `inv_n_${i}`, m=>{ invMetas[i]=m; }, `inv_tag_${i}`);
  };
  let invMetas = [];
  draw();
  document.getElementById('invMinus').addEventListener('click', ()=>{ if(invN>2){invN--; document.getElementById('invNVal').textContent=invN; draw();}});
  document.getElementById('invPlus').addEventListener('click', ()=>{ if(invN<20){invN++; document.getElementById('invNVal').textContent=invN; draw();}});
  const invG = document.getElementById('inv_grupo');
  if(invG) invG.addEventListener('change', ()=>{
    const g = invG.value; invG.value=''; if(!g) return;
    const todos = gruposLibreta().get(g)||[], pts = todos.slice(0,20);
    invN = pts.length; document.getElementById('invNVal').textContent = invN; draw();
    rellenarDesdePuntos(pts, 'inv', invMetas);
    const msg = document.getElementById('inv_grupo_msg');
    if(msg){ msg.textContent = `Cargado el grupo «${g}»: ${pts.length} puntos` + (todos.length>20 ? ` (de ${todos.length}; la herramienta admite hasta 20)` : '') + '.'; msg.style.margin='0 0 8px'; }
  });
  document.getElementById('btnINV').addEventListener('click', ()=>{
    const box=document.getElementById('resINV');
    const pts=[];
    for(let i=0;i<invN;i++) pts.push({e:val(`inv_e_${i}`), n:val(`inv_n_${i}`)});
    if(pts.some(p=>isNaN(p.e)||isNaN(p.n))){ box.innerHTML=`<p class="err-msg">Completa todas las coordenadas.</p>`; return; }
    const inc = metasIncompatibles(invMetas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    let trs='', total=0, tramos=[];
    for(let i=0;i<pts.length-1;i++){
      const r = calcRumboDistancia(pts[i].e,pts[i].n,pts[i+1].e,pts[i+1].n);
      total += r.dist;
      tramos.push(r);
      trs += `<tr><td>${POL_LABELS[i]} → ${POL_LABELS[i+1]}</td><td>${fmtAngle(r.az)}</td><td>${r.rumbo.ns} ${fmtAngle(r.rumbo.ang)} ${r.rumbo.ew}</td><td>${fmtNum(r.dist,3)}</td></tr>`;
    }
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Distancia total del recorrido</span><span class="v accent big">${fmtNum(total,3)} m</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Tramo</th><th>Azimut</th><th>Rumbo</th><th>Distancia</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgInversaMultiple(pts, tramos)}</div>
    </div>`;
    const csvRows = ['nombre,este,norte,cota'];
    pts.forEach((p,i)=> csvRows.push(`${POL_LABELS[i]},${p.e},${p.n},`));
    addCSVButton(box, 'inversa_multiple.csv', csvRows.join('\n'));
  });
}

const RENDERERS = { inversaMultiple: renderInversaMultiple };
