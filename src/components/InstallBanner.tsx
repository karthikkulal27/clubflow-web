import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-banner-dismissed') === '1');
  const [installed, setInstalled] = useState(false);
  const [ios] = useState(() => isIosSafari());

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };

  if (installed || dismissed) return null;

  // iOS Safari — show manual instructions
  if (ios) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1d4ed8] text-white px-4 pt-4 pb-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" className="w-10 h-10 rounded-xl flex-shrink-0 mt-0.5" alt="ClubFlow" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install ClubFlow</p>
            <p className="text-xs text-blue-200 mt-0.5 leading-relaxed">
              Tap the <Share size={11} className="inline mx-0.5 -mt-0.5" /> <strong>Share</strong> button below, then tap <strong>"Add to Home Screen"</strong>
            </p>
          </div>
          <button onClick={handleDismiss} className="text-blue-300 flex-shrink-0 -mt-0.5">
            <X size={18} />
          </button>
        </div>
        {/* Arrow pointing to Safari share button */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-1.5 text-blue-200 text-xs">
            <span>Tap</span>
            <span className="bg-blue-700 rounded px-2 py-0.5 font-medium flex items-center gap-1">
              <Share size={11} /> Share
            </span>
            <span>→</span>
            <span className="bg-blue-700 rounded px-2 py-0.5 font-medium">Add to Home Screen</span>
          </div>
        </div>
      </div>
    );
  }

  // Android Chrome — use native install prompt
  if (!prompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1d4ed8] text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <img src="/icons/icon-192.png" className="w-10 h-10 rounded-xl flex-shrink-0" alt="ClubFlow" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install ClubFlow</p>
        <p className="text-xs text-blue-200">Add to home screen for the best experience</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1 bg-white text-blue-600 text-sm font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
      >
        <Download size={14} />
        Install
      </button>
      <button onClick={handleDismiss} className="text-blue-300 flex-shrink-0">
        <X size={18} />
      </button>
    </div>
  );
}
