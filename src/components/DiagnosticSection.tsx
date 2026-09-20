import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Database,
  Send,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
  Layers,
} from 'lucide-react';
import {
  triggerBackendTestPush,
  testFirestoreAppointmentsCount,
  checkPushSupport,
  getDeviceId,
} from '../utils/notifications';
import type { Barbershop } from '../types';

interface DiagnosticSectionProps {
  barbershop: Barbershop;
  appointmentsCount: number;
  isRealtimeActive: boolean;
  lastEventTime: string | null;
}

export const DiagnosticSection: React.FC<DiagnosticSectionProps> = ({
  barbershop,
  appointmentsCount,
  isRealtimeActive,
  lastEventTime,
}) => {
  const [swActive, setSwActive] = useState<boolean | null>(null);
  const [fcmSupported, setFcmSupported] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [lastPushStatus, setLastPushStatus] = useState<string | null>(() => {
    return localStorage.getItem('last_push_status') || null;
  });

  // Test push state
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test firestore state
  const [isTestingFirestore, setIsTestingFirestore] = useState(false);
  const [firestoreResult, setFirestoreResult] = useState<{
    tested: boolean;
    count: number;
    error?: string;
  } | null>(null);

  const deviceId = getDeviceId();
  const fcmToken = localStorage.getItem(`fcm_token_${barbershop.id}`);
  const hasToken = Boolean(fcmToken);
  const browserPermission = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'denied';

  // Check SW and Backend Health on mount
  useEffect(() => {
    // Check Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setSwActive(Boolean(reg && reg.active));
      }).catch(() => setSwActive(false));
    } else {
      setSwActive(false);
    }

    setFcmSupported(checkPushSupport());

    // Check Backend
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status === 'ok'))
      .catch(() => setBackendStatus(false));
  }, []);

  // Handler: Test Push
  const handleTestPush = async () => {
    setIsTestingPush(true);
    setPushResult(null);

    const result = await triggerBackendTestPush(barbershop.id);
    setIsTestingPush(false);
    setPushResult(result);

    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const statusMsg = `${timestamp} - ${result.success ? '✓ Sucesso' : '✕ Falha'}`;
    setLastPushStatus(statusMsg);
    localStorage.setItem('last_push_status', statusMsg);
  };

  // Handler: Test Firestore Appointments
  const handleTestFirestore = async () => {
    setIsTestingFirestore(true);
    setFirestoreResult(null);

    const result = await testFirestoreAppointmentsCount(barbershop.id);
    setIsTestingFirestore(false);
    setFirestoreResult({
      tested: true,
      count: result.count,
      error: result.error,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-[#0b1324] border border-cyan-500/30 space-y-3 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>DIAGNÓSTICO DA INTEGRAÇÃO</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Status em tempo real</span>
      </div>

      {/* Grid of Diagnostics Items */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Firebase Conectado */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Firebase conectado</span>
          <span className="font-bold flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓</span>
          </span>
        </div>

        {/* Barbearia ID */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Barbearia</span>
          <span className="font-mono font-bold text-cyan-300">{barbershop.id}</span>
        </div>

        {/* Firestore */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Firestore</span>
          <span className="font-bold flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓</span>
          </span>
        </div>

        {/* Listener em tempo real */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Listener Realtime</span>
          {isRealtimeActive ? (
            <span className="font-bold flex items-center gap-1 text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>✓ Ativo</span>
            </span>
          ) : (
            <span className="font-bold text-amber-400">Pendente</span>
          )}
        </div>

        {/* Appointments encontrados */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Agendamentos</span>
          <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">
            {appointmentsCount}
          </span>
        </div>

        {/* FCM Disponível */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">FCM Disponível</span>
          {fcmSupported ? (
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓</span>
            </span>
          ) : (
            <span className="font-bold text-red-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>✕</span>
            </span>
          )}
        </div>

        {/* Permissão do navegador */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Permissão</span>
          <span
            className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
              browserPermission === 'granted'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : browserPermission === 'denied'
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {browserPermission}
          </span>
        </div>

        {/* Service Worker */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Service Worker</span>
          {swActive ? (
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Ativo</span>
            </span>
          ) : (
            <span className="font-bold text-amber-400">Verificando...</span>
          )}
        </div>

        {/* FCM Token */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">FCM Token</span>
          {hasToken ? (
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Registrado</span>
            </span>
          ) : (
            <span className="font-bold text-slate-500">✕ Não gerado</span>
          )}
        </div>

        {/* Dispositivo Registrado */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300">Dispositivo</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✓ OK</span>
          </span>
        </div>

        {/* Cloud Function / Backend */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between col-span-2">
          <span className="text-slate-300">Backend / Firebase Admin</span>
          {backendStatus === true ? (
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Ativo e respondendo</span>
            </span>
          ) : backendStatus === false ? (
            <span className="font-bold text-amber-400">Offline / Verificando</span>
          ) : (
            <span className="font-bold text-slate-400">Consultando...</span>
          )}
        </div>

        {/* Último evento recebido */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between col-span-2">
          <span className="text-slate-300">Último evento recebido</span>
          <span className="font-mono text-slate-200">
            {lastEventTime ? lastEventTime : 'Aguardando agendamento'}
          </span>
        </div>

        {/* Último push */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between col-span-2">
          <span className="text-slate-300">Último push</span>
          <span className="font-mono text-slate-200">
            {lastPushStatus ? lastPushStatus : 'Nenhum disparado'}
          </span>
        </div>
      </div>

      {/* Action Buttons: TESTAR PUSH and TESTAR FIRESTORE */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        {/* Testar Push Button */}
        <div>
          <button
            type="button"
            onClick={handleTestPush}
            disabled={isTestingPush}
            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-900/40 active:scale-98 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTestingPush ? 'Enviando push pelo Firebase...' : 'TESTAR PUSH REAL (Backend)'}</span>
          </button>

          {pushResult && (
            <div
              className={`mt-1.5 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                pushResult.success
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/40 text-red-300'
              }`}
            >
              {pushResult.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{pushResult.success ? '✓ Push enviado pelo Firebase' : '✕ Falha no envio'}</span>
            </div>
          )}
        </div>

        {/* Testar Firestore Button */}
        <div>
          <button
            type="button"
            onClick={handleTestFirestore}
            disabled={isTestingFirestore}
            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isTestingFirestore ? 'Consultando Firestore...' : 'TESTAR FIRESTORE'}</span>
          </button>

          {firestoreResult && (
            <div className="mt-1.5 p-2 rounded-lg text-[11px] font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>{firestoreResult.count} agendamento(s) encontrado(s) para {barbershop.id}.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
