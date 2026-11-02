"use strict";
/* Herramienta «Cotización de Trabajo»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCotizacion(costoBrigadaDia, dias, materiales, movilizacion, margenPct, ivaPct){
  const costoDirecto = costoBrigadaDia*dias + (materiales||0) + (movilizacion||0);
  const utilidad = costoDirecto*(margenPct/100);
  const neto = costoDirecto + utilidad;
  const iva = neto*(ivaPct/100);
  const total = neto + iva;
  return {costoDirecto, utilidad, neto, iva, total};
}
function renderCotizacion(){
  const body = `<div class="field-card">
    ${fieldRow('Costo de la brigada por día ($)','cz_dia',300000)}
    ${fieldRow('Días estimados de trabajo','cz_dias',3)}
    ${fieldRow('Materiales / insumos ($)','cz_mat',30000)}
    ${fieldRow('Movilización ($)','cz_mov',40000)}
    ${fieldRow('Margen de utilidad (%)','cz_margen',30)}
    ${fieldRow('IVA (%)','cz_iva',19)}
    <button class="btn" id="btnCZ" type="button">Calcular</button>
    <div id="resCZ"></div>
  </div>`;
  toolShell('cotizacion','Precio a cobrar por un trabajo de topografía: parte del costo diario de tu brigada (calculado en "Costo de Brigada"), suma materiales y movilización, aplica tu margen de utilidad y el IVA.', body);
  document.getElementById('btnCZ').addEventListener('click', ()=>{
    const dia=val('cz_dia'), dias=val('cz_dias'), mat=val('cz_mat'), mov=val('cz_mov'), marg=val('cz_margen'), iva=val('cz_iva');
    const box=document.getElementById('resCZ');
    if([dia,dias,mat,mov,marg,iva].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcCotizacion(dia,dias,mat,mov,marg,iva);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Costo directo</span><span class="v">$${fmtNum(r.costoDirecto,0)}</span></div>
      <div class="result-row"><span class="k">Utilidad</span><span class="v">$${fmtNum(r.utilidad,0)}</span></div>
      <div class="result-row"><span class="k">Neto</span><span class="v">$${fmtNum(r.neto,0)}</span></div>
      <div class="result-row"><span class="k">IVA</span><span class="v">$${fmtNum(r.iva,0)}</span></div>
      <div class="result-row"><span class="k">Total a cobrar</span><span class="v accent big">$${fmtNum(r.total,0)}</span></div>
    </div>`;
  });
}

const RENDERERS = { cotizacion: renderCotizacion };
