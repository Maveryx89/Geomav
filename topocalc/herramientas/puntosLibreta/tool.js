"use strict";
/* Herramienta «Libreta de Puntos»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function puntosToDXF(puntos){
  let s = '0\nSECTION\n2\nENTITIES\n';
  puntos.forEach(p=>{
    const z = (p.cota!==null && p.cota!==undefined) ? p.cota : 0;
    s += `0\nPOINT\n8\n0\n10\n${p.E}\n20\n${p.N}\n30\n${z}\n`;
    s += `0\nTEXT\n8\nTEXTOS\n10\n${p.E}\n20\n${p.N}\n30\n0\n40\n1\n1\n${p.nombre}\n`;
  });
  s += '0\nENDSEC\n0\nEOF\n';
  return s;
}
function puntosToKML(puntos, zona, hemi){
  let placemarks = '';
  puntos.forEach(p=>{
    const ll = utmToLatLon(p.E, p.N, p.huso||zona, p.hemi||hemi);
    const z = (p.cota!==null && p.cota!==undefined) ? p.cota : 0;
    placemarks += `<Placemark><name>${p.nombre}</name><Point><coordinates>${ll.lon},${ll.lat},${z}</coordinates></Point></Placemark>\n`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n${placemarks}</Document></kml>`;
}
function puntosToGPX(puntos, zona, hemi){
  let wpts = '';
  puntos.forEach(p=>{
    const ll = utmToLatLon(p.E, p.N, p.huso||zona, p.hemi||hemi);
    wpts += `<wpt lat="${ll.lat}" lon="${ll.lon}">${(p.cota!==null&&p.cota!==undefined)?`<ele>${p.cota}</ele>`:''}<name>${p.nombre}</name></wpt>\n`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Topo de Bolsillo" xmlns="http://www.topografix.com/GPX/1/1">\n${wpts}</gpx>`;
}
function capturarGPSPromediado(numLecturas, onProgress, onDone, onError){
  const lecturas = [];
  const watch = geoWatchPosition(
    (pos)=>{
      lecturas.push({lat:pos.coords.latitude, lon:pos.coords.longitude, acc:pos.coords.accuracy, alt:pos.coords.altitude});
      onProgress(lecturas.length, numLecturas);
      if(lecturas.length>=numLecturas){
        watch.clear();
        const lat = lecturas.reduce((s,l)=>s+l.lat,0)/lecturas.length;
        const lon = lecturas.reduce((s,l)=>s+l.lon,0)/lecturas.length;
        const accProm = lecturas.reduce((s,l)=>s+l.acc,0)/lecturas.length;
        const altValidas = lecturas.filter(l=>l.alt!==null && l.alt!==undefined && isFinite(l.alt));
        const alt = altValidas.length ? altValidas.reduce((s,l)=>s+l.alt,0)/altValidas.length : null;
        onDone({lat, lon, alt, accuracyPromedio:accProm, n:lecturas.length});
      }
    },
    (err)=>{ watch.clear(); onError(err); },
    {enableHighAccuracy:true, maximumAge:0, timeout:30000}
  );
  return watch;
}
function eliminarPunto(id){
  PUNTOS = PUNTOS.filter(p=>p.id!==id);
  savePuntosStore();
}
function puntosToCSV(puntos){
  const rows = ['P,N,E,D,C'];
  puntos.forEach(p=> rows.push(`${p.nombre},${p.N},${p.E},${p.descripcion||''},${(p.cota!==null&&p.cota!==undefined)?p.cota:''}`));
  return rows.join('\n');
}
const CSV_COL_ALIASES = {
  punto: ['p','punto','pt','nombre','name','id'],
  norte: ['n','norte','north','y'],
  este: ['e','este','east','x'],
  descripcion: ['d','desc','descripcion','descripción','description','codigo','código','code'],
  cota: ['c','cota','z','elev','elevacion','elevación','elevation','altura','h']
};
function detectCsvColumns(headerParts){
  const map = {};
  headerParts.forEach((h,i)=>{
    const key = h.trim().toLowerCase();
    for(const field in CSV_COL_ALIASES){
      if(map[field]===undefined && CSV_COL_ALIASES[field].includes(key)) map[field]=i;
    }
  });
  return map;
}
function csvToPuntos(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length);
  if(!lines.length) return [];
  const colMap = detectCsvColumns(lines[0].split(',').map(s=>s.trim()));
  const hasHeader = colMap.norte!==undefined && colMap.este!==undefined;
  const out=[];
  for(let i=hasHeader?1:0; i<lines.length; i++){
    const parts = lines[i].split(',').map(s=>s.trim());
    if(!parts.length) continue;
    let nombre, E, N, cota, descripcion;
    if(hasHeader){
      nombre = colMap.punto!==undefined ? parts[colMap.punto] : ('P'+(i));
      N = parseFloat(parts[colMap.norte]);
      E = parseFloat(parts[colMap.este]);
      descripcion = colMap.descripcion!==undefined ? (parts[colMap.descripcion]||'') : '';
      cota = (colMap.cota!==undefined && parts[colMap.cota]!=='') ? parseFloat(parts[colMap.cota]) : null;
    } else {
      // Formato genérico heredado, sin encabezado: nombre,este,norte,cota
      if(parts.length<3) continue;
      nombre = parts[0];
      E = parseFloat(parts[1]); N = parseFloat(parts[2]);
      cota = (parts[3]!==undefined && parts[3]!=='') ? parseFloat(parts[3]) : null;
      descripcion = '';
    }
    if(!isNaN(E) && !isNaN(N)) out.push({nombre, E, N, cota, descripcion});
  }
  return out;
}
function puntosToXLSX(puntos, filename){
  const build = ()=>{
    const header = ['P (Punto)','N (Norte)','E (Este)','D (Descripción)','C (Cota)'];
    const data = [header, ...puntos.map(p=>[p.nombre, p.N, p.E, p.descripcion||'', (p.cota!==null&&p.cota!==undefined)?p.cota:''])];
    const ws = window.XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{wch:12},{wch:14},{wch:14},{wch:24},{wch:10}];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Puntos');
    window.XLSX.writeFile(wb, filename);
  };
  if(window.XLSX){ build(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = build;
  document.head.appendChild(s);
}
function renderLibreta(){
  const body = `<div class="field-card">
    <h3>Agregar punto manualmente</h3>
    <div class="field-inline2">${fieldRow('Nombre','lb_nombre','', {type:'text', placeholder:'P1'})}${fieldRow('Cota (opcional)','lb_cota','')}</div>
    <div class="field-inline2">${fieldRow('Este','lb_e','')}${fieldRow('Norte','lb_n','')}</div>
    ${fieldRow('Descripción (opcional)','lb_desc','', {type:'text', placeholder:'ej. esquina, BM, poste'})}
    <div class="field-row"><label>Lecturas a promediar</label>
      <div class="n-stepper"><button type="button" id="lbGpsMinus">−</button><span class="n-val" id="lbGpsNVal">5</span><button type="button" id="lbGpsPlus">+</button></div>
    </div>
    <button class="btn-sm" id="btnLBGps" type="button" style="margin-bottom:10px;">📍 Capturar por GPS (promediado)</button>
    <span id="lbGpsMsg" class="proj-msg"></span>
    <button class="btn" id="btnLBAdd" type="button">Agregar a la libreta</button>
  </div>
  <div class="field-card">
    <h3>Importar / Exportar</h3>
    <p class="tool-blurb" style="margin:0 0 8px;">CSV: acepta el formato de equipos GPS/estación total con encabezado <code>P,N,E,D,C</code> (Punto, Norte, Este, Descripción, Cota) — reconoce también variantes como Nombre/Este/Norte/Cota o Name/East/North/Elev, en cualquier orden de columnas. Sin encabezado, usa el formato genérico <code>nombre,este,norte,cota</code>. DXF/KML/GPX usan el huso y hemisferio UTM configurados en el Mapa Interactivo para convertir a coordenadas geográficas.</p>
    <div class="field-inline2">
      <div class="field-row"><label for="lb_file">Archivo CSV</label><input type="file" id="lb_file" accept=".csv,text/csv"></div>
    </div>
    <div class="field-inline2" style="margin-top:8px;">
      <button class="btn-sm" id="btnLBImport" type="button">⬆ Importar CSV</button>
      <button class="btn-sm" id="btnLBExport" type="button">⬇ Exportar CSV</button>
      <button class="btn-sm" id="btnLBExportXLSX" type="button">⬇ Exportar Excel</button>
      <button class="btn-sm" id="btnLBClear" type="button">🗑 Vaciar libreta</button>
    </div>
    <div id="lbExportExtra"></div>
    <span id="lbMsg" class="proj-msg"></span>
  </div>
  <div id="lbTableWrap"></div>`;
  toolShell('puntosLibreta','Libreta de puntos compartida: guarda coordenadas desde cualquier herramienta (UTM, Radiación, Replanteo, Poligonal) o agrégalas manualmente. Los puntos guardados aquí se muestran también en el Mapa Interactivo.', body);

  addExportButtons(document.getElementById('lbExportExtra'), 'libreta_puntos', {
    dxf: ()=> puntosToDXF(PUNTOS),
    kml: ()=>{ const pr=loadMapaZonaPref(); return puntosToKML(PUNTOS, pr.zona, pr.hemi); },
    gpx: ()=>{ const pr=loadMapaZonaPref(); return puntosToGPX(PUNTOS, pr.zona, pr.hemi); }
  });

  document.getElementById('btnLBExportXLSX').addEventListener('click', ()=>{
    const msg = document.getElementById('lbMsg');
    if(!PUNTOS.length){ msg.textContent='La libreta está vacía.'; return; }
    msg.textContent = 'Generando Excel…';
    puntosToXLSX(PUNTOS, 'libreta_puntos.xlsx');
    setTimeout(()=>{ msg.textContent=''; }, 800);
  });

  let lbGpsWatch = null;
  let lbGpsN = 5;
  document.getElementById('lbGpsMinus').addEventListener('click', ()=>{ if(lbGpsN>1){lbGpsN--; document.getElementById('lbGpsNVal').textContent=lbGpsN;}});
  document.getElementById('lbGpsPlus').addEventListener('click', ()=>{ if(lbGpsN<15){lbGpsN++; document.getElementById('lbGpsNVal').textContent=lbGpsN;}});

  document.getElementById('btnLBGps').addEventListener('click', (e)=>{
    const btn = e.currentTarget;
    const msg = document.getElementById('lbGpsMsg');
    if(lbGpsWatch!==null){ lbGpsWatch.clear(); lbGpsWatch=null; }
    btn.disabled = true;
    msg.textContent = `Capturando lectura 0/${lbGpsN}…`;
    lbGpsWatch = capturarGPSPromediado(lbGpsN,
      (n,total)=>{ msg.textContent = `Capturando lectura ${n}/${total}…`; },
      (r)=>{
        lbGpsWatch = null; btn.disabled = false;
        const utm = latLonToUTM(r.lat, r.lon);
        document.getElementById('lb_e').value = round(utm.este,3);
        document.getElementById('lb_n').value = round(utm.norte,3);
        if(r.alt!==null && isFinite(r.alt)) document.getElementById('lb_cota').value = round(r.alt,2);
        msg.textContent = `GPS capturado (${r.n} lecturas, ±${fmtNum(r.accuracyPromedio,0)} m aprox.) — Huso ${utm.zona}${utm.banda}.`;
      },
      (err)=>{ lbGpsWatch = null; btn.disabled = false; msg.textContent = `No se pudo capturar GPS: ${err.message}`; }
    );
  });

  const drawTable = ()=>{
    const wrap = document.getElementById('lbTableWrap');
    if(!PUNTOS.length){ wrap.innerHTML = `<p class="tool-blurb">Aún no hay puntos guardados.</p>`; return; }
    let trs = '';
    PUNTOS.forEach(p=>{
      trs += `<tr>
        <td>${p.nombre}<br><small style="color:var(--ink-soft)">${puntoSistemaTxt(p)}${p.grupo?' · '+escHTML(p.grupo):''}</small></td><td>${fmtNum(p.E,3)}</td><td>${fmtNum(p.N,3)}</td><td>${(p.cota!==null&&p.cota!==undefined)?fmtNum(p.cota,2):'—'}</td><td>${p.descripcion||'—'}</td>
        <td><button type="button" class="btn-sm" data-del="${p.id}">🗑</button></td>
      </tr>`;
    });
    wrap.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Puntos guardados</span><span class="v accent">${PUNTOS.length}</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Nombre</th><th>Este</th><th>Norte</th><th>Cota</th><th>Descripción</th><th></th></tr></thead><tbody>${trs}</tbody></table></div>
    </div>`;
    wrap.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        eliminarPunto(parseInt(btn.dataset.del,10));
        drawTable();
      });
    });
  };
  drawTable();

  document.getElementById('btnLBAdd').addEventListener('click', ()=>{
    const nombre = document.getElementById('lb_nombre').value.trim();
    const e = val('lb_e'), n = val('lb_n'), cota = val('lb_cota');
    const desc = document.getElementById('lb_desc').value.trim();
    const msg = document.getElementById('lbMsg');
    if(isNaN(e)||isNaN(n)){ msg.textContent='Completa Este y Norte.'; return; }
    agregarPunto(nombre, e, n, cota, desc);
    document.getElementById('lb_nombre').value=''; document.getElementById('lb_e').value=''; document.getElementById('lb_n').value=''; document.getElementById('lb_cota').value=''; document.getElementById('lb_desc').value='';
    msg.textContent = 'Punto agregado.';
    drawTable();
  });

  document.getElementById('btnLBExport').addEventListener('click', ()=>{
    const msg = document.getElementById('lbMsg');
    if(!PUNTOS.length){ msg.textContent='La libreta está vacía.'; return; }
    downloadTextFile('libreta_puntos.csv', puntosToCSV(PUNTOS));
  });

  document.getElementById('btnLBImport').addEventListener('click', ()=>{
    const msg = document.getElementById('lbMsg');
    const fileInput = document.getElementById('lb_file');
    const file = fileInput.files && fileInput.files[0];
    if(!file){ msg.textContent='Selecciona primero un archivo CSV.'; return; }
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const nuevos = csvToPuntos(String(ev.target.result));
      if(!nuevos.length){ msg.textContent='No se encontraron puntos válidos en el archivo.'; return; }
      const grupoCSV = file.name.replace(/\.[^.]+$/,'');
      nuevos.forEach(p=> agregarPunto(p.nombre, p.E, p.N, p.cota, p.descripcion, {grupo: grupoCSV}));
      msg.textContent = `${nuevos.length} punto(s) importado(s).`;
      fileInput.value='';
      drawTable();
    };
    reader.onerror = ()=>{ msg.textContent='No se pudo leer el archivo.'; };
    reader.readAsText(file);
  });

  let clearArmed = false;
  document.getElementById('btnLBClear').addEventListener('click', (e)=>{
    const btn = e.currentTarget;
    const msg = document.getElementById('lbMsg');
    if(!clearArmed){
      clearArmed = true;
      btn.textContent = '⚠ Confirmar vaciado';
      msg.textContent = 'Vuelve a hacer clic para vaciar toda la libreta (no se puede deshacer).';
      setTimeout(()=>{ clearArmed=false; btn.textContent='🗑 Vaciar libreta'; }, 4000);
      return;
    }
    PUNTOS = [];
    savePuntosStore();
    clearArmed = false;
    btn.textContent = '🗑 Vaciar libreta';
    msg.textContent = 'Libreta vaciada.';
    drawTable();
  });
}

const RENDERERS = { puntosLibreta: renderLibreta };
