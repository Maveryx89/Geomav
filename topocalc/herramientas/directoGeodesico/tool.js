"use strict";
/* Herramienta «Problema Directo de la Geodesia»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function vincentyDirect(lat1Deg, lon1Deg, az1Deg, s, a, f){
  const b = a*(1-f);
  const lat1 = toRad(lat1Deg), az1 = toRad(az1Deg);
  const U1 = Math.atan((1-f)*Math.tan(lat1));
  const sigma1 = Math.atan2(Math.tan(U1), Math.cos(az1));
  const sinAlpha = Math.cos(U1)*Math.sin(az1);
  const cosSqAlpha = 1-sinAlpha*sinAlpha;
  const uSq = cosSqAlpha*(a*a-b*b)/(b*b);
  const A = 1+uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
  const B = uSq/1024*(256+uSq*(-128+uSq*(74-47*uSq)));
  let sigma = s/(b*A), sigmaP = 2*Math.PI;
  let cos2SigmaM=0, sinSigma=0, cosSigma=0, iter=0;
  while(Math.abs(sigma-sigmaP) > 1e-12 && iter<200){
    cos2SigmaM = Math.cos(2*sigma1+sigma);
    sinSigma = Math.sin(sigma);
    cosSigma = Math.cos(sigma);
    const deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
    sigmaP = sigma;
    sigma = s/(b*A)+deltaSigma;
    iter++;
  }
  const tmp = Math.sin(U1)*sinSigma - Math.cos(U1)*cosSigma*Math.cos(az1);
  const lat2 = Math.atan2(Math.sin(U1)*cosSigma+Math.cos(U1)*sinSigma*Math.cos(az1), (1-f)*Math.sqrt(sinAlpha*sinAlpha+tmp*tmp));
  const lambda = Math.atan2(sinSigma*Math.sin(az1), Math.cos(U1)*cosSigma-Math.sin(U1)*sinSigma*Math.cos(az1));
  const C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
  const L = lambda-(1-C)*f*sinAlpha*(sigma+C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
  const lon2 = lon1Deg + toDeg(L);
  const az2 = normDeg(toDeg(Math.atan2(sinAlpha, -tmp)));
  return {lat2: toDeg(lat2), lon2, az2};
}
function renderDirectoGeodesico(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('pd_elip')}
    <div class="field-inline2">
      ${fieldRow('Latitud del punto 1 (°, sur negativo)','pd_lat1',-33.45)}
      ${fieldRow('Longitud del punto 1 (°, oeste negativo)','pd_lon1',-70.65)}
    </div>
    ${angleFieldHTML('pd_az', 45, 'Azimut de salida (1→2)')}
    ${fieldRow('Distancia geodésica (m)','pd_s',15000)}
    <button class="btn" id="btnPD" type="button">Calcular Punto 2</button>
    <div id="resPD"></div>
  </div>`;
  toolShell('directoGeodesico','Problema directo de la geodesia: conocidas la posición de un punto, un azimut y una distancia geodésica, obtiene la posición del punto destino y el azimut de regreso — por las fórmulas de Vincenty (1975), exactas sobre el elipsoide para cualquier distancia (a diferencia del método de Puissant, válido solo para líneas cortas).', body);
  document.getElementById('btnPD').addEventListener('click', ()=>{
    const lat1=val('pd_lat1'), lon1=val('pd_lon1'), az1=readAngleField('pd_az'), s=val('pd_s');
    const box=document.getElementById('resPD');
    if([lat1,lon1,az1,s].some(isNaN) || s<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos (distancia mayor a 0).</p>`; return; }
    const {a,f} = readElipsoid('pd_elip');
    const r = vincentyDirect(lat1,lon1,az1,s,a,f);
    // r.az2 es el azimut de AVANCE en el punto 2 (continuación de la línea 1→2); el de regreso (2→1) es el opuesto (+180°).
    const azReg = normDeg(r.az2+180);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Latitud del punto 2</span><span class="v accent big">${fmtDMS(r.lat2,'N','S')}</span></div>
      <div class="result-row"><span class="k">Longitud del punto 2</span><span class="v accent big">${fmtDMS(r.lon2,'E','W')}</span></div>
      <div class="result-row"><span class="k">Azimut de regreso (2→1)</span><span class="v">${fmtAngle(azReg)}</span></div>
      <div class="result-row"><span class="k">Decimal</span><span class="v">${fmtNum(r.lat2,7)}, ${fmtNum(r.lon2,7)}</span></div>
      <div class="plot-wrap">${svgGeodesicaEsquema(az1, azReg, 'Punto 1', 'Punto 2', "geodesia.xlsx · hoja 'problema inverso'")}</div>
    </div>`;
  });
}

const RENDERERS = { directoGeodesico: renderDirectoGeodesico };
