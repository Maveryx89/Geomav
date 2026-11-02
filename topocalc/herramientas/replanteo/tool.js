"use strict";
/* Herramienta «Replanteo de Curva»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcTablaDeflexion(R, deltaDeg, nPuntos){
  const Lc = R*toRad(deltaDeg);
  const rows=[];
  for(let i=1;i<=nPuntos;i++){
    const Li = Lc*i/nPuntos;
    const defl = (Li/Lc)*(deltaDeg/2);
    const cuerda = 2*R*Math.sin(toRad(defl));
    rows.push({Li, defl, cuerda});
  }
  return {Lc, rows};
}
let repN = 5;
function renderReplanteo(){
  const bodyFieldsHtml = (mode)=> curvaBodyFieldsHtml(mode, 'rp_');
  const body = `<div class="field-card">
    <div class="field-row"><label>Datos que conoces</label>${curvaModeSelectHtml('rp_mode','R_D')}</div>
    <div id="rp_fields">${bodyFieldsHtml('R_D')}</div>
    ${fieldRow('Progresiva del PC (opcional, m)','rp_pc','')}
    <div class="field-row"><label>Método de replanteo</label>
      <select id="rp_metodo">
        <option value="n" selected>Por número de puntos (equiespaciados)</option>
        <option value="paso">Por paso fijo (cada X metros)</option>
      </select>
    </div>
    <div class="field-row" id="rp_n_wrap"><label>Puntos a replantear</label>
      <div class="n-stepper"><button type="button" id="rpMinus">−</button><span class="n-val" id="rpNVal">${repN}</span><button type="button" id="rpPlus">+</button></div>
    </div>
    <div id="rp_paso_wrap" style="display:none;">${fieldRow('Paso de replanteo (m)','rp_paso',5)}</div>
    <button class="btn" id="btnRP" type="button">Generar Tabla</button>
    <div id="resRP"></div>
  </div>`;
  toolShell('replanteo','Genera la tabla de deflexión para replantear una curva circular en terreno con teodolito. Ingresa el radio o la deflexión junto con cualquier otro elemento conocido (tangente, longitud de curva, cuerda larga, externa u ordenada media), y replantea por número de puntos o cada un paso fijo en metros.', body, ['R','Δ','T','Lc','C','E','M','PC','PT']);

  const modeSelect = document.getElementById('rp_mode');
  const fieldsDiv = document.getElementById('rp_fields');
  modeSelect.addEventListener('change', ()=>{ fieldsDiv.innerHTML = bodyFieldsHtml(modeSelect.value); });

  const metodoSelect = document.getElementById('rp_metodo');
  const nWrap = document.getElementById('rp_n_wrap'), pasoWrap = document.getElementById('rp_paso_wrap');
  metodoSelect.addEventListener('change', ()=>{
    const porPaso = metodoSelect.value==='paso';
    nWrap.style.display = porPaso ? 'none' : '';
    pasoWrap.style.display = porPaso ? '' : 'none';
  });

  document.getElementById('rpMinus').addEventListener('click', ()=>{ if(repN>2){repN--; document.getElementById('rpNVal').textContent=repN;}});
  document.getElementById('rpPlus').addEventListener('click', ()=>{ if(repN<20){repN++; document.getElementById('rpNVal').textContent=repN;}});

  document.getElementById('btnRP').addEventListener('click', ()=>{
    const mode = modeSelect.value;
    const {v1, v2} = readCurvaModeInputs(mode, 'rp_');
    const box=document.getElementById('resRP');
    if(isNaN(v1)||isNaN(v2)){ box.innerHTML=`<p class="err-msg">Completa ambos valores.</p>`; return; }
    const {R,Ddeg} = resolveCurvaCircular(mode, v1, v2);
    if(!isFinite(R) || !isFinite(Ddeg) || R<=0 || Ddeg<=0 || Ddeg>=180){
      box.innerHTML=`<p class="err-msg">Esa combinación de valores no forma una curva válida — revisa los datos (por ejemplo, una cuerda no puede ser mayor que el diámetro).</p>`; return;
    }
    const Lc = R*toRad(Ddeg);

    let rows;
    if(metodoSelect.value==='paso'){
      const paso = val('rp_paso');
      if(isNaN(paso) || paso<=0){ box.innerHTML=`<p class="err-msg">Ingresa un paso de replanteo mayor que 0.</p>`; return; }
      rows = [];
      let Li = paso;
      while(Li < Lc - 1e-9){
        const defl = (Li/Lc)*(Ddeg/2);
        rows.push({Li, defl, cuerda: 2*R*Math.sin(toRad(defl))});
        Li += paso;
      }
      const deflFinal = Ddeg/2;
      rows.push({Li:Lc, defl:deflFinal, cuerda: 2*R*Math.sin(toRad(deflFinal))});
    } else {
      rows = calcTablaDeflexion(R,Ddeg,repN).rows;
    }

    const pcProg = val('rp_pc');
    const conProg = !isNaN(pcProg);
    let trs='';
    rows.forEach((row,i)=>{
      const prog = conProg ? fmtNum(pcProg+row.Li,3) : `P${i+1}`;
      trs += `<tr><td>${prog}</td><td>${fmtNum(row.Li,2)}</td><td>${fmtAngle(row.defl)}</td><td>${fmtNum(row.cuerda,3)}</td></tr>`;
    });
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Radio (R)</span><span class="v${mode[0]==='R'?'':' accent'}">${fmtNum(R,3)} m</span></div>
      <div class="result-row"><span class="k">Deflexión (Δ)</span><span class="v${mode[0]==='D'?'':' accent'}">${fmtAngle(Ddeg)}</span></div>
      <div class="result-row"><span class="k">Longitud de curva (Lc)</span><span class="v accent big">${fmtNum(Lc,3)} m</span></div>
      <div class="table-wrap" style="margin-top:10px;"><table class="data-table"><thead><tr><th>${conProg?'Progresiva':'Punto'}</th><th>Dist. acum.</th><th>Deflexión</th><th>Cuerda parcial</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgCurvaArco(R,Ddeg, rows.map(r=>({frac:r.Li/Lc})), null, null, R*Math.tan(toRad(Ddeg/2)), {Lc:Lc,star:'Lc'})}</div>
    </div>`;
  });
}

const RENDERERS = { replanteo: renderReplanteo };
