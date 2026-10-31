"use strict";
/* Herramienta «Problema Inverso de la Geodesia»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function vincentyInverse(lat1Deg, lon1Deg, lat2Deg, lon2Deg, a, f){
  const b=a*(1-f);
  const L = toRad(lon2Deg-lon1Deg);
  const U1 = Math.atan((1-f)*Math.tan(toRad(lat1Deg)));
  const U2 = Math.atan((1-f)*Math.tan(toRad(lat2Deg)));
  const sinU1=Math.sin(U1), cosU1=Math.cos(U1), sinU2=Math.sin(U2), cosU2=Math.cos(U2);
  let lambda=L, lambdaP, iter=0;
  let sinSigma=0,cosSigma=0,sigma=0,sinAlpha=0,cosSqAlpha=1,cos2SigmaM=0;
  do{
    const sinLambda=Math.sin(lambda), cosLambda=Math.cos(lambda);
    sinSigma = Math.sqrt(Math.pow(cosU2*sinLambda,2)+Math.pow(cosU1*sinU2-sinU1*cosU2*cosLambda,2));
    if(sinSigma===0) return {dist:0, az1:0, az2:0};
    cosSigma = sinU1*sinU2+cosU1*cosU2*cosLambda;
    sigma = Math.atan2(sinSigma,cosSigma);
    sinAlpha = cosU1*cosU2*sinLambda/sinSigma;
    cosSqAlpha = 1-sinAlpha*sinAlpha;
    cos2SigmaM = cosSqAlpha!==0 ? cosSigma-2*sinU1*sinU2/cosSqAlpha : 0;
    const C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
    lambdaP = lambda;
    lambda = L+(1-C)*f*sinAlpha*(sigma+C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
    iter++;
  } while(Math.abs(lambda-lambdaP)>1e-12 && iter<200);
  const uSq = cosSqAlpha*(a*a-b*b)/(b*b);
  const A = 1+uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
  const B = uSq/1024*(256+uSq*(-128+uSq*(74-47*uSq)));
  const deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
  const dist = b*A*(sigma-deltaSigma);
  const az1 = normDeg(toDeg(Math.atan2(cosU2*Math.sin(lambda), cosU1*sinU2-sinU1*cosU2*Math.cos(lambda))));
  const az2 = normDeg(toDeg(Math.atan2(cosU1*Math.sin(lambda), -sinU1*cosU2+cosU1*sinU2*Math.cos(lambda)))+180);
  return {dist, az1, az2: normDeg(az2)};
}
function renderInversoGeodesico(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('pi_elip')}
    <div class="field-inline2">
      ${fieldRow('Latitud punto 1 (°, sur negativo)','pi_lat1',-33.45)}
      ${fieldRow('Longitud punto 1 (°, oeste negativo)','pi_lon1',-70.65)}
    </div>
    <div class="field-inline2">
      ${fieldRow('Latitud punto 2 (°, sur negativo)','pi_lat2',-33.60)}
      ${fieldRow('Longitud punto 2 (°, oeste negativo)','pi_lon2',-70.50)}
    </div>
    <button class="btn" id="btnPI" type="button">Calcular</button>
    <div id="resPI"></div>
  </div>`;
  toolShell('inversoGeodesico','Problema inverso de la geodesia: conocidas las posiciones de dos puntos, obtiene la distancia geodésica entre ellos y los azimutes directo e inverso — por las fórmulas de Vincenty (1975), exactas sobre el elipsoide para cualquier distancia.', body);
  document.getElementById('btnPI').addEventListener('click', ()=>{
    const lat1=val('pi_lat1'), lon1=val('pi_lon1'), lat2=val('pi_lat2'), lon2=val('pi_lon2');
    const box=document.getElementById('resPI');
    if([lat1,lon1,lat2,lon2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las coordenadas de ambos puntos.</p>`; return; }
    const {a,f} = readElipsoid('pi_elip');
    const r = vincentyInverse(lat1,lon1,lat2,lon2,a,f);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Distancia geodésica</span><span class="v accent big">${fmtNum(r.dist,3)} m</span></div>
      <div class="result-row"><span class="k">Azimut directo (1→2)</span><span class="v">${fmtAngle(r.az1)}</span></div>
      <div class="result-row"><span class="k">Azimut inverso (2→1)</span><span class="v">${fmtAngle(r.az2)}</span></div>
      <div class="plot-wrap">${svgGeodesicaEsquema(r.az1, r.az2, 'Punto 1', 'Punto 2', "geodesia.xlsx · hoja 'DISTANACIA GEOD'")}</div>
    </div>`;
  });
}

const RENDERERS = { inversoGeodesico: renderInversoGeodesico };
