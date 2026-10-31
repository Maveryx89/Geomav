"use strict";
/* Herramienta «Convergencia de Meridianos»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcConvergencia(latDeg, lonDeg, zonaManual){
  const zona = zonaManual || Math.trunc(lonDeg/6 + 31);
  const mc = 6*zona - 183;
  const deltaLambda = lonDeg - mc;
  // Convergencia EXACTA sobre el elipsoide: ángulo entre el meridiano y el norte de la cuadrícula UTM, obtenido derivando la propia
  // proyección a lo largo del meridiano. (La fórmula clásica de 1.er orden, Δλ·senφ, se desvía hasta ~3" a 3° del meridiano central.)
  const f = (ELL_A-ELL_B)/ELL_A, h = 1e-4;
  const s = tmDirecta(latDeg-h, lonDeg, mc, 0.9996, 500000, 0, ELL_A, f), n = tmDirecta(latDeg+h, lonDeg, mc, 0.9996, 500000, 0, ELL_A, f);
  const conv = -toDeg(Math.atan2(n.este - s.este, n.norte - s.norte));
  return {zona, mc, deltaLambda, conv};
}
function renderConverg(){
  const body = `<div class="field-card">
    ${fieldRow('Latitud (°, sur negativo)','c_lat',-35.42)}
    ${fieldRow('Longitud (°, oeste negativo)','c_lon',-71.67)}
    ${fieldRow('Huso (opcional, se calcula si se deja vacío)','c_zona','',{placeholder:'auto'})}
    <button class="btn" id="btnC" type="button">Calcular</button>
    <div id="resC"></div>
  </div>`;
  toolShell('converg','Diferencia angular entre el norte de la cuadrícula UTM y el norte geográfico en un punto dado (cálculo exacto sobre el elipsoide WGS84, positiva cuando el norte de la cuadrícula queda al este del norte geográfico).', body);
  document.getElementById('btnC').addEventListener('click', ()=>{
    const lat=val('c_lat'), lon=val('c_lon'), zRaw=document.getElementById('c_zona').value;
    const box=document.getElementById('resC');
    if(isNaN(lat)||isNaN(lon)){ box.innerHTML=`<p class="err-msg">Ingresa latitud y longitud válidas.</p>`; return; }
    const z = zRaw.trim()==='' ? null : parseInt(zRaw,10);
    const r = calcConvergencia(lat,lon,z);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Huso usado</span><span class="v">${r.zona}</span></div>
      <div class="result-row"><span class="k">Meridiano central</span><span class="v">${fmtDMS(r.mc)}</span></div>
      <div class="result-row"><span class="k">Δ Longitud</span><span class="v">${fmtDMS(r.deltaLambda)}</span></div>
      <div class="result-row"><span class="k">Convergencia</span><span class="v accent big">${fmtAngle(r.conv)}</span></div>
    </div>`;
  });
}

const RENDERERS = { converg: renderConverg };
