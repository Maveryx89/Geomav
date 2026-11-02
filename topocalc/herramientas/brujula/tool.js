"use strict";
/* Herramienta «Brújula en Vivo»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
const CapCam = (CAP && CAP.Plugins) ? CAP.Plugins.Camera : null;
async function pedirPermisoCamara(){
  if(CapCam){
    try{
      const est = await CapCam.checkPermissions();
      if(est.camera !== 'granted'){
        const pedido = await CapCam.requestPermissions({permissions:['camera']});
        if(pedido.camera !== 'granted'){ throw new Error('Permiso de cámara denegado.'); }
      }
    }catch(e){ throw e; }
  }
  // En navegador no hace falta priming: getUserMedia pide el permiso directamente.
}
function pistaOrigenInseguro(){
  return (location.protocol === 'file:')
    ? ' Esto suele pasar cuando esta página se abre como archivo descargado (file://) en vez de un sitio con https:// — el navegador bloquea sensores y cámara en ese caso. Para usarlos, sube este archivo a un hosting con https (por ejemplo GitHub Pages o Netlify Drop) y ábrelo desde ese enlace.'
    : ' Verifica que el navegador tenga permiso para usar sensores de movimiento, o que el dispositivo tenga brújula/magnetómetro.';
}
function iniciarBrujula(onHeading, onReady, onError){
  const attach = ()=>{
    let listo = false;
    const eventName = ('ondeviceorientationabsolute' in window) ? 'deviceorientationabsolute' : 'deviceorientation';
    const handler = (e)=>{
      let heading;
      if(typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)){
        heading = e.webkitCompassHeading;
      } else if(e.alpha !== null && e.alpha !== undefined){
        heading = 360 - e.alpha;
      } else {
        return;
      }
      if(!listo){
        listo = true;
        clearTimeout(timeoutId);
        onReady(()=> window.removeEventListener(eventName, handler));
      }
      onHeading(normDeg(heading));
    };
    window.addEventListener(eventName, handler);
    const timeoutId = setTimeout(()=>{
      if(!listo){
        window.removeEventListener(eventName, handler);
        onError(new Error('No se detectaron lecturas del sensor de orientación.' + pistaOrigenInseguro()));
      }
    }, 4000);
  };
  if(typeof DeviceOrientationEvent === 'undefined'){
    onError(new Error('Este dispositivo o navegador no tiene sensor de orientación disponible.'));
    return;
  }
  if(typeof DeviceOrientationEvent.requestPermission === 'function'){
    DeviceOrientationEvent.requestPermission().then(state=>{
      if(state === 'granted') attach();
      else onError(new Error('Permiso de orientación denegado.'));
    }).catch(err=> onError(err));
  } else {
    attach();
  }
}
function svgBrujulaRose(){
  return `<svg viewBox="0 0 120 120" width="200" height="200">
    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--line-strong)" stroke-width="1.6"/>
    <circle cx="60" cy="60" r="40" fill="none" stroke="var(--line)" stroke-width="1"/>
    <text x="60" y="14" text-anchor="middle" font-size="12" font-family="var(--font-mono)" fill="var(--ink-soft)">N</text>
    <text x="60" y="112" text-anchor="middle" font-size="12" font-family="var(--font-mono)" fill="var(--ink-soft)">S</text>
    <text x="10" y="64" text-anchor="middle" font-size="12" font-family="var(--font-mono)" fill="var(--ink-soft)">O</text>
    <text x="110" y="64" text-anchor="middle" font-size="12" font-family="var(--font-mono)" fill="var(--ink-soft)">E</text>
    <g id="brujulaNeedle" transform="rotate(0 60 60)">
      <path d="M60 18 L67 60 L60 102 L53 60 Z" fill="var(--accent)" stroke="var(--accent-ink)" stroke-width="0.6"/>
      <circle cx="60" cy="60" r="4" fill="var(--ink)"/>
    </g>
  </svg>`;
}
let brujulaStop = null;
function renderBrujula(){
  const avisoOrigen = (location.protocol === 'file:')
    ? `<p class="err-msg" style="margin:0 0 10px;">⚠ Estás abriendo este archivo directamente (file://). En Android, Chrome suele bloquear el sensor de orientación y la cámara en ese modo — si "Activar brújula" no responde, sube este archivo a un hosting con https (GitHub Pages, Netlify Drop, etc.) y ábrelo desde ese enlace.</p>`
    : '';
  const body = `<div class="field-card">
    ${avisoOrigen}
    <p class="tool-blurb" style="margin:0 0 10px;">Usa el sensor de orientación del teléfono para mostrar hacia dónde apunta. La lectura corresponde al norte que entrega el sensor del equipo (normalmente magnético) — puede diferir algunos grados del norte verdadero según tu ubicación (declinación magnética), a diferencia del rumbo de "Guíame a un punto" en el Mapa, que sí usa el norte geográfico real.</p>
    <button class="btn" id="btnBrujulaStart" type="button">🧭 Activar brújula</button>
    <button class="btn-secondary" id="btnBrujulaStop" type="button" style="display:none;">Detener</button>
    <span id="brujulaMsg" class="proj-msg"></span>
  </div>
  <div class="field-card" id="brujulaDisplay" style="display:none; text-align:center;">
    <div id="brujulaRose"></div>
    <div class="results" style="margin-top:10px;">
      <div class="result-row"><span class="k">Rumbo</span><span class="v accent big" id="brujulaRumbo">—</span></div>
    </div>
    <button class="btn-sm" id="btnBrujulaAR" type="button" style="margin-top:10px;">🎥 Ver en Realidad Aumentada</button>
    <p class="tool-blurb" style="margin-top:8px;">Consejo: si la lectura parece incorrecta, mueve el teléfono trazando un "8" en el aire para calibrar el sensor magnético.</p>
  </div>`;
  toolShell('brujula','Brújula en vivo usando el sensor de orientación del teléfono, con una vista simple de Realidad Aumentada que superpone los puntos cardinales sobre la cámara.', body);

  document.getElementById('brujulaRose').innerHTML = svgBrujulaRose();

  document.getElementById('btnBrujulaStart').addEventListener('click', (e)=>{
    const msg = document.getElementById('brujulaMsg');
    const btn = e.currentTarget;
    btn.disabled = true;
    msg.textContent = 'Buscando señal del sensor de orientación…';
    iniciarBrujula(
      (heading)=> actualizarBrujulaUI(heading),
      (stopFn)=>{
        brujulaStop = stopFn;
        btn.disabled = false;
        msg.textContent = '';
        document.getElementById('btnBrujulaStart').style.display='none';
        document.getElementById('btnBrujulaStop').style.display='';
        document.getElementById('brujulaDisplay').style.display='';
      },
      (err)=>{ btn.disabled = false; msg.textContent = err.message; }
    );
  });
  document.getElementById('btnBrujulaStop').addEventListener('click', ()=>{
    if(brujulaStop){ brujulaStop(); brujulaStop=null; }
    document.getElementById('btnBrujulaStart').style.display='';
    document.getElementById('btnBrujulaStop').style.display='none';
    document.getElementById('brujulaDisplay').style.display='none';
  });
  document.getElementById('btnBrujulaAR').addEventListener('click', ()=> abrirVistaAR());
}
function actualizarBrujulaUI(heading){
  const needle = document.getElementById('brujulaNeedle');
  if(needle) needle.setAttribute('transform', `rotate(${(-heading).toFixed(1)} 60 60)`);
  const rumboEl = document.getElementById('brujulaRumbo');
  if(rumboEl){
    const rb = azToRumbo(heading);
    rumboEl.textContent = `${fmtNum(heading,1)}°  (${rb.ns} ${fmtNum(rb.ang,1)}° ${rb.ew})`;
  }
}
const AR_PUNTOS_CARDINALES = [
  {nombre:'N', deg:0},{nombre:'NE', deg:45},{nombre:'E', deg:90},{nombre:'SE', deg:135},
  {nombre:'S', deg:180},{nombre:'SO', deg:225},{nombre:'O', deg:270},{nombre:'NO', deg:315}
];
let arOverlayEl = null;
let arStream = null;
let arStopBrujula = null;
function dibujarArTape(heading){
  const tape = document.getElementById('arTape');
  if(!tape) return;
  const FOV = 65;
  const marcas = AR_PUNTOS_CARDINALES.slice();
  if(guiaActivo){
    marcas.push({nombre:`★ ${guiaActivo.nombre}`, deg:guiaActivo.bearing, destacado:true, distancia:guiaActivo.distancia});
  }
  let html = '';
  marcas.forEach(m=>{
    const rel = ((m.deg - heading + 540) % 360) - 180;
    if(Math.abs(rel) > FOV/2 + 5) return;
    const xPct = 50 + (rel/(FOV/2))*50;
    html += `<div class="ar-mark${m.destacado?' ar-mark-target':''}" style="left:${xPct.toFixed(1)}%;">
      <span class="ar-mark-label">${m.nombre}</span>${m.destacado?`<span class="ar-mark-sub">${m.distancia<1000?fmtNum(m.distancia,0)+' m':fmtNum(m.distancia/1000,2)+' km'}</span>`:''}
    </div>`;
  });
  tape.innerHTML = html;
}
function abrirVistaAR(){
  if(arOverlayEl) return;
  const overlay = document.createElement('div');
  overlay.id = 'arOverlay';
  overlay.innerHTML = `
    <video id="arVideo" autoplay playsinline muted></video>
    <div id="arTape"></div>
    <div id="arMsg" class="proj-msg" style="position:absolute; bottom:16px; left:0; right:0; text-align:center; color:#fff; text-shadow:0 1px 3px #000;"></div>
    <button type="button" id="arCloseBtn">✕</button>`;
  document.body.appendChild(overlay);
  arOverlayEl = overlay;

  document.getElementById('arCloseBtn').addEventListener('click', cerrarVistaAR);

  const msg = document.getElementById('arMsg');
  const agregarMsg = (texto)=>{ msg.textContent = msg.textContent ? `${msg.textContent} — ${texto}` : texto; };

  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    agregarMsg('Este navegador no soporta acceso a la cámara.');
  } else {
    pedirPermisoCamara().then(()=>{
      return navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false});
    }).then(stream=>{
      arStream = stream;
      const video = document.getElementById('arVideo');
      if(video) video.srcObject = stream;
    }).catch(err=>{ agregarMsg(`No se pudo acceder a la cámara: ${err.message}.${pistaOrigenInseguro()}`); });
  }

  iniciarBrujula(
    (heading)=> dibujarArTape(heading),
    (stopFn)=>{ arStopBrujula = stopFn; },
    (err)=>{ agregarMsg(err.message); }
  );
}
function cerrarVistaAR(){
  if(arStream){ arStream.getTracks().forEach(t=>t.stop()); arStream=null; }
  if(arStopBrujula){ arStopBrujula(); arStopBrujula=null; }
  if(arOverlayEl){ arOverlayEl.remove(); arOverlayEl=null; }
}

const RENDERERS = { brujula: renderBrujula };
