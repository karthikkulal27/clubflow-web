import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-banner-dismissed') === '1');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isInstalled || dismissed || !isMobile || !prompt) return null;

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <img src="/icons/icon-192.png" className="w-10 h-10 rounded-xl flex-shrink-0" alt="ClubFlow" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install ClubFlow</p>
        <p className="text-xs text-blue-100">Add to home screen for the best experience</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1 bg-white text-blue-600 text-sm font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
      >
        <Download size={14} />
        Install
      </button>
      <button onClick={handleDismiss} className="text-blue-200 flex-shrink-0">
        <X size={18} />
      </button>
    </div>
  );
}
