"use strict";
/* Herramienta «Visor de Video»: reproduce dentro de la app videos de Dailymotion, YouTube, Vimeo, Google Drive,
   archivos directos (.mp4/.webm) y videos del propio equipo. Usa los reproductores oficiales de cada plataforma (iframe)
   y no extrae ni descarga contenido de terceros. */
const VV_HIST_KEY = 'topocalc_visorvideo_hist';
/* Dailymotion ya no deja incrustar con la dirección genérica (player.html?video=ID responde «Forbidden»): exige el identificador de un reproductor.
   xjnde es el reproductor por defecto público de Dailymotion; si se crea uno propio en Dailymotion Studio, basta cambiar este valor. */
const VV_DM_PLAYER = 'xjnde';
const VV_PLAT = { dailymotion:'Dailymotion', youtube:'YouTube', vimeo:'Vimeo', drive:'Google Drive', archivo:'archivo de video' };

/* Interpreta un enlace (o un código <iframe> pegado) y devuelve cómo reproducirlo; null si no se reconoce. */
function vvParse(raw){
  let s = String(raw || '').trim();
  if(!s) return null;
  const mi = s.match(/src\s*=\s*["']([^"']+)["']/i);          // admite pegar un código <iframe ...>
  if(mi) s = mi[1];
  if(s.startsWith('//')) s = 'https:' + s;
  if(!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u; try{ u = new URL(s); }catch(e){ return null; }
  const h = u.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const seg = u.pathname.split('/').filter(Boolean);

  if(h === 'dailymotion.com' || h === 'dai.ly' || h === 'geo.dailymotion.com'){
    let id = null;
    if(h === 'geo.dailymotion.com') id = u.searchParams.get('video');
    else if(h === 'dai.ly') id = seg[0];
    else { const i = seg.indexOf('video'); if(i >= 0 && seg[i+1]) id = seg[i+1].split('_')[0]; }
    if(id && /^[a-z0-9]{5,12}$/i.test(id))
      return { plat:'dailymotion', id, embed:'https://geo.dailymotion.com/player/' + VV_DM_PLAYER + '.html?video=' + id, orig:'https://www.dailymotion.com/video/' + id };
    return null;
  }
  if(h === 'youtube.com' || h === 'youtube-nocookie.com' || h === 'music.youtube.com' || h === 'youtu.be'){
    let id = null;
    if(h === 'youtu.be') id = seg[0];
    else if(seg[0] === 'watch') id = u.searchParams.get('v');
    else if(['embed','shorts','live','v'].includes(seg[0])) id = seg[1];
    if(id === 'videoseries') id = null;
    if(id && /^[\w-]{11}$/.test(id))
      return { plat:'youtube', id, embed:'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&playsinline=1', orig:'https://www.youtube.com/watch?v=' + id };
    const list = u.searchParams.get('list');
    if(list && /^[\w-]{10,}$/.test(list))
      return { plat:'youtube', id:list, embed:'https://www.youtube-nocookie.com/embed/videoseries?list=' + list, orig:'https://www.youtube.com/playlist?list=' + list };
    return null;
  }
  if(h === 'vimeo.com' || h === 'player.vimeo.com'){
    const i = seg.findIndex(x => /^\d{6,12}$/.test(x));
    if(i < 0) return null;
    const id = seg[i];
    let hash = u.searchParams.get('h');
    if(!hash && seg[i+1] && /^[a-f0-9]{8,12}$/i.test(seg[i+1])) hash = seg[i+1];
    if(hash && !/^[a-f0-9]{6,16}$/i.test(hash)) hash = null;
    return { plat:'vimeo', id, embed:'https://player.vimeo.com/video/' + id + (hash ? '?h=' + hash : ''), orig:'https://vimeo.com/' + id + (hash ? '/' + hash : '') };
  }
  if(h === 'drive.google.com'){
    const i = seg.indexOf('d');
    const id = i >= 0 ? seg[i+1] : u.searchParams.get('id');
    if(id && /^[\w-]{10,}$/.test(id))
      return { plat:'drive', id, embed:'https://drive.google.com/file/d/' + id + '/preview', orig:'https://drive.google.com/file/d/' + id + '/view',
               descarga:'https://drive.google.com/uc?export=download&id=' + id };
    return null;
  }
  if(/\.(mp4|m4v|webm|ogv|mov)$/i.test(u.pathname))
    return { plat:'archivo', id:decodeURIComponent(seg[seg.length-1] || u.hostname), video:u.href, orig:u.href, descarga:u.href };
  return null;
}

function vvHistLeer(){ try{ const a = JSON.parse(localStorage.getItem(VV_HIST_KEY) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
function vvHistGuardar(a){ try{ localStorage.setItem(VV_HIST_KEY, JSON.stringify(a)); }catch(e){} }

function renderVisorVideo(){
  const body = `<style>
    .vv-btns{display:flex; flex-wrap:wrap; gap:8px; margin:10px 0;}
    .vv-btns .btn{flex:1 1 100%;}
    .vv-btns .btn-sm{flex:1 1 auto; text-align:center; cursor:pointer;}
    .vv-wrap{position:relative; width:100%; margin:14px auto 0; background:#000;}   /* sin border-radius/overflow: recortar un video en reproducción con esquinas redondeadas causa fallas de dibujo en Chrome de Android */
    .vv-h{aspect-ratio:16/9;}
    .vv-v{aspect-ratio:9/16; max-width:360px;}
    .vv-wrap iframe,.vv-wrap video{position:absolute; inset:0; width:100%; height:100%; border:0; background:#000;}
    .vv-acc{display:flex; flex-wrap:wrap; gap:8px; margin:10px 0;}
    .vv-acc .btn-sm{text-decoration:none; display:inline-flex; align-items:center;}
    .vv-hist{margin-top:14px;}
    .vv-hist h3{font-size:13px; margin:0 0 8px;}
    .vv-chips{display:flex; flex-wrap:wrap; gap:6px;}
    .vv-chip{border:1px solid var(--blueprint); background:transparent; color:inherit; border-radius:999px; padding:5px 11px; font:inherit; font-size:12.5px; cursor:pointer;}
  </style>
  <div class="field-card">
    <div class="field-row"><label for="vv_url">Enlace del video</label>
      <input type="url" id="vv_url" inputmode="url" placeholder="https://www.dailymotion.com/video/…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    <div class="vv-btns">
      <button class="btn" id="vv_ver" type="button">▶ Ver video</button>
      <button class="btn-sm" id="vv_pegar" type="button">📋 Pegar y ver</button>
      <label class="btn-sm" for="vv_file">📁 Video del equipo</label>
      <input type="file" id="vv_file" accept="video/*" hidden>
    </div>
    <div class="field-row"><label for="vv_fmt">Formato en pantalla</label>
      <select id="vv_fmt"><option value="v" selected>Vertical 9:16</option><option value="h">Horizontal 16:9</option></select></div>
    <div id="vv_msg"></div>
  </div>
  <div id="vv_player"></div>
  <div class="vv-hist" id="vv_hist"></div>`;
  toolShell('visorVideo', 'Mira videos dentro de la app pegando su enlace: Dailymotion, YouTube, Vimeo, Google Drive o un archivo .mp4/.webm. También reproduce videos guardados en tu equipo. Se usan los reproductores oficiales de cada plataforma.', body);
  const ab = document.querySelector('.tool-view .action-bar'); if(ab) ab.style.display = 'none';

  const $ = id => document.getElementById(id);
  let actual = null, objUrl = null;
  const msg = (t, err) => { $('vv_msg').innerHTML = t ? `<p class="${err ? 'err-msg' : 'proj-msg'}" role="${err ? 'alert' : 'status'}">${t}</p>` : ''; };

  function dibujarHist(){
    const a = vvHistLeer();
    $('vv_hist').innerHTML = a.length ? `<h3>Videos recientes</h3><div class="vv-chips">${a.map((x, i) =>
      `<button type="button" class="vv-chip" data-i="${i}">${vrEsc(VV_PLAT[x.p] || x.p)} · ${vrEsc(String(x.id).slice(0, 22))}</button>`).join('')}</div>
      <button type="button" class="btn-sm" id="vv_borrar" style="margin-top:10px;">🗑 Borrar recientes</button>` : '';
    document.querySelectorAll('.vv-chip').forEach(b => b.addEventListener('click', () => { $('vv_url').value = a[+b.dataset.i].u; ver(); }));
    const bb = $('vv_borrar'); if(bb) bb.addEventListener('click', () => { vvHistGuardar([]); dibujarHist(); });
  }
  function recordar(v){
    if(v.local) return;
    const a = vvHistLeer().filter(x => x.u !== v.orig);
    a.unshift({ u:v.orig, p:v.plat, id:v.id });
    vvHistGuardar(a.slice(0, 8)); dibujarHist();
  }
  function copiar(texto){
    const ok = () => msg('Código copiado. Pégalo en tu página web.', false);
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(texto).then(ok).catch(() => msg('No se pudo copiar automáticamente.', true)); return; }
    try{ const t = document.createElement('textarea'); t.value = texto; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); ok(); }catch(e){ msg('No se pudo copiar automáticamente.', true); }
  }
  function mostrar(v){
    actual = v;
    const vertical = $('vv_fmt').value === 'v';
    const media = v.video
      ? `<video controls playsinline preload="metadata" src="${vrEsc(v.video)}"></video>`
      : `<iframe src="${vrEsc(v.embed)}" title="Reproductor de video" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    const nombre = VV_PLAT[v.plat];
    $('vv_player').innerHTML = `<div class="vv-wrap ${vertical ? 'vv-v' : 'vv-h'}">${media}</div>
      <div class="vv-acc">
        ${v.orig && !v.local ? `<a class="btn-sm" href="${vrEsc(v.orig)}" target="_blank" rel="noopener">↗ ${v.video ? 'Abrir archivo' : 'Abrir en ' + nombre}</a>` : ''}
        ${v.descarga ? `<a class="btn-sm" href="${vrEsc(v.descarga)}" target="_blank" rel="noopener" download>⬇ Descargar archivo</a>` : ''}
        ${v.embed ? `<button class="btn-sm" id="vv_copy" type="button">&lt;/&gt; Copiar código para incrustar</button>` : ''}
      </div>
      <p class="proj-msg">${v.local ? 'El video se reproduce solo en este equipo; no se sube a ningún servidor.'
        : v.video ? 'Si el video no se reproduce, revisa que el enlace apunte directo al archivo y que el servidor permita su reproducción.'
        : 'Requiere conexión a internet. Si no carga, el autor desactivó la incrustación o la plataforma lo bloquea: usa «Abrir en ' + nombre + '».'}</p>`;
    const vid = $('vv_player').querySelector('video');
    if(vid) vid.addEventListener('error', () => msg('No se pudo reproducir este archivo (formato no compatible o enlace inválido).', true));
    const bc = $('vv_copy');
    if(bc) bc.addEventListener('click', () => {
      const ratio = $('vv_fmt').value === 'v' ? '9/16' : '16/9';
      copiar(`<iframe src="${v.embed}" style="width:100%;aspect-ratio:${ratio};border:0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`);
    });
  }
  function ver(){
    msg('');
    const v = vvParse($('vv_url').value);
    if(!v){ $('vv_player').innerHTML = ''; actual = null; msg('No reconozco ese enlace. Usa uno de Dailymotion, YouTube, Vimeo, Google Drive o un archivo .mp4/.webm.', true); return; }
    mostrar(v); recordar(v);
  }

  $('vv_ver').addEventListener('click', ver);
  $('vv_url').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); $('vv_url').blur(); ver(); } });
  $('vv_pegar').addEventListener('click', () => {
    if(!(navigator.clipboard && navigator.clipboard.readText)){ msg('Tu navegador no permite pegar automáticamente: pega el enlace en el cuadro y presiona «Ver video».', true); return; }
    navigator.clipboard.readText().then(t => { $('vv_url').value = String(t).trim(); ver(); })
      .catch(() => msg('No se pudo leer el portapapeles: pega el enlace en el cuadro y presiona «Ver video».', true));
  });
  $('vv_file').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    msg('');
    if(!/^video\//.test(f.type)){ msg('Ese archivo no es un video.', true); return; }
    if(objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(f);
    $('vv_url').value = '';
    mostrar({ plat:'archivo', id:f.name, video:objUrl, local:true });
    e.target.value = '';
  });
  $('vv_fmt').addEventListener('change', () => { if(actual) mostrar(actual); });
  dibujarHist();
}

const RENDERERS = { visorVideo: renderVisorVideo };
