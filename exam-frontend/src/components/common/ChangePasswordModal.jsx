// src/components/common/ChangePasswordModal.jsx
// Dùng ở: ProfilePage (user tự đổi)
import { useState } from 'react'
import { userApi } from '../../api/services'

const EyeIcon = ({ show }) => show
  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [show, setShow] = useState({ old: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.oldPassword) return setError('Nhập mật khẩu hiện tại')
    if (form.newPassword.length < 6) return setError('Mật khẩu mới phải ít nhất 6 ký tự')
    if (form.newPassword !== form.confirm) return setError('Mật khẩu xác nhận không khớp')
    if (form.oldPassword === form.newPassword) return setError('Mật khẩu mới phải khác mật khẩu cũ')

    setSaving(true)
    try {
      await userApi.changeMyPassword(form.oldPassword, form.newPassword)
      setDone(true)
    } catch (err) {
      const msg = err?.response?.data?.message || ''
      setError(msg.includes('INVALID_REQUEST') || msg.includes('400')
        ? 'Mật khẩu hiện tại không đúng'
        : 'Đổi mật khẩu thất bại, thử lại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-xl w-full max-w-md shadow-modal">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-surface-700">
          <h3 className="font-semibold text-text-primary"> Đổi mật khẩu</h3>
          <button onClick={onClose}
            className="btn-ghost p-1.5 text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-7 space-y-5">
          {done ? (
            /* Success */
            <div className="text-center py-4">
              <div className="text-5xl mb-4"></div>
              <p className="text-text-primary font-semibold mb-1">Đổi mật khẩu thành công!</p>
              <p className="text-text-muted text-sm mb-6">Mật khẩu mới của bạn đã được cập nhật.</p>
              <button onClick={onClose} className="btn-primary w-full">Đóng</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Old password */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={show.old ? 'text' : 'password'}
                    value={form.oldPassword}
                    onChange={e => set('oldPassword', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Nhập mật khẩu hiện tại"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, old: !p.old }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <EyeIcon show={show.old} />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={show.new ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={e => set('newPassword', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Ít nhất 6 ký tự"
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <EyeIcon show={show.new} />
                  </button>
                </div>
                {/* Strength bar */}
                {form.newPassword && (
                  <div className="mt-1.5 flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        form.newPassword.length >= i * 4
                          ? i === 1 ? 'bg-danger' : i === 2 ? 'bg-yellow-400' : 'bg-success'
                          : 'bg-surface-600'
                      }`}/>
                    ))}
                    <span className="text-xs text-text-muted ml-1">
                      {form.newPassword.length < 4 ? 'Yếu' : form.newPassword.length < 8 ? 'Trung bình' : 'Mạnh'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={show.confirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => set('confirm', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className={`input-field pr-10 ${
                      form.confirm && form.confirm !== form.newPassword
                        ? 'border-danger/50 focus:border-danger'
                        : form.confirm && form.confirm === form.newPassword
                        ? 'border-success/50 focus:border-success'
                        : ''
                    }`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button type="button" onClick={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <EyeIcon show={show.confirm} />
                  </button>
                </div>
                {form.confirm && form.confirm === form.newPassword && (
                  <p className="text-xs text-success mt-1">Khớp</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-2.5">
                  <p className="text-danger text-sm"> {error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Đang lưu...
                      </span>
                    : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
