"use strict";
/* Menú de Topo de Bolsillo: 12 botones de grupo -> herramientas del grupo (+ «Próximamente» del grupo).
   Ruta por hash: ''  = botones de grupo;  '#g-<id>' = herramientas de ese grupo. */
let homeScrollY = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const grupoRuta = () => { const m = location.hash.match(/^#g-(\w+)$/); return m ? GRUPOS.find(g => g.id === m[1]) : null; };
const nVisibles = g => g.tools.filter(id => !CATALOGO[id].oculta).length + PAGINAS.filter(p => p.grupo === g.id).length;

function tarjetaHerramienta(id, oculta){
  const t = CATALOGO[id];
  return `<button class="tool-card" data-tool="${id}" type="button">
      ${oculta ? '<span class="badge">Próximamente</span>' : ''}
      <span class="glyph">${t.icon}</span><span class="name">${t.name}</span><span class="desc">${t.desc}</span>
    </button>`;
}
function tarjetaPagina(p){
  return `<a class="tool-card" href="${raizApp()}${p.href}" style="text-decoration:none; color:inherit;">
      <span class="glyph">${p.icon}</span><span class="name">${p.name}</span><span class="desc">${p.desc}</span></a>`;
}
function tarjetaGrupo(g){
  const n = nVisibles(g), oc = g.tools.length - g.tools.filter(id => !CATALOGO[id].oculta).length;
  return `<button class="tool-card" data-grupo="${g.id}" type="button">
      ${n ? '' : '<span class="badge">Próximamente</span>'}
      <span class="glyph">${g.icon}</span><span class="name">${g.nombre}</span>
      <span class="desc">${g.desc}<br><b>${n ? n + ' herramienta' + (n === 1 ? '' : 's') : oc + ' en preparación'}</b></span>
    </button>`;
}
function conectar(raiz){
  raiz.querySelectorAll('.tool-card[data-tool]').forEach(b => b.addEventListener('click', () => { homeScrollY = window.scrollY; go(b.dataset.tool); }));
  raiz.querySelectorAll('.tool-card[data-grupo]').forEach(b => b.addEventListener('click', () => { homeScrollY = window.scrollY; location.hash = 'g-' + b.dataset.grupo; }));
}
function renderGrupos(){
  document.body.classList.add('home'); document.body.classList.remove('in-tool');
  document.getElementById('toolTitleTop').textContent = '';
  const main = document.getElementById('main');
  main.innerHTML = `<div class="buscador"><input type="search" id="buscarHerr" placeholder="Buscar: curva, UTM, nivel…" aria-label="Buscar herramienta" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></div><div id="resBusqueda" style="display:none;"></div>
  <div class="intro"><p>Calculadoras de topografía para el terreno o el gabinete, agrupadas por función. Sin conexión, sin instalación.</p>
  <p style="margin-top:8px;">El botón <strong style="color:var(--blueprint);">${angleSystem==='cent'?'CEN':'SEX'}</strong> arriba a la derecha cambia todos los ángulos entre sexagesimal (° ' ") y centesimal (gon).</p></div>
  <div class="card-grid" id="gridGrupos">${GRUPOS.map(tarjetaGrupo).join('')}</div>`;
  conectar(main);
  const inp = document.getElementById('buscarHerr'), resBox = document.getElementById('resBusqueda');
  const catDe = id => GRUPOS.find(g => g.id === CATALOGO[id].grupo).nombre;
  const corpus = {}; Object.keys(CATALOGO).forEach(id => { const d = CATALOGO[id]; corpus[id] = { nombre: norm(d.name), todo: norm(d.name+' '+d.desc.replace(/<[^>]*>/g,' ')+' '+catDe(id)) }; });
  const resto = () => main.querySelectorAll('.intro, #gridGrupos');
  inp.addEventListener('input', () => {
    const q = norm(inp.value).trim();
    if(!q){ resBox.style.display = 'none'; resBox.innerHTML = ''; resto().forEach(s => s.style.display = ''); return; }
    const t = q.split(/\s+/), enNombre = id => t.every(x => corpus[id].nombre.includes(x));
    const hall = Object.keys(CATALOGO).filter(id => !CATALOGO[id].oculta && t.every(x => corpus[id].todo.includes(x))).sort((a,b) => enNombre(b) - enNombre(a));
    const pags = PAGINAS.filter(p => t.every(x => norm(p.name+' '+p.desc).includes(x)));
    resto().forEach(s => s.style.display = 'none');
    const n = hall.length + pags.length;
    resBox.innerHTML = `<p class="res-info">${n ? n+' resultado'+(n===1?'':'s') : 'Sin resultados para «'+esc(inp.value.trim())+'». Prueba con otra palabra: curva, área, nivel, UTM, GPS…'}</p>` +
      (n ? `<div class="card-grid">${hall.map(id => tarjetaHerramienta(id,false)).join('')}${pags.map(tarjetaPagina).join('')}</div>` : '');
    resBox.style.display = ''; conectar(resBox);
  });
  inp.addEventListener('keydown', e => { if(e.key === 'Enter') inp.blur(); });
}
function renderGrupo(g){
  document.body.classList.remove('home'); document.body.classList.add('in-tool');
  document.getElementById('toolTitleTop').textContent = g.nombre;
  const vis = g.tools.filter(id => !CATALOGO[id].oculta), oc = g.tools.filter(id => CATALOGO[id].oculta);
  const pags = PAGINAS.filter(p => p.grupo === g.id);
  const main = document.getElementById('main');
  main.innerHTML = `<p class="tool-blurb">${g.desc}.</p>
    ${vis.length || pags.length ? `<div class="card-grid">${vis.map(id => tarjetaHerramienta(id,false)).join('')}${pags.map(tarjetaPagina).join('')}</div>` : ''}
    ${oc.length ? `<details class="proximamente"${vis.length||pags.length ? '' : ' open'}><summary>Próximamente <span class="count">${oc.length}</span></summary>
      <div class="card-grid">${oc.map(id => tarjetaHerramienta(id,true)).join('')}</div></details>` : ''}`;
  conectar(main);
}
function render(){
  /* Enlaces antiguos (index.html#curvaC): llevan a la carpeta de la herramienta */
  const _h = location.hash.slice(1);
  if(_h && !/^g-/.test(_h) && CATALOGO[_h]){ location.replace(urlHerramienta(_h)); return; }
  const g = grupoRuta();
  if(g) { renderGrupo(g); window.scrollTo(0,0); }
  else { renderGrupos(); requestAnimationFrame(() => window.scrollTo(0, homeScrollY)); }
  mejorarAccesibilidad();
}
window.addEventListener('hashchange', render);
document.getElementById('backBtn').addEventListener('click', () => { if(grupoRuta()) location.hash = ''; else go('home'); });
initAds();
render();
comprobarCompraSinAnuncios();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/topocalc/service-worker.js').catch(e => console.warn('SW registration failed:', e)); });
}
