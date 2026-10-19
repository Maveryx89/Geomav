/* Recorrido guiado. Se muestra al entrar y cuando hay novedades (sube INTRO_VER y marca los pasos nuevos con since). */
const INTRO_VER=1;
function tourSteps(){
  const adm=isAdmin(), ed=isEditor(), yo=!!miPersonaId(), L=[];
  const add=o=>L.push(Object.assign({since:1},o));
  add({tab:yo?'mi':'familia',t:'Bienvenido/a',d:'Esta app reúne la información de la familia: personas, calendario, citas, tareas, medicamentos, colegio y salud. Te mostramos cada parte en un minuto.'});
  add({tab:yo?'mi':'familia',sel:'nav.tabs',t:'Barra inferior',d:'Desde aquí cambias de sección: Mi ficha, Familia, Calendario, Tareas y Más (donde está el resto).'});
  if(yo) add({tab:'mi',sel:'nav.tabs [data-tab="mi"]',t:'Mi ficha',d:'Es tu pantalla de inicio: tus dosis de hoy (se marcan con un toque), tus tareas, tus citas y los próximos eventos del colegio. Aquí también editas tu teléfono y tu contacto de emergencia.'});
  add({tab:'familia',sel:'nav.tabs [data-tab="familia"]',t:'Familia',d:'Todas las personas con su edad y próximo cumpleaños. Toca una para ver su ficha completa.'+(ed?' El botón + (abajo a la derecha) agrega una persona nueva.':'')});
  add({tab:'cal',sel:'.cal-g',t:'Calendario',d:'Muestra los feriados de Chile (en rojo), el santo del día, cumpleaños, citas médicas, tareas, eventos y actividades del colegio. Toca un día para ver su detalle más abajo.'});
  if(ed) add({tab:'cal',sel:'.fab',t:'Agregar desde el calendario',d:'El botón + crea una cita, un evento, una tarea o un evento escolar, con la fecha del día que tengas seleccionado.'});
  add({tab:'tareas',sel:'nav.tabs [data-tab="tareas"]',t:'Tareas del hogar',d:'Tareas asignadas a una persona, con fecha y repetición (diaria, semanal o mensual). Todos pueden marcarlas como hechas con un toque.'});
  add({tab:'mas',sel:'nav.tabs [data-tab="mas"]',t:'Más',d:'Aquí están las demás secciones: citas médicas, medicamentos, escolar, info útil'+(adm?', salud':'')+', ajustes y el manual de uso.'});
  add({tab:'citas',sel:'header.top',t:'Citas médicas',d:'Las horas de doctor de toda la familia, con fecha, lugar y motivo. También aparecen en el calendario.'+(ed?' Agrégalas con el botón +.':'')});
  add({tab:'meds',sel:'header.top',t:'Medicamentos',d:'Dosis y horarios de cada medicamento. Cada persona ve y marca solo las tomas de sus propios medicamentos.'+(adm?' Tú los administras con el botón +.':'')});
  add({tab:'escolar',sel:'header.top',t:'Escolar',d:'Horario semanal, pruebas y reuniones con fecha, y la lista de útiles con casillas para ir marcando.'});
  add({tab:'notas',sel:'header.top',t:'Info útil',d:'Teléfonos de emergencia, seguros, datos del colegio y todo lo que conviene tener a mano, ordenado por categorías.'});
  if(adm) add({tab:'salud',sel:'header.top',t:'Salud e historial',d:'Solo para administradores. Toca una persona para ver su ficha y su historial: exámenes con resultados fuera de rango marcados, diagnósticos, consultas, vacunas y PDFs adjuntos.'});
  add({tab:'ajustes',sel:'header.top',t:'Ajustes',d:(adm?'Invita familiares, cambia su rol y vincula cada cuenta con su persona. ':'Aquí ves tu rol y los miembros. ')+'También puedes exportar un respaldo y repetir este recorrido.'});
  add({tab:'manual',sel:'.hq',t:'Manual de uso',d:'El botón ? de arriba abre el manual con la explicación detallada de cada sección y las soluciones a los problemas más comunes.'});
  add({tab:yo?'mi':'familia',t:'¡Listo!',d:'Ya conoces la app. Puedes repetir este recorrido cuando quieras desde Ajustes.'});
  return L;
}
function introSeen(){ try{ return +(localStorage.getItem('familia_intro_v')||0); }catch(_){ return 0; } }
function introMark(){ try{ localStorage.setItem('familia_intro_v',String(INTRO_VER)); }catch(_){} }
function introAuto(){
  if(S._intro||!S.user||!S.fam||S.offline) return;
  S._intro=1;
  if(introSeen()<INTRO_VER) setTimeout(()=>introShow(false),300);
}
function introShow(all){
  const seen=introSeen(), nuevo=!all&&seen>0;
  let L=tourSteps(); if(!all) L=L.filter(s=>s.since>seen);
  if(!L.length){ introMark(); return; }
  document.querySelectorAll('.tour').forEach(x=>x.remove());
  const start=S.tab; let i=0;
  const root=document.createElement('div'); root.className='tour'; document.body.appendChild(root);
  const cerrar=()=>{ introMark(); window.removeEventListener('resize',ubica); document.removeEventListener('keydown',tecla); root.remove(); S.tab=start; S.hp=null; render(); window.scrollTo(0,0); };
  const tecla=e=>{ if(e.key==='Escape') cerrar(); };
  document.addEventListener('keydown',tecla);
  let target=null;
  function ubica(){
    const hole=root.querySelector('.thole'), card=root.querySelector('.tcard'); if(!card) return;
    const H=window.innerHeight;
    if(target&&document.contains(target)){
      const r=target.getBoundingClientRect(), p=6;
      hole.style.cssText=`display:block;left:${r.left-p}px;top:${r.top-p}px;width:${r.width+2*p}px;height:${r.height+2*p}px`;
      const ch=card.offsetHeight, below=H-r.bottom, above=r.top;
      let top=below>=above?Math.min(r.bottom+16,H-ch-16):Math.max(r.top-16-ch,16);
      card.style.top=Math.max(16,top)+'px';
    } else {
      hole.style.display='none';
      card.style.top=Math.max(16,(H-card.offsetHeight)/2)+'px';
    }
    root.querySelector('.tbd').style.background=target?'transparent':'rgba(10,34,64,.62)';
  }
  function pinta(){
    const s=L[i], last=i===L.length-1;
    S.tab=s.tab; S.hp=null; render(); window.scrollTo(0,0);
    root.innerHTML=`<div class="tbd"></div><div class="thole"></div><div class="tcard" role="dialog" aria-label="${esc(s.t)}">`
      +(nuevo?'<div class="te">Novedades</div>':'')+`<div class="tt">${esc(s.t)}</div><div class="td">${esc(s.d)}</div>`
      +`<div class="tf"><span class="m">${i+1} de ${L.length}</span><span class="grow"></span>${last?'':'<button class="tlink" data-ts>Saltar</button>'}${i>0?'<button class="ghost" data-tp>Atrás</button>':''}<button class="primary" data-tn>${last?'Terminar':'Siguiente'}</button></div></div>`;
    target=s.sel?document.querySelector(s.sel):null;
    if(target){ const fixed=getComputedStyle(target).position==='fixed'||target.closest('nav.tabs,header.top'); if(!fixed) target.scrollIntoView({block:'center'}); }
    requestAnimationFrame(()=>{ ubica(); setTimeout(ubica,120); });
  }
  root.onclick=e=>{
    if(e.target.closest('[data-tn]')){ if(i>=L.length-1) cerrar(); else { i++; pinta(); } }
    else if(e.target.closest('[data-tp]')){ if(i>0){ i--; pinta(); } }
    else if(e.target.closest('[data-ts]')) cerrar();
  };
  window.addEventListener('resize',ubica);
  pinta();
}
