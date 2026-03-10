import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function getRole(r) { return typeof r === 'string' ? r : r.name }

const EyeIcon = ({ open }) => open ? (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
  </svg>
) : (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(form.username, form.password)
      const roles = user?.roles || []
      if      (roles.some(r => getRole(r) === 'ADMIN'))   navigate('/admin')
      else if (roles.some(r => getRole(r) === 'TEACHER')) navigate('/teacher')
      else navigate('/student')
    } catch (err) {
      setError(err.response?.data?.message || 'Sai tài khoản hoặc mật khẩu')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg
            bg-accent/10 border border-accent/20 mb-4">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10M5 7h8M5 11h9M5 15h6"/>
            </svg>
          </div>
          <h1 className="font-display font-semibold text-lg text-text-primary">ExamPortal</h1>
          <p className="text-text-muted text-sm mt-1">Hệ thống thi trực tuyến</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-base text-text-primary mb-5">Đăng nhập</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-danger/8 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Tên đăng nhập</label>
              <input className="input-field" placeholder="username"
                value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                autoFocus required autoComplete="username"/>
            </div>
            <div>
              <label className="input-label">Mật khẩu</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-9"
                  placeholder="••••••••"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  required autoComplete="current-password"/>
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-0.5">
                  <EyeIcon open={showPass}/>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                    Đang đăng nhập...
                  </span>
                : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-surface-600 text-center text-sm text-text-muted">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
