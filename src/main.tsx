import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for FCM Web Push notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Service Worker registrado com sucesso. Escopo:', registration.scope);
        if (registration.active) {
          console.log('[SW] Service Worker ativo e pronto.');
        } else if (registration.installing) {
          console.log('[SW] Service Worker instalando...');
        } else if (registration.waiting) {
          console.log('[SW] Service Worker aguardando ativação.');
        }
      })
      .catch((err) => {
        console.error('[SW] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
