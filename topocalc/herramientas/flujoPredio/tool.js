"use strict";
/* Herramienta «Levantamiento de Predio»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function flujoPredioGuardarNombre(v){ try{ localStorage.setItem('topocalc-flujo-predio', JSON.stringify({nombre:v})); }catch(e){} }
function renderFlujoPredio(){
  const nombre = flujoPredioNombre();
  const grupos = gruposLibreta();
  const pill = (ok, t)=> `<span class="pill ${ok?'ok':''}"><span class="dot"></span>${t}</span>`;
  const paso = (n, titulo, ok, estado, texto, botones)=> `<div class="station-block" data-kv id="fp_paso${n}">
      <div class="st-label">Paso ${n} · ${titulo}</div>
      <div style="margin:6px 0 8px;">${pill(ok, estado)}</div>
      <p class="tool-blurb" style="margin:0 0 10px;">${texto}</p>${botones}</div>`;
  const paso2 = nom=>{ const gp = gruposLibreta().get(nom) || [];
    return paso(2,'Poligonal en terreno', gp.length>=3, gp.length ? `${gp.length} vértices en «${escHTML(nom)}» · ${puntoSistemaTxt(gp[0])}` : 'Pendiente',
     `En Poligonal Cerrada elige el punto A desde la Libreta, ingresa los ángulos internos y las distancias, calcula y toca <b>Guardar vértices en la Libreta</b>. Quedan en el grupo «${escHTML(nom)}» con el huso del punto A.`,
     `<button class="btn-sm" type="button" data-flujo-ir="poligonal">Abrir Poligonal Cerrada</button>`); };
  const gruposArea = [...grupos].filter(([,pts])=>pts.length>=3);
  const body = `<div class="field-card">
    <h3>Levantamiento</h3>
    ${fieldRow('Nombre del levantamiento','fp_nombre', escHTML(nombre), {type:'text', placeholder:'Predio 1'})}
    <p class="tool-blurb" style="margin:0;">Los vértices de la poligonal se guardarán en la Libreta bajo este nombre.</p>
  </div>
  ${paso(1,'Punto de partida', PUNTOS.length>0, PUNTOS.length ? `${PUNTOS.length} punto(s) en la Libreta` : 'Libreta vacía',
     'Necesitas al menos un punto de coordenadas conocidas: captúralo por GPS promediado, impórtalo desde el CSV del GNSS o usa un vértice de un trabajo anterior.',
     `<button class="btn-sm" type="button" data-flujo-ir="puntosLibreta">Abrir Libreta de Puntos</button>`)}
  ${paso2(nombre)}
  <div class="station-block" data-kv>
    <div class="st-label">Paso 3 · Superficie y entrega</div>
    ${gruposArea.length ? `<div class="field-row" style="margin-top:8px;"><label for="fp_grupo">Grupo de vértices</label><select id="fp_grupo">${gruposArea.map(([g,pts])=>`<option value="${escHTML(g)}"${g===nombre?' selected':''}>${escHTML(g)} (${pts.length} pts)</option>`).join('')}</select></div>`
      : `<div style="margin:6px 0 8px;">${pill(false,'Pendiente')}</div><p class="tool-blurb" style="margin:0;">Cuando la Libreta tenga un grupo de 3 o más vértices (de la poligonal o de un CSV del GNSS), aquí verás su superficie, perímetro y las exportaciones.</p>`}
    <div id="fp_res"></div>
  </div>`;
  toolShell('flujoPredio','Flujo guiado para levantar un predio: parte de un punto conocido de la Libreta, mide la poligonal cerrada y entrega superficie, perímetro y archivos (CSV, DXF, KML). Cada paso abre la herramienta de siempre; el botón «Volver» te trae de regreso.', body);
  /* El nombre se guarda mientras se escribe y solo se redibuja el paso 2: redibujar toda la pantalla al perder el foco
     haría que se pierda el toque sobre un botón de paso. Los botones usan delegación porque el paso 2 se reemplaza. */
  document.getElementById('fp_nombre').addEventListener('input', e=>{
    flujoPredioGuardarNombre(e.target.value.trim());
    document.getElementById('fp_paso2').outerHTML = paso2(flujoPredioNombre());
  });
  document.querySelector('.tool-view').addEventListener('click', e=>{
    const b = e.target.closest('[data-flujo-ir]'); if(!b) return;
    flujoRetorno = 'flujoPredio'; go(b.dataset.flujoIr);
  });
  const sel = document.getElementById('fp_grupo');
  const resumen = ()=>{
    const box = document.getElementById('fp_res');
    const g = sel.value, pts = (gruposLibreta().get(g)||[]);
    const inc = metasIncompatibles(pts.map(p=>({huso:p.huso, hemi:p.hemi, datum:p.datum, sistema:p.sistema})));
    if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    const pe = pts.map(p=>({e:p.E, n:p.N}));
    const r = calcAreaCoords(pe);
    let per = 0; for(let i=0;i<pe.length;i++){ const a=pe[i], b=pe[(i+1)%pe.length]; per += Math.hypot(b.e-a.e, b.n-a.n); }
    box.innerHTML = `<div class="results" style="margin-top:10px;">
      <div class="result-row"><span class="k">Superficie</span><span class="v accent big">${fmtNum(r.areaHa,4)} ha</span></div>
      <div class="result-row"><span class="k">Superficie</span><span class="v">${fmtNum(r.areaM2,2)} m²</span></div>
      <div class="result-row"><span class="k">Perímetro</span><span class="v">${fmtNum(per,2)} m</span></div>
      <div class="result-row"><span class="k">Vértices</span><span class="v">${pts.length}</span></div>
      <div class="result-row"><span class="k">Sistema</span><span class="v">${puntoSistemaTxt(pts[0])}</span></div>
      <div class="plot-wrap">${svgAreaCoordenadas(pe)}</div>
    </div>`;
    const base = (g.replace(/[^\w\-]+/g,'_') || 'predio');
    const csv = ['nombre,este,norte,cota'].concat(pts.map(p=>`${p.nombre},${p.E},${p.N},${(p.cota!==null&&p.cota!==undefined)?p.cota:''}`));
    addCSVButton(box, base+'.csv', csv.join('\n'));
    addExportButtons(box, base, {
      dxf: ()=> coordsToDXFPolyline(pe.map(p=>p.e), pe.map(p=>p.n), true),
      kml: ()=> coordsToKMLPolygon(pe.map(p=>p.e), pe.map(p=>p.n), pts[0].huso, pts[0].hemi, g)
    });
    const bA = document.createElement('button');
    bA.type='button'; bA.className='btn-sm'; bA.style.cssText='margin-top:8px;margin-left:8px;';
    bA.textContent='Abrir en Área por Coordenadas';
    bA.addEventListener('click', ()=>{ areaGrupoPendiente = g; flujoRetorno = 'flujoPredio'; go('area'); });
    box.appendChild(bA);
  };
  if(sel){ sel.addEventListener('change', resumen); resumen(); }
}

const RENDERERS = { flujoPredio: renderFlujoPredio };
