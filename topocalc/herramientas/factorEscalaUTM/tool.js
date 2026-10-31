"use strict";
/* Herramienta «Factor de Escala UTM»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function factorEscalaPuntoUTM(este, latDeg, a, f, k0){
  k0 = k0||0.9996;
  const b=a*(1-f);
  const e2=(a*a-b*b)/(a*a);
  const lat=toRad(latDeg);
  const N = a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
  const M = a*(1-e2)/Math.pow(1-e2*Math.sin(lat)*Math.sin(lat),1.5);
  const R = Math.sqrt(N*M);
  const xp = este-500000;
  const k = k0*(1 + (xp*xp)/(2*R*R) + Math.pow(xp,4)/(24*Math.pow(R,4)));
  return {k, R};
}
function svgFactorEscala(este, k, fuente){
  const w=280,h=170,pad=30;
  const cmX=w/2;
  const xp = este-500000;
  const scaleF = (w/2-pad)/Math.max(Math.abs(xp),50000)*0.9;
  const px = cmX + Math.max(Math.min(xp*scaleF, w/2-pad),-(w/2-pad));
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${cmX}" y1="${pad-6}" x2="${cmX}" y2="${h-pad+6}" stroke="var(--blueprint)" stroke-width="1.6"/>
    <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="var(--line)" stroke-width="1"/>
    <circle cx="${px.toFixed(1)}" cy="${(h-pad).toFixed(1)}" r="3.6" fill="var(--accent)"/>
    <line x1="${cmX}" y1="${(h-pad).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(h-pad).toFixed(1)}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="2 2"/>
    <text x="${cmX}" y="${pad-10}" font-size="${relFont(w,0.03,7.5,9.5)}" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">Meridiano central</text>
    ${svgLineLabel(cmX,h-pad,px,h-pad, fmtNum(Math.abs(xp),0)+' m', 'var(--ink-soft)', relFont(w,0.026,6.5,8), -1)}
    <text x="${px.toFixed(1)}" y="${(h-pad-10).toFixed(1)}" font-size="${relFont(w,0.032,8,10)}" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">k=${fmtNum(k,6)}</text>
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
function renderFactorEscalaUTM(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('fe_elip')}
    ${fieldRow('Coordenada Este UTM (m)','fe_este',658236)}
    ${fieldRow('Latitud del punto (°, sur negativo)','fe_lat',-33.45)}
    ${fieldRow('Factor de escala en el meridiano central (k0)','fe_k0',0.9996)}
    <button class="btn" id="btnFE" type="button">Calcular</button>
    <div id="resFE"></div>
  </div>`;
  toolShell('factorEscalaUTM','Factor de escala puntual de la proyección UTM: la razón entre una distancia medida en terreno y su equivalente proyectado en la cuadrícula UTM. Se aleja de 1 a medida que el punto se aleja del meridiano central del huso — útil para corregir distancias de poligonales largas en proyectos que trabajan directamente en coordenadas UTM.', body);
  document.getElementById('btnFE').addEventListener('click', ()=>{
    const este=val('fe_este'), lat=val('fe_lat'), k0=val('fe_k0');
    const box=document.getElementById('resFE');
    if([este,lat,k0].some(isNaN) || k0<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const {a,f} = readElipsoid('fe_elip');
    const r = factorEscalaPuntoUTM(este,lat,a,f,k0);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Factor de escala (k)</span><span class="v accent big">${fmtNum(r.k,8)}</span></div>
      <div class="result-row"><span class="k">1 000 m de terreno equivalen a</span><span class="v">${fmtNum(1000*r.k,4)} m en la cuadrícula</span></div>
      <div class="result-row"><span class="k">Radio medio de curvatura (R)</span><span class="v">${fmtNum(r.R,1)} m</span></div>
      <div class="plot-wrap">${svgFactorEscala(este, r.k, "complemento estándar UTM (no en una hoja específica)")}</div>
    </div>`;
  });
}

const RENDERERS = { factorEscalaUTM: renderFactorEscalaUTM };
