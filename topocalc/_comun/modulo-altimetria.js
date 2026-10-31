"use strict";
/* Módulo compartido del grupo «Altimetría y Nivelación».
   Generado a partir del index.html monolítico de topocalc. */
function svgTrianguloVertical(anguloDeg, Dh, hi, hm, desnivel, ext){
  ext=ext||{}; const K=svgKit(), hasH=hi!==undefined&&hm!==undefined&&!isNaN(hi)&&!isNaN(hm);
  const col={DH:'var(--success)',DI:'var(--blueprint)',dH:'var(--accent)',a:'var(--ink)',Hi:'var(--ink-soft)',hp:'var(--danger)'};
  if(ext.star==='a'){ col.a='var(--accent)'; col.dH='var(--ink)'; }
  const Di=ext.Di!==undefined?ext.Di:Dh/Math.max(Math.cos(toRad(anguloDeg)),1e-9);
  const rows=[{k:'ΔH',c:col.dH,v:`${fmtNum(desnivel,3)} m`},{k:'Dh',c:col.DH,v:`${fmtNum(Dh,3)} m`},{k:'Di',c:col.DI,v:`${fmtNum(Di,3)} m`},{k:'α',c:col.a,v:fmtAngle(anguloDeg)}];
  if(ext.pct!==undefined) rows.push({k:'Pendiente',c:col.a,v:`${fmtNum(ext.pct,2)} %`});
  if(hasH){ rows.push({k:'Hi',c:col.Hi,v:`${fmtNum(hi,3)} m`}); rows.push({k:'hp',c:col.hp,v:`${fmtNum(hm,3)} m`}); }
  K.list([rows],{perCol:3});
  let a=Math.max(-35,Math.min(anguloDeg,35)); if(Math.abs(a)<4) a=a<0?-4:4; if(ext.sign<0&&a>0) a=-a;
  const top=Math.max(K.listBottom+10,44), bot=176, vx=56, rodX=226, dx=rodX-vx;
  const dy=Math.min(58,dx*Math.tan(toRad(Math.abs(a))))*Math.sign(a);        // dy>0: B más arriba que el instrumento
  const hiPx=hasH?22:0, hpPx=hasH?22:0;
  const ymin=Math.min(0,-dy)-5, ymax=Math.max(hiPx,-dy+hpPx);
  const vy=(top+bot)/2-(ymin+ymax)/2, V=[vx,vy], P=[rodX,vy-dy], GA=[vx,vy+hiPx], GB=[rodX,vy-dy+hpPx];
  // terreno y mástiles
  if(hasH){ K.line(vx-14,GA[1]+(GA[1]-GB[1])*0.08,rodX+16,GB[1]-(GA[1]-GB[1])*0.08,'#8B6B47',{sw:1.2,noObs:false});
    K.line(...V,...GA,'var(--ink-soft)',{sw:0.8}); K.line(...P,...GB,'var(--ink-soft)',{sw:0.8}); }
  // horizontal (Dh), visual (Di) y ángulo
  K.line(vx,vy,rodX,vy,col.DH,{sw:1,dash:'2.4 2'}); K.line(rodX,vy,rodX,P[1],'var(--ink-soft)',{sw:0.7,dash:'1.6 1.6',noObs:false});
  K.line(...V,...P,col.DI,{sw:1.3});
  const ra=26; K.arc(vx,vy,ra,0,-a,col.a,{sw:0.9});
  // desnivel ΔH entre los puntos del terreno (a la derecha), con rayas de referencia
  const dhX=rodX+36; let u=Math.min(GA[1],GB[1]), d=Math.max(GA[1],GB[1]); if(d-u<14){ const m=(u+d)/2; u=m-7; d=m+7; }
  K.line(GA[0]+3,GA[1],dhX+3,GA[1],'var(--ink-soft)',{sw:0.6,dash:'1.6 1.6',noObs:false}); K.line(GB[0]+3,GB[1],dhX+3,GB[1],'var(--ink-soft)',{sw:0.6,dash:'1.6 1.6',noObs:false});
  K.line(dhX,u,dhX,d,col.dH,{sw:1.1});
  [u,d].forEach(y=>K.line(dhX-2,y,dhX+2,y,col.dH,{sw:1,noObs:false}));
  // Hi y hp
  if(hasH){ const hx=vx-12, px=rodX+11;
    K.line(hx,GA[1],hx,vy,col.Hi,{sw:1}); [GA[1],vy].forEach(y=>K.line(hx-2,y,hx+2,y,col.Hi,{sw:0.9,noObs:false}));
    K.line(px,GB[1],px,P[1],col.hp,{sw:1}); [GB[1],P[1]].forEach(y=>K.line(px-2,y,px+2,y,col.hp,{sw:0.9,noObs:false}));
    K.pointLabel('Hi',hx,(GA[1]+vy)/2,4.5,col.Hi,{dir:[-1,0],rmin:3,rmax:9,omit:false});
    K.pointLabel('hp',px,(GB[1]+P[1])/2,4.5,col.hp,{dir:[1,0],rmin:3,rmax:9,omit:false}); }
  // puntos
  K.dot(...GA,'var(--ink-soft)',2); K.dot(...GB,'var(--ink-soft)',2);
  if(hasH){ K.dot(...V,'var(--ink)',2.4); K.dot(...P,'var(--ink)',2.4); }
  K.pointLabel('A',GA[0],GA[1],4.5,'var(--ink-soft)',{dir:[-0.6,hasH?0.8:0.8],omit:false});
  K.pointLabel('B',GB[0],GB[1],4.5,'var(--ink-soft)',{dir:[0.6,0.8],omit:false});
  // magnitudes
  const up=a>0;
  K.lineLabel(vx,vy,rodX,vy,'Dh',4.5,col.DH,{at:0.62,out:[0,up?1:-1],extras:[0,3,6]});
  K.lineLabel(...V,...P,'Di',4.5,col.DI,{at:0.5,out:[0,up?-1:1],extras:[0,3,6]});
  K.lineLabel(dhX,u,dhX,d,'ΔH',4.5,col.dH,{out:[1,0],extras:[0,3]});
  const am=-a/2*Math.PI/180; K.pointLabel('α',vx+ra*Math.cos(am),vy+ra*Math.sin(am),4.5,col.a,{dir:[Math.cos(am),Math.sin(am)],rmin:2,rmax:9});
  return K.svg();
}
function svgPerfilNivel(cotas, labels){
  const w=300,h=170,pad=26;
  const vals = cotas.filter(v=>isFinite(v));
  if(vals.length<2) return '';
  const minC=Math.min(...vals), maxC=Math.max(...vals);
  const span=Math.max(maxC-minC,0.001);
  const n=cotas.length;
  const stepX=(w-2*pad)/Math.max(n-1,1);
  const px=i=> pad+i*stepX;
  const py=v=> (h-pad) - ((v-minC)/span)*(h-2*pad);
  let path='', dots='';
  cotas.forEach((c,i)=>{
    if(!isFinite(c)) return;
    path += `${path?'L':'M'} ${px(i).toFixed(1)} ${py(c).toFixed(1)} `;
    dots += `<circle cx="${px(i).toFixed(1)}" cy="${py(c).toFixed(1)}" r="3" fill="var(--accent)"/>
      <text x="${px(i).toFixed(1)}" y="${(py(c)-8).toFixed(1)}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">${fmtNum(c,2)}</text>
      ${labels&&labels[i]?`<text x="${px(i).toFixed(1)}" y="${h-8}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">${labels[i]}</text>`:''}`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="var(--line)" stroke-width="1"/>
    <path d="${path}" stroke="var(--blueprint)" stroke-width="1.8" fill="none"/>
    ${dots}
  </svg>`;
}
