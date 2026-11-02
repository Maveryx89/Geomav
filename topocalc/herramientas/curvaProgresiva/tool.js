"use strict";
/* Herramienta «Curva Circular por Progresiva»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcEstacaCurvaProgresiva(KMI, AZI_deg, R, XPC, YPC, KM_estaca){
  const DC = KM_estaca - KMI;
  const centralRad = DC/R;
  const chord = 2*R*Math.sin(centralRad/2);
  const deflDeg = toDeg(centralRad/2);
  const azChordDeg = normDeg(AZI_deg + deflDeg);
  const {E:XP,N:YP} = calcRadiacionPunto(XPC,YPC,azChordDeg,chord);
  return {DC, chord, deflDeg, azChordDeg, XP, YP};
}
function renderCurvaProgresiva(){
  const body = `<div class="field-card">
    ${fieldRow('Progresiva del PC (m)','cp_kmi',1000)}
    ${angleFieldHTML('cp_az', 45, 'Azimut de llegada al PC (tangente)')}
    ${fieldRow('Radio R (m)','cp_r',20)}
    <div class="field-inline2">
      ${fieldRow('Coordenada Este del PC','cp_xpc',5000)}
      ${fieldRow('Coordenada Norte del PC','cp_ypc',10000)}
    </div>
    ${fieldRow('Progresiva de la estaca a replantear (m)','cp_km',1010)}
    <button class="btn" id="btnCP" type="button">Calcular Estaca</button>
    <div id="resCP"></div>
  </div>`;
  toolShell('curvaProgresiva','Coordenadas de una estaca sobre una curva circular a una progresiva (kilometraje) determinada, medida desde el PC — útil para replantear un punto puntual de la curva sin generar toda la tabla de deflexión.', body, ['R','PC','DC']);
  document.getElementById('btnCP').addEventListener('click', ()=>{
    const KMI=val('cp_kmi'), AZI=readAngleField('cp_az'), R=val('cp_r'), XPC=val('cp_xpc'), YPC=val('cp_ypc'), KM=val('cp_km');
    const box=document.getElementById('resCP');
    if([KMI,AZI,R,XPC,YPC,KM].some(isNaN) || R<=0){ box.innerHTML=`<p class="err-msg">Completa todos los campos (radio mayor a 0).</p>`; return; }
    if(KM<KMI){ box.innerHTML=`<p class="err-msg">La progresiva de la estaca debe ser mayor o igual a la del PC.</p>`; return; }
    const r = calcEstacaCurvaProgresiva(KMI,AZI,R,XPC,YPC,KM);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Desarrollo desde el PC (DC)</span><span class="v">${fmtNum(r.DC,3)} m</span></div>
      <div class="result-row"><span class="k">Cuerda desde el PC</span><span class="v">${fmtNum(r.chord,3)} m</span></div>
      <div class="result-row"><span class="k">Ángulo de deflexión</span><span class="v">${fmtAngle(r.deflDeg)}</span></div>
      <div class="result-row"><span class="k">Azimut de la cuerda</span><span class="v">${fmtAngle(r.azChordDeg)}</span></div>
      <div class="result-row"><span class="k">Coordenadas de la estaca (E, N)</span><span class="v accent big">${fmtNum(r.XP,3)}, ${fmtNum(r.YP,3)}</span></div>
      <div class="plot-wrap">${svgCurvaArco(R, 2*r.deflDeg, null, "coordenadas_de_una_curva.xlsx · hoja 'curva'", 'Estaca', undefined, {Lc:r.DC, C:r.chord, defl:r.deflDeg})}</div>
    </div>`;
    const btnGuardar = document.createElement('button');
    btnGuardar.type='button'; btnGuardar.className='btn-sm'; btnGuardar.style.marginTop='8px';
    btnGuardar.textContent='💾 Guardar en la Libreta';
    btnGuardar.addEventListener('click', ()=>{ agregarPunto('Km '+fmtNum(KM,3), r.XP, r.YP, null); btnGuardar.textContent='Guardado ✓'; });
    box.appendChild(btnGuardar);
  });
}

const RENDERERS = { curvaProgresiva: renderCurvaProgresiva };
