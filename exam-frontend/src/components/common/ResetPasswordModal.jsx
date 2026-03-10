// src/components/common/ResetPasswordModal.jsx
// Dùng ở: AdminUsers (admin reset), TeacherGradingPage / CourseDetailPage (teacher reset student)
import { useState } from 'react'
import { userApi } from '../../api/services'

export default function ResetPasswordModal({ user, onClose }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm]         = useState('')
  const [show, setShow]               = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [done, setDone]               = useState(false)

  // Tạo mật khẩu ngẫu nhiên gợi ý
  const suggest = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const pwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setNewPassword(pwd)
    setConfirm(pwd)
    setShow(true)
    setError('')
  }

  const handleSubmit = async () => {
    if (newPassword.length < 6) return setError('Mật khẩu phải ít nhất 6 ký tự')
    if (newPassword !== confirm)  return setError('Mật khẩu xác nhận không khớp')

    setSaving(true)
    try {
      await userApi.resetPassword(user.id, newPassword)
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset thất bại, thử lại')
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = user.roles?.[0] === 'ADMIN' ? 'Admin'
    : user.roles?.[0] === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-surface-700">
          <h3 className="font-semibold text-text-primary">Xác nhận</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-7 space-y-5">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4"></div>
              <p className="text-text-primary font-semibold mb-1">Reset thành công!</p>
              <p className="text-text-muted text-sm mb-2">
                Mật khẩu mới của <span className="text-text-primary font-medium">{user.fullName || user.username}</span>:
              </p>
              <div className="bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 mb-3 font-mono text-lg text-accent tracking-widest">
                {newPassword}
              </div>
              {user.email && !user.email.endsWith('@school.edu.vn')
                ? <p className="text-xs text-accent mb-4">✉ Đã gửi thông báo tới {user.email}</p>
                : <p className="text-xs text-yellow-400 mb-4"> Tài khoản không có email — cần thông báo thủ công</p>
              }
              <button onClick={onClose} className="btn-primary w-full">Đóng</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* User info */}
              <div className="flex items-center gap-3 bg-surface-700 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-base shrink-0">
                  {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-text-primary font-medium">{user.fullName || user.username}</p>
                  <p className="text-text-muted text-xs">@{user.username} · {roleLabel}</p>
                </div>
              </div>

              <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/25 rounded-lg px-3 py-2">
                 Mật khẩu hiện tại sẽ bị thay thế ngay lập tức. Thông báo cho người dùng sau khi reset.
              </div>

              {/* Generate button */}
              <button onClick={suggest}
                className="w-full py-2 rounded-lg border border-dashed border-surface-500 text-text-muted text-sm hover:border-accent hover:text-accent transition-all">
                Tạo ngẫu nhiên
              </button>

              {/* New password */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError('') }}
                    className="input-field pr-10 font-mono tracking-wider"
                    placeholder="Ít nhất 6 ký tự"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShow(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs">
                    {show ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className={`input-field font-mono tracking-wider ${
                    confirm && confirm !== newPassword
                      ? 'border-danger/50' : confirm && confirm === newPassword
                      ? 'border-success/50' : ''
                  }`}
                  placeholder="Nhập lại mật khẩu mới"
                />
                {confirm && confirm === newPassword && (
                  <p className="text-xs text-success mt-1">Khớp</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2.5">
                  <p className="text-danger text-sm"> {error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Đang lưu...
                      </span>
                    : 'Xác nhận'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
