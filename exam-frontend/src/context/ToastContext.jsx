import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

// ── Types: success | error | warning | info ──────────────
const STYLES = {
  success: {
    bar:  '#16a34a',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/>
      </svg>
    ),
  },
  error: {
    bar:  '#dc2626',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
      </svg>
    ),
  },
  warning: {
    bar:  '#d97706',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"/>
      </svg>
    ),
  },
  info: {
    bar:  '#0891b2',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
      </svg>
    ),
  },
}

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id
    setToasts(p => [...p.slice(-4), { id, message, type }]) // max 5 toasts
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  // Shortcuts
  toast.success = (msg, dur)  => toast(msg, 'success', dur)
  toast.error   = (msg, dur)  => toast(msg, 'error',   dur ?? 5000)
  toast.warning = (msg, dur)  => toast(msg, 'warning', dur)
  toast.info    = (msg, dur)  => toast(msg, 'info',    dur)

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Portal — bottom-right */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 10,
          width: 340, maxWidth: 'calc(100vw - 32px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const s = STYLES[t.type] || STYLES.info
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--bg-surface, #1e1e2e)',
                border: '1px solid var(--border-base, #333)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                borderLeft: `4px solid ${s.bar}`,
                color: 'var(--text-1, #f1f5f9)',
                fontSize: 14,
                lineHeight: 1.45,
                cursor: 'pointer',
                pointerEvents: 'all',
                animation: 'toast-in 0.22s ease',
              }}
            >
              <span style={{ color: s.bar, marginTop: 1 }}>{s.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <span style={{ color: 'var(--text-3, #6b7280)', fontSize: 18, lineHeight: 1, marginTop: -1 }}>×</span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
