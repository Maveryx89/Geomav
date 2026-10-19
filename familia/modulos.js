/* Módulos: Mi ficha, Tareas, Medicamentos, Escolar, Más. Solo declaraciones de función (usan globals de index.html en tiempo de ejecución). */
'use strict';
const DIAS = ['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
function miPersonaId(){ const m=S.miembros.find(x=>x.user_id===S.user.id); return (m&&m.persona_id)||null; }
function miPersona(){ const id=miPersonaId(); return S.personas.find(p=>p.id===id)||null; }
function hoyKey(){ return ymd(today0()); }
function fmtDia(k){ return parseDate(k).toLocaleDateString('es-CL',{weekday:'short',day:'numeric',month:'short'}); }
function medActivo(m,k){ k=k||hoyKey(); return (!m.desde||m.desde<=k)&&(!m.hasta||m.hasta>=k); }
function horasMed(m){ return String(m.horarios||'').split(/[\s,;]+/).filter(Boolean).sort(); }
function tomada(mid,hora,k){ k=k||hoyKey(); return S.tomas.some(t=>t.medicamento_id===mid&&String(t.fecha).slice(0,10)===k&&t.hora===hora); }
function sumarIntervalo(k,rep){ const d=parseDate(k); if(rep==='diaria') d.setDate(d.getDate()+1); else if(rep==='semanal') d.setDate(d.getDate()+7); else d.setMonth(d.getMonth()+1); return ymd(d); }
function agrupa(l,key){ const g={}; l.forEach(x=>(g[x[key]]=g[x[key]]||[]).push(x)); return g; }
const KV = (a,b)=> b?`<b>${a}</b><span>${esc(b).replace(/\n/g,'<br>')}</span>`:'';

/* ---------- Mi ficha ---------- */
function doseCard(m,hr){
  const on=tomada(m.id,hr);
  return `<div class="card tap dose ${on?'on':''}" data-toma="${m.id}|${hr}"><div class="row"><div class="chk">${on?'✅':'⬜'}</div><div class="grow"><div class="t">${esc(hr)} · ${esc(m.nombre)}</div><div class="m">${esc(m.dosis||'')}</div></div></div></div>`;
}
function vMi(){
  const p=miPersona();
  if(!p) return `<div class="card"><div class="t">Tu cuenta aún no está vinculada a una persona</div><div class="m">${isAdmin()?'Ve a Más → Ajustes → Miembros y toca «Persona» en tu fila para vincularte.':'Pídele al administrador que te vincule en Ajustes.'}</div></div><div class="empty">Mientras tanto puedes ver Familia, Calendario y Tareas.</div>`;
  const k=hoyKey();
  let h=`<div class="card"><div class="row"><div class="av">${esc(inicial(p.nombre))}</div><div class="grow"><div class="t">${esc(p.nombre)}</div><div class="m">${esc(p.parentesco||'')}${p.nacimiento?` · ${edad(p.nacimiento)} años`:''}</div></div><button class="ghost sm" data-misdatos>Editar</button></div><div class="kv">`+KV('Teléfono',p.telefono)+KV('Emergencia',p.emergencia)+KV('Notas',p.notas)+`</div></div>`;
  const dosis=S.medicamentos.filter(m=>m.persona_id===p.id&&medActivo(m)).flatMap(m=>horasMed(m).map(hr=>({m,hr}))).sort((a,b)=>a.hr.localeCompare(b.hr));
  if(dosis.length) h+=`<h2>Medicamentos de hoy</h2>`+dosis.map(x=>doseCard(x.m,x.hr)).join('');
  const tr=S.tareas.filter(t=>!t.hecha&&t.asignada_a===p.id).sort(cmpTarea);
  if(tr.length) h+=`<h2>Mis tareas</h2>`+tr.map(tareaCard).join('');
  const ci=S.citas.filter(c=>c.persona_id===p.id&&c.estado==='pendiente'&&new Date(c.fecha)>=Date.now()-36e5).slice(0,3);
  if(ci.length) h+=`<h2>Mis próximas citas</h2>`+ci.map(citaCard).join('');
  const ev=S.escolar.filter(e=>e.persona_id===p.id&&e.tipo==='evento'&&(e.fecha||'')>=k).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))).slice(0,3);
  if(ev.length) h+=`<h2>Escolar · próximos</h2>`+ev.map(escCard).join('');
  const s=S.salud.find(x=>x.persona_id===p.id);
  if(s) h+=`<h2>Mi salud</h2><div class="card"><div class="kv">`+KV('RUT',s.rut)+KV('Previsión',s.prevision)+KV('Grupo sang.',s.grupo_sanguineo)+KV('Alergias',s.alergias)+KV('Medicamentos',s.medicamentos)+KV('Condiciones',s.condiciones)+KV('Vacunas',s.vacunas)+KV('Médico',s.medico)+`</div><div class="m" style="margin-top:6px">Solo lectura · la actualiza el administrador</div></div>`;
  return h;
}
function formMisDatos(p){
  form('Mis datos',[{k:'telefono',l:'Teléfono',t:'tel'},{k:'emergencia',l:'Contacto de emergencia'},{k:'notas',l:'Notas',t:'area'}],p,row=>save('personas',row,p.id));
}
function formVincular(m){
  form('Persona de '+(m.email||''),[{k:'persona_id',l:'Esta cuenta es…',t:'select',o:[['','Sin vincular'],...S.personas.map(p=>[p.id,p.nombre])]}],{persona_id:m.persona_id||''},async row=>{
    const {error}=await sb.from('miembros').update({persona_id:row.persona_id}).eq('family_id',S.fam).eq('user_id',m.user_id);
    if(error){ toast('Error: '+error.message); return false; }
    await load(); return true;
  });
}

/* ---------- Tareas ---------- */
function cmpTarea(a,b){ return (a.fecha||'9999').localeCompare(b.fecha||'9999')||a.titulo.localeCompare(b.titulo); }
function tareaCard(t){
  const k=hoyKey(), venc=t.fecha&&t.fecha<k&&!t.hecha;
  return `<div class="card ${isEditor()?'tap':''}" data-tarea="${t.id}"><div class="row"><button class="chkb" data-tareaok="${t.id}" aria-label="Marcar">${t.hecha?'✅':'⬜'}</button><div class="grow ${t.hecha?'done':''}"><div class="t">${esc(t.titulo)}</div><div class="m">${t.asignada_a?'👤 '+esc(pName(t.asignada_a)):'👥 Cualquiera'}${t.fecha?' · '+esc(fmtDia(t.fecha)):''}${t.repite?' · 🔁 '+esc(t.repite):''}</div>${t.descripcion?`<div class="m">${esc(t.descripcion)}</div>`:''}</div>${venc?'<span class="pill no">Vencida</span>':(t.fecha===k&&!t.hecha?'<span class="pill hoy">Hoy</span>':'')}</div></div>`;
}
function vTareas(){
  const mi=miPersonaId(), f=S.tf||'todas';
  const seg=`<div class="seg"><button class="${f==='todas'?'on':''}" data-tf="todas">Todas</button><button class="${f==='mias'?'on':''}" data-tf="mias">Mías</button></div>`;
  if(!S.tareas.length) return seg+`<div class="empty">Sin tareas.${isEditor()?'<br>Toca + para crear la primera.':''}</div>`;
  let l=S.tareas; if(f==='mias') l=l.filter(t=>t.asignada_a===mi);
  const pend=l.filter(t=>!t.hecha).sort(cmpTarea);
  const hechas=l.filter(t=>t.hecha).sort((a,b)=>String(b.hecha_at||'').localeCompare(String(a.hecha_at||''))).slice(0,10);
  return seg+`<h2>Pendientes</h2>`+(pend.map(tareaCard).join('')||'<div class="empty">Todo al día 🎉</div>')+(hechas.length?`<h2>Hechas recientemente</h2>`+hechas.map(tareaCard).join(''):'');
}
function formTarea(t){
  form(t?'Editar tarea':'Nueva tarea',[
    {k:'titulo',l:'Tarea',req:1},{k:'descripcion',l:'Detalle',t:'area'},
    {k:'asignada_a',l:'Responsable',t:'select',o:[['','Cualquiera'],...S.personas.map(p=>[p.id,p.nombre])]},
    {k:'fecha',l:'Fecha límite',t:'date'},
    {k:'repite',l:'Repetir',t:'select',o:[['','No se repite'],['diaria','Cada día'],['semanal','Cada semana'],['mensual','Cada mes']]}
  ],t,row=>save('tareas',row,t&&t.id),t&&(()=>del('tareas',t.id)));
}
async function toggleTarea(id){
  const t=S.tareas.find(x=>x.id===id); if(!t) return;
  if(S.offline){ toast('Sin conexión'); return; }
  const k=hoyKey(); let patch;
  if(t.hecha) patch={hecha:false,hecha_at:null};
  else if(t.repite){ let n=sumarIntervalo(t.fecha||k,t.repite); while(n<=k) n=sumarIntervalo(n,t.repite); patch={fecha:n}; toast('Próxima vez: '+fmtDia(n)); }
  else patch={hecha:true,hecha_at:new Date().toISOString()};
  const {error}=await sb.from('tareas').update(patch).eq('id',id);
  if(error) toast('Error: '+error.message); else await load();
}

/* ---------- Medicamentos ---------- */
function medCard(m){
  const act=medActivo(m);
  return `<div class="card ${isAdmin()?'tap':''}" data-med="${m.id}"><div class="row"><div class="grow"><div class="t">💊 ${esc(m.nombre)}${m.dosis?' · '+esc(m.dosis):''}</div><div class="m">🕒 ${esc(horasMed(m).join(' · ')||'sin horario')}</div>${(m.desde||m.hasta)?`<div class="m">${m.desde?'Desde '+esc(fmtDia(m.desde)):''}${m.hasta?' hasta '+esc(fmtDia(m.hasta)):''}</div>`:''}${m.notas?`<div class="m">${esc(m.notas)}</div>`:''}</div><span class="pill ${act?'ok':''}">${act?'Activo':'Terminado'}</span></div></div>`;
}
function vMeds(){
  const nota=`<div class="banner">${isAdmin()?'Solo los administradores y cada persona (la suya) ven esta sección.':'Aquí ves solo tus medicamentos.'}</div>`;
  if(!S.medicamentos.length) return nota+`<div class="empty">Sin medicamentos registrados.${isAdmin()?'<br>Toca + para agregar.':''}</div>`;
  const g=agrupa(S.medicamentos,'persona_id');
  return nota+Object.keys(g).sort((a,b)=>pName(a).localeCompare(pName(b))).map(pid=>`<h2>${esc(pName(pid))}</h2>`+g[pid].map(medCard).join('')).join('');
}
function formMed(m){
  if(!S.personas.length){ toast('Primero agrega una persona'); return; }
  form(m?'Editar medicamento':'Nuevo medicamento',[
    {k:'persona_id',l:'Persona',t:'select',o:S.personas.map(p=>[p.id,p.nombre])},
    {k:'nombre',l:'Medicamento',req:1},{k:'dosis',l:'Dosis (ej. 50 mg, 1 comprimido)'},
    {k:'horarios',l:'Horarios (ej. 08:00, 20:00)'},{k:'desde',l:'Desde',t:'date'},
    {k:'hasta',l:'Hasta (vacío = tratamiento continuo)',t:'date'},{k:'notas',l:'Indicaciones',t:'area'}
  ],m,row=>{
    if(row.horarios){
      const hs=row.horarios.split(/[\s,;]+/).filter(Boolean);
      if(!hs.every(x=>/^([01]?\d|2[0-3]):[0-5]\d$/.test(x))){ toast('Horarios en formato HH:MM separados por coma'); return false; }
      row.horarios=hs.map(x=>x.padStart(5,'0')).join(',');
    }
    return save('medicamentos',row,m&&m.id);
  },m&&(()=>del('medicamentos',m.id)));
}
async function toggleToma(val){
  const [mid,hora]=val.split('|'), k=hoyKey();
  if(S.offline){ toast('Sin conexión'); return; }
  const q=tomada(mid,hora,k)
    ? sb.from('medicamento_tomas').delete().eq('medicamento_id',mid).eq('fecha',k).eq('hora',hora)
    : sb.from('medicamento_tomas').insert({medicamento_id:mid,fecha:k,hora,family_id:S.fam});
  const {error}=await q;
  if(error) toast('Error: '+error.message); else await load();
}

/* ---------- Escolar ---------- */
function escCard(e){
  const ed=isEditor()?'tap':'';
  const det=e.detalle?`<div class="m">${esc(e.detalle)}</div>`:'';
  if(e.tipo==='util') return `<div class="card ${ed}" data-esc="${e.id}"><div class="row"><button class="chkb" data-utilok="${e.id}" aria-label="Marcar">${e.hecha?'✅':'⬜'}</button><div class="grow ${e.hecha?'done':''}"><div class="t">${esc(e.titulo)}</div>${det}</div></div></div>`;
  if(e.tipo==='horario') return `<div class="card ${ed}" data-esc="${e.id}"><div class="t">${esc(e.hora_inicio||'')}${e.hora_fin?'–'+esc(e.hora_fin):''} · ${esc(e.titulo)}</div>${det}</div>`;
  return `<div class="card ${ed}" data-esc="${e.id}"><div class="t">🎒 ${esc(e.titulo)}</div><div class="m">${e.fecha?esc(fmtDia(e.fecha)):''}${e.hora_inicio?' · '+esc(e.hora_inicio):''}</div>${det}</div>`;
}
function vEscolar(){
  if(!S.escolar.length) return `<div class="empty">Aquí van horarios de clases, reuniones, pruebas y listas de útiles.${isEditor()?'<br>Toca + para agregar.':''}</div>`;
  const k=hoyKey(), g=agrupa(S.escolar,'persona_id');
  return Object.keys(g).sort((a,b)=>pName(a).localeCompare(pName(b))).map(pid=>{
    const l=g[pid];
    const ev=l.filter(e=>e.tipo==='evento'&&(e.fecha||'')>=k).sort((a,b)=>(String(a.fecha)+(a.hora_inicio||'')).localeCompare(String(b.fecha)+(b.hora_inicio||'')));
    const hor=l.filter(e=>e.tipo==='horario');
    const ut=l.filter(e=>e.tipo==='util').sort((a,b)=>Number(a.hecha)-Number(b.hecha));
    let h=`<h2>🎒 ${esc(pName(pid))}</h2>`;
    if(ev.length) h+=`<div class="m sub">Próximos eventos</div>`+ev.map(escCard).join('');
    if(hor.length){
      h+=`<div class="m sub">Horario semanal</div>`;
      for(let d=1;d<=7;d++){ const x=hor.filter(e=>e.dia===d).sort((a,b)=>(a.hora_inicio||'').localeCompare(b.hora_inicio||'')); if(x.length) h+=`<div class="m dia">${DIAS[d]}</div>`+x.map(escCard).join(''); }
    }
    if(ut.length) h+=`<div class="m sub">Útiles / pendientes (${ut.filter(u=>u.hecha).length}/${ut.length})</div>`+ut.map(escCard).join('');
    if(!ev.length&&!hor.length&&!ut.length) h+=`<div class="empty">Sin eventos próximos.</div>`;
    return h;
  }).join('');
}
function formEscolar(e){
  if(!S.personas.length){ toast('Primero agrega una persona'); return; }
  form(e?'Editar ítem escolar':'Nuevo ítem escolar',[
    {k:'persona_id',l:'Alumno/a',t:'select',o:S.personas.map(p=>[p.id,p.nombre])},
    {k:'tipo',l:'Tipo',t:'select',o:[['horario','Horario de clases'],['evento','Evento (reunión, prueba, entrega, acto)'],['util','Útil / pendiente']]},
    {k:'titulo',l:'Asignatura / evento / útil',req:1},
    {k:'dia',l:'Día (solo horario de clases)',t:'select',o:[['','—'],...[1,2,3,4,5,6,7].map(d=>[String(d),DIAS[d]])]},
    {k:'hora_inicio',l:'Hora inicio',t:'time'},{k:'hora_fin',l:'Hora fin',t:'time'},
    {k:'fecha',l:'Fecha (solo eventos)',t:'date'},{k:'detalle',l:'Detalle (sala, profesor, qué llevar)',t:'area'}
  ],e&&{...e,dia:e.dia==null?'':String(e.dia)},row=>{
    if(row.tipo==='horario'&&!row.dia){ toast('Elige el día de la semana'); return false; }
    if(row.tipo==='evento'&&!row.fecha){ toast('Indica la fecha del evento'); return false; }
    row.dia=(row.tipo==='horario'&&row.dia)?+row.dia:null;
    return save('escolar',row,e&&e.id);
  },e&&(()=>del('escolar',e.id)));
}
async function toggleUtil(id){
  const e=S.escolar.find(x=>x.id===id); if(!e) return;
  if(S.offline){ toast('Sin conexión'); return; }
  const {error}=await sb.from('escolar').update({hecha:!e.hecha}).eq('id',id);
  if(error) toast('Error: '+error.message); else await load();
}

/* ---------- Más ---------- */
function vMas(){
  const it=[['citas','🩺','Citas médicas','Horas de doctor de toda la familia'],['meds','💊','Medicamentos','Horarios y tomas del día'],['escolar','🎒','Escolar','Horarios, pruebas y útiles'],['notas','📌','Info útil','Teléfonos, seguros y otros datos']];
  if(isAdmin()) it.push(['salud','❤️','Salud','Fichas de salud (solo administradores)']);
  it.push(['ajustes','⚙️','Ajustes','Miembros, roles y respaldo']);
  return it.map(x=>`<div class="card tap" data-tab="${x[0]}"><div class="row"><div style="font-size:1.6rem">${x[1]}</div><div class="grow"><div class="t">${x[2]}</div><div class="m">${x[3]}</div></div><div class="m">›</div></div></div>`).join('');
}
