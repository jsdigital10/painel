import React from 'react';
import { Bell, Settings, Wifi, WifiOff } from 'lucide-react';
import type { Barbershop } from '../types';

interface HeaderProps {
  barbershop: Barbershop;
  isOnline: boolean;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  barbershop,
  isOnline,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#07090f]/90 backdrop-blur-xl border-b border-sky-500/10 px-4 py-3 sm:px-6">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Left: Branding & Status */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-mono">
              CENTRAL DE AGENDAMENTOS
            </h1>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80" />
              Conectado
            </span>

            <span className="text-slate-600">•</span>

            <span className="text-[11px] text-cyan-300 font-mono font-medium truncate max-w-[170px] sm:max-w-[240px]">
              {barbershop.domain}
            </span>

            <span className="text-slate-600 hidden sm:inline">•</span>

            {/* Connection state: ONLINE / RECONECTANDO */}
            {isOnline ? (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-flex items-center gap-1">
                ● ONLINE
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-mono inline-flex items-center gap-1 font-medium animate-pulse">
                ● RECONECTANDO…
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions (Bell with Badge + Settings) */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Abrir notificações"
          >
            <Bell className="w-5 h-5 text-cyan-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-600 to-cyan-400 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-cyan-500/50 animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition active:scale-95 cursor-pointer"
            aria-label="Configurações da barbearia"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
