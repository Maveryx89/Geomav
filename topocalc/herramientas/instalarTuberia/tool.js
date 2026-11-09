"use strict";
/* Herramienta «Instalar Tuberías (Nivel)»: control de cota y pendiente de una tubería con nivel. A partir de las cotas del
   pelo de agua (fondo interior) al inicio y al final, el diámetro interior y el espesor, calcula la cota de la clave en cada
   distancia parcial, la lectura teórica de mira sobre la clave y cuánto hay que bajar o subir el tubo según la lectura real.
   Mismos datos de entrada y de salida que el programa NIV~TUBE de la calculadora Casio fx-9860GII. */
let tbN = 3;

/* I, T: cotas del pelo de agua al inicio y al final; F: longitud; D: diámetro interior; E: espesor del tubo; X: cota del PR;
   A: lectura atrás al PR; Q: distancia parcial; Y: lectura real sobre la clave (NaN si aún no se mide). */
function calcInstalarTuberia(I,T,F,D,E,X,A,Q,Y){
  const pend=(T-I)/F, hi=X+A, inv=pend*Q+I, clave=inv+(D+E), lect=hi-clave;
  const r={pend,hi,inv,clave,lect};
  if(isFinite(Y)){ r.G=lect-Y; r.accion = r.G>0?'Bajar':(r.G<0?'Subir':'Correcto'); r.mov=Math.abs(r.G); }
  return r;
}

function svgInstalarTuberia(p,r,Q,Y){
  const K=svgKit(), f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const hay=r.G!==undefined;
  K.list([[{k:'Pendiente',c:CK,v:`${fmtNum(p.pend*100,3)} %`},{k:'Alt. instr.',c:CP,v:`${fmtNum(r.hi,3)} m`},{k:'Dist. parcial',c:CK,v:`${fmtNum(Q,3)} m`}],
          [{k:'Cota pelo agua',c:CD,v:fmtNum(r.inv,3)},{k:'Cota clave',c:CZ,v:fmtNum(r.clave,3)},{k:'Lect. teórica',c:CZ,v:fmtNum(r.lect,3)}].concat(hay?[{k:r.accion,c:CP,v:`${fmtNum(r.mov,3)} m`}]:[])]);
  const top=Math.max(44,K.listBottom+12);
  const dE=p.D+p.E, yMax=Math.max(r.hi,p.I+dE,p.T+dE), yMin=Math.min(p.I,p.T,r.inv);
  const spY=Math.max(yMax-yMin,1e-9), spX=Math.max(p.F,1e-9);
  const x0=40,x1=290,sx=(x1-x0)/spX, sy=(158-top-4)/spY, ex=sy/sx;
  const X=x=>x0+x*sx, Y_=c=>162-(c-yMin)*sy;
  // tubo: pelo de agua y clave
  K.line(X(0),Y_(p.I),X(p.F),Y_(p.T),CD,{sw:1});
  K.line(X(0),Y_(p.I+dE),X(p.F),Y_(p.T+dE),CZ,{sw:1});
  K.line(X(0),Y_(p.I),X(0),Y_(p.I+dE),CS,{sw:0.7}); K.line(X(p.F),Y_(p.T),X(p.F),Y_(p.T+dE),CS,{sw:0.7});
  K.line(22,Y_(r.hi),298,Y_(r.hi),CP,{dash:'3 2'}); K.txt('Alt. instr.',3.8,CP,{x:297,y:Y_(r.hi)-1.8,anchor:'end'});
  const qx=X(Math.max(0,Math.min(p.F,Q))), yc=Y_(r.clave), yi=Y_(r.inv);
  K.line(qx,yc,qx,Y_(r.hi),CZ,{sw:1.2}); K.dot(qx,yc,CZ,2.4); K.dot(qx,yi,CD,2);
  K.put(`L ${fmtNum(r.lect,3)}`,3.9,CZ,[{x:qx+2.6,y:(yc+Y_(r.hi))/2,anchor:'start',pen:0},{x:qx-2.6,y:(yc+Y_(r.hi))/2,anchor:'end',pen:1}]);
  if(hay && Math.abs(r.G)>1e-9){
    const yr=Y_(r.hi-Y);
    K.line(qx+5,yc,qx+5,yr,CP,{sw:1,dash:'1.5 1.3'}); K.dot(qx+5,yr,CP,2.2);
    K.put(`${r.accion} ${fmtNum(r.mov,3)} m`,3.9,CP,[{x:qx+8,y:(yc+yr)/2+1.4,anchor:'start',pen:0},{x:qx-8,y:(yc+yr)/2+1.4,anchor:'end',pen:1}]);
  }
  K.put('Pelo de agua',3.8,CD,[{x:X(p.F*0.12),y:Y_(p.I+(p.T-p.I)*0.12)+7,anchor:'middle',pen:0}]);
  K.put('Clave',3.8,CZ,[{x:X(p.F*0.12),y:Y_(p.I+(p.T-p.I)*0.12+dE)-3,anchor:'middle',pen:0}]);
  if(ex>1.2) K.txt(`Escala vertical ×${Math.round(ex)}`,3.6,CS,{x:292,y:177,anchor:'end'});
  return K.svg();
}

function renderInstalarTuberia(){
  const body = `<div class="field-card">
    <h3>Tubería</h3>
    <div class="field-inline2">${fieldRow('Cota inicio, pelo de agua (m)','tb_i',100)}${fieldRow('Cota final, pelo de agua (m)','tb_t',99.2)}</div>
    ${fieldRow('Longitud de la tubería (m)','tb_f',40)}
    <div class="field-inline2">${fieldRow('Diámetro interior (m)','tb_d',0.3)}${fieldRow('Espesor del tubo (m)','tb_e',0.03)}</div>
    <h3 style="margin-top:14px;">Nivel instalado sobre un PR</h3>
    <div class="field-inline2">${fieldRow('Cota del PR (m)','tb_x',100)}${fieldRow('Lectura atrás al PR (m)','tb_a',1.45)}</div>
  </div>
  <div class="field-row"><label>Número de puntos</label>
    <div class="n-stepper"><button type="button" id="tbMinus">−</button><span class="n-val" id="tbNVal">${tbN}</span><button type="button" id="tbPlus">+</button></div>
  </div>
  <div id="tbPoints"></div>
  <button class="btn" id="btnTB" type="button">Calcular</button>
  <div id="resTB"></div>`;
  toolShell('instalarTuberia','Instalación de tuberías con nivel: con las cotas del pelo de agua, el diámetro y el espesor entrega la pendiente, la cota de la clave y la lectura teórica de mira en cada distancia parcial; si ingresas la lectura real, indica cuánto bajar o subir el tubo.', body);
  const draw=()=>{
    const prev=[]; for(let i=0;i<tbN;i++){ const q=document.getElementById('tb_q_'+i), y=document.getElementById('tb_y_'+i); prev.push(q?[q.value,y.value]:null); }
    let html=''; for(let i=0;i<tbN;i++){ const pv=prev[i]; html += `<div class="field-inline2">${fieldRow(`Distancia parcial P${i+1} (m)`,'tb_q_'+i,pv?pv[0]:10*(i+1))}${fieldRow('Lectura real en el tubo (opcional)','tb_y_'+i,pv?pv[1]:(i<2?[1.20,1.40][i]:''))}</div>`; }
    document.getElementById('tbPoints').innerHTML=html;
  };
  draw();
  document.getElementById('tbMinus').addEventListener('click',()=>{ if(tbN>1){ tbN--; document.getElementById('tbNVal').textContent=tbN; draw(); }});
  document.getElementById('tbPlus').addEventListener('click',()=>{ if(tbN<30){ tbN++; document.getElementById('tbNVal').textContent=tbN; draw(); }});
  document.getElementById('btnTB').addEventListener('click',()=>{
    const box=document.getElementById('resTB');
    const p={I:val('tb_i'),T:val('tb_t'),F:val('tb_f'),D:val('tb_d'),E:val('tb_e')}, X=val('tb_x'), A=val('tb_a');
    if([...Object.values(p),X,A].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los datos de la tubería y del nivel.</p>`; return; }
    if(!(p.F>0)){ box.innerHTML=`<p class="err-msg">La longitud debe ser mayor que cero.</p>`; return; }
    if(p.D<0||p.E<0){ box.innerHTML=`<p class="err-msg">Diámetro y espesor no pueden ser negativos.</p>`; return; }
    const qs=[], res=[];
    for(let i=0;i<tbN;i++){ const q=val('tb_q_'+i), y=val('tb_y_'+i); if(isNaN(q)){ box.innerHTML=`<p class="err-msg">Completa la distancia parcial de todos los puntos.</p>`; return; } qs.push({q,y}); res.push(calcInstalarTuberia(p.I,p.T,p.F,p.D,p.E,X,A,q,y)); }
    const base=res[0];
    let trs=''; res.forEach((r,i)=>{ trs += `<tr><td>${fmtNum(qs[i].q,3)}</td><td>${fmtNum(r.inv,3)}</td><td>${fmtNum(r.clave,3)}</td><td>${fmtNum(r.lect,3)}</td><td>${r.G!==undefined?fmtNum(qs[i].y,3):'—'}</td><td>${r.G!==undefined?(r.accion==='Correcto'?'Correcto':r.accion+' '+fmtNum(r.mov,3)):'—'}</td></tr>`; });
    box.innerHTML=`<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Pendiente calculada</span><span class="v accent big">${fmtNum(base.pend*100,4)} %</span></div>
      <div class="result-row"><span class="k">Pendiente (m/m)</span><span class="v">${fmtNum(base.pend,5)}</span></div>
      <div class="result-row"><span class="k">Altura instrumental</span><span class="v">${fmtNum(base.hi,3)} m</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Dist. parcial</th><th>Cota pelo agua</th><th>Cota clave</th><th>Lect. teórica clave</th><th>Lect. real</th><th>Acción</th></tr></thead><tbody>${trs}</tbody></table></div>
      ${tbN>1?`<div class="field-row"><label for="tbSel">Perfil del punto</label><select id="tbSel">${qs.map((o,i)=>`<option value="${i}">P${i+1} · ${fmtNum(o.q,2)} m</option>`).join('')}</select></div>`:''}
      <div class="plot-wrap" id="tbPlot">${svgInstalarTuberia(Object.assign({pend:base.pend},p),res[0],qs[0].q,qs[0].y)}</div></div>`;
    const sel=document.getElementById('tbSel');
    if(sel) sel.addEventListener('change',()=>{ const i=+sel.value; document.getElementById('tbPlot').innerHTML=svgInstalarTuberia(Object.assign({pend:base.pend},p),res[i],qs[i].q,qs[i].y); });
  });
}

const RENDERERS = { instalarTuberia: renderInstalarTuberia };
