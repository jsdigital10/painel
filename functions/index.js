/**
 * Cloud Functions for Central de Agendamentos
 * Dispatches real-time Web Push / FCM notifications to the barber's devices
 * with strict idempotency and zero duplicates.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

/**
 * Triggered automatically whenever a new appointment document is created in Firestore.
 */
exports.onAppointmentCreated = onDocumentCreated("appointments/{appointmentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the appointment event");
    return;
  }

  const appointment = snapshot.data();
  const appointmentId = event.params.appointmentId;

  // 1. Check status
  if (appointment.status !== "confirmed") {
    console.log(`Appointment ${appointmentId} status is '${appointment.status}'. Skipping push.`);
    return;
  }

  const barbershopId = appointment.barbershopId;
  if (!barbershopId) {
    console.warn(`Appointment ${appointmentId} has no barbershopId`);
    return;
  }

  // 2. Idempotency Check: Avoid duplicate push notifications
  const idempotencyRef = db.collection("notifications").doc(`push_${appointmentId}`);
  const idempotencyDoc = await idempotencyRef.get();

  if (idempotencyDoc.exists) {
    console.log(`Push notification for appointment ${appointmentId} has already been dispatched.`);
    return;
  }

  // 3. Locate authorized devices with FCM tokens for this barbershop
  const devicesSnapshot = await db.collection("devices")
    .where("barbershopId", "==", barbershopId)
    .where("notificationsEnabled", "==", true)
    .get();

  if (devicesSnapshot.empty) {
    console.log(`No active devices found for barbershop: ${barbershopId}`);
  }

  const tokens = [];
  devicesSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.fcmToken && typeof data.fcmToken === "string") {
      tokens.push(data.fcmToken);
    }
  });

  const formattedPrice = Number(appointment.price || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const customerFirstName = (appointment.customerName || "Cliente").split(" ")[0];
  const notificationTitle = "🔔 NOVO AGENDAMENTO!";
  const notificationBody = `${customerFirstName} agendou ${appointment.serviceName || "Corte"} hoje às ${appointment.time || "horário confirmado"} • ${formattedPrice}`;

  // 4. Save notification to history
  await idempotencyRef.set({
    notificationId: `push_${appointmentId}`,
    barbershopId: barbershopId,
    appointmentId: appointmentId,
    title: notificationTitle,
    body: notificationBody,
    amount: Number(appointment.price || 0),
    serviceName: appointment.serviceName || "Serviço",
    time: appointment.time || "",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    devicesTargeted: tokens.length,
  });

  // 5. Send FCM Push Notification if devices are registered
  if (tokens.length > 0) {
    const payload = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        appointmentId: appointmentId,
        barbershopId: barbershopId,
        serviceName: appointment.serviceName || "",
        price: String(appointment.price || ""),
        time: appointment.time || "",
        url: `/?appointmentId=${appointmentId}`,
      },
      tokens: tokens,
    };

    try {
      const response = await getMessaging().sendEachForMulticast(payload);
      console.log(`Sent push to ${tokens.length} devices. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);

      // Handle invalid tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const token = tokens[idx];
            console.warn(`Failed token ${token}:`, resp.error);
          }
        });
      }
    } catch (pushErr) {
      console.error("Error sending FCM multicast:", pushErr);
    }
  }
});
