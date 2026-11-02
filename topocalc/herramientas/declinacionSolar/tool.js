"use strict";
/* Herramienta «Declinación Solar por Fecha»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcDeclinacionSolar(year,month,day,hourUT){
  // Coordenadas solares de baja precisión del Almanaque Astronómico (error < 0,01° entre 1950 y 2050), evaluadas en el instante
  // exacto (fecha + hora UT): la declinación cambia hasta 0,39°/día en los equinoccios, así que la hora importa.
  if(hourUT===undefined || hourUT===null || isNaN(hourUT)) hourUT = 12;
  const n = Date.UTC(year,month-1,day)/86400000 + 2440587.5 + hourUT/24 - 2451545.0;   // días desde J2000
  const L = 280.460 + 0.9856474*n;                                                      // longitud media del Sol (°)
  const g = toRad(357.528 + 0.9856003*n);                                               // anomalía media (rad)
  const lambda = toRad(L + 1.915*Math.sin(g) + 0.020*Math.sin(2*g));                    // longitud eclíptica
  const eps = toRad(23.439 - 0.0000004*n);                                              // oblicuidad de la eclíptica
  return toDeg(Math.asin(Math.sin(eps)*Math.sin(lambda)));
}
function svgDeclinacionSol(decDeg){
  const w=260,h=140,pad=24;
  const cx=w/2, cy=h/2;
  const R=Math.min(w,h)/2-pad;
  const angRad=toRad(decDeg);
  const sunX=cx+R*Math.cos(angRad), sunY=cy-R*Math.sin(angRad);
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pad}" y1="${cy}" x2="${w-pad}" y2="${cy}" stroke="var(--line-strong)" stroke-width="1.2" stroke-dasharray="2 2"/>
    <text x="${w-pad}" y="${(cy-6).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="end">Ecuador celeste</text>
    <line x1="${cx}" y1="${cy}" x2="${sunX.toFixed(1)}" y2="${sunY.toFixed(1)}" stroke="var(--accent)" stroke-width="2"/>
    <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="6" fill="var(--accent)"/>
    <text x="${sunX.toFixed(1)}" y="${(sunY-10).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">δ = ${fmtNum(decDeg,2)}°</text>
    <circle cx="${cx}" cy="${cy}" r="2.4" fill="var(--ink)"/>
  </svg>`;
}
function renderDeclinacionSolar(){
  const body = `<div class="field-card">
    <div class="field-row"><label for="ds_fecha">Fecha de la observación</label><input type="date" id="ds_fecha"></div>
    <div class="field-row"><label for="ds_hora">Hora UT de la observación (Chile continental: hora local + 3 h en verano, + 4 h en invierno)</label><input type="time" id="ds_hora" value="16:45"></div>
    <button class="btn" id="btnDS" type="button">Calcular Declinación</button>
    <div id="resDS"></div>
  </div>`;
  toolShell('declinacionSolar','Declinación solar para una fecha y hora UT dadas (algoritmo de baja precisión del Almanaque Astronómico, error menor a 0,01°). Como la declinación varía hasta 0,39° por día en los equinoccios, indica la hora de la observación: el valor por defecto (16:45 UT) equivale al mediodía local en Chile central. Usa este valor en la herramienta de Orientación Astronómica; ojo: un error de 0,01° en la declinación puede traducirse en hasta ~1 minuto de arco de azimut, así que para orientaciones de mayor precisión usa la declinación de una efeméride oficial.', body);
  try{ document.getElementById('ds_fecha').value = new Date().toISOString().slice(0,10); }catch(e){}
  document.getElementById('btnDS').addEventListener('click', ()=>{
    const fechaVal = document.getElementById('ds_fecha').value;
    const box=document.getElementById('resDS');
    if(!fechaVal){ box.innerHTML=`<p class="err-msg">Selecciona una fecha.</p>`; return; }
    const [y,m,d] = fechaVal.split('-').map(Number);
    const horaVal = (document.getElementById('ds_hora').value || '16:45').split(':').map(Number);
    const dec = calcDeclinacionSolar(y,m,d, horaVal[0] + (horaVal[1]||0)/60);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Declinación solar (δ)</span><span class="v accent big">${fmtAngle(dec,'N','S')}</span></div>
      <div class="result-row"><span class="k">Decimal</span><span class="v">${fmtNum(dec,4)}°</span></div>
      <div class="plot-wrap">${svgDeclinacionSol(dec)}</div>
    </div>`;
  });
}

const RENDERERS = { declinacionSolar: renderDeclinacionSolar };
