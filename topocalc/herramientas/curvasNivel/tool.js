"use strict";
/* Herramienta «Curvas de Nivel»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function calcCurvaNivelInterp(e1,n1,cota1,e2,n2,cota2,cotaObjetivo){
  if(cota2===cota1) return null;
  const t = (cotaObjetivo-cota1)/(cota2-cota1);
  return {t, E: e1+t*(e2-e1), N: n1+t*(n2-n1), dentro: t>=0 && t<=1};
}
function renderCurvasNivel(){
  const body = `<div class="field-card">
    <h3>Punto 1</h3>
    <div class="field-inline">${fieldRow('Este','cn_e1',5000)}${fieldRow('Norte','cn_n1',10000)}${fieldRow('Cota','cn_c1',142.30)}</div>
    <h3 style="margin-top:14px;">Punto 2</h3>
    <div class="field-inline">${fieldRow('Este','cn_e2',5080)}${fieldRow('Norte','cn_n2',10060)}${fieldRow('Cota','cn_c2',149.80)}</div>
    ${fieldRow('Cota de la curva de nivel buscada','cn_obj',145)}
    <button class="btn" id="btnCN" type="button">Calcular</button>
    <div id="resCN"></div>
  </div>`;
  toolShell('curvasNivel','Ubica por interpolación lineal el punto exacto donde una curva de nivel de cota conocida cruza el segmento entre dos puntos ya cotizados.', body);
  document.getElementById('btnCN').addEventListener('click', ()=>{
    const e1=val('cn_e1'),n1=val('cn_n1'),c1=val('cn_c1'),e2=val('cn_e2'),n2=val('cn_n2'),c2=val('cn_c2'),obj=val('cn_obj');
    const box=document.getElementById('resCN');
    if([e1,n1,c1,e2,n2,c2,obj].some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa todos los campos.</p>`; return; }
    const r = calcCurvaNivelInterp(e1,n1,c1,e2,n2,c2,obj);
    if(!r){ box.innerHTML=`<p class="err-msg">Los dos puntos tienen la misma cota — no hay interpolación posible.</p>`; return; }
    box.innerHTML = `<div class="results" style="margin-top:12px;">
      <div class="result-row"><span class="k">Este</span><span class="v accent big">${fmtNum(r.E,3)}</span></div>
      <div class="result-row"><span class="k">Norte</span><span class="v accent big">${fmtNum(r.N,3)}</span></div>
      <div class="result-row"><span class="k">Ubicación</span><span class="v"><span class="pill ${r.dentro?'ok':'bad'}"><span class="dot"></span>${r.dentro?'dentro del tramo':'fuera del tramo (extrapolado)'}</span></span></div>
      <div class="plot-wrap">${svgPerfilNivel([c1,obj,c2],['P1','curva','P2'])}</div>
    </div>`;
  });
}

const RENDERERS = { curvasNivel: renderCurvasNivel };
