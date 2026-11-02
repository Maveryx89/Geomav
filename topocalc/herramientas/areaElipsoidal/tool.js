"use strict";
/* Herramienta «Área Elipsoidal»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function areaElipsoidal(lat1Deg,lat2Deg,lon1Deg,lon2Deg,a,f){
  const b=a*(1-f);
  const e2=(a*a-b*b)/(a*a);
  const e=Math.sqrt(e2);
  const q = (phiDeg)=>{
    const s=Math.sin(toRad(phiDeg));
    return s/(1-e2*s*s) + (1/(2*e))*Math.log((1+e*s)/(1-e*s));
  };
  const dLambda = toRad(lon2Deg-lon1Deg);
  return Math.abs((b*b/2)*dLambda*(q(lat2Deg)-q(lat1Deg)));
}
function svgAreaElipsoidalEsquema(lat1,lat2,lon1,lon2,fuente){
  const w=280,h=190,pad=34;
  const x1=pad, x2=w-pad, y1=pad, y2=h-pad;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" fill="var(--blueprint-soft)" stroke="var(--blueprint)" stroke-width="1.6"/>
    <text x="${x1}" y="${y1-8}" font-size="8.5" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="start">λ1=${fmtNum(lon1,3)}°</text>
    <text x="${x2}" y="${y1-8}" font-size="8.5" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="end">λ2=${fmtNum(lon2,3)}°</text>
    <text x="${(x1-4).toFixed(1)}" y="${(y1+10).toFixed(1)}" font-size="8.5" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="end">φ1=${fmtNum(lat1,3)}°</text>
    <text x="${(x1-4).toFixed(1)}" y="${y2}" font-size="8.5" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="end">φ2=${fmtNum(lat2,3)}°</text>
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
function renderAreaElipsoidal(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('ae_elip')}
    <div class="field-inline2">
      ${fieldRow('Latitud del vértice 1 (°, sur negativo)','ae_lat1',-33.40)}
      ${fieldRow('Latitud del vértice 2 (°, sur negativo)','ae_lat2',-33.85)}
    </div>
    <div class="field-inline2">
      ${fieldRow('Longitud del vértice 1 (°, oeste negativo)','ae_lon1',-70.90)}
      ${fieldRow('Longitud del vértice 2 (°, oeste negativo)','ae_lon2',-70.55)}
    </div>
    <button class="btn" id="btnAE" type="button">Calcular</button>
    <div id="resAE"></div>
  </div>`;
  toolShell('areaElipsoidal','Área de un trapecio elipsoidal delimitado por dos paralelos y dos meridianos, calculada sobre el elipsoide de referencia (no una aproximación esférica) — útil para estimar superficies de grandes extensiones (predios rurales grandes, concesiones, cuencas).', body);
  document.getElementById('btnAE').addEventListener('click', ()=>{
    const lat1=val('ae_lat1'), lat2=val('ae_lat2'), lon1=val('ae_lon1'), lon2=val('ae_lon2');
    const box=document.getElementById('resAE');
    if([lat1,lat2,lon1,lon2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las cuatro coordenadas.</p>`; return; }
    const {a,f} = readElipsoid('ae_elip');
    const area = areaElipsoidal(lat1,lat2,lon1,lon2,a,f);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Área</span><span class="v accent big">${fmtNum(area,2)} m²</span></div>
      <div class="result-row"><span class="k">En hectáreas</span><span class="v">${fmtNum(area/10000,4)} ha</span></div>
      <div class="result-row"><span class="k">En km²</span><span class="v">${fmtNum(area/1e6,6)} km²</span></div>
      <div class="plot-wrap">${svgAreaElipsoidalEsquema(lat1,lat2,lon1,lon2, "geodesia.xlsx · hoja 'AREAS ELIPSOIDALES'")}</div>
    </div>`;
  });
}

const RENDERERS = { areaElipsoidal: renderAreaElipsoidal };
