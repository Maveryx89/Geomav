"use strict";
/* Herramienta «Alinear fotos»: alinea (coordina) fotos tomadas desde el mismo punto en fechas distintas, por lotes y en grupos.
   Sirve para fotos 360° (giro, inclinación y horizonte) y para fotos normales (homografía), con visor de comparación.
   El motor (motor.js) reutiliza las rutinas de alineación del Editor de tours 360° de GEOMAV. Todo se procesa en el equipo. */
const AF = { grupos:[], sel:null, cmp:'opac', val:50, hires:false, vis:null, uid:0, pick:null, gen:0, tokR:null };
const AF_EXT = /\.(jpe?g|png|webp|avif|bmp|gif)$/i;
const AF_NO = {insp:'es el archivo crudo de Insta360 (doble ojo de pez). Expórtalo como JPG desde la app o Insta360 Studio.', insv:'es video, no imagen.', dng:'los RAW (DNG) no se pueden leer; expórtalo como JPG.', heic:'HEIC no es compatible con todos los navegadores; expórtalo como JPG.', heif:'HEIF no es compatible; expórtalo como JPG.', tif:'TIFF no es compatible; expórtalo como JPG.', tiff:'TIFF no es compatible; expórtalo como JPG.'};
function afId(p){ return (p||'a') + (++AF.uid); }
function afEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function afR2(v){ return Math.round(v*100)/100; }
function afBase(n){ return String(n||'foto').replace(/\.[^.]+$/,'').replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g,'_').trim() || 'foto'; }
function afKindOf(w,h){ const r = w/h; return (r>1.9 && r<2.1 && w>=1500) ? '360' : 'plano'; }
function afKindG(g, ref){ if(g.tipo !== 'auto') return g.tipo; const r = ref || g.ref || g.items[0]; return r ? r.kind : 'plano'; }
function afNuevoRot(){ return {yaw:0, pitch:0, roll:0, tx:0, ty:0, tz:0, model:'suelo', dist:30, h:1.6}; }
function afNuevoGrupo(){ const g = {id:afId('g'), nombre:'Grupo '+(AF.grupos.length+1), tipo:'auto', ref:null, items:[]}; AF.grupos.push(g); return g; }
function afGrupo(id){ return AF.grupos.find(g=>g.id===id); }
function afMsg(t, err){ const e = document.getElementById('afMsg'); if(e){ e.textContent = t||''; e.className = 'af-msg' + (err?' err':''); } }
function afMsgG(t, err){ const e = document.getElementById('afGlob'); if(e){ e.textContent = t||''; e.className = 'af-msg' + (err?' err':''); } }

function afCargarImagen(file){
  return new Promise((res, rej)=>{
    const ext = (file.name.split('.').pop()||'').toLowerCase();
    if(AF_NO[ext]){ rej(new Error(file.name + ': ' + AF_NO[ext])); return; }
    if(!(file.type||'').startsWith('image/') && !AF_EXT.test(file.name)){ rej(new Error(file.name + ': no es una imagen compatible (usa JPG, PNG o WebP).')); return; }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = ()=>{
      const w = img.naturalWidth, h = img.naturalHeight, k = 96/Math.max(w,h), c = document.createElement('canvas');
      c.width = Math.max(1,Math.round(w*k)); c.height = Math.max(1,Math.round(h*k));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      res({id:afId('f'), name:file.name, url, img, w, h, kind:afKindOf(w,h), thumb:c.toDataURL('image/jpeg',.7),
           rot:afNuevoRot(), autoT:null, auto:null, useShift:false, H:null, man:{dx:0,dy:0,rot:0,esc:100}, estado:'pend', msg:'', mod:false});
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); rej(new Error(file.name + ': no se pudo leer la imagen.')); };
    img.src = url;
  });
}
function afLiberar(it){ if(it && it.url){ try{ URL.revokeObjectURL(it.url); }catch(e){} } if(AF.vis) AF.vis.olvidar(it); }
function afMarcarTipo(g, it){
  if(g.tipo === 'auto' && g.ref && it !== g.ref && it.kind !== g.ref.kind){
    it.estado = 'err'; it.msg = 'Tipo distinto a la referencia ('+(it.kind==='360'?'360°':'normal')+' vs '+(g.ref.kind==='360'?'360°':'normal')+'). Cambia «Tipo» del grupo si corresponde.';
  } else if(it.estado === 'err' && /^Tipo distinto/.test(it.msg)){ it.estado = 'pend'; it.msg = ''; }
}
async function afAgregar(g, files, comoRef){
  const lista = Array.from(files||[]); if(!lista.length) return;
  const errores = []; let n = 0;
  for(const f of lista){
    afMsgG('Cargando ' + (++n) + ' de ' + lista.length + '…');
    try{
      const it = await afCargarImagen(f);
      if(comoRef || !g.ref){ if(g.ref) afLiberar(g.ref); g.ref = it; g.items.forEach(x=>afMarcarTipo(g,x)); comoRef = false; }
      else { afMarcarTipo(g, it); g.items.push(it); }
      if(!AF.sel) AF.sel = {g:g.id, i:(g.ref === it ? null : it.id)};
    }catch(e){ errores.push(e.message); }
    await new Promise(r=>setTimeout(r,0));
  }
  afMsgG(errores.length ? errores.join(' · ') : '', !!errores.length);
  afDrawList(); afCtrl(); afRefresh();
}

/* ===================== Visor de comparación (WebGL2) ===================== */
const AF_VS = `#version 300 es
in vec2 aP; out vec2 vP;
void main(){ vP = aP; gl_Position = vec4(aP, 0.0, 1.0); }`;
const AF_FS = `#version 300 es
precision highp float;
in vec2 vP; out vec4 oC;
uniform sampler2D uA, uB;
uniform int uMode, uCmp;
uniform float uVal, uGain;
uniform vec2 uRes;
uniform vec3 uF, uR, uU; uniform float uTan; uniform mat3 uM;
uniform vec4 uView; uniform mat3 uH;
const float PI = 3.14159265359;
vec2 eq(vec3 d){ return vec2(atan(d.x, d.z)/(2.0*PI) + 0.5, 0.5 - asin(clamp(d.y,-1.0,1.0))/PI); }
void main(){
  vec4 cA, cB; float inA = 1.0, inB = 1.0;
  if(uMode == 0){
    float asp = uRes.x/uRes.y;
    vec3 d = normalize(uF + uR*(vP.x*uTan*asp) + uU*(vP.y*uTan));
    cA = texture(uA, eq(d)); cB = texture(uB, eq(uM*d));
  } else {
    vec2 uv = vec2(uView.x + (vP.x*0.5+0.5)*uView.z, uView.y + (0.5 - vP.y*0.5)*uView.w);
    inA = step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
    vec3 h = uH*vec3(uv,1.0); vec2 b = h.xy/h.z;
    inB = step(0.0,b.x)*step(b.x,1.0)*step(0.0,b.y)*step(b.y,1.0)*step(0.0001,abs(h.z));
    cA = texture(uA, uv); cB = texture(uB, b);
  }
  vec3 bg = vec3(0.043,0.063,0.082);
  vec3 a = mix(bg, cA.rgb, inA), b2 = mix(bg, cB.rgb, inB), c;
  float s = vP.x*0.5 + 0.5;
  if(uCmp == 0) c = mix(a, b2, uVal);
  else if(uCmp == 1){ c = s < uVal ? a : b2; float dx = (s-uVal)*uRes.x, ax = abs(dx); if(ax < 3.0) c = vec3(1.0); else if(ax < 4.5) c = vec3(0.08);
    float R = max(22.0, 0.05*min(uRes.x,uRes.y)); vec2 hp = vec2(dx, vP.y*0.5*uRes.y); float hd = length(hp);
    if(hd < R){ c = vec3(1.0); if(ax > R*0.22 && ax < R*0.65 && abs(hp.y) < (R*0.65-ax)*0.9) c = vec3(0.08); } else if(hd < R+2.5) c = vec3(0.08); }
  else if(uCmp == 2) c = (inA*inB > 0.5) ? clamp(abs(cA.rgb-cB.rgb)*uGain, 0.0, 1.0) : bg;
  else if(uCmp == 3) c = a;
  else c = b2;
  oC = vec4(c, 1.0);
}`;
function afShader(gl, tipo, src){
  const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function afColMajor(m){ return new Float32Array([m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]]); }   // fila-mayor -> columna-mayor
function afRot3(M){ return [M[0][0],M[0][1],M[0][2],M[1][0],M[1][1],M[1][2],M[2][0],M[2][1],M[2][2]]; }

class AFVisor{
  constructor(canvas){
    this.cv = canvas; this.ok = false; this.tex = new Map(); this.dirty = true;
    this.kind = '360'; this.cam = {yaw:0, pitch:0, fov:90}; this.view = {cx:.5, cy:.5, z:1}; this.aAsp = 1.5;
    this.M = afRot3([[1,0,0],[0,1,0],[0,0,1]]); this.H = [1,0,0,0,1,0,0,0,1];
    this.cmp = 0; this.val = .5; this.tA = null; this.tB = null; this.blink = null;
    const gl = this.gl = canvas.getContext('webgl2', {antialias:false, alpha:false});
    if(!gl) return;
    try{
      const pr = this.pr = gl.createProgram();
      gl.attachShader(pr, afShader(gl, gl.VERTEX_SHADER, AF_VS)); gl.attachShader(pr, afShader(gl, gl.FRAGMENT_SHADER, AF_FS));
      gl.bindAttribLocation(pr, 0, 'aP'); gl.linkProgram(pr);
      if(!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    }catch(e){ console.warn('AFVisor', e); return; }
    gl.useProgram(this.pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.U = {}; ['uA','uB','uMode','uCmp','uVal','uGain','uRes','uF','uR','uU','uTan','uM','uView','uH'].forEach(n=>{ this.U[n] = gl.getUniformLocation(this.pr, n); });
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.ok = true; this.bind();
    this.ro = new ResizeObserver(()=>this.resize()); this.ro.observe(canvas); this.resize();
    const loop = ()=>{ if(this.dirty){ this.dirty = false; this.draw(); } this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  destruir(){ if(this.raf) cancelAnimationFrame(this.raf); if(this.ro) this.ro.disconnect(); if(this.blink) clearInterval(this.blink); }
  resize(){
    const d = Math.min(2, window.devicePixelRatio||1), w = Math.max(2, Math.round(this.cv.clientWidth*d)), h = Math.max(2, Math.round(this.cv.clientHeight*d));
    if(this.cv.width !== w || this.cv.height !== h){ this.cv.width = w; this.cv.height = h; }
    this.dirty = true;
  }
  clave(k){ return this.tex.get(k); }
  /* textura desde un canvas o imagen; se guarda en caché por clave (máx. 8) */
  textura(clave, fuente, esPlano){
    let t = this.tex.get(clave);
    if(t){ this.tex.delete(clave); this.tex.set(clave, t); return t; }
    const gl = this.gl; t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fuente);
    if(esPlano){ gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.tex.set(clave, t);
    if(this.tex.size > 8){ for(const k0 of Array.from(this.tex.keys())){ if(this.tex.size <= 8) break; if(k0 === clave || k0 === this.kA || k0 === this.kB) continue; gl.deleteTexture(this.tex.get(k0)); this.tex.delete(k0); } }
    return t;
  }
  olvidar(it){
    if(!this.ok) return;
    for(const k of Array.from(this.tex.keys())) if(k.indexOf(it.id + '|') === 0){ this.gl.deleteTexture(this.tex.get(k)); this.tex.delete(k); }
    if(this.kA && this.kA.indexOf(it.id+'|') === 0) this.tA = null; if(this.kB && this.kB.indexOf(it.id+'|') === 0) this.tB = null;
    this.dirty = true;
  }
  limpiarTodo(){ if(!this.ok) return; this.tex.forEach(t=>this.gl.deleteTexture(t)); this.tex.clear(); this.tA = this.tB = null; this.kA = this.kB = null; this.dirty = true; }
  fijar(o){   // {kind, kA, tA, kB, tB, M, H, aAsp}
    this.kind = o.kind; this.kA = o.kA; this.kB = o.kB; this.tA = o.tA; this.tB = o.tB;
    if(o.M) this.M = o.M; if(o.H) this.H = o.H; if(o.aAsp) this.aAsp = o.aAsp; this.dirty = true;
  }
  ajustes(cmp, val){ this.cmp = cmp; this.val = val; this.dirty = true; }
  reiniciarVista(){ this.cam = {yaw:0, pitch:0, fov:90}; this.view = {cx:.5, cy:.5, z:1}; this.dirty = true; }
  region(){   // región visible de la referencia en uv (modo normal)
    const c = this.cv.width/this.cv.height, a = this.aAsp, z = this.view.z;
    let rw, rh; if(a > c){ rw = 1/z; rh = rw*a/c; } else { rh = 1/z; rw = rh*c/a; }
    return {rw, rh, x0:this.view.cx - rw/2, y0:this.view.cy - rh/2};
  }
  mover(dx, dy){
    if(this.kind === '360'){ const dg = this.cam.fov/this.cv.clientHeight; this.cam.yaw -= dx*dg; this.cam.pitch = Math.max(-89, Math.min(89, this.cam.pitch + dy*dg)); }
    else { const r = this.region(); this.view.cx -= dx/this.cv.clientWidth*r.rw; this.view.cy -= dy/this.cv.clientHeight*r.rh;
      this.view.cx = Math.max(0, Math.min(1, this.view.cx)); this.view.cy = Math.max(0, Math.min(1, this.view.cy)); }
    this.dirty = true;
  }
  zoom(f, px, py){   // f>1 aleja; px,py = posición del cursor en la ventana
    if(this.kind === '360'){ this.cam.fov = Math.max(12, Math.min(110, this.cam.fov*f)); }
    else {
      const rect = this.cv.getBoundingClientRect(), fx = (px-rect.left)/rect.width, fy = (py-rect.top)/rect.height, r0 = this.region(), ux = r0.x0 + fx*r0.rw, uy = r0.y0 + fy*r0.rh;
      this.view.z = Math.max(1, Math.min(40, this.view.z/f)); const r1 = this.region();
      this.view.cx = ux - fx*r1.rw + r1.rw/2; this.view.cy = uy - fy*r1.rh + r1.rh/2;
    }
    this.dirty = true;
  }
  bind(){
    const cv = this.cv, pts = new Map(); let pd = 0;
    const cutX = e=>{ const r = cv.getBoundingClientRect(); return r.left + this.val*r.width; };
    const cutSet = e=>{ const r = cv.getBoundingClientRect(), v = Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)); this.val = v; this.dirty = true; AF.val = Math.round(v*100); const sl = document.getElementById('afVal'), tx = document.getElementById('afValT'); if(sl) sl.value = AF.val; if(tx) tx.textContent = AF.val; };
    let cutDrag = null;
    cv.addEventListener('pointerdown', e=>{ if(this.cmp === 1 && !this.blink && Math.abs(e.clientX - cutX(e)) < 30){ cv.setPointerCapture(e.pointerId); cutDrag = e.pointerId; cv.style.cursor = 'ew-resize'; cutSet(e); e.preventDefault(); return; }
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); cv.style.cursor = 'grabbing';
      if(pts.size === 2){ const a = Array.from(pts.values()); pd = Math.hypot(a[0][0]-a[1][0], a[0][1]-a[1][1]); } });
    cv.addEventListener('pointermove', e=>{
      if(cutDrag === e.pointerId){ cutSet(e); return; }
      if(!pts.size) cv.style.cursor = (this.cmp === 1 && Math.abs(e.clientX - cutX(e)) < 30) ? 'ew-resize' : 'grab';
      if(!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId), dx = e.clientX-p[0], dy = e.clientY-p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if(pts.size === 1) this.mover(dx, dy);
      else if(pts.size === 2){ const a = Array.from(pts.values()), d = Math.hypot(a[0][0]-a[1][0], a[0][1]-a[1][1]); if(pd > 0 && d > 0) this.zoom(pd/d, (a[0][0]+a[1][0])/2, (a[0][1]+a[1][1])/2); pd = d; }
    });
    const fin = e=>{ if(cutDrag === e.pointerId) cutDrag = null; pts.delete(e.pointerId); cv.style.cursor = 'grab'; pd = 0; };
    cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
    cv.addEventListener('wheel', e=>{ e.preventDefault(); this.zoom(Math.exp(e.deltaY*0.0015), e.clientX, e.clientY); }, {passive:false});
    cv.addEventListener('dblclick', ()=>this.reiniciarVista());
  }
  draw(){
    if(!this.ok) return;
    const gl = this.gl, U = this.U, w = this.cv.width, h = this.cv.height;
    gl.viewport(0, 0, w, h); gl.useProgram(this.pr);
    if(!this.tA){ gl.clearColor(0.043, 0.063, 0.082, 1); gl.clear(gl.COLOR_BUFFER_BIT); return; }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tA); gl.uniform1i(U.uA, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tB || this.tA); gl.uniform1i(U.uB, 1);
    gl.uniform1i(U.uMode, this.kind === '360' ? 0 : 1); gl.uniform1i(U.uCmp, this.cmp); gl.uniform1f(U.uVal, this.val); gl.uniform1f(U.uGain, 3);
    gl.uniform2f(U.uRes, w, h);
    const c = this.cam, yw = c.yaw*Math.PI/180, pt = c.pitch*Math.PI/180;
    gl.uniform3f(U.uF, Math.sin(yw)*Math.cos(pt), Math.sin(pt), Math.cos(yw)*Math.cos(pt));
    gl.uniform3f(U.uR, Math.cos(yw), 0, -Math.sin(yw));
    gl.uniform3f(U.uU, -Math.sin(yw)*Math.sin(pt), Math.cos(pt), -Math.cos(yw)*Math.sin(pt));
    gl.uniform1f(U.uTan, Math.tan(c.fov*Math.PI/360));
    gl.uniformMatrix3fv(U.uM, false, afColMajor(this.M));
    const r = this.region(); gl.uniform4f(U.uView, r.x0, r.y0, r.rw, r.rh);
    gl.uniformMatrix3fv(U.uH, false, afColMajor(this.H));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

/* ===================== Interfaz ===================== */
function afCur(){
  const g = AF.sel && afGrupo(AF.sel.g); if(!g) return {};
  const it = g.items.find(x=>x.id === AF.sel.i) || null;
  return {g, it, ref:g.ref};
}
function afEstadoTxt(it){
  if(it.estado === 'ok') return '✓ ' + it.msg + (it.mod ? ' · ajustada a mano' : '');
  if(it.estado === 'err') return '⚠ ' + it.msg;
  if(it.estado === 'trab') return '… ' + it.msg;
  return it.mod ? 'Ajustada a mano' : 'Sin alinear';
}
function afRowHtml(g, it, esRef){
  const on = AF.sel && AF.sel.g === g.id && (esRef ? AF.sel.i === null : AF.sel.i === it.id);
  const k = it.kind === '360' ? '360°' : 'normal';
  return `<div class="af-it${on?' on':''}${esRef?' ref':''}" data-act="sel" data-g="${g.id}" data-i="${esRef?'':it.id}">
    <img class="af-th" src="${it.thumb}" alt="">
    <div class="af-meta"><b title="${afEsc(it.name)}">${afEsc(it.name)}</b>
      <small class="${esRef?'':'st-'+it.estado}">${esRef ? 'Referencia · ' + k + ' · ' + it.w + '×' + it.h : afEstadoTxt(it)}</small></div>
    <div class="af-ib">${esRef ? '' : `<button type="button" data-act="alinear" data-g="${g.id}" data-i="${it.id}" title="Alinear esta foto con la referencia" aria-label="Alinear">⟳</button><button type="button" data-act="comoRef" data-g="${g.id}" data-i="${it.id}" title="Usar como referencia" aria-label="Usar como referencia">★</button>`}<button type="button" data-act="quitar" data-g="${g.id}" data-i="${esRef?'':it.id}" title="Quitar" aria-label="Quitar">✕</button></div>
  </div>`;
}
function afGrupoHtml(g){
  const k = afKindG(g), n = g.items.length;
  return `<section class="af-g" data-gid="${g.id}">
    <div class="af-gh"><input class="af-gn" data-act="nombre" data-g="${g.id}" value="${afEsc(g.nombre)}" aria-label="Nombre del grupo">
      <select data-act="tipo" data-g="${g.id}" aria-label="Tipo de fotos del grupo"><option value="auto"${g.tipo==='auto'?' selected':''}>Auto (${k==='360'?'360°':'normal'})</option><option value="360"${g.tipo==='360'?' selected':''}>360°</option><option value="plano"${g.tipo==='plano'?' selected':''}>Normal</option></select>
      <button type="button" data-act="delG" data-g="${g.id}" title="Eliminar grupo" aria-label="Eliminar grupo">🗑</button></div>
    ${g.ref ? afRowHtml(g, g.ref, true) : '<div class="af-empty">Sin foto de referencia. Agrega la foto base (o suelta aquí varias fotos: la primera será la referencia).</div>'}
    ${g.items.map(it=>afRowHtml(g, it, false)).join('')}
    <div class="af-gb"><button type="button" class="btn-sm" data-act="pickRef" data-g="${g.id}">＋ Referencia</button>
      <button type="button" class="btn-sm" data-act="pickItems" data-g="${g.id}">＋ Fotos a alinear</button>
      <button type="button" class="btn-sm af-pri" data-act="alinearG" data-g="${g.id}"${g.ref && n ? '' : ' disabled'}>⚙ Alinear grupo${n?' ('+n+')':''}</button>
      <button type="button" class="btn-sm" data-act="zipG" data-g="${g.id}"${g.ref && n ? '' : ' disabled'}>⬇ ZIP</button></div>
  </section>`;
}
function afDrawList(){
  const box = document.getElementById('afGrupos'); if(!box) return;
  box.innerHTML = AF.grupos.map(afGrupoHtml).join('');
}

/* ---- controles de la foto seleccionada ---- */
const AF_AX = [['yaw','Giro (yaw)',180,.1,'°'],['pitch','Inclinación (pitch)',90,.1,'°'],['roll','Horizonte (roll)',180,.1,'°']];
const AF_MN = [['dx','Desplazar horizontal',50,.1,'%'],['dy','Desplazar vertical',50,.1,'%'],['rot','Giro',45,.05,'°'],['esc','Escala',200,.1,'%']];
function afSlider(k, rotulo, lim, paso, u, v, min, max){
  return `<label for="afs_${k}">${rotulo}</label><div class="af-orr"><input type="range" id="afs_${k}" data-p="${k}" min="${min!=null?min:-lim}" max="${max!=null?max:lim}" step="${paso}" value="${v}"><input type="number" id="afn_${k}" data-p="${k}" min="${min!=null?min:-lim}" max="${max!=null?max:lim}" step="${paso}" value="${v}"><span>${u}</span></div>`;
}
function afCtrl(){
  const box = document.getElementById('afCtrl'); if(!box) return;
  const {g, it, ref} = afCur();
  const cmps = [['opac','Mezcla'],['cortina','Cortina'],['dif','Diferencia'],['parp','Parpadeo'],['A','Solo referencia'],['B','Solo foto']];
  let h = `<div class="af-seg" role="group" aria-label="Modo de comparación">${cmps.map(c=>`<button type="button" data-cmp="${c[0]}" class="${AF.cmp===c[0]?'on':''}">${c[1]}</button>`).join('')}</div>
    <label for="afVal">${AF.cmp==='cortina'?'Posición de la cortina (izquierda: referencia · derecha: foto)':'Mezcla (0 = referencia · 100 = foto)'}: <b id="afValT">${AF.val}</b>%</label>
    <input type="range" id="afVal" min="0" max="100" value="${AF.val}">`;
  if(g && it && ref){
    const k = afKindG(g, ref);
    if(k === '360'){
      h += '<h5>Ajuste de «' + afEsc(it.name) + '»</h5>' + AF_AX.map(a=>afSlider(a[0], a[1], a[2], a[3], a[4], it.rot[a[0]])).join('');
      h += `<div class="af-chk"><input type="checkbox" id="afShift"${it.useShift?' checked':''}><label for="afShift">Corregir también el desplazamiento de la cámara (paralaje)</label></div>
        <div id="afShiftBox" style="${it.useShift?'':'display:none'}">${afSlider('h','Altura de la cámara sobre el suelo',200,.1,'m',it.rot.h,.2,200)}<small>La alineación automática estima el desplazamiento con los puntos del suelo; indica la altura real de la cámara para que salga en metros.</small></div>`;
    } else {
      h += '<h5>Ajuste fino de «' + afEsc(it.name) + '»</h5>' + AF_MN.map(a=>afSlider(a[0], a[1], a[2], a[3], a[4], it.man[a[0]], a[0]==='esc'?50:null, a[0]==='esc'?200:null)).join('');
    }
    h += `<div class="af-gb"><button type="button" class="btn-sm af-pri" data-act="alinear" data-g="${g.id}" data-i="${it.id}">⟳ Alinear automáticamente</button>
      <button type="button" class="btn-sm" data-act="reset" data-g="${g.id}" data-i="${it.id}">Restablecer</button>
      <button type="button" class="btn-sm" data-act="dl" data-g="${g.id}" data-i="${it.id}">⬇ Descargar corregida</button></div>`;
  } else if(g && !ref){ h += '<p class="af-help">Agrega la foto de referencia del grupo para poder comparar.</p>'; }
  else if(g && ref && !it){ h += '<p class="af-help">Selecciona una foto del grupo para compararla con la referencia.</p>'; }
  h += '<small id="afMsg" class="af-msg" aria-live="polite"></small>';
  box.innerHTML = h;
}
function afSetParam(it, g, k, v){
  v = parseFloat(v); if(!isFinite(v)) return;
  const k360 = afKindG(g, g.ref) === '360';
  if(k360){
    if(k === 'h'){ it.rot.h = Math.max(.2, Math.min(200, v)); if(it.autoT){ AFMotor.applyAutoT(it); } }
    else { const a = AF_AX.find(x=>x[0]===k); it.rot[k] = afR2(Math.max(-a[2], Math.min(a[2], v))); }
  } else { const a = AF_MN.find(x=>x[0]===k); it.man[k] = afR2(Math.max(k==='esc'?50:-a[2], Math.min(a[2], v))); }
  it.mod = true; if(it.estado === 'err') it.estado = 'pend';
}

/* ---- visor: arma texturas y matrices ---- */
function afEscalado(img, maxLado){
  const k = Math.min(1, maxLado/Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth*k)); c.height = Math.max(1, Math.round(img.naturalHeight*k));
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height); return c;
}
async function afRefresh(){
  const V = AF.vis, hint = document.getElementById('afHint'); if(!V || !V.ok) return;
  const gen = ++AF.gen, {g, it, ref} = afCur(), A = ref || it;
  if(!g || !A){ V.fijar({kind:'360', tA:null, tB:null}); if(hint) hint.style.display = ''; return; }
  if(hint) hint.style.display = 'none';
  const B = (ref && it) ? it : A, k = afKindG(g, A), plano = k !== '360';
  const cap = AF.hires ? Math.min(8192, V.maxTex) : Math.min(4096, V.maxTex);
  const lado = plano ? Math.min(4096, V.maxTex) : cap;
  const kA = A.id + '|' + k + '|' + lado, tA = V.textura(kA, afEscalado(A.img, lado), plano);
  let kB = B.id + '|' + k + '|' + lado, tB, M = afRot3([[1,0,0],[0,1,0],[0,0,1]]), H = [1,0,0,0,1,0,0,0,1];
  if(B === A){ kB = kA; tB = tA; }
  else if(plano){ tB = V.textura(kB, afEscalado(B.img, lado), true); H = AFMotor.planoM(B, A.w, A.h); }
  else if(AFMotor.hasShift(B.rot)){
    const sw = 3072, sh = 1536, cl = B.id + '|c|' + JSON.stringify(B.rot);
    if(V.tex.has(cl)) tB = V.textura(cl, null, false), kB = cl;
    else {
      afMsg('Aplicando corrección de desplazamiento…');
      if(AF.tokR) AF.tokR.dead = true; const tok = AF.tokR = {dead:false};
      const sd = AFMotor.imgData(B.img, sw, sh).data, c = await AFMotor.rotRender(sd, sw, sh, B.rot, sw, sh, false, tok, null);
      if(!c || gen !== AF.gen) return;
      tB = V.textura(cl, c, false); kB = cl; afMsg('');
    }
  } else { tB = V.textura(kB, afEscalado(B.img, lado), false); M = afRot3(AFMotor.rotMatrix(B.rot)); }
  if(gen !== AF.gen) return;
  V.fijar({kind:k, kA, tA, kB, tB, M, H, aAsp:A.w/A.h});
  afAplicaCmp();
}
function afAplicaCmp(){
  const V = AF.vis; if(!V) return;
  if(V.blink){ clearInterval(V.blink); V.blink = null; }
  const m = {opac:0, cortina:1, dif:2, A:3, B:4, parp:0}[AF.cmp];
  if(AF.cmp === 'parp'){ let on = false; V.ajustes(0, 0); V.blink = setInterval(()=>{ on = !on; V.ajustes(0, on ? 1 : 0); }, 650); }
  else V.ajustes(m, AF.val/100);
  const bd = document.getElementById('afBadge');
  if(bd){ const t = {opac:'Mezcla referencia ⇄ foto', cortina:'Cortina: izquierda referencia · derecha foto', dif:'Diferencia (más claro = más desfase)', parp:'Parpadeo referencia ⇄ foto', A:'Solo referencia', B:'Solo foto'}[AF.cmp]; bd.textContent = t; }
}

/* ---- alineación ---- */
function afAplicaAuto360(it){
  const r = it.auto, R = it.rot;
  R.yaw = afR2(r.p[0]); R.pitch = afR2(r.p[1]); R.roll = afR2(r.p[2]);
  if(it.useShift && r.ground){ it.autoT = {tx:r.p[3], ty:r.p[4], tz:r.p[5]}; R.model = 'suelo'; AFMotor.applyAutoT(it); }
  else { it.autoT = null; R.tx = R.ty = R.tz = 0; }
}
async function afAlinear(g, it, onP){
  const ref = g.ref; if(!ref) throw new Error('Falta la foto de referencia del grupo.');
  const k = afKindG(g, ref);
  if(g.tipo === 'auto' && it.kind !== ref.kind) throw new Error('Tipo distinto a la referencia. Cambia «Tipo» del grupo si corresponde.');
  it.estado = 'trab'; it.msg = 'procesando…'; afDrawList();
  try{
    if(k === '360'){
      if(!(it.w/it.h > 1.9 && it.w/it.h < 2.1) || !(ref.w/ref.h > 1.9 && ref.w/ref.h < 2.1)) throw new Error('Las fotos 360° deben ser equirectangulares 2:1.');
      const r = await AFMotor.autoAlign({base:{url:it.url}}, {url:ref.url}, onP);
      it.auto = r; afAplicaAuto360(it);
      const desp = it.useShift && r.ground, d = desp ? r.after : (r.ground ? r.afterRot : r.after);
      it.msg = 'Alineada · error ' + r.before.toFixed(2) + '° → ' + d.toFixed(2) + '° (' + r.n + ' puntos' + (desp ? ', con desplazamiento' : '') + ')';
    } else {
      const r = await AFMotor.autoAlignPlano(ref.url, it.url, onP);
      it.H = r.H; it.man = {dx:0, dy:0, rot:0, esc:100};
      it.msg = 'Alineada · ' + r.n + ' puntos · error ' + r.err.toFixed(1) + ' px';
    }
    it.estado = 'ok'; it.mod = false;
  }catch(e){ it.estado = 'err'; it.msg = e.message || 'No se pudo alinear.'; throw e; }
}
async function afAlinearLote(lista, titulo){
  let ok = 0, mal = 0; const t0 = lista.length;
  for(let n = 0; n < lista.length; n++){
    const {g, it} = lista[n];
    try{ await afAlinear(g, it, p=>afMsgG(titulo + ' · foto ' + (n+1) + ' de ' + t0 + ': ' + p)); ok++; }
    catch(e){ mal++; }
    afDrawList();
  }
  afMsgG(titulo + ': ' + ok + ' de ' + t0 + ' alineadas' + (mal ? ' · ' + mal + ' con problemas (míralas en la lista)' : '') + '.', !!mal && !ok);
  const gs = lista.length ? lista[0].g : null;
  if(gs && AF.sel && AF.sel.g === gs.id && !AF.sel.i){ const p = gs.items.find(x=>x.estado === 'ok'); if(p) AF.sel = {g:gs.id, i:p.id}; }
  afDrawList(); afCtrl(); await afRefresh();
}

/* ---- descargas ---- */
function afBlob(canvas){ return new Promise((res, rej)=>canvas.toBlob(b=>b ? res(b) : rej(new Error('No se pudo generar la imagen.')), 'image/jpeg', .95)); }
function afGuardar(blob, nombre){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000); }
async function afRender(g, it, onP){
  const ref = g.ref, k = afKindG(g, ref);
  if(k === '360'){
    const w = Math.min(it.w, 8192), h = Math.round(w/2), sd = AFMotor.imgData(it.img, w, h).data;
    return afBlob(await AFMotor.rotRender(sd, w, h, it.rot, w, h, true, null, onP));
  }
  const kk = Math.min(1, 6000/Math.max(ref.w, ref.h)), ow = Math.round(ref.w*kk), oh = Math.round(ref.h*kk);
  return afBlob(await AFMotor.renderPlano(it.img, AFMotor.planoM(it, ref.w, ref.h), ow, oh, onP));
}
function afParams(g, it){
  const k = afKindG(g, g.ref);
  return k === '360' ? {archivo:it.name, tipo:'360', yaw:it.rot.yaw, pitch:it.rot.pitch, roll:it.rot.roll, tx:it.rot.tx, ty:it.rot.ty, tz:it.rot.tz, alturaCamara:it.rot.h, estado:it.msg}
    : {archivo:it.name, tipo:'normal', homografiaUV:it.H, ajusteFino:it.man, estado:it.msg};
}
async function afZip(grupos){
  const lista = []; grupos.forEach(g=>{ if(g.ref) g.items.forEach(it=>{ if(it.estado !== 'err') lista.push({g, it}); }); });
  if(!lista.length){ afMsgG('No hay fotos listas para exportar.', true); return; }
  const JSZip = await AFMotor.loadZip(), z = new JSZip(), info = [];
  for(let n = 0; n < lista.length; n++){
    const {g, it} = lista[n];
    afMsgG('Generando imagen ' + (n+1) + ' de ' + lista.length + '…');
    const b = await afRender(g, it, p=>afMsgG('Imagen ' + (n+1) + ' de ' + lista.length + ' · ' + Math.round(p*100) + '%'));
    const dir = afBase(g.nombre), nom = afBase(it.name) + '_alineada.jpg';
    z.file(dir + '/' + nom, b, {compression:'STORE'}); info.push(Object.assign({grupo:g.nombre, referencia:g.ref.name, salida:dir + '/' + nom}, afParams(g, it)));
  }
  z.file('alineacion.json', JSON.stringify(info, null, 2));
  afGuardar(await z.generateAsync({type:'blob'}), 'fotos_alineadas.zip');
  afMsgG('ZIP listo: ' + lista.length + ' imagen(es).');
}

/* ---- eventos ---- */
function afQuitar(g, id){
  if(id){ const i = g.items.findIndex(x=>x.id === id); if(i >= 0){ afLiberar(g.items[i]); g.items.splice(i, 1); } if(AF.sel && AF.sel.i === id) AF.sel = {g:g.id, i:null}; }
  else if(g.ref){ afLiberar(g.ref); g.ref = null; g.items.forEach(x=>{ if(x.estado === 'err' && /^Tipo distinto/.test(x.msg)){ x.estado = 'pend'; x.msg = ''; } }); if(AF.sel && AF.sel.i === null) AF.sel = null; }
}
async function afClick(e){
  const el = e.target.closest('[data-act],[data-cmp]'); if(!el) return;
  if(el.dataset.cmp){ AF.cmp = el.dataset.cmp; afCtrl(); afAplicaCmp(); return; }
  const act = el.dataset.act, g = afGrupo(el.dataset.g), id = el.dataset.i;
  if(act === 'nuevoG'){ const n = afNuevoGrupo(); AF.sel = AF.sel || null; afDrawList(); return; }
  if(act === 'alinearTodo'){ const l = []; AF.grupos.forEach(x=>{ if(x.ref) x.items.forEach(it=>{ if(it.estado !== 'ok') l.push({g:x, it}); }); }); if(!l.length){ afMsgG('No hay fotos pendientes de alinear.'); return; } await afAlinearLote(l, 'Alinear todo'); return; }
  if(act === 'zipTodo'){ try{ await afZip(AF.grupos); }catch(er){ afMsgG(er.message, true); } return; }
  if(!g) return;
  const it = id ? g.items.find(x=>x.id === id) : null;
  switch(act){
    case 'sel': AF.sel = {g:g.id, i:id || null}; afDrawList(); afCtrl(); afRefresh(); break;
    case 'delG': if(!g.ref && !g.items.length || confirm('¿Eliminar el grupo «' + g.nombre + '» y sus fotos?')){ if(g.ref) afLiberar(g.ref); g.items.forEach(afLiberar); AF.grupos.splice(AF.grupos.indexOf(g), 1); if(AF.sel && AF.sel.g === g.id) AF.sel = null; afDrawList(); afCtrl(); afRefresh(); } break;
    case 'pickRef': case 'pickItems': { AF.pick = {g:g.id, ref:act === 'pickRef'}; const f = document.getElementById('afFile'); f.multiple = act === 'pickItems'; f.value = ''; f.click(); break; }
    case 'quitar': afQuitar(g, id); afDrawList(); afCtrl(); afRefresh(); break;
    case 'comoRef': if(it){ const v = g.ref; g.ref = it; g.items.splice(g.items.indexOf(it), 1); if(v) g.items.unshift(v); g.items.forEach(x=>{ x.estado = 'pend'; x.msg = ''; x.H = null; x.auto = null; x.autoT = null; x.rot = afNuevoRot(); x.man = {dx:0,dy:0,rot:0,esc:100}; x.mod = false; afMarcarTipo(g, x); }); AF.sel = {g:g.id, i:null}; afDrawList(); afCtrl(); afRefresh(); afMsgG('Nueva referencia: «' + it.name + '». Las demás fotos quedaron sin alinear.'); } break;
    case 'alinear': if(it){ try{ await afAlinear(g, it, p=>{ afMsg(p); afMsgG(p); }); afMsgG('«' + it.name + '»: ' + it.msg); }catch(er){ afMsgG('«' + it.name + '»: ' + er.message, true); } afDrawList(); AF.sel = {g:g.id, i:it.id}; afCtrl(); afRefresh(); } break;
    case 'alinearG': { const l = g.items.filter(x=>x.estado !== 'err' || !/^Tipo distinto/.test(x.msg)).map(x=>({g, it:x})); if(l.length) await afAlinearLote(l, g.nombre); break; }
    case 'zipG': try{ await afZip([g]); }catch(er){ afMsgG(er.message, true); } break;
    case 'reset': if(it){ it.rot = afNuevoRot(); it.autoT = null; it.H = null; it.man = {dx:0,dy:0,rot:0,esc:100}; it.estado = 'pend'; it.msg = ''; it.mod = false; it.useShift = false; afDrawList(); afCtrl(); afRefresh(); } break;
    case 'dl': if(it){ try{ afMsg('Procesando…'); const b = await afRender(g, it, p=>afMsg('Procesando… ' + Math.round(p*100) + '%')); afGuardar(b, afBase(it.name) + '_alineada.jpg'); afMsg('Listo: ' + afBase(it.name) + '_alineada.jpg'); }catch(er){ afMsg(er.message, true); } } break;
  }
}
function afInput(e){
  const t = e.target, {g, it} = afCur();
  if(t.id === 'afVal'){ AF.val = +t.value; const s = document.getElementById('afValT'); if(s) s.textContent = AF.val; if(AF.cmp !== 'parp') afAplicaCmp(); return; }
  if(t.dataset && t.dataset.p && g && it){
    afSetParam(it, g, t.dataset.p, t.value);
    const k = t.dataset.p, v = (afKindG(g, g.ref) === '360' ? (k === 'h' ? it.rot.h : it.rot[k]) : it.man[k]);
    ['afs_', 'afn_'].forEach(p=>{ const o = document.getElementById(p + k); if(o && o !== t) o.value = v; });
    afRefresh(); const row = document.querySelector('.af-it.on small'); if(row) row.textContent = afEstadoTxt(it);
  }
}
function afChange(e){
  const t = e.target;
  if(t.dataset.act === 'nombre'){ const g = afGrupo(t.dataset.g); if(g) g.nombre = t.value.trim() || g.nombre; return; }
  if(t.dataset.act === 'tipo'){ const g = afGrupo(t.dataset.g); if(g){ g.tipo = t.value; g.items.forEach(x=>{ afMarcarTipo(g, x); }); afDrawList(); afCtrl(); afRefresh(); } return; }
  if(t.id === 'afShift'){ const {g, it} = afCur(); if(!it) return; it.useShift = t.checked; document.getElementById('afShiftBox').style.display = t.checked ? '' : 'none';
    if(it.auto) afAplicaAuto360(it); else if(!t.checked){ it.autoT = null; it.rot.tx = it.rot.ty = it.rot.tz = 0; }
    it.mod = !it.auto; afCtrl(); afRefresh(); afDrawList(); return; }
  if(t.id === 'afHi'){ AF.hires = t.checked; if(AF.vis) AF.vis.limpiarTodo(); afRefresh(); return; }
  if(t.id === 'afFile' && AF.pick){ const g = afGrupo(AF.pick.g); if(g) afAgregar(g, t.files, AF.pick.ref); }
}
function afInit(){
  const root = document.getElementById('afRoot');
  if(!AF.grupos.length) afNuevoGrupo();
  AF.vis = new AFVisor(document.getElementById('afCv'));
  if(!AF.vis.ok){ const h = document.getElementById('afHint'); if(h){ h.style.display = ''; h.innerHTML = 'Tu navegador no admite WebGL2, necesario para el visor de comparación. Puedes alinear y descargar igual; para ver el resultado usa un navegador más reciente.'; } }
  else { const hi = document.getElementById('afHiBox'); if(hi && AF.vis.maxTex >= 8192) hi.style.display = ''; }
  root.addEventListener('click', afClick); root.addEventListener('input', afInput); root.addEventListener('change', afChange);
  const lista = document.getElementById('afGrupos');
  lista.addEventListener('dragover', e=>{ const s = e.target.closest('.af-g'); if(s){ e.preventDefault(); s.classList.add('drop'); } });
  lista.addEventListener('dragleave', e=>{ const s = e.target.closest('.af-g'); if(s) s.classList.remove('drop'); });
  lista.addEventListener('drop', e=>{ const s = e.target.closest('.af-g'); if(!s) return; e.preventDefault(); s.classList.remove('drop'); const g = afGrupo(s.dataset.gid); if(g) afAgregar(g, e.dataTransfer.files, false); });
  document.getElementById('afResetV').addEventListener('click', ()=>{ if(AF.vis) AF.vis.reiniciarVista(); });
  afDrawList(); afCtrl(); afAplicaCmp(); afRefresh();
}

const AF_CSS = `
.af-wrap{display:grid;grid-template-columns:minmax(290px,370px) 1fr;gap:12px;margin-top:10px;align-items:start}
.af-left{display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 150px);overflow:auto;padding:2px 4px 8px 2px}
.af-right{position:sticky;top:8px;display:flex;flex-direction:column;gap:8px;min-width:0}
.af-vis{position:relative;width:100%;aspect-ratio:16/10;background:#0b1015;border-radius:12px;overflow:hidden;touch-action:none;border:1px solid var(--line)}
.af-vis canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}
.af-hint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;color:#cbd5df;padding:18px;font-size:14px;line-height:1.45;pointer-events:none}
.af-badge{position:absolute;left:8px;top:8px;background:rgba(10,34,64,.78);color:#fff;font-size:12px;padding:4px 9px;border-radius:999px;pointer-events:none}
.af-resetv{position:absolute;right:8px;top:8px;background:rgba(10,34,64,.78);color:#fff;border:0;border-radius:999px;font-size:12px;padding:4px 10px;cursor:pointer}
.af-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.af-g{background:var(--paper-raised);border:1px solid var(--line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px}
.af-g.drop{outline:2px dashed var(--accent);outline-offset:2px}
.af-gh{display:flex;gap:6px;align-items:center}
.af-gn{flex:1;min-width:0;font-weight:700;font-size:14px;padding:6px 8px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--paper);color:var(--ink)}
.af-gh select{font-size:12px;padding:6px 4px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--paper);color:var(--ink);flex:none}
.af-gh button,.af-ib button{border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:var(--radius-sm);cursor:pointer;padding:5px 8px;font-size:13px}
.af-it{display:flex;align-items:center;gap:8px;padding:5px;border:1px solid transparent;border-radius:10px;cursor:pointer}
.af-it:hover{background:var(--paper-sunken)} .af-it.on{border-color:var(--accent);background:var(--paper-sunken)} .af-it.ref{border-left:3px solid var(--blueprint)}
.af-th{width:52px;height:40px;object-fit:cover;border-radius:6px;flex:none;background:#0b1015}
.af-meta{flex:1;min-width:0;display:flex;flex-direction:column}
.af-meta b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.af-meta small{font-size:11.5px;color:var(--ink-soft);line-height:1.3}
.af-meta small.st-ok{color:var(--success)} .af-meta small.st-err{color:var(--danger)}
.af-ib{display:flex;gap:4px;flex:none}
.af-empty{font-size:12.5px;color:var(--ink-soft);padding:8px;border:1px dashed var(--line-strong);border-radius:10px}
.af-gb{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}
.af-pri{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700}
.af-gb button:disabled{opacity:.5;cursor:not-allowed}
.af-ctrl{background:var(--paper-raised);border:1px solid var(--line);border-radius:12px;padding:10px}
.af-ctrl label{display:block;font-size:12px;color:var(--ink-soft);margin:8px 0 3px}
.af-ctrl h5{margin:12px 0 2px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-text)}
.af-ctrl input[type=range]{width:100%}
.af-seg{display:flex;flex-wrap:wrap;gap:4px}
.af-seg button{flex:1;min-width:84px;padding:6px 8px;border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:var(--radius-sm);font-size:12.5px;cursor:pointer}
.af-seg button.on{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.af-orr{display:flex;align-items:center;gap:6px}.af-orr input[type=range]{flex:1}.af-orr input[type=number]{width:92px;padding:4px 6px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--paper);color:var(--ink)}
.af-chk{display:flex;align-items:center;gap:8px;margin-top:8px}.af-chk label{margin:0}
.af-msg{display:block;min-height:1.2em;margin-top:6px;font-size:12.5px;color:var(--ink-soft)} .af-msg.err{color:var(--danger)}
.af-help{font-size:13px;color:var(--ink-soft);margin:8px 0 0}
.af-ctrl small{display:block;font-size:12px;color:var(--ink-soft);margin:3px 0}
@media (max-width:860px){.af-wrap{grid-template-columns:1fr}.af-right{position:static;order:-1}.af-left{max-height:none;overflow:visible}.af-vis{aspect-ratio:4/3}}`;
function renderAlinearFotos(){
  const body = `<style>${AF_CSS}</style>
  <div class="af-wrap" id="afRoot">
    <div class="af-left">
      <div class="af-top"><button type="button" class="btn-sm" data-act="nuevoG">＋ Nuevo grupo</button><button type="button" class="btn-sm af-pri" data-act="alinearTodo">⚙ Alinear todo</button><button type="button" class="btn-sm" data-act="zipTodo">⬇ ZIP de todo</button></div>
      <small id="afGlob" class="af-msg" aria-live="polite"></small>
      <div id="afGrupos"></div>
      <input type="file" id="afFile" accept="image/*" multiple hidden>
    </div>
    <div class="af-right">
      <div class="af-vis"><canvas id="afCv" aria-label="Comparación de fotos"></canvas>
        <div class="af-hint" id="afHint">Agrega la foto de referencia y las fotos a alinear en un grupo (puedes soltar varias a la vez). Luego pulsa «Alinear grupo» y compara aquí el resultado.</div>
        <div class="af-badge" id="afBadge"></div><button type="button" class="af-resetv" id="afResetV" title="Volver a la vista inicial (o doble toque)">⟲ Vista</button></div>
      <div class="af-ctrl" id="afCtrl"></div>
      <div class="af-chk" id="afHiBox" style="display:none"><input type="checkbox" id="afHi"><label for="afHi" style="margin:0;font-size:12.5px;color:var(--ink-soft)">Alta resolución en el visor (8192 px; usa más memoria)</label></div>
    </div>
  </div>`;
  toolShell('alinearFotos', 'Alinea fotos tomadas desde el mismo punto en fechas distintas. Arma <strong>grupos</strong>: una foto de referencia y una o varias fotos a alinear con ella. Funciona con fotos <strong>360°</strong> (corrige giro, inclinación y horizonte) y con fotos <strong>normales</strong> (corrige desplazamiento, giro y escala). Compara el resultado con mezcla, cortina, diferencia o parpadeo y descarga las imágenes corregidas. Todo se procesa en tu equipo; la primera alineación automática descarga una librería de visión (~13 MB).', body);
  const ab = document.querySelector('.tool-view .action-bar'); if(ab) ab.style.display = 'none';
  const tv = document.querySelector('.tool-view'); if(tv) tv.classList.add('tool-2col');
  afInit();
}
const RENDERERS = { alinearFotos: renderAlinearFotos };
