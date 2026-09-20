import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05070c] p-4 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background glow */}
      <div className="w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none absolute top-1/3" />

      <div className="w-full max-w-xl mx-auto space-y-5 z-10">
        {/* Animated Brand Pulse */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-950 animate-pulse">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Sincronizando sua agenda…
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Conectando ao Firestore em tempo real
          </p>
        </div>

        {/* Skeleton Top Metric */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 animate-pulse">
          <div className="h-4 w-28 bg-slate-800 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-slate-800/80 rounded-xl" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
          </div>
        </div>

        {/* Skeleton Next Client */}
        <div className="glass-panel rounded-2xl p-4.5 border border-slate-800 animate-pulse">
          <div className="h-3 w-32 bg-slate-800 rounded mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 bg-slate-800 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 w-36 bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="w-24 h-8 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Skeleton List Items */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="glass-panel rounded-2xl p-4 border border-slate-850 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 bg-slate-800 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-3 w-28 bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-slate-850 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 bg-slate-800 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
