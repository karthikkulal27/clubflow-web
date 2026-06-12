import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { type, message } = (e as CustomEvent<{ type: 'success' | 'error'; message: string }>).detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message, visible: false }]);
      setTimeout(() => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t))), 10);
      setTimeout(() => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t))), 3200);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 inset-x-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0)' : 'translateY(-10px)',
          }}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl text-white text-[14px] font-semibold pointer-events-auto max-w-sm w-full
            ${t.type === 'success' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`}
        >
          {t.type === 'success'
            ? <CheckCircle size={18} className="flex-shrink-0" />
            : <XCircle size={18} className="flex-shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-70 hover:opacity-100 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
