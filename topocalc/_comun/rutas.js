"use strict";
/* Rutas entre páginas de Topo de Bolsillo. Cada página declara en <body>:
   data-raiz="../../"  (cómo llegar a la carpeta topocalc/),  data-herramienta="id" y data-grupo="id" (solo páginas de herramienta). */
const MIGRADAS = ["puntosLibreta","mapaInteractivo","brujula","flujoPredio","utm","angulo","unidadesAgrarias","conversorDistancia","temperatura","pitagoras","escalaPlano","datumTransform","azimutSumaResta","geocentricas","directoGeodesico","inversoGeodesico","azimutVectorGeoc","factorEscalaUTM","ptl","converg","geoidal","areaElipsoidal","reducHorizonte","corrTemp","corrTension","corrNivelMar","poligonal","poligAbierta","radiacion","interseccion","triangulacion","replanteoPunto","rumbo","distPuntoLinea","inversaMultiple","taquimetria","cuadrilateroTriangulacion","cuadrilateroTrilateracion","area","areaIrregular","sector","volumen","nivel","nivelDif","nivelBaro","nivelTrigNMM","curvasNivel","pendienteDosPuntos","perfilLongitudinal","cotaProgresiva","talud","curvaC","radioCuerda","replanteo","replanteoOrdenadas","replanteoCuerda","clotoide","curvaCompuesta","curvaReversa","curvaV","peralte","curvaProgresiva","clotoideProgresiva","ejeProyecto","progresivaOffset","taludBancos","plantillaZanja","capasPavimento","disenoEscalera","visor360","gsd","traslapeVuelo","astronomica","declinacionSolar","chequeoNivel","chequeoTeodolito","chequeoEstacion","costo","cotizacion","boletaHonorarios","rendimientoBrigada"];   // herramientas que ya viven en su propia carpeta; el resto sigue en el index.html antiguo
const RUTA_HOME = '';
const NOMBRES_FLUJO = {"flujoPredio":"Levantamiento de Predio"};   // para el botón «↩ Volver a…»
/* Variable global cuyo valor sobrevive al cambiar de página (sessionStorage): reemplaza al estado en memoria de la app de una sola página. */
function estadoPuente(nombre, inicial){
  Object.defineProperty(window, nombre, { configurable:true,
    get(){ try{ const v = sessionStorage.getItem('tb_'+nombre); return v === null ? inicial : JSON.parse(v); }catch(e){ return inicial; } },
    set(v){ try{ sessionStorage.setItem('tb_'+nombre, JSON.stringify(v)); }catch(e){} } });
}
function raizApp(){ return document.body.getAttribute('data-raiz') || './'; }
function currentRoute(){ return document.body.getAttribute('data-herramienta') || 'home'; }
function urlHerramienta(id){ return raizApp() + (MIGRADAS.includes(id) ? 'herramientas/' + id + '/' : '#' + id); }
function go(h){
  if(!h || h === 'home'){ const g = document.body.getAttribute('data-grupo'); location.href = raizApp() + RUTA_HOME + (g ? '#g-' + g : ''); }   // desde una herramienta: vuelve a su grupo
  else location.href = urlHerramienta(h);
}
