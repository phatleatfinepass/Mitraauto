self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/pwa/cms/booking';

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) {
          await client.navigate(targetUrl);
        }
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const title = payload.title || 'Mitra Auto';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/mitra-app-icon-512.png',
    badge: payload.badge || '/icons/mitra-app-icon-512.png',
    tag: payload.tag,
    data: payload.data || { url: '/pwa/cms/booking' },
  };

  event.waitUntil((async () => {
    if (typeof self.registration.setAppBadge === 'function') {
      try {
        const count = Number(payload.badgeCount ?? 0);
        if (count > 0) {
          await self.registration.setAppBadge(count);
        } else if (typeof self.registration.clearAppBadge === 'function') {
          await self.registration.clearAppBadge();
        }
      } catch {
        // Ignore unsupported badge update failures.
      }
    }

    await self.registration.showNotification(title, options);
  })());
});
