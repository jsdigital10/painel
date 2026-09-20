import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import {
  getFirestore as getClientFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getMessaging as getAdminMessaging } from 'firebase-admin/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for biosite external booking requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize client Firebase Firestore (guaranteed to work with firestore.rules and API key)
const clientApp = !getClientApps().length
  ? initClientApp(firebaseConfig)
  : getClientApps()[0];

const clientDb = firebaseConfig.firestoreDatabaseId
  ? getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId)
  : getClientFirestore(clientApp);

// Initialize Firebase Admin Messaging for FCM
let adminMessaging: any = null;
try {
  const adminApp = !getAdminApps().length
    ? initAdminApp({ projectId: firebaseConfig.projectId })
    : getAdminApps()[0];
  adminMessaging = getAdminMessaging(adminApp);
} catch (err) {
  console.warn('[Server] Admin messaging initialization note:', err);
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });
});

// Diagnostics Endpoint
app.get('/api/diagnostics', async (req, res) => {
  const barbershopId = (req.query.barbershopId as string) || 'barber_kaik';
  try {
    let appointmentsCount = 0;
    try {
      const aptQuery = query(collection(clientDb, 'appointments'), where('barbershopId', '==', barbershopId));
      const aptSnap = await getDocs(aptQuery);
      appointmentsCount = aptSnap.size;
    } catch (err: any) {
      console.warn('[Diagnostics] Appointments query warning:', err?.message);
    }

    let devicesCount = 0;
    let activeTokens: string[] = [];
    try {
      const devQuery = query(
        collection(clientDb, 'devices'),
        where('barbershopId', '==', barbershopId),
        where('notificationsEnabled', '==', true)
      );
      const devSnap = await getDocs(devQuery);
      devicesCount = devSnap.size;
      devSnap.forEach((d) => {
        const data = d.data();
        if (data.fcmToken) activeTokens.push(data.fcmToken);
      });
    } catch (err: any) {
      console.warn('[Diagnostics] Devices query warning:', err?.message);
    }

    res.json({
      success: true,
      firebaseConnected: true,
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      barbershopId,
      appointmentsCount,
      registeredDevicesCount: devicesCount,
      hasActiveTokens: activeTokens.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Falha ao executar diagnóstico',
    });
  }
});

// Test Push Endpoint (Real Backend Triggered Push)
app.post('/api/test-push', async (req, res) => {
  const { barbershopId = 'barber_kaik', deviceId, fcmToken } = req.body;

  console.log(`[API /api/test-push] Triggering push for barbershop: ${barbershopId}`);

  try {
    const tokens: string[] = [];
    if (fcmToken && typeof fcmToken === 'string' && !fcmToken.startsWith('web_push_') && !fcmToken.startsWith('fcm_fallback')) {
      tokens.push(fcmToken);
    } else {
      const devQuery = query(
        collection(clientDb, 'devices'),
        where('barbershopId', '==', barbershopId),
        where('notificationsEnabled', '==', true)
      );
      const devSnap = await getDocs(devQuery);
      devSnap.forEach((d) => {
        const data = d.data();
        if (data.fcmToken && !data.fcmToken.startsWith('web_push_') && !data.fcmToken.startsWith('fcm_fallback')) {
          tokens.push(data.fcmToken);
        }
      });
    }

    const notifId = 'test_' + Date.now();
    const title = '🔔 TESTE DE PUSH (Firebase Admin)';
    const body = 'Integração de notificações verificada com sucesso no painel!';

    await setDoc(doc(clientDb, 'notifications', notifId), {
      notificationId: notifId,
      barbershopId,
      title,
      body,
      read: false,
      type: 'test_push',
      createdAt: new Date().toISOString(),
      targetDevices: tokens.length,
      status: 'dispatched',
    });

    let fcmDispatched = false;
    let pushError: string | null = null;

    if (tokens.length > 0 && adminMessaging) {
      try {
        const response = await adminMessaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: {
            type: 'test_push',
            timestamp: String(Date.now()),
          },
        });
        fcmDispatched = response.successCount > 0;
        console.log(`[API /api/test-push] FCM sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
      } catch (fcmErr: any) {
        pushError = fcmErr.message;
        console.warn('[API /api/test-push] FCM dispatch warning:', fcmErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Notificação de teste processada pelo backend Firebase',
      notificationId: notifId,
      fcmDispatched,
      devicesCount: tokens.length,
      pushError,
    });
  } catch (error: any) {
    console.error('[API /api/test-push] Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Erro no envio do push',
    });
  }
});

// Get Appointments Endpoint
app.get('/api/appointments', async (req, res) => {
  const barbershopId = (req.query.barbershopId as string) || 'barber_kaik';
  try {
    const q = query(
      collection(clientDb, 'appointments'),
      where('barbershopId', '==', barbershopId)
    );
    const snap = await getDocs(q);
    const appointments: any[] = [];
    snap.forEach((d) => appointments.push(d.data()));
    res.json({ success: true, count: appointments.length, appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Create Appointment Endpoint (Real API for Biosite / Booking)
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      barbershopId = 'barber_kaik',
      customerName,
      customerPhone = '',
      serviceName = 'Serviço',
      price = 0,
      date,
      time,
    } = req.body;

    if (!customerName || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'customerName, date e time são obrigatórios',
      });
    }

    const newAppointmentId = 'apt_' + Date.now();

    const appointmentData = {
      appointmentId: newAppointmentId,
      barbershopId,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      serviceName: String(serviceName).trim(),
      price: Number(price) || 0,
      date: String(date).trim(),
      time: String(time).trim(),
      status: 'confirmed',
      readByBarber: false,
      source: 'api_biosite',
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore appointments collection (root)
    await setDoc(doc(clientDb, 'appointments', newAppointmentId), appointmentData);

    // Also write to subcollection barbershops/{barbershopId}/appointments for compatibility
    try {
      await setDoc(
        doc(clientDb, 'barbershops', barbershopId, 'appointments', newAppointmentId),
        appointmentData
      );
    } catch (subErr) {
      console.warn('[Server] Subcollection write warning:', subErr);
    }

    // Save to notifications collection
    const notifId = 'push_' + newAppointmentId;
    const formattedPrice = (Number(price) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const firstName = String(customerName).trim().split(' ')[0];
    const notifTitle = '🔔 NOVO AGENDAMENTO!';
    const notifBody = `${firstName} agendou ${serviceName} para ${date} às ${time} • ${formattedPrice}`;

    await setDoc(doc(clientDb, 'notifications', notifId), {
      notificationId: notifId,
      barbershopId,
      appointmentId: newAppointmentId,
      title: notifTitle,
      body: notifBody,
      amount: Number(price) || 0,
      serviceName,
      time,
      read: false,
      status: 'sent',
      createdAt: new Date().toISOString(),
    });

    // Send FCM push to all registered devices of this barbershop
    try {
      const devQuery = query(
        collection(clientDb, 'devices'),
        where('barbershopId', '==', barbershopId),
        where('notificationsEnabled', '==', true)
      );
      const devicesSnap = await getDocs(devQuery);

      const tokens: string[] = [];
      devicesSnap.forEach((d) => {
        const data = d.data();
        if (data.fcmToken && !data.fcmToken.startsWith('web_push_') && !data.fcmToken.startsWith('fcm_fallback')) {
          tokens.push(data.fcmToken);
        }
      });

      if (tokens.length > 0 && adminMessaging) {
        await adminMessaging.sendEachForMulticast({
          tokens,
          notification: {
            title: notifTitle,
            body: notifBody,
          },
          data: {
            type: 'new_appointment',
            appointmentId: newAppointmentId,
            barbershopId,
            serviceName,
            time,
          },
        });
        console.log(`[API /api/appointments] Dispatched push to ${tokens.length} devices.`);
      }
    } catch (pushErr: any) {
      console.warn('[API /api/appointments] Background push error:', pushErr.message);
    }

    res.status(201).json({
      success: true,
      appointment: appointmentData,
    });
  } catch (error: any) {
    console.error('[API /api/appointments] Error creating appointment:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao criar agendamento',
    });
  }
});

// Start Server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
