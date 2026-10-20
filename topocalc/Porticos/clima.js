/* Clima por sector — Open-Meteo (sin clave). Solo lectura: no escribe en la planilla. */
(function(){
  var URL_API = "https://api.open-meteo.com/v1/forecast", LS = "porticos_clima_v1", TTL = 2 * 3600e3;
  var cache = {}, pend = null, listeners = [];
  try{ var s = JSON.parse(localStorage.getItem(LS) || "{}"); if(s && s.t && Date.now() - s.t < TTL) cache = s.d || {}; }catch(e){}
  function guardar(){ try{ localStorage.setItem(LS, JSON.stringify({ t:Date.now(), d:cache })); }catch(e){} }
  function key(lat, lng){ return (Math.round(lat * 10) / 10).toFixed(1) + "," + (Math.round(lng * 10) / 10).toFixed(1); }
  function lista(){ return (window.PORTICOS_LISTA || []).filter(function(p){ return typeof p.lat === "number" && typeof p.lng === "number" && isFinite(p.lat) && isFinite(p.lng); }); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }
  function centro(){ var l = lista(); if(!l.length) return null; var a = 0, o = 0; l.forEach(function(p){ a += p.lat; o += p.lng; }); return { lat:a / l.length, lng:o / l.length }; }

  /* ---- descarga por lotes (una llamada con todas las coordenadas redondeadas a 0,1°) ---- */
  function pedir(pts){
    var falta = {}; pts.forEach(function(p){ var k = key(p.lat, p.lng); if(!cache[k]) falta[k] = 1; });
    var ks = Object.keys(falta); if(!ks.length) return Promise.resolve();
    if(pend) return pend;
    var q = URL_API + "?latitude=" + ks.map(function(k){ return k.split(",")[0]; }).join(",") + "&longitude=" + ks.map(function(k){ return k.split(",")[1]; }).join(",")
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max&timezone=America%2FSantiago&forecast_days=7";
    pend = fetch(q).then(function(r){ if(!r.ok) throw new Error("clima " + r.status); return r.json(); }).then(function(j){
      var arr = Array.isArray(j) ? j : [j];
      arr.forEach(function(x, i){ if(x && x.daily) cache[ks[i]] = x.daily; });
      guardar();
    }).catch(function(){}).then(function(){ pend = null; listeners.forEach(function(f){ try{ f(); }catch(e){} }); });
    return pend;
  }
  function datos(p){ return p && typeof p.lat === "number" ? cache[key(p.lat, p.lng)] || null : null; }
  function dia(d, iso){ if(!d) return null; var i = d.time.indexOf(iso); if(i < 0) return null; return { i:i, code:d.weather_code[i], max:d.temperature_2m_max[i], min:d.temperature_2m_min[i], pp:d.precipitation_probability_max[i], v:d.wind_speed_10m_max[i], dir:d.wind_direction_10m_dominant[i], uv:d.uv_index_max[i], iso:iso }; }

  /* ---- iconos ---- */
  function tipo(c){ if(c === 0) return "sun"; if(c <= 2) return "psun"; if(c <= 48) return "cloud"; return "rain"; }
  var TXT = { sun:"Despejado", psun:"Parcialmente nublado", cloud:"Nublado", rain:"Lluvia" };
  function txt(c){ if(c >= 95) return "Tormenta"; if(c >= 71 && c <= 77) return "Nieve"; if(c >= 51 && c <= 57) return "Llovizna"; return TXT[tipo(c)]; }
  var SOL = '<circle r="8" fill="#F5B800"/>' + [0,45,90,135,180,225,270,315].map(function(a){ return '<line y1="-12" y2="-16" transform="rotate(' + a + ')" stroke="#E8A300" stroke-width="2.2" stroke-linecap="round"/>'; }).join("");
  function nube(c, t){ return '<path transform="' + (t || "") + '" d="M-15 8a8 8 0 0 1 2-15.6a11 11 0 0 1 21-2a9 9 0 0 1 4 17.6Z" fill="' + c + '"/>'; }
  function icono(code, sz){
    var t = tipo(code), g;
    if(t === "sun") g = SOL; else if(t === "psun") g = '<g transform="translate(-6 -6) scale(.75)">' + SOL + '</g>' + nube("#B7C2CE", "translate(4 4) scale(.9)"); else if(t === "cloud") g = nube("#9AA7B5");
    else g = nube("#7C8CA0", "translate(0 -4)") + [-8, 0, 8].map(function(x){ return '<line x1="' + x + '" y1="10" x2="' + (x - 3) + '" y2="18" stroke="#2F7FD1" stroke-width="2.2" stroke-linecap="round"/>'; }).join("");
    return '<svg class="wx-i" width="' + (sz || 24) + '" height="' + (sz || 24) + '" viewBox="-20 -20 40 40" aria-hidden="true">' + g + '</svg>';
  }
  var PTS = ["N","NE","E","SE","S","SO","O","NO"]; function brujula(d){ return d == null ? "" : PTS[Math.round(d / 45) % 8]; }
  function lluvioso(d){ return d && d.pp != null && d.pp >= 50; }
  var DS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  function isoDe(dt){ return dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2); }
  function hoyISO(){ return isoDe(new Date()); }
  function sumar(iso, n){ var p = iso.split("-"); return isoDe(new Date(+p[0], +p[1] - 1, +p[2] + n)); }
  var ALERTAS = "https://www.meteochile.gob.cl/PortalDMC-web/index.xhtml";

  /* ---- bloque de la ventana del pórtico ---- */
  function bloque(p){
    var d = datos(p), h = hoyISO(), x = dia(d, h);
    if(!d || !x) return '<div class="wx-box wx-vacio"><div class="wx-t">Clima en el sector</div><div class="wx-s">' + (pend ? "Cargando pronóstico…" : "Sin pronóstico por ahora.") + '</div></div>';
    var dias = "", aviso = [];
    for(var k = 1; k <= 5; k++){
      var iso = sumar(h, k), y = dia(d, iso); if(!y) continue;
      var dt = new Date(iso + "T12:00:00");
      if(lluvioso(y)) aviso.push(DS[dt.getDay()]);
      dias += '<div class="wx-d' + (lluvioso(y) ? " wx-ll" : "") + '"><b>' + DS[dt.getDay()] + '</b>' + icono(y.code, 26) + '<span>' + Math.round(y.max) + '° / ' + Math.round(y.min) + '°</span><em>' + Math.round(y.pp || 0) + ' %</em></div>';
    }
    return '<div class="wx-box"><div class="wx-t">Clima en el sector</div>'
      + '<div class="wx-hoy">' + icono(x.code, 44) + '<div class="wx-tp"><b>' + Math.round(x.max) + '° / ' + Math.round(x.min) + '°</b><span>' + esc(txt(x.code)) + ' · Hoy</span></div>'
      + '<div class="wx-vv"><span>💨 ' + Math.round(x.v) + ' km/h ' + brujula(x.dir) + '</span><span>💧 Lluvia ' + Math.round(x.pp || 0) + ' % · UV ' + Math.round(x.uv || 0) + '</span></div></div>'
      + '<div class="wx-dias">' + dias + '</div>'
      + (lluvioso(x) || aviso.length ? '<div class="wx-av">⚠ ' + (lluvioso(x) ? "Hoy" + (aviso.length ? " y " : "") : "") + aviso.join(" y ") + ': lluvia probable · evaluar excavación y hormigonado</div>' : '')
      + '<div class="wx-f">Fuente: Open-Meteo · <a href="' + ALERTAS + '" target="_blank" rel="noopener">alertas oficiales DMC ↗</a></div></div>';
  }
  /* ---- celda compacta (Estado actual) ---- */
  function celda(p){ var x = dia(datos(p), hoyISO()); if(!x) return '<span class="wx-c wx-nd">—</span>'; return '<span class="wx-c' + (lluvioso(x) ? " wx-ll" : "") + '" title="' + esc(txt(x.code)) + ' · viento ' + Math.round(x.v) + ' km/h ' + brujula(x.dir) + '">' + icono(x.code, 20) + '<b>' + Math.round(x.max) + '°</b><i>' + Math.round(x.pp || 0) + ' %</i></span>'; }

  /* ---- tablero semanal: clima por día en el encabezado y gota en tareas ---- */
  function tablero(root){
    var c = centro(); if(!c || !root) return;
    var d = cache[key(c.lat, c.lng)];
    Array.prototype.forEach.call(root.querySelectorAll("[data-wxd]"), function(el){
      var x = dia(d, el.getAttribute("data-wxd"));
      if(el.classList.contains("wx-hd")){ el.innerHTML = x ? icono(x.code, 18) + '<b>' + Math.round(x.max) + '°</b><i>💧' + Math.round(x.pp || 0) + '%</i>' : ""; el.title = x ? txt(x.code) + " · " + Math.round(x.min) + "° / " + Math.round(x.max) + "° · lluvia " + Math.round(x.pp || 0) + " % · viento " + Math.round(x.v) + " km/h (centro de los pórticos)" : ""; el.classList.toggle("wx-ll", lluvioso(x)); }
      else el.classList.toggle("wx-rain", !!(lluvioso(x) && el.getAttribute("data-hn") === "1"));
    });
  }
  function iniciar(){ var l = lista(), c = centro(); var pts = l.slice(); if(c) pts.push(c); return pedir(pts); }
  window.PORTICOS_CLIMA = { pedir:pedir, iniciar:iniciar, bloque:bloque, celda:celda, tablero:tablero, datos:datos, dia:dia, centro:centro, hoyISO:hoyISO, icono:icono, txt:txt, lluvioso:lluvioso, brujula:brujula, sumar:sumar, DS:DS, cache:function(){ return cache; }, alertas:ALERTAS,
    alCambiar:function(f){ listeners.push(f); } };
})();
