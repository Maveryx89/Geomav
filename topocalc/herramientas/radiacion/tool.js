"use strict";
/* Herramienta «Radiación (Polares Múltiples)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
let radN = 4;
function renderRadiacion(){
  const body = `<div class="field-card">
    <div class="field-inline2">
      ${fieldRow('Coord. Este de la estación','rd_e0',5000)}
      ${fieldRow('Coord. Norte de la estación','rd_n0',10000)}
    </div>
  </div>
  <div class="field-row"><label>Número de puntos a radiar</label>
    <div class="n-stepper"><button type="button" id="rdMinus">−</button><span class="n-val" id="rdNVal">${radN}</span><button type="button" id="rdPlus">+</button></div>
  </div>
  <div id="rdPoints"></div>
  <button class="btn" id="btnRD" type="button">Calcular Coordenadas</button>
  <div id="resRD"></div>`;
  toolShell('radiacion','Levantamiento por radiación: desde una estación conocida, mide azimut y distancia a varios puntos para obtener sus coordenadas Este/Norte.', body);
  const draw = ()=>{
    let html='';
    for(let i=0;i<radN;i++){
      html += `<div class="station-block">
        <div class="st-label">Punto P${i+1}</div>
        ${angleFieldHTML(`rd_az_${i}`, 30+i*40, 'Azimut')}
        <div class="field-row"><label>Distancia (m)</label><input type="number" step="any" id="rd_d_${i}" value="${50+i*10}"></div>
      </div>`;
    }
    document.getElementById('rdPoints').innerHTML = html;
  };
  draw();
  document.getElementById('rdMinus').addEventListener('click', ()=>{ if(radN>1){radN--; document.getElementById('rdNVal').textContent=radN; draw();}});
  document.getElementById('rdPlus').addEventListener('click', ()=>{ if(radN<20){radN++; document.getElementById('rdNVal').textContent=radN; draw();}});
  document.getElementById('btnRD').addEventListener('click', ()=>{
    const E0=val('rd_e0'), N0=val('rd_n0'); const box=document.getElementById('resRD');
    if(isNaN(E0)||isNaN(N0)){ box.innerHTML=`<p class="err-msg">Completa la coordenada de la estación.</p>`; return; }
    const pts=[];
    for(let i=0;i<radN;i++){
      const az=readAngleField(`rd_az_${i}`), d=val(`rd_d_${i}`);
      if(isNaN(az)||isNaN(d)){ box.innerHTML=`<p class="err-msg">Completa azimut y distancia de todos los puntos.</p>`; return; }
      const rr = calcRadiacionPunto(E0,N0,az,d);
      pts.push({E:rr.E, N:rr.N, az, d});
    }
    let trs='';
    pts.forEach((p,i)=>{ trs += `<tr><td>P${i+1}</td><td>${fmtAngle(p.az)}</td><td>${fmtNum(p.d,3)}</td><td>${fmtNum(p.E,3)}</td><td>${fmtNum(p.N,3)}</td></tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Punto</th><th>Azimut</th><th>Dist.</th><th>Este</th><th>Norte</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgRadiacion(E0,N0,pts)}</div>
    </div>`;

    const csvRows = ['nombre,este,norte,cota'];
    pts.forEach((p,i)=> csvRows.push(`P${i+1},${p.E},${p.N},`));
    addCSVButton(box, 'radiacion.csv', csvRows.join('\n'));

    const btnGuardar = document.createElement('button');
    btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px'; btnGuardar.style.marginLeft='8px';
    btnGuardar.textContent='💾 Guardar puntos en la Libreta';
    btnGuardar.addEventListener('click', ()=>{
      const grupoRad = 'Radiación ' + fechaCorta();
      pts.forEach((p,i)=> agregarPunto(`P${i+1}`, p.E, p.N, null, '', {grupo: grupoRad}));
      btnGuardar.textContent = `Guardado (${pts.length} puntos) ✓`;
    });
    box.appendChild(btnGuardar);
  });
}

const RENDERERS = { radiacion: renderRadiacion };
