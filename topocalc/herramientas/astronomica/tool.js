"use strict";
/* Herramienta «Orientación Astronómica»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcAzimutSolar(latDeg, decDeg, zDeg, chDeg){
  const F=toRad(latDeg), d=toRad(decDeg), Z=toRad(zDeg);
  const cosAz = (Math.sin(d) - Math.sin(F)*Math.cos(Z)) / (Math.cos(F)*Math.sin(Z));
  const AzAM = toDeg(Math.acos(Math.max(-1,Math.min(1,cosAz)))); // solucion 0-180 (manana, sol al Este)
  const AzPM = 360-AzAM; // tarde, sol al Oeste
  const R_AM = normDeg(AzAM - chDeg);
  const R_PM = normDeg(AzPM - chDeg);
  return {AzAM, AzPM, R_AM, R_PM};
}
function svgAstronomica(azSolDeg, rDeg, chDeg){
  const w=240,h=240,pad=30;
  const R=Math.min(w,h)/2-pad;
  const cx=w/2, cy=h/2;
  const ray = (azDeg,len)=>({x:cx+len*Math.sin(toRad(azDeg)), y:cy-len*Math.cos(toRad(azDeg))});
  const pSol=ray(azSolDeg,R), pRef=ray(rDeg,R*0.8);
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="1"/>
    <text x="${cx}" y="${cy-R-8}" font-size="10" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">N</text>
    <line x1="${cx}" y1="${cy}" x2="${pSol.x.toFixed(1)}" y2="${pSol.y.toFixed(1)}" stroke="var(--accent)" stroke-width="2"/>
    <circle cx="${pSol.x.toFixed(1)}" cy="${pSol.y.toFixed(1)}" r="6" fill="var(--accent)"/>
    <line x1="${cx}" y1="${cy}" x2="${pRef.x.toFixed(1)}" y2="${pRef.y.toFixed(1)}" stroke="var(--blueprint)" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="2.6" fill="var(--ink)"/>
    <text x="${pSol.x.toFixed(1)}" y="${(pSol.y-10).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">Sol (Az=${fmtNum(azSolDeg,2)}°)</text>
    <text x="${pRef.x.toFixed(1)}" y="${(pRef.y-8).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--blueprint)" text-anchor="middle">Ref. (Az=${fmtNum(rDeg,2)}°)</text>
  </svg>`;
}
function renderAstronomica(){
  const body = `<div class="field-card">
    ${fieldRow('Latitud del lugar (°, sur negativo)','as_lat',-19.334639)}
    ${fieldRow('Declinación del sol (°, según efeméride, sur negativo)','as_dec',-14.291028)}
    ${angleFieldHTML('as_z', 56.6169, 'Distancia zenital observada (Z)')}
    ${angleFieldHTML('as_ch', 62.4083, 'Lectura del círculo horizontal al sol (CH)')}
    <div class="field-row"><label>Momento de la observación</label>
      <select id="as_modo"><option value="am" selected>Mañana (sol al este)</option><option value="pm">Tarde (sol al oeste)</option></select>
    </div>
    <button class="btn" id="btnAS" type="button">Calcular</button>
    <div id="resAS"></div>
  </div>`;
  toolShell('astronomica','Determina el azimut verdadero de una línea de referencia observando el sol con teodolito — el método clásico de orientación astronómica por distancia zenital, sin depender de brújula.', body, ['Z','CH']);
  document.getElementById('btnAS').addEventListener('click', ()=>{
    const lat=val('as_lat'), dec=val('as_dec'), Z=readAngleField('as_z'), CH=readAngleField('as_ch'), modo=document.getElementById('as_modo').value;
    const box=document.getElementById('resAS');
    if([lat,dec,Z,CH].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcAzimutSolar(lat,dec,Z,CH);
    const Az = modo==='am'? r.AzAM : r.AzPM;
    const R = modo==='am'? r.R_AM : r.R_PM;
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Azimut del sol</span><span class="v accent big">${fmtAngle(Az)}</span></div>
      <div class="result-row"><span class="k">Azimut de la línea de referencia</span><span class="v accent">${fmtAngle(R)}</span></div>
      <div class="plot-wrap">${svgAstronomica(Az,R,CH)}</div>
    </div>`;
  });
}

const RENDERERS = { astronomica: renderAstronomica };
