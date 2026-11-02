"use strict";
/* Módulo compartido del grupo «Geodesia y GNSS».
   Generado a partir del index.html monolítico de topocalc. */
function svgGeodesicaEsquema(az1Deg, az2Deg, label1, label2, fuente){
  const w=300,h=190,pad=34;
  const x1=pad+16, x2=w-pad-16, ymid=h/2+18;
  const bulge=16;
  const path=`M${x1} ${ymid} Q${w/2} ${ymid-bulge} ${x2} ${ymid}`;
  const rose=(cx,cy,azDeg,color)=>{
    if(azDeg===undefined||azDeg===null||isNaN(azDeg)) return '';
    const r=16, a=toRad(azDeg);
    const ex=cx+r*Math.sin(a), ey=cy-r*Math.cos(a);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="0.8"/>
      <line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${color}" stroke-width="1.6"/>
      <text x="${cx}" y="${(cy-r-5).toFixed(1)}" font-size="7.5" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">N</text>
      <text x="${cx}" y="${(cy+r+11).toFixed(1)}" font-size="7.5" font-family="var(--font-mono)" fill="${color}" text-anchor="middle">Az=${fmtNum(azDeg,2)}°</text>`;
  };
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" stroke="var(--blueprint)" stroke-width="2" fill="none"/>
    <circle cx="${x1}" cy="${ymid}" r="3.4" fill="var(--ink)"/>
    <circle cx="${x2}" cy="${ymid}" r="3.4" fill="var(--ink)"/>
    <text x="${x1}" y="${ymid+22}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">${label1}</text>
    <text x="${x2}" y="${ymid+22}" font-size="9" font-family="var(--font-mono)" fill="var(--ink-soft)" text-anchor="middle">${label2}</text>
    ${rose(x1,ymid-46,az1Deg,'var(--accent)')}
    ${rose(x2,ymid-46,az2Deg,'var(--blueprint)')}
    ${fuente?svgFuente(fuente,w,h):''}
  </svg>`;
}
