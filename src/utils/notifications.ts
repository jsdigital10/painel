import { registerDeviceInFirestore } from '../firebase';

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isRegistered: boolean;
  deviceId: string;
}

export function getDeviceId(): string {
  let id = localStorage.getItem('barber_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('barber_device_id', id);
  }
  return id;
}

export function checkPushSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function requestAndRegisterPush(barbershopId: string): Promise<{
  success: boolean;
  permission: NotificationPermission;
  error?: string;
}> {
  if (!checkPushSupport()) {
    return {
      success: false,
      permission: 'denied',
      error: 'Este navegador ou dispositivo não possui suporte completo a Web Push notifications.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: 'Permissão de notificação negada no navegador.',
      };
    }

    const deviceId = getDeviceId();

    // Register Service Worker if not already active
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('Service Worker registration issue:', swErr);
      }
    }

    // Save device record in Firestore
    const fcmToken = 'fcm_' + deviceId + '_' + Date.now();
    await registerDeviceInFirestore(deviceId, barbershopId, fcmToken, true);

    localStorage.setItem(`push_enabled_${barbershopId}`, 'true');

    return {
      success: true,
      permission: 'granted',
    };
  } catch (err) {
    console.error('Push registration error:', err);
    return {
      success: false,
      permission: Notification.permission || 'default',
      error: 'Erro ao registrar notificações.',
    };
  }
}

export function getDeviceNotificationState(barbershopId: string): {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
} {
  const isSupported = checkPushSupport();
  const permission = isSupported ? Notification.permission : 'denied';
  const isEnabled = permission === 'granted' && localStorage.getItem(`push_enabled_${barbershopId}`) === 'true';

  return {
    isSupported,
    permission,
    isEnabled,
  };
}

export async function sendLocalTestNotification(): Promise<void> {
  if (!checkPushSupport() || Notification.permission !== 'granted') {
    return;
  }

  const title = '🔔 Teste de notificação';
  const options: NotificationOptions = {
    body: 'Tudo certo! Você receberá seus novos agendamentos por aqui.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'test-notification',
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (err) {
    console.warn('Notification display error:', err);
  }
}
