"use strict";
/* Herramienta «Ajuste de Cuadrilátero (Triangulación)»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
function _resolverSistema(M, b){            // Gauss con pivoteo parcial: resuelve M·x = b (M cuadrada, pequeña)
  const n=b.length, A=M.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){
    let p=c; for(let r=c+1;r<n;r++) if(Math.abs(A[r][c])>Math.abs(A[p][c])) p=r;
    [A[c],A[p]]=[A[p],A[c]];
    for(let r=c+1;r<n;r++){ const k=A[r][c]/A[c][c]; for(let q=c;q<=n;q++) A[r][q]-=k*A[c][q]; }
  }
  const x=new Array(n).fill(0);
  for(let r=n-1;r>=0;r--){ let s=A[r][n]; for(let q=r+1;q<n;q++) s-=A[r][q]*x[q]; x[r]=s/A[r][r]; }
  return x;
}
function ajusteCuadrilateroAngulos(A1,A2,A3,A4,B1,B2,B3,B4){
  // Ángulos en GRADOS decimales. Convención: en el vértice i (A, B, C, D en el orden del dibujo), Ai = ángulo entre el lado
  // hacia el vértice siguiente y la diagonal; Bi = ángulo entre la diagonal y el lado hacia el vértice anterior.
  //   I: A1+A2+B2+B3 = 180° (triángulo ABC)   J: A2+A3+B3+B4 = 180° (BCD)   K: A3+A4+B4+B1 = 180° (CDA)
  //   Lado: senB1·senB2·senB3·senB4 = senA1·senA2·senA3·senA4 (ecuación de senos alrededor del cruce de las diagonales)
  const x0 = [A1,A2,A3,A4,B1,B2,B3,B4].map(toRad);           // orden: A1..A4, B1..B4
  const idx = [[0,1,5,6],[1,2,6,7],[2,3,4,7]];                // I, J, K
  const g = x => {                                            // residuos de las condiciones (rad; el de lado en log-senos)
    const r = idx.map(c=>c.reduce((s,i)=>s+x[i],0)-Math.PI);
    let ln=0; for(let i=0;i<4;i++) ln += Math.log(Math.sin(x[4+i]))-Math.log(Math.sin(x[i]));
    return [...r, ln];
  };
  const jac = (x,conLado)=>{                                  // jacobiana de las condiciones respecto de los 8 ángulos
    const J = idx.map(c=>{ const f=new Array(8).fill(0); c.forEach(i=>f[i]=1); return f; });
    if(conLado) J.push(x.map((v,i)=> (i<4?-1:1)/Math.tan(v)));
    return J;
  };
  // Mínima corrección v con g(x0+v)=0, linealizando alrededor del punto actual (Gauss-Helmert, iterado)
  const resolver = conLado => {
    const m = conLado?4:3; let v = new Array(8).fill(0);
    for(let it=0; it<25; it++){
      const x = x0.map((a,i)=>a+v[i]), J = jac(x,conLado), gx = g(x).slice(0,m);
      const Jv = J.map(f=>f.reduce((s,a,i)=>s+a*v[i],0));
      const JJt = J.map(f=>J.map(h=>f.reduce((s,a,i)=>s+a*h[i],0)));
      const lam = _resolverSistema(JJt, Jv.map((a,i)=>a-gx[i]));
      const vn = new Array(8).fill(0).map((_,i)=>J.reduce((s,f,k)=>s+f[i]*lam[k],0));
      const paso = Math.max(...vn.map((a,i)=>Math.abs(a-v[i]))); v = vn;
      if(paso<1e-15) break;
    }
    return x0.map((a,i)=>toDeg(a+v[i]));
  };
  const K8 = ['A1','A2','A3','A4','B1','B2','B3','B4'], aObj = arr => Object.fromEntries(K8.map((k,i)=>[k,arr[i]]));
  const pre = resolver(false), fin = resolver(true);
  const c0 = g(x0);
  return {
    I: toDeg(c0[0]), J: toDeg(c0[1]), K: toDeg(c0[2]),        // cierres angulares observados (°)
    preliminares: aObj(pre),                                  // solo con las 3 condiciones de figura
    corrLadoDeg: Math.max(...fin.map((a,i)=>Math.abs(a-pre[i]))),  // mayor ajuste adicional por la condición de lado (°)
    finales: aObj(fin)
  };
}
function renderCuadrilateroTriangulacion(){
  const ang = (id,def)=>`<div class="field-row"><label for="${id}">${angleSimpleLabel()}</label><input type="number" step="any" id="${id}" value="${angleSimpleDefault(def)}"></div>`;
  const body = `<div class="field-card">
    <p class="tool-blurb" style="margin-top:0;">Cuadrilátero con sus 2 diagonales (vértices A, B, C, D en el orden del dibujo). En cada vértice i se miden 2 ángulos: <b>Ai</b> = entre el lado hacia el vértice siguiente y la diagonal; <b>Bi</b> = entre la diagonal y el lado hacia el vértice anterior.</p>
    <div class="field-inline2"><div><h3>A1</h3>${ang('qa_a1',45)}</div><div><h3>A2</h3>${ang('qa_a2',45)}</div></div>
    <div class="field-inline2"><div><h3>A3</h3>${ang('qa_a3',45)}</div><div><h3>A4</h3>${ang('qa_a4',45)}</div></div>
    <div class="field-inline2"><div><h3>B1</h3>${ang('qa_b1',45)}</div><div><h3>B2</h3>${ang('qa_b2',45)}</div></div>
    <div class="field-inline2"><div><h3>B3</h3>${ang('qa_b3',45)}</div><div><h3>B4</h3>${ang('qa_b4',45)}</div></div>
    <button class="btn" id="btnQA" type="button">Compensar</button>
    <div id="resQA"></div>
  </div>`;
  toolShell('cuadrilateroTriangulacion','Compensación de un cuadrilátero de triangulación con 2 diagonales por mínimos cuadrados: corrige los 8 ángulos observados con la menor corrección posible para que se cumplan las 3 condiciones de figura (suma 180° en cada triángulo) y la condición de lado (ecuación de senos). Los ángulos compensados cierran exactamente.', body);
  document.getElementById('btnQA').addEventListener('click', ()=>{
    const ids=['qa_a1','qa_a2','qa_a3','qa_a4','qa_b1','qa_b2','qa_b3','qa_b4'];
    const vals = ids.map(readAngleSimple);
    const box=document.getElementById('resQA');
    if(vals.some(isNaN)){ box.innerHTML=`<p class="err-msg">Completa los 8 ángulos.</p>`; return; }
    const [A1,A2,A3,A4,B1,B2,B3,B4] = vals;
    const r = ajusteCuadrilateroAngulos(A1,A2,A3,A4,B1,B2,B3,B4);
    const fA=(d)=>fmtAngle(d);
    box.innerHTML = `<div class="results" style="margin-top:14px;">
      <div class="result-row"><span class="k">Cierre I · triángulo ABC</span><span class="v">${fmtAngle(r.I)}</span></div>
      <div class="result-row"><span class="k">Cierre J · triángulo BCD</span><span class="v">${fmtAngle(r.J)}</span></div>
      <div class="result-row"><span class="k">Cierre K · triángulo CDA</span><span class="v">${fmtAngle(r.K)}</span></div>
      <div class="table-wrap" style="margin-top:10px;"><table class="data-table"><thead><tr><th>Ángulo</th><th>Observado</th><th>Corregido final</th></tr></thead><tbody>
        <tr><td>A1</td><td>${fA(A1)}</td><td>${fA(r.finales.A1)}</td></tr>
        <tr><td>A2</td><td>${fA(A2)}</td><td>${fA(r.finales.A2)}</td></tr>
        <tr><td>A3</td><td>${fA(A3)}</td><td>${fA(r.finales.A3)}</td></tr>
        <tr><td>A4</td><td>${fA(A4)}</td><td>${fA(r.finales.A4)}</td></tr>
        <tr><td>B1</td><td>${fA(B1)}</td><td>${fA(r.finales.B1)}</td></tr>
        <tr><td>B2</td><td>${fA(B2)}</td><td>${fA(r.finales.B2)}</td></tr>
        <tr><td>B3</td><td>${fA(B3)}</td><td>${fA(r.finales.B3)}</td></tr>
        <tr><td>B4</td><td>${fA(B4)}</td><td>${fA(r.finales.B4)}</td></tr>
      </tbody></table></div>
      <p class="tool-blurb" style="margin-top:8px;">Mayor ajuste adicional por la condición de lado: ${fmtNum(r.corrLadoDeg*3600,2)}".</p>
      <div class="plot-wrap">${svgCuadrilatero('tri', "coordenadas_de_una_curva.xlsx · hoja 'triangulacion'")}</div>
    </div>`;
  });
}

const RENDERERS = { cuadrilateroTriangulacion: renderCuadrilateroTriangulacion };
