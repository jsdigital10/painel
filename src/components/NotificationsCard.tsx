import React, { useState } from 'react';
import { Bell, BellOff, BellRing, Check, HelpCircle, X } from 'lucide-react';
import { requestAndRegisterPush, checkPushSupport } from '../utils/notifications';

interface NotificationsCardProps {
  barbershopId: string;
  isRegistered: boolean;
  onRegistered: () => void;
}

export const NotificationsCard: React.FC<NotificationsCardProps> = ({
  barbershopId,
  isRegistered,
  onRegistered,
}) => {
  const [loading, setLoading] = useState(false);
  const [showHowToEnable, setShowHowToEnable] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });
  const [isDismissed, setIsDismissed] = useState(false);

  const isSupported = checkPushSupport();

  // If already activated or dismissed, render compact confirmation or return
  if (isRegistered || permissionState === 'granted') {
    return (
      <div className="w-full max-w-xl mx-auto px-4 mt-4">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <p className="font-bold text-emerald-200">✓ Notificações ativadas</p>
              <p className="text-[11px] text-emerald-400/80">
                Você será avisado instantaneamente sempre que chegar um novo agendamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isDismissed) {
    return null;
  }

  const handleActivate = async () => {
    setLoading(true);
    const result = await requestAndRegisterPush(barbershopId);
    setLoading(false);
    setPermissionState(result.permission);

    if (result.success) {
      onRegistered();
    } else if (result.permission === 'denied') {
      setShowHowToEnable(true);
    }
  };

  // Blocked / Denied State
  if (permissionState === 'denied') {
    return (
      <div className="w-full max-w-xl mx-auto px-4 mt-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <BellOff className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Notificações desativadas no navegador</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Seus agendamentos continuarão aparecendo normalmente aqui.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowHowToEnable(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              COMO ATIVAR
            </button>
          </div>
        </div>

        {/* Instructions Dialog */}
        {showHowToEnable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-slate-700 text-left">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-cyan-400" />
                Como ativar notificações
              </h3>
              <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <p>
                  <strong>No Chrome / Edge (Android e Desktop):</strong> Toque no ícone de cadeado ou configurações ao lado do endereço do site e altere <em>Notificações</em> para <strong>Permitir</strong>.
                </p>
                <p>
                  <strong>No iPhone / iPad (iOS):</strong> Adicione a Central à Tela de Início pelo botão Compartilhar do Safari. Ao abrir o aplicativo instalado, você poderá conceder a permissão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHowToEnable(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-xs cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not supported fallback
  if (!isSupported) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 mt-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-400">
          <p>
            ℹ️ Web Push em segundo plano não é suportado por este navegador, mas os alertas em tempo real funcionarão enquanto a Central estiver aberta.
          </p>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-500 hover:text-slate-300 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Prominent "Ative as notificações" card
  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-4 animate-slide-down">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1527] to-[#080d1a] border border-cyan-500/30 p-5 shadow-xl shadow-cyan-950/40">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-400 shadow-md shadow-cyan-500/20">
            <Bell className="w-6 h-6 stroke-[2.2] animate-bounce" />
          </div>

          <div className="flex-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Ative as notificações
            </h2>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Receba um alerta instantâneo no celular sempre que chegar um novo agendamento.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleActivate}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-95 transition shadow-md shadow-cyan-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <BellRing className="w-4 h-4" />
                )}
                <span>ATIVAR NOTIFICAÇÕES</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 transition cursor-pointer"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
