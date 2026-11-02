"use strict";
/* Herramienta «Boleta de Honorarios e IVA»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcBoletaBrutoALiquido(bruto, tasaPct){
  const retencion = bruto*(tasaPct/100);
  return {retencion, liquido: bruto-retencion};
}
function calcBoletaLiquidoABruto(liquido, tasaPct){
  const bruto = liquido/(1-tasaPct/100);
  return {bruto, retencion: bruto-liquido};
}
function calcIVA(monto, tasaPct, modo){
  if(modo === 'total'){
    const neto = Math.round(monto/(1+tasaPct/100));
    return {neto, iva: monto-neto, total: monto};
  }
  const iva = Math.round(monto*tasaPct/100);
  return {neto: monto, iva, total: monto+iva};
}
function svgBoletaBarra(liquido, retencion){
  const total=liquido+retencion;
  const w=300,h=64,pad=10;
  const barW=w-2*pad;
  const liqW=barW*(liquido/total);
  const retW=barW-liqW;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${pad}" y="14" width="${liqW.toFixed(1)}" height="22" fill="var(--blueprint)" rx="2"/>
    <rect x="${(pad+liqW).toFixed(1)}" y="14" width="${retW.toFixed(1)}" height="22" fill="var(--accent)" rx="2"/>
    <text x="${pad}" y="50" font-size="9" font-family="var(--font-mono)" fill="var(--blueprint)">■ Líquido ${fmtNum(liquido/total*100,1)}%</text>
    <text x="${(pad+barW).toFixed(1)}" y="50" font-size="9" font-family="var(--font-mono)" fill="var(--accent-text)" text-anchor="end">Retención ${fmtNum(retencion/total*100,1)}% ■</text>
  </svg>`;
}
function renderBoletaHonorarios(){
  const body = `
  <div class="bh-grid">
  <div class="field-card">
    <h3>Bruto → Líquido a recibir</h3>
    <div class="field-inline2">
      ${fieldRow('Monto bruto de la boleta ($)','bh_bruto',500000)}
      ${fieldRow('Tasa de retención (%)','bh_tasa1',15.25,{step:'0.01'})}
    </div>
    <button class="btn" id="btnBH1" type="button">Calcular</button>
    <div id="resBH1"></div>
  </div>
  <div class="field-card">
    <h3>Líquido deseado → Bruto a emitir</h3>
    <div class="field-inline2">
      ${fieldRow('Líquido que quieres recibir ($)','bh_liquido',500000)}
      ${fieldRow('Tasa de retención (%)','bh_tasa2',15.25,{step:'0.01'})}
    </div>
    <button class="btn" id="btnBH2" type="button">Calcular</button>
    <div id="resBH2"></div>
  </div>
  <div class="field-card bh-span">
    <h3>IVA — Neto ↔ Total</h3>
    <p class="tool-blurb" style="margin:0 0 8px;">La boleta de honorarios no lleva IVA (lleva retención). El IVA se aplica en facturas y otros documentos afectos: usa esta sección para sacar el neto, el IVA o el total de un cobro.</p>
    <div class="bh-iva-cols">
      <div>
        <div class="field-inline2">
          ${fieldRow('Monto ($)','bh_ivaMonto',500000)}
          ${fieldRow('Tasa de IVA (%)','bh_ivaTasa',19,{step:'0.01'})}
        </div>
        <div class="field-row"><label for="bh_ivaModo">El monto ingresado es</label>
          <select id="bh_ivaModo"><option value="neto" selected>Neto (sin IVA)</option><option value="total">Total (con IVA incluido)</option></select></div>
        <button class="btn" id="btnBH3" type="button">Calcular</button>
      </div>
      <div id="resBH3"></div>
    </div>
  </div>
  </div>`;
  toolShell('boletaHonorarios','Retención de Boleta de Honorarios electrónica en Chile, más cálculo de IVA (19%) para facturas. Retención vigente 2026: 15,25% (sube gradualmente hasta 17% en 2028 según ley) — ajústala si emites en otro año o si eliges retener un % mayor de forma voluntaria.', body);
  document.querySelector('.tool-view').classList.add('tool-2col');
  document.getElementById('btnBH1').addEventListener('click', ()=>{
    const bruto=val('bh_bruto'), tasa=val('bh_tasa1'); const box=document.getElementById('resBH1');
    if(isNaN(bruto)||isNaN(tasa)||bruto<=0||tasa<0){ box.innerHTML=`<p class="err-msg">Ingresa el monto bruto y la tasa.</p>`; return; }
    const {retencion, liquido} = calcBoletaBrutoALiquido(bruto,tasa);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Retención (${fmtNum(tasa,2)}%)</span><span class="v">$${fmtNum(retencion,0)}</span></div>
      <div class="result-row"><span class="k">Líquido a recibir</span><span class="v accent big">$${fmtNum(liquido,0)}</span></div>
      <div class="plot-wrap">${svgBoletaBarra(liquido,retencion)}</div>
    </div>`;
  });
  document.getElementById('btnBH2').addEventListener('click', ()=>{
    const liquido=val('bh_liquido'), tasa=val('bh_tasa2'); const box=document.getElementById('resBH2');
    if(isNaN(liquido)||isNaN(tasa)||liquido<=0||tasa<0){ box.innerHTML=`<p class="err-msg">Ingresa el líquido deseado y la tasa.</p>`; return; }
    const {bruto, retencion} = calcBoletaLiquidoABruto(liquido,tasa);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Monto bruto a emitir</span><span class="v accent big">$${fmtNum(bruto,0)}</span></div>
      <div class="result-row"><span class="k">Retención (${fmtNum(tasa,2)}%)</span><span class="v">$${fmtNum(retencion,0)}</span></div>
      <div class="plot-wrap">${svgBoletaBarra(liquido,retencion)}</div>
    </div>`;
  });
  document.getElementById('btnBH3').addEventListener('click', ()=>{
    const monto=val('bh_ivaMonto'), tasa=val('bh_ivaTasa'), modo=document.getElementById('bh_ivaModo').value;
    const box=document.getElementById('resBH3');
    if(isNaN(monto)||isNaN(tasa)||monto<=0||tasa<0){ box.innerHTML=`<p class="err-msg">Ingresa el monto y la tasa de IVA.</p>`; return; }
    const r = calcIVA(monto,tasa,modo);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Neto (sin IVA)</span><span class="v">$${fmtNum(r.neto,0)}</span></div>
      <div class="result-row"><span class="k">IVA (${fmtNum(tasa,2)}%)</span><span class="v accent">$${fmtNum(r.iva,0)}</span></div>
      <div class="result-row"><span class="k">Total con IVA</span><span class="v accent big">$${fmtNum(r.total,0)}</span></div>
    </div>`;
  });
  document.getElementById('btnBH3').click();   // el IVA aparece calculado desde el inicio (llena la mitad derecha de la tarjeta)
}

const RENDERERS = { boletaHonorarios: renderBoletaHonorarios };
