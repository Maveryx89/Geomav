"use strict";
/* Herramienta «Nivelación Barométrica»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcNivelBarometrica(P1,P2,T1,T2){
  const Tm=(T1+T2)/2;
  const desnivel = 18400*(1+Tm/273)*Math.log10(P1/P2);
  return {Tm, desnivel};
}
function renderNivelBaro(){
  const body = `<div class="field-card">
    <div class="field-inline2">${fieldRow('Presión en punto 1 (hPa)','nb_p1',1013.25)}${fieldRow('Presión en punto 2 (hPa)','nb_p2',1001.30)}</div>
    <div class="field-inline2">${fieldRow('Temperatura en punto 1 (°C)','nb_t1',15)}${fieldRow('Temperatura en punto 2 (°C)','nb_t2',15)}</div>
    <button class="btn" id="btnNB" type="button">Calcular</button>
    <div id="resNB"></div>
  </div>`;
  toolShell('nivelBaro','Desnivel aproximado entre dos puntos a partir de la presión atmosférica (fórmula hipsométrica) — útil para reconocimientos rápidos donde no hay línea de vista para nivelar.', body);
  document.getElementById('btnNB').addEventListener('click', ()=>{
    const P1=val('nb_p1'), P2=val('nb_p2'), T1=val('nb_t1'), T2=val('nb_t2');
    const box=document.getElementById('resNB');
    if([P1,P2,T1,T2].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa presiones y temperaturas.</p>`; return; }
    const r = calcNivelBarometrica(P1,P2,T1,T2);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Temperatura media</span><span class="v">${fmtNum(r.Tm,2)} °C</span></div>
      <div class="result-row"><span class="k">Desnivel aproximado</span><span class="v accent big">${fmtNum(r.desnivel,2)} m</span></div>
      <p class="hint" style="margin-top:8px;">Fórmula hipsométrica aproximada — precisión referencial, no reemplaza nivelación geométrica.</p>
    </div>`;
  });
}

const RENDERERS = { nivelBaro: renderNivelBaro };
