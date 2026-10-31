"use strict";
/* Herramienta «Azimut desde Vector GNSS»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function enuDesdeVectorGeocentrico(latDeg, lonDeg, dX,dY,dZ){
  const lat=toRad(latDeg), lon=toRad(lonDeg);
  const e = -Math.sin(lon)*dX + Math.cos(lon)*dY;
  const n = -Math.sin(lat)*Math.cos(lon)*dX - Math.sin(lat)*Math.sin(lon)*dY + Math.cos(lat)*dZ;
  const u = Math.cos(lat)*Math.cos(lon)*dX + Math.cos(lat)*Math.sin(lon)*dY + Math.sin(lat)*dZ;
  const az = normDeg(toDeg(Math.atan2(e,n)));
  const distGeom = Math.sqrt(e*e+n*n+u*u);
  const zenithDeg = toDeg(Math.atan2(Math.sqrt(e*e+n*n), u));
  return {e,n,u,az,distGeom,zenithDeg};
}
function svgVectorENU(azDeg, zenithDeg, fuente){
  const w=280,h=220,pad=34;
  const cx=w/2, cy=h-pad;
  const L=Math.min(w,h)/2-pad;
  const a=toRad(azDeg);
  const ex=cx+L*Math.sin(a), ey=cy-L*Math.cos(a);
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pad}" y1="${cy}" x2="${w-pad}" y2="${cy}" stroke="var(--line)" stroke-width="1"/>
    <line x1="${cx}" y1="${h-pad}" x2="${cx}" y2="${pad}" stroke="var(--line)" stroke-width="1"/>
    <text x="${(w-pad+6).toFixed(1)}" y="${(cy+3).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)">E</text>
    <text x="${(cx-4).toFixed(1)}" y="${(pad-8).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">N</text>
    <line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="var(--accent)" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="var(--ink)"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.4" fill="var(--accent)"/>
    <text x="${cx.toFixed(1)}" y="${(cy+16).toFixed(1)}" font-size="${relFont(w,0.03,7.5,9.5)}" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">Estación</text>
    <text x="${ex.toFixed(1)}" y="${(ey-9).toFixed(1)}" font-size="${relFont(w,0.032,8,10)}" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">Vector</text>
    <text x="${(cx+14).toFixed(1)}" y="${(cy-14).toFixed(1)}" font-size="${relFont(w,0.028,7,8.5)}" font-family="var(--font-mono)" fill="var(--ink-soft)">Z=${fmtNum(zenithDeg,1)}°</text>
    ${svgLineLabel(cx,cy,ex,ey, 'Az='+fmtNum(azDeg,2)+'°', 'var(--accent)', relFont(w,0.028,7,8.5), -1)}
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
function renderAzimutVectorGeoc(){
  const body = `<div class="field-card">
    <div class="field-inline2">
      ${fieldRow('Latitud de la estación (°, sur negativo)','av_lat',-33.45)}
      ${fieldRow('Longitud de la estación (°, oeste negativo)','av_lon',-70.65)}
    </div>
    <h3>Vector de línea base (ΔX, ΔY, ΔZ), del GNSS</h3>
    <div class="field-inline2">
      ${fieldRow('ΔX (m)','av_dx',120.350)}
      ${fieldRow('ΔY (m)','av_dy',-45.210)}
    </div>
    ${fieldRow('ΔZ (m)','av_dz',30.100)}
    <button class="btn" id="btnAV" type="button">Calcular</button>
    <div id="resAV"></div>
  </div>`;
  toolShell('azimutVectorGeoc','A partir del vector geocéntrico (ΔX, ΔY, ΔZ) que entrega el postproceso de una línea base GNSS, rota el vector al sistema topocéntrico local (Este-Norte-Arriba) de la estación para obtener el azimut, el ángulo cenital y la distancia geométrica al otro extremo.', body);
  document.getElementById('btnAV').addEventListener('click', ()=>{
    const lat=val('av_lat'), lon=val('av_lon'), dx=val('av_dx'), dy=val('av_dy'), dz=val('av_dz');
    const box=document.getElementById('resAV');
    if([lat,lon,dx,dy,dz].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = enuDesdeVectorGeocentrico(lat,lon,dx,dy,dz);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Azimut</span><span class="v accent big">${fmtAngle(r.az)}</span></div>
      <div class="result-row"><span class="k">Ángulo cenital</span><span class="v">${fmtAngle(r.zenithDeg)}</span></div>
      <div class="result-row"><span class="k">Distancia geométrica</span><span class="v">${fmtNum(r.distGeom,3)} m</span></div>
      <div class="result-row"><span class="k">Componentes locales (E, N, Arriba)</span><span class="v">${fmtNum(r.e,3)}, ${fmtNum(r.n,3)}, ${fmtNum(r.u,3)} m</span></div>
      <div class="plot-wrap">${svgVectorENU(r.az, r.zenithDeg, "geodesia.xlsx · hoja 'azimut geodesico'")}</div>
    </div>`;
  });
}

const RENDERERS = { azimutVectorGeoc: renderAzimutVectorGeoc };
