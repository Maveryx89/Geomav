"use strict";
/* Herramienta «Chequeo de Estación Total»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function svgEstacionEDM(distAB,distBC,distAC,r){
  const K=svgKit(), cb='var(--blueprint)', cs='var(--success)', ci='var(--ink)';
  K.list([[{k:'K',c:'var(--accent)',v:`${fmtNum(r.K*1000,1)} mm`},{k:'AB',c:cb,v:`${fmtNum(distAB,4)} m`},{k:'BC',c:cs,v:`${fmtNum(distBC,4)} m`},{k:'AC',c:ci,v:`${fmtNum(distAC,4)} m`}]]);
  const x0=45, W=230, y=106, tot=Math.max(distAB+distBC,1e-9), xA=x0, xB=x0+distAB/tot*W, xC=x0+W;
  K.line(xA,y,xC,y,'var(--ink-soft)',{sw:1.2,noObs:false});
  const dim=(xa,xb,yy,col,t)=>{ K.line(xa,yy,xb,yy,col,{sw:1}); [xa,xb].forEach(x=>K.line(x,yy-2.5,x,yy+2.5,col,{sw:0.9,noObs:false})); if(xb-xa>8) K.lineLabel(xa,yy,xb,yy,t,4.5,col,{out:[0,1],extras:[0,2]}); };
  dim(xA,xB,y+14,cb,'AB'); dim(xB,xC,y+14,cs,'BC'); dim(xA,xC,y-22,ci,'AC');
  [xA,xB,xC].forEach(x=>K.dot(x,y,'var(--ink-soft)',2.2));
  const lowB=(xB-xA<9||xC-xB<9);
  K.pointLabel('A',xA,y,4.5,'var(--ink-soft)',{dir:[0,-1],omit:false,rmin:4,rmax:10});
  K.pointLabel('B',xB,y,4.5,'var(--ink-soft)',{dir:[0,-1],omit:false,rmin:lowB?9:4,rmax:14});
  K.pointLabel('C',xC,y,4.5,'var(--ink-soft)',{dir:[0,-1],omit:false,rmin:4,rmax:10});
  return K.svg();
}
function renderChequeoEstacion(){
  const body = `<div class="field-card">
    <h3>Colimación horizontal e índice vertical (2 caras)</h3>
    <h4 style="margin-top:6px;">Cara Izquierda (CI / directa)</h4>
    ${angleFieldHTML('ce_hzfl', 84.3025, 'Lectura horizontal a la mira, CI')}
    ${angleFieldHTML('ce_zfl', 89.5514, 'Lectura vertical (cenital) a la mira, CI')}
    <h4 style="margin-top:14px;">Cara Derecha (CD / inversa)</h4>
    ${angleFieldHTML('ce_hzfr', 264.3115, 'Lectura horizontal a la mira, CD')}
    ${angleFieldHTML('ce_zfr', 270.4450, 'Lectura vertical (cenital) a la mira, CD')}
    <h3 style="margin-top:18px;">Constante aditiva del EDM (línea base A–B–C colineal)</h3>
    ${fieldRow('Distancia medida A–B (m)','ce_ab',50.0125)}
    ${fieldRow('Distancia medida B–C (m)','ce_bc',50.0089)}
    ${fieldRow('Distancia medida A–C (m)','ce_ac',100.0175)}
    <button class="btn" id="btnCE" type="button">Calcular</button>
    <div id="resCE"></div>
  </div>${vrDatosHtml('chequeoEstacion')}`;
  toolShell('chequeoEstacion','Chequeo completo de una estación total: colimación horizontal e índice vertical por dos caras (igual que en un teodolito), más la constante aditiva del EDM a partir de tres puntos colineales A, B y C medidos con el propio instrumento (K=(AB+BC)−AC, sin necesidad de una línea base externa calibrada).', body, ['CI','CD','ZI','ZD','C','i','EDM','K']);
  vrWire();
  document.getElementById('btnCE').addEventListener('click', ()=>{
    const hzFL=readAngleField('ce_hzfl'), hzFR=readAngleField('ce_hzfr'), zFL=readAngleField('ce_zfl'), zFR=readAngleField('ce_zfr');
    const ab=val('ce_ab'), bc=val('ce_bc'), ac=val('ce_ac');
    const box=document.getElementById('resCE');
    if([hzFL,hzFR,zFL,zFR,ab,bc,ac].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa las lecturas angulares y las tres distancias.</p>`; return; }
    const rAng = calcDosCaras(hzFL,hzFR,zFL,zFR);
    const rEdm = calcConstanteEDM(ab,bc,ac);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Error de colimación horizontal (C)</span><span class="v accent big">${fmtNum(rAng.Csec,1)}"</span></div>
      <div class="result-row"><span class="k">Diagnóstico colimación</span><span class="v" style="color:${rAng.okC?'inherit':'var(--accent)'}">${rAng.okC?'Dentro de tolerancia (≤20")':'Fuera de tolerancia, requiere ajuste'}</span></div>
      <div class="result-row"><span class="k">Error de índice vertical (i)</span><span class="v accent big">${fmtNum(rAng.isec,1)}"</span></div>
      <div class="result-row"><span class="k">Diagnóstico índice vertical</span><span class="v" style="color:${rAng.okI?'inherit':'var(--accent)'}">${rAng.okI?'Dentro de tolerancia (≤20")':'Fuera de tolerancia, requiere ajuste'}</span></div>
      <div class="plot-wrap">${svgTeodolitoDosCaras(hzFL,hzFR,zFL,zFR,rAng)}</div>
      <div class="result-row" style="margin-top:14px;"><span class="k">Constante aditiva del EDM (K)</span><span class="v accent big">${fmtNum(rEdm.K*1000,1)} mm</span></div>
      <div class="result-row"><span class="k">Diagnóstico EDM</span><span class="v" style="color:${rEdm.ok?'inherit':'var(--accent)'}">${rEdm.ok?'Dentro de tolerancia (≤5 mm)':'Fuera de tolerancia, requiere corrección en el equipo'}</span></div>
      <div class="plot-wrap">${svgEstacionEDM(ab,bc,ac,rEdm)}</div>
    </div>`;
  });
}

const RENDERERS = { chequeoEstacion: renderChequeoEstacion };
