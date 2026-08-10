
const CACHE = 'europe2026-v3';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './app.js',
  './styles.css',
  './manifest.webmanifest',
  './icon.png',
  './icon-180.png',
  './icon-512.png',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/marker-icon.png',
  './vendor/leaflet/marker-icon-2x.png',
  './vendor/leaflet/marker-shadow.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // cache OSM / Carto tiles as browsed
  const isTile = /tile\.openstreetmap\.org|basemaps\.cartocdn\.com|tile\.openstreetmap\.fr/.test(url.href);
  if (isTile) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (err) {
          return hit || Response.error();
        }
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
