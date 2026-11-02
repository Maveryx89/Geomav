"use strict";
/* Herramienta «Replanteo de un Punto»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function renderReplanteoPunto(){
  const body = `<div class="field-card">
    ${libretaBloqueHTML('rp2_lib','Estación desde la Libreta')}
    <div class="field-inline2">
      ${fieldRow('Coord. Este de la estación','rp2_e0',EJ_E0)}
      ${fieldRow('Coord. Norte de la estación','rp2_n0',EJ_N0)}
    </div>
    ${angleFieldHTML('rp2_az', 45, 'Azimut al punto')}
    ${fieldRow('Distancia (m)','rp2_d',50)}
    <button class="btn" id="btnRP2" type="button">Calcular</button>
    <div id="resRP2"></div>
  </div>`;
  toolShell('replanteoPunto','Replanteo de un punto aislado en terreno: desde una estación de coordenadas conocidas, con un azimut y una distancia, obtiene las coordenadas del punto a materializar.', body);
  let rp2Meta = null;
  libretaTraerA('rp2_lib','rp2_e0','rp2_n0', m=>{ rp2Meta = m; });
  document.getElementById('btnRP2').addEventListener('click', ()=>{
    const E0=val('rp2_e0'), N0=val('rp2_n0'), az=readAngleField('rp2_az'), d=val('rp2_d');
    const box=document.getElementById('resRP2');
    if([E0,N0,az,d].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcRadiacionPunto(E0,N0,az,d);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Este</span><span class="v accent big">${fmtNum(r.E,3)}</span></div>
      <div class="result-row"><span class="k">Norte</span><span class="v accent big">${fmtNum(r.N,3)}</span></div>
      <div class="plot-wrap">${svgRadiacion(E0,N0,[{E:r.E,N:r.N}])}</div>
    </div>`;
    const btnGuardar = document.createElement('button');
    btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px';
    btnGuardar.textContent='💾 Guardar en la Libreta';
    btnGuardar.addEventListener('click', ()=>{
      agregarPunto('Replanteo', r.E, r.N, null, '', rp2Meta||undefined);
      btnGuardar.textContent = 'Guardado ✓';
    });
    box.appendChild(btnGuardar);
  });
}

const RENDERERS = { replanteoPunto: renderReplanteoPunto };
