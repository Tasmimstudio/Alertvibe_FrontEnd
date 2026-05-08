// components/ConfirmDialog.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  /** Returns a Promise<boolean> — true = confirmed, false = cancelled */
  const confirm = useCallback((message, confirmLabel = 'Confirm') => {
    return new Promise(resolve => {
      setState({ message, confirmLabel, resolve });
    });
  }, []);

  const respond = (value) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}

      {state && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
          onClick={() => respond(false)}
        >
          <div
            className="glass w-full max-w-sm p-6"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon + message */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="text-white/90 text-sm leading-relaxed flex-1">{state.message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => respond(true)} className="btn-red flex-1 py-2.5 text-sm">
                {state.confirmLabel}
              </button>
              <button
                onClick={() => respond(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

/** Returns `(message, confirmLabel?) => Promise<boolean>` */
export const useConfirm = () => useContext(ConfirmCtx);
