import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Scissors,
  DollarSign,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  User,
  CheckCircle2,
} from 'lucide-react';
import type { Appointment } from '../types';

interface AppointmentsSectionProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
}

type FilterTab = 'Hoje' | 'Amanhã' | 'Próximos' | 'Todos';
type SortMode = 'recent' | 'schedule';

export const AppointmentsSection: React.FC<AppointmentsSectionProps> = ({
  appointments,
  onSelectAppointment,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Hoje');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter & Search
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Date filter
      if (activeFilter === 'Hoje' && apt.date !== todayStr) return false;
      if (activeFilter === 'Amanhã' && apt.date !== tomorrowStr) return false;
      if (activeFilter === 'Próximos' && apt.date < todayStr) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = apt.customerName.toLowerCase().includes(q);
        const matchesService = apt.serviceName.toLowerCase().includes(q);
        const matchesTime = apt.time.includes(q);
        if (!matchesName && !matchesService && !matchesTime) return false;
      }

      return true;
    });
  }, [appointments, activeFilter, searchQuery, todayStr, tomorrowStr]);

  // Sort
  const sortedAppointments = useMemo(() => {
    const list = [...filteredAppointments];
    if (sortMode === 'recent') {
      // Activity order: newest created bookings on top (unread first, then created desc)
      return list.sort((a, b) => {
        if (!a.readByBarber && b.readByBarber) return -1;
        if (a.readByBarber && !b.readByBarber) return 1;
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
    } else {
      // Schedule order: date ascending, time ascending
      return list.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    }
  }, [filteredAppointments, sortMode]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-6 pb-20">
      {/* Section Title & View Mode Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black uppercase tracking-wider text-white font-mono">
            AGENDAMENTOS
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            ({sortedAppointments.length})
          </span>
        </div>

        {/* Toggle between Recent vs Time Schedule */}
        <button
          type="button"
          onClick={() => setSortMode(sortMode === 'recent' ? 'schedule' : 'recent')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 transition cursor-pointer font-medium"
        >
          <ArrowUpDown className="w-3 h-3 text-cyan-400" />
          <span>{sortMode === 'recent' ? 'Mais recentes' : 'Por horário'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔎 Buscar por cliente, serviço ou horário..."
          className="w-full bg-[#0a0f1c] border border-slate-800 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner font-sans"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Simple Filter Pills: Hoje, Amanhã, Próximos, Todos */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {(['Hoje', 'Amanhã', 'Próximos', 'Todos'] as FilterTab[]).map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Appointment Cards List */}
      {sortedAppointments.length === 0 ? (
        /* Empty State with 3D calendar icon */
        <div className="glass-panel rounded-3xl p-8 text-center border border-slate-800/80 my-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Calendar className="w-8 h-8 stroke-[1.8]" />
            </div>
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Tudo tranquilo por aqui
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {searchQuery
              ? 'Nenhum agendamento encontrado para esta busca.'
              : 'Os novos agendamentos aparecerão automaticamente nesta tela.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedAppointments.map((apt) => {
            const isUnread = !apt.readByBarber;
            const formattedPrice = apt.price.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });

            return (
              <div
                key={apt.appointmentId}
                onClick={() => onSelectAppointment(apt)}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.99] border ${
                  isUnread
                    ? 'glass-panel-glow border-cyan-400/50 bg-[#0e1628]'
                    : 'glass-panel hover:border-slate-700 bg-[#090e18]/80'
                }`}
              >
                {/* Subtle blue corner shimmer for unread */}
                {isUnread && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Time Box */}
                    <div
                      className={`px-3 py-2 rounded-xl text-center shrink-0 border ${
                        isUnread
                          ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black font-mono">
                        {apt.time}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {apt.date === todayStr
                          ? 'Hoje'
                          : apt.date === tomorrowStr
                          ? 'Amanhã'
                          : apt.date.split('-').slice(1).reverse().join('/')}
                      </div>
                    </div>

                    {/* Customer & Service Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {apt.customerName}
                        </span>

                        {/* NOVO Badge */}
                        {isUnread && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide text-cyan-200 bg-cyan-500/30 border border-cyan-400/40 animate-pulse shadow-sm shadow-cyan-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                            NOVO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                          {apt.serviceName}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {formattedPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Chevron */}
                  <div className="flex items-center self-center text-slate-500 hover:text-slate-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
