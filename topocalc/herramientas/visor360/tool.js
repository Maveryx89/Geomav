"use strict";
/* Herramienta «Visor 360°»: formulario, cálculo y diagrama.
   Generado a partir del index.html monolítico de topocalc. */
const V360_DB = 'topocalc360';
const V360_RES = {normal:4096, alta:8192, max:16384};
const V360_NO = {
  insp:'es el archivo crudo de Insta360 (doble ojo de pez, sin unir). Expórtalo como JPG desde la app Insta360 o Insta360 Studio y cárgalo aquí.',
  insv:'es video crudo de Insta360. Aquí solo se cargan imágenes JPG exportadas.',
  dng:'los RAW (DNG) no se pueden mostrar. Expórtalo como JPG.',
  heic:'HEIC no es compatible con todos los navegadores. Expórtalo como JPG.',
  heif:'HEIF no es compatible con todos los navegadores. Expórtalo como JPG.',
  tif:'TIFF no es compatible. Expórtalo como JPG.',
  tiff:'TIFF no es compatible. Expórtalo como JPG.'
};
let v360S = null;
function v360Db(){
  return new Promise((res, rej)=>{
    if(!window.indexedDB){ rej(new Error('Este navegador no permite guardar imágenes en el equipo.')); return; }
    const rq = indexedDB.open(V360_DB, 1);
    rq.onupgradeneeded = ()=>{
      const db = rq.result;
      db.createObjectStore('meta', {keyPath:'id'});
      db.createObjectStore('blobs', {keyPath:'id'});
    };
    rq.onsuccess = ()=> res(rq.result);
    rq.onerror = ()=> rej(rq.error || new Error('No se pudo abrir el almacenamiento.'));
  });
}
function v360Run(stores, mode, fn){
  return v360Db().then(db=> new Promise((res, rej)=>{
    let tx, out;
    try{ tx = db.transaction(stores, mode); out = fn(tx); }catch(e){ db.close(); rej(e); return; }
    tx.oncomplete = ()=>{ db.close(); res(out); };
    tx.onerror = ()=>{ db.close(); rej(tx.error); };
    tx.onabort = ()=>{ db.close(); rej(tx.error || new Error('Almacenamiento lleno o no disponible.')); };
  }));
}
function v360Lista(){
  return v360Run(['meta'], 'readonly', tx=> tx.objectStore('meta').getAll()).then(rq=> (rq.result||[]).sort((a,b)=> b.ts - a.ts));
}
function v360Borrar(id){
  return v360Run(['meta','blobs'], 'readwrite', tx=>{ tx.objectStore('meta').delete(id); tx.objectStore('blobs').delete(id); });
}
function v360Guardar(meta, blob){
  return v360Run(['meta','blobs'], 'readwrite', tx=>{ tx.objectStore('meta').put(meta); tx.objectStore('blobs').put({id:meta.id, blob}); });
}
function v360Actualizar(id, parche){
  return v360Run(['meta'], 'readwrite', tx=>{
    const st = tx.objectStore('meta'), g = st.get(id);
    g.onsuccess = ()=>{ if(g.result) st.put(Object.assign(g.result, parche)); };
  });
}
function v360LeerExif(dv, base, limite){
  const r = {};
  const le = dv.getUint16(base) === 0x4949;
  const u16 = o=> dv.getUint16(base+o, le), u32 = o=> dv.getUint32(base+o, le);
  const tam = {1:1, 2:1, 3:2, 4:4, 5:8, 7:1};
  const ifd = o0=>{
    const res = {}, n = Math.min(u16(o0), 200);
    for(let i=0;i<n;i++){
      const e = o0 + 2 + i*12, tag = u16(e), tipo = u16(e+2), cnt = u32(e+4);
      if(!tam[tipo] || cnt > 4096) continue;
      const bytes = tam[tipo]*cnt, vo = bytes <= 4 ? e+8 : u32(e+8);
      if(base + vo + bytes > limite) continue;
      let v = [];
      if(tipo === 2){ let s = ''; for(let k=0;k<cnt;k++){ const c = dv.getUint8(base+vo+k); if(!c) break; s += String.fromCharCode(c); } v = s.trim(); }
      else if(tipo === 3){ for(let k=0;k<cnt;k++) v.push(dv.getUint16(base+vo+k*2, le)); }
      else if(tipo === 4){ for(let k=0;k<cnt;k++) v.push(dv.getUint32(base+vo+k*4, le)); }
      else if(tipo === 5){ for(let k=0;k<cnt;k++){ const d = dv.getUint32(base+vo+k*8+4, le); v.push(d ? dv.getUint32(base+vo+k*8, le)/d : 0); } }
      else { for(let k=0;k<cnt;k++) v.push(dv.getUint8(base+vo+k)); }
      res[tag] = v;
    }
    return res;
  };
  const i0 = ifd(u32(4));
  if(typeof i0[0x010F] === 'string') r.make = i0[0x010F];
  if(typeof i0[0x0110] === 'string') r.model = i0[0x0110];
  try{ if(i0[0x8769]){ const ie = ifd(i0[0x8769][0]); if(typeof ie[0x9003] === 'string') r.fecha = ie[0x9003]; } }catch(e){}
  try{
    if(i0[0x8825]){
      const g = ifd(i0[0x8825][0]);
      const dms = a=> a && a.length === 3 ? a[0] + a[1]/60 + a[2]/3600 : null;
      let lat = dms(g[2]), lon = dms(g[4]);
      if(lat !== null && lon !== null){
        if(/^S/i.test(g[1]||'')) lat = -lat;
        if(/^W/i.test(g[3]||'')) lon = -lon;
        let alt = g[6] && g[6].length ? g[6][0] : null;
        if(alt !== null && g[5] && g[5][0] === 1) alt = -alt;
        if(isFinite(lat) && isFinite(lon) && (lat !== 0 || lon !== 0)) r.gps = {lat, lon, alt};
      }
    }
  }catch(e){}
  return r;
}
function v360LeerJpeg(buf){
  const out = {w:null, h:null, xmp:null, exif:null};
  try{
    const dv = new DataView(buf);
    if(dv.getUint16(0) !== 0xFFD8) return out;
    let off = 2;
    while(off + 4 <= dv.byteLength){
      if(dv.getUint8(off) !== 0xFF){ off++; continue; }
      const m = dv.getUint8(off+1);
      if(m === 0xFF){ off++; continue; }
      if(m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)){ off += 2; continue; }
      if(m === 0xD9 || m === 0xDA) break;
      const len = dv.getUint16(off+2), s = off+4, fin = Math.min(off+2+len, dv.byteLength);
      if(m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC && s+5 <= dv.byteLength){
        out.h = dv.getUint16(s+1); out.w = dv.getUint16(s+3);
      } else if(m === 0xE1 && s+6 <= dv.byteLength){
        if(dv.getUint32(s) === 0x45786966 && dv.getUint16(s+4) === 0){
          try{ out.exif = v360LeerExif(dv, s+6, fin); }catch(e){}
        } else if(!out.xmp){
          let head = '';
          for(let i=0;i<28 && s+i<dv.byteLength;i++) head += String.fromCharCode(dv.getUint8(s+i));
          if(head === 'http://ns.adobe.com/xap/1.0/') out.xmp = new TextDecoder('utf-8').decode(new Uint8Array(buf, s+29, Math.max(0, fin-(s+29))));
        }
      }
      off += 2 + len;
    }
  }catch(e){}
  return out;
}
function v360Gpano(xmp){
  if(!xmp || xmp.indexOf('GPano') < 0) return null;
  const g = n=>{
    const m = xmp.match(new RegExp('GPano:'+n+'\\s*=\\s*["\']([^"\']*)["\']')) || xmp.match(new RegExp('<GPano:'+n+'>([^<]*)</GPano:'+n+'>'));
    return m ? m[1].trim() : null;
  };
  const num = n=>{ const s = g(n), x = s === null ? NaN : parseFloat(s); return isFinite(x) ? x : null; };
  const proj = g('ProjectionType');
  if(!proj) return null;
  return {proj, fullW:num('FullPanoWidthPixels'), fullH:num('FullPanoHeightPixels'), cropW:num('CroppedAreaImageWidthPixels'),
    cropH:num('CroppedAreaImageHeightPixels'), cropL:num('CroppedAreaLeftPixels'), cropT:num('CroppedAreaTopPixels'),
    pose:num('PoseHeadingDegrees'), initH:num('InitialViewHeadingDegrees')};
}
function v360Clasificar(w, h, gp){
  const r = {tipo:'flat', fuente:'sin-datos', hfov:null, crop:null, pose:null, initH:null};
  if(gp && /equirect/i.test(gp.proj)){
    const fw = gp.fullW || w, fh = gp.fullH || fw/2;
    const cw = gp.cropW || w, ch = gp.cropH || h;
    r.crop = [(gp.cropL||0)/fw, (gp.cropT||0)/fh, cw/fw, ch/fh];
    r.tipo = (r.crop[2] > 0.998 && r.crop[3] > 0.998) ? 'sphere' : 'partial';
    r.fuente = 'gpano'; r.hfov = 360*r.crop[2]; r.pose = gp.pose; r.initH = gp.initH;
    if(r.tipo === 'sphere') r.crop = [0, 0, 1, 1];
  } else if(w/h > 1.97 && w/h < 2.03){
    r.tipo = 'sphere'; r.fuente = 'relacion'; r.hfov = 360; r.crop = [0, 0, 1, 1];
  }
  return r;
}
function v360CropManual(hfov, w, h){
  const cw = Math.min(1, hfov/360), ch = Math.min(1, (hfov*h/w)/180);
  return [(1-cw)/2, (1-ch)/2, cw, ch];
}
function v360Reducir(src, tw, th){
  let cur = src, sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
  while(sw/2 >= tw){
    const c = document.createElement('canvas'); c.width = Math.ceil(sw/2); c.height = Math.ceil(sh/2);
    c.getContext('2d').drawImage(cur, 0, 0, c.width, c.height);
    cur = c; sw = c.width; sh = c.height;
  }
  const c = document.createElement('canvas'); c.width = tw; c.height = th;
  const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cur, 0, 0, tw, th);
  if(src.close) src.close();
  return c;
}
async function v360Bitmap(blob, tw, th){
  if(window.createImageBitmap){
    try{
      if(!tw) return await createImageBitmap(blob);
      const b = await createImageBitmap(blob, {resizeWidth:tw, resizeHeight:th, resizeQuality:'high'});
      return Math.abs(b.width - tw) <= 1 ? b : v360Reducir(b, tw, th);
    }catch(e){}
  }
  const url = URL.createObjectURL(blob);
  try{
    const img = new Image(); img.src = url; await img.decode();
    if(!tw){ const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); return c; }
    return v360Reducir(img, tw, th);
  } finally { URL.revokeObjectURL(url); }
}
function v360Objetivo(w, h, tope){
  const k = Math.min(1, tope/Math.max(w, h));
  return [Math.max(1, Math.round(w*k)), Math.max(1, Math.round(h*k))];
}
async function v360Importar(archivos, avance){
  const ok = [], fallas = [];
  for(const f of archivos){
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if(V360_NO[ext]){ fallas.push(`${f.name}: ${V360_NO[ext]}`); continue; }
    if(!/\.(jpe?g|png|webp)$/i.test(f.name) && !/^image\/(jpeg|png|webp)$/.test(f.type)){ fallas.push(`${f.name}: formato no compatible (usa JPG, PNG o WebP).`); continue; }
    try{
      if(avance) avance(`Procesando ${f.name}…`);
      const jp = v360LeerJpeg(await f.slice(0, 524288).arrayBuffer());
      let w = jp.w, h = jp.h;
      if(!w || !h){ const b = await v360Bitmap(f); w = b.width; h = b.height; if(b.close) b.close(); }
      const k = 320/Math.max(w, h), tw = Math.max(1, Math.round(w*k)), th = Math.max(1, Math.round(h*k));
      const bm = await v360Bitmap(f, tw, th);
      const c = document.createElement('canvas'); c.width = tw; c.height = th;
      c.getContext('2d').drawImage(bm, 0, 0, tw, th);
      if(bm.close) bm.close();
      const cl = v360Clasificar(w, h, v360Gpano(jp.xmp)), ex = jp.exif || {};
      const meta = {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name:f.name, size:f.size, w, h, ts:Date.now(),
        thumb:c.toDataURL('image/jpeg', 0.72), tipo:cl.tipo, fuente:cl.fuente, crop:cl.crop, hfov:cl.hfov, pose:cl.pose, initH:cl.initH,
        make:ex.make || null, model:ex.model || null, fecha:ex.fecha || null, gps:ex.gps || null};
      await v360Guardar(meta, f);
      ok.push(meta);
    }catch(e){
      fallas.push(`${f.name}: ${e && e.name === 'QuotaExceededError' ? 'no hay espacio suficiente en el equipo.' : 'no se pudo leer la imagen (puede ser demasiado grande para este equipo).'}`);
    }
  }
  try{ if(ok.length && navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  return {ok, fallas};
}
const V360M = {
  mul:(a, b)=>{ const r = new Array(9); for(let i=0;i<3;i++) for(let j=0;j<3;j++) r[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j]; return r; },
  rx:t=>{ const c = Math.cos(t), s = Math.sin(t); return [1,0,0, 0,c,-s, 0,s,c]; },
  ry:t=>{ const c = Math.cos(t), s = Math.sin(t); return [c,0,s, 0,1,0, -s,0,c]; },
  rz:t=>{ const c = Math.cos(t), s = Math.sin(t); return [c,-s,0, s,c,0, 0,0,1]; },
  gl:m=> new Float32Array([m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]]),
  fwd:m=> [m[2], m[5], m[8]]
};
function v360MatVista(yaw, pitch){ const d = Math.PI/180; return V360M.mul(V360M.ry(yaw*d), V360M.rx(-pitch*d)); }
function v360MatSensor(alfa, beta, gamma, pantalla, yawOff){
  const d = Math.PI/180;
  const R = V360M.mul(V360M.mul(V360M.rz(alfa*d), V360M.rx(beta*d)), V360M.ry(gamma*d));
  const cam = V360M.mul(V360M.rz(-pantalla*d), [1,0,0, 0,1,0, 0,0,-1]);
  const enu = V360M.mul(R, cam);
  const mundo = V360M.mul([1,0,0, 0,0,1, 0,1,0], enu);
  return V360M.mul(V360M.ry(yawOff), mundo);
}
const V360_VS = `#version 300 es
in vec2 aPos; out vec2 vP;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); vP = aPos; }`;
const V360_FS = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vP;
uniform sampler2D uTex;
uniform mat3 uRot;
uniform float uAspect, uTan, uFlat, uImgAsp;
uniform vec4 uCrop;
uniform vec3 uBg, uFlatV;
out vec4 outc;
const float PI = 3.14159265358979;
void main(){
  if(uFlat > 0.5){
    vec2 p = vec2(vP.x*uAspect, vP.y);
    vec2 uv = vec2(uFlatV.x + p.x*0.5*uFlatV.z/uImgAsp, uFlatV.y - p.y*0.5*uFlatV.z);
    vec2 gx = dFdx(uv), gy = dFdy(uv);
    if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0){ outc = vec4(uBg, 1.0); return; }
    outc = vec4(textureGrad(uTex, uv, gx, gy).rgb, 1.0); return;
  }
  vec3 d = normalize(uRot * vec3(vP.x*uAspect*uTan, vP.y*uTan, 1.0));
  float u = atan(d.x, d.z)/(2.0*PI) + 0.5;
  float v = 0.5 - asin(clamp(d.y, -1.0, 1.0))/PI;
  float u2 = fract(u + 0.5) - 0.5;
  bool alt = fwidth(u2) < fwidth(u);
  vec2 gx = alt ? vec2(dFdx(u2), dFdx(v)) : vec2(dFdx(u), dFdx(v));
  vec2 gy = alt ? vec2(dFdy(u2), dFdy(v)) : vec2(dFdy(u), dFdy(v));
  vec2 uvc = vec2((u - uCrop.x)/uCrop.z, (v - uCrop.y)/uCrop.w);
  gx /= uCrop.zw; gy /= uCrop.zw;
  if(uvc.y < 0.0 || uvc.y > 1.0 || (uCrop.z < 0.9995 && (uvc.x < 0.0 || uvc.x > 1.0))){ outc = vec4(uBg, 1.0); return; }
  outc = vec4(textureGrad(uTex, uvc, gx, gy).rgb, 1.0);
}`;
function v360MontarGL(S){
  const gl = S.gl;
  const sh = (tipo, src)=>{ const o = gl.createShader(tipo); gl.shaderSource(o, src); gl.compileShader(o); if(!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, V360_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, V360_FS));
  gl.bindAttribLocation(pr, 0, 'aPos'); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  S.u = {}; ['uTex','uRot','uAspect','uTan','uFlat','uImgAsp','uCrop','uBg','uFlatV'].forEach(n=>{ S.u[n] = gl.getUniformLocation(pr, n); });
  S.tex = gl.createTexture(); S.texOk = false;
  S.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
}
function v360Pedir(S){ if(!S.raf && !S.perdido) S.raf = requestAnimationFrame(t=> v360Cuadro(S, t)); }
function v360Dibujar(S){
  const gl = S.gl, c = S.canvas;
  gl.viewport(0, 0, c.width, c.height);
  gl.clearColor(0.04, 0.06, 0.08, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  if(!S.texOk) return;
  const u = S.u, plano = S.tipo === 'flat';
  gl.uniform1i(u.uTex, 0);
  gl.uniformMatrix3fv(u.uRot, false, V360M.gl(S.M));
  const vr = S.vr && !plano, mitad = Math.floor(c.width/2);
  gl.uniform1f(u.uAspect, (vr ? mitad : c.width)/Math.max(1, c.height));
  gl.uniform1f(u.uTan, Math.tan(S.fov*Math.PI/360));
  gl.uniform1f(u.uFlat, plano ? 1 : 0);
  gl.uniform1f(u.uImgAsp, S.imgAsp);
  gl.uniform4fv(u.uCrop, S.crop);
  gl.uniform3f(u.uBg, 0.04, 0.06, 0.08);
  gl.uniform3f(u.uFlatV, S.fc[0], S.fc[1], S.fs);
  if(vr){   // modo VR: la misma vista en dos mitades de pantalla (ojo izquierdo y derecho), para visor tipo Cardboard
    gl.viewport(0, 0, mitad, c.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.viewport(c.width - mitad, 0, mitad, c.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  } else gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function v360Cuadro(S, t){
  S.raf = 0;
  if(v360S !== S) return;
  const dt = Math.min(0.1, S.t0 ? (t - S.t0)/1000 : 0.016); S.t0 = t;
  let anim = false;
  if(S.tipo !== 'flat' && !S.drag){
    if(Math.abs(S.vyaw) > 0.02 || Math.abs(S.vpitch) > 0.02){
      if(S.gyro) S.yawOff += S.vyaw*dt*Math.PI/180; else { S.yaw += S.vyaw*dt; S.pitch += S.vpitch*dt; }
      const f = Math.exp(-dt*3.5); S.vyaw *= f; S.vpitch *= f; anim = true;
    } else S.vyaw = S.vpitch = 0;
    if(S.auto){ if(S.gyro) S.yawOff += 8*dt*Math.PI/180; else S.yaw += 8*dt; anim = true; }
  }
  S.pitch = Math.max(-89.5, Math.min(89.5, S.pitch));
  if(S.yaw > 180) S.yaw -= 360; else if(S.yaw < -180) S.yaw += 360;
  if(S.gyro && S.ori){
    S.M = v360MatSensor(S.ori[0], S.ori[1], S.ori[2], v360Pantalla0(), S.yawOff);
    anim = true;
  } else S.M = v360MatVista(S.yaw, S.pitch);
  v360Dibujar(S); v360Hud(S); v360Brujula(S);
  if(anim) v360Pedir(S); else S.t0 = 0;
}
function v360Hud(S){
  const el = S.hud; if(!el || !S.texOk) return;
  let a, b;
  if(S.tipo === 'flat'){ a = ''; b = `Zoom ${Math.round(100*S.fsFit/S.fs)}%`; }
  else {
    const f = V360M.fwd(S.M), az = (Math.atan2(f[0], f[2])*180/Math.PI + 360) % 360, el_ = Math.asin(Math.max(-1, Math.min(1, f[1])))*180/Math.PI;
    const ref = S.pose !== null && S.pose !== undefined ? (az + S.pose + 360) % 360 : az;
    a = `${S.pose !== null && S.pose !== undefined ? 'Az' : 'Ángulo'} ${ref.toFixed(0)}° · Elev. ${(el_ >= 0 ? '+' : '−') + Math.abs(el_).toFixed(0)}°`;
    b = `FOV ${Math.round(S.fov)}°`;
  }
  const txt = `${a}|${b}`; if(txt === S.hudTxt) return; S.hudTxt = txt;
  el.innerHTML = `<span>${a}</span><span>${b}</span>`;
}
function v360Ajustar(S){
  const c = S.canvas, dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(c.clientWidth*dpr)), h = Math.max(1, Math.round(c.clientHeight*dpr));
  if(c.width !== w || c.height !== h){ c.width = w; c.height = h; }
  v360Pedir(S);
}
function v360Reiniciar(S){
  S.yaw = S.yaw0 || 0; S.pitch = 0; S.fov = 75; S.vyaw = S.vpitch = 0;
  S.fc = [0.5, 0.5];
  const ca = S.canvas.clientWidth/Math.max(1, S.canvas.clientHeight);
  S.fsFit = S.fs = Math.max(1, S.imgAsp/ca);
  if(S.gyro && S.ori) S.yawOff = S.yaw*Math.PI/180 - v360RumboEquipo(S.ori);
  v360Pedir(S);
}
function v360Msg(t){ const e = document.getElementById('v360Msg'); if(e) e.textContent = t || ''; }
function v360Pantalla0(){ return (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0); }
function v360RumboEquipo(ori){   // rumbo (rad) hacia donde apunta la cámara trasera del equipo, sin desfase
  const f = V360M.fwd(v360MatSensor(ori[0], ori[1], ori[2], v360Pantalla0(), 0));
  return Math.atan2(f[0], f[2]);
}
async function v360SensorOn(S){
  if(typeof DeviceOrientationEvent === 'undefined'){ v360Msg('Este equipo no tiene sensor de orientación.'); return false; }
  try{
    if(typeof DeviceOrientationEvent.requestPermission === 'function' && (await DeviceOrientationEvent.requestPermission()) !== 'granted'){ v360Msg('Permiso del sensor denegado.'); return false; }
  }catch(e){ v360Msg('No se pudo activar el sensor.'); return false; }
  S.ori = null; S.gyro = true;
  S.onOri = e=>{
    if(e.alpha === null || e.beta === null || e.gamma === null) return;
    const primera = !S.ori; S.ori = [e.alpha, e.beta, e.gamma];
    if(primera) S.yawOff = S.yaw*Math.PI/180 - v360RumboEquipo(S.ori);   // sin salto: el rumbo de la vista coincide con hacia dónde apunta el equipo
    v360Pedir(S);
  };
  window.addEventListener('deviceorientation', S.onOri, true);
  setTimeout(()=>{ if(v360S === S && S.gyro && !S.ori){ v360SensorOff(S); v360Msg('Este equipo no entrega datos del sensor de orientación.'); } }, 1500);
  return true;
}
function v360SensorOff(S){
  if(S.onOri) window.removeEventListener('deviceorientation', S.onOri, true);
  if(S.gyro && S.ori && S.M){ const f = V360M.fwd(S.M); S.yaw = Math.atan2(f[0], f[2])*180/Math.PI; S.pitch = Math.asin(Math.max(-1, Math.min(1, f[1])))*180/Math.PI; }
  S.gyro = false; S.ori = null; S.onOri = null;
  const b = S.stage.querySelector('[data-a="gyro"]'); if(b) b.classList.remove('on');
  v360Pedir(S);
}
function v360AplicarTipo(S, m){
  S.tipo = m.tipo; S.pose = m.pose; S.crop = m.crop || [0, 0, 1, 1];
  const gl = S.gl; gl.bindTexture(gl.TEXTURE_2D, S.tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, (m.tipo === 'sphere' ? gl.REPEAT : gl.CLAMP_TO_EDGE));
  const ini = (m.initH !== null && m.initH !== undefined && m.pose !== null && m.pose !== undefined) ? m.initH - m.pose : 0;
  S.yaw0 = ((ini + 540) % 360) - 180;
  v360Reiniciar(S);
}
async function v360Abrir(id){
  const S = v360S; if(!S) return;
  const tok = ++S.tok;
  v360Msg('Abriendo imagen…');
  try{
    const r = await v360Run(['meta', 'blobs'], 'readonly', tx=>({m: tx.objectStore('meta').get(id), b: tx.objectStore('blobs').get(id)}));
    const m = r.m.result, rec = r.b.result;
    if(!m || !rec) throw new Error('La imagen ya no está guardada.');
    const tope = Math.min(V360_RES[S.resSel] || 8192, S.maxTex);
    const [tw, th] = v360Objetivo(m.w, m.h, tope);
    const bm = await v360Bitmap(rec.blob, tw >= m.w ? 0 : tw, th);
    if(v360S !== S || tok !== S.tok){ if(bm.close) bm.close(); return; }
    const gl = S.gl;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, S.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.getError();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, bm);
    if(gl.getError() !== gl.NO_ERROR) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm);
    const bw = bm.width, bh = bm.height; if(bm.close) bm.close();
    if(gl.getError() !== gl.NO_ERROR) throw new Error('La GPU no pudo cargar la imagen. Prueba con una resolución menor.');
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const an = gl.getExtension('EXT_texture_filter_anisotropic');
    if(an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    S.texOk = true; S.imgAsp = bw/bh; S.id = id; S.meta = m; S.cargada = {w:bw, h:bh};
    S.menu = false; S.stage.classList.remove('v360-menu-open'); v360Consejo(S);
    S.stage.classList.add('v360-has'); const e = document.getElementById('v360Empty'); if(e) e.style.display = 'none'; const ps = document.getElementById('v360Pasos'); if(ps) ps.style.display = 'none';
    v360AplicarTipo(S, m);
    v360PanelInfo(m, bw, bh);
    document.querySelectorAll('.v360-card').forEach(c=> c.classList.toggle('sel', c.dataset.id === id));
    v360PanelShare(m); v360MapaSel(S);
    v360Msg('');
  }catch(e){
    if(v360S === S && tok === S.tok) v360Msg('No se pudo abrir la imagen: ' + (e && e.message ? e.message : 'error desconocido') + '.');
  }
}
function v360Fecha(f){ const m = /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/.exec(f || ''); return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : (f || ''); }
function v360PanelInfo(m, bw, bh){
  const card = document.getElementById('v360Info'); if(!card) return;
  const proy = {sphere:'Esfera completa 360° × 180°', partial:`Panorama parcial (${Math.round(m.hfov || 0)}° horizontal)`, flat:'Foto plana'}[m.tipo];
  const fuente = {gpano:'metadatos de la imagen', relacion:'relación 2:1 del tamaño', manual:'elegido por ti', 'sin-datos':'sin metadatos de panorama'}[m.fuente] || '';
  const equipo = [m.make, m.model].filter(Boolean).join(' ');
  const fila = (k, v)=> `<div class="result-row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  const gps = m.gps ? `${m.gps.lat.toFixed(6)}, ${m.gps.lon.toFixed(6)}${m.gps.alt !== null && m.gps.alt !== undefined ? ` · ${fmtNum(m.gps.alt, 1)} m` : ''}` : '';
  document.getElementById('v360InfoRows').innerHTML =
    fila('Archivo', vrEsc(m.name)) + fila('Tamaño', `${m.w} × ${m.h} px · ${(m.w*m.h/1e6).toFixed(1)} MP · ${(m.size/1048576).toFixed(1)} MB`) +
    ((bw !== m.w) ? fila('En pantalla', `${bw} × ${bh} px (reducida para la GPU)`) : '') +
    fila('Proyección', `${proy} <small>(${fuente})</small>`) + (equipo ? fila('Equipo', vrEsc(equipo)) : '') +
    (m.fecha ? fila('Captura', v360Fecha(m.fecha)) : '') + (gps ? fila('GPS', `${gps} <button type="button" class="btn-sm" id="v360CopiarGps" style="margin-left:6px;">Copiar</button>`) : '');
  const pop = document.getElementById('v360InfoPop');
  if(pop){
    const r = (k, v)=> `<div class="r"><span>${k}</span><b>${v}</b></div>`;
    pop.innerHTML = `<details open><summary>Datos de la imagen</summary>` +
      r('Archivo', vrEsc(m.name)) + r('Tamaño', `${m.w} × ${m.h} px<br>${(m.w*m.h/1e6).toFixed(1)} MP · ${(m.size/1048576).toFixed(1)} MB`) +
      ((bw !== m.w) ? r('En pantalla', `${bw} × ${bh} px`) : '') + r('Proyección', `${proy}<br><small>${fuente}</small>`) +
      (equipo ? r('Equipo', vrEsc(equipo)) : '') + (m.fecha ? r('Captura', v360Fecha(m.fecha)) : '') + `</details>` +
      (m.gps ? `<details><summary>Ubicación GPS</summary>${r('Coordenadas', `${m.gps.lat.toFixed(6)}, ${m.gps.lon.toFixed(6)}`)}${m.gps.alt !== null && m.gps.alt !== undefined ? r('Altitud', fmtNum(m.gps.alt, 1) + ' m') : ''}
        <button type="button" class="mini" id="v360PopGps">Copiar</button> <a class="mini" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${m.gps.lat},${m.gps.lon}">Ver en Google Maps</a></details>` : '');
    const pg = document.getElementById('v360PopGps');
    if(pg) pg.addEventListener('click', ()=>{ const t = `${m.gps.lat.toFixed(6)}, ${m.gps.lon.toFixed(6)}`; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=> v360Msg('Coordenadas copiadas.'), ()=> v360Msg(t)); });
  }
  const cp = document.getElementById('v360CopiarGps');
  if(cp) cp.addEventListener('click', ()=>{ const t = `${m.gps.lat.toFixed(6)}, ${m.gps.lon.toFixed(6)}`; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=> v360Msg('Coordenadas copiadas.'), ()=> v360Msg(t)); });
  document.getElementById('v360Tipo').value = m.tipo;
  document.getElementById('v360Hfov').value = Math.round(m.hfov || 360);
  document.getElementById('v360HfovRow').style.display = m.tipo === 'partial' ? '' : 'none';
  card.style.display = '';
}
async function v360Galeria(){
  const box = document.getElementById('v360Lista'); if(!box) return;
  let lista = [];
  try{ lista = await v360Lista(); }catch(e){ box.innerHTML = `<p class="err-msg">${vrEsc(e.message)}</p>`; return; }
  const tot = lista.reduce((s, m)=> s + m.size, 0);
  v360Mapa(lista);
  const tipoTxt = {sphere:'360°', partial:'parcial', flat:'plana'};
  document.getElementById('v360Total').textContent = lista.length ? `${lista.length} imagen${lista.length === 1 ? '' : 'es'} · ${(tot/1048576).toFixed(0)} MB guardados en este equipo` : 'Aún no hay imágenes guardadas.';
  box.innerHTML = lista.length ? `<div class="v360-grid">${lista.map(m=> `<div class="v360-card${v360S && v360S.id === m.id ? ' sel' : ''}" data-id="${m.id}">
      <button type="button" class="v360-th" aria-label="Abrir ${vrEsc(m.name)}"><img src="${m.thumb}" alt=""></button>
      <button type="button" class="v360-del" aria-label="Eliminar ${vrEsc(m.name)}" title="Eliminar">✕</button>
      <div class="v360-cap"><b title="${vrEsc(m.name)}">${vrEsc(m.name)}</b>${m.w}×${m.h} · ${tipoTxt[m.tipo]}${m.share ? ' · 🔗' : ''}</div></div>`).join('')}</div>` : '';
  box.querySelectorAll('.v360-card').forEach(card=>{
    const id = card.dataset.id;
    card.querySelector('.v360-th').addEventListener('click', ()=>{ v360Abrir(id); if(v360S) v360S.stage.scrollIntoView({block:'nearest', behavior:'smooth'}); });
    card.querySelector('.v360-del').addEventListener('click', async ()=>{
      const mm = lista.find(x=> x.id === id);
      if(!confirm('¿Eliminar esta imagen del equipo? No se puede deshacer.' + (mm && mm.share ? '\n\nOjo: esta imagen está compartida. El enlace del cliente seguirá funcionando hasta que uses «Dejar de compartir».' : ''))) return;
      try{ await v360Borrar(id); }catch(e){ v360Msg('No se pudo eliminar.'); return; }
      if(v360S && v360S.id === id){
        v360S.texOk = false; v360S.id = null; v360S.meta = null; v360S.stage.classList.remove('v360-has');
        const e = document.getElementById('v360Empty'); if(e) e.style.display = ''; const ps = document.getElementById('v360Pasos'); if(ps) ps.style.display = '';
        document.getElementById('v360Info').style.display = 'none'; document.getElementById('v360Share').classList.remove('abierto'); v360Pedir(v360S);
      }
      v360Galeria();
    });
  });
}
async function v360CargarArchivos(files){
  if(!files || !files.length) return;
  const arr = Array.from(files);
  const btns = ['v360HeroG', 'v360HeroA'].map(i=> document.getElementById(i)); btns.forEach(b=>{ if(b) b.disabled = true; });
  const av = document.getElementById('v360Aviso'); if(av){ av.style.display = 'none'; av.textContent = ''; }
  const r = await v360Importar(arr, t=> v360Msg(t));
  btns.forEach(b=>{ if(b) b.disabled = false; });
  await v360Galeria();
  v360Msg('');
  if(r.fallas.length && av){ av.textContent = 'No se cargó: ' + r.fallas.join(' '); av.style.display = ''; }   // aviso propio: no lo pisa el mensaje de apertura
  if(r.ok.length && v360S){ v360Abrir(r.ok[0].id); v360S.stage.scrollIntoView({block:'nearest', behavior:'smooth'}); }
}
function v360Descargar(blob, nombre){
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 1500);
}
function v360Consejo(S){
  const t = document.getElementById('v360Tip'); if(!t) return;
  t.classList.remove('off'); clearTimeout(S.tipT); S.tipT = setTimeout(()=> t.classList.add('off'), 6000);
  const br = S.stage.querySelector('.v360-brujula'); if(br) br.style.display = S.meta && S.meta.tipo === 'flat' ? 'none' : '';
}
function v360Menu(S, on){
  S.menu = on === undefined ? !S.menu : on;
  S.stage.classList.toggle('v360-menu-open', S.menu);
  if(S.menu) v360InfoPop(S, false);
  const sh = S.meta && S.meta.share, eOn = document.getElementById('v360MShareOn'), eOff = document.getElementById('v360MShareOff');
  if(eOn) eOn.style.display = sh ? '' : 'none'; if(eOff) eOff.style.display = sh ? 'none' : '';
}
function v360InfoPop(S, on){
  S.infoOpen = on === undefined ? !S.infoOpen : on;
  if(S.infoOpen && S.menu) v360Menu(S, false);
  S.stage.classList.toggle('v360-info-open', S.infoOpen);
  const b = S.stage.querySelector('[data-a="info"]'); if(b) b.classList.toggle('on', S.infoOpen);
  if(S.infoOpen){ const t = document.getElementById('v360Tip'); if(t) t.classList.add('off'); }
}
function v360Brujula(S){
  const c = document.getElementById('v360Cono'); if(!c || S.tipo === 'flat') return;
  const f = V360M.fwd(S.M), az = Math.atan2(f[0], f[2])*180/Math.PI;
  if(az === S.azCono) return; S.azCono = az;
  c.style.transformOrigin = '17px 17px'; c.style.transform = `rotate(${az.toFixed(1)}deg)`;
}
function v360Pantalla(S, on){
  S.full = on === undefined ? !S.full : on;
  S.stage.classList.toggle('v360-full', S.full);
  document.body.style.overflow = S.full ? 'hidden' : '';
  const b = S.stage.querySelector('[data-a="full"]'); if(b){ b.classList.toggle('on', S.full); b.title = b.ariaLabel = S.full ? 'Salir de pantalla completa' : 'Pantalla completa'; }
  v360Ajustar(S); if(S.full) S.stage.focus();
}
async function v360VR(S, on){
  if(on){
    if(S.tipo === 'flat'){ v360Msg('El modo VR solo funciona con imágenes 360°.'); return; }
    if(!S.gyro){
      if(!(await v360SensorOn(S))) return;
      const b = S.stage.querySelector('[data-a="gyro"]'); if(b) b.classList.add('on');
      S.vrSensor = true;
    }
    S.vr = true; S.fovPrev = S.fov; S.fov = 90; S.auto = false;
    const ba = S.stage.querySelector('[data-a="auto"]'); if(ba){ ba.classList.remove('on'); }
    if(!S.full){ v360Pantalla(S, true); S.vrFull = true; }
    S.stage.classList.add('v360-vr');
    try{ if(screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{}); }catch(e){}
    v360Msg('');
  } else {
    S.vr = false; S.fov = S.fovPrev || 75; S.stage.classList.remove('v360-vr');
    if(S.vrFull){ v360Pantalla(S, false); S.vrFull = false; }
    try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){}
    if(S.vrSensor){ v360SensorOff(S); S.vrSensor = false; }
  }
  v360Ajustar(S);
}
function v360MapaSel(S){
  if(!S || !S.marcas) return;
  Object.keys(S.marcas).forEach(id=> S.marcas[id].setStyle({fillColor: id === S.id ? '#D49A6A' : '#2C6B7E', radius: id === S.id ? 10 : 8}));
}
async function v360Mapa(lista){
  const S = v360S, card = document.getElementById('v360Mapa'); if(!S || !card) return;
  const geo = lista.filter(m=> m.gps);
  card.style.display = geo.length ? '' : 'none';
  if(S.mapa){ try{ S.mapa.remove(); }catch(e){} S.mapa = null; S.marcas = null; }
  if(!geo.length) return;
  const aviso = document.getElementById('v360MapaMsg'); aviso.textContent = '';
  try{ await ensureLeaflet(); }catch(e){ aviso.textContent = e.message; return; }
  if(v360S !== S || !document.getElementById('v360MapaBox')) return;
  const map = window.L.map('v360MapaBox'); S.mapa = map; S.marcas = {};
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
  const pts = geo.map(m=>{
    const mk = window.L.circleMarker([m.gps.lat, m.gps.lon], {radius:8, color:'#fff', weight:2, fillColor:'#2C6B7E', fillOpacity:1}).addTo(map);
    const div = document.createElement('div'), b = document.createElement('b'), btn = document.createElement('button');
    b.textContent = m.name; btn.type = 'button'; btn.className = 'btn-sm'; btn.style.marginTop = '6px'; btn.textContent = 'Abrir 360°';
    btn.addEventListener('click', ()=>{ map.closePopup(); v360Abrir(m.id); S.stage.scrollIntoView({block:'nearest', behavior:'smooth'}); });
    div.appendChild(b); div.appendChild(document.createElement('br')); div.appendChild(btn); mk.bindPopup(div);
    S.marcas[m.id] = mk; return [m.gps.lat, m.gps.lon];
  });
  map.fitBounds(pts, {padding:[30, 30], maxZoom:17});
  setTimeout(()=>{ if(S.mapa === map) map.invalidateSize(); }, 150);
  v360MapaSel(S);
}
const V360_SB = {url:'https://xoorsgrgptxvqtfaqdfw.supabase.co', key:'sb_publishable_JsifPijoGET8d5aZwcvHFg_YtTIGyN8', bucket:'panoramas'};
const V360_VISTA = 'https://geomav.me/360/';
function v360Aleat(n){ const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, b=> 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); }
function v360AuthGet(){ try{ return JSON.parse(localStorage.getItem('topocalc_v360_auth') || 'null'); }catch(e){ return null; } }
function v360AuthSet(j){
  try{
    if(!j){ localStorage.removeItem('topocalc_v360_auth'); return; }
    localStorage.setItem('topocalc_v360_auth', JSON.stringify({access:j.access_token, refresh:j.refresh_token, exp:Date.now() + (j.expires_in || 3600)*1000, email:(j.user && j.user.email) || ''}));
  }catch(e){}
}
function v360ErrSb(e){
  const m = String((e && e.message) || e || '');
  if(/invalid login|invalid_grant|invalid credentials/i.test(m)) return 'correo o contraseña incorrectos.';
  if(/row-level security|not authorized|unauthorized|jwt/i.test(m)) return 'tu cuenta no tiene permiso para subir (revisa las políticas del bucket «panoramas»).';
  if(/bucket not found/i.test(m)) return 'falta crear el bucket «panoramas» en Supabase.';
  if(/exceeded|too large|payload/i.test(m)) return 'el archivo es demasiado grande; elige una calidad menor.';
  if(/failed to fetch|networkerror|load failed/i.test(m)) return 'sin conexión a internet.';
  return m;
}
async function v360Sb(ruta, opt, tok){
  const h = Object.assign({apikey:V360_SB.key}, (opt && opt.headers) || {});
  if(tok) h.Authorization = 'Bearer ' + tok;
  const r = await fetch(V360_SB.url + ruta, Object.assign({}, opt, {headers:h}));
  const txt = await r.text(); let j = null; try{ j = txt ? JSON.parse(txt) : null; }catch(e){}
  if(!r.ok){ const err = new Error((j && (j.error_description || j.message || j.msg || j.error)) || ('Error ' + r.status)); err.status = r.status; throw err; }
  return j;
}
async function v360Login(correo, clave){
  const j = await v360Sb('/auth/v1/token?grant_type=password', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:correo, password:clave})});
  v360AuthSet(j); return j.access_token;
}
async function v360TokenValido(){
  const a = v360AuthGet(); if(!a || !a.access) return null;
  if(a.exp - Date.now() > 60000) return a.access;
  try{
    const j = await v360Sb('/auth/v1/token?grant_type=refresh_token', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refresh_token:a.refresh})});
    v360AuthSet(j); return j.access_token;
  }catch(e){ if(e.status && e.status < 500) v360AuthSet(null); return null; }
}
async function v360PrepararSubida(S, lado){
  const r = await v360Run(['blobs'], 'readonly', tx=> tx.objectStore('blobs').get(S.id));
  const m = S.meta, [tw, th] = v360Objetivo(m.w, m.h, lado);
  const bm = await v360Bitmap(r.result.blob, tw >= m.w ? 0 : tw, th);
  const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bm, 0, 0);
  const w = c.width, h = c.height; if(bm.close) bm.close();
  const blob = await new Promise((res, rej)=> c.toBlob(b=> b ? res(b) : rej(new Error('No se pudo preparar la imagen.')), 'image/jpeg', 0.88));
  return {blob, w, h};
}
function v360MetaPublica(m, titulo, w, h){
  return {v:1, titulo, tipo:m.tipo, crop:m.crop, pose:(m.pose === undefined ? null : m.pose), initH:(m.initH === undefined ? null : m.initH), hfov:m.hfov, w, h, img:'img.jpg', creado:new Date().toISOString()};
}
function v360SubirMeta(m, tok){
  const sh = m.share, meta = v360MetaPublica(m, sh.titulo, sh.w, sh.h);
  return v360Sb(`/storage/v1/object/${V360_SB.bucket}/${sh.token}/meta.json`, {method:'POST', headers:{'Content-Type':'application/json', 'x-upsert':'true'}, body:new Blob([JSON.stringify(meta)], {type:'application/json'})}, tok);
}
function v360CargarQr(){
  if(window.qrcode) return Promise.resolve();
  if(v360CargarQr.p) return v360CargarQr.p;
  return v360CargarQr.p = new Promise((res, rej)=>{
    const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    sc.onload = ()=> res(); sc.onerror = ()=>{ v360CargarQr.p = null; rej(new Error('No se pudo cargar el generador de QR (revisa tu conexión).')); };
    document.head.appendChild(sc);
  });
}
async function v360Qr(texto){
  const box = document.getElementById('v360QrBox'); if(!box) return;
  box.innerHTML = '<span class="tool-blurb">Generando…</span>';
  try{
    await v360CargarQr();
    const qr = window.qrcode(0, 'M'); qr.addData(texto); qr.make();
    const svg = qr.createSvgTag({cellSize:6, margin:2, scalable:true});
    if(document.getElementById('v360QrBox') !== box) return;
    box.innerHTML = svg + '<button type="button" class="btn-sm" id="v360QrDescarga">Descargar QR</button>';
    document.getElementById('v360QrDescarga').addEventListener('click', ()=> v360Descargar(new Blob([svg], {type:'image/svg+xml'}), 'qr-recorrido-360.svg'));
  }catch(e){ box.innerHTML = `<span class="err-msg">${vrEsc(e.message)}</span>`; }
}
function v360ShareMsg(t){ const e = document.getElementById('v360ShareMsg'); if(e) e.textContent = t || ''; }
function v360LinkDe(m){ return V360_VISTA + '?t=' + m.share.token; }
function v360PanelShare(m){
  const $ = id=> document.getElementById(id); if(!$('v360Share')) return;
  const a = v360AuthGet(), comp = !!m.share;
  $('v360ShareForm').style.display = comp ? 'none' : '';
  $('v360ShareDone').style.display = comp ? '' : 'none';
  $('v360ShareLogin').style.display = 'none';
  const ti = $('v360ShareTitulo');
  if(comp) ti.value = m.share.titulo; else if(ti.dataset.para !== m.id){ ti.value = m.name.replace(/\.[^.]+$/, ''); ti.dataset.para = m.id; }   // no pisa el título que ya escribiste
  $('v360Sesion').innerHTML = a && a.access ? `Sesión: ${vrEsc(a.email || 'iniciada')} · <a href="#" id="v360Cerrar">Cerrar sesión</a>` : '';
  const cs = $('v360Cerrar'); if(cs) cs.addEventListener('click', e=>{ e.preventDefault(); v360AuthSet(null); v360PanelShare(m); });
  if(comp){
    const lk = v360LinkDe(m); $('v360LinkTxt').value = lk;
    $('v360Embed').value = `<iframe src="${lk}" width="100%" height="480" style="border:0" allow="fullscreen; accelerometer; gyroscope; xr-spatial-tracking" allowfullscreen loading="lazy" title="${vrEsc(m.share.titulo)}"></iframe>`;
    v360Qr(lk);
  }
  v360ShareMsg('');
}
async function v360Compartir(S){
  const m = S.meta; if(!m) return;
  let tok = null; try{ tok = await v360TokenValido(); }catch(e){}
  if(!tok){ document.getElementById('v360ShareLogin').style.display = ''; v360ShareMsg('Inicia sesión con tu cuenta de Supabase para compartir (solo la primera vez en este equipo).'); const c = document.getElementById('v360Mail'); if(c) c.focus(); return; }
  const btn = document.getElementById('v360Crear'); btn.disabled = true;
  const titulo = (document.getElementById('v360ShareTitulo').value || '').trim().slice(0, 120) || m.name.replace(/\.[^.]+$/, '');
  const token = v360Aleat(20); let subida = false;
  try{
    v360ShareMsg('Preparando la imagen…');
    const lado = parseInt(document.getElementById('v360ShareCal').value, 10) || 8192;
    const {blob, w, h} = await v360PrepararSubida(S, lado);
    v360ShareMsg(`Subiendo ${(blob.size/1048576).toFixed(1)} MB…`);
    await v360Sb(`/storage/v1/object/${V360_SB.bucket}/${token}/img.jpg`, {method:'POST', headers:{'Content-Type':'image/jpeg', 'x-upsert':'false'}, body:blob}, tok);
    subida = true;
    m.share = {token, ts:Date.now(), titulo, w, h};
    await v360SubirMeta(m, tok);
    await v360Actualizar(S.id, {share:m.share});
    v360PanelShare(m); v360ShareMsg('Enlace creado. Cópialo o envíalo por WhatsApp.'); v360Galeria();
  }catch(e){
    if(subida){ delete m.share; try{ await v360Sb(`/storage/v1/object/${V360_SB.bucket}`, {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prefixes:[`${token}/img.jpg`, `${token}/meta.json`]})}, tok); }catch(_){} }
    v360ShareMsg('No se pudo compartir: ' + v360ErrSb(e));
  } finally { btn.disabled = false; }
}
async function v360EntrarSb(S){
  const correo = document.getElementById('v360Mail').value.trim(), clave = document.getElementById('v360Clave').value;
  if(!correo || !clave){ v360ShareMsg('Escribe tu correo y contraseña.'); return; }
  const btn = document.getElementById('v360Entrar'); btn.disabled = true; v360ShareMsg('Iniciando sesión…');
  try{ await v360Login(correo, clave); document.getElementById('v360Clave').value = ''; v360PanelShare(S.meta); await v360Compartir(S); }
  catch(e){ v360ShareMsg('No se pudo iniciar sesión: ' + v360ErrSb(e)); }
  finally{ btn.disabled = false; }
}
async function v360DejarCompartir(S){
  const m = S.meta; if(!m || !m.share) return;
  if(!confirm('¿Dejar de compartir? El enlace dejará de funcionar para tus clientes y se borrará la copia en la nube.')) return;
  let tok = null; try{ tok = await v360TokenValido(); }catch(e){}
  if(!tok){ v360ShareMsg('Inicia sesión para poder borrar el enlace: usa «Crear enlace» en otra imagen o cierra y vuelve a abrir esta ficha.'); document.getElementById('v360ShareLogin').style.display = ''; return; }
  try{
    await v360Sb(`/storage/v1/object/${V360_SB.bucket}`, {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prefixes:[`${m.share.token}/img.jpg`, `${m.share.token}/meta.json`]})}, tok);
    delete m.share; await v360Run(['meta'], 'readwrite', tx=>{ const st = tx.objectStore('meta'), g = st.get(S.id); g.onsuccess = ()=>{ if(g.result){ delete g.result.share; st.put(g.result); } }; });
    v360PanelShare(m); v360ShareMsg('Dejaste de compartir esta imagen.'); v360Galeria();
  }catch(e){ v360ShareMsg('No se pudo borrar: ' + v360ErrSb(e)); }
}
async function v360SincronizarShare(S){   // si cambias el tipo de una imagen ya compartida, se actualiza también para el cliente
  const m = S.meta; if(!m || !m.share) return;
  let tok = null; try{ tok = await v360TokenValido(); }catch(e){}
  if(!tok){ v360Msg('Tipo actualizado aquí. Para actualizar el enlace del cliente, inicia sesión al compartir otra vez.'); return; }
  try{ await v360SubirMeta(m, tok); v360Msg('Tipo de imagen actualizado (también en el enlace del cliente).'); }catch(e){ v360Msg('Tipo actualizado aquí, pero no en el enlace: ' + v360ErrSb(e)); }
}
function renderVisor360(){
  stopVisor360();
  const body = `
  <div class="v360-stage" id="v360Stage" tabindex="0" role="application" aria-label="Visor de imágenes 360°. Arrastra para mirar, rueda o pellizco para acercar.">
    <canvas id="v360Canvas"></canvas>
    <div class="v360-hero" id="v360Empty">
      <h2>Recorre y comparte<br><em>tu imagen 360°</em></h2>
      <p>Sube una foto de tu dron DJI o de la Insta360 y envía un enlace a tu cliente.</p>
      <button type="button" class="v360-cta" id="v360HeroG">⬆ Subir imagen 360°</button>
      <button type="button" class="v360-alt" id="v360HeroA">o elegir desde archivos</button>
      <small>Se guarda en tu equipo · no necesitas cuenta para verla</small>
    </div>
    <div class="v360-hud" id="v360Hud"></div>
    <button type="button" class="v360-vrx" id="v360VrX" aria-label="Salir del modo VR">✕ Salir de VR</button>
    <div class="v360-tip" id="v360Tip"><i><svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 15.5a1.5 1.5 0 0 1 2.4-1.7L9 16"/></svg></i><span>Toca y arrastra para mirar a tu alrededor.</span></div>
    <div class="v360-bar">
      <button type="button" class="v360-rb" data-a="gyro" title="Mover la vista con el sensor del teléfono" aria-label="Mover con el sensor del teléfono"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9.5" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="9.5"/><circle cx="12" cy="12" r="2.2"/></svg></button>
      <button type="button" class="v360-rb" data-a="vr" title="Modo VR para visor tipo Cardboard" aria-label="Modo VR"><svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="10.5" rx="3.5"/><circle cx="8" cy="12" r="1.8"/><circle cx="16" cy="12" r="1.8"/><path d="M10.5 15.5h3"/></svg></button>
      <button type="button" class="v360-rb" data-a="info" title="Datos de la imagen" aria-label="Datos de la imagen"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.01"/></svg></button>
      <div class="v360-info-pop" id="v360InfoPop"></div>
      <button type="button" class="v360-rb v360-brujula" data-a="reset" title="Centrar la vista" aria-label="Centrar la vista"><svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="#8a8f94" opacity=".75"/><g id="v360Cono"><path d="M17 17 L9 5 A16 16 0 0 1 25 5 Z" fill="#0A1118"/></g><circle cx="17" cy="17" r="3.5" fill="#000" stroke="#fff" stroke-width="1.6"/></svg></button>
      <button type="button" class="v360-rb" data-a="full" title="Pantalla completa" aria-label="Pantalla completa"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
      <button type="button" class="v360-rb" data-a="menu" title="Menú" aria-label="Menú"><svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg></button>
      <div class="v360-menu" id="v360Menu">
        <h4>Vista</h4>
        <div class="fila">
          <button type="button" class="v360-pill" data-a="auto" id="v360MAuto"><i><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg></i><span>Giro<br>automático</span></button>
          <button type="button" class="v360-pill" data-a="reset"><i><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg></i><span>Centrar<br>vista</span></button>
          <button type="button" class="v360-pill" data-a="shot"><i><svg viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></i><span>Guardar<br>captura</span></button>
          <button type="button" class="v360-pill" data-a="subir"><i><svg viewBox="0 0 24 24"><path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M5 19h14"/></svg></i><span>Subir otra<br>imagen</span></button>
        </div>
        <div id="v360MCompartir" style="text-align:center;">
          <h4>Compartir</h4>
          <div id="v360MShareOff" class="fila" style="margin-top:10px;">
            <button type="button" class="v360-pill" data-a="mcrear"><i><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/></svg></i><span>Crear enlace<br>para compartir</span></button>
          </div>
          <div id="v360MShareOn" style="display:none;">
            <div class="fila" style="margin:10px 0;">
              <button type="button" class="v360-rb" style="position:static;border:1.5px solid #6fd0c0;" data-a="mwsp" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5.3A8.5 8.5 0 1 1 21 12z"/></svg></button>
              <button type="button" class="v360-rb" style="position:static;border:1.5px solid #6fd0c0;" data-a="mfb" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" style="fill:#fff;stroke:none"/></svg></button>
              <button type="button" class="v360-rb" style="position:static;border:1.5px solid #6fd0c0;" data-a="mx" aria-label="X"><svg viewBox="0 0 24 24"><path d="M5 4l14 16M19 4L5 20"/></svg></button>
              <button type="button" class="v360-rb" style="position:static;border:1.5px solid #6fd0c0;font-weight:800;font-size:12px;" data-a="msms" aria-label="SMS">SMS</button>
            </div>
            <div class="fila">
              <button type="button" class="v360-pill" data-a="mlink"><i><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></i><span>Enlace<br>directo</span></button>
              <button type="button" class="v360-pill" data-a="membed"><i><svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg></i><span>Código de<br>inserción</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <p id="v360Msg" class="proj-msg" role="status" aria-live="polite"></p>

  <div id="v360Pasos">
    <h3 style="margin-top:16px; font-size:15px;">Cómo funciona</h3>
    <div class="v360-pasos">
      <div class="v360-paso"><span class="n">1</span><div><b>Subir</b><span class="t">Elige una imagen 360° desde tu galería o tus archivos.</span></div></div>
      <div class="v360-paso"><span class="n">2</span><div><b>Explorar</b><span class="t">Recórrela con el dedo, el sensor del teléfono o en modo VR.</span></div></div>
      <div class="v360-paso"><span class="n">3</span><div><b>Compartir</b><span class="t">Crea un enlace, un QR o un código para insertarla en una web.</span></div></div>
    </div>
  </div>

  <div class="field-card" id="v360Info" style="display:none;">
    <h3>Imagen actual</h3>
    <div class="results" id="v360InfoRows" style="margin-top:0;"></div>
    <details class="vr-datos" style="margin-top:12px;"><summary style="cursor:pointer; font-size:12.5px; font-weight:600; color:var(--ink-soft);">Ajustes de la imagen</summary>
      <div class="field-row" style="margin-top:10px;"><label for="v360Tipo">Tipo de imagen</label>
        <select id="v360Tipo"><option value="sphere">Esfera completa 360° × 180°</option><option value="partial">Panorama parcial</option><option value="flat">Foto plana (sin 360°)</option></select></div>
      <div class="field-row" id="v360HfovRow" style="display:none;"><label for="v360Hfov">Ángulo horizontal que cubre (°)</label><input type="number" id="v360Hfov" step="any" min="10" max="360" value="180"></div>
      <div class="field-row"><label for="v360Res">Resolución en pantalla</label>
        <select id="v360Res"><option value="normal">Normal (hasta 4096 px)</option><option value="alta">Alta (hasta 8192 px)</option><option value="max">Máxima (la que permita tu equipo)</option></select></div>
      <p class="tool-blurb" style="margin:0 0 10px;">Si cambias el tipo, la imagen original no se modifica; solo cambia cómo se muestra. Resolución más alta = más detalle, pero usa más memoria de video; en teléfonos conviene «Alta».</p>
      <div class="action-row" style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-sm" id="v360Aplicar">Aplicar tipo</button>
        <button type="button" class="btn-sm" id="v360Original">⬇ Descargar original</button>
      </div>
    </details>
  </div>

  <div class="field-card" id="v360Share" role="dialog" aria-modal="true" aria-label="Compartir con un cliente">
    <button type="button" class="v360-x" id="v360ShareX" aria-label="Cerrar">✕</button>
    <h3>Compartir con un cliente</h3>
    <div id="v360ShareForm">
      <p class="tool-blurb" style="margin:0 0 10px;">Sube una copia de esta imagen y genera un enlace que tu cliente abre en el navegador, sin instalar nada. Quien tenga el enlace puede verla. La copia no incluye tu ubicación GPS.</p>
      <div class="field-row"><label for="v360ShareTitulo">Título que verá el cliente</label><input type="text" id="v360ShareTitulo" maxlength="120"></div>
      <div class="field-row"><label for="v360ShareCal">Calidad de la copia</label>
        <select id="v360ShareCal"><option value="4096">Liviana (4096 px) · carga rápido</option><option value="8192" selected>Alta (8192 px) · recomendada</option><option value="16384">Máxima (hasta 16384 px) · pesada</option></select></div>
      <div id="v360ShareLogin" style="display:none;">
        <div class="field-row"><label for="v360Mail">Correo de tu cuenta</label><input type="email" id="v360Mail" autocomplete="username"></div>
        <div class="field-row"><label for="v360Clave">Contraseña</label><input type="password" id="v360Clave" autocomplete="current-password"></div>
        <button type="button" class="btn-sm" id="v360Entrar">Iniciar sesión y compartir</button>
      </div>
      <button type="button" class="btn" id="v360Crear" style="margin-top:6px;">🔗 Crear enlace</button>
    </div>
    <div id="v360ShareDone" style="display:none;">
      <details class="v360-acc" open><summary>🔗 Enlace directo</summary><div>
        <div class="field-row"><label for="v360LinkTxt">Enlace para el cliente</label><input type="text" id="v360LinkTxt" readonly></div>
        <div class="action-row" style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-sm" id="v360Copiar">Copiar enlace</button>
          <button type="button" class="btn-sm" id="v360Wsp">Enviar por WhatsApp</button>
          <button type="button" class="btn-sm" id="v360Abrir2">Ver como cliente</button>
        </div></div></details>
      <details class="v360-acc" id="v360AccQr"><summary>▦ Código QR</summary><div><div class="v360-qr" id="v360QrBox"><span class="tool-blurb">Generando…</span></div></div></details>
      <details class="v360-acc"><summary>&lt;/&gt; Código para insertar en una web</summary><div>
        <textarea class="v360-code" id="v360Embed" readonly rows="4" aria-label="Código de inserción"></textarea>
        <button type="button" class="btn-sm" id="v360CopiarEmbed" style="margin-top:8px;">Copiar código</button></div></details>
      <button type="button" class="btn-sm" id="v360Dejar" style="margin-top:12px;">Dejar de compartir</button>
    </div>
    <p class="proj-msg" id="v360ShareMsg" role="status" aria-live="polite" style="margin-top:8px;"></p>
    <p class="proj-msg" id="v360Sesion" style="margin-top:2px;"></p>
  </div>

  <div class="field-card" id="v360Mapa" style="display:none;">
    <h3>Ubicación de las imágenes</h3>
    <div id="v360MapaBox" style="height:260px; border-radius:10px; overflow:hidden; border:1px solid var(--line, #d8dde0);"></div>
    <p class="proj-msg" id="v360MapaMsg" style="margin-top:6px;"></p>
  </div>

  <details class="v360-acc" id="v360Formatos"><summary>Formatos y límites</summary><div>
    <div class="v360-chips"><span class="v360-chip">JPG</span><span class="v360-chip">PNG</span><span class="v360-chip">WebP</span></div>
    <p class="tool-blurb" style="margin:0 0 8px;">Imágenes 360° en proyección equirectangular (2:1): panoramas de esfera del dron DJI y fotos de la Insta360 X4 exportadas como JPG. HEIC, TIFF y los archivos propios de la cámara (.insp, .insv, .dng) se deben exportar o convertir antes.</p>
    <div class="v360-chips"><span class="v360-chip">Hasta 16384 px de ancho</span><span class="v360-chip">Copia para clientes: 40 MB máx.</span></div>
    <p class="tool-blurb" style="margin:0;">En el teléfono se muestran hasta 8192 px; las imágenes se guardan solo en este equipo.</p>
  </div></details>

  <div class="field-card" id="v360Gal" style="margin-top:12px;">
    <input type="file" id="v360FileG" accept="image/*" multiple hidden>
    <input type="file" id="v360File" accept="image/*,.insp,.insv,.dng" multiple hidden>
    <p class="proj-msg" id="v360Total" style="margin:0 0 8px;"></p>
    <div class="err-msg" id="v360Aviso" role="alert" style="display:none; margin-bottom:10px;"></div>
    <div id="v360Lista"></div>
  </div>`;
  toolShell('visor360', 'Visor de imágenes 360° exportadas por drones DJI (Mavic Air 2S, Matrice 4E) y por la Insta360 X4. Arrastra para mirar alrededor, rueda o pellizco para acercar, doble toque para centrar.', body);
  const tv = document.querySelector('.tool-view'); if(tv) tv.classList.add('tool-wide');
  const ab = tv && tv.querySelector('.action-bar'); if(ab) ab.style.display = 'none';

  const stage = document.getElementById('v360Stage'), canvas = document.getElementById('v360Canvas');
  let gl = null;
  try{ gl = canvas.getContext('webgl2', {antialias:false, alpha:false, powerPreference:'high-performance'}); }catch(e){}
  const S = {stage, canvas, gl, hud:document.getElementById('v360Hud'), tok:0, id:null, meta:null, texOk:false, tipo:'sphere', crop:[0,0,1,1],
    yaw:0, pitch:0, yaw0:0, fov:75, vyaw:0, vpitch:0, fc:[0.5,0.5], fs:1, fsFit:1, imgAsp:2, M:v360MatVista(0,0), yawOff:0,
    resSel:(function(){ try{ return localStorage.getItem('topocalc_v360_res') || 'alta'; }catch(e){ return 'alta'; } })()};
  document.getElementById('v360Res').value = V360_RES[S.resSel] ? S.resSel : 'alta';

  if(!gl){
    document.getElementById('v360Empty').textContent = 'Este navegador o equipo no soporta WebGL 2, que el visor 360° necesita. Prueba con Chrome actualizado.';
    ['v360HeroG', 'v360HeroA'].forEach(i=>{ const e = document.getElementById(i); if(e) e.disabled = true; });
  } else {
    try{ v360MontarGL(S); }catch(e){
      document.getElementById('v360Empty').textContent = 'No se pudo iniciar el visor 3D en este equipo.'; console.error(e); ['v360HeroG', 'v360HeroA'].forEach(i=>{ const e = document.getElementById(i); if(e) e.disabled = true; });
    }
  }
  v360S = S;
  if(!gl || !S.u){ v360Galeria(); return; }

  /* ---- contexto perdido (el sistema libera la GPU al pasar a segundo plano): se reconstruye y se reabre la imagen ---- */
  canvas.addEventListener('webglcontextlost', e=>{ e.preventDefault(); S.perdido = true; if(S.raf){ cancelAnimationFrame(S.raf); S.raf = 0; } });
  canvas.addEventListener('webglcontextrestored', ()=>{
    S.perdido = false;
    try{ v360MontarGL(S); }catch(e){ return; }
    const id = S.id; S.texOk = false; if(id) v360Abrir(id); else v360Pedir(S);
  });

  /* ---- tamaño ---- */
  S.ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(()=> v360Ajustar(S)) : null;
  if(S.ro) S.ro.observe(canvas); else window.addEventListener('resize', ()=> v360Ajustar(S));
  v360Ajustar(S);

  /* ---- gestos: arrastre, pellizco, rueda, doble toque, teclado ---- */
  const ptrs = new Map(); let dist0 = 0, ultimo = null;
  canvas.addEventListener('pointerdown', e=>{
    if(!S.texOk) return;
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    const tp = document.getElementById('v360Tip'); if(tp) tp.classList.add('off'); if(S.menu) v360Menu(S, false); if(S.infoOpen) v360InfoPop(S, false);
    ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY}); S.drag = true; S.vyaw = S.vpitch = 0; stage.classList.add('v360-drag');
    if(ptrs.size === 2){ const [a, b] = [...ptrs.values()]; dist0 = Math.hypot(a.x-b.x, a.y-b.y); }
    ultimo = {t:performance.now(), x:e.clientX, y:e.clientY};
  });
  canvas.addEventListener('pointermove', e=>{
    const p = ptrs.get(e.pointerId); if(!p || !S.texOk) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    const H = Math.max(1, canvas.clientHeight);
    if(ptrs.size === 2){
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x-b.x, a.y-b.y);
      if(dist0 > 0 && d > 0){ const k = dist0/d; if(S.tipo === 'flat') S.fs = Math.max(0.03, Math.min(S.fsFit*1.5, S.fs*k)); else S.fov = Math.max(20, Math.min(100, S.fov*k)); }
      dist0 = d;
    } else if(S.tipo === 'flat'){
      S.fc[0] = Math.max(0, Math.min(1, S.fc[0] - dx*S.fs/(H*S.imgAsp))); S.fc[1] = Math.max(0, Math.min(1, S.fc[1] - dy*S.fs/H));
    } else {
      const k = S.fov/H;
      if(S.gyro) S.yawOff -= dx*k*Math.PI/180; else { S.yaw -= dx*k; S.pitch += dy*k; }
      const ahora = performance.now(), dt = Math.max(1, ahora - ultimo.t)/1000;
      S.vyaw = 0.6*S.vyaw + 0.4*(-dx*k/dt); S.vpitch = S.gyro ? 0 : 0.6*S.vpitch + 0.4*(dy*k/dt); ultimo = {t:ahora, x:e.clientX, y:e.clientY};
    }
    v360Pedir(S);
  });
  const soltar = e=>{
    ptrs.delete(e.pointerId); if(ptrs.size === 1){ dist0 = 0; } if(!ptrs.size){ S.drag = false; stage.classList.remove('v360-drag'); if(performance.now() - (ultimo ? ultimo.t : 0) > 90) S.vyaw = S.vpitch = 0; v360Pedir(S); }
  };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('wheel', e=>{
    if(!S.texOk) return; e.preventDefault();
    const k = Math.exp(e.deltaY*0.0012);
    if(S.tipo === 'flat') S.fs = Math.max(0.03, Math.min(S.fsFit*1.5, S.fs*k)); else S.fov = Math.max(20, Math.min(100, S.fov*k));
    v360Pedir(S);
  }, {passive:false});
  canvas.addEventListener('dblclick', ()=>{ if(S.texOk) v360Reiniciar(S); });
  S.onKey = e=>{
    if(!S.texOk || (document.activeElement !== stage && !S.full)) return;
    const paso = 5, z = {'+':0.9, '=':0.9, '-':1.1, '_':1.1};
    if(e.key === 'Escape' && S.vr){ v360VR(S, false); return; }
    if(e.key === 'Escape' && S.full){ v360Pantalla(S, false); return; }
    if(z[e.key]){ if(S.tipo === 'flat') S.fs = Math.max(0.03, Math.min(S.fsFit*1.5, S.fs*z[e.key])); else S.fov = Math.max(20, Math.min(100, S.fov*z[e.key])); }
    else if(S.tipo === 'flat'){ const m = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key]; if(!m) return; S.fc[0] = Math.max(0, Math.min(1, S.fc[0] + m[0]*0.05*S.fs/S.imgAsp)); S.fc[1] = Math.max(0, Math.min(1, S.fc[1] + m[1]*0.05*S.fs)); }
    else { const m = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,1], ArrowDown:[0,-1]}[e.key]; if(!m) return; if(S.gyro) S.yawOff += m[0]*paso*Math.PI/180; else { S.yaw += m[0]*paso; S.pitch += m[1]*paso; } }
    e.preventDefault(); v360Pedir(S);
  };
  window.addEventListener('keydown', S.onKey);

  /* ---- botones de la barra ---- */
  stage.querySelector('.v360-bar').addEventListener('click', async e=>{
    const b = e.target.closest('button'); if(!b || !S.texOk) return;
    const a = b.dataset.a;
    if(a === 'reset'){ v360Reiniciar(S); v360Menu(S, false); }
    else if(a === 'auto'){ S.auto = !S.auto; b.classList.toggle('on', S.auto); v360Pedir(S); v360Menu(S, false); }
    else if(a === 'subir'){ v360Menu(S, false); const f = document.getElementById('v360FileG'); if(f) f.click(); }
    else if(a === 'menu') v360Menu(S);
    else if(a === 'info') v360InfoPop(S);
    else if(a === 'mcrear'){   // se abre la ficha «Compartir con un cliente» (ahí se elige título y calidad y se crea el enlace)
      v360Menu(S, false); if(S.full) v360Pantalla(S, false);
      const pn = document.getElementById('v360Share'); if(pn){ v360PanelShare(S.meta); pn.classList.add('abierto'); pn.scrollTop = 0; }
    }
    else if(['mlink', 'mwsp', 'mfb', 'mx', 'msms', 'membed'].includes(a)){
      const sh = S.meta && S.meta.share; if(!sh) return;
      const url = v360LinkDe(S.meta), t = `Recorre la imagen 360° «${sh.titulo}» de GEOMAV`;
      const cp = (txt, ok)=> (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(()=> v360Msg(ok), ()=> v360Msg(txt));
      if(a === 'mwsp'){ if(navigator.share) navigator.share({text:`${t}: ${url}`}).catch(()=>{}); else window.open('https://wa.me/?text=' + encodeURIComponent(`${t}: ${url}`), '_blank', 'noopener'); }
      else if(a === 'mfb') window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener');
      else if(a === 'mx') window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(t), '_blank', 'noopener');
      else if(a === 'msms') location.href = 'sms:?&body=' + encodeURIComponent(`${t}: ${url}`);
      else if(a === 'membed') cp(document.getElementById('v360Embed').value, 'Código de inserción copiado.');
      else cp(url, 'Enlace copiado.');
      v360Menu(S, false);
    }
    else if(a === 'gyro'){
      if(S.tipo === 'flat'){ v360Msg('El sensor solo funciona con imágenes 360°.'); return; }
      if(S.gyro){ v360SensorOff(S); v360Msg(''); } else if(await v360SensorOn(S)){ b.classList.add('on'); v360Msg(''); }
    }
    else if(a === 'vr') v360VR(S, !S.vr);
    else if(a === 'full'){ if(S.vr) v360VR(S, false); else v360Pantalla(S); }
    else if(a === 'shot'){
      v360Menu(S, false); v360Dibujar(S);
      canvas.toBlob(blob=>{
        if(!blob){ v360Msg('No se pudo generar la captura.'); return; }
        const nombre = 'vista360-' + ((S.meta && S.meta.name) || 'imagen').replace(/\.[^.]+$/, '') + '.jpg';
        const file = new File([blob], nombre, {type:'image/jpeg'});
        if(navigator.canShare && navigator.canShare({files:[file]})) navigator.share({files:[file], title:'Vista 360°'}).catch(()=>{});
        else { v360Descargar(blob, nombre); v360Msg('Captura descargada.'); }
      }, 'image/jpeg', 0.92);
    }
  });

  /* ---- ajustes de la imagen ---- */
  document.getElementById('v360Tipo').addEventListener('change', e=>{ document.getElementById('v360HfovRow').style.display = e.target.value === 'partial' ? '' : 'none'; });
  document.getElementById('v360Aplicar').addEventListener('click', async ()=>{
    if(!S.meta) return;
    const tipo = document.getElementById('v360Tipo').value, hf = parseFloat(document.getElementById('v360Hfov').value);
    if(tipo === 'partial' && !(hf >= 10 && hf <= 360)){ v360Msg('Indica un ángulo horizontal entre 10° y 360°.'); return; }
    const crop = tipo === 'sphere' ? [0, 0, 1, 1] : tipo === 'partial' ? v360CropManual(hf, S.meta.w, S.meta.h) : null;
    const parche = {tipo, fuente:'manual', crop, hfov: tipo === 'sphere' ? 360 : tipo === 'partial' ? hf : null};
    Object.assign(S.meta, parche);
    try{ await v360Actualizar(S.id, parche); }catch(e){}
    v360AplicarTipo(S, S.meta); v360PanelInfo(S.meta, S.cargada.w, S.cargada.h); v360Galeria(); v360Msg('Tipo de imagen actualizado.'); v360PanelShare(S.meta); v360SincronizarShare(S);
  });
  document.getElementById('v360Res').addEventListener('change', e=>{
    S.resSel = e.target.value; try{ localStorage.setItem('topocalc_v360_res', S.resSel); }catch(_){}
    if(S.id) v360Abrir(S.id);
  });
  document.getElementById('v360Original').addEventListener('click', async ()=>{
    if(!S.id) return;
    try{ const r = await v360Run(['blobs'], 'readonly', tx=> tx.objectStore('blobs').get(S.id)); v360Descargar(r.result.blob, S.meta.name); }catch(e){ v360Msg('No se pudo descargar el original.'); }
  });

  document.getElementById('v360VrX').addEventListener('click', ()=> v360VR(S, false));

  /* ---- compartir ---- */
  document.getElementById('v360ShareX').addEventListener('click', ()=> document.getElementById('v360Share').classList.remove('abierto'));
  document.getElementById('v360Crear').addEventListener('click', ()=> v360Compartir(S));
  document.getElementById('v360Entrar').addEventListener('click', ()=> v360EntrarSb(S));
  document.getElementById('v360Clave').addEventListener('keydown', e=>{ if(e.key === 'Enter') v360EntrarSb(S); });
  document.getElementById('v360Dejar').addEventListener('click', ()=> v360DejarCompartir(S));
  document.getElementById('v360Abrir2').addEventListener('click', ()=>{ if(S.meta && S.meta.share) window.open(v360LinkDe(S.meta), '_blank', 'noopener'); });
  document.getElementById('v360Copiar').addEventListener('click', ()=>{
    const t = S.meta && S.meta.share ? v360LinkDe(S.meta) : ''; if(!t) return;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=> v360ShareMsg('Enlace copiado.'), ()=>{ const i = document.getElementById('v360LinkTxt'); i.select(); v360ShareMsg('Selecciona y copia el enlace.'); });
  });
  document.getElementById('v360CopiarEmbed').addEventListener('click', ()=>{
    const t = document.getElementById('v360Embed').value; if(!t) return;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=> v360ShareMsg('Código copiado.'), ()=>{ document.getElementById('v360Embed').select(); v360ShareMsg('Selecciona y copia el código.'); });
  });
  document.getElementById('v360Wsp').addEventListener('click', ()=>{
    if(!S.meta || !S.meta.share) return;
    const txt = `Hola, aquí puedes recorrer la imagen 360° «${S.meta.share.titulo}»: ${v360LinkDe(S.meta)}`;
    if(navigator.share) navigator.share({text:txt}).catch(()=>{}); else window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  });

  /* ---- importar: botón y arrastrar-soltar ---- */
  const inp = document.getElementById('v360File');
  inp.addEventListener('change', ()=>{ const f = Array.from(inp.files); inp.value = ''; v360CargarArchivos(f); });
  const inpG = document.getElementById('v360FileG');   // galería: solo "image/*" hace que Android abra el selector de fotos
  document.getElementById('v360HeroG').addEventListener('click', ()=> inpG.click());
  document.getElementById('v360HeroA').addEventListener('click', ()=> inp.click());
  inpG.addEventListener('change', ()=>{ const f = Array.from(inpG.files); inpG.value = ''; v360CargarArchivos(f); });
  const gal = document.getElementById('v360Gal');
  ['dragenter', 'dragover'].forEach(n=> gal.addEventListener(n, e=>{ e.preventDefault(); gal.classList.add('v360-over'); }));
  ['dragleave', 'drop'].forEach(n=> gal.addEventListener(n, e=>{ e.preventDefault(); gal.classList.remove('v360-over'); }));
  gal.addEventListener('drop', e=> v360CargarArchivos(Array.from(e.dataTransfer.files)));

  v360Galeria();
  v360Pedir(S);
  v360TomarCompartidas();
}
async function v360TomarCompartidas(){
  let n = 0; try{ n = parseInt(new URLSearchParams(location.search).get('recibido') || '0', 10) || 0; }catch(e){}
  if(!n || !window.caches) return;
  try{ history.replaceState(null, '', location.pathname + location.hash); }catch(e){}
  try{
    const cache = await caches.open('topocalc-compartido'), archivos = [];
    for(const rq of await cache.keys()){
      const r = await cache.match(rq); if(!r) continue;
      const nombre = decodeURIComponent(new URL(rq.url).searchParams.get('n') || 'imagen.jpg'), blob = await r.blob();
      archivos.push(new File([blob], nombre, {type: blob.type || 'image/jpeg'}));
    }
    for(const rq of await cache.keys()) await cache.delete(rq);
    if(archivos.length) v360CargarArchivos(archivos); else v360Msg('No llegó ninguna imagen desde la galería.');
  }catch(e){ v360Msg('No se pudo recibir la imagen compartida.'); }
}
function stopVisor360(){
  const S = v360S; if(!S) return;
  v360S = null;
  if(S.raf) cancelAnimationFrame(S.raf);
  if(S.ro) S.ro.disconnect();
  if(S.onOri) window.removeEventListener('deviceorientation', S.onOri, true);
  if(S.onKey) window.removeEventListener('keydown', S.onKey);
  document.body.style.overflow = '';
  if(S.vr){ try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} }
  if(S.mapa){ try{ S.mapa.remove(); }catch(e){} }
  try{ const x = S.gl && S.gl.getExtension('WEBGL_lose_context'); if(x) x.loseContext(); }catch(e){}
}

const RENDERERS = { visor360: renderVisor360 };
