"use strict";
/* Herramienta «Conversor de Temperatura»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function cToF(c){ return c*9/5+32; }
function fToC(f){ return (f-32)*5/9; }
function renderTemperatura(){
  const body = `
  <div class="field-card">
    <h3>Celsius → Fahrenheit</h3>
    ${fieldRow('°C','tc_c',20)}
    <button class="btn" id="btnTC" type="button">Convertir</button>
    <div id="resTC"></div>
  </div>
  <div class="field-card">
    <h3>Fahrenheit → Celsius</h3>
    ${fieldRow('°F','tc_f',68)}
    <button class="btn" id="btnTF" type="button">Convertir</button>
    <div id="resTF"></div>
  </div>`;
  toolShell('temperatura','Conversión entre grados Celsius y Fahrenheit — útil para la corrección de cintas por temperatura.', body);
  document.getElementById('btnTC').addEventListener('click', ()=>{
    const c=val('tc_c'); const box=document.getElementById('resTC');
    if(isNaN(c)){ box.innerHTML=`<p class="err-msg">Ingresa un valor.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Resultado</span><span class="v accent big">${fmtNum(cToF(c),2)} °F</span></div></div>`;
  });
  document.getElementById('btnTF').addEventListener('click', ()=>{
    const f=val('tc_f'); const box=document.getElementById('resTF');
    if(isNaN(f)){ box.innerHTML=`<p class="err-msg">Ingresa un valor.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;"><div class="result-row"><span class="k">Resultado</span><span class="v accent big">${fmtNum(fToC(f),2)} °C</span></div></div>`;
  });
}

const RENDERERS = { temperatura: renderTemperatura };
