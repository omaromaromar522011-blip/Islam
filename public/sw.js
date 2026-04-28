const CACHE = 'islam-shell-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
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
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('/');
  })());
});
