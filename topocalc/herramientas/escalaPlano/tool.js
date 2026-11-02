"use strict";
/* Herramienta «Escala de Plano»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcEscalaDesdeDistancias(distReal_m, distPlano_cm){ return (distReal_m*100)/distPlano_cm; }
function calcDistanciaPlanoDesdeEscala(escalaN, distReal_m){ return (distReal_m*100)/escalaN; }
function renderEscalaPlano(){
  const body = `
  <div class="field-card">
    ${fieldRow('Distancia real (m)','ep_real',250)}
    ${fieldRow('Distancia en el plano (cm)','ep_plano',5)}
    ${fieldRow('Escala (1:n)','ep_n',5000)}
  </div>`;
  toolShell('escalaPlano','Relación entre una distancia real y su representación en un plano o mapa (escala = distancia real ÷ distancia en el plano).', body);
  const realEl=document.getElementById('ep_real'), planoEl=document.getElementById('ep_plano'), nEl=document.getElementById('ep_n');
  let updating=false;
  // Regla fija (sin estado oculto de "qué se editó antes", para que el resultado sea siempre
  // predecible): Distancia real y Distancia en el plano son las 2 magnitudes medidas — al tocar
  // cualquiera de las 2 se recalcula la Escala a partir de ambas. La Escala es la magnitud derivada:
  // al tocarla se recalcula la Distancia en el plano, manteniendo fija la Distancia real (mismo
  // criterio que la 3ª tarjeta del diseño anterior: "Escala + distancia real → Distancia en el plano").
  const roundNum = (v,d)=> Math.round(v*Math.pow(10,d))/Math.pow(10,d);
  function recalcularEscala(){
    if(updating) return;
    const real=val('ep_real'), plano=val('ep_plano');
    if(isNaN(real)||isNaN(plano)||plano<=0) return;
    updating=true;
    nEl.value = roundNum(calcEscalaDesdeDistancias(real,plano),2);
    updating=false;
  }
  function recalcularPlano(){
    if(updating) return;
    const n=val('ep_n'), real=val('ep_real');
    if(isNaN(n)||isNaN(real)||n<=0) return;
    updating=true;
    planoEl.value = roundNum(calcDistanciaPlanoDesdeEscala(n,real),4);
    updating=false;
  }
  realEl.addEventListener('input', recalcularEscala);
  planoEl.addEventListener('input', recalcularEscala);
  nEl.addEventListener('input', recalcularPlano);
}

const RENDERERS = { escalaPlano: renderEscalaPlano };
