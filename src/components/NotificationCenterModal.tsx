import React from 'react';
import { X, Bell, CheckCheck, Clock, Scissors, DollarSign } from 'lucide-react';
import type { BarberNotification, Appointment } from '../types';

interface NotificationCenterModalProps {
  notifications: BarberNotification[];
  appointments: Appointment[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  appointments,
  onClose,
  onMarkAllRead,
  onSelectAppointment,
}) => {
  // Format relative timestamp in Portuguese (e.g. Agora, Há 20 min)
  const formatRelativeTime = (timestamp: string | number) => {
    try {
      const now = Date.now();
      const past = new Date(timestamp).getTime();
      const diffMinutes = Math.floor((now - past) / 60000);

      if (diffMinutes < 1) return 'Agora';
      if (diffMinutes === 1) return 'Há 1 min';
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours === 1) return 'Há 1 hora';
      if (diffHours < 24) return `Há ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays} d`;
    } catch {
      return 'Recentemente';
    }
  };

  const handleNotificationClick = (notif: BarberNotification) => {
    if (notif.appointmentId) {
      const apt = appointments.find((a) => a.appointmentId === notif.appointmentId);
      if (apt) {
        onSelectAppointment(apt);
        onClose();
        return;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#090e18] border border-cyan-500/30 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Notificações
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader action: Marcar todas como lidas */}
        {notifications.length > 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-900"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como lidas</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto text-slate-700 mb-2 opacity-50" />
              Nenhuma notificação registrada ainda.
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.read;
              return (
                <div
                  key={notif.notificationId}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isUnread
                      ? 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-400/70 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {/* Unread indicator / bell */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          isUnread ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{notif.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                          {notif.body}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
