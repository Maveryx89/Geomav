"use strict";
/* Herramienta «Nivelación Trigonométrica»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcNivelacionTrig(D,anguloDeg,hi,hm){
  const a = toRad(anguloDeg);
  return {desnivel: D*Math.tan(a) + hi - hm};
}
function calcCurvaturaRefraccion(D_m){
  const Dkm = D_m/1000;
  return 0.0675*Dkm*Dkm; // metros, correccion combinada (curvatura - refraccion), valida para D en km
}
function renderNivel(){
  const body = `<div class="field-card">
    <div class="field-row"><label>Tipo de distancia ingresada</label>
      <select id="n_modo"><option value="h" selected>Horizontal</option><option value="i">Inclinada (a lo largo de la visual)</option></select>
    </div>
    ${fieldRow('Distancia (m)','n_d',85.4)}
    ${fieldRow(`Ángulo vertical ${angleSimpleLabel()}, desde horizonte`,'n_ang',angleSimpleDefault(6.2))}
    ${fieldRow('Altura del instrumento (m)','n_hi',1.52)}
    ${fieldRow('Altura de mira/señal (m)','n_hm',1.80)}
    <div class="field-row" style="flex-direction:row; align-items:center; gap:8px;">
      <input type="checkbox" id="n_cr" style="width:auto;">
      <label for="n_cr" style="margin:0;">Aplicar corrección por curvatura y refracción (visuales &gt; 300 m)</label>
    </div>
    <button class="btn" id="btnN" type="button">Calcular</button>
    <div id="resN"></div>
  </div>`;
  toolShell('nivel','Desnivel entre dos puntos por trigonometría — distancia horizontal o inclinada, ángulo vertical, altura de instrumento y de mira. Corresponde a los tres métodos clásicos de nivelación trigonométrica.', body, ['HI']);
  document.getElementById('btnN').addEventListener('click', ()=>{
    const modo=document.getElementById('n_modo').value;
    const Din=val('n_d'), ang=readAngleSimple('n_ang'), hi=val('n_hi'), hm=val('n_hm'), aplicarCR=document.getElementById('n_cr').checked;
    const box=document.getElementById('resN');
    if([Din,ang,hi,hm].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const D = modo==='i' ? Din*Math.cos(toRad(ang)) : Din;
    const r = calcNivelacionTrig(D,ang,hi,hm);
    let desnivel = r.desnivel;
    let crRow = '';
    if(aplicarCR){
      const cr = calcCurvaturaRefraccion(D);
      desnivel += cr;
      crRow = `<div class="result-row"><span class="k">Corrección curvatura+refracción</span><span class="v">+${fmtNum(cr,4)} m</span></div>`;
    }
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Distancia horizontal usada</span><span class="v">${fmtNum(D,3)} m</span></div>
      ${crRow}
      <div class="result-row"><span class="k">Desnivel</span><span class="v accent big">${fmtNum(desnivel,3)} m</span></div>
      <div class="plot-wrap">${svgTrianguloVertical(ang, D, hi, hm, desnivel, {Di:D/Math.max(Math.cos(toRad(ang)),1e-9)})}</div>
    </div>`;
  });
}

const RENDERERS = { nivel: renderNivel };
