import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Barbershop, Appointment, BarberNotification, DeviceRecord, ConnectionSession } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Initialize Firestore with firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, check connection.');
      return false;
    }
  }

  // Ensure standard record for barber_kaik is primed in Firestore
  await ensureBarberKaikExists();
  return true;
}

// Standard barbershop catalog recognized from biosite
export const STANDARD_SERVICES = [
  { id: 'disfarce', name: 'Disfarce', price: 30.00, durationMinutes: 35 },
  { id: 'social', name: 'Social', price: 20.00, durationMinutes: 30 },
  { id: 'barba', name: 'Barba', price: 15.00, durationMinutes: 20 },
  { id: 'pigmentacao', name: 'Pigmentação', price: 20.00, durationMinutes: 25 },
  { id: 'sobrancelha', name: 'Sobrancelha', price: 5.00, durationMinutes: 10 },
  { id: 'pezinho', name: 'Pezinho', price: 10.00, durationMinutes: 15 },
];

// Clean domain input: automatically strip https://, http://, www., trailing slash, and paths
export function sanitizeDomain(input: string): string {
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

// Ensure official barber_kaik document exists in barbershops collection
export async function ensureBarberKaikExists(): Promise<void> {
  try {
    const docRef = doc(db, 'barbershops', 'barber_kaik');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        barbershopId: 'barber_kaik',
        name: 'Barbearia',
        domain: 'kaikagenda.vercel.app',
        active: true,
        services: STANDARD_SERVICES,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Initialization of barber_kaik:', err);
  }
}

// Connect/Pair barbershop by domain via Firebase Firestore
export async function authenticateBarbershopByDomain(
  rawDomain: string
): Promise<{
  success: boolean;
  barbershop?: Barbershop;
  token?: string;
  error?: string;
  errorTitle?: string;
}> {
  const cleanDomain = sanitizeDomain(rawDomain);
  if (!cleanDomain) {
    return {
      success: false,
      errorTitle: 'Domínio obrigatório',
      error: 'Por favor, digite o domínio do seu biosite de agendamento.',
    };
  }

  try {
    // If connecting to kaikagenda.vercel.app, make sure the doc is ensured
    if (cleanDomain === 'kaikagenda.vercel.app') {
      await ensureBarberKaikExists();
    }

    const barbershopRef = collection(db, 'barbershops');
    const q = query(barbershopRef, where('domain', '==', cleanDomain));
    const snapshot = await getDocs(q);

    let barbershopDocData: Record<string, any> | null = null;
    let barbershopDocId = '';

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      barbershopDocData = docSnap.data();
      barbershopDocId = docSnap.id;
    } else if (cleanDomain === 'kaikagenda.vercel.app') {
      // Direct doc fallback
      const directDoc = await getDoc(doc(db, 'barbershops', 'barber_kaik'));
      if (directDoc.exists()) {
        barbershopDocData = directDoc.data();
        barbershopDocId = directDoc.id;
      }
    }

    if (!barbershopDocData) {
      return {
        success: false,
        errorTitle: 'Biosite ainda não vinculado.',
        error: 'Este domínio ainda não está cadastrado na Central de Agendamentos.',
      };
    }

    const isActive = barbershopDocData.active !== false;
    if (!isActive) {
      return {
        success: false,
        errorTitle: 'Barbearia inativa',
        error: 'Esta barbearia está temporariamente inativa na Central de Agendamentos.',
      };
    }

    const resolvedBarbershopId = barbershopDocData.barbershopId || barbershopDocId;
    const barbershop: Barbershop = {
      id: resolvedBarbershopId,
      barbershopId: resolvedBarbershopId,
      name: barbershopDocData.name || 'Barbearia',
      domain: barbershopDocData.domain || cleanDomain,
      active: true,
      phone: barbershopDocData.phone || '(11) 98765-4321',
      address: barbershopDocData.address || '',
      services: barbershopDocData.services || STANDARD_SERVICES,
      createdAt: barbershopDocData.createdAt || new Date().toISOString(),
    };

    // Generate secure persistent connection token
    const token = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const connectionId = 'conn_' + resolvedBarbershopId + '_' + Date.now();

    await setDoc(doc(db, 'connections', connectionId), {
      connectionId,
      barbershopId: resolvedBarbershopId,
      domain: barbershop.domain,
      token,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      barbershop,
      token,
    };
  } catch (err) {
    console.error('Firestore query error:', err);
    return {
      success: false,
      errorTitle: 'Erro de comunicação',
      error: 'Não foi possível consultar a Central no Firebase. Tente novamente em instantes.',
    };
  }
}

function formatBarbershopName(domain: string): string {
  return 'Barbearia';
}

// Subscribe to real-time appointments for a barbershop
export function subscribeToAppointments(
  barbershopId: string,
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(
    collection(db, 'appointments'),
    where('barbershopId', '==', barbershopId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        appointments.push({
          id: docSnap.id,
          appointmentId: data.appointmentId || docSnap.id,
          barbershopId: data.barbershopId,
          customerName: data.customerName || 'Cliente',
          customerPhone: data.customerPhone || '',
          serviceName: data.serviceName || 'Serviço',
          price: Number(data.price) || 0,
          date: data.date || '',
          time: data.time || '',
          status: data.status || 'confirmed',
          readByBarber: Boolean(data.readByBarber),
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      onUpdate(appointments);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      if (onError) onError(error);
    }
  );
}

// Mark appointment as read by barber
export async function markAppointmentAsRead(appointmentId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      readByBarber: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
  }
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  barbershopId: string,
  onUpdate: (notifications: BarberNotification[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('barbershopId', '==', barbershopId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: BarberNotification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push({
          id: docSnap.id,
          notificationId: data.notificationId || docSnap.id,
          barbershopId: data.barbershopId,
          appointmentId: data.appointmentId,
          title: data.title || '🔔 NOVO AGENDAMENTO!',
          body: data.body || '',
          amount: data.amount,
          serviceName: data.serviceName,
          time: data.time,
          read: Boolean(data.read),
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort newest first
      notifications.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
      onUpdate(notifications);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    }
  );
}

// Mark all notifications as read
export async function markAllNotificationsRead(barbershopId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('barbershopId', '==', barbershopId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

// Register device for Push
export async function registerDeviceInFirestore(
  deviceId: string,
  barbershopId: string,
  fcmToken?: string,
  notificationsEnabled: boolean = true
): Promise<void> {
  try {
    const deviceRecord: DeviceRecord = {
      deviceId,
      barbershopId,
      fcmToken: fcmToken || 'web_push_' + deviceId,
      notificationsEnabled,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      browser: navigator.userAgent,
    };
    await setDoc(doc(db, 'devices', deviceId), deviceRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `devices/${deviceId}`);
  }
}

// Create new appointment (simulates booking made on biosite)
export async function createNewAppointment(
  appointment: Omit<Appointment, 'id' | 'createdAt' | 'appointmentId'>
): Promise<Appointment> {
  const newId = 'apt_' + Date.now();
  const fullAppointment: Appointment = {
    ...appointment,
    appointmentId: newId,
    createdAt: new Date().toISOString(),
    readByBarber: false,
  };

  try {
    await setDoc(doc(db, 'appointments', newId), fullAppointment);

    // Also register in notifications log for idempotency and notification drawer
    const notifId = 'push_' + newId;
    const formattedPrice = appointment.price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const firstName = appointment.customerName.split(' ')[0];

    await setDoc(doc(db, 'notifications', notifId), {
      notificationId: notifId,
      barbershopId: appointment.barbershopId,
      appointmentId: newId,
      title: '🔔 NOVO AGENDAMENTO!',
      body: `${firstName} agendou ${appointment.serviceName} hoje às ${appointment.time} • ${formattedPrice}`,
      amount: appointment.price,
      serviceName: appointment.serviceName,
      time: appointment.time,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return fullAppointment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'appointments');
    throw error;
  }
}
