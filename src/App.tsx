import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  testFirestoreConnection,
  subscribeToAppointments,
  subscribeToNotifications,
  markAppointmentAsRead,
  markAllNotificationsRead,
} from './firebase';
import { playNewAppointmentChime } from './utils/audio';
import { getDeviceNotificationState } from './utils/notifications';
import type { Barbershop, Appointment, BarberNotification, ConnectionSession } from './types';

import { ConnectScreen } from './components/ConnectScreen';
import { Header } from './components/Header';
import { NotificationsCard } from './components/NotificationsCard';
import { DaySummaryCard } from './components/DaySummaryCard';
import { NextClientCard } from './components/NextClientCard';
import { AppointmentsSection } from './components/AppointmentsSection';
import { TopAlertBanner } from './components/TopAlertBanner';
import { AppointmentDetailsModal } from './components/AppointmentDetailsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { SkeletonLoader } from './components/SkeletonLoader';

export default function App() {
  const [session, setSession] = useState<ConnectionSession | null>(() => {
    try {
      const saved = localStorage.getItem('barber_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentBarbershop, setCurrentBarbershop] = useState<Barbershop | null>(() => {
    try {
      const saved = localStorage.getItem('barber_shop');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<BarberNotification[]>([]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('barber_sound_enabled') !== 'false';
  });

  const [isPushRegistered, setIsPushRegistered] = useState<boolean>(false);

  // Active Modals & Banners
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topAlertAppointment, setTopAlertAppointment] = useState<Appointment | null>(null);

  // Known appointment IDs to distinguish initial load from brand new events
  const knownAptIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testFirestoreConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check URL param or Service Worker message for direct appointment click
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for SW notification click messages
    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_CLICKED' && event.data?.appointmentId) {
          const aptId = event.data.appointmentId;
          const found = appointments.find((a) => a.appointmentId === aptId);
          if (found) {
            handleOpenAppointmentDetails(found);
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [appointments]);

  // Check initial Push state
  useEffect(() => {
    if (currentBarbershop) {
      const state = getDeviceNotificationState(currentBarbershop.id);
      setIsPushRegistered(state.isEnabled);
    }
  }, [currentBarbershop]);

  // Real-time listener for Appointments
  useEffect(() => {
    if (!currentBarbershop) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToAppointments(
      currentBarbershop.id,
      (fetchedAppointments) => {
        setIsLoading(false);
        setIsOnline(true);

        // Check if any brand new appointment arrived after initial load
        if (initialLoadDoneRef.current) {
          const newAppointments = fetchedAppointments.filter(
            (apt) => !knownAptIdsRef.current.has(apt.appointmentId)
          );

          if (newAppointments.length > 0) {
            const latest = newAppointments[0];
            // Play custom harmonic chime
            playNewAppointmentChime(soundEnabled);

            // Trigger top glowing alert
            setTopAlertAppointment(latest);

            // Subtle electric blue celebratory confetti
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.1 },
                colors: ['#00d2ff', '#0070f3', '#38bdf8', '#34d399'],
                ticks: 200,
                gravity: 1.2,
                scalar: 0.9,
              });
            } catch {
              // ignore
            }
          }
        } else {
          // First load complete
          initialLoadDoneRef.current = true;
        }

        // Update known IDs
        fetchedAppointments.forEach((apt) => {
          knownAptIdsRef.current.add(apt.appointmentId);
        });

        setAppointments(fetchedAppointments);
      },
      (err) => {
        console.warn('Firestore subscription status:', err);
        setIsOnline(false);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentBarbershop, soundEnabled]);

  // Real-time listener for Notifications
  useEffect(() => {
    if (!currentBarbershop) return;

    const unsubscribe = subscribeToNotifications(currentBarbershop.id, (notifs) => {
      setNotifications(notifs);
    });

    return () => {
      unsubscribe();
    };
  }, [currentBarbershop]);

  // Handle successful connection from ConnectScreen
  const handleConnected = (shop: Barbershop, token: string) => {
    const newSession: ConnectionSession = {
      barbershopId: shop.id,
      barbershopName: shop.name,
      domain: shop.domain,
      token,
      connectedAt: new Date().toISOString(),
    };

    localStorage.setItem('barber_session', JSON.stringify(newSession));
    localStorage.setItem('barber_shop', JSON.stringify(shop));

    setSession(newSession);
    setCurrentBarbershop(shop);
    initialLoadDoneRef.current = false;
    knownAptIdsRef.current.clear();
  };

  // Disconnect Barbershop
  const handleDisconnect = () => {
    localStorage.removeItem('barber_session');
    localStorage.removeItem('barber_shop');
    setSession(null);
    setCurrentBarbershop(null);
    setAppointments([]);
    setNotifications([]);
    initialLoadDoneRef.current = false;
    knownAptIdsRef.current.clear();
    setIsSettingsOpen(false);
  };

  // Toggle Sound Preference
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('barber_sound_enabled', String(next));
    if (next) {
      playNewAppointmentChime(true);
    }
  };

  // Mark appointment as read and open modal
  const handleOpenAppointmentDetails = (apt: Appointment) => {
    setSelectedAppointment(apt);
    if (!apt.readByBarber) {
      markAppointmentAsRead(apt.appointmentId);
      // Update local copy immediately for instant visual response
      setAppointments((prev) =>
        prev.map((item) =>
          item.appointmentId === apt.appointmentId ? { ...item, readByBarber: true } : item
        )
      );
    }
  };

  // Mark all notifications read
  const handleMarkAllNotificationsRead = () => {
    if (currentBarbershop) {
      markAllNotificationsRead(currentBarbershop.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  // Calculate Today's Appointments & Scheduled Value
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.date === todayStr);
  }, [appointments, todayStr]);

  // Determine Next Client
  const nextAppointment = useMemo(() => {
    if (todayAppointments.length === 0) return null;

    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Find upcoming appointment for today after or close to current time
    const upcoming = todayAppointments
      .filter((apt) => apt.time >= currentHourMin)
      .sort((a, b) => a.time.localeCompare(b.time));

    if (upcoming.length > 0) return upcoming[0];

    // If all times today have passed, show the last appointment or closest
    return todayAppointments.sort((a, b) => a.time.localeCompare(b.time))[0];
  }, [todayAppointments]);

  // Unread Counter for Header Bell
  const unreadCount = useMemo(() => {
    const unreadApts = appointments.filter((a) => !a.readByBarber).length;
    const unreadNotifs = notifications.filter((n) => !n.read).length;
    return Math.max(unreadApts, unreadNotifs);
  }, [appointments, notifications]);

  // 1. Not connected state -> Connect Screen
  if (!session || !currentBarbershop) {
    return <ConnectScreen onConnected={handleConnected} />;
  }

  // 2. Initial Loading state -> Skeleton Loader
  if (isLoading && appointments.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 selection:bg-cyan-500 selection:text-white pb-12 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Venda Recebida alert animation */}
      <TopAlertBanner
        appointment={topAlertAppointment}
        onDismiss={() => setTopAlertAppointment(null)}
        onOpenDetails={handleOpenAppointmentDetails}
      />

      {/* Header */}
      <Header
        barbershop={currentBarbershop}
        isOnline={isOnline}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Activate Notifications Highlight Card */}
      <NotificationsCard
        barbershopId={currentBarbershop.id}
        isRegistered={isPushRegistered}
        onRegistered={() => setIsPushRegistered(true)}
      />

      {/* Resumo do Dia (HOJE) */}
      <DaySummaryCard
        todayAppointments={todayAppointments}
        nextAppointmentTime={nextAppointment ? nextAppointment.time : null}
      />

      {/* Próximo Cliente */}
      <NextClientCard
        nextAppointment={nextAppointment}
        onViewDetails={handleOpenAppointmentDetails}
      />

      {/* Agendamentos Section (List with NOVO badge, Search, Filters) */}
      <AppointmentsSection
        appointments={appointments}
        onSelectAppointment={handleOpenAppointmentDetails}
      />

      {/* Modal: Detalhes do Agendamento + WhatsApp */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {/* Modal: Central de Notificações */}
      {isNotificationsOpen && (
        <NotificationCenterModal
          notifications={notifications}
          appointments={appointments}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onSelectAppointment={handleOpenAppointmentDetails}
        />
      )}

      {/* Modal: Configurações */}
      {isSettingsOpen && (
        <SettingsModal
          barbershop={currentBarbershop}
          isPushEnabled={isPushRegistered}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onDisconnect={handleDisconnect}
          onClose={() => setIsSettingsOpen(false)}
          onSimulatedBookingSuccess={() => {
            // Optional callback
          }}
        />
      )}
    </div>
  );
}
