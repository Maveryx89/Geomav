"use strict";
/* Herramienta «Mapa Interactivo»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function geoGetCurrentPosition(onPos, onErr, opts){
  const options = opts || {enableHighAccuracy:true, timeout:15000, maximumAge:0};
  if(CapGeo){
    CapGeo.getCurrentPosition(options).then(pos=> onPos(_adaptarPosNativa(pos))).catch(err=> onErr && onErr(err));
    return;
  }
  if(!navigator.geolocation){ onErr && onErr(new Error('Este navegador no soporta geolocalización.')); return; }
  navigator.geolocation.getCurrentPosition(onPos, onErr, options);
}
function haversineDist(lat1,lon1,lat2,lon2){
  const R = 6371000; // radio medio terrestre (m)
  const f1=toRad(lat1), f2=toRad(lat2);
  const df=toRad(lat2-lat1), dl=toRad(lon2-lon1);
  const a = Math.sin(df/2)**2 + Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}
function initialBearing(lat1,lon1,lat2,lon2){
  const f1=toRad(lat1), f2=toRad(lat2), dl=toRad(lon2-lon1);
  const y = Math.sin(dl)*Math.cos(f2);
  const x = Math.cos(f1)*Math.sin(f2) - Math.sin(f1)*Math.cos(f2)*Math.cos(dl);
  return normDeg(toDeg(Math.atan2(y,x)));
}
function saveMapaZonaPref(zona,hemi){
  try{ localStorage.setItem('topocalc-mapa-zona', String(zona)); localStorage.setItem('topocalc-mapa-hemi', hemi); }catch(e){}
}
let mapaInstance = null;
let mapaGpsMarker = null;
let mapaGpsWatchId = null;
let mapaPointMarkers = [];
let mapaTapMarker = null;
let guiaWatchId = null;
let trackWatchId = null;
let trackPoints = [];
let trackPolyline = null;
let trackAreaPolygon = null;
function renderMapa(){
  const pref = loadMapaZonaPref();
  const body = `<div class="field-card">
    <h3>Huso UTM de la Libreta de Puntos</h3>
    <p class="tool-blurb" style="margin:0 0 8px;">La Libreta guarda coordenadas Este/Norte planas, sin huso. Indica en qué huso y hemisferio UTM se tomaron para poder ubicarlas correctamente en el mapa.</p>
    <div class="field-inline2">
      ${fieldRow('Huso','mp_zona',pref.zona,{type:'number',step:'1'})}
      <div class="field-row"><label for="mp_hemi">Hemisferio</label>
        <select id="mp_hemi"><option value="S" ${pref.hemi==='S'?'selected':''}>Sur</option><option value="N" ${pref.hemi==='N'?'selected':''}>Norte</option></select></div>
    </div>
    <button class="btn-sm" id="btnMPZona" type="button">Aplicar y actualizar mapa</button>
  </div>
  <div class="field-inline2" style="margin-bottom:10px;">
    <button class="btn-sm" id="btnMPGps" type="button">📍 Centrar en mi ubicación GPS</button>
    <button class="btn-sm" id="btnMPGpsLive" type="button">🛰 Activar posición en vivo</button>
  </div>
  <div id="geomavMap" class="map-box"><p class="tool-blurb" style="padding:16px;">Cargando mapa…</p></div>
  <div id="mpTapInfo" class="results" style="margin-top:12px; display:none;"></div>
  <p class="tool-blurb" style="margin-top:10px;">Toca o haz clic en el mapa para ver sus coordenadas y, si quieres, guardarlas en la Libreta.</p>

  <div class="field-card" style="margin-top:14px;">
    <h3>Guíame a un punto</h3>
    <div class="field-row"><label for="mpGuiaSelect">Punto de destino</label><select id="mpGuiaSelect"></select></div>
    <button class="btn-sm" id="btnMPGuia" type="button">🧭 Empezar a guiar</button>
    <span id="mpGuiaMsg" class="proj-msg"></span>
    <div id="mpGuiaResult" class="results" style="margin-top:10px; display:none; text-align:center;">
      <svg viewBox="0 0 60 60" width="90" height="90" style="margin:0 auto; display:block;">
        <circle cx="30" cy="30" r="27" fill="none" stroke="var(--line-strong)" stroke-width="1.4"/>
        <text x="30" y="10" text-anchor="middle" font-size="8" font-family="var(--font-mono)" fill="var(--ink-soft)">N</text>
        <g id="mpGuiaNeedle" transform="rotate(0 30 30)"><path d="M30 8 L34 30 L30 52 L26 30 Z" fill="var(--accent)"/></g>
      </svg>
      <div class="result-row"><span class="k">Distancia</span><span class="v accent big" id="mpGuiaDist">—</span></div>
      <div class="result-row"><span class="k">Rumbo</span><span class="v" id="mpGuiaRumbo">—</span></div>
    </div>
  </div>

  <div class="field-card" style="margin-top:14px;">
    <h3>Grabar recorrido</h3>
    <p class="tool-blurb" style="margin:0 0 8px;">Registra tu posición mientras caminas un deslinde o recorrido; al terminar puedes cerrar el polígono para calcular el área, o guardar los puntos en la Libreta.</p>
    <button class="btn-sm" id="btnMPTrack" type="button">🔴 Grabar recorrido</button>
    <span id="mpTrackMsg" class="proj-msg"></span>
    <div id="mpTrackResult" class="results" style="margin-top:10px; display:none;">
      <div class="result-row"><span class="k">Puntos registrados</span><span class="v" id="mpTrackN">0</span></div>
      <div class="result-row"><span class="k">Distancia recorrida</span><span class="v accent" id="mpTrackDist">0 m</span></div>
      <div class="result-row" id="mpTrackAreaRow" style="display:none;"><span class="k">Área (polígono cerrado)</span><span class="v accent big" id="mpTrackArea">—</span></div>
      <div class="field-inline2" style="margin-top:8px;">
        <button class="btn-sm" id="btnMPTrackArea" type="button">📐 Cerrar y calcular área</button>
        <button class="btn-sm" id="btnMPTrackSave" type="button">💾 Guardar puntos en la Libreta</button>
      </div>
    </div>
  </div>`;
  toolShell('mapaInteractivo','Mapa interactivo con los puntos de tu Libreta y tu posición GPS en vivo. Requiere conexión a internet para cargar los mapas base (OpenStreetMap).', body);

  ensureLeaflet().then(()=>{
    if(!document.getElementById('geomavMap')) return; // el usuario ya navegó a otra herramienta
    initMapa();
  }).catch(err=>{
    const c = document.getElementById('geomavMap');
    if(c) c.innerHTML = `<p class="err-msg" style="padding:16px;">${err.message}</p>`;
  });

  document.getElementById('btnMPZona').addEventListener('click', ()=>{
    const z = valInt('mp_zona'), h = document.getElementById('mp_hemi').value;
    if(isNaN(z)) return;
    saveMapaZonaPref(z,h);
    drawPuntosEnMapa();
  });
  document.getElementById('btnMPGps').addEventListener('click', ()=> centrarEnGPS(false));
  document.getElementById('btnMPGpsLive').addEventListener('click', (e)=> toggleGPSLive(e.currentTarget));

  poblarGuiaSelect();
  document.getElementById('btnMPGuia').addEventListener('click', (e)=> toggleGuiarPunto(e.currentTarget));
  document.getElementById('btnMPTrack').addEventListener('click', (e)=> toggleGrabarRecorrido(e.currentTarget));
  document.getElementById('btnMPTrackArea').addEventListener('click', ()=> cerrarTrackYCalcularArea());
  document.getElementById('btnMPTrackSave').addEventListener('click', (e)=>{
    guardarTrackEnLibreta();
    e.currentTarget.textContent = `Guardado (${trackPoints.length} puntos) ✓`;
  });
}
function poblarGuiaSelect(){
  const sel = document.getElementById('mpGuiaSelect');
  if(!sel) return;
  sel.innerHTML = PUNTOS.length
    ? PUNTOS.map(p=>`<option value="${p.id}">${p.nombre} (${fmtNum(p.E,1)}, ${fmtNum(p.N,1)})</option>`).join('')
    : `<option value="">— sin puntos guardados en la Libreta —</option>`;
}
function toggleGuiarPunto(btn){
  const msg = document.getElementById('mpGuiaMsg');
  if(guiaWatchId !== null){
    guiaWatchId.clear();
    guiaWatchId = null;
    guiaActivo = null;
    btn.textContent = '🧭 Empezar a guiar';
    document.getElementById('mpGuiaResult').style.display='none';
    return;
  }
  const sel = document.getElementById('mpGuiaSelect');
  const id = parseInt(sel.value,10);
  const punto = PUNTOS.find(p=>p.id===id);
  if(!punto){ msg.textContent='Selecciona un punto guardado primero.'; return; }
  const pref = loadMapaZonaPref();
  const targetLL = utmToLatLon(punto.E, punto.N, pref.zona, pref.hemi);
  msg.textContent = '';
  btn.textContent = '⏹ Detener guiado';
  document.getElementById('mpGuiaResult').style.display='';
  guiaWatchId = geoWatchPosition(
    (pos)=>{
      const dist = haversineDist(pos.coords.latitude, pos.coords.longitude, targetLL.lat, targetLL.lon);
      const brg = initialBearing(pos.coords.latitude, pos.coords.longitude, targetLL.lat, targetLL.lon);
      guiaActivo = {nombre:punto.nombre, bearing:brg, distancia:dist};
      const rb = azToRumbo(brg);
      const distEl = document.getElementById('mpGuiaDist');
      const rumboEl = document.getElementById('mpGuiaRumbo');
      const needle = document.getElementById('mpGuiaNeedle');
      if(distEl) distEl.textContent = dist<1000 ? `${fmtNum(dist,1)} m` : `${fmtNum(dist/1000,3)} km`;
      if(rumboEl) rumboEl.textContent = `${fmtNum(brg,1)}° (${rb.ns} ${fmtNum(rb.ang,1)}° ${rb.ew})`;
      if(needle) needle.setAttribute('transform', `rotate(${brg.toFixed(1)} 30 30)`);
    },
    (err)=>{ msg.textContent = `Error de GPS: ${err.message}`; },
    {enableHighAccuracy:true, maximumAge:2000, timeout:10000}
  );
}
function distanciaTotalTrack(pts){
  let total=0;
  for(let i=1;i<pts.length;i++) total += haversineDist(pts[i-1].lat,pts[i-1].lon,pts[i].lat,pts[i].lon);
  return total;
}
function actualizarTrackEnMapa(){
  if(!mapaInstance || typeof L==='undefined') return;
  const latlngs = trackPoints.map(p=>[p.lat,p.lon]);
  if(!trackPolyline){
    trackPolyline = L.polyline(latlngs, {color:'#e53935', weight:3}).addTo(mapaInstance);
  } else {
    trackPolyline.setLatLngs(latlngs);
  }
}
function toggleGrabarRecorrido(btn){
  const msg = document.getElementById('mpTrackMsg');
  if(trackWatchId !== null){
    trackWatchId.clear();
    trackWatchId = null;
    btn.textContent = '🔴 Grabar recorrido';
    msg.textContent = trackPoints.length ? `Grabación detenida: ${trackPoints.length} puntos.` : '';
    mostrarResultadoTrack();
    return;
  }
  trackPoints = [];
  if(trackPolyline && mapaInstance){ mapaInstance.removeLayer(trackPolyline); trackPolyline=null; }
  if(trackAreaPolygon && mapaInstance){ mapaInstance.removeLayer(trackAreaPolygon); trackAreaPolygon=null; }
  document.getElementById('mpTrackAreaRow').style.display='none';
  document.getElementById('mpTrackResult').style.display='none';
  btn.textContent = '⏹ Detener grabación';
  msg.textContent = 'Grabando… camina por el perímetro o recorrido.';
  trackWatchId = geoWatchPosition(
    (pos)=>{
      trackPoints.push({lat:pos.coords.latitude, lon:pos.coords.longitude});
      actualizarTrackEnMapa();
      msg.textContent = `Grabando… ${trackPoints.length} puntos, ${fmtNum(distanciaTotalTrack(trackPoints),1)} m recorridos.`;
    },
    (err)=>{ msg.textContent = `Error de GPS: ${err.message}`; },
    {enableHighAccuracy:true, maximumAge:1000, timeout:15000}
  );
}
function mostrarResultadoTrack(){
  const res = document.getElementById('mpTrackResult');
  if(!res) return;
  if(trackPoints.length<2){ res.style.display='none'; return; }
  res.style.display='';
  document.getElementById('mpTrackDist').textContent = fmtNum(distanciaTotalTrack(trackPoints),1)+' m';
  document.getElementById('mpTrackN').textContent = trackPoints.length;
}
function cerrarTrackYCalcularArea(){
  if(trackPoints.length<3) return;
  const utmPts = trackPoints.map(p=> latLonToUTM(p.lat,p.lon));
  const areaPts = utmPts.map(u=>({e:u.este, n:u.norte}));
  const r = calcAreaCoords(areaPts);
  const areaEl = document.getElementById('mpTrackArea');
  const rowEl = document.getElementById('mpTrackAreaRow');
  if(areaEl) areaEl.textContent = `${fmtNum(r.areaHa,4)} ha (${fmtNum(r.areaM2,1)} m²)`;
  if(rowEl) rowEl.style.display='';
  if(mapaInstance && typeof L!=='undefined'){
    if(trackAreaPolygon) mapaInstance.removeLayer(trackAreaPolygon);
    const latlngs = trackPoints.map(p=>[p.lat,p.lon]);
    trackAreaPolygon = L.polygon(latlngs, {color:'#43a047', fillOpacity:0.25}).addTo(mapaInstance);
  }
}
function guardarTrackEnLibreta(){
  const grupoTrayecto = 'Trayecto ' + fechaCorta();
  trackPoints.forEach((p,i)=>{
    const u = latLonToUTM(p.lat,p.lon);
    agregarPunto(`T${i+1}`, u.este, u.norte, null, '', {huso:u.zona, hemi:u.hemisferio, grupo: grupoTrayecto});
  });
}
function initMapa(){
  const container = document.getElementById('geomavMap');
  if(!container || typeof L === 'undefined') return;
  container.innerHTML='';
  mapaInstance = L.map(container).setView([-33.4489,-70.6693], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapaInstance);
  mapaInstance.on('click', (e)=> onMapaClick(e.latlng));
  drawPuntosEnMapa();
  centrarEnGPS(true);
}
function drawPuntosEnMapa(){
  if(!mapaInstance) return;
  mapaPointMarkers.forEach(m=> mapaInstance.removeLayer(m));
  mapaPointMarkers = [];
  const pref = loadMapaZonaPref();
  const bounds = [];
  PUNTOS.forEach(p=>{
    try{
      const ll = utmToLatLon(p.E, p.N, p.huso||pref.zona, p.hemi||pref.hemi);
      if(!isFinite(ll.lat) || !isFinite(ll.lon)) return;
      const marker = L.marker([ll.lat, ll.lon]).addTo(mapaInstance);
      marker.bindPopup(`<strong>${p.nombre}</strong><br>E: ${fmtNum(p.E,3)}  N: ${fmtNum(p.N,3)}${(p.cota!==null&&p.cota!==undefined)?'<br>Cota: '+fmtNum(p.cota,2):''}`);
      mapaPointMarkers.push(marker);
      bounds.push([ll.lat, ll.lon]);
    }catch(e){ /* punto con coordenadas inválidas: se omite */ }
  });
  if(bounds.length){
    mapaInstance.fitBounds(bounds, {padding:[30,30], maxZoom:17});
  }
}
function onMapaClick(latlng){
  const info = document.getElementById('mpTapInfo');
  if(!info || !mapaInstance) return;
  const utm = latLonToUTM(latlng.lat, latlng.lng);
  if(mapaTapMarker) mapaInstance.removeLayer(mapaTapMarker);
  mapaTapMarker = L.marker([latlng.lat, latlng.lng], {opacity:0.85}).addTo(mapaInstance);
  info.style.display='';
  info.innerHTML = `
    <div class="result-row"><span class="k">Latitud</span><span class="v">${fmtNum(latlng.lat,6)}°</span></div>
    <div class="result-row"><span class="k">Longitud</span><span class="v">${fmtNum(latlng.lng,6)}°</span></div>
    <div class="result-row"><span class="k">UTM Huso/Banda</span><span class="v">${utm.zona} ${utm.banda}</span></div>
    <div class="result-row"><span class="k">Este / Norte UTM</span><span class="v">${fmtNum(utm.este,3)} / ${fmtNum(utm.norte,3)}</span></div>
    <button class="btn-sm" id="btnMPSave" type="button" style="margin-top:6px;">💾 Guardar este punto en la Libreta</button>
  `;
  document.getElementById('btnMPSave').addEventListener('click', (e)=>{
    agregarPunto('Mapa', utm.este, utm.norte, null, '', {huso:utm.zona, hemi:utm.hemisferio});
    e.currentTarget.textContent = 'Guardado ✓';
    drawPuntosEnMapa();
  });
}
function centrarEnGPS(silent){
  if(!mapaInstance) return;
  geoGetCurrentPosition(
    (pos)=>{ if(mapaInstance) mapaInstance.setView([pos.coords.latitude, pos.coords.longitude], 15); },
    (err)=>{
      if(!silent){
        const info=document.getElementById('mpTapInfo');
        if(info){ info.style.display=''; info.innerHTML = `<p class="err-msg">No se pudo obtener tu ubicación GPS: ${err.message}</p>`; }
      }
    },
    {enableHighAccuracy:true, timeout:8000}
  );
}
function toggleGPSLive(btn){
  if(!mapaInstance) return;
  if(mapaGpsWatchId !== null){
    mapaGpsWatchId.clear();
    mapaGpsWatchId = null;
    if(mapaGpsMarker && mapaInstance){ mapaInstance.removeLayer(mapaGpsMarker); mapaGpsMarker=null; }
    btn.textContent = '🛰 Activar posición en vivo';
    return;
  }
  btn.textContent = '🛰 Desactivar posición en vivo';
  mapaGpsWatchId = geoWatchPosition(
    (pos)=>{
      if(!mapaInstance) return;
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if(!mapaGpsMarker){
        mapaGpsMarker = L.circleMarker(ll, {radius:8, color:'#1e88e5', fillColor:'#1e88e5', fillOpacity:0.9, weight:2}).addTo(mapaInstance);
      } else {
        mapaGpsMarker.setLatLng(ll);
      }
    },
    ()=>{ /* permiso denegado u otro error: se ignora silenciosamente */ },
    {enableHighAccuracy:true, maximumAge:2000, timeout:10000}
  );
}

const RENDERERS = { mapaInteractivo: renderMapa };
