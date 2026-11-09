"use strict";
/* Herramienta «Libreta de Nivel: Lecturas y Cotas»: con un instrumento de nivel instalado (cota del PR + lectura atrás =
   altura instrumental) calcula cotas a partir de lecturas, lecturas de mira para replantear una cota, y lecturas sobre una
   rasante con pendiente. Reúne los programas LIBRETA, NIVELACI, NIVLACIO, COTAS y N~MOV~TI de la calculadora Casio
   fx-9860GII con los mismos datos de entrada y de salida. */
let lcN = 4;

const lcHI      = (cotaPR,lecAtras) => cotaPR + lecAtras;                         // altura instrumental
const lcCota    = (hi,lectura) => hi - lectura;                                   // cota del terreno en la mira
const lcLectura = (hi,cota,m) => (hi - cota) - (m||0);                            // lectura de mira para una cota (m: relleno + / corte −)
const lcCotaPend= (cotaIni,pendPct,dist) => (pendPct*dist)/100 + cotaIni;          // cota de la rasante a una distancia
/* Corte (+) / relleno (−) de un punto: cota del terreno − cota de proyecto. */
const lcCorte   = (cotaTerreno,cotaProy) => cotaTerreno - cotaProy;

/* Esquema: altura instrumental y mira en cada punto. pts = [{x,rot,cota,lect}] con el PR primero. */
function svgLecturasCotas(hi,pts,xTit){
  const K=svgKit(), f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  const fila=(p,i)=>({k:p.rot,c:i?CZ:CD,v:`Cota ${fmtNum(p.cota,3)} · Lect ${fmtNum(p.lect,3)}`});
  K.list([[{k:'Alt. instrumental',c:CP,v:`${fmtNum(hi,3)} m`}], pts.slice(0,9).map(fila)]);
  const top=Math.max(44,K.listBottom+12);
  const xs=pts.map(p=>p.x), mn=Math.min(...xs), mx=Math.max(...xs), span=Math.max(mx-mn,1e-9);
  const cs=pts.map(p=>p.cota).concat([hi]), cmn=Math.min(...cs), cmx=Math.max(...cs), cs_=Math.max(cmx-cmn,1e-9);
  // eje vertical con escala propia (exagerada) para que se lean las diferencias de cota
  const X=x=>40+((x-mn)/span)*(pts.length>1?240:0)+(pts.length>1?0:120), Y=c=>162-((c-cmn)/cs_)*(162-top-12);
  K.line(22,Y(hi),298,Y(hi),CP,{dash:'3 2',sw:0.8});
  K.txt('Alt. instr.',3.8,CP,{x:297,y:Y(hi)+5,anchor:'end'});
  K.poly(pts.map(p=>[X(p.x),Y(p.cota)]),{stroke:CS,sw:0.7,dash:'1.5 1.5'});
  pts.forEach((p,i)=>{
    const col=i?CZ:CD, x=X(p.x), yb=Y(p.cota), yt=Y(hi);
    K.line(x,yb,x,yt,col,{sw:1.1});
    K.dot(x,yb,col,2.2);
    K.put(fmtNum(p.lect,3),3.8,col,[{x:x+2.6,y:(yb+yt)/2,anchor:'start',pen:0},{x:x-2.6,y:(yb+yt)/2,anchor:'end',pen:1}]);
    K.put(fmtNum(p.cota,3),3.8,CK,[{x:x,y:yb+6.2,anchor:'middle',pen:0},{x:x,y:yb-3,anchor:'middle',pen:3}]);
    K.put(p.rot,4,col,[{x:x,y:yt-2.2,anchor:'middle',pen:0}]);
  });
  K.txt(xTit||'',3.6,CS,{x:292,y:176,anchor:'end'});
  return K.svg();
}

function renderLecturasCotas(){
  const body = `<div class="field-card">
    <h3>Instrumento en estación</h3>
    <div class="field-inline2">${fieldRow('Cota del PR (m)','lc_pr',100)}${fieldRow('Lectura atrás al PR (m)','lc_la',1.532)}</div>
    <div class="field-row"><label for="lc_modo">¿Qué quieres calcular?</label>
      <select id="lc_modo">
        <option value="1">Cotas a partir de lecturas (levantar)</option>
        <option value="2">Lecturas de mira para replantear una cota</option>
        <option value="3">Lecturas sobre una rasante con pendiente</option>
      </select></div>
    <div id="lcExtra"></div>
  </div>
  <div class="field-row"><label>Número de puntos</label>
    <div class="n-stepper"><button type="button" id="lcMinus">−</button><span class="n-val" id="lcNVal">${lcN}</span><button type="button" id="lcPlus">+</button></div>
  </div>
  <div id="lcPoints"></div>
  <button class="btn" id="btnLC" type="button">Calcular</button>
  <div id="resLC"></div>`;
  toolShell('lecturasCotas','Libreta de nivel: con la cota del punto de referencia y la lectura atrás obtiene la altura instrumental; luego calcula cotas a partir de lecturas, lecturas de mira para replantear cotas (con corte o relleno) o lecturas sobre una rasante con pendiente.', body);
  const modo=()=>document.getElementById('lc_modo').value;
  const drawExtra=()=>{
    const m=modo(), el=document.getElementById('lcExtra');
    el.innerHTML = m==='2' ? fieldRow('Relleno (+) / corte (−) a aplicar al terreno (m)','lc_m',0)
      : m==='3' ? `<div class="field-inline2">${fieldRow('Cota de inicio (m)','lc_ci',100)}${fieldRow('Pendiente (%, + sube)','lc_pe',-2)}</div>${fieldRow('Distancia total (m, opcional)','lc_dt',120)}`
      : '';
  };
  const draw=(reset)=>{
    const m=modo(), prev=[]; for(let i=0;i<lcN;i++){ const a=document.getElementById('lc_a_'+i), b=document.getElementById('lc_b_'+i); prev.push(a&&!reset?[a.value,b?b.value:'']:null); }
    let html='';
    for(let i=0;i<lcN;i++){
      const pv=prev[i]||[null,null];
      if(m==='1') html += `<div class="field-inline2">${fieldRow(`Lectura a mira P${i+1} (m)`,'lc_a_'+i,pv[0]!==null?pv[0]:[1.234,0.876,1.905,2.310,0.540,1.120][i%6])}${fieldRow('Cota de proyecto (opcional)','lc_b_'+i,pv[1]!==null?pv[1]:'')}</div>`;
      else if(m==='2') html += fieldRow(`Cota del punto P${i+1} (m)`,'lc_a_'+i,pv[0]!==null?pv[0]:(99+i*0.5));
      else html += fieldRow(`Distancia desde el inicio P${i+1} (m)`,'lc_a_'+i,pv[0]!==null?pv[0]:(20*(i+1)));
    }
    document.getElementById('lcPoints').innerHTML=html;
  };
  drawExtra(); draw();
  document.getElementById('lc_modo').addEventListener('change',()=>{ drawExtra(); draw(true); document.getElementById('resLC').innerHTML=''; });
  document.getElementById('lcMinus').addEventListener('click',()=>{ if(lcN>1){ lcN--; document.getElementById('lcNVal').textContent=lcN; draw(); }});
  document.getElementById('lcPlus').addEventListener('click',()=>{ if(lcN<30){ lcN++; document.getElementById('lcNVal').textContent=lcN; draw(); }});
  document.getElementById('btnLC').addEventListener('click',()=>{
    const box=document.getElementById('resLC'), m=modo();
    const pr=val('lc_pr'), la=val('lc_la');
    if(isNaN(pr)||isNaN(la)){ box.innerHTML=`<p class="err-msg">Completa la cota del PR y la lectura atrás.</p>`; return; }
    const hi=lcHI(pr,la);
    let head=`<div class="result-row"><span class="k">Altura instrumental</span><span class="v accent big">${fmtNum(hi,3)} m</span></div>`, trs='', th='', pts=[{x:0,rot:'PR',cota:pr,lect:la}], xTit='';
    const dato=i=>val('lc_a_'+i);
    for(let i=0;i<lcN;i++) if(isNaN(dato(i))){ box.innerHTML=`<p class="err-msg">Completa el dato de todos los puntos.</p>`; return; }
    if(m==='1'){
      th='<th>Punto</th><th>Lectura</th><th>Cota terreno</th><th>Cota proyecto</th><th>Corte (+) / Relleno (−)</th>';
      for(let i=0;i<lcN;i++){
        const L=dato(i), c=lcCota(hi,L), pb=val('lc_b_'+i), hay=!isNaN(pb), dif=hay?lcCorte(c,pb):NaN;
        trs += `<tr><td>P${i+1}</td><td>${fmtNum(L,3)}</td><td>${fmtNum(c,3)}</td><td>${hay?fmtNum(pb,3):'—'}</td><td>${hay?fmtNum(dif,3)+(dif>0?' corte':(dif<0?' relleno':'')):'—'}</td></tr>`;
        pts.push({x:i+1,rot:'P'+(i+1),cota:c,lect:L});
      }
      xTit='Cotas a partir de lecturas';
    } else if(m==='2'){
      const M=val('lc_m'); if(isNaN(M)){ box.innerHTML=`<p class="err-msg">Completa el corte o relleno (0 si no aplica).</p>`; return; }
      th='<th>Punto</th><th>Cota</th><th>Cota a replantear</th><th>Lectura de mira</th>';
      for(let i=0;i<lcN;i++){
        const N=dato(i), L=lcLectura(hi,N,M);
        trs += `<tr><td>P${i+1}</td><td>${fmtNum(N,3)}</td><td>${fmtNum(N+M,3)}</td><td>${fmtNum(L,3)}</td></tr>`;
        pts.push({x:i+1,rot:'P'+(i+1),cota:N+M,lect:L});
      }
      xTit='Lecturas para replantear';
    } else {
      const ci=val('lc_ci'), pe=val('lc_pe'), dt=val('lc_dt');
      if(isNaN(ci)||isNaN(pe)){ box.innerHTML=`<p class="err-msg">Completa la cota de inicio y la pendiente.</p>`; return; }
      if(!isNaN(dt)) head += `<div class="result-row"><span class="k">Cota final (a ${fmtNum(dt,2)} m)</span><span class="v">${fmtNum(lcCotaPend(ci,pe,dt),3)} m</span></div>`;
      th='<th>Punto</th><th>Dist. desde inicio</th><th>Cota calculada</th><th>Lectura de mira</th>';
      for(let i=0;i<lcN;i++){
        const d=dato(i), c=lcCotaPend(ci,pe,d), L=hi-c;
        trs += `<tr><td>P${i+1}</td><td>${fmtNum(d,3)}</td><td>${fmtNum(c,3)}</td><td>${fmtNum(L,3)}</td></tr>`;
        pts.push({x:d,rot:'P'+(i+1),cota:c,lect:L});
      }
      pts[0].x = Math.min(0,...pts.slice(1).map(p=>p.x))-1;   // el PR se dibuja a la izquierda
      xTit='Rasante con pendiente';
    }
    box.innerHTML=`<div class="results" style="margin-top:12px;">${head}
      <div class="table-wrap"><table class="data-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgLecturasCotas(hi,pts,xTit)}</div></div>`;
  });
}

const RENDERERS = { lecturasCotas: renderLecturasCotas };
