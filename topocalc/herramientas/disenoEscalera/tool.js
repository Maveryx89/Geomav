"use strict";
/* Herramienta «Diseño y Trazado de Escalera»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcDisenoEscalera(H, Cp, P, A, maxPorTramo, fondoDescanso){
  const n = Math.max(1, Math.round(H/Cp));
  const CpReal = H/n;
  const blondelCm = (2*CpReal + P) * 100;
  let blondelEstado;
  if(blondelCm>=60 && blondelCm<=64) blondelEstado='ideal';
  else if(blondelCm>=58 && blondelCm<=65) blondelEstado='aceptable';
  else blondelEstado='fuera';
  const pasoSugerido = 0.64 - 2*CpReal;
  const tramos = Math.max(1, Math.ceil(n/maxPorTramo));
  const base = Math.floor(n/tramos), extra = n % tramos;
  const contrahuellasPorTramo = [];
  for(let i=0;i<tramos;i++) contrahuellasPorTramo.push(base + (i<extra?1:0));
  const huellasPorTramo = contrahuellasPorTramo.map(c=>c-1);
  const horizPorTramo = huellasPorTramo.map(hu=>hu*P);
  const numDescansos = tramos-1;
  const longHorizontalTotal = horizPorTramo.reduce((a,b)=>a+b,0) + numDescansos*fondoDescanso;
  const huellasTotal = n - tramos;
  return {n, CpReal, blondelCm, blondelEstado, pasoSugerido, tramos, contrahuellasPorTramo, huellasPorTramo, horizPorTramo, numDescansos, longHorizontalTotal, huellasTotal};
}
function svgDisenoEscalera(r, P, fondoDescanso){
  const K=svgKit(), nt=r.contrahuellasPorTramo.length, col={Cp:'var(--blueprint)',P:'var(--danger)',H:'var(--success)',L:'var(--accent)',T:'var(--ink-soft)'};
  const rows=[{k:'L',c:col.L,v:`${fmtNum(r.longHorizontalTotal,2)} m`},{k:'H',c:col.H,v:`${fmtNum(r.n*r.CpReal,2)} m`},{k:'N',c:'var(--ink)',v:`${r.n}`},{k:'Cp',c:col.Cp,v:`${fmtNum(r.CpReal,3)} m`},{k:'P',c:col.P,v:`${fmtNum(P,3)} m`}];
  if(nt>1){ rows.push({k:'Dc',c:col.T,v:`${fmtNum(fondoDescanso,2)} m`}); r.horizPorTramo.forEach((h,i)=>rows.push({k:'T'+(i+1),c:col.T,v:`${fmtNum(h,2)} m`})); }
  K.list([rows],{perCol:4});
  const maxShow=6, seq=[]; r.contrahuellasPorTramo.forEach((c,i)=>{ for(let k=0;k<Math.min(c,maxShow);k++) seq.push({t:'s',seg:i}); if(i<nt-1) seq.push({t:'d',seg:i}); });
  const ns=seq.filter(q=>q.t==='s').length, nd=seq.filter(q=>q.t==='d').length, x0=44, availW=262, unit=availW/Math.max(ns+nd*1.4,1), lw=unit*1.4;
  const top=Math.max(K.listBottom+12,46), base=nt>1?144:150, rh=Math.min((base-top-4)/Math.max(ns,1),16);
  let x=x0, y=base, first={}; const pts=[[x,y]], segs={};
  seq.forEach(q=>{ const id=q.t+q.seg; if(!segs[id]) segs[id]={x0:x,y,t:q.t,seg:q.seg};
    if(q.t==='s'){ const ya=y; y-=rh; pts.push([x,y]); const xa=x; x+=unit; pts.push([x,y]); if(!first.x0&&first.x0!==0) first={x0:xa,y0:ya,x1:x,y1:y}; } else { x+=lw; pts.push([x,y]); }
    segs[id].x1=x; });
  const xt=x, yt=y;
  K.poly([[x0,base],...pts,[xt,base]],{close:true,fill:'var(--ink)',fo:0.08,stroke:'var(--ink)',sw:1.3});
  // tramos y descansos
  const yd=base+9; if(nt>1){ K.line(x0,yd,xt,yd,col.T,{sw:0.7}); Object.values(segs).forEach(s=>{ K.line(s.x0,yd-2,s.x0,yd+2,col.T,{sw:0.7,noObs:false}); K.lineLabel(s.x0,yd,s.x1,yd,s.t==='s'?'T'+(s.seg+1):'Dc',3.6,col.T,{out:[0,1],extras:[0,2]}); }); K.line(xt,yd-2,xt,yd+2,col.T,{sw:0.7,noObs:false}); }
  // L total
  const yl=base+(nt>1?22:12); K.line(x0,yl,xt,yl,col.L,{sw:1}); [x0,xt].forEach(v=>K.line(v,yl-2.5,v,yl+2.5,col.L,{sw:0.9,noObs:false})); K.lineLabel(x0,yl,xt,yl,'L',4.5,col.L,{out:[0,1],extras:[0,3]});
  // H total
  const hx=x0-14; K.line(hx,base,hx,yt,col.H,{sw:1}); [base,yt].forEach(v=>K.line(hx-2.5,v,hx+2.5,v,col.H,{sw:0.9,noObs:false})); K.lineLabel(hx,base,hx,yt,'H',4.5,col.H,{out:[-1,0],extras:[0,3]});
  // Cp y P del primer peldaño
  K.lineLabel(first.x0,first.y0,first.x0,first.y1,'Cp',3.6,col.Cp,{out:[-1,0],extras:[0,2,4]});
  K.lineLabel(first.x0,first.y1,first.x1,first.y1,'P',3.6,col.P,{out:[0,-1],extras:[0,2,4]});
  if(r.contrahuellasPorTramo.some(c=>c>maxShow)) K.add(`<text x="160" y="187" ${K.FONT} font-size="3.6" fill="var(--ink-soft)" text-anchor="middle">(esquemático — ver tabla para el detalle real de peldaños)</text>\n`);
  return K.svg();
}
function renderDisenoEscalera(){
  const body = `<div class="field-card">
    <h3>Datos de la escalera</h3>
    ${fieldRow('Altura total a salvar, H (m)','de_h',2.60)}
    ${fieldRow('Contrapaso deseado, Cp (m)','de_cp',0.17,{step:0.005})}
    ${fieldRow('Paso (huella) deseado, P (m)','de_p',0.28,{step:0.005})}
    ${fieldRow('Ancho de la escalera, A (m)','de_a',1.00,{step:0.05})}
    ${fieldRow('Máx. peldaños por tramo sin descanso','de_max',16,{step:1})}
    ${fieldRow('Fondo del descanso (m)','de_fd',1.00,{step:0.05})}
    <button class="btn" id="btnDE" type="button">Calcular</button>
    <div id="resDE"></div>
  </div>`;
  toolShell('disenoEscalera','Calcula el número de peldaños, el contrapaso real ajustado, la cantidad de tramos y descansos necesarios, y verifica el diseño contra criterios generales de comodidad y buena práctica de construcción en Chile.', body, ['P','Cp']);
  document.getElementById('btnDE').addEventListener('click', ()=>{
    const H=val('de_h'), Cp=val('de_cp'), P=val('de_p'), A=val('de_a'), maxPorTramo=valInt('de_max'), fondoDescanso=val('de_fd');
    const box=document.getElementById('resDE');
    if([H,Cp,P,A,maxPorTramo,fondoDescanso].some(isNaN) || H<=0 || Cp<=0 || P<=0 || A<=0 || maxPorTramo<1 || fondoDescanso<0){
      box.innerHTML = `<p class="err-msg">Completa todos los campos con valores válidos.</p>`; return;
    }
    const r = calcDisenoEscalera(H,Cp,P,A,maxPorTramo,fondoDescanso);

    const blondelTxt = r.blondelEstado==='ideal' ? '✅ Ideal (rango de confort 60–64 cm)'
      : r.blondelEstado==='aceptable' ? '⚠️ Aceptable, en el límite (recomendado 60–64 cm)'
      : `❌ Fuera de rango — paso sugerido ≈ ${fmtNum(r.pasoSugerido,2)} m`;
    const anchoTxt = A>=0.90 ? '✅ Cómodo (≥ 0.90 m)' : A>=0.80 ? '⚠️ Mínimo aceptable en vivienda unifamiliar (≥ 0.80 m) — uso público exige más' : '❌ Bajo el mínimo recomendado (0.80 m)';
    const cpTxt = (r.CpReal>=0.16 && r.CpReal<=0.18) ? '✅ Dentro del rango recomendado (16 – 18 cm)' : (r.CpReal<0.16 ? '⚠️ Bajo el rango recomendado (16 – 18 cm)' : '❌ Sobre el rango recomendado (16 – 18 cm)');
    const pTxt = (P>=0.28 && P<=0.32) ? '✅ Dentro del rango recomendado (28 – 32 cm)' : (P<0.28 ? '❌ Bajo el rango recomendado (28 – 32 cm)' : '⚠️ Sobre el rango recomendado (28 – 32 cm)');

    const tablaTramos = r.tramos>1 ? `<table class="data-table"><thead><tr><th>Tramo</th><th>N° contrahuellas</th><th>N° huellas</th><th>Proyección horiz.</th></tr></thead><tbody>
      ${r.contrahuellasPorTramo.map((c,i)=>`<tr><td>${i+1}</td><td>${c}</td><td>${r.huellasPorTramo[i]}</td><td>${fmtNum(r.horizPorTramo[i],2)} m</td></tr>`).join('')}
    </tbody></table>` : '';

    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">N° de contrahuellas (peldaños)</span><span class="v accent big">${r.n}</span></div>
      <div class="result-row"><span class="k">Contrapaso real ajustado, Cp</span><span class="v">${fmtNum(r.CpReal,3)} m</span></div>
      <div class="result-row"><span class="k">Fórmula de Blondel (2Cp + P)</span><span class="v">${fmtNum(r.blondelCm,1)} cm</span></div>
      <div class="result-row"><span class="k">N° de tramos necesarios</span><span class="v">${r.tramos}</span></div>
      <div class="result-row"><span class="k">N° de descansos</span><span class="v">${r.numDescansos}</span></div>
      <div class="result-row"><span class="k">Huellas totales</span><span class="v">${r.huellasTotal}</span></div>
      <div class="result-row"><span class="k">Longitud horizontal total (en planta)</span><span class="v accent big">${fmtNum(r.longHorizontalTotal,2)} m</span></div>
    </div>
    ${tablaTramos}
    <div class="field-card" style="margin-top:14px;">
      <h3>Criterios generales de diseño (uso residencial)</h3>
      <div class="result-row"><span class="k">Comodidad (Blondel)</span><span class="v">${blondelTxt}</span></div>
      <div class="result-row"><span class="k">Ancho, A = ${fmtNum(A,2)} m</span><span class="v">${anchoTxt}</span></div>
      <div class="result-row"><span class="k">Contrapaso, Cp = ${fmtNum(r.CpReal,3)} m</span><span class="v">${cpTxt}</span></div>
      <div class="result-row"><span class="k">Huella, P = ${fmtNum(P,3)} m</span><span class="v">${pTxt}</span></div>
      <p class="proj-msg" style="margin-top:8px;">Criterios generales de comodidad y buena práctica; las exigencias exactas (ancho, contrahuella, tramos sin descanso) varían según el uso del edificio — verificar con la DOM correspondiente antes de construir.</p>
    </div>
    <div class="plot-wrap">${svgDisenoEscalera(r, P, fondoDescanso)}</div>`;
  });
}

const RENDERERS = { disenoEscalera: renderDisenoEscalera };
