/* Definición única del "estado de los pórticos" (la usan la app y el informe).
   Partida EJECUTADA = fila de Programación con estado "Ejecutado"  O  registro de Avance al 100 % (o sin %).
   Los avances parciales (< 100 %) no cuentan como ejecutados.
   Conteo acumulado: cada partida cuenta los pórticos cuyo nivel ejecutado más alto llega a esa partida o la supera.
   "Sin iniciar" = pórticos sin ninguna partida ejecutada. */
(function(){
  function ejecutadas(orden, prog, avance){
    var ej = {};
    (prog || []).forEach(function(r){
      if(/^ejecutado/i.test(r.estado || "") && orden.indexOf(r.partida) >= 0){ var k = String(r.portico) + "|" + r.partida; if(!ej[k] || r.fecha < ej[k]) ej[k] = r.fecha; }
    });
    (avance || []).forEach(function(a){
      if(orden.indexOf(a.partida) < 0) return;
      if(a.avance !== "" && a.avance != null && parseFloat(a.avance) < 100) return;
      var k = String(a.portico) + "|" + a.partida;
      if(!ej[k] || a.fecha < ej[k]) ej[k] = a.fecha;
    });
    return ej;
  }
  function conteo(nums, orden, ej){
    var nivel = {}, dist = orden.map(function(){ return 0; }), sin = 0;
    nums.forEach(function(n){
      var m = -1; orden.forEach(function(q, i){ if(ej[n + "|" + q]) m = i; });
      nivel[n] = m;
      if(m < 0) sin++; else for(var x = 0; x <= m; x++) dist[x]++;
    });
    return { nivel:nivel, dist:dist, sin:sin };
  }
  window.PORTICOS_ESTADO = { ejecutadas:ejecutadas, conteo:conteo };
})();
