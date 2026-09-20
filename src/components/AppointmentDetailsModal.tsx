import React from 'react';
import {
  X,
  User,
  Phone,
  Scissors,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  MessageSquare,
  Share2,
} from 'lucide-react';
import type { Appointment } from '../types';

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  onClose,
}) => {
  if (!appointment) return null;

  const formattedPrice = appointment.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Format date nicely (DD/MM/YYYY)
  const formattedDate = (() => {
    try {
      const [year, month, day] = appointment.date.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return appointment.date;
    } catch {
      return appointment.date;
    }
  })();

  // Direct WhatsApp Link
  const handleCallWhatsApp = () => {
    const rawPhone = appointment.customerPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const message = encodeURIComponent(
      `Olá ${appointment.customerName}! Confirmando seu agendamento de *${appointment.serviceName}* para o dia *${formattedDate}* às *${appointment.time}*. Te esperamos na barbearia!`
    );
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#090e18] border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-slide-down">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Detalhes do Agendamento
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Information Fields */}
        <div className="py-5 space-y-4 text-sm">
          {/* Cliente */}
          <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <User className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Cliente
              </span>
              <span className="text-base font-bold text-white">
                {appointment.customerName}
              </span>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
            <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                WhatsApp
              </span>
              <span className="text-sm font-semibold text-slate-200 font-mono">
                {appointment.customerPhone || 'Não informado'}
              </span>
            </div>
          </div>

          {/* Grid: Serviço & Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                <span>Serviço</span>
              </div>
              <span className="text-sm font-bold text-white block">
                {appointment.serviceName}
              </span>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Valor</span>
              </div>
              <span className="text-sm font-bold text-emerald-400 font-mono block">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* Grid: Data & Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Data</span>
              </div>
              <span className="text-sm font-bold text-white font-mono block">
                {formattedDate}
              </span>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Horário</span>
              </div>
              <span className="text-sm font-bold text-cyan-300 font-mono block">
                {appointment.time}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
            <span className="text-xs font-semibold text-emerald-300">
              Status do agendamento
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
              <CheckCircle className="w-4 h-4" />
              Confirmado
            </span>
          </div>
        </div>

        {/* Primary Action Button: CHAMAR NO WHATSAPP */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCallWhatsApp}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>CHAMAR NO WHATSAPP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
