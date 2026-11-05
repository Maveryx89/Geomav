/* Informes: semanal, mensual y general. Solo declaraciones (usan globals de index.html en tiempo de ejecución). */
const INF_P=[['sem','Semanal'],['mes','Mensual'],['all','General']];
function infSt(){ return S.inf||(S.inf={per:'sem',off:0,pid:''}); }
function infRango(){
  const st=infSt(), t=today0();
  if(st.per==='sem'){
    const d=new Date(t); d.setDate(d.getDate()-((d.getDay()+6)%7)+st.off*7);
    const h=new Date(d); h.setDate(h.getDate()+6);
    return {d:ymd(d),h:ymd(h),tit:'Semana del '+fmtFecha(ymd(d))+' al '+fmtFecha(ymd(h))};
  }
  if(st.per==='mes'){
    const d=new Date(t.getFullYear(),t.getMonth()+st.off,1), h=new Date(d.getFullYear(),d.getMonth()+1,0);
    const n=d.toLocaleDateString('es-CL',{month:'long',year:'numeric'});
    return {d:ymd(d),h:ymd(h),tit:n.charAt(0).toUpperCase()+n.slice(1)};
  }
  return {d:'0000-01-01',h:'9999-12-31',tit:'Informe general (todo el historial)'};
}
const infFh = c => { const d=new Date(c); return d.toLocaleString('es-CL',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); };
const infLoc = iso => ymd(new Date(iso));
function infDatos(){
  const st=infSt(), R=infRango(), hoy=hoyKey(), pid=st.pid;
  const enR=k=>k&&String(k).slice(0,10)>=R.d&&String(k).slice(0,10)<=R.h;
  const ok=x=>!pid||x.persona_id===pid;
  const S_=[]; // secciones: {ic,t,res,l:[líneas]}
  const nom=id=>id?pShort(id):'Todos';
  // Citas
  const ci=S.citas.filter(c=>ok(c)&&enR(infLoc(c.fecha))).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const cc=e=>ci.filter(c=>c.estado===e).length;
  S_.push({ic:'🩺',t:'Citas médicas',res:`${ci.length} en total · ${cc('realizada')} realizadas · ${cc('pendiente')} pendientes · ${cc('cancelada')} canceladas`,
    l:ci.map(c=>`${infFh(c.fecha)} · ${pShort(c.persona_id)} · ${[c.doctor,c.motivo].filter(Boolean).join(' – ')||'Cita'}${c.lugar?' ('+c.lugar+')':''} [${c.estado}]`)});
  // Tareas
  const ta=S.tareas.filter(t=>(!pid||t.asignada_a===pid)&&(enR(t.fecha)||(t.hecha&&enR(t.hecha_at))));
  const hechas=ta.filter(t=>t.hecha), venc=ta.filter(t=>!t.hecha&&t.fecha&&t.fecha<hoy), pend=ta.filter(t=>!t.hecha&&!(t.fecha&&t.fecha<hoy));
  const lt=(arr,pre)=>arr.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))).map(t=>`${pre} ${t.titulo}${t.asignada_a?' · '+pShort(t.asignada_a):''}${t.fecha?' · '+fmtDia(String(t.fecha).slice(0,10)):''}`);
  S_.push({ic:'✅',t:'Tareas',res:`${ta.length} en total · ${hechas.length} hechas · ${pend.length} pendientes · ${venc.length} vencidas`,l:[...lt(venc,'⚠️ Vencida:'),...lt(pend,'⬜'),...lt(hechas,'✅')]});
  // Eventos familiares
  if(!pid){
    const ev=S.eventos.filter(e=>enR(e.fecha)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    S_.push({ic:'📌',t:'Eventos familiares',res:`${ev.length} evento${ev.length==1?'':'s'}`,l:ev.map(e=>`${fmtDia(String(e.fecha).slice(0,10))}${e.hora?' '+String(e.hora).slice(0,5):''} · ${e.titulo}${e.lugar?' ('+e.lugar+')':''}`)});
  }
  // Escolar (eventos con fecha)
  const es=S.escolar.filter(e=>e.tipo==='evento'&&ok(e)&&enR(e.fecha)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  const ut=S.escolar.filter(e=>e.tipo==='util'&&ok(e));
  S_.push({ic:'🎒',t:'Escolar',res:`${es.length} evento${es.length==1?'':'s'} · útiles: ${ut.filter(u=>u.hecho||u.hecha).length}/${ut.length} listos`,l:es.map(e=>`${fmtDia(String(e.fecha).slice(0,10))} · ${pShort(e.persona_id)} · ${e.titulo}${e.hora_inicio?' '+String(e.hora_inicio).slice(0,5):''}`)});
  // Cumpleaños
  const cuR=st.per==='all'?[]:[...new Set([parseDate(R.d).getFullYear(),parseDate(R.h).getFullYear()])].flatMap(y=>S.personas.filter(p=>(!pid||p.id===pid)&&p.nacimiento).map(p=>{ const b=parseDate(p.nacimiento); return {p,k:ymd(new Date(y,b.getMonth(),b.getDate())),y}; })).filter(x=>enR(x.k)).sort((a,b)=>a.k.localeCompare(b.k));
  if(st.per!=='all') S_.push({ic:'🎂',t:'Cumpleaños',res:`${cuR.length} en el período`,l:cuR.map(x=>`${fmtDia(x.k)} · ${pCorto(x.p)} cumple ${x.y-parseDate(x.p.nacimiento).getFullYear()}`)});
  // Medicamentos (solo semanal; las tomas se cargan por 7 días)
  if(st.per==='sem'&&st.off===0&&(isAdmin()||S.medicamentos.length)){
    const fin=R.h<hoy?R.h:hoy, dias=[]; for(let d=parseDate(R.d);ymd(d)<=fin;d.setDate(d.getDate()+1)) dias.push(ymd(d));
    const ms=S.medicamentos.filter(m=>ok(m)); let prog=0, tom=0; const l=[];
    ms.forEach(m=>{ let p=0,t=0; dias.forEach(k=>{ if(!medActivo(m,k)) return; horasMed(m).forEach(h=>{ p++; if(tomada(m.id,h,k)) t++; }); }); prog+=p; tom+=t; if(p) l.push(`${pShort(m.persona_id)} · ${m.nombre}: ${t}/${p} tomas (${Math.round(t*100/p)}%)`); });
    S_.push({ic:'💊',t:'Medicamentos (cumplimiento)',res:prog?`${tom}/${prog} tomas registradas (${Math.round(tom*100/prog)}%)`:'Sin tomas programadas',l});
  }
  // Historial de salud (solo admin)
  if(isAdmin()){
    const hs=S.historial.filter(h=>ok(h)&&enR(h.fecha)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    S_.push({ic:'❤️',t:'Historial de salud',res:`${hs.length} registro${hs.length==1?'':'s'}`,l:hs.map(h=>`${fmtDia(String(h.fecha).slice(0,10))} · ${pShort(h.persona_id)} · ${hT(h.tipo)[2]}: ${h.titulo||''}`)});
  }
  // Resumen por persona (solo "todos")
  let porP=null;
  if(!pid){
    porP=S.personas.map(p=>({n:pCorto(p),c:S.citas.filter(c=>c.persona_id===p.id&&enR(infLoc(c.fecha))).length,tp:S.tareas.filter(t=>t.asignada_a===p.id&&!t.hecha&&(st.per==='all'||enR(t.fecha))).length})).filter(x=>x.c||x.tp);
  }
  return {R,S_,porP,nom:nom(pid)};
}
function infTexto(){
  const D=infDatos(), st=infSt();
  let s=`INFORME ${D.R.tit.toUpperCase()}\n${S.famNombre} · ${D.nom}\nGenerado el ${new Date().toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'})}\n`;
  D.S_.forEach(x=>{ s+=`\n${x.ic} ${x.t}: ${x.res}\n`+x.l.map(l=>' - '+l).join('\n')+(x.l.length?'\n':''); });
  if(D.porP&&D.porP.length) s+=`\n👪 Por persona\n`+D.porP.map(x=>` - ${x.n}: ${x.c} cita${x.c==1?'':'s'}, ${x.tp} tarea${x.tp==1?'':'s'} pendiente${x.tp==1?'':'s'}`).join('\n')+'\n';
  return s;
}
function vInforme(){
  const st=infSt(), D=infDatos();
  let h=`<div class="chips">`+INF_P.map(p=>`<button data-infp="${p[0]}" class="${st.per===p[0]?'on':''}">${p[1]}</button>`).join('')+`</div>`;
  h+=`<select id="infpid" style="width:100%;margin:6px 0">`+`<option value="">Toda la familia</option>`+S.personas.map(p=>`<option value="${p.id}" ${st.pid===p.id?'selected':''}>${esc(pCorto(p))}</option>`).join('')+`</select>`;
  if(st.per!=='all') h+=`<div class="row" style="margin:6px 0"><button class="ghost sm" data-infn="-1">‹ Anterior</button><div class="grow" style="text-align:center"><b>${esc(D.R.tit)}</b></div><button class="ghost sm" data-infn="1" ${st.off>=0?'disabled':''}>Siguiente ›</button></div>`;
  else h+=`<div style="text-align:center;margin:6px 0"><b>${esc(D.R.tit)}</b></div>`;
  h+=`<div class="btns" style="justify-content:flex-start;margin-bottom:8px"><button class="primary sm" data-infprint>🖨️ Imprimir / PDF</button><button class="ghost sm" data-infcopy>📋 Copiar texto</button><button class="ghost sm" data-infshare>📤 Compartir</button></div>`;
  D.S_.forEach(x=>{ h+=`<div class="card"><div class="t">${x.ic} ${esc(x.t)}</div><div class="m">${esc(x.res)}</div>${x.l.length?'<ul style="margin:6px 0 0;padding-left:18px">'+x.l.map(l=>`<li>${esc(l)}</li>`).join('')+'</ul>':''}</div>`; });
  if(D.porP&&D.porP.length) h+=`<div class="card"><div class="t">👪 Por persona</div><table style="width:100%;font-size:.88rem;margin-top:6px"><tr><th align="left">Persona</th><th>Citas</th><th>Tareas pend.</th></tr>`+D.porP.map(x=>`<tr><td>${esc(x.n)}</td><td align="center">${x.c}</td><td align="center">${x.tp}</td></tr>`).join('')+`</table></div>`;
  return h;
}
function infImprimir(){
  const w=window.open('','_blank'); if(!w){ toast('Permite las ventanas emergentes para imprimir'); return; }
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Informe</title><body style="font:14px system-ui;max-width:760px;margin:20px auto;padding:0 12px"><pre style="white-space:pre-wrap;font:inherit">${esc(infTexto())}</pre><script>setTimeout(()=>print(),300)<\/script>`);
  w.document.close();
}
document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-infp],[data-infn],[data-infprint],[data-infcopy],[data-infshare]'); if(!t) return;
  const d=t.dataset, st=infSt();
  if(d.infp){ st.per=d.infp; st.off=0; render(); }
  else if(d.infn){ st.off=Math.min(0,st.off+Number(d.infn)); render(); }
  else if('infprint' in d) infImprimir();
  else if('infcopy' in d){ try{ await navigator.clipboard.writeText(infTexto()); toast('Informe copiado'); }catch(_){ toast('No se pudo copiar'); } }
  else if('infshare' in d){ if(navigator.share){ try{ await navigator.share({title:'Informe '+S.famNombre,text:infTexto()}); }catch(_){} } else { try{ await navigator.clipboard.writeText(infTexto()); toast('Informe copiado'); }catch(_){} } }
});
document.addEventListener('change',e=>{ if(e.target.id==='infpid'){ infSt().pid=e.target.value; render(); } });
