"use strict";
/* Herramienta «Teorema de Pitágoras»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcPitagorasHipotenusa(a,b){ return Math.sqrt(a*a+b*b); }
function calcPitagorasCateto(c,a){ if(c<=a) return null; return Math.sqrt(c*c-a*a); }
function svgPitagoras(a,b,c){
  const W=320, H=190;
  const f = v => v.toFixed(2).replace(/\.?0+$/,'');
  const FONT = 'font-family="var(--font-body)" font-weight="700"';
  const eng = svgLblEngine(W,H);

  // ---- triángulo a escala dentro de la caja de la plantilla (160 × 120), centrado en x, base en y=170 ----
  const sc = Math.min(160/b, 120/a);
  const bx = Math.max(sc*b, 8), ay = Math.max(sc*a, 8);
  const x0 = 160 - bx/2, y0 = 170, x1 = x0+bx, y2 = y0-ay;
  const th = Math.atan2(ay,bx), thD = th*180/Math.PI;          // inclinación de la hipotenusa (A arriba → B abajo)
  const rs = Math.min(4, 0.4*Math.min(bx,ay));

  const rows = [
    {k:'A', c:'var(--blueprint)', v:`${fmtNum(a,3)} m`},
    {k:'B', c:'var(--success)',   v:`${fmtNum(b,3)} m`},
    {k:'C', c:'var(--accent)',    v:`${fmtNum(c,3)} m`}
  ];
  const tx = {}; rows.forEach(r=> tx[r.k] = `${r.k} = ${r.v}`);
  const listW = Math.max(...rows.map(r=>eng.tw(tx[r.k],4.32)));
  eng.rectFill(8.5, 6.5, 15.2+listW+1.5, 25.5);

  let out = '';
  out += `<path d="M${f(x0)} ${y0} L${f(x1)} ${y0}" fill="none" stroke="var(--success)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  out += `<path d="M${f(x0)} ${y0} L${f(x0)} ${f(y2)}" fill="none" stroke="var(--blueprint)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  out += `<path d="M${f(x1)} ${y0} L${f(x0)} ${f(y2)}" fill="none" stroke="var(--accent)" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  out += `<path d="M${f(x0+rs)} ${y0} L${f(x0+rs)} ${f(y0-rs)} L${f(x0)} ${f(y0-rs)}" fill="none" stroke="var(--ink-soft)" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  eng.seg(x0,y0,x1,y0); eng.seg(x0,y0,x0,y2); eng.seg(x1,y0,x0,y2); eng.seg(x0+rs,y0,x0+rs,y0-rs); eng.seg(x0+rs,y0-rs,x0,y0-rs);

  const lab = (t, fs, col, c) => { const q=eng.txtAttrs(c); out += `<text ${q.pos} ${FONT} font-size="${fs}" fill="${col}"${q.an}>${t}</text>\n`; };

  // C: a lo largo de la hipotenusa, por fuera (arriba a la derecha); si no cabe, se desliza o pasa al interior
  {
    const Lc = Math.hypot(bx,ay), mx=(x0+x1)/2, my=(y0+y2)/2, g=[Math.sin(th), -Math.cos(th)], u=[Math.cos(th), Math.sin(th)];
    const tmax = Math.max(0, Lc/2 - eng.tw(tx.C,4)/2 - 4), cands=[];
    for(let t=0;t<=tmax+1e-6;t+=3) for(const sg of [1,-1]){ if(t===0&&sg===-1) continue;
      [[1,1.9],[-1,4.8]].forEach(([ns,d],si)=> cands.push({x:mx+u[0]*t*sg+g[0]*ns*d, y:my+u[1]*t*sg+g[1]*ns*d, rot:thD, anchor:'middle', pen:t*0.4+si*6}));
    }
    lab(tx.C,4,'var(--accent)',eng.pick(tx.C,4,cands));
  }
  // B: bajo la base
  {
    const cands=[];
    for(let t=0;t<=90;t+=2) for(const sg of [1,-1]){ if(t===0&&sg===-1) continue;
      [4.5,9].forEach((dy,si)=> cands.push({x:160+t*sg, y:y0+dy, anchor:'middle', pen:t*0.3+si*6}));
    }
    lab(tx.B,4,'var(--success)',eng.pick(tx.B,4,cands));
  }
  // A: a la izquierda de la vertical (si no cabe, por el interior)
  {
    const cands=[], mid=(y0+y2)/2;
    for(let d=0; d<=70; d+=2) for(const sg of [1,-1]){ if(d===0&&sg===-1) continue;
      [[x0-1.9,0],[x0+4.8,6],[x0-8,8]].forEach(([xx,pp])=> cands.push({x:xx, y:mid+d*sg, rot:-90, anchor:'middle', pen:d*0.3+pp}));
    }
    lab(tx.A,4,'var(--blueprint)',eng.pick(tx.A,4,cands));
  }

  // listado (valor a continuación de su descriptor)
  rows.forEach((r,i)=>{
    const by = 12.521 + i*5.761;
    out += `<rect x="10.026" y="${f(by-3.457)}" width="3.457" height="3.457" fill="${r.c}"/>\n`;
    out += `<text x="15.211" y="${f(by)}" ${FONT} font-size="4.32"><tspan fill="${r.c}">${r.k}</tspan><tspan fill="var(--ink)"> = ${r.v}</tspan></text>\n`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${out}</svg>`;
}
function renderPitagoras(){
  const body = `
  <div class="field-card">
    <h3>Escribe 2 datos — el tercero se calcula solo</h3>
    ${fieldRow('Cateto a (m)','pi_a',3)}
    ${fieldRow('Cateto b (m)','pi_b',4)}
    ${fieldRow('Hipotenusa c (m)','pi_c',5)}
    <div id="pi_err"></div>
    <div class="plot-wrap" id="pi_plot"></div>
  </div>`;
  toolShell('pitagoras','c² = a² + b². Escribe cualquiera de los tres datos — los dos catetos, o un cateto y la hipotenusa — y el que falta se completa de inmediato. Útil para calcular distancias y alturas indirectas, y para comprobar escuadras en terreno (regla 3-4-5).', body, ['a','b','c']);

  const aEl=document.getElementById('pi_a'), bEl=document.getElementById('pi_b'), cEl=document.getElementById('pi_c');
  const errBox=document.getElementById('pi_err'), plotBox=document.getElementById('pi_plot');
  let updating=false;

  function redraw(){
    const a=val('pi_a'), b=val('pi_b'), c=val('pi_c');
    plotBox.innerHTML = ([a,b,c].every(n=>isFinite(n)&&n>0)) ? svgPitagoras(a,b,c) : '';
  }

  // Editar un cateto (a o b) siempre recalcula la hipotenusa (c).
  function fromAB(){
    if(updating) return;
    const a=val('pi_a'), b=val('pi_b');
    if(isNaN(a)||isNaN(b)||a<=0||b<=0) return;
    updating=true;
    cEl.value = round(calcPitagorasHipotenusa(a,b),4);
    updating=false;
    errBox.innerHTML='';
    redraw();
  }
  // Editar la hipotenusa (c) recalcula el cateto b a partir del cateto a vigente
  // (si a no calza con c, se recalcula a a partir de b en su lugar).
  function fromC(){
    if(updating) return;
    const c=val('pi_c');
    if(isNaN(c)||c<=0) return;
    const a=val('pi_a'), b=val('pi_b');
    updating=true;
    if(!isNaN(a) && a>0 && a<c){
      bEl.value = round(calcPitagorasCateto(c,a),4);
      errBox.innerHTML='';
    } else if(!isNaN(b) && b>0 && b<c){
      aEl.value = round(calcPitagorasCateto(c,b),4);
      errBox.innerHTML='';
    } else {
      errBox.innerHTML = `<p class="err-msg">La hipotenusa debe ser mayor que el cateto conocido.</p>`;
    }
    updating=false;
    redraw();
  }

  aEl.addEventListener('input', fromAB);
  bEl.addEventListener('input', fromAB);
  cEl.addEventListener('input', fromC);
  redraw();
}

const RENDERERS = { pitagoras: renderPitagoras };
