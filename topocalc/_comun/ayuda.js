"use strict";
/* Siglas por herramienta (solo las que la herramienta no define ya en su propio glosario).
   Las siglas de una letra se explican con el significado que tienen en cada herramienta. */
const SIGLAS_COMUN = {
  'UTM':'Universal Transversal de Mercator — sistema de coordenadas planas en husos de 6° (Este y Norte en metros)',
  'GPS':'Sistema de Posicionamiento Global — posición medida con satélites',
  'GNSS':'Sistemas Globales de Navegación por Satélite (GPS, GLONASS, Galileo, BeiDou)',
  'GLONASS':'Constelación satelital rusa de navegación, parte de GNSS',
  'WGS84':'Sistema Geodésico Mundial 1984 — datum y elipsoide que usa el GPS',
  'SIRGAS':'Sistema de Referencia Geocéntrico para las Américas — datum oficial en Chile',
  'PSAD56':'Datum Provisorio Sudamericano de 1956 — datum antiguo de la cartografía chilena',
  'EPSG':'Código numérico estándar que identifica un sistema de coordenadas (p. ej. EPSG:32719)',
  'IGM':'Instituto Geográfico Militar — organismo geodésico y cartográfico oficial',
  'GMS':'Grados, minutos y segundos (formato sexagesimal)',
  'KML':'Formato de archivo de Google Earth (puntos y líneas con coordenadas)',
  'GPX':'Formato de intercambio de puntos y rutas GPS',
  'DXF':'Formato de intercambio de dibujo para programas CAD',
  'CAD':'Diseño Asistido por Computador (AutoCAD, BricsCAD, etc.)',
  'CSV':'Valores separados por comas — tabla que abre Excel o Google Sheets',
  'JSON':'Formato de texto para guardar datos estructurados (respaldo de casos)',
  'PTL':'Plano Topográfico Local — proyección Gauss-Krüger con meridiano central propio',
  'k0':'Factor de escala en el meridiano central (0,9996 en UTM)',
  'ΔX':'Diferencia de la coordenada geocéntrica X entre dos puntos',
  'ΔY':'Diferencia de la coordenada geocéntrica Y entre dos puntos',
  'ΔZ':'Diferencia de la coordenada geocéntrica Z entre dos puntos',
  'SSS':'Lado-Lado-Lado — triángulo resuelto conociendo sus tres lados',
  'UT':'Tiempo Universal — hora de referencia (Chile continental: hora local + 3 h en verano, + 4 h en invierno)',
  'GSD':'Ground Sampling Distance — tamaño real en terreno de cada píxel de la foto',
  'IVA':'Impuesto al Valor Agregado',
  'DJI':'Fabricante de drones cuyas fotos 360° puede abrir el visor',
  'VR':'Realidad virtual — vista inmersiva con visor o gafas',
  'JPG':'Formato de imagen comprimida (el que acepta el visor)',
  'HEIC':'Formato de imagen de iPhone (conviértelo a JPG antes de subirlo)',
  'TIFF':'Formato de imagen sin compresión, de gran tamaño',
  'MB':'Megabytes — tamaño del archivo',
  'N':'Norte', 'E':'Este', 'S':'Sur', 'O':'Oeste', 'W':'Oeste (West)',
  '°C':'Grados Celsius'
};
const SIGLAS_HERR = {
  puntosLibreta: ['UTM','GPS','CSV','KML','GPX','DXF','CAD',['P','Punto (nombre o número del punto)'],['N','Norte (m)'],['E','Este (m)'],['D','Descripción del punto'],['C','Cota (m)']],
  mapaInteractivo: ['GPS','UTM',['N','Norte (m)'],['E','Este (m)']],
  brujula: [['N','Norte'],['S','Sur'],['E','Este'],['O','Oeste']],
  flujoPredio: ['GPS','GNSS','CSV','KML','DXF',['A','Primer vértice de la poligonal (punto de partida)']],
  utm: ['UTM','GPS','GMS','WGS84','GNSS','GLONASS',['S','Sur'],['W','Oeste (West)']],
  unidadesAgrarias: [['S/N','Sin número (la Ley de 1848 no tiene numeración)']],
  conversorDistancia: [['S/N','Sin número (la Ley de 1848 no tiene numeración)']],
  temperatura: [['C','Grados Celsius'],['F','Grados Fahrenheit']],
  datumTransform: ['WGS84','PSAD56','SIRGAS','IGM','EPSG','ΔX','ΔY','ΔZ'],
  directoGeodesico: [],
  azimutVectorGeoc: ['GNSS','ΔX','ΔY','ΔZ',['A','Punto de partida de la línea base']],
  factorEscalaUTM: ['UTM','k0'],
  ptl: ['PTL','UTM','k0'],
  converg: ['UTM','WGS84'],
  corrTemp: [['L','Longitud medida (m)'],['°C','Grados Celsius']],
  corrTension: [['L','Longitud medida (m)'],['P','Tensión aplicada (N)'],['Ps','Tensión estándar de la cinta (N)'],['N','Newton — unidad de fuerza']],
  corrNivelMar: [['L','Longitud medida sobre el terreno (m)']],
  radiacion: [['P1…P4','Puntos radiados desde la estación (según el número de puntos elegido)']],
  triangulacion: ['SSS',['A, B, C','Vértices del triángulo; cada lado se nombra con la letra del vértice opuesto']],
  distPuntoLinea: [['A, B','Extremos de la recta'],['P','Punto cuya distancia a la recta se calcula']],
  inversaMultiple: [['A, B, C…','Puntos de la secuencia, en el orden ingresado']],
  taquimetria: [['K','Constante estadimétrica del instrumento (normalmente 100)']],
  cuadrilateroTriangulacion: [['A, B, C, D','Vértices del cuadrilátero'],['A1…A4','Ángulos medidos en cada vértice (primer grupo)'],['B1…B4','Ángulos medidos en cada vértice (segundo grupo)']],
  area: [['A, B, C, D…','Vértices del polígono, en orden']],
  volumen: [['A1','Área de la sección 1 (m²)'],['A2','Área de la sección 2 (m²)'],['D','Distancia entre secciones (m)'],['Am','Área de la sección media (m²)']],
  nivelBaro: [['°C','Grados Celsius']],
  taludBancos: ['JSON',['V','Talud vertical (parte vertical de la relación V:H)'],['H','Talud horizontal (parte horizontal de la relación V:H)']],
  capasPavimento: [['Cras','Cota de rasante en el eje (m)'],['i','Bombeo transversal (%)'],['d','Distancia del eje al borde (m)'],['e1','Espesor de carpeta asfáltica (m)'],['e2','Espesor de base (m)'],['e3','Espesor de subbase (m)']],
  visor360: ['DJI','VR','JPG','HEIC','TIFF','MB','GPS'],
  gsd: ['GSD'],
  declinacionSolar: ['UT'],
  chequeoNivel: [['A, B','Puntos donde se colocan las miras'],['D','Distancia total A–B (m)'],['d','Distancia del nivel a A en la posición 2 (m)'],['a1, b1','Lecturas en las miras A y B con el nivel centrado'],['a2, b2','Lecturas en las miras A y B con el nivel cerca de A'],['OK','Conforme — el ítem cumple']],
  teodolitoCoord: [['P1…', 'Visuales medidas desde la estación'], ['Cenital', 'Ángulo vertical medido desde el zenit (90° = visual horizontal)']],
  interseccion4P: [['1, 2', 'Puntos de la recta 1'], ['1′, 2′', 'Puntos de la recta 2'], ['I', 'Punto de intersección']],
  estacionLibre: [['1, 2', 'Puntos de coordenadas conocidas'], ['E', 'Estación libre (el punto cuyas coordenadas se calculan)'], ['D', 'Distancia entre los puntos 1 y 2'], ['F', 'Distancia de la estación al punto 1'], ['G', 'Distancia de la estación al punto 2']],
  resolverTriangulo: [['A, B, C', 'Ángulos del triángulo'], ['a, b, c', 'Lados opuestos a los ángulos A, B y C']],
  offsetLinea: [['Km', 'Distancia medida desde el punto 1 a lo largo de la línea base'], ['Offset', 'Distancia perpendicular a la línea: izquierda (−) o derecha (+)'], ['Est.', 'Estación desde la que se replantea']],
  taludCoordenadas: [['A, B', 'Puntos del eje con coordenadas, cota y kilómetro'], ['H/V', 'Talud: metros horizontales por cada metro de altura'], ['Chaflán', 'Pie del talud, donde el talud corta el terreno']],
  chaflanArmada: [['Armada', 'Posición del instrumento o de la cuadrilla desde la que se replantea el chaflán'], ['Chaflán', 'Pie del talud, donde el talud corta el terreno'], ['H/V', 'Talud: metros horizontales por cada metro de altura']],
  lecturasCotas: [['PR', 'Punto de referencia de cota conocida'], ['Alt. instrumental', 'Cota del plano de colimación del nivel (cota del PR + lectura atrás)']],
  bombeoSeccion: [['BM', 'Marca de nivelación (Bench Mark) de cota conocida'], ['Bombeo', 'Pendiente transversal de la calzada hacia ambos lados del eje']],
  instalarTuberia: [['PR', 'Punto de referencia de cota conocida'], ['Clave', 'Parte superior exterior del tubo'], ['Pelo de agua', 'Fondo interior del tubo, por donde corre el agua']],
  cotizacion: ['IVA'],
  boletaHonorarios: ['IVA']
};

/* ===== Ayuda común a todas las herramientas =====
   Cada herramienta ofrece lo mismo: breve explicación arriba, Recorrido guiado,
   Manual de uso y Significado de las siglas. Se engancha a toolShell(). */
(function(){
  const css = `
.ayuda-bar{display:flex; gap:8px; flex-wrap:wrap; margin:0 0 10px;}
.ayuda-bar .btn-sm{flex:1; text-align:center; min-width:140px; text-decoration:none; display:inline-block;}
.glosario .gloss-vacio{font-size:13px; color:var(--ink-soft);}
.tour-capa{position:fixed; inset:0; z-index:200;}
.tour-velo{position:absolute; inset:0;}
.tour-hl{position:absolute; border-radius:10px; box-shadow:0 0 0 9999px rgba(10,34,64,.62), 0 0 0 3px var(--accent); pointer-events:none; transition:all .2s ease;}
.tour-card{position:absolute; left:12px; right:12px; max-width:420px; margin:0 auto; background:var(--paper); color:var(--ink); border-radius:12px; padding:14px 16px; box-shadow:0 8px 28px rgba(0,0,0,.35); font-size:14px; line-height:1.45;}
.tour-card h4{margin:0 0 4px; font-size:15px;}
.tour-card p{margin:0;}
.tour-pie{display:flex; align-items:center; gap:10px; margin-top:12px;}
.tour-n{font-size:12px; color:var(--ink-soft); margin-right:auto;}
.tour-saltar{background:none; border:0; color:var(--ink-soft); font:inherit; font-size:13px; cursor:pointer; padding:6px;}
.tour-sig{background:var(--ink); color:var(--paper); border:0; border-radius:8px; font:inherit; font-weight:600; padding:8px 14px; cursor:pointer;}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function siglasDe(id){
    const l = (typeof SIGLAS_HERR !== 'undefined' && SIGLAS_HERR[id]) || [];
    return l.map(x => Array.isArray(x) ? x : [x, SIGLAS_COMUN[x]]).filter(x => x[1]);
  }
  window.siglasDeHerramienta = siglasDe;

  function panelSiglas(id){
    const it = siglasDe(id);
    const cuerpo = it.length
      ? it.map(([k,v]) => `<div class="gloss-item"><b>${k}</b> — ${v}</div>`).join('')
      : `<div class="gloss-vacio">Esta herramienta no usa siglas específicas: todas las magnitudes aparecen con su nombre completo.</div>`;
    return `<details class="glosario"><summary>Significado de las siglas usadas aquí</summary><div class="gloss-body">${cuerpo}</div></details>`;
  }

  function filaAyuda(id){
    const raiz = document.body.getAttribute('data-raiz') || './';
    return `<div class="ayuda-bar">
      <button type="button" class="btn-sm" id="btnTour">▶ Recorrido guiado</button>
      <a class="btn-sm" id="lnkManual" href="${raiz}manual.html#${id}">📘 Manual de uso</a>
    </div>`;
  }

  /* ---- Recorrido guiado ---- */
  function visible(el){ return el && el.getClientRects().length > 0; }
  function pasosDe(id){
    const tv = document.querySelector('.tool-view');
    const out = [];
    const blurb = tv.querySelector('.tool-blurb');
    out.push({el: blurb, t:'Qué hace', d: 'Resumen de la herramienta. Léelo para confirmar que es la que necesitas.'});
    const campo = [...tv.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')].find(visible);
    if(campo) out.push({el: campo.closest('.field-card, .field-row, .station-block, label') || campo, t:'1 · Ingresa los datos', d:'Completa los campos con tus mediciones. Las unidades van indicadas en cada título (m, gon, °, etc.).'});
    const calc = [...tv.querySelectorAll('button')].find(b => !b.closest('.action-bar, .ayuda-bar') && visible(b) && /calcular|generar|buscar|convertir|trazar|resolver|estimar|obtener/i.test(b.textContent));
    if(calc) out.push({el: calc, t:'2 · Calcula', d:'Presiona este botón para obtener los resultados. Si falta o sobra un dato, aparece un aviso en rojo.'});
    const res = [...tv.querySelectorAll('.results, .plot-wrap, .data-table')].find(visible);
    out.push({el: res || null, t:'3 · Revisa los resultados', d: res ? 'Aquí quedan los valores calculados y, cuando corresponde, el diagrama con su listado de magnitudes.' : 'Los resultados y el diagrama aparecen debajo del botón de cálculo, apenas calculas.'});
    out.push({el: tv.querySelector('.action-bar'), t:'4 · Guarda o comparte', d:'Exporta un informe con tus datos y resultados, o comparte una captura de la pantalla.'});
    const g = tv.querySelector('.glosario');
    if(g) out.push({el: g, t:'Siglas', d:'Toca para ver qué significa cada sigla o letra usada en esta herramienta.'});
    const m = tv.querySelector('#lnkManual');
    if(m) out.push({el: m, t:'Más ayuda', d:'El manual de uso explica todas las herramientas del menú, agrupadas por función.'});
    return out.filter(p => p.el !== undefined);
  }

  function iniciarTour(id){
    const pasos = pasosDe(id);
    let i = 0;
    const capa = document.createElement('div'); capa.className = 'tour-capa';
    capa.innerHTML = '<div class="tour-velo"></div><div class="tour-hl"></div><div class="tour-card" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(capa);
    const hl = capa.querySelector('.tour-hl'), card = capa.querySelector('.tour-card');
    function cerrar(){ capa.remove(); window.removeEventListener('resize', pintar); document.removeEventListener('keydown', tecla); }
    function tecla(e){ if(e.key==='Escape') cerrar(); }
    function pintar(){
      const p = pasos[i];
      card.innerHTML = `<h4>${p.t}</h4><p>${p.d}</p><div class="tour-pie"><span class="tour-n">${i+1} de ${pasos.length}</span><button type="button" class="tour-saltar">Saltar</button><button type="button" class="tour-sig">${i===pasos.length-1?'Terminar':'Siguiente'}</button></div>`;
      card.querySelector('.tour-saltar').onclick = cerrar;
      card.querySelector('.tour-sig').onclick = () => { if(i>=pasos.length-1) cerrar(); else { i++; pintar(); } };
      if(p.el){
        p.el.scrollIntoView({block:'center'});
        const r = p.el.getBoundingClientRect(), pad = 6;
        Object.assign(hl.style, {display:'block', left:(r.left-pad)+'px', top:(r.top-pad)+'px', width:(r.width+pad*2)+'px', height:(r.height+pad*2)+'px'});
        const abajo = r.bottom + 14, alto = card.offsetHeight || 150;
        card.style.top = (abajo + alto < innerHeight ? abajo : Math.max(8, r.top - alto - 14)) + 'px';
      } else {
        hl.style.display = 'none';
        capa.querySelector('.tour-velo').style.background = 'rgba(10,34,64,.62)';
        card.style.top = Math.max(8, (innerHeight - (card.offsetHeight||150)) / 2) + 'px';
      }
    }
    window.addEventListener('resize', pintar);
    document.addEventListener('keydown', tecla);
    pintar();
  }
  window.iniciarTourHerramienta = iniciarTour;

  /* ---- Enganche a toolShell ---- */
  const original = toolShell;
  toolShell = function(id, blurb, bodyHtml, glosKeys){
    original(id, blurb, bodyHtml, glosKeys);
    const tv = document.querySelector('.tool-view');
    if(!tv) return;
    const b = tv.querySelector('.tool-blurb');
    const bar = tv.querySelector('.action-bar');
    /* Siglas: si la herramienta no trae glosario propio, se crea; si lo trae, se completa con las siglas comunes que falten */
    let g = tv.querySelector('.glosario');
    if(!g){ bar.insertAdjacentHTML('beforebegin', panelSiglas(id)); }
    else {
      const body = g.querySelector('.gloss-body');
      const ya = new Set([...body.querySelectorAll('.gloss-item b')].map(x => x.textContent));
      siglasDe(id).filter(([k]) => !ya.has(k)).forEach(([k,v]) => body.insertAdjacentHTML('beforeend', `<div class="gloss-item"><b>${k}</b> — ${v}</div>`));
    }
    b.insertAdjacentHTML('afterend', filaAyuda(id));
    tv.querySelector('#btnTour').addEventListener('click', () => iniciarTour(id));
  };
})();
