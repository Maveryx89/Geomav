"use strict";
/* Herramienta «Geocéntricas ↔ Geodésicas»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function svgGeocentricas(latDeg, fuente){
  const w=280,h=210,pad=32;
  const rx=w/2-pad, ry=h/2-pad-4;
  const cx=w/2, cy=h/2+10;
  const lat=Math.max(Math.min(latDeg,88),-88);
  const a=toRad(lat);
  const px=cx+rx*Math.cos(a), py=cy-ry*Math.sin(a);
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="var(--blueprint)" stroke-width="1.6"/>
    <line x1="${cx-rx-14}" y1="${cy}" x2="${cx+rx+14}" y2="${cy}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="2 2"/>
    <line x1="${cx}" y1="${cy+ry+16}" x2="${cx}" y2="${cy-ry-16}" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="2 2"/>
    <line x1="${cx}" y1="${cy}" x2="${(cx-rx*0.55).toFixed(1)}" y2="${(cy+ry*0.5).toFixed(1)}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="2 2"/>
    <circle cx="${cx}" cy="${cy}" r="2.2" fill="var(--ink)"/>
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.4" fill="var(--accent)"/>
    <line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <text x="${(cx+rx+16).toFixed(1)}" y="${(cy+3).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)">X</text>
    <text x="${(cx-6).toFixed(1)}" y="${(cy-ry-20).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)">Z</text>
    <text x="${(cx-rx*0.55-10).toFixed(1)}" y="${(cy+ry*0.5+12).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)">Y</text>
    <text x="${cx.toFixed(1)}" y="${(cy+13).toFixed(1)}" font-size="8.5" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">O</text>
    <text x="${px.toFixed(1)}" y="${(py-8).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">P (φ=${fmtNum(latDeg,2)}°)</text>
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
function renderGeocentricas(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('gc_elip1')}
    <h3>Geodésicas (lat, lon, h) → Geocéntricas (X, Y, Z)</h3>
    <div class="field-inline2">
      ${fieldRow('Latitud (°, sur negativo)','gc_lat',-33.45)}
      ${fieldRow('Longitud (°, oeste negativo)','gc_lon',-70.65)}
    </div>
    ${fieldRow('Altura elipsoidal h (m)','gc_h',560)}
    <button class="btn" id="btnGC1" type="button">Calcular X, Y, Z</button>
    <div id="resGC1"></div>
  </div>
  <div class="field-card">
    ${elipsoidFieldHTML('gc_elip2')}
    <h3>Geocéntricas (X, Y, Z) → Geodésicas (lat, lon, h)</h3>
    <div class="field-inline2">
      ${fieldRow('X (m)','gc_x',1760000)}
      ${fieldRow('Y (m)','gc_y',-5040000)}
    </div>
    ${fieldRow('Z (m)','gc_z',-3500000)}
    <button class="btn" id="btnGC2" type="button">Calcular Lat, Lon, h</button>
    <div id="resGC2"></div>
  </div>`;
  toolShell('geocentricas','Conversión entre coordenadas cartesianas geocéntricas (X, Y, Z, con origen en el centro de masa terrestre — el sistema nativo de las observaciones GNSS) y coordenadas geodésicas (latitud, longitud, altura elipsoidal), por el método iterativo de Bowring.', body, ['X','Y','Z','h']);
  document.getElementById('btnGC1').addEventListener('click', ()=>{
    const lat=val('gc_lat'), lon=val('gc_lon'), h=val('gc_h'); const box=document.getElementById('resGC1');
    if([lat,lon,h].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa los tres campos.</p>`; return; }
    const {a,f} = readElipsoid('gc_elip1'); const e2=f*(2-f);
    const r = geodeticToGeocentric(lat,lon,h,a,e2);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">X</span><span class="v accent">${fmtNum(r.X,3)} m</span></div>
      <div class="result-row"><span class="k">Y</span><span class="v accent">${fmtNum(r.Y,3)} m</span></div>
      <div class="result-row"><span class="k">Z</span><span class="v accent">${fmtNum(r.Z,3)} m</span></div>
      <div class="plot-wrap">${svgGeocentricas(lat, "geodesia.xlsx · hoja 'GEODESICAS-GEOCENTRICAS'")}</div>
    </div>`;
  });
  document.getElementById('btnGC2').addEventListener('click', ()=>{
    const X=val('gc_x'), Y=val('gc_y'), Z=val('gc_z'); const box=document.getElementById('resGC2');
    if([X,Y,Z].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa los tres campos.</p>`; return; }
    const {a,f} = readElipsoid('gc_elip2'); const e2=f*(2-f);
    const r = geocentricToGeodetic(X,Y,Z,a,e2);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Latitud</span><span class="v accent">${fmtDMS(r.lat,'N','S')}</span></div>
      <div class="result-row"><span class="k">Longitud</span><span class="v accent">${fmtDMS(r.lon,'E','W')}</span></div>
      <div class="result-row"><span class="k">Altura elipsoidal (h)</span><span class="v accent">${fmtNum(r.h,3)} m</span></div>
      <div class="plot-wrap">${svgGeocentricas(r.lat, "geodesia.xlsx · hoja 'GEOCENTRICAS-GEODESICAS'")}</div>
    </div>`;
  });
}

const RENDERERS = { geocentricas: renderGeocentricas };
