"use strict";
/* Herramienta «Conversor de Distancia (Ley 1848)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
const LENGTH_UNITS = { m:1, km:1000, dm:0.1, cm:0.01, mm:0.001, vara:0.836, pie:0.279, cuadra:125.39 };
function convertLength(value, fromUnit, toUnit){
  return (value*LENGTH_UNITS[fromUnit])/LENGTH_UNITS[toUnit];
}
function renderConversorDistancia(){
  const unitLabel = {m:'m', km:'km', dm:'dm', cm:'cm', mm:'mm', vara:'vara', pie:'pié', cuadra:'cuadra'};
  const opts = (sel)=> Object.keys(unitLabel).map(k=>`<option value="${k}"${k===sel?' selected':''}>${unitLabel[k]}</option>`).join('');
  const body = `<div class="field-card">
    ${fieldRow('Valor','ud_val',1)}
    <div class="field-inline2">
      <div class="field-row"><label>Desde</label><select id="ud_from">${opts('m')}</select></div>
      <div class="field-row"><label>Hacia</label><select id="ud_to">${opts('vara')}</select></div>
    </div>
    <button class="btn" id="btnUD" type="button">Convertir</button>
    <div id="resUD"></div>
  </div>`;
  toolShell('conversorDistancia','Conversión entre unidades métricas de longitud y las unidades legales chilenas (vara, pié, cuadra) según la Ley S/N de 29-ene-1848 sobre Pesos i Medidas, Art. 14: 1 vara=0,836 m, 1 pié=0,279 m, 1 cuadra=125,39 m (Biblioteca del Congreso Nacional).', body);
  document.getElementById('btnUD').addEventListener('click', ()=>{
    const v=val('ud_val'); const from=document.getElementById('ud_from').value, to=document.getElementById('ud_to').value;
    const box=document.getElementById('resUD');
    if(isNaN(v)){ box.innerHTML=`<p class="err-msg">Ingresa un valor.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Resultado</span><span class="v accent big">${fmtNumTrim(convertLength(v,from,to),3)} ${unitLabel[to]}</span></div></div>`;
  });
}

const RENDERERS = { conversorDistancia: renderConversorDistancia };
