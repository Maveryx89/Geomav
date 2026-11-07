// Service Worker — Pórticos (GeoMav). Alcance: /topocalc/Porticos/
// Páginas: red primero (así las actualizaciones llegan al tiro) y, sin señal, la última copia guardada.
// Los datos (Apps Script) y el cálculo de rutas (OSRM) NO se guardan: siempre van a la red.
const VERSION = 'porticos-v1';
const TILES = 'porticos-tiles-v1';
const MAX_TILES = 400;
const BASE = '/topocalc/Porticos/';
const SHELL = [BASE, BASE + 'index.html', BASE + 'manifest.json', BASE + 'icons/icon-192.png', BASE + 'icons/icon-512.png',
  BASE + 'informe.js', BASE + 'informe-viaje.js', BASE + 'importar-planilla.js', BASE + 'clima.js'];
const HOSTS_CDN = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const esTile = (u) => /^([abc]\.)?tile\.openstreetmap\.org$/.test(u.hostname);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))));   // si falta alguno, igual se instala
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('porticos-') && k !== VERSION && k !== TILES).map((k) => caches.delete(k)))));
  self.clients.claim();
});

async function recortar(cache){ const ks = await cache.keys(); for(let i = 0; i < ks.length - MAX_TILES; i++) await cache.delete(ks[i]); }
async function tile(req){
  const c = await caches.open(TILES), hit = await c.match(req.url, { ignoreVary: true }); if(hit) return hit;
  try{ const r = await fetch(req.url, { mode: 'cors', credentials: 'omit' }); if(r.ok){ await c.put(req.url, r.clone()); recortar(c); } return r; }
  catch(e){ try{ return await fetch(req); }catch(e2){ return Response.error(); } }
}
async function cdn(req){
  const c = await caches.open(VERSION), hit = await c.match(req.url, { ignoreVary: true }); if(hit) return hit;
  try{ const r = await fetch(req.url, { mode: 'cors', credentials: 'omit' }); if(r.ok) c.put(req.url, r.clone()); return r; }
  catch(e){ return fetch(req); }
}
function conLimite(p, ms){ return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('lento')), ms); p.then((r) => { clearTimeout(t); ok(r); }, (e) => { clearTimeout(t); no(e); }); }); }

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== 'GET') return;
  if(esTile(url)){ e.respondWith(tile(req)); return; }
  if(HOSTS_CDN.includes(url.hostname)){ e.respondWith(cdn(req)); return; }
  if(url.origin !== location.origin) return;                       // Apps Script, OSRM, etc.: directo a la red
  if(!url.pathname.startsWith('/topocalc/')) return;
  if(req.mode === 'navigate'){
    e.respondWith(conLimite(fetch(req), 5000).then((r) => {
      if(r.ok && url.pathname.startsWith(BASE)){ const cp = r.clone(); caches.open(VERSION).then((c) => c.put(url.pathname === BASE ? BASE : req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((h) => h || caches.match(BASE))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const red = fetch(req).then((r) => { if(r.ok){ const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || red;
  }));
});
