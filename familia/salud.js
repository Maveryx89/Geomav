/* Historial de salud: línea de tiempo por persona. Solo admin escribe; cada persona vinculada puede leer el suyo (RLS). */
const HTIPOS=[['examen','🧪','Examen'],['diagnostico','🩺','Diagnóstico'],['consulta','👨‍⚕️','Consulta / control'],['imagen','🩻','Imagen'],['cirugia','🏥','Cirugía / hospital'],['vacuna','💉','Vacuna'],['tratamiento','💊','Tratamiento'],['otro','📄','Otro']];
function hT(k){ return HTIPOS.find(t=>t[0]===k)||HTIPOS[7]; }
function hFecha(d){ return parseDate(d).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}); }
function hNum(s){
  const t=String(s==null?'':s).trim().replace(',','.');
  return /^[<>]?\s*-?\d+(\.\d+)?$/.test(t)?parseFloat(t.replace(/[<>\s]/g,'')):null;
}
function hFlag(v,r){
  const x=hNum(v); if(x===null||!r) return '';
  const rr=String(r).replace(/,/g,'.').replace(/[\[\]\s]/g,'');
  let m;
  if((m=rr.match(/^(-?\d+(?:\.\d+)?)[-–](-?\d+(?:\.\d+)?)$/))) return x<+m[1]?'bajo':x>+m[2]?'alto':'';
  if((m=rr.match(/^<=(-?\d+(?:\.\d+)?)$/))||(m=rr.match(/^≤(-?\d+(?:\.\d+)?)$/))) return x>+m[1]?'alto':'';
  if((m=rr.match(/^<(-?\d+(?:\.\d+)?)$/))) return x>=+m[1]?'alto':'';
  if((m=rr.match(/^>=(-?\d+(?:\.\d+)?)$/))||(m=rr.match(/^≥(-?\d+(?:\.\d+)?)$/))) return x<+m[1]?'bajo':'';
  if((m=rr.match(/^>(-?\d+(?:\.\d+)?)$/))) return x<=+m[1]?'bajo':'';
  return '';
}
function hParse(txt){
  return String(txt||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    const p=l.split(/\s*[|\t]\s*/);
    const o={n:(p[0]||'').trim(),v:(p[1]||'').trim(),u:(p[2]||'').trim(),r:(p[3]||'').trim()};
    o.f=hFlag(o.v,o.r); return o;
  }).filter(o=>o.n);
}
function hLines(arr){
  return (arr||[]).map(o=>{ const a=[o.n,o.v||'',o.u||'',o.r||'']; while(a.length>1&&!a[a.length-1]) a.pop(); return a.join(' | '); }).join('\n');
}
function hCount(h){ return (h.resultados||[]).filter(o=>o.f).length; }

function vSaludLista(){
  if(!S.personas.length) return `<div class="empty">Primero agrega personas en la pestaña Familia.</div>`;
  return `<div class="banner">Solo los administradores ven esta sección. Toca una persona para ver y cargar su historial.</div>`+S.personas.map(p=>{
    const hs=S.historial.filter(h=>h.persona_id===p.id).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
    const s=S.salud.find(x=>x.persona_id===p.id);
    const sub=hs.length?`${hs.length} registro${hs.length>1?'s':''} · último: ${hFecha(hs[0].fecha)}`:(s?'Sin registros en el historial':'Sin ficha de salud');
    return `<div class="card tap" data-salud="${p.id}"><div class="row"><div class="av">${esc(inicial(p.nombre))}</div><div class="grow"><div class="t">${esc(pCorto(p))}</div><div class="m">${esc(sub)}</div></div><span class="m">›</span></div></div>`;
  }).join('');
}

function hTendencias(all){
  const g={};
  all.filter(h=>h.tipo==='examen').forEach(h=>(h.resultados||[]).forEach(o=>{
    const x=hNum(o.v); if(x===null) return;
    const k=o.n.toLowerCase().trim(); (g[k]=g[k]||[]).push({n:o.n,u:o.u,v:o.v,f:o.f,d:h.fecha});
  }));
  const rows=Object.values(g).filter(a=>a.length>=2).map(a=>{
    a.sort((x,y)=>String(x.d).localeCompare(String(y.d)));
    const last=a.slice(-3), l=a[a.length-1], pr=a[a.length-2];
    const dir=hNum(l.v)>hNum(pr.v)?'↑':hNum(l.v)<hNum(pr.v)?'↓':'→';
    return `<tr><td>${esc(l.n)}</td><td>${last.map(z=>`<span title="${esc(hFecha(z.d))}">${esc(z.v)}</span>`).join(' → ')} ${esc(l.u)}</td><td class="${l.f}">${dir}${l.f?' ⚠':''}</td></tr>`;
  });
  if(!rows.length) return '';
  return `<details class="card"><summary><span class="hic">📈</span><div class="grow t">Tendencias (${rows.length})</div></summary><table class="rt" style="margin-top:8px">${rows.join('')}</table><div class="m" style="margin-top:6px">Parámetros medidos 2 o más veces (últimos 3 valores, del más antiguo al más reciente).</div></details>`;
}

function hCard(h){
  const t=hT(h.tipo), nf=hCount(h), ar=h.archivos||[], rs=h.resultados||[];
  const meta=[hFecha(h.fecha),h.profesional].filter(Boolean).join(' · ');
  const body=(h.lugar?`<div class="m" style="margin-top:8px">📍 ${esc(h.lugar)}</div>`:'')+(h.detalle?`<div style="white-space:pre-wrap;margin:8px 0">${esc(h.detalle)}</div>`:'')
   +(rs.length?`<table class="rt">${rs.map(o=>o.v||o.u||o.r?`<tr><td>${esc(o.n)}</td><td class="${o.f||''}">${esc(o.v)} ${esc(o.u||'')}${o.f?(o.f==='alto'?' ↑':' ↓'):''}</td><td class="m">${esc(o.r||'')}</td></tr>`:`<tr class="hd"><td colspan="3">${esc(o.n)}</td></tr>`).join('')}</table>`:'')
   +(ar.length?`<div class="btns" style="justify-content:flex-start">${ar.map(a=>`<button class="ghost sm" data-arch="${esc(a.path)}">📎 ${esc(a.name)}</button>`).join('')}</div>`:'')
   +(isAdmin()&&!S.offline?`<div class="btns"><button class="ghost sm" data-hent="${h.id}">Editar</button></div>`:'');
  const hay=[h.titulo,h.profesional,h.lugar,h.detalle,t[2],rs.map(o=>o.n).join(' ')].join(' ').toLowerCase();
  return `<details class="card hcard" data-q="${esc(hay)}"><summary><span class="hic">${t[1]}</span><div class="grow"><div class="t">${esc(h.titulo)}</div><div class="m">${esc(meta)}</div></div>${nf?`<span class="pill no">⚠ ${nf}</span>`:''}${ar.length?'<span>📎</span>':''}</summary>${body}</details>`;
}

function vHistorial(){
  const p=S.personas.find(x=>x.id===S.hp);
  if(!p){ S.hp=null; return vSaludLista(); }
  const s=S.salud.find(x=>x.persona_id===p.id)||{};
  const all=S.historial.filter(h=>h.persona_id===p.id);
  const f=S.hf||'todos';
  const list=all.filter(h=>f==='todos'||h.tipo===f).sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
  const kv=(k,v)=>v?`<b>${k}</b><span>${esc(v).replace(/\n/g,'<br>')}</span>`:'';
  let h=`<div class="card"><div class="row"><div class="av">${esc(inicial(p.nombre))}</div><div class="grow"><div class="t">${esc(pCorto(p))}</div><div class="m">${esc(p.parentesco||'')}${p.nacimiento?` · ${edad(p.nacimiento)} años`:''}</div></div>${isAdmin()&&!S.offline?'<button class="ghost sm" data-hficha>Ficha base</button>':''}</div>`
   +`<div class="kv">${kv('RUT',s.rut)}${kv('Previsión',s.prevision)}${kv('Grupo sang.',s.grupo_sanguineo)}${kv('Alergias',s.alergias)}${kv('Medicamentos',s.medicamentos)}${kv('Condiciones',s.condiciones)}${kv('Vacunas',s.vacunas)}${kv('Médico',s.medico)}</div></div>`;
  h+=hTendencias(all);
  const cnt=k=>k==='todos'?all.length:all.filter(x=>x.tipo===k).length;
  h+=`<div class="chips">`+[['todos','','Todos'],...HTIPOS.filter(t=>cnt(t[0])).map(t=>[t[0],t[1]+' ',t[2]])].map(t=>`<button data-hf="${t[0]}" class="${f===t[0]?'on':''}">${t[1]}${t[2]} (${cnt(t[0])})</button>`).join('')+`</div>`;
  h+=`<input id="hq" type="search" placeholder="Buscar (examen, médico, parámetro…)" style="margin:6px 0 10px">`;
  if(!list.length) h+=`<div class="empty">${all.length?'Sin registros de este tipo.':'Aún no hay registros. Toca + para cargar exámenes, diagnósticos, consultas, vacunas, cirugías o adjuntar PDFs.'}</div>`;
  let yr='';
  list.forEach(x=>{ const y=String(x.fecha).slice(0,4); if(y!==yr){ yr=y; h+=`<h2 class="hy">${y}</h2>`; } h+=hCard(x); });
  return h;
}

async function hAbrir(path){
  const w=window.open('','_blank');
  const {data,error}=await sb.storage.from('salud-docs').createSignedUrl(path,300);
  if(error||!data){ if(w) w.close(); toast('No se pudo abrir: '+((error&&error.message)||'')); return; }
  if(w) w.location.href=data.signedUrl; else location.href=data.signedUrl;
}

function formHist(h,personaId){
  if(S.offline){ toast('Sin conexión: no se puede guardar'); return; }
  h=h||{}; const pid=h.persona_id||personaId; if(!pid) return;
  let arch=[...(h.archivos||[])]; const quitar=[];
  const d=dlg(`<form><h3>${h.id?'Editar registro':'Nuevo registro'} · ${esc(pName(pid))}</h3>
   <label>Tipo<select name="tipo">${HTIPOS.map(t=>`<option value="${t[0]}" ${t[0]===(h.tipo||'examen')?'selected':''}>${t[1]} ${t[2]}</option>`).join('')}</select></label>
   <label>Fecha<input type="date" name="fecha" required value="${esc(h.fecha||ymd(new Date()))}"></label>
   <label>Título<input name="titulo" required value="${esc(h.titulo||'')}" placeholder="Ej. Perfil bioquímico, Control cardiología"></label>
   <label>Profesional<input name="profesional" value="${esc(h.profesional||'')}"></label>
   <label>Lugar / centro<input name="lugar" value="${esc(h.lugar||'')}"></label>
   <label>Detalle / indicaciones<textarea name="detalle" rows="4">${esc(h.detalle||'')}</textarea></label>
   <label>Resultados (opcional): una línea por parámetro<textarea name="res" rows="6" placeholder="Glicemia | 142 | mg/dl | 60 - 100&#10;Hemoglobina glicosilada | 6,8 | % | 4,0 - 6,0">${esc(hLines(h.resultados))}</textarea></label>
   <div class="m">Formato: Nombre | valor | unidad | referencia. Se marcan solos ↑/↓ si están fuera de rango. Puedes pegar filas desde Excel.</div>
   <label>Adjuntar PDF o fotos<input type="file" name="files" multiple accept="application/pdf,image/*"></label>
   <div id="hatt"></div>
   <div class="btns"><button type="button" class="ghost" data-x>Cancelar</button>${h.id?'<button type="button" class="danger" data-del>Eliminar</button>':''}<button class="primary">Guardar</button></div></form>`);
  const pintaAtt=()=>{ d.querySelector('#hatt').innerHTML=arch.map((a,i)=>`<div class="row" style="margin:4px 0"><span class="grow m">📎 ${esc(a.name)}</span><button type="button" class="danger sm" data-rmatt="${i}">Quitar</button></div>`).join(''); };
  pintaAtt();
  d.querySelector('#hatt').onclick=e=>{ const b=e.target.closest('[data-rmatt]'); if(!b) return; const [a]=arch.splice(+b.dataset.rmatt,1); quitar.push(a.path); pintaAtt(); };
  d.querySelector('[data-x]').onclick=()=>d.close();
  const rmFiles=async paths=>{ if(paths.length) await sb.storage.from('salud-docs').remove(paths); };
  if(h.id) d.querySelector('[data-del]').onclick=async()=>{
    if(!confirm('¿Eliminar este registro y sus adjuntos?')) return;
    await rmFiles((h.archivos||[]).map(a=>a.path));
    if(await del('historial',h.id)) d.close();
  };
  const f=d.querySelector('form');
  f.onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(f), btn=f.querySelector('.primary'); btn.disabled=true; btn.textContent='Guardando…';
    const subidos=[];
    try{
      const files=[...f.querySelector('[name=files]').files];
      for(let i=0;i<files.length;i++){
        const fl=files[i], safe=fl.name.replace(/[^\w.\-]+/g,'_');
        const path=`${S.fam}/${pid}/${Date.now()}-${i}-${safe}`;
        const {error}=await sb.storage.from('salud-docs').upload(path,fl,{contentType:fl.type||'application/octet-stream'});
        if(error) throw error;
        subidos.push(path); arch.push({path,name:fl.name,type:fl.type});
      }
      const tx=k=>{ const v=String(fd.get(k)||'').trim(); return v===''?null:v; };
      const row={persona_id:pid,tipo:fd.get('tipo'),fecha:fd.get('fecha'),titulo:tx('titulo'),profesional:tx('profesional'),lugar:tx('lugar'),detalle:tx('detalle'),resultados:hParse(fd.get('res')),archivos:arch};
      if(await save('historial',row,h.id)){ await rmFiles(quitar); d.close(); return; }
      throw new Error('no se guardó');
    }catch(err){
      await rmFiles(subidos); arch=arch.filter(a=>!subidos.includes(a.path));
      toast('Error: '+(err.message||err)); btn.disabled=false; btn.textContent='Guardar';
    }
  };
}

document.addEventListener('input',e=>{
  if(e.target.id!=='hq') return;
  const q=e.target.value.toLowerCase().trim();
  document.querySelectorAll('.hcard').forEach(c=>{ c.hidden=!!q&&!c.dataset.q.includes(q); });
  document.querySelectorAll('.hy').forEach(y=>{ let n=y.nextElementSibling, any=false; while(n&&n.classList.contains('hcard')){ if(!n.hidden) any=true; n=n.nextElementSibling; } y.hidden=!any; });
});
