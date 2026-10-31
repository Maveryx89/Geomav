"use strict";
/* Herramienta «Área por Coordenadas»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
let areaN = 4;
let areaMetas = [];
function renderArea(){
  const body = `
  <div class="field-row">
    <label>Número de vértices</label>
    <div class="n-stepper">
      <button type="button" id="areaMinus">−</button>
      <span class="n-val" id="areaNVal">${areaN}</span>
      <button type="button" id="areaPlus">+</button>
    </div>
  </div>
  ${grupoSelectHTML('ar_grupo', 3)}
  <div id="areaPoints"></div>
  <button class="btn" id="btnArea" type="button">Calcular Área</button>
  <div id="resArea"></div>`;
  toolShell('area','Área de un polígono a partir de coordenadas Este/Norte ya conocidas, usando la fórmula de Gauss (del hormiguero / shoelace).', body);
  renderAreaPoints();
  document.getElementById('areaMinus').addEventListener('click', ()=>{ if(areaN>3){areaN--; document.getElementById('areaNVal').textContent=areaN; renderAreaPoints();}});
  document.getElementById('areaPlus').addEventListener('click', ()=>{ if(areaN<20){areaN++; document.getElementById('areaNVal').textContent=areaN; renderAreaPoints();}});
  const arG = document.getElementById('ar_grupo');
  if(arG) arG.addEventListener('change', ()=>{ const g = arG.value; arG.value=''; if(g) areaCargarGrupo(g); });
  document.getElementById('btnArea').addEventListener('click', ()=>{
    const pts=[];
    for(let i=0;i<areaN;i++){
      pts.push({e:val(`ar_e_${i}`), n:val(`ar_n_${i}`)});
    }
    const box=document.getElementById('resArea');
    if(pts.some(p=>isNaN(p.e)||isNaN(p.n))){ box.innerHTML=`<p class="err-msg">Completa todas las coordenadas.</p>`; return; }
    const inc = metasIncompatibles(areaMetas); if(inc){ box.innerHTML = msgIncompatibles(inc); return; }
    const r = calcAreaCoords(pts);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Área</span><span class="v accent big">${fmtNum(r.areaHa,4)} ha</span></div>
      <div class="result-row"><span class="k">Área</span><span class="v">${fmtNum(r.areaM2,2)} m²</span></div>
      <div class="plot-wrap">${svgAreaCoordenadas(pts)}</div>
    </div>`;
    const csvRows = ['nombre,este,norte,cota'];
    pts.forEach((p,i)=> csvRows.push(`${POL_LABELS[i]},${p.e},${p.n},`));
    addCSVButton(box, 'area.csv', csvRows.join('\n'));
    addExportButtons(box, 'area', {
      dxf: ()=> coordsToDXFPolyline(pts.map(p=>p.e), pts.map(p=>p.n), true),
      kml: ()=>{ const pr=loadMapaZonaPref(), om=areaMetas.find(Boolean)||{}; return coordsToKMLPolygon(pts.map(p=>p.e), pts.map(p=>p.n), om.huso||pr.zona, om.hemi||pr.hemi, 'Área'); }
    });
  });
  if(areaGrupoPendiente){ const g = areaGrupoPendiente; areaGrupoPendiente = null; if(areaCargarGrupo(g)) document.getElementById('btnArea').click(); }
}
function areaCargarGrupo(g){
  const pts = (gruposLibreta().get(g)||[]).slice(0,20), total = (gruposLibreta().get(g)||[]).length;
  if(pts.length<3) return false;
  areaN = pts.length; document.getElementById('areaNVal').textContent = areaN;
  renderAreaPoints();
  rellenarDesdePuntos(pts, 'ar', areaMetas);
  const msg = document.getElementById('ar_grupo_msg');
  if(msg){ msg.textContent = `Cargado el grupo «${g}»: ${pts.length} vértices` + (total>20 ? ` (de ${total}; la herramienta admite hasta 20)` : '') + '.'; msg.style.margin='0 0 8px'; }
  return true;
}
function renderAreaPoints(){
  const wrap=document.getElementById('areaPoints');
  let html='';
  for(let i=0;i<areaN;i++){
    html += `<div class="station-block">
      <div class="st-label">Vértice ${POL_LABELS[i]} <small id="ar_tag_${i}" style="color:var(--ink-soft);font-weight:400;"></small></div>
      ${libretaCompactoHTML(`ar_lib_${i}`)}
      <div class="field-inline2">
        ${fieldRow('Este',`ar_e_${i}`, round(EJ_E0+i*20,2))}
        ${fieldRow('Norte',`ar_n_${i}`, round(EJ_N0+(i%2===0?i*15:-i*10),2))}
      </div>
    </div>`;
  }
  wrap.innerHTML = html;
  areaMetas = new Array(areaN).fill(null);
  for(let i=0;i<areaN;i++) libretaTraerA(`ar_lib_${i}`, `ar_e_${i}`, `ar_n_${i}`, m=>{ areaMetas[i]=m; }, `ar_tag_${i}`);
}

const RENDERERS = { area: renderArea };
