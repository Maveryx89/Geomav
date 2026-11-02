"use strict";
/* Módulo compartido del grupo «Fotogrametría y Astronomía».
   Generado a partir del index.html monolítico de topocalc. */
function calcGSD(alturaVuelo_m, anchoSensor_mm, distFocal_mm, anchoImagen_px){
  return (alturaVuelo_m * anchoSensor_mm * 100) / (distFocal_mm * anchoImagen_px); // cm/px
}
