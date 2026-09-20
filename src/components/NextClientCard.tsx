import React from 'react';
import { Clock, Scissors, ChevronRight, User, Sparkles } from 'lucide-react';
import type { Appointment } from '../types';

interface NextClientCardProps {
  nextAppointment: Appointment | null;
  onViewDetails: (appointment: Appointment) => void;
}

export const NextClientCard: React.FC<NextClientCardProps> = ({
  nextAppointment,
  onViewDetails,
}) => {
  if (!nextAppointment) {
    return null;
  }

  const formattedPrice = nextAppointment.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-4 animate-slide-down">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1425] via-[#101b33] to-[#0a1224] border border-cyan-500/40 p-4.5 shadow-xl shadow-cyan-950/30">
        {/* Glow behind time */}
        <div className="absolute top-1/2 left-6 -translate-y-1/2 w-28 h-28 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/15">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 font-mono">
              PRÓXIMO CLIENTE
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Hoje
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Big Next Time */}
            <div className="px-3.5 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-center shrink-0">
              <div className="text-xl font-black text-cyan-300 font-mono tracking-tight flex items-center gap-1">
                <Clock className="w-4 h-4 text-cyan-400" />
                {nextAppointment.time}
              </div>
            </div>

            {/* Customer & Service info */}
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span>{nextAppointment.customerName}</span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                  {nextAppointment.serviceName}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formattedPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => onViewDetails(nextAppointment)}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 hover:text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            <span>VER DETALHES</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
