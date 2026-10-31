"use strict";
/* Herramienta «Taludes en Cascada (Bancos)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcTaludBancosGeometry(glob, benches){
  const results = [];
  let x = Math.max(0, glob.halfWidth||0);
  let y = 0;
  benches.forEach(function(b, i){
    const V = (b.V && b.V>0) ? b.V : 1;
    const H = (b.H && b.H>=0) ? b.H : 0;
    const height = Math.max(0, b.height||0);
    const width = Math.max(0, b.width||0);
    const ratio = H / V;
    const run = height * ratio;
    const slopeLength = Math.sqrt(height*height + run*run);
    const toeX = x + run;
    const toeY = y + height;
    const crestX = toeX + width;
    const crestY = toeY;
    results.push({
      index:i, height:height, V:V, H:H, width:width, ratio:ratio, run:run, slopeLength:slopeLength,
      prevX:x, prevY:y, toeX:toeX, toeY:toeY, crestX:crestX, crestY:crestY,
      exceedsMax: (glob.maxHeight>0) && (height > glob.maxHeight)
    });
    x = crestX; y = crestY;
  });
  return results;
}
function svgTaludBancos(glob, geo){
  const K=svgKit(), hw=Math.max(0,glob.halfWidth||0), drop=Math.max(0,hw*(glob.crownPct||0)/100), last=geo[geo.length-1];
  const totH=last?last.crestY:0, totX=last?last.crestX:hw;
  const x0=-hw-0.9, x1=totX+0.9, ymin=-(drop+0.55), ymax=totH+0.6;
  const box={l:24,r:310,t:8,b:168}, sc=Math.min(50,(box.r-box.l)/Math.max(1,x1-x0),(box.b-box.t)/Math.max(1,ymax-ymin));
  const ox=(box.l+box.r)/2-(x0+x1)/2*sc, oy=(box.t+box.b)/2+(ymin+ymax)/2*sc, X=w=>ox+w*sc, Y=w=>oy-w*sc;
  const colH='var(--accent)', colD='var(--blueprint)', base=Y(ymin+0.15);
  // terreno (relleno), eje y plataforma
  const g=[[X(-hw),base],[X(-hw),Y(0)],[X(0),Y(drop)],[X(hw),Y(0)]]; geo.forEach(q=>{ g.push([X(q.toeX),Y(q.toeY)]); g.push([X(q.crestX),Y(q.crestY)]); });
  g.push([g[g.length-1][0],base]); K.poly(g,{close:true,fill:'var(--paper-sunken)',obs:false});
  K.line(X(0),Y(ymax-0.15),X(0),base,'var(--ink-soft)',{sw:0.7,dash:'1 3',noObs:false});
  K.poly([[X(-hw),Y(0)],[X(0),Y(drop)],[X(hw),Y(0)]],{stroke:'var(--ink)',sw:1.4});
  const prof=[[X(hw),Y(0)]]; geo.forEach(q=>{ prof.push([X(q.toeX),Y(q.toeY)]); prof.push([X(q.crestX),Y(q.crestY)]); });
  geo.forEach(q=>{ if(q.exceedsMax) K.line(X(q.prevX),Y(q.prevY),X(q.toeX),Y(q.toeY),'var(--danger)',{sw:3,op:0.85,noObs:false}); });
  K.poly(prof,{stroke:'var(--ink)',sw:1.5});
  // cotas H (izquierda), D (a la altura de cada cresta) y rótulos
  const hx=X(x0+0.3), many=geo.length>6;
  geo.forEach((q,i)=>{
    K.line(hx,Y(q.prevY),hx,Y(q.toeY),colH,{sw:0.8}); [q.prevY,q.toeY].forEach(y=>K.line(hx-1.6,Y(y),hx+1.6,Y(y),colH,{sw:0.7,noObs:false}));
    K.lineLabel(hx,Y(q.prevY),hx,Y(q.toeY),'H',4.5,colH,{out:[-1,0],extras:[0,3]});
    const dy=Y(q.crestY)-2.5; K.line(X(0),dy,X(q.toeX),dy,colD,{sw:0.8}); [0,q.toeX].forEach(x=>K.line(X(x),dy-1.6,X(x),dy+1.6,colD,{sw:0.7,noObs:false}));
    K.lineLabel(X(0),dy,X(q.toeX),dy,'D',4.5,colD,{out:[0,-1],extras:[0,3]});
    if(!many||i%2===0) K.lineLabel(X(q.prevX),Y(q.prevY),X(q.toeX),Y(q.toeY),'V:H',3.2,'var(--ink-soft)',{out:[-1,0],extras:[0,2,4]});
    K.pointLabel('B'+(i+1),(X(q.toeX)+X(q.crestX))/2,Y(q.crestY),3.6,'var(--ink)',{dir:[0,-1],rmin:3,rmax:9,omit:false});
  });
  // leyenda al pie
  K.eng.rectFill(box.l,176,box.l+160,188);
  K.add(`<text x="${box.l}" y="185" ${K.FONT} font-size="3.8"><tspan fill="${colH}">H</tspan><tspan fill="var(--ink-soft)"> altura   </tspan><tspan fill="${colD}">D</tspan><tspan fill="var(--ink-soft)"> dist. acum.   </tspan><tspan fill="var(--ink)">V:H</tspan><tspan fill="var(--ink-soft)"> talud</tspan></text>\n`);
  return K.svg();
}
let tbN = 3;
function renderTaludBancos(){
  const body = `<div class="field-card">
    <h3>Casos guardados</h3>
    ${fieldRow('Nombre del caso','tb_caseName','',{type:'text',placeholder:'Ej. Km 2+300 lado izquierdo'})}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
      <button type="button" class="btn-sm" id="tbSaveCase">💾 Guardar caso</button>
      <button type="button" class="btn-sm" id="tbExport">⬇ Exportar JSON</button>
      <button type="button" class="btn-sm" id="tbImport">⬆ Importar JSON</button>
    </div>
    <input type="file" id="tbFile" accept=".json,application/json" style="display:none">
    <span id="tbMsg" class="proj-msg"></span>
    <div id="tbCases" style="margin-top:6px;"></div>
  </div>
  <div class="field-card">
    <h3>Camino / plataforma</h3>
    <div class="field-inline2">
      ${fieldRow('Semiancho plataforma (m)','tb_halfWidth',2.5)}
      ${fieldRow('Pendiente corona (%)','tb_crownPct',3)}
    </div>
    <h3 style="margin-top:14px;">Talud por defecto (bancos nuevos)</h3>
    <div class="field-inline2">
      ${fieldRow('Talud V','tb_defV',3)}
      ${fieldRow('Talud H','tb_defH',2)}
    </div>
    ${fieldRow('Altura máxima recomendada por banco (m)','tb_maxHeight',5)}
  </div>
  <div class="field-card">
    <div class="field-row"><label>Número de bancos</label>
      <div class="n-stepper"><button type="button" id="tbMinus">−</button><span class="n-val" id="tbNVal">${tbN}</span><button type="button" id="tbPlus">+</button></div>
    </div>
    <div id="tbBenches"></div>
  </div>
  <button class="btn" id="btnTB" type="button">Calcular</button>
  <div id="resTB"></div>`;
  toolShell('taludBancos','Bancos escalonados (en cascada): distancias de seguridad al eje de camino, alturas acumuladas y sección transversal a escala. El Banco 1 es el más cercano al camino; cada banco siguiente se apila sobre el anterior.', body);

  const drawRaw = ()=>{
    let html='';
    for(let i=0;i<tbN;i++){
      html += `<div class="station-block">
        <div class="st-label">Banco ${i+1}</div>
        <div class="field-inline2">
          ${fieldRow('Altura (m)',`tb_h_${i}`, 5)}
          ${fieldRow('Berma / ancho de banco (m)',`tb_w_${i}`, 2)}
        </div>
        <div class="field-inline2">
          ${fieldRow('Talud V',`tb_rv_${i}`, val('tb_defV')||3)}
          ${fieldRow('Talud H',`tb_rh_${i}`, val('tb_defH')||2)}
        </div>
      </div>`;
    }
    document.getElementById('tbBenches').innerHTML = html;
  };

  /* --- Persistencia: se recuerdan los datos al volver, y se pueden guardar varios casos o pasarlos a otro equipo (JSON) --- */
  const TB_KEY='topocalc-taludbancos', TB_GIDS=['tb_halfWidth','tb_crownPct','tb_defV','tb_defH','tb_maxHeight'];
  const tbStoreGet = ()=>{ try{ const o=JSON.parse(localStorage.getItem(TB_KEY)||'{}'); return {actual:o.actual||null, casos:Array.isArray(o.casos)?o.casos:[]}; }catch(e){ return {actual:null,casos:[]}; } };
  const tbStoreSet = (o)=>{ try{ localStorage.setItem(TB_KEY, JSON.stringify(o)); }catch(e){} };
  const tbNum = (x)=>{ const n=parseFloat(x); return isFinite(n)?String(n):''; };
  const tbSnap = ()=>{
    const g={}; TB_GIDS.forEach(id=>{ g[id]=document.getElementById(id).value; });
    const b=[]; for(let i=0;i<tbN;i++){ const q=(id)=>{ const e=document.getElementById(id+'_'+i); return e?e.value:''; }; b.push({h:q('tb_h'),w:q('tb_w'),v:q('tb_rv'),hh:q('tb_rh')}); }
    return {g:g,b:b};
  };
  const tbClean = (d)=>{
    if(!d||typeof d!=='object'||!d.g||!Array.isArray(d.b)||!d.b.length) return null;
    const g={}; TB_GIDS.forEach(id=>{ g[id]=tbNum(d.g[id]); });
    const b=d.b.slice(0,12).map(x=>({h:tbNum(x&&x.h),w:tbNum(x&&x.w),v:tbNum(x&&x.v),hh:tbNum(x&&x.hh)}));
    return {g:g,b:b};
  };
  const tbPutBenches = (b)=>{ b.forEach((x,i)=>{ const set=(id,v)=>{ const e=document.getElementById(id+'_'+i); if(e&&v!==undefined&&v!==null&&v!=='') e.value=v; }; set('tb_h',x.h); set('tb_w',x.w); set('tb_rv',x.v); set('tb_rh',x.hh); }); };
  const draw = ()=>{ const prev=tbSnap().b; drawRaw(); tbPutBenches(prev); };   // al agregar/quitar bancos se conservan los valores ya escritos
  const tbApply = (d)=>{
    TB_GIDS.forEach(id=>{ const v=d.g[id]; if(v!==undefined&&v!==null&&v!=='') document.getElementById(id).value=v; });
    tbN=Math.max(1,Math.min(12,d.b.length)); document.getElementById('tbNVal').textContent=tbN;
    drawRaw(); tbPutBenches(d.b);
  };
  const tbSave = ()=>{ const st=tbStoreGet(); st.actual=tbSnap(); tbStoreSet(st); };
  const tbMsg = (t)=>{ document.getElementById('tbMsg').textContent=t; };
  const tbRenderCases = ()=>{
    const box=document.getElementById('tbCases'); box.textContent='';
    tbStoreGet().casos.forEach((c,idx)=>{
      const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid rgba(10,34,64,.12);flex-wrap:wrap;';
      const nm=document.createElement('span'); nm.style.cssText='flex:1 1 140px;font-weight:600;';
      nm.textContent=(c.nombre||'Sin nombre')+' · '+((c.datos&&c.datos.b&&c.datos.b.length)||0)+' bancos';
      const bl=document.createElement('button'); bl.type='button'; bl.className='btn-sm'; bl.textContent='Cargar';
      bl.addEventListener('click', ()=>{ const d=tbClean(c.datos); if(!d){ tbMsg('El caso guardado está dañado.'); return; } tbApply(d); tbSave(); document.getElementById('tb_caseName').value=c.nombre||''; document.getElementById('resTB').innerHTML=''; tbMsg('Caso cargado.'); });
      const bd=document.createElement('button'); bd.type='button'; bd.className='btn-sm'; bd.textContent='Eliminar';
      bd.addEventListener('click', ()=>{
        if(bd.dataset.ok!=='1'){ bd.dataset.ok='1'; bd.textContent='¿Seguro?'; setTimeout(()=>{ if(bd.isConnected){ bd.dataset.ok=''; bd.textContent='Eliminar'; } },3000); return; }
        const st=tbStoreGet(); st.casos.splice(idx,1); tbStoreSet(st); tbRenderCases(); tbMsg('Caso eliminado.');
      });
      row.appendChild(nm); row.appendChild(bl); row.appendChild(bd); box.appendChild(row);
    });
  };
  const tbAddCase = (nombre, datos)=>{
    const st=tbStoreGet(); const i=st.casos.findIndex(c=>c.nombre===nombre);
    if(i>=0) st.casos[i]={nombre:nombre,datos:datos}; else st.casos.push({nombre:nombre,datos:datos});
    if(st.casos.length>50) st.casos=st.casos.slice(-50);
    tbStoreSet(st);
  };

  const c0=tbClean(tbStoreGet().actual);
  if(c0) tbApply(c0); else draw();
  tbRenderCases();
  document.querySelector('.tool-view').addEventListener('input', tbSave);
  document.getElementById('tbMinus').addEventListener('click', ()=>{ if(tbN>1){tbN--; document.getElementById('tbNVal').textContent=tbN; draw(); tbSave();}});
  document.getElementById('tbPlus').addEventListener('click', ()=>{ if(tbN<12){tbN++; document.getElementById('tbNVal').textContent=tbN; draw(); tbSave();}});

  document.getElementById('tbSaveCase').addEventListener('click', ()=>{
    const inp=document.getElementById('tb_caseName');
    const nombre=(inp.value||'').trim().slice(0,80) || ('Caso '+(tbStoreGet().casos.length+1));
    inp.value=nombre; tbAddCase(nombre, tbClean(tbSnap())); tbSave(); tbRenderCases(); tbMsg('Caso guardado en este dispositivo.');
  });
  document.getElementById('tbExport').addEventListener('click', ()=>{
    const out={tipo:'topocalc-taludbancos', version:1, actual:tbSnap(), casos:tbStoreGet().casos};
    downloadTextFile('taludes_bancos_casos.json', JSON.stringify(out,null,2), 'application/json;charset=utf-8;');
    tbMsg('Archivo exportado.');
  });
  document.getElementById('tbImport').addEventListener('click', ()=> document.getElementById('tbFile').click());
  document.getElementById('tbFile').addEventListener('change', (ev)=>{
    const f=ev.target.files && ev.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{
      try{
        const o=JSON.parse(rd.result);
        if(!o||o.tipo!=='topocalc-taludbancos') throw new Error('tipo');
        let n=0;
        (Array.isArray(o.casos)?o.casos:[]).forEach(c=>{ const d=tbClean(c&&c.datos); if(d){ tbAddCase(String((c&&c.nombre)||'Caso importado').slice(0,80), d); n++; } });
        const a=tbClean(o.actual); if(a){ tbApply(a); tbSave(); document.getElementById('resTB').innerHTML=''; }
        tbRenderCases(); tbMsg('Importado: '+n+' caso(s)'+(a?' y datos actuales.':'.'));
      }catch(e){ tbMsg('El archivo no es válido para Taludes en Cascada.'); }
      ev.target.value='';
    };
    rd.onerror=()=>{ tbMsg('No se pudo leer el archivo.'); ev.target.value=''; };
    rd.readAsText(f);
  });

  document.getElementById('btnTB').addEventListener('click', ()=>{
    const box=document.getElementById('resTB');
    const glob = {
      halfWidth: val('tb_halfWidth'), crownPct: val('tb_crownPct'),
      defV: val('tb_defV'), defH: val('tb_defH'), maxHeight: val('tb_maxHeight')
    };
    if([glob.halfWidth,glob.crownPct,glob.defV,glob.defH,glob.maxHeight].some(isNaN)){
      box.innerHTML = `<p class="err-msg">Completa los datos de camino y talud por defecto.</p>`; return;
    }
    const benches = [];
    for(let i=0;i<tbN;i++){
      const height=val(`tb_h_${i}`), width=val(`tb_w_${i}`), V=val(`tb_rv_${i}`), H=val(`tb_rh_${i}`);
      if([height,width,V,H].some(isNaN)){ box.innerHTML = `<p class="err-msg">Completa todos los bancos.</p>`; return; }
      benches.push({height:height,width:width,V:V,H:H});
    }
    const geo = calcTaludBancosGeometry(glob, benches);
    const last = geo[geo.length-1];
    const totalHeight = last ? last.crestY : 0;
    const totalToe = last ? last.toeX : glob.halfWidth;
    const totalCrest = last ? last.crestX : glob.halfWidth;
    const warnCount = geo.filter(function(g){return g.exceedsMax;}).length;

    const trs = geo.map(function(g){
      return `<tr><td>Banco ${g.index+1}</td><td>${fmtNum(g.height,2)}${g.exceedsMax?' ⚠':''}</td><td>${fmtNum(g.V,1)} : ${fmtNum(g.H,1)}</td><td>${fmtNum(g.slopeLength,2)}</td><td>${fmtNum(g.crestY,2)}</td><td>${fmtNum(g.toeX,3)}</td><td>${fmtNum(g.crestX,3)}</td></tr>`;
    }).join('');

    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Estado</span><span class="v">${warnCount>0 ? `<span class="pill bad"><span class="dot"></span>${warnCount} banco(s) superan la altura máxima</span>` : `<span class="pill ok"><span class="dot"></span>Todos los bancos dentro de la altura máxima</span>`}</span></div>
      <div class="result-row"><span class="k">Altura total acumulada</span><span class="v accent big">${fmtNum(totalHeight,2)} m</span></div>
      <div class="result-row"><span class="k">Distancia a pie del último talud</span><span class="v">${fmtNum(totalToe,3)} m</span></div>
      <div class="result-row"><span class="k">Distancia a cresta del último banco</span><span class="v">${fmtNum(totalCrest,3)} m</span></div>
      <div class="table-wrap" style="margin-top:12px;"><table class="data-table"><thead><tr><th>Banco</th><th>Altura</th><th>Talud V:H</th><th>Long. talud</th><th>Cota acum.</th><th>Dist. a pie</th><th>Dist. a cresta</th></tr></thead><tbody>${trs}</tbody></table></div>
      <div class="plot-wrap">${svgTaludBancos(glob, geo)}</div>
      <details style="margin-top:12px;"><summary style="cursor:pointer;font-weight:600;">Fórmulas utilizadas</summary>
        <p style="margin:8px 0 0;font-size:.9rem;line-height:1.6;">Recorrido horizontal = altura × H / V<br>Longitud del talud = √(altura² + recorrido²)<br>Dist. a pie = dist. a cresta del banco anterior + recorrido (el primer banco parte del semiancho de la plataforma)<br>Dist. a cresta = dist. a pie + berma<br>Cota acumulada = suma de las alturas de los bancos<br>⚠ = altura del banco mayor que la máxima recomendada</p>
      </details>
    </div>`;
    const csvRows = ['banco,altura_m,talud_V,talud_H,long_talud_m,cota_acumulada_m,dist_pie_m,dist_cresta_m'];
    geo.forEach(function(g){ csvRows.push(`Banco ${g.index+1},${g.height},${g.V},${g.H},${round(g.slopeLength,3)},${round(g.crestY,3)},${round(g.toeX,3)},${round(g.crestX,3)}`); });
    addCSVButton(box, 'taludes_bancos.csv', csvRows.join('\n'));
  });
}

const RENDERERS = { taludBancos: renderTaludBancos };
