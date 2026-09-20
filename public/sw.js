/**
 * Service Worker for Central de Agendamentos (Painel do Barbeiro)
 * Handles background push notifications, click actions, and offline caching.
 */

const CACHE_NAME = 'central-agendamentos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Handle Background Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { text: event.data.text() };
    }
  }

  const title = data.notification?.title || data.title || '🔔 NOVO AGENDAMENTO!';
  const body = data.notification?.body || data.body || 'Um novo horário foi reservado em sua barbearia.';
  const appointmentId = data.data?.appointmentId || data.appointmentId || '';

  const options = {
    body: body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: appointmentId ? `/?appointmentId=${appointmentId}` : '/',
      appointmentId: appointmentId
    },
    actions: [
      { action: 'open', title: 'Ver Agendamento' }
    ],
    tag: appointmentId ? `appointment-${appointmentId}` : 'new-appointment',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            appointmentId: event.notification.data?.appointmentId
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Cache-First strategy for cached assets, Network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Return cached index.html for navigation if offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
