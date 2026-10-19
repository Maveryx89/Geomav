/* Presentación de bienvenida. Se muestra al entrar y cuando hay novedades (sube INTRO_VER y marca las nuevas con since). */
const INTRO_VER=1;
function introSlides(){
  const adm=isAdmin(), ed=isEditor(), yo=!!miPersonaId();
  return [
    {since:1,ic:'👪',t:'Bienvenido a Familia',d:'Toda la información de la familia en un solo lugar: personas, calendario, salud, tareas y más.'},
    yo?{since:1,ic:'🙋',t:'Mi ficha',d:'Al abrir la app verás primero lo tuyo: dosis del día, tareas, citas y próximos eventos del colegio.'}
      :{since:1,ic:'👪',t:'Familia',d:'Cada persona tiene su ficha con teléfono, contacto de emergencia, cumpleaños y notas.'},
    {since:1,ic:'📅',t:'Calendario',d:'Feriados de Chile, santos, cumpleaños, citas, tareas y eventos en un mismo lugar.'+(ed?' Usa el botón + para agregar rápido.':'')},
    {since:1,ic:'✅',t:'Tareas, medicamentos y colegio',d:'Marca tareas y útiles como hechos'+(yo?' y registra tus tomas de medicamentos':'')+'. Todo se sincroniza entre los celulares de la familia.'},
    adm?{since:1,ic:'🩺',t:'Historial de salud',d:'En Más → Salud cargas exámenes, diagnósticos, consultas y PDFs de cada persona. Solo los administradores lo ven.'}
       :{since:1,ic:'🔐',t:'Tu rol: '+(ROL[S.role]||S.role),d:ed?'Puedes agregar y editar datos de la familia. La sección Salud es solo para administradores.':'Puedes ver todo y marcar tareas. Para agregar o cambiar datos, pide a un administrador.'},
    {since:1,ic:'📲',t:'Instálala en tu celular',d:'En el menú del navegador elige “Agregar a pantalla de inicio”. Para ingresar usa el código de 8 dígitos que llega a tu correo.'}
  ];
}
function introSeen(){ try{ return +(localStorage.getItem('familia_intro_v')||0); }catch(_){ return 0; } }
function introMark(){ try{ localStorage.setItem('familia_intro_v',String(INTRO_VER)); }catch(_){} }
function introAuto(){
  if(S._intro||!S.user||!S.fam) return;
  S._intro=1;
  if(introSeen()<INTRO_VER) introShow(false);
}
function introShow(all){
  const seen=introSeen();
  let L=introSlides();
  const nuevo=!all&&seen>0;
  if(!all) L=L.filter(s=>s.since>seen);
  if(!L.length){ introMark(); return; }
  document.querySelectorAll('.intro').forEach(x=>x.remove());
  let i=0;
  const el=document.createElement('div'); el.className='intro'; document.body.appendChild(el);
  const cerrar=()=>{ introMark(); el.remove(); };
  const pinta=()=>{
    const s=L[i], last=i===L.length-1;
    el.innerHTML=`<div class="itop"><span class="m" style="color:#C9D3E0">${nuevo?'Novedades':'Presentación'}</span>${last?'<span></span>':'<button class="ghost sm" data-ix>Omitir</button>'}</div>`
      +`<div class="sl"><div class="ic">${s.ic}</div><div class="it">${esc(s.t)}</div><div class="id">${esc(s.d)}</div></div>`
      +`<div class="dots">${L.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>`
      +`<div class="ibtn">${i>0?'<button class="ghost" data-ip>Atrás</button>':''}<button class="accent grow" data-in>${last?'Empezar':'Siguiente'}</button></div>`;
  };
  const sig=()=>{ if(i>=L.length-1) cerrar(); else { i++; pinta(); } };
  const ant=()=>{ if(i>0){ i--; pinta(); } };
  el.onclick=e=>{ if(e.target.closest('[data-in]')) sig(); else if(e.target.closest('[data-ip]')) ant(); else if(e.target.closest('[data-ix]')) cerrar(); };
  let x0=null;
  el.addEventListener('touchstart',e=>{ x0=e.touches[0].clientX; },{passive:true});
  el.addEventListener('touchend',e=>{ if(x0===null) return; const dx=e.changedTouches[0].clientX-x0; x0=null; if(dx<-50) sig(); else if(dx>50) ant(); },{passive:true});
  pinta();
}
