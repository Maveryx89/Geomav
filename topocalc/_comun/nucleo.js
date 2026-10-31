"use strict";
/* Núcleo común: ángulos, helpers de formulario y SVG, informe, tabla de datos, anuncios y plataforma nativa.
   Generado a partir del index.html monolítico de topocalc. */
"use strict";
const CAP = (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  ? window.Capacitor : null;
const CapGeo = (CAP && CAP.Plugins) ? CAP.Plugins.Geolocation : null;
const esNativo = !!CAP;
if(esNativo && typeof document !== 'undefined'){
  document.addEventListener('DOMContentLoaded', ()=> document.body.classList.add('con-anuncio'));
}
function _adaptarPosNativa(pos){ return pos; }
function geoWatchPosition(onPos, onErr, opts){
  const options = opts || {enableHighAccuracy:true, timeout:15000, maximumAge:0};
  if(CapGeo){
    let watchId = null;
    let limpiado = false;
    CapGeo.watchPosition(options, (pos, err)=>{
      if(limpiado) return;
      if(err){ onErr && onErr(err); return; }
      if(pos) onPos(_adaptarPosNativa(pos));
    }).then(id=>{
      watchId = id;
      if(limpiado && watchId){ CapGeo.clearWatch({id: watchId}); }
    }).catch(err=> onErr && onErr(err));
    return { clear(){ limpiado = true; if(watchId){ CapGeo.clearWatch({id: watchId}); } } };
  }
  if(!navigator.geolocation){ onErr && onErr(new Error('Este navegador no soporta geolocalización.')); return { clear(){} }; }
  const id = navigator.geolocation.watchPosition(onPos, onErr, options);
  return { clear(){ navigator.geolocation.clearWatch(id); } };
}
const CapAdMob = (CAP && CAP.Plugins) ? CAP.Plugins.AdMob : null;
const CapPurchases = (CAP && CAP.Plugins) ? CAP.Plugins.Purchases : null;
const REVENUECAT_API_KEY_ANDROID = 'REEMPLAZAR_CON_TU_API_KEY_DE_REVENUECAT';
const REVENUECAT_ENTITLEMENT_SIN_ANUNCIOS = 'sin_anuncios';
if(CapPurchases){
  CapPurchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID }).catch(()=>{});
}
const ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const SKU_QUITAR_ANUNCIOS = 'quitar_anuncios';
const ADS_CADA_N_APERTURAS = 9;
function loadSinAnuncios(){
  try{ return localStorage.getItem('topocalc-sin-anuncios') === '1'; }catch(e){ return false; }
}
function saveSinAnuncios(v){
  try{ localStorage.setItem('topocalc-sin-anuncios', v ? '1' : '0'); }catch(e){}
}
let sinAnunciosComprado = loadSinAnuncios();
let adsInicializado = false;
let interstitialListo = false;
let ultimaRutaAnuncio = null;
let contadorAperturasHerramienta = 0;
async function precargarIntersticial(){
  if(!CapAdMob || sinAnunciosComprado) return;
  try{ await CapAdMob.prepareInterstitial({adId: ADMOB_INTERSTITIAL_ID, isTesting: true}); interstitialListo = true; }
  catch(e){ interstitialListo = false; }
}
async function mostrarBannerAd(){
  if(!CapAdMob || sinAnunciosComprado) return;
  try{ await CapAdMob.showBanner({adId: ADMOB_BANNER_ID, adSize: 'BANNER', position: 'BOTTOM_CENTER', isTesting: true}); }
  catch(e){}
}
async function ocultarBannerAd(){
  if(!CapAdMob) return;
  try{ await CapAdMob.removeBanner(); }catch(e){}
}
async function initAds(){
  if(!CapAdMob || adsInicializado) return;
  adsInicializado = true;
  try{
    await CapAdMob.initialize({initializeForTesting: true});
    CapAdMob.addListener('interstitialAdLoaded', ()=>{ interstitialListo = true; });
    CapAdMob.addListener('interstitialAdFailedToLoad', ()=>{ interstitialListo = false; });
    CapAdMob.addListener('interstitialAdDismissed', ()=>{ precargarIntersticial(); });
    if(!sinAnunciosComprado){ await mostrarBannerAd(); await precargarIntersticial(); }
  }catch(e){ /* si AdMob falla, la app sigue funcionando normalmente sin anuncios */ }
}
function registrarAperturaParaAnuncios(route){
  if(!CapAdMob || sinAnunciosComprado) return;
  if(route === ultimaRutaAnuncio) return;
  ultimaRutaAnuncio = route;
  if(!RENDERERS[route]) return; // no cuenta la pantalla de inicio
  contadorAperturasHerramienta++;
  if(contadorAperturasHerramienta >= ADS_CADA_N_APERTURAS){
    contadorAperturasHerramienta = 0;
    if(interstitialListo){ interstitialListo = false; CapAdMob.showInterstitial().catch(()=>{}); }
  }
}
async function comprobarCompraSinAnuncios(){
  if(!CapPurchases) return;
  try{
    const { customerInfo } = await CapPurchases.getCustomerInfo();
    const tiene = !!(customerInfo && customerInfo.entitlements && customerInfo.entitlements.active && customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_SIN_ANUNCIOS]);
    if(tiene) activarSinAnuncios();
  }catch(e){}
}
function activarSinAnuncios(){
  sinAnunciosComprado = true;
  saveSinAnuncios(true);
  ocultarBannerAd();
  const btn = document.getElementById('btnQuitarAnuncios');
  if(btn) btn.style.display = 'none';
}
async function comprarQuitarAnuncios(onResult){
  if(!CapPurchases){
    onResult({ok:false, msg:'Las compras solo están disponibles en la app instalada desde Google Play, no en el navegador.'});
    return;
  }
  try{
    const { products } = await CapPurchases.getProducts({ productIdentifiers: [SKU_QUITAR_ANUNCIOS], type: 'inapp' });
    if(!products || !products.length){
      onResult({ok:false, msg:'No se pudo cargar el producto. Intenta más tarde.'});
      return;
    }
    const { customerInfo } = await CapPurchases.purchaseStoreProduct({ product: products[0] });
    const activo = !!(customerInfo && customerInfo.entitlements && customerInfo.entitlements.active && customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_SIN_ANUNCIOS]);
    if(activo){
      onResult({ok:true, msg:'¡Listo! Ya no verás anuncios.'});
      activarSinAnuncios();
    } else {
      onResult({ok:false, msg:'La compra no se completó.'});
    }
  }catch(e){
    if(e && e.userCancelled){ onResult({ok:false, msg:'Compra cancelada.'}); }
    else onResult({ok:false, msg:(e && e.message) || 'Error al iniciar la compra.'});
  }
}
if(CapPurchases){
  CapPurchases.addListener('ANDROID-PURCHASE-RESPONSE', ()=>{ comprobarCompraSinAnuncios(); });
}
const ELL_A = 6378137;
const ELL_B = 6356752.31424518;
function round(v, d){ const f=Math.pow(10,d); return Math.round(v*f)/f; }
function toRad(d){ return d*Math.PI/180; }
function toDeg(r){ return r*180/Math.PI; }
function normDeg(a){ return ((a%360)+360)%360; }
function decToDMS(dec){
  const sign = dec < 0 ? -1 : 1;
  const abs = Math.abs(dec);
  let d = Math.trunc(abs);
  let mFull = (abs - d) * 60;
  let m = Math.trunc(mFull);
  let s = Math.round((mFull - m) * 60 * 1000) / 1000;
  if (s >= 60){ s = 0; m += 1; }
  if (m >= 60){ m = 0; d += 1; }
  return {sign, d, m, s};
}
function dmsToDec(sign, d, m, s){ return sign * (Number(d||0) + Number(m||0)/60 + Number(s||0)/3600); }
function fmtDMS(dec, suffixPos, suffixNeg){
  // Se redondea a 0,1" ANTES de descomponer: así 59,96" acarrea a +1' (antes decToDMS redondeaba a milésimas
  // y toFixed(1) volvía a redondear sin acarreo, mostrando "60.0"). Un ángulo que queda en cero no lleva signo.
  const rDec = Math.round(Math.abs(dec) * 36000) / 36000;
  const {d,m,s} = decToDMS(rDec);
  const sign = (dec < 0 && rDec !== 0) ? -1 : 1;
  const suf = suffixPos ? (sign<0 ? (suffixNeg||'') : (suffixPos||'')) : '';
  const sgn = suffixPos ? '' : (sign<0 ? '-' : '');
  return `${sgn}${d}° ${String(m).padStart(2,'0')}' ${s.toFixed(1).padStart(4,'0')}" ${suf}`.trim();
}
function fmtNum(v, d=3){ if(!isFinite(v)) return '—'; return v.toLocaleString('es-CL',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function fmtNumTrim(v, d=3){ if(!isFinite(v)) return '—'; return v.toLocaleString('es-CL',{minimumFractionDigits:0,maximumFractionDigits:d}); }
function degToGon(deg){ return deg*(400/360); }
function gonToDeg(gon){ return gon*(360/400); }
function fmtGon(dec, decimals=4){
  if(!isFinite(dec)) return '—';
  const g = degToGon(dec);
  return `${fmtNum(g,decimals)}ᵍ`;
}
let angleSystem = 'cent';
function loadAngleSystem(){ try{ return localStorage.getItem('topocalc-angsys') || 'cent'; }catch(e){ return 'cent'; } }
function saveAngleSystem(v){ try{ localStorage.setItem('topocalc-angsys', v); }catch(e){} }
function fmtAngle(dec, suffixPos, suffixNeg){
  if(angleSystem === 'cent') return fmtGon(dec,4) + (suffixPos ? ` ${dec<0?(suffixNeg||''):(suffixPos||'')}` : '');
  return fmtDMS(dec, suffixPos, suffixNeg);
}
function angleFieldHTML(idPrefix, defaultDeg, label){
  label = label || 'Ángulo';
  if(angleSystem === 'cent'){
    const gon = round(degToGon(defaultDeg),4);
    return `<div class="field-row"><label>${label} (gon)</label>
      <input type="number" step="any" id="${idPrefix}_gon" value="${gon}"></div>`;
  }
  const {d,m,s} = decToDMS(defaultDeg);
  return `<div class="field-row"><label>${label} (° ' ")</label><div class="field-inline">
    ${fieldRow('°',`${idPrefix}_d`,d)}${fieldRow("'",`${idPrefix}_m`,m)}${fieldRow('"',`${idPrefix}_s`,s)}
  </div></div>`;
}
function readAngleField(idPrefix){
  if(angleSystem === 'cent'){
    const gon = val(`${idPrefix}_gon`);
    return isNaN(gon) ? NaN : gonToDeg(gon);
  }
  const d=val(`${idPrefix}_d`), m=val(`${idPrefix}_m`), s=val(`${idPrefix}_s`);
  if(isNaN(d)||isNaN(m)||isNaN(s)) return NaN;
  return dmsToDec((d<0||Object.is(d,-0))?-1:1, Math.abs(d), m, s);
}
function angleSimpleLabel(){ return angleSystem === 'cent' ? '(gon)' : '(°)'; }
function readAngleSimple(id){
  const v = val(id);
  if(isNaN(v)) return NaN;
  return angleSystem === 'cent' ? gonToDeg(v) : v;
}
function angleSimpleDefault(defaultDeg){ return angleSystem === 'cent' ? round(degToGon(defaultDeg),4) : defaultDeg; }
function utmBanda(latDeg){
  const edges  = [-80,-72,-64,-56,-48,-40,-32,-24,-16,-8,0,8,16,24,32,40,48,56,64,72,80,84];
  const letters= ["C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","X"];
  for(let i=0;i<edges.length-1;i++){
    if(latDeg>=edges[i] && latDeg<edges[i+1]) return letters[i];
  }
  if(latDeg>=84) return "X";
  return "?";
}
function latLonToUTM(latDeg, lonDeg){
  const zona = Math.trunc(lonDeg/6 + 31);
  const meridianoCentral = 6*zona - 183;
  const hemisferio = latDeg < 0 ? 'S' : 'N';
  const r = tmDirecta(latDeg, lonDeg, meridianoCentral, 0.9996, 500000, hemisferio==='S' ? 10000000 : 0, ELL_A, (ELL_A-ELL_B)/ELL_A);
  return {zona, banda: utmBanda(latDeg), este: r.este, norte: r.norte, hemisferio, meridianoCentral};
}
function utmToLatLon(este, norte, zona, hemisferio){
  const meridianoCentral = 6*zona - 183;
  const r = tmInversa(este, norte, meridianoCentral, 0.9996, 500000, hemisferio==='S' ? 10000000 : 0, ELL_A, (ELL_A-ELL_B)/ELL_A);
  return {lat: r.lat, lon: r.lon, meridianoCentral};
}
function azToRumbo(az){
  let ns,ew,ang;
  if(az<=90){ns='N';ew='E';ang=az;}
  else if(az<=180){ns='S';ew='E';ang=180-az;}
  else if(az<=270){ns='S';ew='W';ang=az-180;}
  else {ns='N';ew='W';ang=360-az;}
  return {ns,ew,ang};
}
function calcAreaCoords(points){
  const n = points.length;
  let area2 = 0;
  for(let i=0;i<n;i++){
    const p1=points[i], p2=points[(i+1)%n];
    area2 += p1.e*p2.n - p2.e*p1.n;
  }
  const areaM2 = Math.abs(area2)/2;
  return {areaM2, areaHa: areaM2/10000};
}
function calcNivelDosEstacas(a1,b1,a2,b2,D,d){
  const dhTrue = a1-b1;
  const dhApp = a2-b2;
  const dA2 = d, dB2 = D-d;
  const denom = dA2-dB2;
  const e = denom!==0 ? ((a2-b2)-dhTrue)/denom : 0; // error por metro (misma unidad que las lecturas)
  const errMM30 = e*30*1000; // error equivalente en mm cada 30 m de visual
  const bCorrecta = a2-dhTrue; // lectura que debería verse en B, en posición 2, si el nivel estuviera en ajuste
  const ok = Math.abs(errMM30) <= 3;
  return {dhTrue, dhApp, e, errMM30, bCorrecta, ok};
}
function calcDosCaras(hzFL,hzFR,zFL,zFR){
  let diffH = normDeg(hzFR-hzFL-180);
  if(diffH>180) diffH -= 360;
  const C = diffH/2; // error de colimación horizontal
  const hzMean = normDeg(hzFL+C);
  const diffV = (zFL+zFR)-360;
  const i = diffV/2; // error de índice vertical
  const zMean = zFL-i;
  const Csec = C*3600, isec = i*3600;
  return {C, Csec, hzMean, i, isec, zMean, okC: Math.abs(Csec)<=20, okI: Math.abs(isec)<=20};
}
function calcConstanteEDM(distAB,distBC,distAC){
  const K = (distAB+distBC)-distAC;
  return {K, ok: Math.abs(K)<=0.005};
}
function geodeticToGeocentric(latDeg, lonDeg, h, a, e2){
  const lat=toRad(latDeg), lon=toRad(lonDeg);
  const N = a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
  return {
    X: (N+h)*Math.cos(lat)*Math.cos(lon),
    Y: (N+h)*Math.cos(lat)*Math.sin(lon),
    Z: (N*(1-e2)+h)*Math.sin(lat)
  };
}
function geocentricToGeodetic(X,Y,Z,a,e2){
  const lon = Math.atan2(Y,X);
  const p = Math.sqrt(X*X+Y*Y);
  let lat = Math.atan2(Z, p*(1-e2));
  let N;
  for(let i=0;i<8;i++){
    N = a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
    const h = p/Math.cos(lat) - N;
    lat = Math.atan2(Z, p*(1-e2*N/(N+h)));
  }
  N = a/Math.sqrt(1-e2*Math.sin(lat)*Math.sin(lat));
  const h = p/Math.cos(lat) - N;
  return {lat: toDeg(lat), lon: toDeg(lon), h};
}
function calcRadiacionPunto(E0, N0, azDeg, dist){
  const E = E0 + dist*Math.sin(toRad(azDeg));
  const N = N0 + dist*Math.cos(toRad(azDeg));
  return {E,N};
}
const _krugerCache = {};
function _krugerCoef(a,f){
  const key=a+'|'+f; if(_krugerCache[key]) return _krugerCache[key];
  const n=f/(2-f), n2=n*n, n3=n2*n, n4=n3*n, n5=n4*n, n6=n5*n;
  return _krugerCache[key] = {
    e: Math.sqrt(f*(2-f)),
    A: a/(1+n)*(1 + n2/4 + n4/64 + n6/256),                       // radio rectificador
    alfa: [ n/2 - 2*n2/3 + 5*n3/16 + 41*n4/180 - 127*n5/288 + 7891*n6/37800,
            13*n2/48 - 3*n3/5 + 557*n4/1440 + 281*n5/630 - 1983433*n6/1935360,
            61*n3/240 - 103*n4/140 + 15061*n5/26880 + 167603*n6/181440,
            49561*n4/161280 - 179*n5/168 + 6601661*n6/7257600,
            34729*n5/80640 - 3418889*n6/1995840,
            212378941*n6/319334400 ],
    beta: [ n/2 - 2*n2/3 + 37*n3/96 - n4/360 - 81*n5/512 + 96199*n6/604800,
            n2/48 + n3/15 - 437*n4/1440 + 46*n5/105 - 1118711*n6/3870720,
            17*n3/480 - 37*n4/840 - 209*n5/4480 + 5569*n6/90720,
            4397*n4/161280 - 11*n5/504 - 830251*n6/7257600,
            4583*n5/161280 - 108847*n6/3991680,
            20648693*n6/638668800 ]
  };
}
function tmDirecta(latDeg, lonDeg, lon0Deg, k0, falseE, falseN, a, f){          // geográficas → este, norte
  const c=_krugerCoef(a,f), phi=toRad(latDeg), lam=toRad(lonDeg-lon0Deg), e=c.e;
  const chi = Math.atan(Math.sinh(Math.asinh(Math.tan(phi)) - e*Math.atanh(e*Math.sin(phi))));   // latitud conforme
  const xi1 = Math.atan2(Math.sin(chi), Math.cos(chi)*Math.cos(lam));
  const eta1 = Math.atanh(Math.cos(chi)*Math.sin(lam));
  let xi = xi1, eta = eta1;
  for(let j=1;j<=6;j++){
    xi  += c.alfa[j-1]*Math.sin(2*j*xi1)*Math.cosh(2*j*eta1);
    eta += c.alfa[j-1]*Math.cos(2*j*xi1)*Math.sinh(2*j*eta1);
  }
  return {este: falseE + k0*c.A*eta, norte: falseN + k0*c.A*xi};
}
function tmInversa(este, norte, lon0Deg, k0, falseE, falseN, a, f){              // este, norte → geográficas
  const c=_krugerCoef(a,f), xi=(norte-falseN)/(k0*c.A), eta=(este-falseE)/(k0*c.A);
  let xi1 = xi, eta1 = eta;
  for(let j=1;j<=6;j++){
    xi1  -= c.beta[j-1]*Math.sin(2*j*xi)*Math.cosh(2*j*eta);
    eta1 -= c.beta[j-1]*Math.cos(2*j*xi)*Math.sinh(2*j*eta);
  }
  const chi = Math.asin(Math.sin(xi1)/Math.cosh(eta1));
  const lam = Math.atan2(Math.sinh(eta1), Math.cos(xi1));
  const tc = Math.tan(chi); let phi = chi;                                        // latitud geodésica desde la conforme (punto fijo)
  for(let i=0;i<10;i++) phi = Math.atan(Math.sinh(Math.asinh(tc) + c.e*Math.atanh(c.e*Math.sin(phi))));
  return {lat: toDeg(phi), lon: lon0Deg + toDeg(lam)};
}
const GLOSARIO = {
  'R': 'Radio de la curva circular',
  'Δ': 'Deflexión — ángulo central que subtiende la curva',
  'T': 'Tangente — distancia desde el PI hasta el PC o hasta el PT',
  'Lc': 'Longitud de curva — distancia a lo largo del arco, entre PC y PT',
  'C': 'Cuerda larga — distancia en línea recta entre PC y PT (curvas) — o, en chequeos de instrumentos, el error de colimación horizontal, en segundos de arco, según la herramienta',
  'E': 'Externa — distancia desde el PI hasta el punto medio de la curva',
  'M': 'Ordenada media — distancia desde el punto medio de la cuerda hasta el punto medio del arco',
  'G': 'Grado de curvatura — ángulo central subtendido por una cuerda de 20 m',
  'PC': 'Principio de curva (donde comienza el arco)',
  'PT': 'Fin de curva (donde termina el arco)',
  'PI': 'Punto de Intersección de las dos tangentes (vértice del ángulo de deflexión)',
  'O': 'Centro de la curva circular',
  'p1': 'Pendiente de entrada (%), antes del PIV',
  'p2': 'Pendiente de salida (%), después del PIV',
  'PIV': 'Punto de Intersección Vertical — donde se cruzan las dos pendientes',
  'PVC': 'Principio de Curva Vertical (donde comienza la parábola)',
  'PVT': 'Fin de Curva Vertical (donde termina la parábola)',
  'K': 'Progresiva (kilometraje) de un punto a lo largo de un eje — o el parámetro L/A de una curva vertical — o la constante aditiva del EDM de una estación total (mm), según la herramienta',
  'A': 'Diferencia algebraica de pendientes, |p1−p2| (curva vertical) — o Parámetro de la clotoide, que define qué tan cerrada es la espiral (curva de transición)',
  'L': 'Longitud de la curva (horizontal o vertical, según la herramienta)',
  'e': 'Peralte — inclinación transversal de la calzada en una curva, en %',
  'f': 'Fricción lateral requerida entre el neumático y el pavimento',
  'V': 'Velocidad de diseño (km/h)',
  'a': 'Cateto de un triángulo rectángulo',
  'b': 'Cateto de un triángulo rectángulo',
  'c': 'Hipotenusa de un triángulo rectángulo',
  'h': 'Altura elipsoidal — la que entrega un equipo GNSS/RTK, medida sobre el elipsoide',
  'H': 'Altura ortométrica — la altura de nivel, medida sobre el geoide (nivel medio del mar)',
  'N': 'Ondulación geoidal — separación entre el elipsoide y el geoide en un punto',
  'Di': 'Distancia inclinada — medida a lo largo de la pendiente del terreno',
  'Dh': 'Distancia horizontal — proyección de Di sobre el plano horizontal',
  'Dv': 'Distancia vertical (desnivel) entre los dos extremos de Di',
  'Ec': 'Error de cierre angular — diferencia entre la suma observada y la suma teórica de ángulos de una poligonal',
  'τ': 'Ángulo de la espiral — ángulo entre la tangente de entrada y la tangente a la clotoide en un punto dado',
  'EC': 'Estaca donde termina la espiral y comienza el arco circular (Empieza el Círculo)',
  'TE': 'Estaca donde termina la tangente recta y comienza la espiral (Termina la Entrada / Tangente-Espiral)',
  'Xc': 'Coordenada X (según el eje de la tangente) del punto EC, respecto al origen de la clotoide',
  'Yc': 'Coordenada Y (perpendicular a la tangente) del punto EC, respecto al origen de la clotoide',
  'p': 'Retranqueo — desplazamiento del círculo original hacia el eje, necesario para insertar la clotoide',
  'k': 'Abscisa del centro desplazado del círculo, en una curva con clotoide',
  'Tl': 'Tangente larga de la clotoide (desde el origen hasta la proyección del EC)',
  'Tc': 'Tangente corta de la clotoide (desde el EC hasta la proyección sobre la tangente)',
  'PCC': 'Punto de Curva a Curva — donde se unen dos curvas circulares de radio distinto, del mismo lado',
  'PRC': 'Punto de Reversa de Curvatura — donde se unen dos curvas circulares de sentido contrario (curva en S)',
  'DC': 'Desarrollo — longitud recorrida a lo largo del arco, medida desde el PC',
  'l': 'Longitud recorrida a lo largo de la espiral, medida desde el TE',
  'Z': 'Distancia zenital — ángulo medido desde el cenit (vertical) hasta la visual observada; en geocéntricas, la coordenada cartesiana cuyo eje apunta hacia el polo norte',
  'CH': 'Lectura del círculo horizontal del instrumento en el momento de la observación',
  'BS': 'Vista Atrás (Back Sight) — lectura de mira hacia el punto de cota conocida',
  'FS': 'Vista Adelante (Fore Sight) — lectura de mira hacia el punto que se quiere cotizar',
  'HI': 'Altura de Instrumento — cota de la línea de colimación del nivel (cota del punto atrás + BS)',
  'X': 'Coordenada geocéntrica cartesiana, eje que apunta hacia el meridiano de Greenwich en el ecuador',
  'Y': 'Coordenada geocéntrica cartesiana, eje perpendicular a X en el plano ecuatorial',
  'DNMM': 'Distancia (horizontal) reducida al Nivel Medio del Mar',
  'Rα': 'Radio de curvatura de Euler del elipsoide, en el azimut de la visual',
  'i': 'Error de índice vertical de un instrumento (segundos de arco) — o pendiente de un tramo, según la herramienta',
  'CI': 'Cara Izquierda — lectura del instrumento en posición directa',
  'CD': 'Cara Derecha — lectura del instrumento en posición inversa (anteojo volteado)',
  'ZI': 'Ángulo cenital leído en Cara Izquierda',
  'ZD': 'Ángulo cenital leído en Cara Derecha',
  'EDM': 'Electronic Distance Measurement — el distanciómetro electrónico integrado en una estación total',
  'P': 'Paso (huella) — ancho horizontal de cada peldaño, medido borde a borde',
  'Cp': 'Contrapaso (alzada) — altura vertical de cada peldaño'
};
function glosarioHtml(keys){
  if(!keys || !keys.length) return '';
  const items = keys.filter(k=>GLOSARIO[k]).map(k=>`<div class="gloss-item"><b>${k}</b> — ${GLOSARIO[k]}</div>`).join('');
  if(!items) return '';
  return `<details class="glosario"><summary>Significado de las siglas usadas aquí</summary><div class="gloss-body">${items}</div></details>`;
}
function toolShell(id, blurb, bodyHtml, glosKeys){
  document.body.classList.remove('home');
  document.body.classList.add('in-tool');
  document.getElementById('toolTitleTop').textContent = TOOLS[id].name;
  const main = document.getElementById('main');
  main.innerHTML = `<div class="tool-view">
    <p class="tool-blurb">${blurb}</p>
    ${glosarioHtml(glosKeys)}
    <div class="action-bar">
      <button type="button" id="btnExportInforme" class="btn-sm">📄 Exportar informe</button>
      <button type="button" id="btnShareCapture" class="btn-sm">📷 Compartir captura</button>
      <span id="actionMsg" class="proj-msg"></span>
    </div>
    ${bodyHtml}
  </div>`;
  wireToolActions(id);
}
const VR_TOOLS = ['chequeoNivel','chequeoTeodolito','chequeoEstacion'];
const VR_CFG = {
  chequeoNivel:{tipo:'Nivel', base:['Condición física','Niveles (circular)','Tornillos','Compensador']},
  chequeoTeodolito:{tipo:'Teodolito', base:['Condición física','Nivel tubular / esférico','Tornillos','Plomada óptica / láser']},
  chequeoEstacion:{tipo:'Estación total', base:['Condición física','Nivel tubular / esférico','Tornillos','Plomada óptica / láser']}
};
const VR_APAR = ['Color','Limpieza','Estuche y accesorios'];
function vrEsc(x){ return String(x==null?'':x).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function buildInformeVerificacion(toolId){
  const cfg = VR_CFG[toolId];
  const g = id=>{ const e=document.getElementById(id); return e?e.value.trim():''; };
  const ck = id=>{ const e=document.getElementById(id); return !!(e && e.checked); };
  const dash = x=> x ? vrEsc(x) : '—';
  const sg = (v,d)=> (v>=0?'+':'−')+fmtNum(Math.abs(v),d);
  const okTd = ok=>`<td class="c ${ok?'vr-ok':'vr-bad'}">${ok?'CONFORME':'AJUSTAR EQUIPO'}</td>`;
  if(!document.querySelector('.tool-view .results')) return {error:'Completa el formulario y presiona Calcular antes de exportar.'};
  let leyenda, proc, datos, resultados, calib, metodo, diagramas = [];
  const c = (t,cls)=>`<td class="c${cls?' '+cls:''}">${t}</td>`;
  const hdr = arr=>`<tr>${arr.map(h=>`<th class="c">${h}</th>`).join('')}</tr>`;
  document.querySelectorAll('.tool-view .plot-wrap svg').forEach(sv=>diagramas.push(sv.outerHTML));
  if(toolId==='chequeoNivel'){
    const D=val('cn_D'), d=val('cn_d'), a1=val('cn_a1'), b1=val('cn_b1'), a2=val('cn_a2'), b2=val('cn_b2');
    if([D,d,a1,b1,a2,b2].some(isNaN) || D<=0 || d<0 || d>=D) return {error:'Revisa las lecturas y distancias antes de exportar.'};
    const r = calcNivelDosEstacas(a1,b1,a2,b2,D,d);
    leyenda = 'GEOMAV VERIFICA EL ERROR DE COLIMACIÓN DEL NIVEL MEDIANTE LA PRUEBA DE LAS DOS ESTACAS, SEGÚN LAS TOLERANCIAS INDICADAS EN ESTE INFORME';
    proc = 'Prueba de las dos estacas';
    calib = [['Horizontalidad (colimación)', r.ok]];
    datos = `<table class="vr-t">${hdr(['POSICIÓN','DISTANCIA NIVEL–A','LECTURA EN A','LECTURA EN B','DESNIVEL A–B'])}
      <tr><td>1 — nivel centrado entre A y B (D = ${fmtNum(D,3)} m)</td>${c(fmtNum(D/2,3)+' m')}${c(fmtNum(a1,4)+' m')}${c(fmtNum(b1,4)+' m')}${c('<b>'+fmtNum(r.dhTrue,4)+' m</b>')}</tr>
      <tr><td>2 — nivel cerca de A</td>${c(fmtNum(d,3)+' m')}${c(fmtNum(a2,4)+' m')}${c(fmtNum(b2,4)+' m')}${c('<b>'+fmtNum(r.dhApp,4)+' m</b>')}</tr></table>`;
    resultados = `<table class="vr-t">${hdr(['ENSAYO','VALOR PATRÓN (POS. 1)','VALOR LEÍDO (POS. 2)','ERROR','TOLERANCIA','RESULTADO'])}
      <tr><td>Desnivel A–B</td>${c(fmtNum(r.dhTrue,4)+' m')}${c(fmtNum(r.dhApp,4)+' m')}${c(sg(r.errMM30,1)+' mm / 30 m','err')}${c('≤ 3 mm / 30 m')}${okTd(r.ok)}</tr>
      <tr><td>Lectura correcta en B (para ajustar)</td>${c('—')}${c(fmtNum(r.bCorrecta,4)+' m')}${c('—')}${c('—')}${c('—')}</tr></table>`;
    metodo = 'Prueba de las dos estacas: posición 1 con el nivel centrado entre A y B (el error de colimación se anula y da el desnivel verdadero); posición 2 con el nivel junto a A.<br>e = [(a2 − b2) − (a1 − b1)] / (dA2 − dB2) &nbsp;·&nbsp; Error a 30 m = e × 30 000 mm &nbsp;·&nbsp; Lectura correcta en B = a2 − (a1 − b1)';
  } else {
    const p = toolId==='chequeoEstacion' ? 'ce' : 'ct';
    const hzFL=readAngleField(p+'_hzfl'), hzFR=readAngleField(p+'_hzfr'), zFL=readAngleField(p+'_zfl'), zFR=readAngleField(p+'_zfr');
    if([hzFL,hzFR,zFL,zFR].some(isNaN)) return {error:'Completa las cuatro lecturas de ambas caras antes de exportar.'};
    const r = calcDosCaras(hzFL,hzFR,zFL,zFR);
    let E = null;
    if(p==='ce'){
      const ab=val('ce_ab'), bc=val('ce_bc'), ac=val('ce_ac');
      if([ab,bc,ac].some(isNaN)) return {error:'Completa las tres distancias del EDM antes de exportar.'};
      E = Object.assign({ab,bc,ac}, calcConstanteEDM(ab,bc,ac));
    }
    leyenda = E ? 'GEOMAV VERIFICA LA COLIMACIÓN HORIZONTAL, EL ÍNDICE VERTICAL Y LA CONSTANTE ADITIVA DEL EDM DEL EQUIPO, SEGÚN LAS TOLERANCIAS INDICADAS EN ESTE INFORME'
                : 'GEOMAV VERIFICA LA COLIMACIÓN HORIZONTAL Y EL ÍNDICE VERTICAL DEL EQUIPO POR EL MÉTODO DE LAS DOS CARAS, SEGÚN LAS TOLERANCIAS INDICADAS EN ESTE INFORME';
    proc = E ? 'Dos caras (CI / CD) + EDM' : 'Dos caras (CI / CD)';
    calib = [['Colimación horizontal (C)', r.okC], ['Índice vertical (i)', r.okI]];
    if(E) calib.push(['Constante EDM (K)', E.ok]);
    datos = `<table class="vr-t">${hdr(['LECTURA','CARA IZQUIERDA (CI)','CARA DERECHA (CD)','DIFERENCIA'])}
      <tr><td>Horizontal a la mira (Hz)</td>${c(fmtAngle(hzFL))}${c(fmtAngle(hzFR))}${c('CD − CI − 180° = '+sg(2*r.Csec,1)+'"')}</tr>
      <tr><td>Vertical cenital a la mira (Z)</td>${c(fmtAngle(zFL))}${c(fmtAngle(zFR))}${c('CI + CD − 360° = '+sg(2*r.isec,1)+'"')}</tr>
      ${E?`<tr><td>Línea base A–B–C (EDM)</td>${c('AB = '+fmtNum(E.ab,4)+' m')}${c('BC = '+fmtNum(E.bc,4)+' m')}${c('AC = '+fmtNum(E.ac,4)+' m')}</tr>`:''}</table>`;
    resultados = `<table class="vr-t">${hdr(['ENSAYO','VALOR PATRÓN','VALOR LEÍDO','ERROR','TOLERANCIA','RESULTADO'])}
      <tr><td>Colimación horizontal (C)</td>${c('CD = CI + 180°')}${c('Hz medio: '+fmtAngle(r.hzMean))}${c(sg(r.Csec,1)+'"','err')}${c('≤ 20"')}${okTd(r.okC)}</tr>
      <tr><td>Índice vertical (i)</td>${c('CI + CD = 360°')}${c('Z corregido: '+fmtAngle(r.zMean))}${c(sg(r.isec,1)+'"','err')}${c('≤ 20"')}${okTd(r.okI)}</tr>
      ${E?`<tr><td>Constante aditiva EDM (K)</td>${c('AB + BC = AC')}${c(fmtNum(E.ab+E.bc,4)+' m (AB+BC)')}${c(sg(E.K*1000,1)+' mm','err')}${c('≤ 5 mm')}${okTd(E.ok)}</tr>`:''}</table>`;
    metodo = 'Dos caras apuntando al mismo punto: C = (Hz_CD − Hz_CI − 180°) / 2 &nbsp;·&nbsp; i = (Z_CI + Z_CD − 360°) / 2.'+(E?' Constante del EDM sobre línea base A–B–C colineal: K = (AB + BC) − AC.':'')+'<br>Valores corregidos: Hz medio = Hz_CI + C &nbsp;·&nbsp; Z corregido = Z_CI − i.';
  }
  const items = (arr)=>arr.map(([t,ok])=>`<p>${t} &nbsp;<b class="${ok?'vr-ok':'vr-bad'}">${ok?'OK':'AJUSTAR'}</b></p>`).join('');
  const chk = (p,arr)=>arr.map((t,i)=>`<p>${t} &nbsp;<b class="${ck('vr_'+p+i)?'vr-ok':'vr-na'}">${ck('vr_'+p+i)?'OK':'—'}</b></p>`).join('');
  const hoy = new Date(), pad = n=>String(n).padStart(2,'0');
  const iso = dt=>`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
  const prox = new Date(hoy.getFullYear(), hoy.getMonth()+6, Math.min(hoy.getDate(), 28));
  const nInf = `TB-${hoy.getFullYear()}${pad(hoy.getMonth()+1)}${pad(hoy.getDate())}-${pad(hoy.getHours())}${pad(hoy.getMinutes())}`;
  const equipo = [cfg.tipo, g('vr_marca'), g('vr_modelo')].filter(Boolean).map(vrEsc).join(' ');
  const logo = document.querySelector('.brand-logo');
  const caractLines = [`<p>Tipo: ${cfg.tipo}</p>`, g('vr_marca')||g('vr_modelo') ? `<p>Marca / modelo: ${dash([g('vr_marca'),g('vr_modelo')].filter(Boolean).join(' '))}</p>` : '', `<p>N° de serie: ${dash(g('vr_serie'))}</p>`, g('vr_caract')?`<p>${vrEsc(g('vr_caract'))}</p>`:''].join('');
  return `<div class="vr-top">
      <div class="vr-brand">${logo?`<img src="${logo.src}" alt="GEOMAV">`:''}<div><b>GEOMAV</b><i>Topo de Bolsillo</i><small>Cálculos topográficos y geodésicos</small></div></div>
      <div class="vr-marca">${vrEsc(g('vr_marca')).toUpperCase()}</div>
      <div class="vr-right">AÑO: ${hoy.getFullYear()}<br>N° Informe - ${nInf}<u>INFORME DE VERIFICACIÓN</u></div>
    </div><div class="vr-line"></div>
    <table class="vr-meta"><tr><td class="k">OTORGADO A:</td><td>${dash(g('vr_cliente'))}</td><td class="k">RUT:</td><td>${dash(g('vr_rut'))}</td></tr>
      <tr><td class="k">EQUIPO:</td><td>${equipo}</td><td class="k">FECHA DE EMISIÓN:</td><td>${iso(hoy)}</td></tr>
      <tr><td class="k">SERIE:</td><td>${dash(g('vr_serie'))}</td><td class="k">PROCEDIMIENTO:</td><td>${proc}</td></tr></table>
    <div class="vr-ley">${leyenda}</div>
    <div class="vr-sec">CARACTERÍSTICAS DEL EQUIPO</div><div class="vr-box">${caractLines}</div>
    <div class="vr-sec">VERIFICACIÓN DEL EQUIPO</div>
    <div class="vr-cols"><div><h4>BASE</h4>${chk('b',cfg.base)}</div><div><h4>CALIBRACIÓN</h4>${items(calib)}</div><div><h4>APARIENCIA VISIBLE</h4>${chk('a',VR_APAR)}</div></div>
    <div class="vr-sec">RESULTADOS DE LA VERIFICACIÓN</div><div class="vr-gap"></div>${datos}<div class="vr-gap"></div>${resultados}
    ${diagramas.length?`<div class="vr-sec">DIAGRAMA</div><div class="vr-diag">${diagramas.join('')}</div>`:''}
    <div class="vr-sec">CONDICIONES DE LA VERIFICACIÓN</div>
    <table class="vr-meta"><tr><td class="k">LUGAR:</td><td>${dash(g('vr_lugar'))}</td><td class="k">TEMPERATURA:</td><td>${g('vr_temp')?vrEsc(g('vr_temp'))+' °C':'—'}</td></tr>
      <tr><td class="k">OPERADOR:</td><td>${dash(g('vr_operador'))}</td><td class="k">HUMEDAD REL.:</td><td>${g('vr_hum')?vrEsc(g('vr_hum'))+' %':'—'}</td></tr></table>
    <div class="vr-sec">METODOLOGÍA Y CÁLCULO</div><div class="vr-met">${metodo}</div>
    <table class="vr-meta" style="margin-top:5px;"><tr><td class="k">FECHA DE VERIFICACIÓN:</td><td><b>${iso(hoy)}</b></td><td class="k">PRÓXIMA VERIFICACIÓN (SUGERIDA):</td><td><b>${iso(prox)}</b></td></tr></table>
    <div class="vr-nota">DATOS: ESTA VERIFICACIÓN DE CAMPO SE REALIZÓ CON LAS LECTURAS INGRESADAS EN TOPO DE BOLSILLO (GEOMAV) Y NO REEMPLAZA UNA CALIBRACIÓN DE LABORATORIO ACREDITADA. ES RESPONSABILIDAD DEL CLIENTE EL ADECUADO CUIDADO Y TRANSPORTE DEL EQUIPO.</div>
    <b style="font-size:9.5px;">ENTREGUÉ CONFORME:</b>
    <div class="vr-firmas"><div>Firma responsable<small>${vrEsc(g('vr_operador'))}</small></div><div>Timbre / Visación<small></small></div></div>
    <div class="vr-foot">GEOMAV · Talca, Región del Maule · geomav.me/topocalc</div>`;
}
const SHEET_CUBIERTOS = new WeakSet();
const SHEET_EXTRA = {};
function sheetTxt(el, quitar){
  if(!el) return '';
  const c = el.cloneNode(true);
  c.querySelectorAll(quitar || 'small, .pill, button, select, input').forEach(x=>x.remove());
  return c.textContent.replace(/\s+/g,' ').trim();
}
function sheetNum(v){
  const s = String(v).trim();
  if(!/^-?\d+(\.\d+)?$/.test(s)) return s;
  const dec = (s.split('.')[1]||'').length;
  return fmtNumTrim(parseFloat(s), Math.min(dec, 8));
}
function sheetCampo(fr){
  const lab = fr.querySelector(':scope > label') || fr.querySelector('label');
  const label = sheetTxt(lab);
  const sub = [...fr.querySelectorAll(':scope .field-row')];
  if(sub.length){   // campo compuesto, p. ej. ángulo sexagesimal (° ' ")
    const partes = sub.map(s=>({l: sheetTxt(s.querySelector('label')), i: s.querySelector('input')})).filter(p=>p.i && p.i.value!=='');
    if(!partes.length || !label) return null;
    const gms = partes.every(p=>['°',"'",'"'].includes(p.l));
    return {label, value: gms ? partes.map(p=>p.i.value+p.l).join(' ') : partes.map(p=>`${p.l} ${sheetNum(p.i.value)}`).join(' · ')};
  }
  const nval = fr.querySelector('.n-val');
  if(nval && label) return {label, value: nval.textContent.trim()};
  const ins = [...fr.querySelectorAll('input, select')].filter(i=>!['file','hidden','button','submit'].includes(i.type));
  if(!ins.length || !label) return null;
  const vals = ins.map(i=>{
    if(i.tagName==='SELECT'){ if(i.value==='') return ''; const o = i.options[i.selectedIndex]; return o ? o.textContent.trim() : ''; }
    if(i.type==='checkbox') return i.checked ? 'Sí' : 'No';
    return sheetNum(i.value);
  }).filter(v=>v!=='');
  return vals.length ? {label, value: vals.join(' · ')} : null;
}
function sheetFuera(el, box){
  if(el.closest('.results, .data-sheet, .action-bar, .glosario, #printArea')) return true;
  if(box && box.contains(el) && !box.matches('.field-card')) return true;
  const card = el.closest('.field-card');   // otra tarjeta con su propio diagrama: sus campos van en la tabla de esa tarjeta
  return !!(card && box && !card.contains(box) && [...card.querySelectorAll('.plot-wrap')].some(pw=>sheetCaja(pw)!==box));
}
function sheetConstruir(box){
  const tv = document.querySelector('.tool-view'); if(!tv) return null;
  const id = currentRoute();
  const card = box.closest('.field-card');
  const enCard = card && [...card.querySelectorAll('.field-row')].some(fr=>!sheetFuera(fr, box));
  const scope = enCard ? card : tv;
  const tablas = [];
  // 1) Campos sueltos, con el subtítulo (h3/h4) que los agrupa
  const kv = []; let sec = null;
  scope.querySelectorAll('h3, h4, .field-row').forEach(el=>{
    if(sheetFuera(el, box) || el.closest('.station-block:not([data-kv])')) return;
    if(el.matches('h3, h4')){ sec = sheetTxt(el); return; }
    if(el.parentElement.closest('.field-row')) return;   // sub-campo de un ángulo: ya va en su campo
    const c = sheetCampo(el); if(!c) return;
    SHEET_CUBIERTOS.add(el);
    if(sec && /^\(/.test(c.label)){ c.label = `${sec} ${c.label}`; sec = null; }
    if(sec){ kv.push({sec}); sec = null; }
    kv.push(c);
  });
  if(kv.length) tablas.push({cap:'Datos ingresados', kv});
  // 2) Bloques repetidos (estaciones, vértices, tramos): una fila por bloque, una columna por dato
  const grupos = new Map();
  scope.querySelectorAll('.station-block:not([data-kv])').forEach(sb=>{ if(sheetFuera(sb, box)) return; const k = sb.parentElement; if(!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(sb); });
  grupos.forEach(bloques=>{
    const cols = [], filas = [];
    bloques.forEach(sb=>{
      const celdas = {};
      sb.querySelectorAll('.field-row').forEach(fr=>{
        if(fr.parentElement.closest('.field-row')) return;
        const c = sheetCampo(fr); if(!c) return;
        SHEET_CUBIERTOS.add(fr);
        if(!cols.includes(c.label)) cols.push(c.label);
        celdas[c.label] = c.value;
      });
      if(Object.keys(celdas).length) filas.push({nombre: sheetTxt(sb.querySelector('.st-label')), celdas});
    });
    if(filas.length) tablas.push({cap: filas.length>1 ? `Datos por elemento (${filas.length})` : 'Datos del elemento', cols:['Elemento', ...cols], filas: filas.map(f=>[f.nombre, ...cols.map(c=>f.celdas[c]!==undefined ? f.celdas[c] : '—')])});
  });
  // 3) Tablas propias de la herramienta (si tiene)
  if(SHEET_EXTRA[id]) (SHEET_EXTRA[id](box)||[]).forEach(t=>tablas.push(t));
  // 4) Resultados del mismo cálculo, con sus subtítulos
  const res = []; const rbs = box.matches('.results') ? [box] : [...box.querySelectorAll('.results')];
  rbs.forEach(rb=>{
    if(rb.closest('.data-sheet')) return;
    const filas = [...rb.querySelectorAll(':scope > .result-row')].map(r=>({label: sheetTxt(r.querySelector('.k')), value: sheetTxt(r.querySelector('.v'), 'button, select, input'), acc: !!r.querySelector('.v.accent')})).filter(r=>r.label);
    if(!filas.length) return;
    SHEET_CUBIERTOS.add(rb);
    const h = rb.querySelector(':scope > h3'); if(h && rbs.length>1) res.push({sec: sheetTxt(h)});
    filas.forEach(f=>res.push(f));
  });
  if(res.length) tablas.push({cap:'Resultados', kv: res});
  if(!tablas.length) return null;
  const e = escHTML;
  let html = `<h3>Datos y resultados</h3>`;
  tablas.forEach(t=>{
    html += `<div class="ds-cap">${e(t.cap)}</div><div class="table-wrap">`;
    if(t.kv){
      html += `<table class="data-table ds-kv"><tbody>` + t.kv.map(r=> r.sec!==undefined
        ? `<tr class="ds-sec"><td colspan="2">${e(r.sec)}</td></tr>`
        : `<tr><td>${e(r.label)}</td><td${r.acc?' class="ds-acc"':''}>${e(r.value)}</td></tr>`).join('') + `</tbody></table>`;
    } else {
      html += `<table class="data-table"><thead><tr>${t.cols.map(c=>`<th>${e(c)}</th>`).join('')}</tr></thead><tbody>` +
        t.filas.map(f=>`<tr>${f.map(v=>`<td>${e(v)}</td>`).join('')}</tr>`).join('') + `</tbody></table>`;
    }
    html += `</div>`;
  });
  const d = document.createElement('div'); d.className = 'data-sheet'; d.innerHTML = html;
  return d;
}
function sheetCaja(pw){ return pw.closest('[id^="res"]') || pw.closest('.results') || pw.parentElement; }
function sheetActualizar(){
  const tv = document.querySelector('.tool-view'); if(!tv) return;
  const cajas = [];
  tv.querySelectorAll('.plot-wrap').forEach(pw=>{ if(pw.closest('.data-sheet')) return; const b = sheetCaja(pw); if(b && !cajas.includes(b)) cajas.push(b); });
  cajas.forEach(box=>{
    box.querySelectorAll('.data-sheet').forEach(s=>s.remove());
    const pws = [...box.querySelectorAll('.plot-wrap')].filter(pw=>sheetCaja(pw)===box);
    const ultimo = pws[pws.length-1]; if(!ultimo) return;
    const hoja = sheetConstruir(box); if(hoja) ultimo.after(hoja);
  });
}
let sheetPendiente = false;
function sheetRelevante(n){
  if(n.nodeType!==1 || n.classList.contains('data-sheet') || n.closest('.data-sheet, .leaflet-container')) return false;
  if(n.matches('.plot-wrap, .results, .result-row') || n.querySelector('.plot-wrap, .results, .result-row')) return true;
  return n.tagName.toLowerCase()==='svg' && n.parentElement && n.parentElement.matches('.plot-wrap');
}
new MutationObserver(muts=>{
  if(sheetPendiente) return;
  const hay = muts.some(m=>{
    if(m.target.nodeType===1 && m.target.closest && m.target.closest('.data-sheet, .leaflet-container')) return false;
    return [...m.addedNodes].some(sheetRelevante) || [...m.removedNodes].some(n=>n.nodeType===1 && !n.classList.contains('data-sheet') && (n.matches('.plot-wrap, .results, .result-row, svg') || (n.querySelector && n.querySelector('.plot-wrap, .results'))));
  });
  if(!hay) return;
  sheetPendiente = true;
  requestAnimationFrame(()=>{ sheetPendiente = false; sheetActualizar(); });
}).observe(document.getElementById('main'), {childList:true, subtree:true});
function collectToolReportData(){
  const container = document.querySelector('.tool-view');
  if(!container) return null;
  const groups = [];
  let current = {header:null, fields:[]};
  container.querySelectorAll('.field-card').forEach(card=>{
    card.querySelectorAll('h3, h4, .field-row').forEach(el=>{
      if(SHEET_CUBIERTOS.has(el) || el.closest('.data-sheet')) return;   // ya va en la tabla de datos y resultados
      if(el.tagName==='H3' || el.tagName==='H4'){
        if(current.fields.length) groups.push(current);
        current = {header: el.textContent.trim(), fields: []};
      } else {
        const label = el.querySelector('label');
        const inputs = el.querySelectorAll('input, select');
        if(!label || !inputs.length) return;
        let value;
        if(inputs.length===1){
          const elIn = inputs[0];
          value = elIn.tagName==='SELECT' ? (elIn.options[elIn.selectedIndex]?elIn.options[elIn.selectedIndex].textContent:'') : elIn.value;
        } else {
          value = Array.from(inputs).map(e=>e.value).join(' ');
        }
        current.fields.push({label: label.textContent.trim(), value});
      }
    });
  });
  if(current.fields.length) groups.push(current);

  const resultBlocks = [];
  container.querySelectorAll('.results').forEach(rb=>{
    if(SHEET_CUBIERTOS.has(rb)) return;
    const rows = [];
    rb.querySelectorAll(':scope > .result-row').forEach(row=>{
      const k = row.querySelector('.k'), v = row.querySelector('.v');
      if(!k || !v) return;
      rows.push({label:k.textContent.trim(), value:v.textContent.trim(), accent:v.classList.contains('accent')});
    });
    if(rows.length) resultBlocks.push(rows);
  });

  const tables = [];
  container.querySelectorAll('table.data-table').forEach(t=>{ if(!t.closest('.data-sheet')) tables.push(t.outerHTML); });

  const diagrams = [];
  container.querySelectorAll('.plot-wrap svg').forEach(svg=>diagrams.push(svg.outerHTML));

  const sheets = [];
  container.querySelectorAll('.data-sheet').forEach(s=>sheets.push(s.outerHTML));

  return {groups, resultBlocks, tables, diagrams, sheets};
}
function wireToolActions(toolId){
  const exportBtn = document.getElementById('btnExportInforme');
  const shareBtn = document.getElementById('btnShareCapture');
  const msg = document.getElementById('actionMsg');
  if(!exportBtn) return;

  exportBtn.addEventListener('click', ()=>{
    if(VR_TOOLS.includes(toolId)){
      const vr = buildInformeVerificacion(toolId);
      if(vr.error){ msg.textContent = vr.error; return; }
      msg.textContent = '';
      let pa = document.getElementById('printArea');
      if(!pa){ pa = document.createElement('div'); pa.id='printArea'; document.body.appendChild(pa); }
      pa.className = 'vr'; pa.innerHTML = vr; document.body.classList.add('vr-printing');
      window.addEventListener('afterprint', ()=>{ pa.className=''; document.body.classList.remove('vr-printing'); }, {once:true});
      window.print();
      return;
    }
    const data = collectToolReportData();
    if(!data || (!data.resultBlocks.length && !data.diagrams.length && !data.sheets.length)){
      msg.textContent = 'Completa el formulario y presiona Calcular antes de exportar.';
      return;
    }
    const logo = document.querySelector('.brand-logo');
    const name = TOOLS[toolId].name;
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CL')+' · '+now.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
    let html = `<div class="pr-header">
      <div class="pr-header-left">${logo?`<img src="${logo.src}" alt="Topo de Bolsillo">`:''}<div class="pr-brand">Topo de Bolsillo<small>CÁLCULOS TOPOGRÁFICOS Y GEODÉSICOS</small></div></div>
      <div class="pr-meta">Fecha: ${fecha}<br>Sistema angular: ${angleSystem==='cent'?'Centesimal (gon)':'Sexagesimal (° \' \")'}</div>
    </div>
    <h1>${name}</h1>
    <p class="pr-desc">${document.querySelector('.tool-blurb')?document.querySelector('.tool-blurb').textContent:''}</p>`;
    if(data.groups.length){
      html += `<div class="pr-section-label">Datos de entrada</div>`;
      data.groups.forEach(g=>{
        if(g.header) html += `<div style="font-weight:700;font-size:11.5px;margin:6px 0 2px;">${g.header}</div>`;
        html += `<table class="pr-fields">`+g.fields.map(f=>`<tr><td class="k">${f.label}</td><td class="v">${f.value}</td></tr>`).join('')+`</table>`;
      });
    }
    if(data.resultBlocks.length){
      html += `<div class="pr-section-label">Resultados</div>`;
      data.resultBlocks.forEach(rows=>{
        html += `<div class="pr-results">`+rows.map(r=>`<div class="result-row"><span class="k">${r.label}</span><span class="v${r.accent?' accent':''}">${r.value}</span></div>`).join('')+`</div>`;
      });
    }
    const htmlDetalle = data.tables.length ? `<div class="pr-section-label">Detalle</div>` + data.tables.join('') : '';
    const htmlDiagrama = data.diagrams.length ? `<div class="pr-section-label">Diagrama</div>` + data.diagrams.map(svg=>`<div class="plot-wrap" style="max-width:420px;margin:0 auto;">${svg}</div>`).join('') : '';
    if(data.sheets.length){
      // Con tabla de datos y resultados: diagrama, luego la tabla (como en pantalla) y al final el detalle
      html += htmlDiagrama + `<div class="pr-section-label">Datos y resultados</div>` + data.sheets.join('') + htmlDetalle;
    } else {
      html += htmlDetalle + htmlDiagrama;
    }
    html += `<div class="pr-signoff"><div class="box">Firma responsable</div><div class="box">Timbre / Visación</div></div>`;

    let printArea = document.getElementById('printArea');
    if(!printArea){ printArea = document.createElement('div'); printArea.id='printArea'; document.body.appendChild(printArea); }
    printArea.innerHTML = html;
    window.print();
  });

  shareBtn.addEventListener('click', ()=>{
    msg.textContent = 'Preparando captura…';
    const finish = (text)=>{ msg.textContent = text; };
    const doCapture = ()=>{
      const container = document.querySelector('.tool-view');
      const actionBar = container.querySelector('.action-bar');
      actionBar.style.visibility = 'hidden';
      window.html2canvas(container, {backgroundColor: getComputedStyle(document.body).getPropertyValue('--paper') || '#ffffff', scale: 2})
        .then(canvas=>{
          actionBar.style.visibility = '';
          canvas.toBlob(blob=>{
            if(!blob){ finish('No se pudo generar la imagen.'); return; }
            const file = new File([blob], 'geomav-'+toolId+'.png', {type:'image/png'});
            if(navigator.canShare && navigator.canShare({files:[file]})){
              navigator.share({files:[file], title: TOOLS[toolId].name}).then(()=>finish('')).catch(()=>finish(''));
            } else {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'geomav-'+toolId+'.png';
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              setTimeout(()=>URL.revokeObjectURL(url), 1000);
              finish('Imagen descargada.');
            }
          }, 'image/png');
        }).catch(()=>{ actionBar.style.visibility = ''; finish('No se pudo generar la captura.'); });
    };
    if(window.html2canvas){ doCapture(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = doCapture;
    s.onerror = ()=>finish('No se pudo cargar la función de captura (requiere conexión la primera vez).');
    document.head.appendChild(s);
  });
}
function downloadTextFile(filename, text, mimeType){
  const blob = new Blob([text], {type:(mimeType||'text/csv;charset=utf-8;')});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function addCSVButton(container, filename, csvText){
  const btn = document.createElement('button');
  btn.type='button'; btn.className='btn-sm'; btn.style.marginTop='10px';
  btn.textContent='⬇ Exportar CSV';
  btn.addEventListener('click', ()=> downloadTextFile(filename, csvText));
  container.appendChild(btn);
}
function coordsToDXFPolyline(coordE, coordN, closed){
  let s = '0\nSECTION\n2\nENTITIES\n';
  s += `0\nPOLYLINE\n8\n0\n66\n1\n70\n${closed?1:0}\n`;
  for(let i=0;i<coordE.length;i++){
    s += `0\nVERTEX\n8\n0\n10\n${coordE[i]}\n20\n${coordN[i]}\n30\n0\n`;
  }
  s += '0\nSEQEND\n';
  s += '0\nENDSEC\n0\nEOF\n';
  return s;
}
function coordsToKMLPolygon(coordE, coordN, zona, hemi, nombre){
  const coordsStr = coordE.map((e,i)=>{
    const ll = utmToLatLon(e, coordN[i], zona, hemi);
    return `${ll.lon},${ll.lat},0`;
  }).join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\n<Placemark><name>${nombre||'Poligono'}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>\n${coordsStr}\n</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n</Document></kml>`;
}
function addExportButtons(container, baseName, opts){
  const wrap = document.createElement('div');
  wrap.style.marginTop='8px';
  if(opts.dxf){
    const b=document.createElement('button'); b.type='button'; b.className='btn-sm'; b.style.marginRight='6px';
    b.textContent='⬇ DXF (CAD)'; b.addEventListener('click', ()=> downloadTextFile(`${baseName}.dxf`, opts.dxf(), 'application/dxf'));
    wrap.appendChild(b);
  }
  if(opts.kml){
    const b=document.createElement('button'); b.type='button'; b.className='btn-sm'; b.style.marginRight='6px';
    b.textContent='⬇ KML (Google Earth)'; b.addEventListener('click', ()=> downloadTextFile(`${baseName}.kml`, opts.kml(), 'application/vnd.google-earth.kml+xml'));
    wrap.appendChild(b);
  }
  if(opts.gpx){
    const b=document.createElement('button'); b.type='button'; b.className='btn-sm';
    b.textContent='⬇ GPX (GPS)'; b.addEventListener('click', ()=> downloadTextFile(`${baseName}.gpx`, opts.gpx(), 'application/gpx+xml'));
    wrap.appendChild(b);
  }
  container.appendChild(wrap);
}
function puntoMetaDefault(){ const pr = loadMapaZonaPref(); return {huso:pr.zona, hemi:pr.hemi, datum:'WGS84', sistema:'UTM'}; }
function normalizarPunto(p){
  const d = puntoMetaDefault();
  if(!p.huso) p.huso = d.huso;
  if(!p.hemi) p.hemi = d.hemi;
  if(!p.datum) p.datum = d.datum;
  if(!p.sistema) p.sistema = d.sistema;
  return p;
}
function puntoSistemaTxt(p){ return p.sistema==='UTM' ? `${p.huso}${p.hemi} · ${p.datum}` : `${p.sistema} · ${p.datum}`; }
function gruposLibreta(){
  const m = new Map();
  PUNTOS.forEach(p=>{ if(!p.grupo) return; if(!m.has(p.grupo)) m.set(p.grupo, []); m.get(p.grupo).push(p); });
  return m;
}
function fechaCorta(){
  const d = new Date(), z = n=>String(n).padStart(2,'0');
  return `${z(d.getDate())}-${z(d.getMonth()+1)} ${z(d.getHours())}:${z(d.getMinutes())}`;
}
function loadPuntos(){
  try{
    const raw = JSON.parse(localStorage.getItem('topocalc-libreta')||'[]');
    const cambio = raw.some(p=> !p.huso || !p.hemi || !p.datum || !p.sistema);
    const out = raw.map(normalizarPunto);
    if(cambio) localStorage.setItem('topocalc-libreta', JSON.stringify(out));
    return out;
  }catch(e){ return []; }
}
function savePuntosStore(){
  try{ localStorage.setItem('topocalc-libreta', JSON.stringify(PUNTOS)); }catch(e){}
}
let PUNTOS = loadPuntos();
let puntoAutoId = PUNTOS.reduce((m,p)=>Math.max(m,p.id||0),0)+1;
function agregarPunto(nombre, E, N, cota, descripcion, meta){
  const m = Object.assign(puntoMetaDefault(), meta||{});
  const p = {id:puntoAutoId++, nombre: nombre || ('P'+puntoAutoId), E, N, cota: (cota===undefined||cota===null||isNaN(cota))?null:cota, descripcion: descripcion||'',
             huso:m.huso, hemi:m.hemi, datum:m.datum, sistema:m.sistema, grupo: m.grupo || ''};
  PUNTOS.push(p);
  savePuntosStore();
  return p;
}
function escHTML(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function grupoSelectHTML(selId, minPts){
  const gs = [...gruposLibreta()].filter(([,pts])=>pts.length>=minPts);
  if(!gs.length) return '';
  return `<div class="field-row"><label for="${selId}">Cargar un grupo completo de la Libreta</label><select id="${selId}"><option value="">— Elegir grupo —</option>${gs.map(([g,pts])=>`<option value="${escHTML(g)}">${escHTML(g)} (${pts.length} pts · ${pts[0].sistema==='UTM'?pts[0].huso+pts[0].hemi:pts[0].sistema})</option>`).join('')}</select></div><p class="tool-blurb" id="${selId}_msg" style="margin:0;"></p>`;
}
function rellenarDesdePuntos(pts, pref, metas){
  pts.forEach((p,i)=>{
    document.getElementById(`${pref}_e_${i}`).value = p.E;
    document.getElementById(`${pref}_n_${i}`).value = p.N;
    metas[i] = {huso:p.huso, hemi:p.hemi, datum:p.datum, sistema:p.sistema};
    const t = document.getElementById(`${pref}_tag_${i}`); if(t) t.textContent = `Tomado de la Libreta: ${p.nombre} · ${puntoSistemaTxt(p)}`;
  });
}
const EJ_E0 = 257966.91, EJ_N0 = 6076388.97;
function metaClave(m){ return (m.sistema==='UTM' ? `UTM ${m.huso}${m.hemi}` : m.sistema) + ' · ' + m.datum; }
function metasIncompatibles(metas){
  const ks = [...new Set(metas.filter(Boolean).map(metaClave))];
  return ks.length > 1 ? ks : null;
}
function msgIncompatibles(ks){
  return `<p class="err-msg">Los puntos traídos de la Libreta están en sistemas distintos (${ks.join(' y ')}): no se pueden mezclar en un mismo cálculo plano. Conviértelos al mismo huso antes de calcular.</p>`;
}
function libretaOpcionesHTML(){
  return `<option value="">⬇ Traer de la Libreta…</option>` + PUNTOS.map(p=>`<option value="${p.id}">${p.nombre} · ${p.sistema==='UTM'?p.huso+p.hemi:p.sistema}</option>`).join('');
}
function libretaCompactoHTML(selId){
  if(!PUNTOS.length) return '';
  return `<div class="field-row"><select id="${selId}" aria-label="Traer de la Libreta">${libretaOpcionesHTML()}</select></div>`;
}
function libretaTraerA(selId, idE, idN, setMeta, msgId){
  const sel = document.getElementById(selId), el = document.getElementById(msgId || (selId+'_msg'));
  const say = t => { if(!el) return; el.textContent = t; if(el.tagName==='P') el.style.margin = t ? '0 0 8px' : '0'; };
  if(sel) sel.addEventListener('change', ()=>{
    const p = PUNTOS.find(q=>String(q.id)===sel.value); sel.value = '';
    if(!p) return;
    document.getElementById(idE).value = p.E; document.getElementById(idN).value = p.N;
    setMeta({huso:p.huso, hemi:p.hemi, datum:p.datum, sistema:p.sistema});
    say(`Tomado de la Libreta: ${p.nombre} · ${puntoSistemaTxt(p)}`);
  });
  [idE, idN].forEach(id=>{ const x = document.getElementById(id); if(x) x.addEventListener('input', ()=>{ setMeta(null); say(''); }); });
}
let LEAFLET_LOADED = false;
let LEAFLET_LOADING = null;
function ensureLeaflet(){
  if(LEAFLET_LOADED || (typeof window!=='undefined' && window.L)){ LEAFLET_LOADED=true; return Promise.resolve(); }
  if(LEAFLET_LOADING) return LEAFLET_LOADING;
  LEAFLET_LOADING = new Promise((resolve, reject)=>{
    const cssHref = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    if(!document.querySelector(`link[href="${cssHref}"]`)){
      const link = document.createElement('link');
      link.rel='stylesheet'; link.href=cssHref;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = ()=>{ LEAFLET_LOADED=true; resolve(); };
    script.onerror = ()=>{ LEAFLET_LOADING=null; reject(new Error('No se pudo cargar el mapa (revisa tu conexión a internet).')); };
    document.head.appendChild(script);
  });
  return LEAFLET_LOADING;
}
function loadMapaZonaPref(){
  try{
    return {
      zona: parseInt(localStorage.getItem('topocalc-mapa-zona')||'19',10),
      hemi: localStorage.getItem('topocalc-mapa-hemi')||'S'
    };
  }catch(e){ return {zona:19, hemi:'S'}; }
}
function fieldRow(label, id, value, opts){
  opts = opts || {};
  const type = opts.type || 'number';
  const step = opts.step || 'any';
  return `<div class="field-row"><label for="${id}">${label}</label>
    <input type="${type}" id="${id}" ${type==='number'?`step="${step}"`:''} value="${value!==undefined?value:''}" ${opts.placeholder?`placeholder="${opts.placeholder}"`:''}></div>`;
}
function val(id){ return parseFloat(document.getElementById(id).value); }
function valInt(id){ return parseInt(document.getElementById(id).value,10); }
function elipsoidFieldHTML(id, label){
  label = label || 'Elipsoide de referencia';
  return `<div class="field-row"><label for="${id}">${label}</label>
    <select id="${id}"><option value="wgs84" selected>WGS84 / GRS80 (SIRGAS)</option><option value="hayford">Hayford / International 1924 (PSAD56)</option></select></div>`;
}
function readElipsoid(id){
  const v = document.getElementById(id).value;
  return v==='hayford' ? {a:6378388, f:1/297} : {a:6378137, f:1/298.257223563};
}
const POL_LABELS = "ABCDEFGHIJKLMNOPQRST".split('');
function svgAreaCoordenadas(pts){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const FS_LADO = 2, FS_ANG = 1.5;                       // tamaños de la plantilla de Mario
  const eng = svgLblEngine(W,H);
  const n = pts.length;
  const name = i => POL_LABELS[i];
  const sideName = i => POL_LABELS[i] + POL_LABELS[(i+1)%n];
  const corto = n > 8;

  // ---- cálculo: lados, perímetro, área e ángulos interiores (según el sentido real del polígono) ----
  const dist = pts.map((p,i)=>{ const q=pts[(i+1)%n]; return Math.hypot(q.e-p.e, q.n-p.n); });
  const perim = dist.reduce((a,b)=>a+b,0);
  let a2=0; for(let i=0;i<n;i++){ const p=pts[i], q=pts[(i+1)%n]; a2 += p.e*q.n - q.e*p.n; }
  const areaM2 = Math.abs(a2)/2, areaHa = areaM2/10000, sg = a2>=0 ? 1 : -1;
  const angInt = pts.map((p,i)=>{
    const a=pts[(i+n-1)%n], b=pts[(i+1)%n];
    const vn=[b.e-p.e, b.n-p.n], vp=[a.e-p.e, a.n-p.n];
    let t=Math.atan2(sg*(vn[0]*vp[1]-vn[1]*vp[0]), vn[0]*vp[0]+vn[1]*vp[1]); if(t<0) t+=2*Math.PI;
    return t*180/Math.PI;
  });
  const dTxt = i => `${fmtNum(dist[i],2)} m`;
  const aTxt = i => fmtAngle(angInt[i]);

  // ---- listado: bloque 1 (Área, Perímetro, lados) y bloque 2 (ángulos), columnas de PER_COL filas ----
  const blk1 = [{k:'Área',c:'var(--accent)',v:`${fmtNum(areaHa,4)} ha`},{k:'Área',c:'var(--accent)',v:`${fmtNum(areaM2,2)} m²`},{k:'Perímetro',c:'var(--ink)',v:`${fmtNum(perim,2)} m`, solo:true}];
  for(let i=0;i<n;i++) blk1.push({k:sideName(i), c:'var(--blueprint)', v:dTxt(i)});
  const blk2 = []; for(let i=0;i<n;i++) blk2.push({k:name(i), c:'var(--success)', v:aTxt(i)});
  const ROW_Y0=12.521, ROW_DY=5.761, LIM=286;
  const rowW = r => eng.tw(`${r.k} = ${r.v}`,4.32);
  let PER_COL=10, cols;
  const layout = pc => {
    const out=[]; let x=10.026;
    [blk1,blk2].forEach(b=>{
      for(let s=0;s<b.length;s+=pc){
        const rows=b.slice(s,s+pc), w=Math.max(...rows.map(rowW));
        out.push({x, rows, w}); x = Math.max(x+70, x+5.185+w+10);
      }
      // el bloque 2 empieza en columna nueva; (el avance ya está hecho)
    });
    return out;
  };
  for(; PER_COL<=24; PER_COL++){ cols=layout(PER_COL); const last=cols[cols.length-1]; if(last.x+5.185+last.w <= LIM) break; }
  const listRight = Math.max(...cols.map(c=>c.x+5.185+c.w))+1;
  const listBottom = ROW_Y0 + (Math.min(Math.max(blk1.length,blk2.length),PER_COL)-1)*ROW_DY + 1;
  eng.rectFill(8.5, 6.5, listRight, listBottom+0.5);
  eng.rectFill(292, 3, 308, 38);                                  // flecha norte

  // ---- polígono a escala ----
  const top=Math.max(50, listBottom+(n>8?12:7)), bot=168, left=75, right=265;
  const minE=Math.min(...pts.map(p=>p.e)), maxE=Math.max(...pts.map(p=>p.e));
  const minN=Math.min(...pts.map(p=>p.n)), maxN=Math.max(...pts.map(p=>p.n));
  const spanE=Math.max(maxE-minE,0.001), spanN=Math.max(maxN-minN,0.001);
  const sc=Math.min((right-left)/spanE,(bot-top)/spanN);
  const ox=(left+right)/2-(spanE*sc)/2, oy=(top+bot)/2+(spanN*sc)/2;
  const V = pts.map(p=>({x:ox+(p.e-minE)*sc, y:oy-(p.n-minN)*sc}));
  const s2 = V.reduce((s,p,i)=>{ const q=V[(i+1)%n]; return s+p.x*q.y-q.x*p.y; },0);

  let out='';
  out += `<path d="M${V.map(p=>f(p.x)+' '+f(p.y)).join(' L')} Z" fill="var(--accent)" fill-opacity="0.14" stroke="none"/>\n`;
  out += `<path d="M${V.map(p=>f(p.x)+' '+f(p.y)).join(' L')} Z" fill="none" stroke="var(--accent)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  V.forEach((p,i)=>{ const q=V[(i+1)%n]; eng.seg(p.x,p.y,q.x,q.y); });

  // arcos de ángulo interior (success) — se registran como obstáculos
  const sgS = s2>=0 ? 1 : -1, bis=[];
  V.forEach((p,i)=>{
    const a=V[(i+n-1)%n], b=V[(i+1)%n];
    const ln=Math.hypot(b.x-p.x,b.y-p.y)||1, lp=Math.hypot(a.x-p.x,a.y-p.y)||1;
    const vn=[(b.x-p.x)/ln,(b.y-p.y)/ln], vp=[(a.x-p.x)/lp,(a.y-p.y)/lp];
    let t=Math.atan2(sgS*(vn[0]*vp[1]-vn[1]*vp[0]), vn[0]*vp[0]+vn[1]*vp[1]); if(t<0) t+=2*Math.PI;
    const r=Math.max(2.5, Math.min(7, 0.4*Math.min(ln,lp)));
    const sw = sgS>0 ? 1 : 0, large = t>Math.PI ? 1 : 0;
    out += `<path d="M${f(p.x+vn[0]*r)} ${f(p.y+vn[1]*r)} A${f(r)} ${f(r)} 0 ${large} ${sw} ${f(p.x+vp[0]*r)} ${f(p.y+vp[1]*r)}" fill="none" stroke="var(--success)" stroke-width="0.8" stroke-linecap="round"/>\n`;
    for(let k=0;k<=12;k++){ const th=sgS*t*k/12, c=Math.cos(th), s=Math.sin(th); eng.pts.push([p.x+r*(vn[0]*c-vn[1]*s), p.y+r*(vn[0]*s+vn[1]*c)]); }
    const th=sgS*t/2, c=Math.cos(th), s=Math.sin(th);
    bis.push({u:[vn[0]*c-vn[1]*s, vn[0]*s+vn[1]*c], r});
  });
  V.forEach(p=>{ out += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="2" fill="var(--ink-soft)"/>\n`; eng.circle(p.x,p.y,2.3); });
  // norte
  out += `<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n`;
  out += `<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n`;
  out += `<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`;

  const lab = (t,fs,col,c) => { const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };
  const omit = (t,fs,cands) => Math.min(...cands.map(q=>eng.count(eng.box(t,fs,q),0.5)))>0;
  const outN = i => { const p=V[i], q=V[(i+1)%n], dx=q.x-p.x, dy=q.y-p.y, l=Math.hypot(dx,dy)||1; const k=s2>0?1:-1; return [k*dy/l,-k*dx/l]; };

  // ángulos interiores: sobre la bisectriz, leídos a lo largo de ella (a la derecha), pegados al arco
  for(let i=0;i<n;i++){
    const t = corto ? aTxt(i) : `${name(i)} = ${aTxt(i)}`, w=eng.tw(t,FS_ANG), u=bis[i].u;
    let ang=Math.atan2(u[1],u[0])*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, up=[Math.sin(th),-Math.cos(th)], cands=[];
    for(let g=bis[i].r+1.6; g<=bis[i].r+16; g+=1.2){
      const d=g+w/2, cx=V[i].x+u[0]*d, cy=V[i].y+u[1]*d;
      cands.push({x:cx-up[0]*0.364*FS_ANG, y:cy-up[1]*0.364*FS_ANG, rot:ang, anchor:'middle', pen:(g-bis[i].r)*0.6});
    }
    if(omit(t,FS_ANG,cands)) continue;
    lab(t,FS_ANG,'var(--success)',eng.pick(t,FS_ANG,cands));
  }
  // lados: a lo largo de su línea, por fuera; si no cabe se desliza, se aleja o pasa al interior
  for(let i=0;i<n;i++){
    const p=V[i], q=V[(i+1)%n], dx=q.x-p.x, dy=q.y-p.y, len=Math.hypot(dx,dy)||1;
    let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<-90) ang+=180;
    const th=ang*Math.PI/180, g=[Math.sin(th),-Math.cos(th)], u=[Math.cos(th),Math.sin(th)], no=outN(i);
    const mx=(p.x+q.x)/2, my=(p.y+q.y)/2;
    const t = corto ? dTxt(i) : `${sideName(i)} = ${dTxt(i)}`;
    const tmax=Math.max(0, len/2 - eng.tw(t,FS_LADO)/2 - 3), cands=[];
    for(let s=0;s<=tmax+1e-6;s+=2) for(const sgn of [1,-1]){ if(s===0&&sgn===-1) continue;
      [[1,0],[1,2],[1,4],[1,6],[-1,0],[-1,2]].forEach(([side,extra])=>{
        const nn=[no[0]*side,no[1]*side], d=((g[0]*nn[0]+g[1]*nn[1])>0 ? 0.4 : 1.05)*FS_LADO + extra;
        cands.push({x:mx+u[0]*s*sgn+nn[0]*d, y:my+u[1]*s*sgn+nn[1]*d, rot:ang, anchor:'middle', pen:s*0.4+(side<0?10:0)+extra*1.2});
      });
    }
    if(omit(t,FS_LADO,cands)) continue;
    lab(t,FS_LADO,'var(--blueprint)',eng.pick(t,FS_LADO,cands));
  }
  // vértices: letra hacia afuera
  for(let i=0;i<n;i++){
    const a=outN((i+n-1)%n), b=outN(i); let ux=a[0]+b[0], uy=a[1]+b[1]; const l=Math.hypot(ux,uy)||1; ux/=l; uy/=l;
    const cands=[];
    for(let r=4.6; r<=11; r+=1.2) for(let da=-70; da<=70; da+=14){
      const ca=Math.cos(da*Math.PI/180), sa=Math.sin(da*Math.PI/180), vx=ux*ca-uy*sa, vy=ux*sa+uy*ca;
      cands.push({x:V[i].x+vx*r, y:V[i].y+vy*r+1.6, anchor:'middle', pen:(r-4.6)*1.5+Math.abs(da)*0.05});
    }
    lab(name(i),4.5,'var(--ink-soft)',eng.pick(name(i),4.5,cands));
  }
  // área: en el interior, lo más lejos posible de los bordes
  {
    const inside=(x,y)=>{ let c=false; for(let i=0,j=n-1;i<n;j=i++){ const a=V[i], b=V[j]; if(((a.y>y)!==(b.y>y)) && (x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)) c=!c; } return c; };
    const dEdge=(x,y)=>{ let m=1e9; for(let i=0;i<n;i++){ const a=V[i], b=V[(i+1)%n], dx=b.x-a.x, dy=b.y-a.y, l2=dx*dx+dy*dy||1; let t=((x-a.x)*dx+(y-a.y)*dy)/l2; t=Math.max(0,Math.min(1,t)); m=Math.min(m,Math.hypot(x-a.x-t*dx,y-a.y-t*dy)); } return m; };
    const t=`Área = ${fmtNum(areaHa,4)} ha`, cands=[]; let best=0;
    const xs=V.map(p=>p.x), ys=V.map(p=>p.y), pp=[];
    for(let x=Math.min(...xs); x<=Math.max(...xs); x+=2.5) for(let y=Math.min(...ys); y<=Math.max(...ys); y+=2.5) if(inside(x,y)){ const d=dEdge(x,y); pp.push([x,y,d]); best=Math.max(best,d); }
    pp.forEach(([x,y,d])=>cands.push({x, y:y+1.5, anchor:'middle', pen:(best-d)*0.8}));
    const tw0=eng.tw(t,4.5), mxx=Math.max(...xs), mnx=Math.min(...xs), my0=(Math.min(...ys)+Math.max(...ys))/2;
    for(let dy=-40; dy<=40; dy+=6){ cands.push({x:mxx+8+tw0/2, y:my0+dy, anchor:'middle', pen:30+Math.abs(dy)*0.1}); cands.push({x:mnx-8-tw0/2, y:my0+dy, anchor:'middle', pen:30+Math.abs(dy)*0.1}); }
    if(!cands.length) cands.push({x:(Math.min(...xs)+Math.max(...xs))/2, y:(Math.min(...ys)+Math.max(...ys))/2, anchor:'middle', pen:0});
    lab(t,4.5,'var(--accent)',eng.pick(t,4.5,cands));
  }
  // listado
  cols.forEach(c=>c.rows.forEach((r,row)=>{
    const by=ROW_Y0+row*ROW_DY;
    out += `<rect x="${f(c.x)}" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n`;
    out += `<text x="${f(c.x+5.185)}" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.k}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`;
  }));
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function svgFuente(text, w, h){
  return `<text x="${w-5}" y="${h-5}" font-size="7.3" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="end" opacity="0.65">${text}</text>`;
}
function relFont(w, mult, min, max){
  return Math.max(min||6.5, Math.min(max||10, w*(mult||0.032)));
}
function svgLineLabel(x1, y1, x2, y2, text, color, fontSize, side, offsetMult, weight){
  const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1;
  const s = side===-1?-1:1;
  const nx=-(dy/len)*s, ny=(dx/len)*s;
  let angle = Math.atan2(dy,dx)*180/Math.PI;
  if(angle>90) angle-=180;
  if(angle<-90) angle+=180;
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const off=(fontSize||8)*(offsetMult||0.85)+2;
  const lx=mx+nx*off, ly=my+ny*off;
  const fw=weight?` font-weight="${weight}"`:'';
  return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="${(fontSize||8).toFixed ? (fontSize||8).toFixed(1) : (fontSize||8)}" font-family="var(--font-mono)"${fw} fill="${color}" text-anchor="middle" transform="rotate(${angle.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})">${text}</text>`;
}
function thinLabelStep(n, maxLabels){
  if(n<=(maxLabels||10)) return 1;
  return Math.ceil(n/(maxLabels||10));
}
estadoPuente('areaGrupoPendiente', null);
const FLUJOS = { flujoPredio: ['puntosLibreta','poligonal','area'] };
estadoPuente('flujoRetorno', null);
function flujoPredioNombre(){
  try{ const v = (JSON.parse(localStorage.getItem('topocalc-flujo-predio')||'{}').nombre||'').trim(); return v || 'Predio 1'; }catch(e){ return 'Predio 1'; }
}
function svgKit(W,H){
  W=W||320; H=H||190;
  const eng=svgLblEngine(W,H);
  const f=v=>(+v).toFixed(2).replace(/\.?0+$/,'');
  const FONT='font-family="var(--font-body)" font-weight="700"';
  let out='', cols=[], hasNorth=false;
  const K={eng,W,H,f,FONT,listBottom:0,listRight:0};
  const rad=a=>a*Math.PI/180;
  K.add=s=>{out+=s;};
  K.line=(x1,y1,x2,y2,col,o)=>{o=o||{}; out+=`<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" fill="none" stroke="${col}" stroke-width="${o.sw||0.8}"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.op?` stroke-opacity="${o.op}"`:''} stroke-linecap="round"/>\n`; if(!o.noObs) eng.seg(x1,y1,x2,y2);};
  K.poly=(pts,o)=>{o=o||{}; const d='M'+pts.map(p=>f(p[0])+' '+f(p[1])).join(' L')+(o.close?' Z':'');
    out+=`<path d="${d}" fill="${o.fill||'none'}"${o.fo!=null?` fill-opacity="${o.fo}"`:''} stroke="${o.stroke||'none'}"${o.stroke?` stroke-width="${o.sw||0.8}" stroke-linecap="round" stroke-linejoin="round"`:''}${o.dash&&o.stroke?` stroke-dasharray="${o.dash}"`:''}/>\n`;
    if(o.stroke&&o.obs!==false){ for(let i=0;i+1<pts.length;i++) eng.seg(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]); if(o.close) eng.seg(pts[pts.length-1][0],pts[pts.length-1][1],pts[0][0],pts[0][1]); } };
  K.dot=(x,y,col,r)=>{r=r||2; out+=`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${col}"/>\n`; eng.circle(x,y,r+0.3);};
  // arco de centro (cx,cy), radio r, ángulos de pantalla en grados (0=este, crece en sentido horario) de a0 a a1 (sentido = signo de a1-a0)
  K.arc=(cx,cy,r,a0,a1,col,o)=>{o=o||{}; const d=a1-a0; if(Math.abs(d)<0.05) return;
    const P=a=>[cx+r*Math.cos(rad(a)), cy+r*Math.sin(rad(a))];
    if(Math.abs(d)>=359.9){ out+=`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${col}" stroke-width="${o.sw||0.8}"${o.dash?` stroke-dasharray="${o.dash}"`:''}/>\n`; }
    else { const p=P(a0), q=P(a1); out+=`<path d="M${f(p[0])} ${f(p[1])} A${f(r)} ${f(r)} 0 ${Math.abs(d)>180?1:0} ${d>0?1:0} ${f(q[0])} ${f(q[1])}" fill="none" stroke="${col}" stroke-width="${o.sw||0.8}"${o.dash?` stroke-dasharray="${o.dash}"`:''} stroke-linecap="round"/>\n`; }
    if(o.noObs) return; const n=Math.max(8,Math.min(400,Math.ceil(Math.abs(rad(d))*r/0.8))); for(let k=0;k<=n;k++) eng.pts.push(P(a0+d*k/n)); };
  K.txt=(t,fs,col,c)=>{const q=eng.txtAttrs(c); out+=`<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`;};
  K.put=(t,fs,col,cands,o)=>{o=o||{}; if(!cands.length) return null; if(o.omit!==false && Math.min(...cands.map(q=>eng.count(eng.box(t,fs,q),0.5)))>0) return null; const c=eng.pick(t,fs,cands); K.txt(t,fs,col,c); return c;};
  // rótulo a lo largo de un segmento (centro en at∈[0,1]); out=[ox,oy] lado preferido (hacia afuera); desliza, se aleja o cambia de lado
  K.lineLabel=(x1,y1,x2,y2,t,fs,col,o)=>{o=o||{}; const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1; let ang=Math.atan2(dy,dx)*180/Math.PI; if(ang>90) ang-=180; if(ang<=-90) ang+=180;
    const th=rad(ang), u=[Math.cos(th),Math.sin(th)], g=[Math.sin(th),-Math.cos(th)], w=eng.tw(t,fs), at=o.at==null?0.5:o.at, mx=x1+dx*at, my=y1+dy*at;
    const lo=-len*at+w/2+(o.margin==null?2:o.margin), hi=len*(1-at)-w/2-(o.margin==null?2:o.margin); const ss=[]; if(lo<=hi){ for(let s=0;s<=Math.max(-lo,hi)+1e-6;s+=2){ if(s<=hi) ss.push(s); if(s>0&&-s>=lo) ss.push(-s); } } else if(o.force) ss.push(0);
    const out_=o.out||[g[0],g[1]], pref=(g[0]*out_[0]+g[1]*out_[1])>=0?1:-1, cands=[], ex=o.extras||[0,fs*1.2,fs*2.4,fs*3.6];
    ss.forEach(s=>{ [pref,-pref].forEach((side,si)=>{ ex.forEach((e,ei)=>{ const n=[g[0]*side,g[1]*side], d=(side===1?0.5*fs:1.37*fs)+e;
      cands.push({x:mx+u[0]*s+n[0]*d, y:my+u[1]*s+n[1]*d, rot:ang, anchor:'middle', pen:Math.abs(s)*0.4+si*(o.noFlip?1000:10)+ei*1.5}); }); }); });
    return K.put(t,fs,col,cands,o);};
  // rótulo junto a un punto (hacia la dirección dir=[ux,uy], o alrededor si no hay)
  K.pointLabel=(t,x,y,fs,col,o)=>{o=o||{}; const cands=[], rmin=o.rmin||4.6, rmax=o.rmax||11, dir=o.dir, w=eng.tw(t,fs);
    const base=dir?Math.atan2(dir[1],dir[0]):0, span=(dir&&!o.full)?80:180, dpen=o.full?0.12:0.05;
    for(let r=rmin;r<=rmax;r+=1.2) for(let da=-span;da<=span;da+=((dir&&!o.full)?16:22.5)){ const a=base+rad(da), cx=x+Math.cos(a)*(r+(Math.abs(Math.cos(a))*w/2)), cy=y+Math.sin(a)*r+fs*0.364; cands.push({x:cx,y:cy,anchor:'middle',pen:(r-rmin)*1.5+Math.abs(da)*dpen}); }
    return K.put(t,fs,col,cands,o);};
  // rótulo horizontal en posición libre cercana a (x,y) con desplazamientos
  K.near=(t,x,y,fs,col,o)=>{o=o||{}; const cands=[]; for(let r=0;r<=(o.rmax||14);r+=1.5) for(let a=0;a<360;a+=(r?30:360)){ cands.push({x:x+r*Math.cos(rad(a)), y:y+r*Math.sin(rad(a)), anchor:'middle', pen:r*0.8}); } return K.put(t,fs,col,cands,o);};
  K.north=()=>{hasNorth=true; out+=`<path d="M300 36 L300 14" fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linecap="round"/>\n<path d="M300 10 L298.2 14.5 L301.8 14.5 Z" fill="var(--ink-soft)"/>\n<text x="300" y="7.5" ${FONT} font-size="4.5" fill="var(--ink-soft)" text-anchor="middle">N</text>\n`; eng.rectFill(292,3,308,38);};
  // listado: bloques de filas {k,c,v}; cada bloque empieza columna nueva; columnas de pc filas (crece hasta que quepa)
  K.list=(blocks,o)=>{o=o||{}; const ROW_Y0=12.521, ROW_DY=5.761, LIM=o.lim||(hasNorth?286:312), rowW=r=>eng.tw(`${r.k} = ${r.v}`,4.32);
    let pc=o.perCol||10, res;
    const lay=pc=>{const c=[]; let x=10.026; blocks.forEach((b,bi)=>{ for(let s=0;s<b.length;s+=pc){ const rows=b.slice(s,s+pc), w=Math.max(...rows.map(rowW)); c.push({x,rows,w}); x=Math.max(x+(o.minGap||0), x+5.185+w+(o.gap||12)); } }); return c;};
    for(;pc<=30;pc++){ res=lay(pc); const l=res[res.length-1]; if(l.x+5.185+l.w<=LIM) break; }
    cols=res; K.listRight=Math.max(...cols.map(c=>c.x+5.185+c.w))+1; K.listBottom=ROW_Y0+(Math.min(Math.max(...blocks.map(b=>b.length)),pc)-1)*ROW_DY+1; K.perCol=pc;
    eng.rectFill(8.5,6.5,K.listRight,K.listBottom+0.5); return K;};
  // ajuste a escala de puntos del mundo (E/N, norte arriba) a una caja {l,r,t,b}; devuelve {X,Y,sc}
  K.fit=(pts,box,o)=>{o=o||{}; const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]), mnx=Math.min(...xs), mxx=Math.max(...xs), mny=Math.min(...ys), mxy=Math.max(...ys);
    const sx=Math.max(mxx-mnx,1e-9), sy=Math.max(mxy-mny,1e-9); let sc=Math.min((box.r-box.l)/sx,(box.b-box.t)/sy); if(o.maxSc) sc=Math.min(sc,o.maxSc);
    const ox=(box.l+box.r)/2-(mnx+mxx)/2*sc, oy=(box.t+box.b)/2+(mny+mxy)/2*sc; return {sc,X:e=>ox+e*sc,Y:n=>oy-n*sc};};
  K.svg=()=>{ const ROW_Y0=12.521, ROW_DY=5.761; let s=out;
    cols.forEach(c=>c.rows.forEach((r,i)=>{ const by=ROW_Y0+i*ROW_DY; s+=`<rect x="${f(c.x)}" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n<text x="${f(c.x+5.185)}" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.k}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`; }));
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${s}</svg>`; };
  return K;
}
function svgLblEngine(W,H){
  const pts = [];
  const CW = {'0':.63,'1':.63,'2':.63,'3':.63,'4':.63,'5':.63,'6':.63,'7':.63,'8':.63,'9':.63,',':.28,'.':.28,' ':.26,'=':.6,
    '°':.46,"'":.26,'"':.42,'+':.6,'-':.5,'−':.6,'m':.98,'D':.76,'i':.29,'h':.62,'v':.58,'B':.7,'S':.66,'F':.6,'H':.78,'I':.3,'P':.7,'E':.62,'Z':.66,'N':.78,'C':.72,'α':.62,'Δ':.74,'ᵍ':.8,'g':.4,'s':.56,'o':.62,'t':.4,'a':.6,'l':.28,'(':.34,')':.34,'M':.9,'F':.6};
  const tw = (t,fs) => { let w=0; for(const ch of String(t)) w += (CW[ch]!==undefined?CW[ch]:.62); return w*fs*1.03; };
  const seg = (x1,y1,x2,y2,st=0.5) => { const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/st)); for(let i=0;i<=n;i++) pts.push([x1+(x2-x1)*i/n, y1+(y2-y1)*i/n]); };
  const poly = (a) => { for(let i=0;i+1<a.length;i++) seg(a[i][0],a[i][1],a[i+1][0],a[i+1][1]); };
  const rectFill = (x1,y1,x2,y2,st=0.9) => { for(let x=x1;x<=x2+1e-6;x+=st) for(let y=y1;y<=y2+1e-6;y+=st) pts.push([x,y]); };
  const rectOutline = (x1,y1,x2,y2) => { seg(x1,y1,x2,y1); seg(x2,y1,x2,y2); seg(x2,y2,x1,y2); seg(x1,y2,x1,y1); };
  const circle = (cx,cy,r) => { for(let a=0;a<Math.PI*2;a+=0.25){ pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]); } pts.push([cx,cy]); };
  // caja local de un rótulo: x en [x0, x0+w], y en [-asc, desc] (línea base en 0)
  const box = (t,fs,c) => {
    const w = tw(t,fs), asc=0.74*fs, desc=0.14*fs, an=c.anchor||'start';
    const x0 = an==='middle' ? -w/2 : (an==='end' ? -w : 0);
    const th=(c.rot||0)*Math.PI/180;
    return {w,asc,desc,x0,ox:c.x,oy:c.y,ct:Math.cos(th),st:Math.sin(th)};
  };
  const count = (b,m=0.5) => {
    let n=0;
    for(const p of pts){
      const dx=p[0]-b.ox, dy=p[1]-b.oy;
      const lx=dx*b.ct+dy*b.st, ly=-dx*b.st+dy*b.ct;
      if(lx>b.x0-m && lx<b.x0+b.w+m && ly>-b.asc-m && ly<b.desc+m) n++;
    }
    // fuera del lienzo
    for(const lx of [b.x0,b.x0+b.w]) for(const ly of [-b.asc,b.desc]){
      const X=b.ox+lx*b.ct-ly*b.st, Y=b.oy+lx*b.st+ly*b.ct;
      if(X<0.8||X>W-0.8||Y<0.8||Y>H-0.8) n+=500;
    }
    return n;
  };
  const addBox = (b,pad=0.7) => {
    for(let lx=b.x0-pad; lx<=b.x0+b.w+pad+1e-6; lx+=0.8) for(let ly=-b.asc-pad; ly<=b.desc+pad+1e-6; ly+=0.8){
      pts.push([b.ox+lx*b.ct-ly*b.st, b.oy+lx*b.st+ly*b.ct]);
    }
  };
  // elige la candidata de menor puntuación (choques*1000 + penalización) y la registra como obstáculo
  const pick = (t,fs,cands,m=0.5) => {
    let best=null, bs=1e18;
    for(const c of cands){
      const b=box(t,fs,c), s=count(b,m)*1000 + (c.pen||0);
      if(s<bs){ bs=s; best=c; best._b=b; best._hits=Math.floor(s/1000); }
    }
    if(best) addBox(best._b);
    return best;
  };
  const txtAttrs = (c) => {
    const an = c.anchor && c.anchor!=='start' ? ` text-anchor="${c.anchor}"` : '';
    return c.rot ? {pos:`transform="translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) rotate(${c.rot.toFixed(2)})"`, an}
                 : {pos:`x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}"`, an};
  };
  return {pts,tw,seg,poly,rectFill,rectOutline,circle,box,count,addBox,pick,txtAttrs};
}
let _idAuto = 0;
function mejorarAccesibilidad(){
  const main = document.getElementById('main'); if(!main) return;
  main.querySelectorAll('label:not([for])').forEach(l => {
    if(l.querySelector('input,select,textarea')) return;
    const c = l.parentElement && l.parentElement.querySelector('input:not([type=hidden]),select,textarea');
    if(!c) return;
    if(!c.id) c.id = 'a11y-' + (++_idAuto);
    l.setAttribute('for', c.id);
  });
  const sufijo = {d:'grados', m:'minutos', s:'segundos'};
  main.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(c => {
    if(c.getAttribute('aria-label') || c.getAttribute('aria-labelledby') || c.title || c.closest('label')) return;
    if(c.id && main.querySelector('label[for="'+c.id+'"]')) return;
    const fila = c.closest('.field-row') || c.parentElement, et = fila && fila.querySelector('label');
    const suf = c.id && sufijo[(c.id.match(/_([dms])$/)||[])[1]];
    if(et && suf) c.setAttribute('aria-label', et.textContent.trim() + ' — ' + suf);
    else if(et) c.setAttribute('aria-label', et.textContent.trim());
  });
}
