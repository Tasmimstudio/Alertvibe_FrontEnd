// components/Toast.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);

const STYLES = {
  success: { bg: 'rgba(34,197,94,0.14)',  border: 'rgba(34,197,94,0.38)',  color: '#4ade80' },
  error:   { bg: 'rgba(220,38,38,0.16)',  border: 'rgba(220,38,38,0.42)',  color: '#f87171' },
  info:    { bg: 'rgba(96,165,250,0.14)', border: 'rgba(96,165,250,0.35)', color: '#60a5fa' },
  warning: { bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.35)', color: '#fbbf24' },
};

const ICONS = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

function ToastItem({ toast, onRemove }) {
  const s = STYLES[toast.type] || STYLES.info;
  return (
    <div
      className="toast-slide-in flex items-start gap-3 px-4 py-3 rounded-xl pointer-events-auto"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      }}
    >
      <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</span>
      <p className="text-white/90 text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/25 hover:text-white/65 transition-colors flex-shrink-0 mt-0.5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ width: 'min(320px, calc(100vw - 2rem))' }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Returns `(message, type?, duration?) => void` */
export const useToast = () => useContext(ToastCtx);
