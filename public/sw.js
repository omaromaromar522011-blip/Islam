const CACHE = 'islam-shell-v3';
const ADHAN_FILES = [
  '/adhan/makkah.mp3','/adhan/madinah.mp3',
  '/adhan/azan1.mp3','/adhan/azan3.mp3','/adhan/azan4.mp3',
  '/adhan/azan6.mp3','/adhan/azan7.mp3','/adhan/azan8.mp3',
  '/adhan/azan9.mp3','/adhan/azan11.mp3','/adhan/azan12.mp3','/adhan/azan13.mp3',
  '/adhan/fajr.mp3','/adhan/fajr2.mp3','/adhan/fajr3.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      // Cache adhan files one by one so a single failure doesn't abort the install.
      await Promise.all(ADHAN_FILES.map(async (u) => {
        try {
          const r = await fetch(u, { cache: 'no-cache' });
          if (r.ok) await cache.put(u, r.clone());
        } catch {}
      }));
    } catch {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Cache-first strategy for local static assets so adhan + quran pages work offline.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (!/^\/(adhan|tafsir|adhkar|quran|sunnah)\//.test(url.pathname) && !/\.(svg|json)$/.test(url.pathname)) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request);
    if (hit) {
      // Refresh in background without blocking
      fetch(e.request).then(r => { if (r && r.ok) cache.put(e.request, r.clone()); }).catch(() => {});
      return hit;
    }
    try {
      const fresh = await fetch(e.request);
      if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
      return fresh;
    } catch (err) {
      const fallback = await cache.match(e.request);
      if (fallback) return fallback;
      throw err;
    }
  })());
});

self.addEventListener('message', (e) => {
  const data = e.data || {};
  if (data.type === 'show-prayer-notification') {
    const { title, body, tag } = data;
    self.registration.showNotification(title, {
      body,
      tag: tag || 'prayer',
      icon: '/icon.svg',
      badge: '/icon.svg',
      requireInteraction: true,
      vibrate: [400, 200, 400, 200, 400],
      lang: 'ar',
      dir: 'rtl'
    });
  }
  if (data.type === 'show-quran-reminder') {
    self.registration.showNotification(data.title || 'وردك اليومي من القرآن', {
      body: data.body || 'لا تنسَ قراءة وردك اليومي من القرآن الكريم',
      tag: 'quran-daily',
      icon: '/icon.svg',
      badge: '/icon.svg',
      requireInteraction: false,
      lang: 'ar',
      dir: 'rtl'
    });
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('/');
  })());
});
