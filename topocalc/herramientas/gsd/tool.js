"use strict";
/* Herramienta «GSD de Vuelo con Dron»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcAlturaParaGSD(gsd_cm, anchoSensor_mm, distFocal_mm, anchoImagen_px){
  return (gsd_cm*distFocal_mm*anchoImagen_px)/(anchoSensor_mm*100); // m
}
function svgFootprintVuelo(alturaVuelo, footAncho){
  const w=280,h=170,pad=24;
  const halfFoot=footAncho/2;
  const scale=Math.min((w-2*pad)/footAncho, (h-2*pad)/alturaVuelo);
  const cx=w/2, groundY=h-pad, droneY=pad;
  const gx1=cx-halfFoot*scale, gx2=cx+halfFoot*scale;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${droneY}" r="4" fill="var(--ink)"/>
    <line x1="${cx}" y1="${droneY}" x2="${gx1.toFixed(1)}" y2="${groundY}" stroke="var(--blueprint)" stroke-width="1.6"/>
    <line x1="${cx}" y1="${droneY}" x2="${gx2.toFixed(1)}" y2="${groundY}" stroke="var(--blueprint)" stroke-width="1.6"/>
    <line x1="${gx1.toFixed(1)}" y1="${groundY}" x2="${gx2.toFixed(1)}" y2="${groundY}" stroke="var(--accent)" stroke-width="2.4"/>
    <text x="${cx}" y="${(droneY-8).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">h = ${fmtNum(alturaVuelo,0)} m</text>
    <text x="${cx}" y="${(groundY+18).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">Huella = ${fmtNum(footAncho,1)} m</text>
  </svg>`;
}
function renderGSD(){
  const body = `
  <div class="field-card">
    <h3>Altura de vuelo → GSD</h3>
    ${fieldRow('Altura de vuelo (m)','gs_h',120)}
    ${fieldRow('Ancho del sensor (mm)','gs_sensor',13.2)}
    ${fieldRow('Distancia focal (mm)','gs_focal',8.8)}
    ${fieldRow('Ancho de imagen (px)','gs_px',5472)}
    <button class="btn" id="btnGS1" type="button">Calcular GSD</button>
    <div id="resGS1"></div>
  </div>
  <div class="field-card">
    <h3>GSD deseado → Altura de vuelo</h3>
    ${fieldRow('GSD deseado (cm/px)','gs_gsd',2)}
    ${fieldRow('Ancho del sensor (mm)','gs_sensor2',13.2)}
    ${fieldRow('Distancia focal (mm)','gs_focal2',8.8)}
    ${fieldRow('Ancho de imagen (px)','gs_px2',5472)}
    <button class="btn" id="btnGS2" type="button">Calcular Altura</button>
    <div id="resGS2"></div>
  </div>`;
  toolShell('gsd','GSD (Ground Sampling Distance): tamaño real en terreno que representa cada píxel de una foto de dron. A menor GSD, mayor detalle. Usa las especificaciones de tu sensor y lente.', body);
  document.getElementById('btnGS1').addEventListener('click', ()=>{
    const h=val('gs_h'), s=val('gs_sensor'), f=val('gs_focal'), px=val('gs_px');
    const box=document.getElementById('resGS1');
    if([h,s,f,px].some(isNaN) || h<=0||s<=0||f<=0||px<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos con valores mayores a 0.</p>`; return; }
    const gsd = calcGSD(h,s,f,px);
    const footAncho = (gsd/100)*px;
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">GSD</span><span class="v accent big">${fmtNum(gsd,2)} cm/px</span></div>
      <div class="plot-wrap">${svgFootprintVuelo(h, footAncho)}</div>
    </div>`;
  });
  document.getElementById('btnGS2').addEventListener('click', ()=>{
    const gsd=val('gs_gsd'), s=val('gs_sensor2'), f=val('gs_focal2'), px=val('gs_px2');
    const box=document.getElementById('resGS2');
    if([gsd,s,f,px].some(isNaN) || gsd<=0||s<=0||f<=0||px<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos con valores mayores a 0.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Altura de vuelo necesaria</span><span class="v accent big">${fmtNum(calcAlturaParaGSD(gsd,s,f,px),1)} m</span></div></div>`;
  });
}

const RENDERERS = { gsd: renderGSD };
