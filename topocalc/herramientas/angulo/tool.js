"use strict";
/* Herramienta «Conversor de Ángulos»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function renderAngulo(){
  const body = `
  <div class="field-card">
    <h3>Escribe en cualquiera de los 3 — los otros se actualizan solos</h3>
    <div class="field-inline">
      ${fieldRow('Grados','au_d',45)}
      ${fieldRow('Minutos','au_m',15)}
      ${fieldRow('Segundos','au_s',12.96)}
    </div>
    ${fieldRow('Grados decimales (°)','au_dec',45.2536)}
    ${fieldRow('Centesimal (gon)','au_gon',50.28178)}
  </div>`;
  toolShell('angulo','Convierte un ángulo entre los tres sistemas: sexagesimal (° \' "), grados decimales y centesimal (gon) — el que usan la mayoría de las estaciones totales. Escribe en cualquier campo y los demás se completan de inmediato.', body);
  const dEl=document.getElementById('au_d'), mEl=document.getElementById('au_m'), sEl=document.getElementById('au_s');
  const decEl=document.getElementById('au_dec'), gonEl=document.getElementById('au_gon');
  let updating=false;
  // <input type="number"> solo acepta punto decimal; fmtNum() usa coma (formato chileno) y el
  // navegador rechaza el valor en silencio. Para escribir en estos campos se usa un número plano.
  const roundNum = (v,d)=> Math.round(v*Math.pow(10,d))/Math.pow(10,d);
  function fromDMS(){
    if(updating) return;
    const d=val('au_d'), m=val('au_m'), s=val('au_s');
    if([d,m,s].some(isNaN)) return;
    updating=true;
    const dec = dmsToDec((d<0||Object.is(d,-0))?-1:1, Math.abs(d), m, s);
    decEl.value = roundNum(dec,6);
    gonEl.value = roundNum(degToGon(dec),6);
    updating=false;
  }
  function fromDec(){
    if(updating) return;
    const dec=val('au_dec');
    if(isNaN(dec)) return;
    updating=true;
    const {sign,d,m,s} = decToDMS(dec);
    dEl.value = (sign<0 && (d||m||s)) ? '-'+d : d; mEl.value=m; sEl.value=roundNum(s,3);
    gonEl.value = roundNum(degToGon(dec),6);
    updating=false;
  }
  function fromGon(){
    if(updating) return;
    const g=val('au_gon');
    if(isNaN(g)) return;
    updating=true;
    const dec = gonToDeg(g);
    const {sign,d,m,s} = decToDMS(dec);
    dEl.value = (sign<0 && (d||m||s)) ? '-'+d : d; mEl.value=m; sEl.value=roundNum(s,3);
    decEl.value = roundNum(dec,6);
    updating=false;
  }
  [dEl,mEl,sEl].forEach(el=>el.addEventListener('input', fromDMS));
  decEl.addEventListener('input', fromDec);
  gonEl.addEventListener('input', fromGon);
}

const RENDERERS = { angulo: renderAngulo };
