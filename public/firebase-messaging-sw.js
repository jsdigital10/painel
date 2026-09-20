/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications, real-time alerts, and click actions
 * for Central de Agendamentos (Painel do Barbeiro).
 */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "prefab-palace-hf38q",
  appId: "1:512439852202:web:cad1033f39a85e8ae7c4d3",
  apiKey: "AIzaSyD1RJit_pR3X1hwWFyNwxxTZH86EZZRViQ",
  messagingSenderId: "512439852202",
};

firebase.initializeApp(firebaseConfig);

let messaging;
try {
  messaging = firebase.messaging();
  console.log('[firebase-messaging-sw.js] Firebase Messaging initialized successfully.');
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase messaging not supported in this context:', e);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received FCM background message:', payload);
    const title = payload.notification?.title || payload.data?.title || '🔔 NOVO AGENDAMENTO!';
    const body = payload.notification?.body || payload.data?.body || 'Um novo horário foi reservado em sua barbearia.';
    const appointmentId = payload.data?.appointmentId || '';

    const options = {
      body: body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200, 100, 400],
      data: {
        url: appointmentId ? `/?appointmentId=${appointmentId}` : '/',
        appointmentId: appointmentId,
      },
      actions: [
        { action: 'open', title: 'Ver Agendamento' }
      ],
      tag: appointmentId ? `appointment-${appointmentId}` : 'new-appointment',
      renotify: true,
    };

    return self.registration.showNotification(title, options);
  });
}

// Universal push fallback for raw Web Push
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  // If already handled by messaging.onBackgroundMessage, skip
  if (data.from && data.from.startsWith('/topics/')) {
    return;
  }

  const title = data.notification?.title || data.title || '🔔 NOVO AGENDAMENTO!';
  const body = data.notification?.body || data.body || 'Um novo agendamento foi confirmado!';
  const appointmentId = data.data?.appointmentId || data.appointmentId || '';

  const options = {
    body: body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: appointmentId ? `/?appointmentId=${appointmentId}` : '/',
      appointmentId: appointmentId,
    },
    actions: [
      { action: 'open', title: 'Ver Agendamento' }
    ],
    tag: appointmentId ? `appointment-${appointmentId}` : 'new-appointment',
    renotify: true,
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
            appointmentId: event.notification.data?.appointmentId,
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
