"use strict";
/* Herramienta «PTL (Plano Topográfico Local)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function gaussKrugerGeneral(latDeg, lonDeg, a, ep2, rc, opts){
  const {lon0Deg, k0, falseE, falseN} = opts;
  const f = 1 - 1/Math.sqrt(1+ep2);                                              // aplanamiento a partir de la 2.ª excentricidad
  return tmDirecta(latDeg, lonDeg, lon0Deg, k0, falseE, falseN, a, f);
}
function calcPTL(latDeg, lonDeg, lon0Deg, falseE, falseN, k0, H_msnm, a, f){
  const b=a*(1-f), ep2=(a*a-b*b)/(b*b), rc=(a*a)/b;
  const base = gaussKrugerGeneral(latDeg,lonDeg,a,ep2,rc,{lon0Deg,k0,falseE,falseN});
  const e2=(a*a-b*b)/(a*a);
  const N = a/Math.sqrt(1-e2*Math.sin(toRad(latDeg))*Math.sin(toRad(latDeg)));
  const elevFactor = (N+H_msnm)/N;
  return { este: falseE + (base.este-falseE)*elevFactor, norte: falseN + (base.norte-falseN)*elevFactor, elevFactor, N };
}
function svgPTLEsquema(esteLocal, norteLocal, falseE, falseN, fuente){
  const w=280,h=210,pad=30;
  const ox=pad+20, oy=h-pad;
  const dx = esteLocal-falseE, dn = norteLocal-falseN;
  const maxSpan = Math.max(Math.abs(dx),Math.abs(dn),1);
  const scaleF=(Math.min(w,h)-2*pad-30)/maxSpan;
  const px = ox+dx*scaleF, py = oy-dn*scaleF;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pad}" y1="${oy}" x2="${w-pad}" y2="${oy}" stroke="var(--line)" stroke-width="1"/>
    <line x1="${ox}" y1="${h-pad}" x2="${ox}" y2="${pad}" stroke="var(--line)" stroke-width="1"/>
    <circle cx="${ox}" cy="${oy}" r="3" fill="var(--ink)"/>
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.6" fill="var(--accent)"/>
    <line x1="${ox}" y1="${oy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="2 2"/>
    <text x="${ox}" y="${oy+16}" font-size="${relFont(w,0.03,7.5,9.5)}" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">Origen PTL</text>
    <text x="${px.toFixed(1)}" y="${(py-9).toFixed(1)}" font-size="${relFont(w,0.032,8,10)}" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="middle">Punto</text>
    ${svgLineLabel(ox,oy,px,py, fmtNum(Math.hypot(dx,dn),2)+' m', 'var(--ink-soft)', relFont(w,0.026,6.5,8), 1)}
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
function renderPTL(){
  const body = `<div class="field-card">
    ${elipsoidFieldHTML('pt_elip')}
    <h3>Origen del PTL</h3>
    ${fieldRow('Meridiano central del PTL (°, oeste negativo)','pt_lon0',-70.65)}
    <div class="field-inline2">
      ${fieldRow('Falso Este del origen (m)','pt_fe',500000)}
      ${fieldRow('Falso Norte del origen (m)','pt_fn',0)}
    </div>
    <div class="field-inline2">
      ${fieldRow('Factor de escala en el origen (k0)','pt_k0',1)}
      ${fieldRow('Elevación media de la zona de trabajo (msnm)','pt_hm',900)}
    </div>
    <h3>Punto a proyectar</h3>
    <div class="field-inline2">
      ${fieldRow('Latitud (°, sur negativo)','pt_lat',-33.45)}
      ${fieldRow('Longitud (°, oeste negativo)','pt_lon',-70.62)}
    </div>
    <button class="btn" id="btnPT" type="button">Calcular</button>
    <div id="resPT"></div>
  </div>`;
  toolShell('ptl','Plano Topográfico Local (PTL): una proyección Gauss-Krüger igual que UTM pero con meridiano central, falso origen y factor de escala propios del proyecto, más un factor de elevación por la altura media de la zona de trabajo — reduce la deformación lineal en proyectos de precisión (obras viales, mineras, catastro urbano de cordillera).', body);
  document.getElementById('btnPT').addEventListener('click', ()=>{
    const lon0=val('pt_lon0'), fe=val('pt_fe'), fn=val('pt_fn'), k0=val('pt_k0'), Hm=val('pt_hm'), lat=val('pt_lat'), lon=val('pt_lon');
    const box=document.getElementById('resPT');
    if([lon0,fe,fn,k0,Hm,lat,lon].some(isNaN) || k0<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const {a,f} = readElipsoid('pt_elip');
    const r = calcPTL(lat,lon,lon0,fe,fn,k0,Hm,a,f);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Este PTL</span><span class="v accent big">${fmtNum(r.este,3)} m</span></div>
      <div class="result-row"><span class="k">Norte PTL</span><span class="v accent big">${fmtNum(r.norte,3)} m</span></div>
      <div class="result-row"><span class="k">Factor de elevación aplicado</span><span class="v">${fmtNum(r.elevFactor,8)}</span></div>
      <div class="plot-wrap">${svgPTLEsquema(r.este, r.norte, fe, fn, "geodesia.xlsx · hoja 'PTL'")}</div>
    </div>`;
  });
}

const RENDERERS = { ptl: renderPTL };
