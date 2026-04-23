// Service Worker for StreakBoard push notifications

// ── Push event: show the notification ────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title || 'StreakBoard', {
      body:    data.body  || 'Time to log your habits!',
      icon:    data.icon  || '/icon-192.png',
      badge:   data.badge || '/icon-192.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/dashboard' },
      actions: [
        { action: 'open',    title: '✅ Log Now' },
        { action: 'dismiss', title: 'Dismiss'   },
      ],
    })
  );
});

// ── Notification click: focus existing tab or open new one ────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url || '/dashboard';
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
