// @refresh reset
import { useEffect, useRef } from 'react'

/**
 * ConfirmDialog — thay thế native confirm()
 *
 * Cách dùng:
 *   const [confirm, ConfirmDialogUI] = useConfirm()
 *   ...
 *   const ok = await confirm({ title: 'Xóa?', message: '...', danger: true })
 *   if (ok) doDelete()
 *   ...
 *   return <>{ConfirmDialogUI} ...</>
 */

import { useState, useCallback } from 'react'

export function useConfirm() {
  const [state, setState] = useState(null) // { title, message, danger, confirmLabel, resolve }

  const confirm = useCallback(({ title, message, danger = false, confirmLabel }) => {
    return new Promise((resolve) => {
      setState({ title, message, danger, confirmLabel, resolve })
    })
  }, [])

  const handleYes = () => {
    state?.resolve(true)
    setState(null)
  }

  const handleNo = () => {
    state?.resolve(false)
    setState(null)
  }

  const dialog = state ? (
    <ConfirmDialog
      title={state.title}
      message={state.message}
      danger={state.danger}
      confirmLabel={state.confirmLabel}
      onConfirm={handleYes}
      onCancel={handleNo}
    />
  ) : null

  return [confirm, dialog]
}

// ── Component UI ─────────────────────────────────────────
function ConfirmDialog({ title, message, danger, confirmLabel, onConfirm, onCancel }) {
  const btnRef = useRef(null)

  // Focus nút cancel mặc định — tránh Enter vô tình confirm
  useEffect(() => { btnRef.current?.focus() }, [])

  // ESC để hủy
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const iconColor = danger ? '#ef4444' : '#f59e0b'
  const icon = danger ? (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"/>
    </svg>
  )

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(11,20,55,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm animate-scale-in"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-base)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-7 pt-7 pb-4">
          <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${iconColor}18`, color: iconColor }}>
            {icon}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-bold" style={{ fontSize: 16, color: 'var(--text-1)' }}>{title}</h3>
            {message && (
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>{message}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-7 pb-7 pt-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: danger ? 'var(--danger)' : 'var(--warning)', borderRadius: '14px' }}
          >
            {confirmLabel || (danger ? 'Xóa' : 'Xác nhận')}
          </button>
          <button
            ref={btnRef}
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 text-sm font-bold transition-all hover:opacity-80"
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: '14px',
              color: 'var(--text-2, #a1a1aa)',
              border: '1px solid var(--border-base, #333)'
            }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
