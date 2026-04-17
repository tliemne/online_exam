import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10M5 7h8M5 11h9M5 15h6"/>
            </svg>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>ExamPortal</span>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-1)]">Kiểm tra email của bạn</h2>
              <p className="text-sm text-[var(--text-3)]">
                Nếu email <span className="font-medium text-[var(--text-2)]">{email}</span> tồn tại trong hệ thống,
                bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
              </p>
              <p className="text-xs text-[var(--text-3)]">Link có hiệu lực trong 15 phút.</p>
              <Link to="/login" className="btn-primary w-full block text-center mt-4">
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[var(--text-1)] mb-2">Quên mật khẩu</h1>
              <p className="text-sm text-[var(--text-3)] mb-6">
                Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                      Đang gửi...
                    </span>
                  ) : 'Gửi link đặt lại mật khẩu'}
                </button>
              </form>

              <p className="mt-6 text-sm text-center text-[var(--text-3)]">
                Nhớ mật khẩu rồi?{' '}
                <Link to="/login" className="font-bold text-accent hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
