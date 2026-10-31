"use strict";
/* Herramienta «Clotoide por Progresiva»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcEstacaClotoideProgresiva(KMI, AZI_deg, R, Ls, XTE, YTE, KM_estaca){
  const l = KM_estaca - KMI;
  const {x,y} = clotoidePunto(R, Ls, l);
  const chord = Math.sqrt(x*x+y*y);
  const deflDeg = toDeg(Math.atan2(y,x));
  const azChordDeg = normDeg(AZI_deg + deflDeg);
  const {E:XP,N:YP} = calcRadiacionPunto(XTE,YTE,azChordDeg,chord);
  return {l, chord, deflDeg, azChordDeg, XP, YP};
}
function renderClotoideProgresiva(){
  const body = `<div class="field-card">
    ${fieldRow('Progresiva del TE (m)','cx_kmi',1000)}
    ${angleFieldHTML('cx_az', 45, 'Azimut de llegada al TE (tangente)')}
    ${fieldRow('Radio de la curva circular R (m)','cx_r',20)}
    ${fieldRow('Longitud de la espiral Ls (m)','cx_ls',15)}
    <div class="field-inline2">
      ${fieldRow('Coordenada Este del TE','cx_xte',5000)}
      ${fieldRow('Coordenada Norte del TE','cx_yte',10000)}
    </div>
    ${fieldRow('Progresiva de la estaca a replantear (m)','cx_km',1010)}
    <button class="btn" id="btnCX" type="button">Calcular Estaca</button>
    <div id="resCX"></div>
  </div>`;
  toolShell('clotoideProgresiva','Coordenadas de una estaca sobre una clotoide (espiral de transición) a una progresiva determinada, medida desde el TE (fin de la tangente / inicio de la espiral).', body, ['TE','l']);
  document.getElementById('btnCX').addEventListener('click', ()=>{
    const KMI=val('cx_kmi'), AZI=readAngleField('cx_az'), R=val('cx_r'), Ls=val('cx_ls'), XTE=val('cx_xte'), YTE=val('cx_yte'), KM=val('cx_km');
    const box=document.getElementById('resCX');
    if([KMI,AZI,R,Ls,XTE,YTE,KM].some(isNaN) || R<=0 || Ls<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos (radio y Ls mayores a 0).</p>`; return; }
    if(KM<KMI || KM-KMI>Ls){ box.innerHTML=`<p class="err-msg">La progresiva debe estar entre el TE y el TE+Ls (dentro del largo de la espiral).</p>`; return; }
    const r = calcEstacaClotoideProgresiva(KMI,AZI,R,Ls,XTE,YTE,KM);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Longitud recorrida desde el TE (l)</span><span class="v">${fmtNum(r.l,3)} m</span></div>
      <div class="result-row"><span class="k">Cuerda desde el TE</span><span class="v">${fmtNum(r.chord,3)} m</span></div>
      <div class="result-row"><span class="k">Ángulo de deflexión</span><span class="v">${fmtAngle(r.deflDeg)}</span></div>
      <div class="result-row"><span class="k">Azimut de la cuerda</span><span class="v">${fmtAngle(r.azChordDeg)}</span></div>
      <div class="result-row"><span class="k">Coordenadas de la estaca (E, N)</span><span class="v accent big">${fmtNum(r.XP,3)}, ${fmtNum(r.YP,3)}</span></div>
      <div class="plot-wrap">${svgClotoide(R, Ls, r.l, 'Km '+fmtNum(KM,3), "coordenadas_de_una_curva.xlsx · hoja 'clotoide'")}</div>
    </div>`;
    const btnGuardar = document.createElement('button');
    btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px';
    btnGuardar.textContent='💾 Guardar en la Libreta';
    btnGuardar.addEventListener('click', ()=>{ agregarPunto('Km '+fmtNum(KM,3), r.XP, r.YP, null); btnGuardar.textContent='Guardado ✓'; });
    box.appendChild(btnGuardar);
  });
}

const RENDERERS = { clotoideProgresiva: renderClotoideProgresiva };
