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
  S_.push({c:'#2C6B7E',ic:'🩺',t:'Citas médicas',it:ci,k:'cita',res:`${ci.length} en total · ${cc('realizada')} realizadas · ${cc('pendiente')} pendientes · ${cc('cancelada')} canceladas`,
    l:ci.map(c=>`${infFh(c.fecha)} · ${pShort(c.persona_id)} · ${[c.doctor,c.motivo].filter(Boolean).join(' – ')||'Cita'}${c.lugar?' ('+c.lugar+')':''} [${c.estado}]`)});
  // Tareas
  const ta=S.tareas.filter(t=>(!pid||t.asignada_a===pid)&&(enR(t.fecha)||(t.hecha&&enR(t.hecha_at))));
  const hechas=ta.filter(t=>t.hecha), venc=ta.filter(t=>!t.hecha&&t.fecha&&t.fecha<hoy), pend=ta.filter(t=>!t.hecha&&!(t.fecha&&t.fecha<hoy));
  const lt=(arr,pre)=>arr.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))).map(t=>`${pre} ${t.titulo}${t.asignada_a?' · '+pShort(t.asignada_a):''}${t.fecha?' · '+fmtDia(String(t.fecha).slice(0,10)):''}`);
  S_.push({c:'#2e7d32',ic:'✅',t:'Tareas',it:[venc,pend,hechas].flatMap(a=>a.slice().sort((x,y)=>String(x.fecha).localeCompare(String(y.fecha)))),k:'tarea',res:`${ta.length} en total · ${hechas.length} hechas · ${pend.length} pendientes · ${venc.length} vencidas`,l:[...lt(venc,'⚠️ Vencida:'),...lt(pend,'⬜'),...lt(hechas,'✅')]});
  // Eventos familiares
  if(!pid){
    const ev=S.eventos.filter(e=>enR(e.fecha)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    S_.push({c:'#D49A6A',ic:'📌',t:'Eventos familiares',res:`${ev.length} evento${ev.length==1?'':'s'}`,l:ev.map(e=>`${fmtDia(String(e.fecha).slice(0,10))}${e.hora?' '+String(e.hora).slice(0,5):''} · ${e.titulo}${e.lugar?' ('+e.lugar+')':''}`)});
  }
  // Escolar (eventos con fecha)
  const es=S.escolar.filter(e=>e.tipo==='evento'&&ok(e)&&enR(e.fecha)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  const ut=S.escolar.filter(e=>e.tipo==='util'&&ok(e));
  S_.push({c:'#7b5ea7',ic:'🎒',t:'Escolar',res:`${es.length} evento${es.length==1?'':'s'} · útiles: ${ut.filter(u=>u.hecho||u.hecha).length}/${ut.length} listos`,l:es.map(e=>`${fmtDia(String(e.fecha).slice(0,10))} · ${pShort(e.persona_id)} · ${e.titulo}${e.hora_inicio?' '+String(e.hora_inicio).slice(0,5):''}`)});
  // Cumpleaños
  const cuR=st.per==='all'?[]:[...new Set([parseDate(R.d).getFullYear(),parseDate(R.h).getFullYear()])].flatMap(y=>S.personas.filter(p=>(!pid||p.id===pid)&&p.nacimiento).map(p=>{ const b=parseDate(p.nacimiento); return {p,k:ymd(new Date(y,b.getMonth(),b.getDate())),y}; })).filter(x=>enR(x.k)).sort((a,b)=>a.k.localeCompare(b.k));
  if(st.per!=='all') S_.push({c:'#c2527a',ic:'🎂',t:'Cumpleaños',res:`${cuR.length} en el período`,l:cuR.map(x=>`${fmtDia(x.k)} · ${pCorto(x.p)} cumple ${x.y-parseDate(x.p.nacimiento).getFullYear()}`)});
  // Medicamentos (solo semanal; las tomas se cargan por 7 días)
  if(st.per==='sem'&&st.off===0&&(isAdmin()||S.medicamentos.length)){
    const fin=R.h<hoy?R.h:hoy, dias=[]; for(let d=parseDate(R.d);ymd(d)<=fin;d.setDate(d.getDate()+1)) dias.push(ymd(d));
    const ms=S.medicamentos.filter(m=>ok(m)); let prog=0, tom=0; const l=[]; var medPct=null;
    ms.forEach(m=>{ let p=0,t=0; dias.forEach(k=>{ if(!medActivo(m,k)) return; horasMed(m).forEach(h=>{ p++; if(tomada(m.id,h,k)) t++; }); }); prog+=p; tom+=t; if(p) l.push(`${pShort(m.persona_id)} · ${m.nombre}: ${t}/${p} tomas (${Math.round(t*100/p)}%)`); });
    medPct=prog?Math.round(tom*100/prog):null; S_.push({c:'#0A2240',ic:'💊',t:'Medicamentos (cumplimiento)',res:prog?`${tom}/${prog} tomas registradas (${Math.round(tom*100/prog)}%)`:'Sin tomas programadas',l});
  }
  // Historial de salud (solo admin)
  if(isAdmin()){
    const hs=S.historial.filter(h=>ok(h)&&enR(h.fecha)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    S_.push({c:'#b3261e',ic:'❤️',t:'Historial de salud',res:`${hs.length} registro${hs.length==1?'':'s'}`,l:hs.map(h=>`${fmtDia(String(h.fecha).slice(0,10))} · ${pShort(h.persona_id)} · ${hT(h.tipo)[2]}: ${h.titulo||''}`)});
  }
  // Resumen por persona (solo "todos")
  let porP=null;
  if(!pid){
    porP=S.personas.map(p=>({n:pCorto(p),c:S.citas.filter(c=>c.persona_id===p.id&&enR(infLoc(c.fecha))).length,tp:S.tareas.filter(t=>t.asignada_a===p.id&&!t.hecha&&(st.per==='all'||enR(t.fecha))).length})).filter(x=>x.c||x.tp);
  }
  return {R,S_,porP,nom:nom(pid),stats:{c:ci.length,h:hechas.length,p:pend.length,v:venc.length,tot:ta.length,med:typeof medPct==='undefined'?null:medPct}};
}
function infTexto(){
  const D=infDatos(), st=infSt();
  let s=`INFORME ${D.R.tit.toUpperCase()}\n${S.famNombre} · ${D.nom}\nGenerado el ${new Date().toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric'})}\n`;
  D.S_.forEach(x=>{ s+=`\n${x.ic} ${x.t}: ${x.res}\n`+x.l.map(l=>' - '+l).join('\n')+(x.l.length?'\n':''); });
  if(D.porP&&D.porP.length) s+=`\n👪 Por persona\n`+D.porP.map(x=>` - ${x.n}: ${x.c} cita${x.c==1?'':'s'}, ${x.tp} tarea${x.tp==1?'':'s'} pendiente${x.tp==1?'':'s'}`).join('\n')+'\n';
  return s;
}
const INF_CSS=`.inf-hero{background:linear-gradient(135deg,var(--ink),var(--blueprint));color:#fff;border-radius:18px;padding:16px;margin-bottom:12px}
.inf-hero .k{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;opacity:.75}.inf-hero .tt{font-size:1.25rem;font-weight:800;margin:2px 0 2px}.inf-hero .su{opacity:.8;font-size:.85rem}
.inf-st{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.inf-st div{background:#ffffff1f;border-radius:12px;padding:8px 4px;text-align:center}.inf-st b{display:block;font-size:1.4rem;line-height:1.1}.inf-st span{font-size:.68rem;opacity:.85}
.inf-urg{background:#fbeeed;border:1px solid #efc4c0;border-left:5px solid var(--danger);border-radius:14px;padding:10px 14px;margin-bottom:12px}.inf-urg .t{color:var(--danger)}.inf-urg ul{margin:4px 0 0;padding-left:18px;font-size:.9rem}
.inf-cal{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px;margin-bottom:12px}.inf-cal .hd{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;font-size:.7rem;color:var(--mut);font-weight:700;margin-bottom:4px}
.inf-cal .cal-d{min-height:50px}.inf-cal .cal-d i{display:flex;gap:2px;justify-content:center;flex-wrap:wrap}.inf-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.inf-leg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.72rem;color:var(--mut);margin-top:8px}.inf-leg span:before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--c);margin-right:4px}
.inf-sec{border-left:5px solid var(--c)}.inf-bar{height:8px;border-radius:99px;background:#e8e6df;margin:6px 0 4px;overflow:hidden}.inf-bar>div{height:100%;border-radius:99px}
.inf-it .card{background:#faf9f6;border-radius:12px;margin:8px 0 0}.inf-ln{border-top:1px solid var(--line);padding:6px 0;font-size:.9rem}.inf-ln:first-of-type{margin-top:6px}`;
if(!document.getElementById('inf-css')){ const st=document.createElement('style'); st.id='inf-css'; st.textContent=INF_CSS; document.head.appendChild(st); }
const INF_COL={cita:'#2C6B7E',tarea:'#2e7d32',evento:'#D49A6A',esc:'#7b5ea7',cumple:'#c2527a'};
/* Puntos del calendario: {fecha:{cita:n,tarea:n,...}} y detalle del día */
function infMarcas(){
  const pid=infSt().pid, M={}, add=(k,t,txt)=>{ if(!k) return; k=String(k).slice(0,10); ((M[k]=M[k]||{})[t]=M[k][t]||[]).push(txt); };
  const ok=x=>!pid||x.persona_id===pid;
  S.citas.filter(ok).forEach(c=>add(infLoc(c.fecha),'cita',`🩺 ${new Date(c.fecha).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})} · ${pShort(c.persona_id)} · ${[c.doctor,c.motivo].filter(Boolean).join(' – ')||'Cita'}`));
  S.tareas.filter(t=>!pid||t.asignada_a===pid).forEach(t=>add(t.fecha,'tarea',`${t.hecha?'✅':'⬜'} ${t.titulo}${t.asignada_a?' · '+pShort(t.asignada_a):''}`));
  if(!pid) S.eventos.forEach(e=>add(e.fecha,'evento',`📌 ${e.titulo}`));
  S.escolar.filter(e=>e.tipo==='evento'&&ok(e)).forEach(e=>add(e.fecha,'esc',`🎒 ${pShort(e.persona_id)} · ${e.titulo}`));
  const R=infRango();
  [...new Set([+R.d.slice(0,4),+R.h.slice(0,4)])].forEach(y=>S.personas.filter(p=>(!pid||p.id===pid)&&p.nacimiento).forEach(p=>{ const b=parseDate(p.nacimiento); add(ymd(new Date(y,b.getMonth(),b.getDate())),'cumple',`🎂 ${pCorto(p)}`); }));
  return M;
}
function infCalendario(R){
  const st=infSt(), M=infMarcas(), hoy=hoyKey(), cells=[];
  const d0=parseDate(R.d), d1=parseDate(R.h);
  if(st.per==='mes') for(let i=0;i<(d0.getDay()+6)%7;i++) cells.push(null);
  for(let d=new Date(d0);d<=d1;d.setDate(d.getDate()+1)) cells.push(ymd(d));
  const fer=k=>(window.CAL&&CAL.feriados&&CAL.feriados[k]);
  const cell=k=>{ if(!k) return '<div class="cal-d x"></div>'; const m=M[k]||{}, dw=parseDate(k).getDay();
    return `<div class="cal-d ${k===hoy?'hoy':''} ${fer(k)?'fer':''} ${dw===0?'dom':''} ${st.sel===k?'sel':''}" data-infdia="${k}">${+k.slice(8)}<i>${Object.keys(m).map(t=>`<span class="inf-dot" style="background:${INF_COL[t]}"></span>`).join('')}</i></div>`; };
  let h=`<div class="inf-cal"><div class="hd">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-g">${cells.map(cell).join('')}</div>`;
  h+=`<div class="inf-leg"><span style="--c:${INF_COL.cita}">Citas</span><span style="--c:${INF_COL.tarea}">Tareas</span><span style="--c:${INF_COL.evento}">Eventos</span><span style="--c:${INF_COL.esc}">Escolar</span><span style="--c:${INF_COL.cumple}">Cumpleaños</span></div>`;
  if(st.sel&&M[st.sel]){ const f=fer(st.sel); h+=`<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px"><div class="t">${esc(fmtDia(st.sel))}${f?` · <span style="color:var(--danger)">${esc(f.n)}</span>`:''}</div><ul style="margin:4px 0 0;padding-left:18px">${Object.values(M[st.sel]).flat().map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`; }
  return h+`</div>`;
}
function infUrgente(){
  const pid=infSt().pid, hoy=hoyKey(), man=ymd(new Date(today0().getTime()+864e5)), L=[];
  S.tareas.filter(t=>(!pid||t.asignada_a===pid)&&!t.hecha&&t.fecha&&String(t.fecha).slice(0,10)<hoy).forEach(t=>L.push(`⚠️ Tarea vencida: ${t.titulo}${t.asignada_a?' · '+pShort(t.asignada_a):''} (${fmtDia(String(t.fecha).slice(0,10))})`));
  S.citas.filter(c=>(!pid||c.persona_id===pid)&&c.estado==='pendiente'&&[hoy,man].includes(infLoc(c.fecha))).forEach(c=>L.push(`🩺 ${infLoc(c.fecha)===hoy?'Hoy':'Mañana'} ${new Date(c.fecha).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})} · ${pShort(c.persona_id)} · ${[c.doctor,c.motivo].filter(Boolean).join(' – ')||'Cita'}`));
  return L.length?`<div class="inf-urg"><div class="t">🔔 Lo importante</div><ul>${L.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`:'';
}
function vInforme(){
  const st=infSt(), D=infDatos(), X=D.stats;
  let h=`<div class="chips">`+INF_P.map(p=>`<button data-infp="${p[0]}" class="${st.per===p[0]?'on':''}">${p[1]}</button>`).join('')+`</div>`;
  h+=`<select id="infpid" style="width:100%;margin:6px 0 10px">`+`<option value="">Toda la familia</option>`+S.personas.map(p=>`<option value="${p.id}" ${st.pid===p.id?'selected':''}>${esc(pCorto(p))}</option>`).join('')+`</select>`;
  if(st.per!=='all') h+=`<div class="row" style="margin:0 0 10px"><button class="ghost sm" data-infn="-1">‹ Anterior</button><div class="grow"></div><button class="ghost sm" data-infn="1" ${st.off>=0?'disabled':''}>Siguiente ›</button></div>`;
  h+=`<div class="inf-hero"><div class="k">${st.per==='sem'?'Informe semanal':st.per==='mes'?'Informe mensual':'Informe general'}</div><div class="tt">${esc(D.R.tit)}</div><div class="su">${esc(S.famNombre)} · ${esc(D.nom)}</div><div class="inf-st"><div><b>${X.c}</b><span>Citas</span></div><div><b>${X.h}</b><span>Hechas</span></div><div><b>${X.p}</b><span>Pendientes</span></div><div><b style="${X.v?'color:#ffb4ab':''}">${X.v}</b><span>Vencidas</span></div></div></div>`;
  h+=infUrgente();
  if(st.per!=='all') h+=infCalendario(D.R);
  h+=`<div class="btns" style="justify-content:flex-start;margin-bottom:10px"><button class="primary sm" data-infprint>🖨️ Imprimir / PDF</button><button class="ghost sm" data-infcopy>📋 Copiar texto</button><button class="ghost sm" data-infshare>📤 Compartir</button></div>`;
  D.S_.forEach(x=>{
    let bar='';
    if(x.t==='Tareas'&&X.tot) bar=`<div class="inf-bar"><div style="width:${Math.round(X.h*100/X.tot)}%;background:var(--ok)"></div></div>`;
    if(x.t.startsWith('Medic')&&X.med!=null) bar=`<div class="inf-bar"><div style="width:${X.med}%;background:${X.med>=80?'var(--ok)':X.med>=50?'#e0a100':'var(--danger)'}"></div></div>`;
    h+=`<div class="card inf-sec" style="--c:${x.c}"><div class="t">${x.ic} ${esc(x.t)}</div><div class="m">${esc(x.res)}</div>${bar}${x.it?(x.it.length?'<div class="inf-it">'+x.it.map(i=>x.k==='cita'?citaCard(i):tareaCard(i)).join('')+'</div>':''):x.l.map(l=>{ const p=l.split(' · '); return `<div class="inf-ln"><span class="m">${esc(p[0])}</span>${p.slice(1).map(q=>`<div>${esc(q)}</div>`).join('')}</div>`; }).join('')}</div>`;
  });
  if(D.porP&&D.porP.length) h+=`<div class="card inf-sec" style="--c:var(--ink)"><div class="t">👪 Por persona</div><table style="width:100%;font-size:.88rem;margin-top:6px"><tr><th align="left">Persona</th><th>Citas</th><th>Tareas pend.</th></tr>`+D.porP.map(x=>`<tr><td>${esc(x.n)}</td><td align="center">${x.c}</td><td align="center">${x.tp}</td></tr>`).join('')+`</table></div>`;
  return h;
}
function infImprimir(){
  const w=window.open('','_blank'); if(!w){ toast('Permite las ventanas emergentes para imprimir'); return; }
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Informe</title><body style="font:14px system-ui;max-width:760px;margin:20px auto;padding:0 12px"><pre style="white-space:pre-wrap;font:inherit">${esc(infTexto())}</pre><script>setTimeout(()=>print(),300)<\/script>`);
  w.document.close();
}
document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-infdia],[data-infp],[data-infn],[data-infprint],[data-infcopy],[data-infshare]'); if(!t) return;
  const d=t.dataset, st=infSt();
  if(d.infdia){ st.sel=st.sel===d.infdia?null:d.infdia; render(); }
  else if(d.infp){ st.per=d.infp; st.off=0; st.sel=null; render(); }
  else if(d.infn){ st.off=Math.min(0,st.off+Number(d.infn)); st.sel=null; render(); }
  else if('infprint' in d) infImprimir();
  else if('infcopy' in d){ try{ await navigator.clipboard.writeText(infTexto()); toast('Informe copiado'); }catch(_){ toast('No se pudo copiar'); } }
  else if('infshare' in d){ if(navigator.share){ try{ await navigator.share({title:'Informe '+S.famNombre,text:infTexto()}); }catch(_){} } else { try{ await navigator.clipboard.writeText(infTexto()); toast('Informe copiado'); }catch(_){} } }
});
document.addEventListener('change',e=>{ if(e.target.id==='infpid'){ infSt().pid=e.target.value; render(); } });
