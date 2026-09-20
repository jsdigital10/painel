import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback instruction
      alert('Para instalar, use a opção "Adicionar à tela inicial" ou "Instalar aplicativo" no menu do seu navegador.');
    }
  };

  return (
    <>
      <div className="w-full max-w-xl mx-auto px-4 mt-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Tenha sua Central sempre à mão
              </p>
              <p className="text-[11px] text-slate-400">
                Instale o aplicativo na sua tela de início
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl font-bold text-xs text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALAR APP</span>
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-slate-700 text-left animate-slide-down">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Como instalar no iPhone / iPad
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                  <Share className="w-3.5 h-3.5" />
                </div>
                <p>
                  1. No Safari, toque no botão <strong>Compartilhar</strong> (ícone com seta para cima na barra inferior).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <p>
                  2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                </p>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                3. Toque em <strong>Adicionar</strong> no canto superior direito. O ícone oficial da Central aparecerá na sua tela de apps!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
