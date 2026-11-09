"use strict";
/* Herramienta «Chaflán desde Armada»: posición del pie del talud (chaflán) a partir de la cota del terreno
   y su azimut/distancia desde la armada. Mismos datos de entrada y de salida que el programa CHAFLANA de la
   calculadora Casio fx-9860GII (la constante de 5 m por terraza del programa se pide como dato, con 5 por defecto).
   Ángulos en grados decimales. */
let chN = 3;

/* Altura de corte/relleno C = |subrasante − terreno|; distancia horizontal eje→chaflán D = C·talud + terrazas·ancho + media banca. */
function calcChaflanArmada(vE,vN,eE,eN,z,azDeg,media,nTerr,anchoTerr,talud,cotaT){
  const C = Math.abs(z-cotaT);
  const D = C*talud + nTerr*anchoTerr + media;
  const E = eE + D*Math.sin(toRad(azDeg)), N = eN + D*Math.cos(toRad(azDeg));
  const dE=E-vE, dN=N-vN;
  return {altura:C, tipo:(cotaT>z?'Corte':(cotaT<z?'Relleno':'A nivel')), dist:D, E, N,
          azArm: normDeg(toDeg(Math.atan2(dE,dN))), distArm: Math.hypot(dE,dN)};
}

function svgChaflanArmada(vE,vN,eE,eN,res){
  const K=svgKit(), f=K.f;
  const CD='var(--blueprint)', CZ='var(--success)', CP='var(--accent)', CK='var(--ink)', CS='var(--ink-soft)';
  K.north();
  const n=res.length, r0=res[0];
  K.list([
    [{k:'Armada',c:CK,v:`${fmtNum(vE,2)} / ${fmtNum(vN,2)}`},{k:'Eje',c:CS,v:`${fmtNum(eE,2)} / ${fmtNum(eN,2)}`}],
    res.slice(0,8).map((r,i)=>({k:'P'+(i+1),c:CP,v:`${r.tipo} ${fmtNum(r.altura,2)} · D ${fmtNum(r.dist,2)} m`}))
  ]);
  const top=Math.max(44,K.listBottom+12);
  const all=[[vE,vN],[eE,eN]]; res.forEach(r=>all.push([r.E,r.N]));
  const fit=K.fit(all,{l:70,r:262,t:top,b:168});
  const V={x:fit.X(vE),y:fit.Y(vN)}, X0={x:fit.X(eE),y:fit.Y(eN)}, P=res.map(r=>({x:fit.X(r.E),y:fit.Y(r.N)}));
  const far=P.reduce((m,q)=>Math.hypot(q.x-X0.x,q.y-X0.y)>Math.hypot(m.x-X0.x,m.y-X0.y)?q:m,P[0]);
  K.line(X0.x,X0.y,far.x,far.y,CZ);                                   // línea del perfil desde el eje
  if(n<=4) P.forEach(q=>K.line(V.x,V.y,q.x,q.y,CD,{sw:0.6,op:0.6}));
  else K.line(V.x,V.y,P[0].x,P[0].y,CD,{sw:0.6,op:0.6});
  K.dot(V.x,V.y,CK,2.7); K.dot(X0.x,X0.y,CS,2); P.forEach(q=>K.dot(q.x,q.y,CP,2));
  const ux=far.x-X0.x, uy=far.y-X0.y, ul=Math.hypot(ux,uy)||1;
  K.pointLabel('Armada',V.x,V.y,4.5,CK,{full:true});
  K.pointLabel('Eje',X0.x,X0.y,4.5,CS,{dir:[-ux/ul,-uy/ul]});
  P.forEach((q,i)=>K.pointLabel('P'+(i+1),q.x,q.y,4.5,CP,{dir:[ux/ul,uy/ul]}));
  K.lineLabel(X0.x,X0.y,far.x,far.y,`D = ${fmtNum(res[P.indexOf(far)].dist,2)} m`,4,CZ,{out:[-uy/ul,ux/ul]});
  K.lineLabel(V.x,V.y,P[0].x,P[0].y,`${fmtNum(r0.distArm,2)} m`,4,CD,{});
  return K.svg();
}

function renderChaflanArmada(){
  const body = `<div class="field-card">
    <h3>Armada</h3>
    ${libretaBloqueHTML('ch_libV','Armada desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este armada','ch_vE',round(EJ_E0-10,2))}${fieldRow('Norte armada','ch_vN',round(EJ_N0-5,2))}</div>
    <h3 style="margin-top:14px;">Punto del eje (abscisa)</h3>
    ${libretaBloqueHTML('ch_libE','Punto del eje desde la Libreta')}
    <div class="field-inline2">${fieldRow('Este del eje','ch_eE',EJ_E0)}${fieldRow('Norte del eje','ch_eN',EJ_N0)}</div>
    ${fieldRow('Cota subrasante (m)','ch_z',100)}
    ${angleFieldHTML('ch_az', 90, 'Azimut del perfil (hacia el lado del chaflán)')}
    <h3 style="margin-top:14px;">Perfil</h3>
    ${fieldRow('Media banca (m)','ch_media',3.5)}
    <div class="field-inline2">${fieldRow('Nº de terrazas','ch_nt',0)}${fieldRow('Ancho de cada terraza (m)','ch_at',5)}</div>
    ${fieldRow('Talud (H/V)','ch_talud',1.5)}
  </div>
  <div class="field-row"><label>Número de cotas de terreno</label>
    <div class="n-stepper"><button type="button" id="chMinus">−</button><span class="n-val" id="chNVal">${chN}</span><button type="button" id="chPlus">+</button></div>
  </div>
  <div id="chPoints"></div>
  <button class="btn" id="btnCH" type="button">Calcular</button>
  <div id="resCH"></div>`;
  toolShell('chaflanArmada','Pie de talud (chaflán) para replanteo desde una armada: con la cota del terreno en el perfil, entrega la altura de corte o relleno, la distancia desde el eje, las coordenadas del chaflán y su azimut y distancia desde la armada.', body);
  const metas=[null,null];
  libretaTraerA('ch_libV','ch_vE','ch_vN', m=>{ metas[0]=m; });
  libretaTraerA('ch_libE','ch_eE','ch_eN', m=>{ metas[1]=m; });
  const defC=[103,105.5,98];
  const draw=()=>{
    const prev=[]; for(let i=0;i<chN;i++){ const q=document.getElementById('ch_q_'+i); prev.push(q?q.value:null); }
    let html=''; for(let i=0;i<chN;i++) html += `<div class="field-row"><label for="ch_q_${i}">Cota del terreno P${i+1} (m)</label><input type="number" step="any" id="ch_q_${i}" value="${prev[i]!==null?prev[i]:defC[i%3]+Math.floor(i/3)}"></div>`;
    document.getElementById('chPoints').innerHTML = html;
  };
  draw();
  document.getElementById('chMinus').addEventListener('click', ()=>{ if(chN>1){ chN--; document.getElementById('chNVal').textContent=chN; draw(); }});
  document.getElementById('chPlus').addEventListener('click', ()=>{ if(chN<20){ chN++; document.getElementById('chNVal').textContent=chN; draw(); }});
  document.getElementById('btnCH').addEventListener('click', ()=>{
    const vE=val('ch_vE'),vN=val('ch_vN'),eE=val('ch_eE'),eN=val('ch_eN'),z=val('ch_z'),az=readAngleField('ch_az');
    const media=val('ch_media'),nt=val('ch_nt'),at=val('ch_at'),talud=val('ch_talud');
    const box=document.getElementById('resCH');
    const inc=metasIncompatibles(metas); if(inc){ box.innerHTML=msgIncompatibles(inc); return; }
    if([vE,vN,eE,eN,z,az,media,nt,at,talud].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    if(talud<0||media<0||nt<0||at<0){ box.innerHTML=`<p class="err-msg">Talud, banca y terrazas no pueden ser negativos.</p>`; return; }
    const res=[];
    for(let i=0;i<chN;i++){
      const q=val('ch_q_'+i);
      if(isNaN(q)){ box.innerHTML=`<p class="err-msg">Completa la cota de todos los puntos.</p>`; return; }
      res.push(calcChaflanArmada(vE,vN,eE,eN,z,az,media,nt,at,talud,q));
    }
    let trs=''; res.forEach((r,i)=>{ trs += `<tr><td>P${i+1}</td><td>${r.tipo}</td><td>${fmtNum(r.altura,3)}</td><td>${fmtNum(r.dist,3)}</td><td>${fmtNum(r.E,3)}</td><td>${fmtNum(r.N,3)}</td><td>${fmtAngle(r.azArm)}</td><td>${fmtNum(r.distArm,3)}</td></tr>`; });
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Punto</th><th>Tipo</th><th>Altura</th><th>Dist. eje</th><th>Este</th><th>Norte</th><th>Az. armada</th><th>Dist. armada</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgChaflanArmada(vE,vN,eE,eN,res)}</div>
    </div>`;
    const csv=['nombre,este,norte,cota']; res.forEach((r,i)=>csv.push(`Chaflán ${i+1},${r.E},${r.N},`));
    addCSVButton(box,'chaflan-armada.csv',csv.join('\n'));
    const btn=document.createElement('button');
    btn.type='button'; btn.className='btn-sm'; btn.style.marginTop='8px'; btn.style.marginLeft='8px';
    btn.textContent='💾 Guardar chaflanes en la Libreta';
    btn.addEventListener('click', ()=>{
      const g='Chaflán '+fechaCorta();
      res.forEach((r,i)=>agregarPunto(`Chaflán ${i+1}`, r.E, r.N, null, '', Object.assign({}, metas[0]||metas[1]||{}, {grupo:g})));
      btn.textContent=`Guardado (${res.length} puntos) ✓`;
    });
    box.appendChild(btn);
  });
}

const RENDERERS = { chaflanArmada: renderChaflanArmada };
