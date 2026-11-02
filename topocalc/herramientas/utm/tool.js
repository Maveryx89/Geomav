"use strict";
/* Herramienta «Conversor de Coordenadas»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function svgSkyPlot(satelites){
  const w=280, h=280, cx=w/2, cy=h/2, R=120;
  const anillos = [0,30,60,90].map(elev=>{
    const r = (90-elev)/90*R;
    return `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  }).join('');
  const ejes = `
    <line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="var(--line-strong)" stroke-width="1"/>
    <line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="var(--line-strong)" stroke-width="1"/>
    <text x="${cx}" y="${cy-R-6}" font-size="10" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">N</text>
    <text x="${cx}" y="${cy+R+14}" font-size="10" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">S</text>
    <text x="${cx-R-10}" y="${cy+3}" font-size="10" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">O</text>
    <text x="${cx+R+10}" y="${cy+3}" font-size="10" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">E</text>`;
  const puntos = (satelites||[]).map(sat=>{
    const r = (90-sat.elevacion)/90*R;
    const ang = toRad(sat.azimut);
    const x = cx + r*Math.sin(ang);
    const y = cy - r*Math.cos(ang);
    // Color según estado: usado en el cálculo (verde-azulado), visible con señal débil (rojo),
    // o visible sin usar con señal aceptable (gris) — igual que el criterio de apps de referencia.
    let color = 'var(--ink-soft)';
    if(sat.usado) color = 'var(--blueprint)';
    else if(sat.snr < 18) color = 'var(--accent)';
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${color}" fill-opacity=".85" stroke="var(--paper)" stroke-width="1.2"/>
      <text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" font-size="7.5" font-family="var(--font-mono)" fill="var(--paper)" text-anchor="middle">${sat.svid}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${anillos}${ejes}${puntos}</svg>`;
}
const miniMapaGpsState = {};
const MINI_MAPA_UTM_IDS = ['miniMapaU1'];
let utmGpsWatch = null;
function resetMiniMapaUTM(containerId){
  const st = miniMapaGpsState[containerId];
  if(st && st.map){ st.map.remove(); }
  miniMapaGpsState[containerId] = {map:null, marker:null, initializing:false};
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = `<div style="padding:14px; text-align:center;">
    <p class="tool-blurb" style="margin:0 0 10px;">Activa el GPS para ver tu ubicación en el mapa.</p>
    <button class="btn-sm" id="${containerId}_btnGps" type="button">📍 Activar GPS</button>
  </div>`;
  document.getElementById(`${containerId}_btnGps`).addEventListener('click', startUtmGps);
}
function stopUtmGps(){
  if(utmGpsWatch){ utmGpsWatch.clear(); utmGpsWatch = null; }
  MINI_MAPA_UTM_IDS.forEach(resetMiniMapaUTM);
}
function mostrarMapaUTM(containerId, pos){
  const st = miniMapaGpsState[containerId] || (miniMapaGpsState[containerId] = {map:null, marker:null, initializing:false});
  const el = document.getElementById(containerId);
  if(!el) return;
  const lat = pos.coords.latitude, lon = pos.coords.longitude, acc = pos.coords.accuracy;
  const statusTxt = (acc!=null && !isNaN(acc)) ? `Ubicación GPS en vivo · ±${fmtNum(acc,0)} m aprox.` : 'Ubicación GPS en vivo.';
  if(st.map){
    st.marker.setLatLng([lat,lon]);
    st.map.setView([lat,lon]);
    const s = document.getElementById(`${containerId}_status`);
    if(s) s.textContent = statusTxt;
    return;
  }
  if(st.initializing) return;
  st.initializing = true;
  el.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 10px;">
      <span class="proj-msg" id="${containerId}_status">Buscando señal GPS…</span>
      <button class="btn-sm" id="${containerId}_btnStop" type="button" style="margin:0;">■ Detener</button>
    </div>
    <div id="${containerId}_mapa" style="height:200px; width:100%;"></div>`;
  document.getElementById(`${containerId}_btnStop`).addEventListener('click', stopUtmGps);
  ensureLeaflet().then(()=>{
    if(!document.getElementById(`${containerId}_mapa`)) return; // el usuario ya salió/reinició mientras cargaba
    st.map = window.L.map(`${containerId}_mapa`, {zoomControl:false, attributionControl:true}).setView([lat,lon], 17);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom:19
    }).addTo(st.map);
    st.marker = window.L.circleMarker([lat,lon], {radius:8, color:'#1e88e5', fillColor:'#1e88e5', fillOpacity:0.9, weight:2}).addTo(st.map);
    st.initializing = false;
    const s = document.getElementById(`${containerId}_status`);
    if(s) s.textContent = statusTxt;
  }).catch(err=>{
    st.initializing = false;
    el.innerHTML = `<p class="err-msg" style="padding:14px;">${err.message}</p>
      <div style="text-align:center; padding-bottom:10px;"><button class="btn-sm" id="${containerId}_btnRetry" type="button">📍 Reintentar</button></div>`;
    const retryBtn = document.getElementById(`${containerId}_btnRetry`);
    if(retryBtn) retryBtn.addEventListener('click', startUtmGps);
  });
}
function startUtmGps(){
  if(utmGpsWatch) return; // ya activo: la posición que ya está llegando alimenta a ambos mapas
  MINI_MAPA_UTM_IDS.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.innerHTML = `<p class="proj-msg" style="padding:14px; text-align:center;">Buscando señal GPS…</p>`;
  });
  utmGpsWatch = geoWatchPosition(
    (pos)=> MINI_MAPA_UTM_IDS.forEach(id=> mostrarMapaUTM(id, pos)),
    (err)=>{
      utmGpsWatch = null;
      MINI_MAPA_UTM_IDS.forEach(id=>{
        const st = miniMapaGpsState[id];
        if(st && st.map){ st.map.remove(); st.map = null; st.marker = null; }
        const el = document.getElementById(id);
        if(!el) return;
        el.innerHTML = `<p class="err-msg" style="padding:14px;">No se pudo obtener tu ubicación: ${err.message}</p>
          <div style="text-align:center; padding-bottom:10px;"><button class="btn-sm" id="${id}_btnRetry" type="button">📍 Reintentar</button></div>`;
        const retryBtn = document.getElementById(`${id}_btnRetry`);
        if(retryBtn) retryBtn.addEventListener('click', startUtmGps);
      });
    },
    {enableHighAccuracy:true, maximumAge:2000, timeout:15000}
  );
}
function renderUTM(){
  const body = `
  <div class="field-card">
    <h3>Escribe en cualquiera de las 3 filas — las otras se actualizan solas</h3>
    <h3 style="margin-top:12px;">1 · Grados decimales</h3>
    <div class="field-inline2">
      ${fieldRow('Latitud (°, sur negativo)','u_lat',-35.420410)}
      ${fieldRow('Longitud (°, oeste negativo)','u_lon',-71.673116)}
    </div>
    <h3 style="margin-top:12px;">2 · Grados, minutos y segundos (GMS)</h3>
    <div class="field-inline2">
      ${fieldRow('Latitud','u_dlat','',{type:'text',placeholder:'35°26\'07.22&quot;S'})}
      ${fieldRow('Longitud','u_dlon','',{type:'text',placeholder:'71°40\'35.14&quot;W'})}
    </div>
    <p class="tool-blurb" style="margin:0 0 4px;">Puedes pegar la coordenada completa (ej. 35°26'07.22"S 71°40'35.14"W) en cualquiera de los dos campos.</p>
    <h3 style="margin-top:12px;">3 · UTM</h3>
    <div class="field-inline2">
      ${fieldRow('Este (m)','u_e','')}
      ${fieldRow('Norte (m)','u_n','')}
    </div>
    <div class="field-inline2">
      ${fieldRow('Huso','u_zona','',{type:'number',step:'1'})}
      <div class="field-row"><label for="u_hemi">Hemisferio</label>
        <select id="u_hemi"><option value="S" selected>Sur</option><option value="N">Norte</option></select></div>
    </div>
    <div id="u_msg"></div>
    <button class="btn" id="btnU1" type="button">Calcular</button>
    <div id="resU1"></div>
    <div id="miniMapaU1" class="plot-wrap" style="padding:0; overflow:hidden;"></div>
  </div>
  <div class="field-card" id="gnssCard" style="display:none;">
    <h3>Detalle de satélites GNSS en vivo</h3>
    <p class="tool-blurb" style="margin:0 0 8px;">Cuenta cuántos satélites ve el teléfono de cada sistema (GPS, GLONASS, Galileo, BeiDou, etc.) y cuántos de ellos se están usando realmente en el cálculo de tu ubicación — información de diagnóstico, no cambia la coordenada obtenida. Solo funciona instalada como app (no en el navegador), y requiere Android 7.0 o superior.</p>
    <button class="btn-sm" id="btnGnssStart" type="button">🛰️ Empezar a ver satélites</button>
    <button class="btn-sm" id="btnGnssStop" type="button" style="display:none;">■ Detener</button>
    <div id="gnssResult"></div>
  </div>`;
  toolShell('utm','Convierte una coordenada entre los tres formatos: grados decimales, grados-minutos-segundos (GMS) y UTM sobre elipsoide WGS84 (Gauss-Krüger). Escribe en cualquier fila y las otras dos se completan de inmediato.', body);

  MINI_MAPA_UTM_IDS.forEach(resetMiniMapaUTM);

  /* Panel de detalle GNSS: solo tiene sentido corriendo como app nativa (Android), ya que
     depende de un plugin propio que expone la API GnssStatus — no existe equivalente en
     navegador. Se muestra oculto por defecto y solo aparece si esNativo es verdadero. */
  const gnssPlugin = (CAP && CAP.Plugins) ? CAP.Plugins.GnssInfo : null;
  if(esNativo && gnssPlugin){
    document.getElementById('gnssCard').style.display = '';
    let gnssCallbackId = null;
    const gnssResult = document.getElementById('gnssResult');
    const btnStart = document.getElementById('btnGnssStart');
    const btnStop = document.getElementById('btnGnssStop');
    const drawGnss = (data)=>{
      const filas = (data.constelaciones||[]).map(c=>{
        const pct = c.visibles>0 ? Math.round((c.usados/c.visibles)*100) : 0;
        const color = c.usados>0 ? 'var(--blueprint)' : (c.visibles>0 ? 'var(--ink-soft)' : 'var(--line-strong)');
        return `<tr>
          <td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};margin-right:6px;"></span>${c.constelacion}</td>
          <td style="min-width:90px;"><div style="background:var(--line); border-radius:3px; height:6px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:${color};"></div></div></td>
          <td>${c.visibles}</td><td>${c.usados}</td>
        </tr>`;
      }).join('');
      gnssResult.innerHTML = `<div class="results" style="margin-top:12px;">
        <div class="result-row"><span class="k">Satélites visibles (total)</span><span class="v">${data.totalVisible}</span></div>
        <div class="result-row"><span class="k">Satélites usados en el cálculo</span><span class="v accent big">${data.totalUsed}</span></div>
        <div class="table-wrap" style="margin-top:8px;"><table class="data-table"><thead><tr><th>Constelación</th><th>Estado</th><th>Visibles</th><th>Usados</th></tr></thead><tbody>${filas}</tbody></table></div>
        <div class="plot-wrap" style="margin-top:10px; display:flex; justify-content:center;">${svgSkyPlot(data.satelites)}</div>
        <p class="tool-blurb" style="margin-top:6px; text-align:center;">🔵 usado en el cálculo · ⚪ visible, no usado · 🔴 señal débil</p>
      </div>`;
    };
    btnStart.addEventListener('click', async ()=>{
      btnStart.style.display = 'none';
      btnStop.style.display = '';
      gnssResult.innerHTML = `<p class="tool-blurb">Buscando satélites…</p>`;
      let recibioAlgunDato = false;
      const avisoTimeout = setTimeout(()=>{
        if(!recibioAlgunDato){
          gnssResult.innerHTML = `<p class="tool-blurb">Sigue buscando… si esto no cambia en unos segundos más, asegúrate de estar al aire libre (el GNSS no funciona bien bajo techo) y de haber dado permiso de ubicación "Precisa" a la app.</p>`;
        }
      }, 6000);
      try{
        gnssCallbackId = await gnssPlugin.startWatching({}, (data, err)=>{
          recibioAlgunDato = true;
          clearTimeout(avisoTimeout);
          if(err){ gnssResult.innerHTML = `<p class="err-msg">${err.message}</p>`; return; }
          drawGnss(data);
        });
      }catch(err){
        clearTimeout(avisoTimeout);
        gnssResult.innerHTML = `<p class="err-msg">No se pudo iniciar: ${err.message}</p>`;
        btnStart.style.display = ''; btnStop.style.display = 'none';
      }
    });
    btnStop.addEventListener('click', async ()=>{
      btnStop.style.display = 'none';
      btnStart.style.display = '';
      try{ await gnssPlugin.stopWatching(); }catch(err){}
      if(gnssCallbackId) gnssPlugin.removeListener && gnssPlugin.removeListener(gnssCallbackId);
    });
  }

  /* --- Las 3 filas (decimal, GMS, UTM) se mantienen sincronizadas: se escribe en una y las otras se recalculan --- */
  const $ = (id)=> document.getElementById(id);
  const roundNum = (v,d)=> Math.round(v*Math.pow(10,d))/Math.pow(10,d);
  let updating = false, last = 'dec';
  const msg = (t)=>{ $('u_msg').innerHTML = t ? `<p class="err-msg" style="margin:8px 0 0;">${t}</p>` : ''; };
  const dmsText = (v,pos,neg)=>{
    const r = Math.round(Math.abs(v)*360000)/360000;            // a 0,01" antes de descomponer (así no hay 60" sueltos)
    const {d,m,s} = decToDMS(r);
    return `${d}°${String(m).padStart(2,'0')}'${s.toFixed(2).padStart(5,'0')}"${(v<0 && r!==0)?neg:pos}`;
  };
  /* Lee una coordenada GMS escrita de forma flexible: 35°26'07.22"S · 35 26 07.22 S · -35°26'07,22" · 35.4353 S */
  const parseDMS = (str,kind)=>{
    if(typeof str!=='string') return NaN;
    let t = str.trim(); if(!t) return NaN;
    t = t.replace(/[′’´‘`]/g,"'").replace(/[″”“]/g,'"').replace(/''/g,'"').replace(/[º˚]/g,'°').replace(/−/g,'-').replace(/,/g,'.');
    const letras = t.match(/[A-Za-z]/g) || [];
    if(letras.length>1) return NaN;
    const hemi = letras.length ? letras[0].toUpperCase() : '';
    if(hemi && (kind==='lat' ? 'NS' : 'EWO').indexOf(hemi)<0) return NaN;
    const nums = t.match(/\d+(?:\.\d+)?/g);
    if(!nums || nums.length>3) return NaN;
    const d=parseFloat(nums[0]), m=nums.length>1?parseFloat(nums[1]):0, sg=nums.length>2?parseFloat(nums[2]):0;
    if(m>=60 || sg>=60) return NaN;
    const v = d + m/60 + sg/3600;
    if(v > (kind==='lat'?90:180)) return NaN;
    const neg = /^\s*-/.test(t) || hemi==='S' || hemi==='W' || hemi==='O';
    return neg ? -v : v;
  };
  /* Si pegan "35°26'07.22"S 71°40'35.14"W" completo, lo separa en latitud y longitud */
  const splitPair = (str)=>{
    let m = str.match(/^(.*?[NSns])[\s,;\/]*(.*?[EWOewo])\s*$/);
    if(m && /\d/.test(m[1]) && /\d/.test(m[2])) return [m[1],m[2]];
    m = str.split(/\s*;\s*|,\s+/);
    if(m.length===2 && /\d/.test(m[0]) && /\d/.test(m[1])) return m;
    return null;
  };
  const setDec = (lat,lon)=>{ $('u_lat').value = roundNum(lat,7); $('u_lon').value = roundNum(lon,7); };
  const setDms = (lat,lon)=>{ $('u_dlat').value = dmsText(lat,'N','S'); $('u_dlon').value = dmsText(lon,'E','W'); };
  const setUtm = (lat,lon)=>{
    if(lat < -80 || lat >= 84 || lon < -180 || lon >= 180){
      ['u_e','u_n','u_zona'].forEach(id=> $(id).value='');
      msg('Esta posición queda fuera de la zona UTM (de 80°S a 84°N). Se muestran solo los formatos decimal y GMS.');
      return;
    }
    const r = latLonToUTM(lat,lon);
    $('u_e').value = roundNum(r.este,3); $('u_n').value = roundNum(r.norte,3);
    $('u_zona').value = r.zona; $('u_hemi').value = r.hemisferio;
  };
  const fromDec = ()=>{
    const lat=val('u_lat'), lon=val('u_lon');
    if(isNaN(lat)||isNaN(lon)){ msg(''); return null; }
    if(Math.abs(lat)>90 || Math.abs(lon)>180){ msg('La latitud va de −90 a 90 y la longitud de −180 a 180.'); return null; }
    msg(''); setDms(lat,lon); setUtm(lat,lon); return {lat,lon};
  };
  const fromDms = ()=>{
    const a=$('u_dlat').value.trim(), b=$('u_dlon').value.trim();
    if(!a || !b){ msg(''); return null; }
    const lat=parseDMS(a,'lat'), lon=parseDMS(b,'lon');
    if(isNaN(lat)||isNaN(lon)){ msg('Revisa el formato GMS. Ejemplo: 35°26\'07.22"S · 71°40\'35.14"W (minutos y segundos menores a 60).'); return null; }
    msg(''); setDec(lat,lon); setUtm(lat,lon); return {lat,lon};
  };
  const fromUtm = ()=>{
    const e=val('u_e'), n=val('u_n'), z=valInt('u_zona'), h=$('u_hemi').value;
    if(isNaN(e)||isNaN(n)||isNaN(z)){ msg(''); return null; }
    if(z<1 || z>60){ msg('El huso UTM va de 1 a 60.'); return null; }
    const r = utmToLatLon(e,n,z,h);
    if(!isFinite(r.lat)||!isFinite(r.lon)){ msg('No se pudo convertir ese par Este/Norte.'); return null; }
    msg(''); setDec(r.lat,r.lon); setDms(r.lat,r.lon); return {lat:r.lat, lon:r.lon};
  };
  const sync = (src)=> src==='dms' ? fromDms() : (src==='utm' ? fromUtm() : fromDec());
  const onDmsInput = (ev)=>{
    if(updating) return;
    const pair = splitPair(ev.target.value);
    if(pair){
      const la=parseDMS(pair[0],'lat'), lo=parseDMS(pair[1],'lon');
      if(!isNaN(la)&&!isNaN(lo)){ $('u_dlat').value=dmsText(la,'N','S'); $('u_dlon').value=dmsText(lo,'E','W'); }
    }
    last='dms'; fromDms();
  };
  ['u_lat','u_lon'].forEach(id=> $(id).addEventListener('input', ()=>{ last='dec'; fromDec(); }));
  ['u_dlat','u_dlon'].forEach(id=>{ const el=$(id); el.autocapitalize='off'; el.spellcheck=false; el.addEventListener('input', onDmsInput); });
  ['u_e','u_n','u_zona'].forEach(id=> $(id).addEventListener('input', ()=>{ last='utm'; fromUtm(); }));
  $('u_hemi').addEventListener('change', ()=>{ last='utm'; fromUtm(); });
  fromDec();   // completa GMS y UTM a partir de los valores iniciales

  $('btnU1').addEventListener('click', ()=>{
    const box=$('resU1');
    const ll = sync(last);
    if(!ll){ box.innerHTML=`<p class="err-msg">Completa una de las 3 filas con datos válidos.</p>`; return; }
    if(ll.lat < -80 || ll.lat >= 84 || ll.lon < -180 || ll.lon >= 180){ box.innerHTML=`<p class="err-msg">Esa posición queda fuera de la zona UTM (80°S a 84°N).</p>`; return; }
    const r = latLonToUTM(ll.lat,ll.lon);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Huso / Banda</span><span class="v big">${r.zona} ${r.banda}</span></div>
      <div class="result-row"><span class="k">Este</span><span class="v accent">${fmtNum(r.este,3)} m</span></div>
      <div class="result-row"><span class="k">Norte</span><span class="v accent">${fmtNum(r.norte,3)} m</span></div>
      <div class="result-row"><span class="k">Hemisferio</span><span class="v">${r.hemisferio==='S'?'Sur':'Norte'}</span></div>
      <div class="result-row"><span class="k">Meridiano central</span><span class="v">${fmtDMS(r.meridianoCentral)}</span></div>
    </div>`;
    const btnGuardar = document.createElement('button');
    btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px';
    btnGuardar.textContent='💾 Guardar en la Libreta';
    btnGuardar.addEventListener('click', ()=>{
      agregarPunto(`UTM ${r.zona}${r.banda}`, r.este, r.norte, null, '', {huso:r.zona, hemi:r.hemisferio});
      btnGuardar.textContent = 'Guardado ✓';
    });
    box.appendChild(btnGuardar);
  });
}

const RENDERERS = { utm: renderUTM };
