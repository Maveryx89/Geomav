"use strict";
/* Herramienta «Plantillado de Zanja (Alcantarillado)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcPlantillaZanja(K1,Cp1,S,Kx,hcama,HI){
  const Cradier = Cp1+(Kx-K1)*(S/100);
  const Cexc = Cradier-hcama;
  const Lmira = HI-Cexc;
  return {Cradier, Cexc, Lmira};
}
function svgPlantillaZanja(K1,Cp1,S,Kx,hcama,HI,r){
  const K=svgKit(), col={S:'var(--blueprint)',HI:'var(--ink)',hc:'var(--danger)',L:'var(--accent)',R:'var(--success)'};
  K.list([[{k:'Lmira',c:col.L,v:`${fmtNum(r.Lmira,3)} m`},{k:'HI',c:col.HI,v:`${fmtNum(HI,3)} m`},{k:'Cradier',c:col.R,v:`${fmtNum(r.Cradier,3)} m`},{k:'Cexc',c:'var(--ink)',v:`${fmtNum(r.Cexc,3)} m`},{k:'Cp1',c:'var(--ink-soft)',v:`${fmtNum(Cp1,3)} m`},{k:'S',c:col.S,v:`${fmtNum(S,2)} %`},{k:'hc',c:col.hc,v:`${fmtNum(hcama,3)} m`}]],{perCol:4});
  const top=Math.max(K.listBottom+14,50), bot=168, vals=[Cp1,r.Cradier,r.Cexc,HI], mn=Math.min(...vals), mx=Math.max(...vals,mn+0.01);
  const y=c=>bot-(c-mn)/(mx-mn)*(bot-top), x1=30, x2=214, x3=262;
  const yHI=y(HI), yP=y(Cp1), yR=y(r.Cradier); let yF=y(r.Cexc); if(yF-yR<10) yF=Math.min(yR+10,bot+4);
  // nivel instrumental, tubería, cama, mira
  K.line(x1-8,yHI,x3+10,yHI,col.HI,{sw:0.8,dash:'3 2'});
  K.line(x1,yP,x2,yR,col.S,{sw:1.5});
  K.line(x2,yR,x2,yF,col.hc,{sw:1.1}); [yR,yF].forEach(v=>K.line(x2-2,v,x2+2,v,col.hc,{sw:0.9,noObs:false}));
  K.line(x2,yF,x3+3,yF,'var(--ink-soft)',{sw:0.6,dash:'1.6 1.6',noObs:false});
  K.line(x3,yHI,x3,yF,col.L,{sw:1.2}); [yHI,yF].forEach(v=>K.line(x3-2,v,x3+2,v,col.L,{sw:1,noObs:false}));
  K.dot(x1,yP,'var(--ink-soft)',2); K.dot(x2,yR,col.R,2.2); K.dot(x2,yF,'var(--ink)',2.2);
  K.lineLabel(x1-8,yHI,x3+10,yHI,'HI',4.5,col.HI,{at:0.12,out:[0,-1],extras:[0,3]});
  K.lineLabel(x1,yP,x2,yR,'S',4.5,col.S,{at:0.5,out:[0,-1],extras:[0,3,6]});
  K.lineLabel(x3,yHI,x3,yF,'Lmira',4.5,col.L,{out:[1,0],extras:[0,3]});
  K.lineLabel(x2,yR,x2,yF,'hc',4.5,col.hc,{out:[1,0],extras:[0,3]});
  K.pointLabel('K1',x1,yP,4.5,'var(--ink-soft)',{dir:[-1,0.6],omit:false,rmin:4.5,rmax:12});
  K.pointLabel('Radier',x2,yR,3.6,col.R,{dir:[-0.6,-1],omit:false,rmin:4,rmax:12});
  K.pointLabel('Fondo',x2,yF,3.6,'var(--ink)',{dir:[-1,0.7],omit:false,rmin:4,rmax:12});
  return K.svg();
}
function renderPlantillaZanja(){
  const body = `<div class="field-card">
    ${fieldRow('Progresiva de origen, K1 (m)','pz_k1',0)}
    ${fieldRow('Cota de radier en K1, Cp1 (m)','pz_cp1',150.000)}
    ${fieldRow('Pendiente de la tubería, S (%)','pz_s',-1.20)}
    ${fieldRow('Progresiva a plantillar, Kx (m)','pz_kx',12.50)}
    ${fieldRow('Espesor de cama de apoyo (m)','pz_hcama',0.10)}
    ${fieldRow('Cota instrumental del nivel, HI (m)','pz_hi',152.450)}
    <button class="btn" id="btnPZ" type="button">Calcular</button>
    <div id="resPZ"></div>
  </div>`;
  toolShell('plantillaZanja','Cota de radier teórico, cota de fondo de excavación (descontando la cama de apoyo) y la lectura de mira que debe marcar el nivel para dar con el fondo de zanja, en cualquier progresiva de la tubería.', body, ['K','HI']);
  document.getElementById('btnPZ').addEventListener('click', ()=>{
    const K1=val('pz_k1'), Cp1=val('pz_cp1'), S=val('pz_s'), Kx=val('pz_kx'), hcama=val('pz_hcama'), HI=val('pz_hi');
    const box=document.getElementById('resPZ');
    if([K1,Cp1,S,Kx,hcama,HI].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcPlantillaZanja(K1,Cp1,S,Kx,hcama,HI);
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Cota de radier teórico</span><span class="v">${fmtNum(r.Cradier,3)} m</span></div>
      <div class="result-row"><span class="k">Cota de fondo de excavación</span><span class="v">${fmtNum(r.Cexc,3)} m</span></div>
      <div class="result-row"><span class="k">Lectura de mira esperada</span><span class="v accent big">${fmtNum(r.Lmira,3)} m</span></div>
      <div class="plot-wrap">${svgPlantillaZanja(K1,Cp1,S,Kx,hcama,HI,r)}</div>
    </div>`;
  });
}

const RENDERERS = { plantillaZanja: renderPlantillaZanja };
