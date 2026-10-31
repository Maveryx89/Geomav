"use strict";
/* Catálogo del menú: grupos y herramientas (nombre, descripción, ícono, grupo, si está en «Próximamente»,
   si ya vive en su propia carpeta). Generado a partir del index.html monolítico. */
const GRUPOS = [
 {
  "id": "proyecto",
  "nombre": "Proyecto y Datos",
  "desc": "Libreta de puntos, mapa y flujos de trabajo",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"6\" width=\"20\" height=\"28\" rx=\"2\"/><path d=\"M10 13h10M10 19h10M10 25h6\"/><path d=\"M30 10c4 0 7 3 7 7 0 5-7 12-7 12s-7-7-7-12c0-4 3-7 7-7Z\" fill=\"currentColor\" fill-opacity=\".12\"/><circle cx=\"30\" cy=\"17\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "tools": [
   "puntosLibreta",
   "mapaInteractivo",
   "brujula",
   "flujoPredio"
  ]
 },
 {
  "id": "conversiones",
  "nombre": "Conversiones y Referencia",
  "desc": "Unidades, ángulos, coordenadas y datum",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"5\" y=\"5\" width=\"30\" height=\"30\" rx=\"1\"/><path d=\"M5 15h30M5 25h30M15 5v30M25 5v30\" stroke-width=\"1\"/><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "tools": [
   "utm",
   "angulo",
   "unidadesAgrarias",
   "conversorDistancia",
   "temperatura",
   "pitagoras",
   "escalaPlano",
   "datumTransform",
   "azimutSumaResta"
  ]
 },
 {
  "id": "geodesia",
  "nombre": "Geodesia y GNSS",
  "desc": "Problemas geodésicos, escala UTM, PTL",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"22\" r=\"12\"/><path d=\"M20 34V6M8 22h24\" stroke-dasharray=\"2 2\"/><path d=\"M20 22 L30 10\" stroke-width=\"1.3\"/><circle cx=\"20\" cy=\"22\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "tools": [
   "geocentricas",
   "directoGeodesico",
   "inversoGeodesico",
   "azimutVectorGeoc",
   "factorEscalaUTM",
   "ptl",
   "converg",
   "geoidal",
   "areaElipsoidal"
  ]
 },
 {
  "id": "correcciones",
  "nombre": "Correcciones de Medición",
  "desc": "Reducción al horizonte y correcciones de cinta",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 32h28M6 32L28 12M28 32V12\" stroke-dasharray=\"2 2.2\"/><path d=\"M6 32L28 12\" stroke-dasharray=\"0\"/></svg>",
  "tools": [
   "reducHorizonte",
   "corrTemp",
   "corrTension",
   "corrNivelMar"
  ]
 },
 {
  "id": "levantamiento",
  "nombre": "Levantamiento y Coordenadas Planas",
  "desc": "Poligonales, radiación, intersecciones y ajustes",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M8 14 L20 7 L33 12 L30 30 L14 33 Z\"/><circle cx=\"8\" cy=\"14\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"20\" cy=\"7\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"33\" cy=\"12\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"30\" cy=\"30\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14\" cy=\"33\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "tools": [
   "poligonal",
   "poligAbierta",
   "radiacion",
   "interseccion",
   "triangulacion",
   "replanteoPunto",
   "rumbo",
   "distPuntoLinea",
   "inversaMultiple",
   "taquimetria",
   "cuadrilateroTriangulacion",
   "cuadrilateroTrilateracion"
  ]
 },
 {
  "id": "superficies",
  "nombre": "Superficies y Volúmenes",
  "desc": "Áreas, sectores y movimiento de tierras",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M7 10 L25 7 L33 20 L22 33 L9 27 Z\" fill=\"currentColor\" fill-opacity=\".12\"/></svg>",
  "tools": [
   "area",
   "areaIrregular",
   "sector",
   "volumen"
  ]
 },
 {
  "id": "altimetria",
  "nombre": "Altimetría y Nivelación",
  "desc": "Nivelaciones, cotas, pendientes y perfiles",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30 L14 30 L14 18 L24 18 L24 10 L36 10\"/><circle cx=\"4\" cy=\"30\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14\" cy=\"18\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"24\" cy=\"10\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "tools": [
   "nivel",
   "nivelDif",
   "nivelBaro",
   "nivelTrigNMM",
   "curvasNivel",
   "pendienteDosPuntos",
   "perfilLongitudinal",
   "cotaProgresiva",
   "talud"
  ]
 },
 {
  "id": "vias",
  "nombre": "Vías y Curvas",
  "desc": "Curvas horizontales y verticales, peralte y ejes",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 30 Q20 6 34 30\"/><path d=\"M6 30 L34 30\" stroke-dasharray=\"2 2.4\"/></svg>",
  "tools": [
   "curvaC",
   "radioCuerda",
   "replanteo",
   "replanteoOrdenadas",
   "replanteoCuerda",
   "clotoide",
   "curvaCompuesta",
   "curvaReversa",
   "curvaV",
   "peralte",
   "curvaProgresiva",
   "clotoideProgresiva",
   "ejeProyecto",
   "progresivaOffset"
  ]
 },
 {
  "id": "obras",
  "nombre": "Obras Civiles",
  "desc": "Taludes en bancos, zanjas, pavimentos y escaleras",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 34 H10 V27 H16 V20 H22 V13 H28 V6 H34\" fill=\"currentColor\" fill-opacity=\".08\"/></svg>",
  "tools": [
   "taludBancos",
   "plantillaZanja",
   "capasPavimento",
   "disenoEscalera"
  ]
 },
 {
  "id": "foto",
  "nombre": "Fotogrametría y Astronomía",
  "desc": "Drones, imágenes 360° y orientación astronómica",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"14\"/><ellipse cx=\"20\" cy=\"20\" rx=\"14\" ry=\"5\"/><ellipse cx=\"20\" cy=\"20\" rx=\"5.5\" ry=\"14\" stroke-width=\"1.1\"/><circle cx=\"20\" cy=\"20\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "tools": [
   "visor360",
   "gsd",
   "traslapeVuelo",
   "astronomica",
   "declinacionSolar"
  ]
 },
 {
  "id": "chequeos",
  "nombre": "Chequeos de Instrumentos",
  "desc": "Verificación de nivel, teodolito y estación total",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"4\" y=\"16\" width=\"24\" height=\"8\" rx=\"4\"/><circle cx=\"16\" cy=\"20\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M28 24l4 4 6-9\" stroke-width=\"2\"/></svg>",
  "tools": [
   "chequeoNivel",
   "chequeoTeodolito",
   "chequeoEstacion"
  ]
 },
 {
  "id": "gestion",
  "nombre": "Gestión y Costos",
  "desc": "Costos de brigada, cotización y honorarios",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"8\" y=\"5\" width=\"24\" height=\"30\" rx=\"2\"/><path d=\"M13 13h14M13 19h14M13 25h9\"/></svg>",
  "tools": [
   "costo",
   "cotizacion",
   "boletaHonorarios",
   "rendimientoBrigada"
  ]
 }
];
const CATALOGO = {
 "puntosLibreta": {
  "name": "Libreta de Puntos",
  "desc": "Guarda, importa y exporta coordenadas",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"6\" width=\"20\" height=\"28\" rx=\"2\"/><path d=\"M10 13h10M10 19h10M10 25h6\"/><path d=\"M30 10c4 0 7 3 7 7 0 5-7 12-7 12s-7-7-7-12c0-4 3-7 7-7Z\" fill=\"currentColor\" fill-opacity=\".12\"/><circle cx=\"30\" cy=\"17\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "proyecto",
  "oculta": false,
  "migrada": true
 },
 "mapaInteractivo": {
  "name": "Mapa Interactivo",
  "desc": "Puntos de la Libreta y GPS en vivo",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M5 10 L15 6 L25 10 L35 6 L35 30 L25 34 L15 30 L5 34 Z\"/><path d=\"M15 6v24M25 10v24\"/><circle cx=\"20\" cy=\"19\" r=\"2.4\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "proyecto",
  "oculta": false,
  "migrada": true
 },
 "brujula": {
  "name": "Brújula en Vivo",
  "desc": "Norte del sensor + vista en Realidad Aumentada",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"15\"/><path d=\"M20 8 L23.5 20 L20 32 L16.5 20 Z\" fill=\"currentColor\" fill-opacity=\".18\"/><circle cx=\"20\" cy=\"20\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M20 5v3M20 32v3M5 20h3M32 20h3\" stroke-width=\"1.1\"/></svg>",
  "grupo": "proyecto",
  "oculta": false,
  "migrada": true
 },
 "flujoPredio": {
  "name": "Levantamiento de Predio",
  "desc": "Libreta → Poligonal → Área, paso a paso",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><circle cx=\"7\" cy=\"20\" r=\"2.4\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M11 20h5M14 17.5l2.5 2.5-2.5 2.5\"/><path d=\"M20 13 L28 9 L35 15 L33 28 L22 30 Z\" fill=\"currentColor\" fill-opacity=\".12\"/><circle cx=\"20\" cy=\"13\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"28\" cy=\"9\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"35\" cy=\"15\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"33\" cy=\"28\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"22\" cy=\"30\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "proyecto",
  "oculta": false,
  "migrada": true
 },
 "utm": {
  "name": "Conversor de Coordenadas",
  "desc": "Decimal ↔ GMS ↔ UTM",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"5\" y=\"5\" width=\"30\" height=\"30\" rx=\"1\"/><path d=\"M5 15h30M5 25h30M15 5v30M25 5v30\" stroke-width=\"1\"/><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "conversiones",
  "oculta": false,
  "migrada": true
 },
 "angulo": {
  "name": "Conversor de Ángulos",
  "desc": "Decimal ↔ GMS ↔ Gon",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M8 32 L32 32 L32 12\"/><path d=\"M8 32 A16 16 0 0 1 22.3 17.2\" stroke-dasharray=\"2 2.4\"/><path d=\"M8 32 L 24 22\"/></svg>",
  "grupo": "conversiones",
  "oculta": false,
  "migrada": true
 },
 "unidadesAgrarias": {
  "name": "Conversor de Superficie",
  "desc": "m² ↔ ha ↔ km² ↔ acre ↔ vara²/pié²/cuadra²",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"6\" y=\"6\" width=\"28\" height=\"28\" rx=\"2\"/><path d=\"M6 20h28M20 6v28\" stroke-dasharray=\"2 2\"/></svg>",
  "grupo": "conversiones",
  "oculta": false,
  "migrada": true
 },
 "conversorDistancia": {
  "name": "Conversor de Distancia (Ley 1848)",
  "desc": "m ↔ vara, pié, cuadra — unidades legales chilenas",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 30h28\" stroke-width=\"2\"/><path d=\"M6 24v12M34 24v12M20 24v12\" stroke-width=\"1.2\"/></svg>",
  "grupo": "conversiones",
  "oculta": false,
  "migrada": true
 },
 "temperatura": {
  "name": "Conversor de Temperatura",
  "desc": "°C ↔ °F",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"17\" y=\"5\" width=\"6\" height=\"20\" rx=\"3\"/><circle cx=\"20\" cy=\"29\" r=\"6\"/><path d=\"M27 10h5M27 16h5\"/></svg>",
  "grupo": "conversiones",
  "oculta": true,
  "migrada": true
 },
 "pitagoras": {
  "name": "Teorema de Pitágoras",
  "desc": "Hipotenusa o cateto",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M8 32 L8 10 L32 32 Z\"/><path d=\"M8 26 L14 26 L14 32\" stroke-width=\"1.2\"/></svg>",
  "grupo": "conversiones",
  "oculta": false,
  "migrada": true
 },
 "escalaPlano": {
  "name": "Escala de Plano",
  "desc": "Distancia real ↔ distancia en papel",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 28h30M5 28v-5M12 28v-8M19 28v-5M26 28v-8M33 28v-5\"/></svg>",
  "grupo": "conversiones",
  "oculta": false,
  "migrada": true
 },
 "datumTransform": {
  "name": "Transformación de Datum",
  "desc": "PSAD56 ↔ SIRGAS/WGS84 (aprox.)",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><ellipse cx=\"14\" cy=\"20\" rx=\"9\" ry=\"13\"/><ellipse cx=\"26\" cy=\"20\" rx=\"9\" ry=\"13\"/><path d=\"M14 20h12\" stroke-dasharray=\"2 2\"/><path d=\"M22 16l4 4-4 4\" stroke-width=\"1.2\"/></svg>",
  "grupo": "conversiones",
  "oculta": true,
  "migrada": true
 },
 "azimutSumaResta": {
  "name": "Suma/Resta de Azimutes",
  "desc": "Ángulo ± azimut, normalizado 0°-360°",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"17\" cy=\"20\" r=\"11\"/><path d=\"M17 9v4M17 31v-4M6 20h4M28 20h-4\"/><path d=\"M17 20 L24.5 12.5\" stroke-width=\"2\"/><path d=\"M31 8h7M34.5 4.5v7M31 30h7\" stroke-width=\"1.4\"/></svg>",
  "grupo": "conversiones",
  "oculta": true,
  "migrada": true
 },
 "geocentricas": {
  "name": "Geocéntricas ↔ Geodésicas",
  "desc": "X,Y,Z ↔ latitud, longitud, altura",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"22\" r=\"12\"/><path d=\"M20 34V6M8 22h24\" stroke-dasharray=\"2 2\"/><path d=\"M20 22 L30 10\" stroke-width=\"1.3\"/><circle cx=\"20\" cy=\"22\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "directoGeodesico": {
  "name": "Problema Directo de la Geodesia",
  "desc": "Punto, azimut y distancia → punto destino (Vincenty)",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><ellipse cx=\"20\" cy=\"20\" rx=\"16\" ry=\"10\"/><circle cx=\"9\" cy=\"20\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M9 20 Q20 8 31 14\" stroke-width=\"1.3\"/><circle cx=\"31\" cy=\"14\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "inversoGeodesico": {
  "name": "Problema Inverso de la Geodesia",
  "desc": "Dos puntos → distancia y azimutes (Vincenty)",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><ellipse cx=\"20\" cy=\"20\" rx=\"16\" ry=\"10\"/><circle cx=\"8\" cy=\"24\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"32\" cy=\"14\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8 24 Q20 10 32 14\" stroke-dasharray=\"2 2\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "azimutVectorGeoc": {
  "name": "Azimut desde Vector GNSS",
  "desc": "ΔX,ΔY,ΔZ de línea base → azimut, cenital y distancia",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"12\" cy=\"28\" r=\"2\"/><circle cx=\"30\" cy=\"10\" r=\"2\"/><path d=\"M12 28 L30 10\" stroke-dasharray=\"1.5 1.5\"/><path d=\"M12 28 L12 12M12 28 L28 28\" stroke-width=\"1\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "factorEscalaUTM": {
  "name": "Factor de Escala UTM",
  "desc": "Reduce distancia de terreno a la cuadrícula",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"6\" y=\"6\" width=\"28\" height=\"28\" rx=\"1\"/><path d=\"M6 20h28M20 6v28\" stroke-dasharray=\"2 2\"/><path d=\"M14 14l12 12M26 14l-12 12\" stroke-width=\"1\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "ptl": {
  "name": "PTL (Plano Topográfico Local)",
  "desc": "Gauss-Krüger con origen y factor de elevación propios",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"8\" y=\"8\" width=\"24\" height=\"24\" rx=\"1\"/><circle cx=\"20\" cy=\"20\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M20 20 L30 12\" stroke-width=\"1.2\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "converg": {
  "name": "Convergencia de Meridianos",
  "desc": "Corrección angular por huso",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M20 6v28M12 6l2 28M28 6l-2 28\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "geoidal": {
  "name": "Altura Elipsoidal ↔ Ortométrica",
  "desc": "Con ondulación geoidal N conocida",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 24q9-8 18 0t18 0\" stroke-dasharray=\"2 2\"/><path d=\"M4 30h32\"/><path d=\"M12 30V17M28 30V13\" stroke-width=\"1.1\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "areaElipsoidal": {
  "name": "Área Elipsoidal",
  "desc": "Entre paralelos y meridianos, sobre el elipsoide",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><ellipse cx=\"20\" cy=\"20\" rx=\"16\" ry=\"11\"/><path d=\"M8 15h24M8 25h24\" stroke-dasharray=\"1.5 1.5\"/><path d=\"M20 9v22\" stroke-dasharray=\"1.5 1.5\"/></svg>",
  "grupo": "geodesia",
  "oculta": true,
  "migrada": true
 },
 "reducHorizonte": {
  "name": "Reducción al Horizonte",
  "desc": "Distancia inclinada → Dh, Dv",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 32h28M6 32L28 12M28 32V12\" stroke-dasharray=\"2 2.2\"/><path d=\"M6 32L28 12\" stroke-dasharray=\"0\"/></svg>",
  "grupo": "correcciones",
  "oculta": false,
  "migrada": true
 },
 "corrTemp": {
  "name": "Corrección por Temperatura",
  "desc": "Dilatación de cinta de acero",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"16\" y=\"6\" width=\"8\" height=\"20\" rx=\"4\"/><circle cx=\"20\" cy=\"30\" r=\"5\"/><path d=\"M20 12v14\" stroke-width=\"2\"/></svg>",
  "grupo": "correcciones",
  "oculta": true,
  "migrada": true
 },
 "corrTension": {
  "name": "Corrección por Tensión",
  "desc": "Elasticidad de cinta de acero",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 14 Q20 30 36 14\" /><path d=\"M4 14h4M32 14h4\"/></svg>",
  "grupo": "correcciones",
  "oculta": true,
  "migrada": true
 },
 "corrNivelMar": {
  "name": "Corrección Nivel del Mar",
  "desc": "Reducción por altitud",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 26q4-4 8 0t8 0 8 0 8 0\" /><path d=\"M4 32q4-4 8 0t8 0 8 0 8 0\" /><path d=\"M20 22V6M20 6l-4 4M20 6l4 4\"/></svg>",
  "grupo": "correcciones",
  "oculta": true,
  "migrada": true
 },
 "poligonal": {
  "name": "Poligonal Cerrada",
  "desc": "Cierre, ajuste y área",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M8 14 L20 7 L33 12 L30 30 L14 33 Z\"/><circle cx=\"8\" cy=\"14\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"20\" cy=\"7\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"33\" cy=\"12\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"30\" cy=\"30\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14\" cy=\"33\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "poligAbierta": {
  "name": "Poligonal Abierta",
  "desc": "Coordenadas por tramos",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M6 30 L16 12 L26 22 L34 8\"/><circle cx=\"6\" cy=\"30\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"16\" cy=\"12\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"26\" cy=\"22\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"34\" cy=\"8\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "radiacion": {
  "name": "Radiación (Polares Múltiples)",
  "desc": "Varios puntos desde una estación",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M20 20L8 10M20 20L34 12M20 20L32 30M20 20L10 32\"/><circle cx=\"8\" cy=\"10\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"34\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"32\" cy=\"30\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"10\" cy=\"32\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "interseccion": {
  "name": "Intersección de Rectas",
  "desc": "Dos visuales, un punto",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 12L36 30M4 30L36 12\"/><circle cx=\"20\" cy=\"21\" r=\"2.4\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "triangulacion": {
  "name": "Triangulación",
  "desc": "Ley de cosenos (SSS)",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M8 32 L20 6 L32 32 Z\"/><circle cx=\"8\" cy=\"32\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"20\" cy=\"6\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"32\" cy=\"32\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "replanteoPunto": {
  "name": "Replanteo de un Punto",
  "desc": "Desde estación, azimut y distancia",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"10\" cy=\"30\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M10 30 L30 12\"/><path d=\"M10 30 A14 14 0 0 1 22 17\" stroke-dasharray=\"2 2.2\"/><circle cx=\"30\" cy=\"12\" r=\"2.4\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "rumbo": {
  "name": "Rumbo y Distancia",
  "desc": "Entre dos puntos",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"14\"/><path d=\"M20 6v6M20 34v-6M6 20h6M34 20h-6\"/><path d=\"M20 20 L29 11\" stroke=\"currentColor\" stroke-width=\"2\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "distPuntoLinea": {
  "name": "Distancia Punto-Línea",
  "desc": "Perpendicular de un punto a una recta",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30 L36 14\"/><circle cx=\"26\" cy=\"10\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M26 10 L20.5 20.9\" stroke-dasharray=\"2 2\"/><circle cx=\"20.5\" cy=\"20.9\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "inversaMultiple": {
  "name": "Inversa Múltiple",
  "desc": "Distancia y azimut de varios tramos a la vez",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 32 L14 12 L24 24 L34 8\"/><circle cx=\"6\" cy=\"32\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14\" cy=\"12\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"24\" cy=\"24\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"34\" cy=\"8\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "taquimetria": {
  "name": "Taquimetría",
  "desc": "Medición por estadía",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M12 4v32M12 4h4M12 12h6M12 20h6M12 28h4\"/><path d=\"M12 20 L32 10 M12 20 L32 30\"/></svg>",
  "grupo": "levantamiento",
  "oculta": false,
  "migrada": true
 },
 "cuadrilateroTriangulacion": {
  "name": "Ajuste de Cuadrilátero (Triangulación)",
  "desc": "Compensación por condición de figura y de lado",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M8 12 L32 8 L34 30 L6 32 Z\"/><path d=\"M8 12 L34 30M32 8 L6 32\" stroke-dasharray=\"1.5 1.5\"/></svg>",
  "grupo": "levantamiento",
  "oculta": true,
  "migrada": true
 },
 "cuadrilateroTrilateracion": {
  "name": "Ajuste de Cuadrilátero (Trilateración)",
  "desc": "6 lados medidos → ángulos y control de cierre",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M8 12 L32 8 L34 30 L6 32 Z\"/><path d=\"M8 12 L34 30\" stroke-width=\"1.3\"/></svg>",
  "grupo": "levantamiento",
  "oculta": true,
  "migrada": true
 },
 "area": {
  "name": "Área por Coordenadas",
  "desc": "Fórmula de Gauss",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M7 10 L25 7 L33 20 L22 33 L9 27 Z\" fill=\"currentColor\" fill-opacity=\".12\"/></svg>",
  "grupo": "superficies",
  "oculta": false,
  "migrada": true
 },
 "areaIrregular": {
  "name": "Área Irregular por Ordenadas",
  "desc": "Simpson y Trapecios",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 30 Q10 12 16 20 T27 14 T35 24\" fill=\"currentColor\" fill-opacity=\".1\"/><path d=\"M5 30h30\" stroke-dasharray=\"2 2\"/><path d=\"M12 30V17M19 30V19M26 30V15\" stroke-width=\"1\"/></svg>",
  "grupo": "superficies",
  "oculta": false,
  "migrada": true
 },
 "sector": {
  "name": "Sector Circular",
  "desc": "Área y longitud de arco",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M20 20 L20 4 A16 16 0 0 1 33.8 28 Z\" fill=\"currentColor\" fill-opacity=\".12\"/></svg>",
  "grupo": "superficies",
  "oculta": false,
  "migrada": true
 },
 "volumen": {
  "name": "Volúmenes de Tierra",
  "desc": "Áreas extremas / prismoidal",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 32V16l6-4 6 4v16M22 32V20l6-4 6 4v12\" fill=\"currentColor\" fill-opacity=\".08\"/></svg>",
  "grupo": "superficies",
  "oculta": false,
  "migrada": true
 },
 "nivel": {
  "name": "Nivelación Trigonométrica",
  "desc": "Desnivel entre puntos",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 30h30\"/><path d=\"M10 30V16l14-8 6 22\"/><circle cx=\"24\" cy=\"8\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "nivelDif": {
  "name": "Nivelación Diferencial",
  "desc": "Tabla BS/FS",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30 L14 30 L14 18 L24 18 L24 10 L36 10\"/><circle cx=\"4\" cy=\"30\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"14\" cy=\"18\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"24\" cy=\"10\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "nivelBaro": {
  "name": "Nivelación Barométrica",
  "desc": "Desnivel por presión",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"14\"/><path d=\"M20 20 L20 10 M20 20 L27 24\"/></svg>",
  "grupo": "altimetria",
  "oculta": true,
  "migrada": true
 },
 "nivelTrigNMM": {
  "name": "Nivelación Trig. + Reducción a NMM",
  "desc": "Cota con curvatura, refracción y radio de Euler",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30 L16 12 L34 8\"/><circle cx=\"4\" cy=\"30\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"34\" cy=\"8\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 34q4-4 8 0t8 0 8 0 8 0\" stroke-width=\"1.1\"/></svg>",
  "grupo": "altimetria",
  "oculta": true,
  "migrada": true
 },
 "curvasNivel": {
  "name": "Curvas de Nivel",
  "desc": "Interpolación de cota",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30q8-16 18-16M2 22q10-14 24-10M6 36q10-18 30-14\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "pendienteDosPuntos": {
  "name": "Pendiente entre Dos Puntos",
  "desc": "% grados y relación H:V",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"8\" cy=\"30\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"32\" cy=\"10\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8 30L32 10\"/><path d=\"M8 30h24M32 30V10\" stroke-dasharray=\"2 2\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "perfilLongitudinal": {
  "name": "Perfil Longitudinal",
  "desc": "Serie de puntos distancia/cota",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30h32\" stroke-dasharray=\"1 2.4\"/><path d=\"M4 28 L12 18 L20 22 L28 10 L36 16\"/><circle cx=\"4\" cy=\"28\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"18\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"20\" cy=\"22\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"28\" cy=\"10\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"36\" cy=\"16\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "cotaProgresiva": {
  "name": "Cota por Progresiva y Pendiente",
  "desc": "Cota de rasante en cualquier progresiva",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30 L36 12\" stroke-width=\"2\"/><circle cx=\"4\" cy=\"30\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"36\" cy=\"12\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 34h32M8 30v4M32 12v22\" stroke-dasharray=\"1.5 1.5\" stroke-width=\"1\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "talud": {
  "name": "Taludes y Pendientes",
  "desc": "% y relación H:V",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 32 L32 32 L32 8 Z\" fill=\"currentColor\" fill-opacity=\".1\"/><path d=\"M5 32 L32 8\" stroke-width=\"2\"/></svg>",
  "grupo": "altimetria",
  "oculta": false,
  "migrada": true
 },
 "curvaC": {
  "name": "Curva Circular",
  "desc": "Elementos principales",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 30 Q20 6 34 30\"/><path d=\"M6 30 L34 30\" stroke-dasharray=\"2 2.4\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "radioCuerda": {
  "name": "Radio y Cuerda",
  "desc": "Desde cuerda+flecha o cuerda+Δ",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 28 Q20 8 34 28\"/><path d=\"M6 28 L34 28\" stroke-dasharray=\"2 2\"/><path d=\"M20 28 L20 12\" stroke-dasharray=\"1 2.2\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "replanteo": {
  "name": "Replanteo de Curva",
  "desc": "Tabla de deflexión",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 28 Q20 8 34 28\"/><circle cx=\"12.5\" cy=\"17.5\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"20\" cy=\"12.6\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"27.5\" cy=\"17.5\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "replanteoOrdenadas": {
  "name": "Replanteo por Ordenadas",
  "desc": "Con cinta, desde la tangente",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 32 Q20 10 35 8\"/><path d=\"M5 32h30\" stroke-dasharray=\"2 2\"/><path d=\"M13 32 L13 26M21 32 L21 16M29 32 L29 10\" stroke-width=\"1.1\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "replanteoCuerda": {
  "name": "Replanteo por Cuerda",
  "desc": "Con cinta, ordenadas desde la cuerda PC–PT",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 26 Q20 8 35 26\"/><path d=\"M5 26h30\" stroke-dasharray=\"2 2\"/><path d=\"M13 26 L13 20M20 26 L20 12M27 26 L27 20\" stroke-width=\"1.1\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "clotoide": {
  "name": "Curva de Transición (Clotoide)",
  "desc": "Espiral de Euler, parámetros A, p, k",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 34 C 6 20, 16 8, 20 8 C 30 8, 34 16, 30 22 C 27 26, 22 24, 22 20\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "curvaCompuesta": {
  "name": "Curva Circular Compuesta",
  "desc": "Dos radios tangentes en PCC",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 30 Q14 10 22 12\"/><path d=\"M22 12 Q32 14 36 26\"/><circle cx=\"22\" cy=\"12\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "curvaReversa": {
  "name": "Curva de Reversa (S)",
  "desc": "Dos curvas en sentido contrario",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 32 Q16 32 20 20\"/><path d=\"M20 20 Q24 8 36 8\"/><circle cx=\"20\" cy=\"20\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "curvaV": {
  "name": "Curva Vertical",
  "desc": "Cima o columpio",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M5 28 Q20 8 35 14\"/><path d=\"M5 28 L18 24 M22 12 L35 14\" stroke-dasharray=\"2 2.4\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "peralte": {
  "name": "Peralte en Vías",
  "desc": "Superelevación",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M5 30 L33 18 L33 24 L5 36 Z\" fill=\"currentColor\" fill-opacity=\".1\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "curvaProgresiva": {
  "name": "Curva Circular por Progresiva",
  "desc": "Estaca sobre la curva a un kilometraje dado",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 30 Q20 6 34 30\"/><circle cx=\"20\" cy=\"9.3\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M20 9.3 L20 2\" stroke-dasharray=\"1.5 1.5\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "clotoideProgresiva": {
  "name": "Clotoide por Progresiva",
  "desc": "Estaca sobre la espiral a un kilometraje dado",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 34 C 6 20, 16 8, 20 8 C 30 8, 34 16, 30 22 C 27 26, 22 24, 22 20\"/><circle cx=\"26\" cy=\"20.5\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "ejeProyecto": {
  "name": "Eje de Proyecto Vial por Progresiva",
  "desc": "Vértices encadenados y estacado",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 32 L14 18 L24 24 L36 8\"/><path d=\"M14 22v-8M24 28v-8M4 36v-8M36 12v-8\" stroke-width=\"1\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "progresivaOffset": {
  "name": "Progresiva y Offset desde un Eje",
  "desc": "Inversa de un eje de proyecto",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 34 L36 6\" stroke-width=\"2\"/><circle cx=\"30\" cy=\"24\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M30 24 L20.5 20\" stroke-dasharray=\"2 2\" stroke-width=\"1.1\"/><circle cx=\"20.5\" cy=\"20\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "vias",
  "oculta": false,
  "migrada": true
 },
 "taludBancos": {
  "name": "Taludes en Cascada (Bancos)",
  "desc": "Bermas escalonadas y sección a escala",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 34 H12 V26 H20 V18 H28 V10 H36 V34 Z\" fill=\"currentColor\" fill-opacity=\".1\" stroke=\"none\"/><path d=\"M4 34 H12 V26 H20 V18 H28 V10 H36\" stroke-width=\"2\"/></svg>",
  "grupo": "obras",
  "oculta": false,
  "migrada": true
 },
 "plantillaZanja": {
  "name": "Plantillado de Zanja (Alcantarillado)",
  "desc": "Cota de excavación y lectura de mira",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M6 14 L34 14\" stroke-dasharray=\"2 2\" stroke-width=\"1\"/><path d=\"M6 20 L34 26\" stroke-width=\"1.8\"/><path d=\"M34 26 L34 34 L26 34 L26 26 Z\"/><path d=\"M34 14 L34 20\" stroke-dasharray=\"1.5 1.5\" stroke-width=\"1\"/></svg>",
  "grupo": "obras",
  "oculta": false,
  "migrada": true
 },
 "capasPavimento": {
  "name": "Capas de Pavimento",
  "desc": "Subrasante, subbase y base con bombeo",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 14 L36 14M4 21 L36 21M4 28 L36 28\" stroke-width=\"1.3\"/><path d=\"M20 8v6M8 21l-4 7M32 21l4 7\" stroke-width=\"1.1\"/></svg>",
  "grupo": "obras",
  "oculta": false,
  "migrada": true
 },
 "disenoEscalera": {
  "name": "Diseño y Trazado de Escalera",
  "desc": "Peldaños, tramos, descansos y cumplimiento normativo",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M4 34 H10 V27 H16 V20 H22 V13 H28 V6 H34\" fill=\"currentColor\" fill-opacity=\".08\"/></svg>",
  "grupo": "obras",
  "oculta": false,
  "migrada": true
 },
 "visor360": {
  "name": "Visor 360°",
  "desc": "Carga y recorre imágenes 360° de dron DJI e Insta360 (panorama)",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"14\"/><ellipse cx=\"20\" cy=\"20\" rx=\"14\" ry=\"5\"/><ellipse cx=\"20\" cy=\"20\" rx=\"5.5\" ry=\"14\" stroke-width=\"1.1\"/><circle cx=\"20\" cy=\"20\" r=\"1.8\" fill=\"currentColor\" stroke=\"none\"/></svg>",
  "grupo": "foto",
  "oculta": false,
  "migrada": true
 },
 "gsd": {
  "name": "GSD de Vuelo con Dron",
  "desc": "Resolución en terreno del vuelo",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"6\" y=\"6\" width=\"28\" height=\"20\" rx=\"2\"/><path d=\"M6 6l14 12L34 6\" stroke-width=\"1.1\"/><path d=\"M12 30h16M16 34h8\" stroke-width=\"1.2\"/></svg>",
  "grupo": "foto",
  "oculta": true,
  "migrada": true
 },
 "traslapeVuelo": {
  "name": "Traslape de Vuelo Fotogramétrico",
  "desc": "Base de vuelo y espaciamiento de líneas",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"5\" y=\"9\" width=\"20\" height=\"15\" rx=\"1\"/><rect x=\"15\" y=\"17\" width=\"20\" height=\"15\" rx=\"1\"/></svg>",
  "grupo": "foto",
  "oculta": true,
  "migrada": true
 },
 "astronomica": {
  "name": "Orientación Astronómica",
  "desc": "Azimut solar por distancia zenital",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"14\" cy=\"14\" r=\"6\"/><path d=\"M14 4v3M14 21v3M4 14h3M21 14h3M6.9 6.9l2.1 2.1M19.1 6.9l-2.1 2.1\"/><path d=\"M14 26 L34 34\"/></svg>",
  "grupo": "foto",
  "oculta": true,
  "migrada": true
 },
 "declinacionSolar": {
  "name": "Declinación Solar por Fecha",
  "desc": "Para la Orientación Astronómica",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"16\" cy=\"16\" r=\"5\"/><path d=\"M16 6v3M16 23v3M6 16h3M23 16h3M9 9l2 2M21 9l-2 2\"/><path d=\"M4 34h32\" stroke-dasharray=\"1 2.4\"/><path d=\"M4 30 Q20 20 36 26\" stroke-width=\"1.1\"/></svg>",
  "grupo": "foto",
  "oculta": true,
  "migrada": true
 },
 "chequeoNivel": {
  "name": "Chequeo de Nivel (2 Estacas)",
  "desc": "Error de colimación del nivel",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"4\" y=\"16\" width=\"24\" height=\"8\" rx=\"4\"/><circle cx=\"16\" cy=\"20\" r=\"2.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M28 24l4 4 6-9\" stroke-width=\"2\"/></svg>",
  "grupo": "chequeos",
  "oculta": false,
  "migrada": true
 },
 "chequeoTeodolito": {
  "name": "Chequeo de Teodolito (2 Caras)",
  "desc": "Colimación horizontal e índice vertical",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M18 26 L9 36 M18 26 L18 37 M18 26 L27 36\"/><circle cx=\"18\" cy=\"15\" r=\"8\"/><path d=\"M18 7v3M10 15h3M18 23v-3M26 15h-3\"/><path d=\"M27 27l4 4 6-9\" stroke-width=\"2\"/></svg>",
  "grupo": "chequeos",
  "oculta": false,
  "migrada": true
 },
 "chequeoEstacion": {
  "name": "Chequeo de Estación Total",
  "desc": "2 caras + constante aditiva del EDM",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M18 26 L9 36 M18 26 L18 37 M18 26 L27 36\"/><rect x=\"11\" y=\"8\" width=\"14\" height=\"10\" rx=\"2\"/><circle cx=\"18\" cy=\"13\" r=\"2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M27 27l4 4 6-9\" stroke-width=\"2\"/></svg>",
  "grupo": "chequeos",
  "oculta": false,
  "migrada": true
 },
 "costo": {
  "name": "Costo de Brigada",
  "desc": "Factor salarial diario",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"20\" r=\"14\"/><path d=\"M20 12v16M24 15.5c0-2-2-3-4-3s-4 1.2-4 3 2 2.6 4 3 4 1.2 4 3-2 3-4 3-4-1-4-3\"/></svg>",
  "grupo": "gestion",
  "oculta": true,
  "migrada": true
 },
 "cotizacion": {
  "name": "Cotización de Trabajo",
  "desc": "Precio de un levantamiento",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"8\" y=\"5\" width=\"24\" height=\"30\" rx=\"2\"/><path d=\"M13 13h14M13 19h14M13 25h9\"/></svg>",
  "grupo": "gestion",
  "oculta": true,
  "migrada": true
 },
 "boletaHonorarios": {
  "name": "Boleta de Honorarios e IVA",
  "desc": "Retención, líquido a recibir e IVA",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"><path d=\"M10 4h20v28l-3-3-3 3-3-3-3 3-3-3-3 3-2-3Z\"/><path d=\"M14 12h12M14 18h12M14 24h6\"/></svg>",
  "grupo": "gestion",
  "oculta": false,
  "migrada": true
 },
 "rendimientoBrigada": {
  "name": "Rendimiento de Brigada",
  "desc": "Días necesarios o m²/día",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><circle cx=\"14\" cy=\"10\" r=\"4\"/><path d=\"M6 26c0-5 4-8 8-8s8 3 8 8\"/><path d=\"M26 16h9M26 22h9M26 28h6\"/></svg>",
  "grupo": "gestion",
  "oculta": true,
  "migrada": true
 }
};
/* Aplicaciones que ya viven en su propia carpeta dentro de /topocalc/ (no son calculadoras). */
const PAGINAS = [
 {
  "href": "lastplanner/",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"4\" y=\"7\" width=\"32\" height=\"23\" rx=\"1.5\"/><rect x=\"9\" y=\"12\" width=\"9\" height=\"9\" fill=\"currentColor\" fill-opacity=\".15\" stroke-width=\"1.2\"/><path d=\"M23 14h9M23 18.5h9M23 23h6\"/><path d=\"M14 30v4M20 34h-8\" stroke-width=\"1.2\"/></svg>",
  "name": "Pizarra de Planificación",
  "desc": "Tablero de post-its por semana para planificar obra (Last Planner)",
  "grupo": "gestion"
 },
 {
  "href": "Porticos/",
  "icon": "<svg viewBox=\"0 0 40 40\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><rect x=\"4\" y=\"7\" width=\"32\" height=\"23\" rx=\"1.5\"/><rect x=\"9\" y=\"12\" width=\"9\" height=\"9\" fill=\"currentColor\" fill-opacity=\".15\" stroke-width=\"1.2\"/><path d=\"M23 14h9M23 18.5h9M23 23h6\"/><path d=\"M14 30v4M20 34h-8\" stroke-width=\"1.2\"/></svg>",
  "name": "Programación de Pórticos de Vigilancia",
  "desc": "Instalación de pórticos en la Región de O'Higgins: excavación, fundación, malla, relleno, pórtico y cámara",
  "grupo": "gestion"
 }
];
