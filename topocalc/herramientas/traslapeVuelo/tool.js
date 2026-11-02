"use strict";
/* Herramienta «Traslape de Vuelo Fotogramétrico»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcFootprint(alturaVuelo_m, anchoSensor_mm, altoSensor_mm, distFocal_mm, anchoImagen_px, altoImagen_px){
  const gsd_m = calcGSD(alturaVuelo_m, anchoSensor_mm, distFocal_mm, anchoImagen_px)/100;
  return {gsd_m, footAncho: gsd_m*anchoImagen_px, footAlto: gsd_m*altoImagen_px};
}
function calcTraslapeVuelo(footAncho, footAlto, traslapeFrontalPct, traslapeLateralPct){
  return {
    baseVuelo: footAlto*(1-traslapeFrontalPct/100),
    espaciamientoLineas: footAncho*(1-traslapeLateralPct/100)
  };
}
function svgTraslape(footAncho, footAlto, baseVuelo){
  const w=220,h=220,pad=20;
  const scale=Math.min((w-2*pad)/footAncho, (h-2*pad)/(footAlto*2 - Math.min(baseVuelo,footAlto)));
  const rectW=footAncho*scale, rectH=footAlto*scale, offsetY=baseVuelo*scale;
  const x0=(w-rectW)/2;
  const y1=pad, y2=pad+Math.max(rectH-offsetY,4);
  const arrowX=Math.min(x0+rectW+10, w-8);
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x0.toFixed(1)}" y="${y1.toFixed(1)}" width="${rectW.toFixed(1)}" height="${rectH.toFixed(1)}" fill="var(--blueprint)" fill-opacity=".2" stroke="var(--blueprint)" stroke-width="1.4"/>
    <rect x="${x0.toFixed(1)}" y="${y2.toFixed(1)}" width="${rectW.toFixed(1)}" height="${rectH.toFixed(1)}" fill="var(--accent)" fill-opacity=".2" stroke="var(--accent)" stroke-width="1.4"/>
    <text x="${(x0+8).toFixed(1)}" y="${(y1+13).toFixed(1)}" font-size="${relFont(w,0.036,7.5,9)}" font-family="var(--font-mono)" fill="var(--blueprint)">Foto 1</text>
    <text x="${(x0+8).toFixed(1)}" y="${(y2+rectH-6).toFixed(1)}" font-size="${relFont(w,0.036,7.5,9)}" font-family="var(--font-mono)" fill="var(--accent-text)">Foto 2</text>
    <text x="${(w/2).toFixed(1)}" y="${(y2+(y1+rectH-y2)/2).toFixed(1)}" font-size="${relFont(w,0.036,7.5,9)}" font-family="var(--font-mono)" fill="var(--ink)" text-anchor="middle">traslape</text>
    <line x1="${arrowX.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${arrowX.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="2 2"/>
    ${svgLineLabel(arrowX,y1,arrowX,y2, 'B='+fmtNum(baseVuelo,1), 'var(--ink-soft)', relFont(w,0.032,6.5,8), -1)}
  </svg>`;
}
function renderTraslapeVuelo(){
  const body = `<div class="field-card">
    ${fieldRow('Altura de vuelo (m)','tv_h',120)}
    <div class="field-inline2">
      ${fieldRow('Ancho del sensor (mm)','tv_sw',13.2)}
      ${fieldRow('Alto del sensor (mm)','tv_sh',8.8)}
    </div>
    ${fieldRow('Distancia focal (mm)','tv_focal',8.8)}
    <div class="field-inline2">
      ${fieldRow('Ancho de imagen (px)','tv_pxw',5472)}
      ${fieldRow('Alto de imagen (px)','tv_pxh',3648)}
    </div>
    <div class="field-inline2">
      ${fieldRow('Traslape frontal (%)','tv_frontal',75)}
      ${fieldRow('Traslape lateral (%)','tv_lateral',65)}
    </div>
    <button class="btn" id="btnTV" type="button">Calcular</button>
    <div id="resTV"></div>
  </div>`;
  toolShell('traslapeVuelo','Base de vuelo (distancia entre disparos consecutivos) y espaciamiento entre líneas de vuelo, según el traslape frontal y lateral deseados — para planificar una misión fotogramétrica.', body);
  document.getElementById('btnTV').addEventListener('click', ()=>{
    const h=val('tv_h'), sw=val('tv_sw'), sh=val('tv_sh'), f=val('tv_focal'), pxw=val('tv_pxw'), pxh=val('tv_pxh'), fr=val('tv_frontal'), lt=val('tv_lateral');
    const box=document.getElementById('resTV');
    if([h,sw,sh,f,pxw,pxh,fr,lt].some(isNaN) || h<=0||sw<=0||sh<=0||f<=0||pxw<=0||pxh<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos con valores válidos.</p>`; return; }
    const fp = calcFootprint(h,sw,sh,f,pxw,pxh);
    const tr = calcTraslapeVuelo(fp.footAncho, fp.footAlto, fr, lt);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Huella en terreno</span><span class="v">${fmtNum(fp.footAncho,1)} × ${fmtNum(fp.footAlto,1)} m</span></div>
      <div class="result-row"><span class="k">GSD</span><span class="v">${fmtNum(fp.gsd_m*100,2)} cm/px</span></div>
      <div class="result-row"><span class="k">Base de vuelo (entre disparos)</span><span class="v accent big">${fmtNum(tr.baseVuelo,1)} m</span></div>
      <div class="result-row"><span class="k">Espaciamiento entre líneas de vuelo</span><span class="v accent big">${fmtNum(tr.espaciamientoLineas,1)} m</span></div>
      <div class="plot-wrap">${svgTraslape(fp.footAncho, fp.footAlto, tr.baseVuelo)}</div>
    </div>`;
  });
}

const RENDERERS = { traslapeVuelo: renderTraslapeVuelo };
