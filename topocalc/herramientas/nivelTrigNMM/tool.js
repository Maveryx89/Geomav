"use strict";
/* Herramienta «Nivelación Trig. + Reducción a NMM»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function nivelTrigNMM({a,f, CE, Z_deg, AI, AJ, K, latDeg, azDeg, DI}){
  const b = a*(1-f);
  const e2 = (a*a-b*b)/(a*a);
  const lat = toRad(latDeg);
  const N = a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
  const M = a*(1-e2)/Math.pow(1-e2*Math.sin(lat)*Math.sin(lat),1.5);
  const azr = toRad(azDeg);
  const Ralpha = (N*M)/(N*Math.cos(azr)*Math.cos(azr) + M*Math.sin(azr)*Math.sin(azr)); // fórmula de Euler
  const Zr = toRad(Z_deg);
  const Cp = CE + DI*Math.cos(Zr) + Math.pow(DI*Math.sin(Zr),2)*(1-K)/(2*Ralpha) + AI - AJ;
  const CM = (Cp+CE)/2;
  const H = Cp-CE;
  const DNMM = DI - ( (H*H)/(2*DI) + Math.pow(H,4)/(8*Math.pow(DI,3)) + DI*CM/Ralpha );
  return {N,M,Ralpha,Cp,CM,H,DNMM};
}
function svgNivelTrig(Z_deg, fuente){
  const w=300,h=190,pad=28;
  const instX=pad+14, instY=h-pad, targX=w-pad-10;
  const rise = Math.max(Math.min(90-Z_deg, 50), -50);
  const targY = instY - rise*1.2;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pad}" y1="${instY}" x2="${w-pad}" y2="${instY}" stroke="var(--line)" stroke-width="1"/>
    <line x1="${instX}" y1="${instY}" x2="${instX}" y2="${instY-72}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="2 2"/>
    <circle cx="${instX}" cy="${instY}" r="3.5" fill="var(--ink)"/>
    <line x1="${instX}" y1="${instY}" x2="${targX}" y2="${targY.toFixed(1)}" stroke="var(--blueprint)" stroke-width="2"/>
    <circle cx="${targX}" cy="${targY.toFixed(1)}" r="3.5" fill="var(--accent)"/>
    <text x="${instX}" y="${instY+16}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">Estación</text>
    <text x="${targX}" y="${(targY-10).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">Punto visado</text>
    <text x="${(instX+14).toFixed(1)}" y="${(instY-16).toFixed(1)}" font-size="8" font-family="var(--font-mono)" fill="var(--ink-soft)">Z=${fmtNum(Z_deg,2)}°</text>
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
function renderNivelTrigNMM(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('nt_elip')}
    ${fieldRow('Latitud del punto (°, sur negativo)','nt_lat',-33.45)}
    ${angleFieldHTML('nt_az', 45, 'Azimut de la visual')}
    ${fieldRow('Cota de la estación (CE, m)','nt_ce',850)}
    <div class="field-inline2">
      <div class="field-row"><label for="nt_z">Ángulo cenital ${angleSimpleLabel()}</label><input type="number" step="any" id="nt_z" value="${angleSimpleDefault(88)}"></div>
      ${fieldRow('Distancia inclinada (m)','nt_di',350)}
    </div>
    <div class="field-inline2">
      ${fieldRow('Altura del instrumento AI (m)','nt_ai',1.55)}
      ${fieldRow('Altura del jalón/prisma AJ (m)','nt_aj',1.55)}
    </div>
    ${fieldRow('Coeficiente de refracción K','nt_k',0.14)}
    <button class="btn" id="btnNT" type="button">Calcular</button>
    <div id="resNT"></div>
  </div>`;
  toolShell('nivelTrigNMM','Cota de un punto visado por nivelación trigonométrica, corrigiendo por curvatura terrestre y refracción atmosférica con el radio de curvatura de Euler en el azimut de la visual — y su reducción a distancia de nivel medio del mar (DNMM).', body, ['DNMM','Rα']);
  document.getElementById('btnNT').addEventListener('click', ()=>{
    const lat=val('nt_lat'), azDeg=readAngleField('nt_az'), CE=val('nt_ce'), Z_deg=readAngleSimple('nt_z'), DI=val('nt_di'), AI=val('nt_ai'), AJ=val('nt_aj'), K=val('nt_k');
    const box=document.getElementById('resNT');
    if([lat,azDeg,CE,Z_deg,DI,AI,AJ,K].some(isNaN) || DI<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos (distancia mayor a 0).</p>`; return; }
    const {a,f} = readElipsoid('nt_elip');
    const r = nivelTrigNMM({a,f,CE,Z_deg,AI,AJ,K,latDeg:lat,azDeg,DI});
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Cota del punto visado (Cp)</span><span class="v accent big">${fmtNum(r.Cp,3)} m</span></div>
      <div class="result-row"><span class="k">Desnivel (H)</span><span class="v">${fmtNum(r.H,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia reducida a NMM (DNMM)</span><span class="v">${fmtNum(r.DNMM,3)} m</span></div>
      <div class="result-row"><span class="k">Radio de curvatura de Euler (Rα)</span><span class="v">${fmtNum(r.Ralpha,1)} m</span></div>
      <div class="plot-wrap">${svgNivelTrig(Z_deg, "geodesia.xlsx · hoja 'dnmm' / coordenadas_de_una_curva.xlsx · hoja 'RNMM'")}</div>
    </div>`;
  });
}

const RENDERERS = { nivelTrigNMM: renderNivelTrigNMM };
