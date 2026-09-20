import React, { useEffect } from 'react';
import { Bell, Sparkles, X, ChevronRight } from 'lucide-react';
import type { Appointment } from '../types';

interface TopAlertBannerProps {
  appointment: Appointment | null;
  onDismiss: () => void;
  onOpenDetails: (appointment: Appointment) => void;
}

export const TopAlertBanner: React.FC<TopAlertBannerProps> = ({
  appointment,
  onDismiss,
  onOpenDetails,
}) => {
  useEffect(() => {
    if (!appointment) return;

    // Auto-minimize after 7 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);

    return () => clearTimeout(timer);
  }, [appointment, onDismiss]);

  if (!appointment) return null;

  const formattedPrice = appointment.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = appointment.date === todayStr;
  const timeDisplay = isToday ? `Hoje às ${appointment.time}` : `${appointment.date} às ${appointment.time}`;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none animate-slide-down">
      <div className="w-full max-w-sm pointer-events-auto">
        <div
          onClick={() => {
            onOpenDetails(appointment);
            onDismiss();
          }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0a1428] via-[#0b1b36] to-[#081224] border-2 border-cyan-400 p-4.5 shadow-2xl shadow-cyan-500/50 glow-blue-lg cursor-pointer transform hover:scale-[1.01] transition-transform duration-200"
        >
          {/* Intense neon electric blue corner glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-sm shadow-cyan-400/40">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <span className="text-xs font-black tracking-wider text-cyan-300 uppercase font-mono flex items-center gap-1.5">
                🔔 NOVO AGENDAMENTO!
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer marcou um horário */}
          <div className="mb-2">
            <p className="text-sm font-extrabold text-white">
              {appointment.customerName} marcou um horário
            </p>
          </div>

          {/* Service & Time */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/80">
            <div>
              <p className="text-xs font-bold text-cyan-300">
                {appointment.serviceName}
              </p>
              <p className="text-[11px] text-slate-300 font-medium">
                {timeDisplay}
              </p>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-emerald-400 font-mono">
                {formattedPrice}
              </div>
              <div className="flex items-center gap-0.5 text-[10px] text-cyan-400 font-semibold justify-end">
                <span>Ver detalhes</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
