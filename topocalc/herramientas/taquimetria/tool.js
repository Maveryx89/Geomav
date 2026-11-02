"use strict";
/* Herramienta «Taquimetría»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcTaquimetria(hs,hi,hm,anguloDeg,K,alturaInstr){
  const dg = hs-hi;
  const a = toRad(anguloDeg);
  const Dh = K*dg*Math.pow(Math.cos(a),2);
  const Dv = K*dg*Math.sin(a)*Math.cos(a);
  return {dg, Dh, Dv, desnivel: alturaInstr + Dv - hm};
}
function svgTaquimetria(hs,hm,hi_lect,anguloDeg,r){
  const K=svgKit(), rows=[];
  if(r){ rows.push({k:'Dh',c:'var(--accent)',v:`${fmtNum(r.Dh,3)} m`}); rows.push({k:'Dv',c:'var(--success)',v:`${fmtNum(r.Dv,3)} m`}); }
  rows.push({k:'α',c:'var(--blueprint)',v:fmtAngle(anguloDeg)});
  rows.push({k:'Hs',c:'var(--danger)',v:`${fmtNum(hs,3)} m`}); rows.push({k:'Hm',c:'var(--ink)',v:`${fmtNum(hm,3)} m`}); rows.push({k:'Hi',c:'var(--ink-soft)',v:`${fmtNum(hi_lect,3)} m`});
  if(r) rows.push({k:'Desnivel',c:'var(--ink)',v:`${fmtNum(r.desnivel,3)} m`});
  K.list([rows],{perCol:4});
  const A=[52,0], rodX=244, dx=rodX-A[0], top=Math.max(K.listBottom+10,56), bot=176;
  let a=Math.max(-16,Math.min(anguloDeg,16)); if(Math.abs(a)<5) a=a<0?-5:5;
  const dy=Math.min(55,dx*Math.tan(toRad(Math.abs(a))))*Math.sign(a);   // dy>0 = la mira queda más arriba
  const span=Math.max(hs-hi_lect,1e-6), fS=Math.min(Math.max((hs-hm)/span,0.12),0.88), L=Math.min(40,(bot-top)-Math.abs(dy)-16);
  const up=fS*L, dn=(1-fS)*L;
  // yM: posición del hilo medio; se centra el conjunto y se acota para que la mira completa quede dentro del marco
  const lo=Math.max(top+up+6, top+Math.max(0,-dy)+4), hi=Math.min(bot-dn-6, bot-Math.max(0,dy)-4);
  const yM=Math.min(Math.max((top+bot)/2-dy/2,lo),Math.max(lo,hi)); A[1]=yM+dy;
  const yS=yM-up, yI=yM+dn;
  const rt=Math.max(top-2,yS-8), rb=Math.min(bot,yI+8);
  // terreno bajo la mira y la mira
  K.line(rodX-26,rb,rodX+26,rb,'#8B6B47',{sw:1.2,noObs:false});
  K.line(rodX,rt,rodX,rb,'var(--ink)',{sw:1.8});
  // horizontal del instrumento (Dh) y vertical sobre la mira (Dv)
  K.line(...A,rodX,A[1],'var(--accent)',{sw:1,dash:'2.4 2'});
  K.line(rodX-9,A[1],rodX-9,yM,'var(--success)',{sw:1});
  // visuales
  K.line(...A,rodX,yS,'var(--danger)',{sw:0.7,dash:'1.6 1.6'}); K.line(...A,rodX,yI,'var(--ink-soft)',{sw:0.7,dash:'1.6 1.6'});
  K.line(...A,rodX,yM,'var(--ink)',{sw:1.1});
  [[yS,'var(--danger)'],[yM,'var(--ink)'],[yI,'var(--ink-soft)']].forEach(([y,c])=>K.line(rodX-5,y,rodX+5,y,c,{sw:1.4,noObs:false}));
  // ángulo α
  const ra=26; K.arc(A[0],A[1],ra,0,-a,'var(--blueprint)',{sw:0.9});
  K.dot(...A,'var(--ink-soft)',2);
  // letras
  K.pointLabel('Hs',rodX+5,yS,4.5,'var(--danger)',{dir:[1,0],rmin:3,rmax:10,omit:false});
  K.pointLabel('Hm',rodX+5,yM,4.5,'var(--ink)',{dir:[1,0],rmin:3,rmax:10,omit:false});
  K.pointLabel('Hi',rodX+5,yI,4.5,'var(--ink-soft)',{dir:[1,0],rmin:3,rmax:10,omit:false});
  K.pointLabel('A',A[0],A[1],4.5,'var(--ink-soft)',{dir:[-1,0.5],omit:false});
  const am=-a/2*Math.PI/180; K.pointLabel('α',A[0]+ra*Math.cos(am),A[1]+ra*Math.sin(am),4.5,'var(--blueprint)',{dir:[Math.cos(am),Math.sin(am)],rmin:2,rmax:9});
  K.lineLabel(...A,rodX,A[1],'Dh',4.5,'var(--accent)',{at:0.55,out:[0,a>0?1:-1],extras:[0,3,6]});
  if(Math.abs(A[1]-yM)>8) K.lineLabel(rodX-9,A[1],rodX-9,yM,'Dv',4.5,'var(--success)',{out:[-1,0],extras:[0,3]});
  return K.svg();
}
function renderTaqui(){
  const body = `<div class="field-card">
    <h3>Lectura de mira (m)</h3>
    <div class="field-inline">
      ${fieldRow('Hilo sup.','t_hs',1.850)}
      ${fieldRow('Hilo medio','t_hm',1.500)}
      ${fieldRow('Hilo inf.','t_hi',1.150)}
    </div>
    <div class="field-inline2">
      ${fieldRow(`Ángulo vertical ${angleSimpleLabel()}, desde horizonte`,'t_ang',angleSimpleDefault(8.5))}
      ${fieldRow('Constante estadimétrica K','t_k',100)}
    </div>
    ${fieldRow('Altura del instrumento (m)','t_hi_instr',1.480)}
    <button class="btn" id="btnT" type="button">Calcular</button>
    <div id="resT"></div>
  </div>`;
  toolShell('taquimetria','Distancia horizontal y desnivel a partir de la lectura estadimétrica (hilos) y el ángulo vertical medido desde el horizonte.', body);
  document.getElementById('btnT').addEventListener('click', ()=>{
    const hs=val('t_hs'), hi=val('t_hi'), hm=val('t_hm'), ang=readAngleSimple('t_ang'), K=val('t_k'), hinst=val('t_hi_instr');
    const box=document.getElementById('resT');
    if([hs,hi,hm,ang,K,hinst].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcTaquimetria(hs,hi,hm,ang,K,hinst);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Intervalo estadimétrico</span><span class="v">${fmtNum(r.dg,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia horizontal</span><span class="v accent big">${fmtNum(r.Dh,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia vertical</span><span class="v">${fmtNum(r.Dv,3)} m</span></div>
      <div class="result-row"><span class="k">Desnivel</span><span class="v accent">${fmtNum(r.desnivel,3)} m</span></div>
      <div class="plot-wrap">${svgTaquimetria(hs,hm,hi,ang,r)}</div>
    </div>`;
  });
}

const RENDERERS = { taquimetria: renderTaqui };
