self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/cms/booking';

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
    data: payload.data || { url: '/cms/booking' },
  };

  event.waitUntil((async () => {
    if (self.navigator && typeof self.navigator.setAppBadge === 'function') {
      try {
        const hasExplicitBadgeCount = payload.badgeCount !== undefined && payload.badgeCount !== null;
        const count = hasExplicitBadgeCount ? Number(payload.badgeCount) : 1;
        if (count > 0) {
          await self.navigator.setAppBadge(count);
        } else if (hasExplicitBadgeCount && typeof self.navigator.clearAppBadge === 'function') {
          await self.navigator.clearAppBadge();
        }
      } catch {
        // Ignore unsupported badge update failures.
      }
    }

    await self.registration.showNotification(title, options);
  })());
});
