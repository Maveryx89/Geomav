"use strict";
/* Herramienta «Transformación de Datum»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
const ELIP_PSAD56 = {a:6378388, f:1/297};
const ELIP_SIRGAS = {a:6378137, f:1/298.257223563};
function calcDatumTransform(latDeg, lonDeg, h, dX, dY, dZ, direction){
  if(direction==='toSirgas'){
    const geo = geodeticToGeocentric(latDeg,lonDeg,h,ELIP_PSAD56.a,ELIP_PSAD56.e2);
    return geocentricToGeodetic(geo.X+dX, geo.Y+dY, geo.Z+dZ, ELIP_SIRGAS.a, ELIP_SIRGAS.e2);
  }
  const geo = geodeticToGeocentric(latDeg,lonDeg,h,ELIP_SIRGAS.a,ELIP_SIRGAS.e2);
  return geocentricToGeodetic(geo.X-dX, geo.Y-dY, geo.Z-dZ, ELIP_PSAD56.a, ELIP_PSAD56.e2);
}
function renderDatumTransform(){
  const body = `<div class="field-card">
    <div class="field-row"><label for="dt_dir">Sentido</label>
      <select id="dt_dir"><option value="toSirgas" selected>PSAD56 → SIRGAS/WGS84</option><option value="toPsad">SIRGAS/WGS84 → PSAD56</option></select></div>
    <div class="field-row"><label for="dt_zona">Parámetros de traslación</label>
      <select id="dt_zona"><option value="auto" selected>Automático según la latitud (EPSG Chile)</option><option value="6949">EPSG:6949 · norte de 26°S</option><option value="6950">EPSG:6950 · 26°S a 36°S</option><option value="6951">EPSG:6951 · 36°S a 43,5°S</option><option value="manual">Manual (los ingreso yo)</option></select></div>
    <div class="field-inline2">
      ${fieldRow('Latitud (°, sur negativo)','dt_lat',-20.2133)}
      ${fieldRow('Longitud (°, oeste negativo)','dt_lon',-69.0989)}
    </div>
    ${fieldRow('Altura (m)','dt_h',1000)}
    <h3>Parámetros de traslación (ΔX, ΔY, ΔZ)</h3>
    <div class="field-inline2">
      ${fieldRow('ΔX (m)','dt_dx',-302)}
      ${fieldRow('ΔY (m)','dt_dy',272)}
    </div>
    ${fieldRow('ΔZ (m)','dt_dz',-360)}
    <button class="btn" id="btnDT" type="button">Transformar</button>
    <div id="resDT"></div>
  </div>`;
  toolShell('datumTransform','Transformación aproximada de 3 parámetros (traslación geocéntrica) entre PSAD56 y SIRGAS/WGS84. En Chile los parámetros varían por zona porque PSAD56 ajusta mal el territorio: por defecto se eligen según la latitud entre los tres juegos oficiales de EPSG (6949 al norte de 26°S, 6950 entre 26°S y 36°S, 6951 entre 36°S y 43,5°S; precisión ~5 m). Usar el juego equivocado desplaza el punto decenas de metros. Para deslindes, catastro o trabajo legal usa el transformador oficial de SIRGAS-Chile o el programa Transdatum del IGM; esta calculadora es solo para estimación y estudio.', body);
  const DATUM_ZONAS = {'6949':[-302,272,-360], '6950':[-328,340,-329], '6951':[-352,403,-287]};   // EPSG: PSAD56 → SIRGAS-Chile 2002
  const datumZonaPorLat = lat => lat>=-26 ? '6949' : (lat>=-36 ? '6950' : '6951');
  const zonaSel = document.getElementById('dt_zona'), idsParam = ['dt_dx','dt_dy','dt_dz'];
  const aplicarZona = ()=>{
    let z = zonaSel.value; if(z==='manual') return;
    if(z==='auto'){ const la = val('dt_lat'); if(isNaN(la)) return; z = datumZonaPorLat(la); }
    idsParam.forEach((id,i)=>{ document.getElementById(id).value = DATUM_ZONAS[z][i]; });
  };
  zonaSel.addEventListener('change', aplicarZona);
  document.getElementById('dt_lat').addEventListener('input', ()=>{ if(zonaSel.value==='auto') aplicarZona(); });
  idsParam.forEach(id=>document.getElementById(id).addEventListener('input', ()=>{ zonaSel.value='manual'; }));   // editar a mano => modo manual
  document.getElementById('btnDT').addEventListener('click', ()=>{
    aplicarZona();
    const lat=val('dt_lat'), lon=val('dt_lon'), h=val('dt_h'), dx=val('dt_dx'), dy=val('dt_dy'), dz=val('dt_dz');
    const dir=document.getElementById('dt_dir').value;
    const box=document.getElementById('resDT');
    if([lat,lon,h,dx,dy,dz].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcDatumTransform(lat,lon,h,dx,dy,dz,dir);
    const zonaLat = datumZonaPorLat(lat); let aviso = '';
    if(lat>-17.5 || lat<-43.5) aviso = 'La latitud está fuera de Chile continental (17,5°S a 43,5°S): los parámetros EPSG no aplican, usa parámetros propios.';
    else if(zonaSel.value==='manual'){ const zm = Object.keys(DATUM_ZONAS).find(k=>DATUM_ZONAS[k][0]===dx && DATUM_ZONAS[k][1]===dy && DATUM_ZONAS[k][2]===dz); if(zm && zm!==zonaLat) aviso = `Ojo: ΔX, ΔY y ΔZ son los de EPSG:${zm}, pero para esta latitud corresponde EPSG:${zonaLat}.`; }
    const usados = zonaSel.value==='manual' ? 'Manuales' : `EPSG:${zonaSel.value==='auto' ? zonaLat : zonaSel.value}`;
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Latitud transformada</span><span class="v accent big">${fmtDMS(r.lat,'N','S')}</span></div>
      <div class="result-row"><span class="k">Longitud transformada</span><span class="v accent big">${fmtDMS(r.lon,'E','W')}</span></div>
      <div class="result-row"><span class="k">Altura</span><span class="v">${fmtNum(r.h,3)} m</span></div>
      <div class="result-row"><span class="k">Decimal</span><span class="v">${fmtNum(r.lat,7)}, ${fmtNum(r.lon,7)}</span></div>
      <div class="result-row"><span class="k">Parámetros aplicados</span><span class="v">${usados} (${dx}, ${dy}, ${dz})</span></div>
      ${aviso ? `<p class="hint" style="margin-top:8px;">${aviso}</p>` : ''}
    </div>`;
  });
}

const RENDERERS = { datumTransform: renderDatumTransform };
