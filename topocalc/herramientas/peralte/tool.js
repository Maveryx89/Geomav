"use strict";
/* Herramienta «Peralte en Vías»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcPeralte(V, R, e){
  const total = (V*V)/(127*R);
  const f = total - e/100;
  return {total, f, fPct: f*100};
}
function calcPeralteBordes(ePct, anchoPista){
  return { cotaExt: anchoPista*(ePct/100), cotaInt: -anchoPista*(ePct/100) };
}
function calcReplanteoPeralte(ePct, Lt, paso, anchoPista){
  const rows = [];
  let d = 0;
  while(d < Lt - 1e-9){
    const frac = d/Lt;
    const ei = ePct*frac;
    rows.push({d, ei, cotaExt: anchoPista*(ei/100), cotaInt: -anchoPista*(ei/100)});
    d += paso;
  }
  rows.push({d:Lt, ei:ePct, cotaExt: anchoPista*(ePct/100), cotaInt: -anchoPista*(ePct/100)});
  return rows;
}
function svgPeralteSeccion(ePct, anchoPista, cotaExt, cotaInt){
  const K=svgKit(), sg=v=>`${v>=0?'+':''}${fmtNum(v===0?0:v,3)} m`;
  K.list([[{k:'e',c:'var(--accent)',v:`${fmtNum(ePct,2)} %`},{k:'Ancho',c:'var(--blueprint)',v:`${fmtNum(anchoPista,2)} m`},{k:'Ext',c:'var(--success)',v:sg(cotaExt)},{k:'Int',c:'var(--danger)',v:sg(cotaInt)}]]);
  const dir=ePct>=0?1:-1, ang=(ePct===0?0:Math.min(Math.max(Math.abs(ePct)*4,3),60))*Math.PI/180, halfW=106;
  const yEje=Math.max(K.listBottom+44,108), xEje=160;
  const rise=Math.min(halfW*Math.tan(ang), Math.min(yEje-K.listBottom-8,176-yEje-14));
  const EXT=[xEje+halfW,yEje-dir*rise], INT=[xEje-halfW,yEje+dir*rise], EJE=[xEje,yEje];
  K.line(xEje-halfW-10,yEje,xEje+halfW+10,yEje,'var(--ink-soft)',{dash:'1.6 1.6',sw:0.6});
  K.line(...INT,...EJE,'var(--blueprint)',{sw:1.6}); K.line(...EJE,...EXT,'var(--blueprint)',{sw:1.6});
  K.line(EXT[0],yEje,...EXT,'var(--success)',{sw:0.8}); K.line(INT[0],yEje,...INT,'var(--danger)',{sw:0.8});
  const ra=Math.min(34,halfW*0.35), a0=0, a1=-dir*ang*180/Math.PI;
  K.arc(xEje,yEje,ra,a0,a1,'var(--accent)',{sw:1});
  [EJE,EXT,INT].forEach(q=>K.dot(q[0],q[1],'var(--ink-soft)',2));
  K.pointLabel('Eje',EJE[0],EJE[1],4.5,'var(--ink-soft)',{dir:[0,dir>0?1:-1],omit:false});
  K.pointLabel('Ext',EXT[0],EXT[1],4.5,'var(--success)',{dir:[0.4,-dir],omit:false});
  K.pointLabel('Int',INT[0],INT[1],4.5,'var(--danger)',{dir:[-0.4,dir],omit:false});
  K.lineLabel(...EJE,...EXT,'Ancho',4.5,'var(--blueprint)',{out:[0,-dir],extras:[0,3,6]});
  K.lineLabel(...INT,...EJE,'Ancho',4.5,'var(--blueprint)',{out:[0,dir],extras:[0,3,6]});
  const am=a1/2*Math.PI/180; if(ePct!==0) K.pointLabel('e',xEje+ra*Math.cos(am),yEje+ra*Math.sin(am),4.5,'var(--accent)',{dir:[Math.cos(am),Math.sin(am)],rmin:2,rmax:9});
  K.txt('(inclinación exagerada, sección esquemática)',3,'var(--ink-soft)',{x:160,y:184,anchor:'middle'});
  return K.svg();
}
function renderPeralte(){
  const body = `<div class="field-card">
    <h3>Datos de diseño</h3>
    ${fieldRow('Velocidad de diseño V (km/h)','pe_v',20)}
    ${fieldRow('Radio de la curva R (m)','pe_r',20)}
    ${fieldRow('Peralte deseado e (%)','pe_e',6)}
    ${fieldRow('Ancho de pista por lado, eje→borde (m)','pe_ancho',3.5)}
    <h3 style="margin-top:14px;">Replanteo del desarrollo del peralte (opcional)</h3>
    ${fieldRow('Longitud de transición Lt (m)','pe_lt','')}
    ${fieldRow('Paso de replanteo (m)','pe_paso',5)}
    <button class="btn" id="btnPE" type="button">Calcular</button>
    <div id="resPE"></div>
  </div>`;
  toolShell('peralte','Fricción lateral necesaria para un peralte y radio dados a la velocidad de diseño (e + f = V²/127R), cota de ambos bordes de la calzada respecto al eje, y tabla de replanteo del desarrollo del peralte a lo largo de la longitud de transición.', body, ['V','R','e','f']);
  document.getElementById('btnPE').addEventListener('click', ()=>{
    const V=val('pe_v'), R=val('pe_r'), e=val('pe_e'), ancho=val('pe_ancho');
    const box=document.getElementById('resPE');
    if([V,R,e,ancho].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa velocidad, radio, peralte y ancho de pista.</p>`; return; }
    const r = calcPeralte(V,R,e);
    const okF = r.f>=0 && r.f<=0.16;
    const bordes = calcPeralteBordes(e,ancho);
    const clean0 = v => v===0 ? 0 : v;

    const Lt = val('pe_lt'), paso = val('pe_paso');
    let tablaHtml = '';
    if(!isNaN(Lt) && Lt>0){
      if(isNaN(paso) || paso<=0){
        tablaHtml = `<p class="err-msg">Ingresa un paso de replanteo mayor que 0.</p>`;
      } else {
        const rows = calcReplanteoPeralte(e, Lt, paso, ancho);
        const trs = rows.map(row=>`<tr><td>${fmtNum(row.d,2)}</td><td>${fmtNum(row.ei,2)}</td><td>${clean0(row.cotaExt)>=0?'+':''}${fmtNum(clean0(row.cotaExt),3)}</td><td>${clean0(row.cotaInt)>=0?'+':''}${fmtNum(clean0(row.cotaInt),3)}</td></tr>`).join('');
        tablaHtml = `<div class="section-label" style="margin-top:10px;">Replanteo cada ${fmtNum(paso,2)} m (Lt=${fmtNum(Lt,2)} m)</div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Distancia</th><th>e parcial (%)</th><th>Borde ext. (m)</th><th>Borde int. (m)</th></tr></thead><tbody>${trs}</tbody></table></div>`;
      }
    }

    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">e + f (total requerido)</span><span class="v">${fmtNum(r.total,4)}</span></div>
      <div class="result-row"><span class="k">Fricción lateral necesaria (f)</span><span class="v accent big">${fmtNum(r.f,4)}</span></div>
      <div class="result-row"><span class="k">Estado</span><span class="v"><span class="pill ${okF?'ok':'bad'}"><span class="dot"></span>${okF?'f dentro de rango típico (≤0.16)':'f fuera de rango típico'}</span></span></div>
      <div class="result-row"><span class="k">Cota borde exterior (resp. al eje)</span><span class="v">${clean0(bordes.cotaExt)>=0?'+':''}${fmtNum(clean0(bordes.cotaExt),3)} m</span></div>
      <div class="result-row"><span class="k">Cota borde interior (resp. al eje)</span><span class="v">${clean0(bordes.cotaInt)>=0?'+':''}${fmtNum(clean0(bordes.cotaInt),3)} m</span></div>
      <div class="plot-wrap">${svgPeralteSeccion(e,ancho,bordes.cotaExt,bordes.cotaInt)}</div>
      ${tablaHtml}
    </div>`;
  });
}

const RENDERERS = { peralte: renderPeralte };
