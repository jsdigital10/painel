export interface Barbershop {
  id: string;
  barbershopId?: string;
  name: string;
  domain: string;
  active?: boolean;
  pairingPin?: string;
  phone?: string;
  address?: string;
  services?: BarbershopService[];
  createdAt?: string;
}

export interface BarbershopService {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
}

export interface Appointment {
  id?: string;
  appointmentId: string;
  barbershopId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  price: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'confirmed' | 'completed' | 'cancelled';
  readByBarber?: boolean;
  createdAt: string;
}

export interface BarberNotification {
  id?: string;
  notificationId: string;
  barbershopId: string;
  appointmentId?: string;
  title: string;
  body: string;
  amount?: number;
  serviceName?: string;
  time?: string;
  read: boolean;
  createdAt: string | number;
}

export interface DeviceRecord {
  deviceId: string;
  barbershopId: string;
  fcmToken?: string;
  notificationsEnabled: boolean;
  createdAt: string;
  lastSeen: string;
  browser?: string;
}

export interface ConnectionSession {
  barbershopId: string;
  barbershopName: string;
  domain: string;
  token: string;
  connectedAt: string;
}
