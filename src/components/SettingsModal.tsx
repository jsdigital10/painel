import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Bell,
  LogOut,
  Building2,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import { sendLocalTestNotification, triggerBackendTestPush } from '../utils/notifications';
import { playNewAppointmentChime } from '../utils/audio';
import { createNewAppointment, STANDARD_SERVICES } from '../firebase';
import { DiagnosticSection } from './DiagnosticSection';
import type { Barbershop } from '../types';

interface SettingsModalProps {
  barbershop: Barbershop;
  isPushEnabled: boolean;
  soundEnabled: boolean;
  appointmentsCount?: number;
  isRealtimeActive?: boolean;
  lastEventTime?: string | null;
  onToggleSound: () => void;
  onDisconnect: () => void;
  onClose: () => void;
  onSimulatedBookingSuccess?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  barbershop,
  isPushEnabled,
  soundEnabled,
  appointmentsCount = 0,
  isRealtimeActive = true,
  lastEventTime = null,
  onToggleSound,
  onDisconnect,
  onClose,
  onSimulatedBookingSuccess,
}) => {
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [isSimulatingBooking, setIsSimulatingBooking] = useState(false);

  // Test Notification via real backend
  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    setTestSuccessMessage(null);

    // Play test chime if enabled
    if (soundEnabled) {
      playNewAppointmentChime(true);
    }

    const result = await triggerBackendTestPush(barbershop.id);

    setIsTestingNotification(false);
    if (result.success) {
      setTestSuccessMessage('✓ Push enviado pelo Firebase');
    } else {
      setTestSuccessMessage('✕ Falha no envio');
    }
    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  // Simulate Biosite Booking (Directly tests Realtime + Alert + Sound + Counter)
  const handleSimulateBiositeBooking = async () => {
    setIsSimulatingBooking(true);
    const mockNames = ['Rodrigo Pires', 'Matheus Souza', 'Guilherme Rocha', 'Bruno Oliveira', 'Thiago Lima'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomService = STANDARD_SERVICES[Math.floor(Math.random() * STANDARD_SERVICES.length)];
    const todayStr = new Date().toISOString().split('T')[0];

    const randomHours = ['14:30', '15:00', '16:15', '17:30', '18:45', '19:15'];
    const randomTime = randomHours[Math.floor(Math.random() * randomHours.length)];

    try {
      await createNewAppointment({
        barbershopId: barbershop.id,
        customerName: randomName,
        customerPhone: '(11) 9' + Math.floor(10000000 + Math.random() * 90000000),
        serviceName: randomService.name,
        price: randomService.price,
        date: todayStr,
        time: randomTime,
        status: 'confirmed',
      });
      if (onSimulatedBookingSuccess) onSimulatedBookingSuccess();
      onClose();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulatingBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#090e18] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl animate-slide-down relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white tracking-tight">
            Configurações
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Barbearia Conectada */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
              <Building2 className="w-4 h-4" />
              <span>Barbearia conectada</span>
            </div>
            <div className="text-sm font-bold text-white">
              {barbershop.name}
            </div>
            <div className="text-slate-400 font-mono text-[11px] mt-0.5 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              <span>{barbershop.domain}</span>
            </div>
          </div>

          {/* Notificações Push Status */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Notificações Push</div>
                <div className="text-[11px] text-slate-400">
                  {isPushEnabled ? 'Ativadas e registradas no dispositivo' : 'Aguardando autorização'}
                </div>
              </div>
            </div>

            {isPushEnabled ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Ativadas
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500">
                Pendente
              </span>
            )}
          </div>

          {/* Som de Novos Agendamentos */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <div className="font-semibold text-white">
                  Som de novos agendamentos
                </div>
                <div className="text-[11px] text-slate-400">
                  {soundEnabled ? 'Chime harmonioso ativado' : 'Silencioso'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {soundEnabled ? 'LIGADO' : 'DESLIGADO'}
            </button>
          </div>

          {/* Modo de Diagnóstico da Integração */}
          <DiagnosticSection
            barbershop={barbershop}
            appointmentsCount={appointmentsCount}
            isRealtimeActive={isRealtimeActive}
            lastEventTime={lastEventTime}
          />

          {/* Sair / Desconectar Barbearia */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfirmDisconnect(true)}
              className="w-full py-3 px-4 rounded-xl font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>SAIR / DESCONECTAR</span>
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDisconnect && (
          <div className="absolute inset-0 z-50 bg-[#090e18] rounded-3xl p-6 flex flex-col justify-center text-center animate-slide-down">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Desconectar barbearia?
            </h4>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Deseja realmente desconectar esta barbearia deste dispositivo?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDisconnect(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDisconnect(false);
                  onDisconnect();
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-900/40 cursor-pointer"
              >
                DESCONECTAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
