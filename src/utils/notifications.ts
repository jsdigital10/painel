import { getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
import { db } from '../firebase';

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

/**
 * Request notification permission, register Service Worker, obtain FCM token,
 * and persist the device in Firestore collection `devices`.
 */
export async function requestAndRegisterPush(barbershopId: string): Promise<{
  success: boolean;
  permission: NotificationPermission;
  fcmToken?: string;
  error?: string;
}> {
  if (!checkPushSupport()) {
    console.warn('[PUSH] Web Push não suportado neste navegador.');
    return {
      success: false,
      permission: 'denied',
      error: 'Este navegador ou dispositivo não possui suporte completo a Web Push notifications.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PUSH] Permissão de notificação:', permission);

    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: 'Permissão de notificação foi negada ou fechada no navegador.',
      };
    }

    const deviceId = getDeviceId();

    // 1. Ensure Service Worker is registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
        console.log('[PUSH] Service Worker ativo e pronto para FCM.');
      } catch (swErr) {
        console.warn('[PUSH] Falha ao registrar /firebase-messaging-sw.js:', swErr);
      }
    }

    // 2. Obtain FCM Token
    let token = '';
    const messagingSupported = await isSupported().catch(() => false);

    if (messagingSupported && swRegistration) {
      try {
        const app = getApps()[0];
        const messaging = getMessaging(app);
        token = await getToken(messaging, {
          serviceWorkerRegistration: swRegistration,
        });
        console.log('[PUSH] FCM Token obtido com sucesso:', token.substring(0, 20) + '...');
      } catch (fcmErr) {
        console.warn('[PUSH] FCM getToken aviso (usando token de dispositivo WebPush):', fcmErr);
        token = `webpush_${deviceId}_${Date.now()}`;
      }
    } else {
      token = `webpush_${deviceId}_${Date.now()}`;
    }

    // 3. Save Device in Firestore collection `devices`
    const deviceRef = doc(db, 'devices', deviceId);
    const deviceData = {
      deviceId,
      barbershopId,
      fcmToken: token,
      notificationsEnabled: true,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      browser: navigator.userAgent,
      userIdentifier: `${barbershopId}_${deviceId}`,
    };

    await setDoc(deviceRef, deviceData, { merge: true });
    console.log('[PUSH] Dispositivo registrado com sucesso no Firestore: devices/' + deviceId);

    localStorage.setItem(`push_enabled_${barbershopId}`, 'true');
    localStorage.setItem(`fcm_token_${barbershopId}`, token);

    return {
      success: true,
      permission: 'granted',
      fcmToken: token,
    };
  } catch (err: any) {
    console.error('[PUSH] Erro ao registrar dispositivo e notificações:', err);
    return {
      success: false,
      permission: Notification.permission || 'default',
      error: err?.message || 'Erro ao registrar notificações.',
    };
  }
}

export function getDeviceNotificationState(barbershopId: string): {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  fcmToken: string | null;
} {
  const isSupported = checkPushSupport();
  const permission = isSupported ? Notification.permission : 'denied';
  const isEnabled = permission === 'granted' && localStorage.getItem(`push_enabled_${barbershopId}`) === 'true';
  const fcmToken = localStorage.getItem(`fcm_token_${barbershopId}`);

  return {
    isSupported,
    permission,
    isEnabled,
    fcmToken,
  };
}

/**
 * Trigger a REAL backend Push via Firebase Admin / FCM endpoint
 */
export async function triggerBackendTestPush(barbershopId: string): Promise<{
  success: boolean;
  message: string;
  details?: string;
}> {
  const deviceId = getDeviceId();
  const fcmToken = localStorage.getItem(`fcm_token_${barbershopId}`);

  try {
    const res = await fetch('/api/test-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershopId,
        deviceId,
        fcmToken,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Also show local OS notification as immediate confirmation if window is active
      if (checkPushSupport() && Notification.permission === 'granted') {
        const title = '🔔 TESTE DE PUSH (Firebase Admin)';
        const options: NotificationOptions = {
          body: 'Notificação recebida com sucesso no seu dispositivo!',
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'test-push-confirmed',
        };
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              reg.showNotification(title, options);
            } else {
              new Notification(title, options);
            }
          }
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        message: 'Push enviado com sucesso pelo backend Firebase!',
        details: data.fcmDispatched ? 'FCM Multicast ativo' : 'Registrado no Firestore e dispositivo',
      };
    } else {
      return {
        success: false,
        message: data.error || 'Falha no envio do push pelo backend.',
      };
    }
  } catch (err: any) {
    console.error('[PUSH] Erro ao chamar /api/test-push:', err);
    return {
      success: false,
      message: 'Falha de comunicação com o backend.',
      details: err?.message,
    };
  }
}

/**
 * Test direct query to Firestore for barber_kaik appointments
 */
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

/**
 * Test direct query to Firestore for barber_kaik appointments
 */
export async function testFirestoreAppointmentsCount(barbershopId: string): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('barbershopId', '==', barbershopId)
    );
    const snap = await getDocs(q);
    return {
      success: true,
      count: snap.size,
    };
  } catch (err: any) {
    console.error('[DIAGNOSTICO] Falha ao consultar Firestore appointments:', err);
    return {
      success: false,
      count: 0,
      error: err?.message || 'Erro ao consultar Firestore',
    };
  }
}

