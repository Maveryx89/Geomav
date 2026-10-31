"use strict";
/* Herramienta «Conversor de Superficie»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
const SURFACE_UNITS = { m2:1, ha:10000, km2:1000000, acre:4046.8564224, varaCuad:0.699, pieCuad:0.0776, cuadraCuad:15721 };
function convertSurface(value, fromUnit, toUnit){
  return (value*SURFACE_UNITS[fromUnit])/SURFACE_UNITS[toUnit];
}
function renderUnidadesAgrarias(){
  const unitLabel = {m2:'m²', ha:'ha', km2:'km²', acre:'acre', varaCuad:'vara²', pieCuad:'pié²', cuadraCuad:'cuadra²'};
  const opts = (sel)=> Object.keys(unitLabel).map(k=>`<option value="${k}"${k===sel?' selected':''}>${unitLabel[k]}</option>`).join('');
  const body = `<div class="field-card">
    ${fieldRow('Valor','ua_val',1)}
    <div class="field-inline2">
      <div class="field-row"><label>Desde</label><select id="ua_from">${opts('ha')}</select></div>
      <div class="field-row"><label>Hacia</label><select id="ua_to">${opts('m2')}</select></div>
    </div>
    <button class="btn" id="btnUA" type="button">Convertir</button>
    <div id="resUA"></div>
  </div>`;
  toolShell('unidadesAgrarias','Conversión entre unidades de superficie, incluyendo las medidas agrarias legales chilenas (vara², pié², cuadra²) según la Ley S/N de 29-ene-1848 sobre Pesos i Medidas, Art. 14 (Biblioteca del Congreso Nacional).', body);
  document.getElementById('btnUA').addEventListener('click', ()=>{
    const v=val('ua_val'); const from=document.getElementById('ua_from').value, to=document.getElementById('ua_to').value;
    const box=document.getElementById('resUA');
    if(isNaN(v)){ box.innerHTML=`<p class="err-msg">Ingresa un valor.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Resultado</span><span class="v accent big">${fmtNumTrim(convertSurface(v,from,to),4)} ${unitLabel[to]}</span></div></div>`;
  });
}

const RENDERERS = { unidadesAgrarias: renderUnidadesAgrarias };
