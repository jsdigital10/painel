import React from 'react';
import { Calendar, Clock, DollarSign, Users } from 'lucide-react';
import type { Appointment } from '../types';

interface DaySummaryCardProps {
  todayAppointments: Appointment[];
  nextAppointmentTime: string | null;
}

export const DaySummaryCard: React.FC<DaySummaryCardProps> = ({
  todayAppointments,
  nextAppointmentTime,
}) => {
  const totalCount = todayAppointments.length;
  const totalScheduledValue = todayAppointments.reduce(
    (acc, apt) => acc + (apt.price || 0),
    0
  );

  const formattedScheduledValue = totalScheduledValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-5">
      <div className="relative overflow-hidden rounded-2xl glass-panel border border-sky-500/20 p-5 shadow-lg">
        {/* Subtle top indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              HOJE
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* 3 Metric Columns */}
        <div className="grid grid-cols-3 gap-3 text-left">
          {/* 1. Agendamentos */}
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px]">Agendados</span>
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {totalCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {totalCount === 1 ? 'Agendamento' : 'Agendamentos'}
            </div>
          </div>

          {/* 2. Em serviços agendados */}
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Valor</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight truncate text-emerald-300">
              {formattedScheduledValue}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Em serviços agendados
            </div>
          </div>

          {/* 3. Próximo */}
          <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Próximo</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight text-cyan-300">
              {nextAppointmentTime || '--:--'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {nextAppointmentTime ? 'Horário' : 'Finalizado'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
