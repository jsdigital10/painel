import React, { useState } from 'react';
import { Link2, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { authenticateBarbershopByDomain, sanitizeDomain } from '../firebase';
import type { Barbershop } from '../types';

interface ConnectScreenProps {
  onConnected: (barbershop: Barbershop, token: string) => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onConnected }) => {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectedSuccess, setConnectedSuccess] = useState(false);
  const [errorState, setErrorState] = useState<{ title: string; message: string } | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeDomain(domain);
    if (!clean) {
      setErrorState({
        title: 'Domínio obrigatório',
        message: 'Por favor, insira o domínio do seu biosite de agendamento.',
      });
      return;
    }

    setIsLoading(true);
    setErrorState(null);

    const res = await authenticateBarbershopByDomain(domain);
    setIsLoading(false);

    if (res.success && res.barbershop && res.token) {
      setConnectedSuccess(true);
      // Wait a moment so the user sees "✓ BARBEARIA CONECTADA"
      setTimeout(() => {
        onConnected(res.barbershop!, res.token!);
      }, 700);
    } else {
      setErrorState({
        title: res.errorTitle || 'Biosite ainda não vinculado.',
        message: res.error || 'Este domínio ainda não está cadastrado na Central de Agendamentos.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#05070c] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* Cinematic ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-md z-10">
        {/* Main Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-500/20 relative">
          {/* Top 3D Connection / Link Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-cyan-400 p-[2px] shadow-lg shadow-sky-500/25 animate-pulse-glow">
                <div className="w-full h-full bg-[#090e18] rounded-2xl flex items-center justify-center">
                  <div className="relative">
                    <Link2 className="w-9 h-9 text-cyan-400 stroke-[2.2] transform -rotate-45" />
                    <Sparkles className="w-4 h-4 text-cyan-200 absolute -top-1.5 -right-1.5 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Conecte sua barbearia
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
              Cole abaixo o domínio do seu biosite de agendamento.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-5">
            <div>
              <label
                htmlFor="domain-input"
                className="block text-xs font-semibold uppercase tracking-wider text-cyan-400/90 mb-2"
              >
                DOMÍNIO DO BIOSITE
              </label>
              <div className="relative">
                <input
                  id="domain-input"
                  type="text"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    if (errorState) setErrorState(null);
                  }}
                  placeholder="https://kaikagenda.vercel.app/"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full bg-[#0b101b] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 transition shadow-inner font-mono"
                />
              </div>
            </div>

            {/* Error Message: Distinct between not linked vs connection */}
            {errorState && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-300 flex items-start gap-2.5 animate-slide-down">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200">{errorState.title}</p>
                  <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                    {errorState.message}
                  </p>
                </div>
              </div>
            )}

            {/* Success feedback */}
            {connectedSuccess ? (
              <div className="w-full py-4 px-6 rounded-xl font-black text-white bg-emerald-600 shadow-lg shadow-emerald-700/40 flex items-center justify-center gap-2 animate-pulse">
                <CheckCircle2 className="w-5 h-5" />
                <span className="tracking-wide text-base">✓ BARBEARIA CONECTADA</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-[0.98] transition duration-200 shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Conectando ao Firebase...</span>
                  </div>
                ) : (
                  <>
                    <span className="tracking-wide text-base">CONECTAR</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </form>

          {/* No Login / No Password reassurance */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/40 border border-slate-800/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sem login • Sem e-mail • Sem senha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
