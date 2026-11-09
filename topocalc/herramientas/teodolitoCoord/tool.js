"use strict";
/* Herramienta «Coordenadas con Teodolito»: Este, Norte y Cota de puntos a partir de una estación de coordenadas
   conocidas, con el azimut, el ángulo vertical (cenital) y la distancia inclinada de cada visual.
   Mismos datos de entrada y de salida que el programa TEODOLIT de la calculadora Casio fx-9860GII; se agregan,
   como datos opcionales (0 por defecto), la altura del instrumento y la del prisma.
   Ángulos en grados decimales; el ángulo vertical es cenital (0 = zenit, 90° = horizontal). */
let tdN = 3;

function calcTeodolitoCoord(e0,n0,c0,azDeg,vDeg,dInc,hi,hp){
  const elev = 90 - vDeg;                              // ángulo de elevación
  const H = dInc*Math.cos(toRad(elev)), G = dInc*Math.sin(toRad(elev));
  return {E:e0+H*Math.sin(toRad(azDeg)), N:n0+H*Math.cos(toRad(azDeg)), cota:c0+(hi||0)+G-(hp||0), dH:H, dV:G, az:normDeg(azDeg)};
}

function renderTeodolitoCoord(){
  const body = `<div class="field-card">
    <h3>Estación</h3>
    ${libretaBloqueHTML('td_lib','Estación desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este de la estación','td_e0',EJ_E0)}${fieldRow('Norte de la estación','td_n0',EJ_N0)}</div>
    ${fieldRow('Cota de la estación (m)','td_c0',100)}
    <div class="field-inline2">${fieldRow('Altura instrumento (m)','td_hi',0)}${fieldRow('Altura prisma (m)','td_hp',0)}</div>
  </div>
  <div class="field-row"><label>Número de visuales</label>
    <div class="n-stepper"><button type="button" id="tdMinus">−</button><span class="n-val" id="tdNVal">${tdN}</span><button type="button" id="tdPlus">+</button></div>
  </div>
  <div id="tdPoints"></div>
  <button class="btn" id="btnTD" type="button">Calcular</button>
  <div id="resTD"></div>`;
  toolShell('teodolitoCoord','Coordenadas Este, Norte y Cota de puntos medidos con teodolito o estación total: desde una estación conocida, con el azimut, el ángulo vertical (cenital) y la distancia inclinada de cada visual.', body);
  let meta=null;
  libretaTraerA('td_lib','td_e0','td_n0', m=>{ meta=m; });
  const draw=()=>{
    const prev=[]; for(let i=0;i<tdN;i++){ const d=document.getElementById('td_d_'+i); prev.push(d?d.value:null); }
    let html='';
    for(let i=0;i<tdN;i++){
      html += `<div class="station-block"><div class="st-label">Visual P${i+1}</div>
        ${angleFieldHTML('td_az_'+i, 30+i*50, 'Azimut')}
        ${angleFieldHTML('td_v_'+i, 85+i*3, 'Ángulo vertical (cenital)')}
        ${fieldRow('Distancia inclinada (m)','td_d_'+i, prev[i]!==null?prev[i]:(50+i*12))}</div>`;
    }
    document.getElementById('tdPoints').innerHTML=html;
  };
  draw();
  document.getElementById('tdMinus').addEventListener('click', ()=>{ if(tdN>1){ tdN--; document.getElementById('tdNVal').textContent=tdN; draw(); }});
  document.getElementById('tdPlus').addEventListener('click', ()=>{ if(tdN<20){ tdN++; document.getElementById('tdNVal').textContent=tdN; draw(); }});
  document.getElementById('btnTD').addEventListener('click', ()=>{
    const e0=val('td_e0'),n0=val('td_n0'),c0=val('td_c0'),hi=val('td_hi'),hp=val('td_hp');
    const box=document.getElementById('resTD');
    if([e0,n0,c0,hi,hp].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa los datos de la estación.</p>`; return; }
    const pts=[];
    for(let i=0;i<tdN;i++){
      const az=readAngleField('td_az_'+i), v=readAngleField('td_v_'+i), d=val('td_d_'+i);
      if([az,v,d].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa azimut, ángulo vertical y distancia de todas las visuales.</p>`; return; }
      if(d<=0){ box.innerHTML=`<p class="err-msg">La distancia inclinada debe ser mayor que cero.</p>`; return; }
      if(v<0||v>180){ box.innerHTML=`<p class="err-msg">El ángulo vertical cenital debe estar entre 0 y 180° (0 y 200 gon).</p>`; return; }
      const r=calcTeodolitoCoord(e0,n0,c0,az,v,d,hi,hp); r.v=v; r.d=d; pts.push(r);
    }
    let trs=''; pts.forEach((p,i)=>{ trs += `<tr><td>P${i+1}</td><td>${fmtAngle(p.az)}</td><td>${fmtAngle(p.v)}</td><td>${fmtNum(p.d,3)}</td><td>${fmtNum(p.dH,3)}</td><td>${fmtNum(p.E,3)}</td><td>${fmtNum(p.N,3)}</td><td>${fmtNum(p.cota,3)}</td></tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Punto</th><th>Azimut</th><th>Áng. vert.</th><th>Dist. inc.</th><th>Dist. hor.</th><th>Este</th><th>Norte</th><th>Cota</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgRadiacion(e0,n0,pts)}</div>
    </div>`;
    const csv=['nombre,este,norte,cota']; pts.forEach((p,i)=>csv.push(`P${i+1},${p.E},${p.N},${p.cota}`));
    addCSVButton(box,'teodolito.csv',csv.join('\n'));
    const btn=document.createElement('button');
    btn.type='button'; btn.className='btn-sm'; btn.style.marginTop='8px'; btn.style.marginLeft='8px';
    btn.textContent='💾 Guardar puntos en la Libreta';
    btn.addEventListener('click', ()=>{
      const g='Teodolito '+fechaCorta();
      pts.forEach((p,i)=>agregarPunto(`P${i+1}`, p.E, p.N, p.cota, '', Object.assign({}, meta||{}, {grupo:g})));
      btn.textContent=`Guardado (${pts.length} puntos) ✓`;
    });
    box.appendChild(btn);
  });
}

const RENDERERS = { teodolitoCoord: renderTeodolitoCoord };
