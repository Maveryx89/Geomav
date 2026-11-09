"use strict";
/* Herramienta «Bombeo de Calzada»: cota del eje y de los bordes izquierdo y derecho de una calzada con bombeo, en cada
   progresiva, y las lecturas de mira correspondientes. Mismos datos de entrada y de salida que el programa BOMBEO de la
   calculadora Casio fx-9860GII. */
let bzN = 3;

/* vista: lectura atrás al BM; cotaBM; bI, bD: % de bombeo izq./der.; aI, aD: ancho de vía izq./der. desde el eje;
   cotaA, cotaB: cotas del eje en el inicio y en el fin del tramo; distT: longitud del tramo; prog: progresiva (m desde A). */
function calcBombeo(vista,cotaBM,bI,bD,aI,aD,cotaA,cotaB,distT,prog){
  const hi=cotaBM+vista;
  const eje=cotaA+((cotaB-cotaA)/distT)*prog;
  const izq=eje-(bI*aI)/100, der=eje-(bD*aD)/100;
  return {hi,izq,eje,der,lIzq:hi-izq,lEje:hi-eje,lDer:hi-der};
}

function svgBombeo(p,r,prog){
  const K=svgKit(), f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  K.list([[{k:'Progresiva',c:CK,v:`${fmtNum(prog,3)} m`},{k:'Alt. instr.',c:CP,v:`${fmtNum(r.hi,3)} m`}],
          [{k:'Cota izq.',c:CD,v:fmtNum(r.izq,3)},{k:'Cota eje',c:CZ,v:fmtNum(r.eje,3)},{k:'Cota der.',c:CD,v:fmtNum(r.der,3)}],
          [{k:'Lect. izq.',c:CD,v:fmtNum(r.lIzq,3)},{k:'Lect. eje',c:CZ,v:fmtNum(r.lEje,3)},{k:'Lect. der.',c:CD,v:fmtNum(r.lDer,3)}]]);
  const W=p.aI+p.aD, x0=60, x1=260, sx=(x1-x0)/Math.max(W,1e-9), xe=x0+p.aI*sx;
  const yb=150, hmax=Math.max(r.eje-Math.min(r.izq,r.der),1e-9), ex=Math.min(24/hmax,2000), H=v=>yb-(v-Math.min(r.izq,r.der))*ex;
  const L={x:x0,y:H(r.izq)}, E={x:xe,y:H(r.eje)}, D={x:x1,y:H(r.der)};
  const rod=Math.max(44,K.listBottom+10), yt=Math.min(L.y,E.y,D.y)-36;
  K.line(22,yt,298,yt,CP,{dash:'3 2'}); K.txt('Alt. instr.',3.8,CP,{x:297,y:yt-2,anchor:'end'});
  [[L,CD,'izq.',r.izq,r.lIzq],[E,CZ,'eje',r.eje,r.lEje],[D,CD,'der.',r.der,r.lDer]].forEach(([P,col,nom,cota,lec])=>{
    K.line(P.x,P.y,P.x,yt,col,{sw:1.1}); K.dot(P.x,P.y,col,2.3);
    K.put(`L ${fmtNum(lec,3)}`,3.9,col,[{x:P.x+2.6,y:(P.y+yt)/2,anchor:'start',pen:0},{x:P.x-2.6,y:(P.y+yt)/2,anchor:'end',pen:1}]);
    K.put(`${nom} ${fmtNum(cota,3)}`,3.9,CK,[{x:P.x,y:P.y+7,anchor:'middle',pen:0}]);
  });
  K.poly([[L.x,L.y],[E.x,E.y],[D.x,D.y]],{stroke:CK,sw:1.1});
  K.put(`${fmtNum(p.bI,2)} %`,3.8,CS,[{x:(L.x+E.x)/2,y:Math.min(L.y,E.y)-3,anchor:'middle',pen:0}]);
  K.put(`${fmtNum(p.bD,2)} %`,3.8,CS,[{x:(E.x+D.x)/2,y:Math.min(E.y,D.y)-3,anchor:'middle',pen:0}]);
  K.txt('Esquema con exageración vertical',3.6,CS,{x:292,y:177,anchor:'end'});
  return K.svg();
}

function renderBombeoSeccion(){
  const body = `<div class="field-card">
    <h3>Nivel instalado sobre un BM</h3>
    <div class="field-inline2">${fieldRow('Vista (lectura) al BM (m)','bz_vi',1.482)}${fieldRow('Cota del BM (m)','bz_cbm',100)}</div>
    <h3 style="margin-top:14px;">Bombeo</h3>
    <div class="field-inline2">${fieldRow('% de bombeo izquierdo','bz_bi',2)}${fieldRow('% de bombeo derecho','bz_bd',2)}</div>
    <div class="field-inline2">${fieldRow('Ancho vía izq. desde el eje (m)','bz_ai',3.5)}${fieldRow('Ancho vía der. desde el eje (m)','bz_ad',3.5)}</div>
    <h3 style="margin-top:14px;">Eje longitudinal</h3>
    <div class="field-inline2">${fieldRow('Cota del eje en A (m)','bz_ca',99.2)}${fieldRow('Cota del eje en B (m)','bz_cb',99.8)}</div>
    ${fieldRow('Distancia total A–B (m)','bz_dt',60)}
  </div>
  <div class="field-row"><label>Número de progresivas</label>
    <div class="n-stepper"><button type="button" id="bzMinus">−</button><span class="n-val" id="bzNVal">${bzN}</span><button type="button" id="bzPlus">+</button></div>
  </div>
  <div id="bzPoints"></div>
  <button class="btn" id="btnBZ" type="button">Calcular</button>
  <div id="resBZ"></div>`;
  toolShell('bombeoSeccion','Calzada con bombeo: para cada progresiva del eje entre dos cotas conocidas calcula la cota del eje y de los bordes izquierdo y derecho, y las lecturas de mira para replantearlos desde un nivel instalado sobre un BM.', body);
  const draw=()=>{
    const prev=[]; for(let i=0;i<bzN;i++){ const e=document.getElementById('bz_pg_'+i); prev.push(e?e.value:null); }
    let html=''; for(let i=0;i<bzN;i++) html += fieldRow(`Progresiva del eje P${i+1} (m desde A)`,'bz_pg_'+i,prev[i]!==null?prev[i]:10*(i+1));
    document.getElementById('bzPoints').innerHTML=html;
  };
  draw();
  document.getElementById('bzMinus').addEventListener('click',()=>{ if(bzN>1){ bzN--; document.getElementById('bzNVal').textContent=bzN; draw(); }});
  document.getElementById('bzPlus').addEventListener('click',()=>{ if(bzN<30){ bzN++; document.getElementById('bzNVal').textContent=bzN; draw(); }});
  document.getElementById('btnBZ').addEventListener('click',()=>{
    const box=document.getElementById('resBZ');
    const p={bI:val('bz_bi'),bD:val('bz_bd'),aI:val('bz_ai'),aD:val('bz_ad')};
    const vi=val('bz_vi'),cbm=val('bz_cbm'),ca=val('bz_ca'),cb=val('bz_cb'),dt=val('bz_dt');
    if([vi,cbm,ca,cb,dt,...Object.values(p)].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los datos.</p>`; return; }
    if(!(dt>0)){ box.innerHTML=`<p class="err-msg">La distancia total A–B debe ser mayor que cero.</p>`; return; }
    if(p.aI<0||p.aD<0){ box.innerHTML=`<p class="err-msg">Los anchos de vía no pueden ser negativos.</p>`; return; }
    const res=[], pg=[];
    for(let i=0;i<bzN;i++){ const g=val('bz_pg_'+i); if(isNaN(g)){ box.innerHTML=`<p class="err-msg">Completa todas las progresivas.</p>`; return; } pg.push(g); res.push(calcBombeo(vi,cbm,p.bI,p.bD,p.aI,p.aD,ca,cb,dt,g)); }
    let trs=''; res.forEach((r,i)=>{ trs += `<tr><td>${fmtNum(pg[i],3)}</td><td>${fmtNum(r.izq,3)}</td><td>${fmtNum(r.eje,3)}</td><td>${fmtNum(r.der,3)}</td><td>${fmtNum(r.lIzq,3)}</td><td>${fmtNum(r.lEje,3)}</td><td>${fmtNum(r.lDer,3)}</td></tr>`; });
    box.innerHTML=`<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Altura instrumental</span><span class="v accent big">${fmtNum(res[0].hi,3)} m</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Prog.</th><th>Cota izq.</th><th>Cota eje</th><th>Cota der.</th><th>Lect. izq.</th><th>Lect. eje</th><th>Lect. der.</th></tr></thead><tbody>${trs}</tbody></table></div>
      ${bzN>1?`<div class="field-row"><label for="bzSel">Sección transversal de la progresiva</label><select id="bzSel">${pg.map((g,i)=>`<option value="${i}">${fmtNum(g,3)} m</option>`).join('')}</select></div>`:''}
      <div class="plot-wrap" id="bzPlot">${svgBombeo(p,res[0],pg[0])}</div></div>`;
    const sel=document.getElementById('bzSel');
    if(sel) sel.addEventListener('change',()=>{ const i=+sel.value; document.getElementById('bzPlot').innerHTML=svgBombeo(p,res[i],pg[i]); });
  });
}

const RENDERERS = { bombeoSeccion: renderBombeoSeccion };
