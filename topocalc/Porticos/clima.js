/* Clima por sector — Open-Meteo (sin clave). Solo lectura: no escribe en la planilla. */
(function(){
  var URL_API = "https://api.open-meteo.com/v1/forecast", LS = "porticos_clima_v2", TTL = 2 * 3600e3;
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
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&timezone=America%2FSantiago&forecast_days=7";
    pend = fetch(q).then(function(r){ if(!r.ok) throw new Error("clima " + r.status); return r.json(); }).then(function(j){
      var arr = Array.isArray(j) ? j : [j];
      arr.forEach(function(x, i){
        if(!(x && x.daily)) return; var dd = x.daily, hh = x.hourly, hs = {};
        if(hh && hh.time) hh.time.forEach(function(t, n){ var hr = +t.slice(11, 13); if(hr < 7 || hr > 19) return; var dk = t.slice(0, 10); (hs[dk] = hs[dk] || []).push([hr, hh.temperature_2m[n], hh.precipitation_probability[n], hh.relative_humidity_2m[n], hh.weather_code[n]]); });
        dd.hrs = hs; cache[ks[i]] = dd; });
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
      dias += '<div class="wx-d' + (lluvioso(y) ? " wx-ll" : "") + '" data-wx="' + key(p.lat, p.lng) + '|' + iso + '"><b>' + DS[dt.getDay()] + '</b>' + icono(y.code, 26) + '<span>' + Math.round(y.max) + '° / ' + Math.round(y.min) + '°</span><em>' + Math.round(y.pp || 0) + ' %</em></div>';
    }
    return '<div class="wx-box"><div class="wx-t">Clima en el sector</div>'
      + '<div class="wx-hoy" data-wx="' + key(p.lat, p.lng) + '|' + h + '">' + icono(x.code, 44) + '<div class="wx-tp"><b>' + Math.round(x.max) + '° / ' + Math.round(x.min) + '°</b><span>' + esc(txt(x.code)) + ' · Hoy</span></div>'
      + '<div class="wx-vv"><span>💨 ' + Math.round(x.v) + ' km/h ' + brujula(x.dir) + '</span><span>💧 Lluvia ' + Math.round(x.pp || 0) + ' % · UV ' + Math.round(x.uv || 0) + '</span></div></div>'
      + '<div class="wx-dias">' + dias + '</div>'
      + (lluvioso(x) || aviso.length ? '<div class="wx-av">⚠ ' + (lluvioso(x) ? "Hoy" + (aviso.length ? " y " : "") : "") + aviso.join(" y ") + ': lluvia probable · evaluar excavación y hormigonado</div>' : '')
      + '<div class="wx-f">Fuente: Open-Meteo · <a href="' + ALERTAS + '" target="_blank" rel="noopener">alertas oficiales DMC ↗</a></div></div>';
  }
  /* ---- franja compacta de la semana (popup del mapa) ---- */
  function franja(p){
    var d = datos(p), h = hoyISO(); if(!d) return "";
    var o = "";
    for(var k = 0; k < 5; k++){
      var iso = sumar(h, k), y = dia(d, iso); if(!y) continue;
      var dt = new Date(iso + "T12:00:00");
      o += '<span class="wx-m' + (lluvioso(y) ? " wx-ll" : "") + '" data-wx="' + key(p.lat, p.lng) + '|' + iso + '"><b>' + (k ? DS[dt.getDay()] : "Hoy") + '</b>' + icono(y.code, 16) + '<i>' + Math.round(y.max) + '\u00b0</i></span>';
    }
    return o ? '<div class="wx-fr">' + o + '</div>' : "";
  }
  /* ---- celda compacta (Estado actual) ---- */
  function celda(p){ var x = dia(datos(p), hoyISO()); if(!x) return '<span class="wx-c wx-nd">—</span>'; return '<span class="wx-c' + (lluvioso(x) ? " wx-ll" : "") + '" data-wx="' + key(p.lat, p.lng) + '|' + hoyISO() + '">' + icono(x.code, 20) + '<b>' + Math.round(x.max) + '°</b><i>' + Math.round(x.pp || 0) + ' %</i></span>'; }

  /* ---- tablero semanal: clima por día en el encabezado y gota en tareas ---- */
  function tablero(root){
    var c = centro(); if(!c || !root) return;
    var d = cache[key(c.lat, c.lng)];
    Array.prototype.forEach.call(root.querySelectorAll("[data-wxd]"), function(el){
      var x = dia(d, el.getAttribute("data-wxd"));
      if(el.classList.contains("wx-hd")){ el.innerHTML = x ? icono(x.code, 18) + '<b>' + Math.round(x.max) + '°</b><i>💧' + Math.round(x.pp || 0) + '%</i>' : ""; el.setAttribute("data-wx", key(c.lat, c.lng) + "|" + el.getAttribute("data-wxd")); el.setAttribute("data-wxc", "1"); el.classList.toggle("wx-ll", lluvioso(x)); }
      else el.classList.toggle("wx-rain", !!(lluvioso(x) && el.getAttribute("data-hn") === "1"));
    });
  }

  /* ---- detalle del día: al pasar el mouse (escritorio) o al tocar ---- */
  var tip = null, tipEl = null;
  var MESN = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"], DSL = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  function consejo(x){
    var a = [];
    if(x.pp >= 50) a.push("Lluvia probable: evaluar excavación, emplantillado y hormigonado.");
    else if(x.pp >= 30) a.push("Posibilidad de lluvia: tener plan alternativo.");
    if(x.v >= 40) a.push("Viento fuerte: cuidado con izajes y maniobras."); else if(x.v >= 25) a.push("Viento moderado a fuerte.");
    if(x.uv >= 8) a.push("UV muy alto: protección solar y pausas.");
    if(x.max >= 30) a.push("Calor: hidratación y pausas.");
    if(x.min <= 3) a.push("Riesgo de helada: cuidar el curado del hormigón.");
    return a.length ? a.join(" ") : "Sin alertas de clima para las faenas.";
  }
  function horas(d, iso){
    var hs = d && d.hrs && d.hrs[iso]; if(!hs || !hs.length) return "";
    return '<div class="wx-hrs"><div class="wx-hr wx-hh"><span>Hora</span><span></span><span>Temp.</span><span>Lluvia</span><span class="wx-hu">Humedad</span></div>' + hs.map(function(r){
      return '<div class="wx-hr' + (r[2] >= 50 ? " wx-hl" : "") + '"><span>' + ("0" + r[0]).slice(-2) + ':00</span>' + icono(r[4], 15) + '<b>' + Math.round(r[1]) + '°</b><span class="wx-pp">' + (r[2] >= 5 ? '💧 ' + Math.round(r[2]) + ' %' : '') + '</span><span class="wx-hu">' + Math.round(r[3]) + ' %</span></div>'; }).join("") + '</div>';
  }
  function detalle(v, centroF){
    var pr = v.split("|"), x = dia(cache[pr[0]], pr[1]); if(!x) return "";
    var dt = new Date(pr[1] + "T12:00:00"), dn = DSL[dt.getDay()];
    return '<div class="wx-tp-h">' + icono(x.code, 30) + '<div><b>' + dn.charAt(0).toUpperCase() + dn.slice(1) + ' ' + dt.getDate() + ' de ' + MESN[dt.getMonth()] + '</b><span>' + esc(txt(x.code)) + (centroF ? ' · centro de los pórticos' : '') + '</span></div></div>'
      + '<dl><dt>Máxima / mínima</dt><dd>' + Math.round(x.max) + '° / ' + Math.round(x.min) + '°</dd><dt>Prob. de lluvia</dt><dd>' + Math.round(x.pp || 0) + ' %</dd><dt>Viento máx.</dt><dd>' + Math.round(x.v) + ' km/h ' + brujula(x.dir) + '</dd><dt>Índice UV</dt><dd>' + Math.round(x.uv || 0) + '</dd></dl>'
      + horas(cache[pr[0]], pr[1]) + '<small>Pronóstico Open-Meteo · alertas oficiales: DMC</small>';
  }
  function cerrar(){ if(tipEl){ tipEl.remove(); tipEl = null; tip = null; } }
  function abrir(el){
    var v = el.getAttribute("data-wx"); if(!v || tip === el) return;
    var h = detalle(v, el.hasAttribute("data-wxc")); if(!h) return; cerrar();
    tipEl = document.createElement("div"); tipEl.className = "wx-tip"; tipEl.innerHTML = h; document.body.appendChild(tipEl); tip = el;
    var r = el.getBoundingClientRect(), w = tipEl.offsetWidth, hh = tipEl.offsetHeight;
    var x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)), y = r.bottom + 6; if(y + hh > innerHeight - 8) y = Math.max(8, r.top - hh - 6);
    tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
  }
  var fino = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
  document.addEventListener("mouseover", function(e){ if(!fino) return; var t = e.target.closest ? e.target : e.target.parentElement, el = t && t.closest("[data-wx]"); if(el) abrir(el); else if(tip && !(t && t.closest(".wx-tip"))) cerrar(); }, true);
  document.addEventListener("click", function(e){ var t = e.target.closest ? e.target : e.target.parentElement, el = t && t.closest("[data-wx]"); if(el){ if(tip === el && !fino) cerrar(); else abrir(el); } else if(!(t && t.closest(".wx-tip"))) cerrar(); }, true);
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") cerrar(); });
  window.addEventListener("scroll", cerrar, true);
  function iniciar(){ var l = lista(), c = centro(); var pts = l.slice(); if(c) pts.push(c); return pedir(pts); }
  window.PORTICOS_CLIMA = { pedir:pedir, iniciar:iniciar, bloque:bloque, franja:franja, celda:celda, tablero:tablero, datos:datos, dia:dia, centro:centro, hoyISO:hoyISO, icono:icono, txt:txt, lluvioso:lluvioso, brujula:brujula, sumar:sumar, DS:DS, cache:function(){ return cache; }, alertas:ALERTAS,
    alCambiar:function(f){ listeners.push(f); } };
})();
