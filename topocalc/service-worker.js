// Service Worker — Topo de Bolsillo (GeoMav)
// v2: además de la app, guarda para uso SIN INTERNET las librerías externas (mapa, Excel, capturas), las tipografías
//     y los mosaicos del mapa que ya se hayan visto (hasta MAX_TILES, para no llenar el teléfono).
const CACHE_VERSION = 'topocalc-v2';
const TILES_CACHE = 'topocalc-tiles-v1';
const MAX_TILES = 300;
const SCOPE = '/topocalc/';

const APP_SHELL = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json',
  SCOPE + 'privacidad.html',
  SCOPE + 'icons/icon-192.png',
  SCOPE + 'icons/icon-512.png',
  SCOPE + 'icons/icon-maskable-512.png'
];

// Recursos de otros dominios que la app pide (misma URL exacta que usa index.html)
const LIBS_EXTERNAS = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];
const FUENTES_CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
const HOSTS_EXTERNOS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const esTile = (url) => /^[abc]\.tile\.openstreetmap\.org$/.test(url.hostname);

// Se pide con CORS para guardar una respuesta real (una respuesta "opaca" ocupa mucha cuota de almacenamiento)
const traerCors = (url) => fetch(url, { mode: 'cors', credentials: 'omit' });

async function precargarExternos(cache) {
  const tareas = LIBS_EXTERNAS.map(async (u) => {
    const r = await traerCors(u);
    if (!r.ok) return;
    await cache.put(u, r.clone());
    if (u.endsWith('.css')) {                       // las imágenes que referencia el CSS (íconos del mapa)
      const txt = await r.text();
      for (const m of txt.matchAll(/url\(([^)]+)\)/g)) {
        const raw = m[1].replace(/['"]/g, '').trim();
        if (!raw || raw.startsWith('data:')) continue;
        try { const abs = new URL(raw, u).href; const ri = await traerCors(abs); if (ri.ok) await cache.put(abs, ri); } catch (e) {}
      }
    }
  });
  tareas.push((async () => {                        // tipografías: primero el CSS y luego los archivos de fuente que nombra
    const r = await traerCors(FUENTES_CSS);
    if (!r.ok) return;
    await cache.put(FUENTES_CSS, r.clone());
    const txt = await r.text();
    for (const m of txt.matchAll(/url\((https:[^)]+)\)/g)) {
      try { const rf = await traerCors(m[1]); if (rf.ok) await cache.put(m[1], rf); } catch (e) {}
    }
  })());
  await Promise.allSettled(tareas);                 // si no hay internet al instalar, la app igual se instala
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    await precargarExternos(cache);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('topocalc-') && key !== CACHE_VERSION && key !== TILES_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

async function externoPrimeroCache(request) {       // librerías y tipografías: primero lo guardado; si no está, red y se guarda
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(request.url, { ignoreVary: true });
  if (hit) return hit;
  try {
    const r = await traerCors(request.url);
    if (r.ok) cache.put(request.url, r.clone());
    return r;
  } catch (e) {
    return fetch(request);                          // el servidor no admite CORS: pasa directo, sin guardar
  }
}

async function recortarTiles(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);   // se borran los más antiguos
}

async function tileMapa(request) {                  // mosaicos del mapa: los ya vistos funcionan sin internet
  const cache = await caches.open(TILES_CACHE);
  const hit = await cache.match(request.url, { ignoreVary: true });
  if (hit) return hit;
  try {
    const r = await traerCors(request.url);
    if (r.ok) { await cache.put(request.url, r.clone()); recortarTiles(cache); }
    return r;
  } catch (e) {
    try { return await fetch(request); } catch (e2) { return Response.error(); }
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (esTile(url)) { event.respondWith(tileMapa(request)); return; }
  if (HOSTS_EXTERNOS.includes(url.hostname)) { event.respondWith(externoPrimeroCache(request)); return; }
  if (!request.url.includes(SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(SCOPE, copy));
          return response;
        })
        .catch(() => caches.match(SCOPE).then((cached) => cached || caches.match(request)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
