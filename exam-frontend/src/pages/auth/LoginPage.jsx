import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function getRole(r) { return typeof r === 'string' ? r : r.name }

const EyeOpen = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)
const EyeOff = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
  </svg>
)

// Animated shapes for right panel
function FloatingShape({ cx, cy, r, delay, opacity }) {
  return (
    <circle cx={cx} cy={cy} r={r} fill="white" opacity={opacity}
      style={{ animation: `float ${3 + delay}s ease-in-out ${delay}s infinite alternate` }}/>
  )
}

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [blocked, setBlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleUsernameChange = (e) => {
    setForm({ ...form, username: e.target.value })
    if (blocked) { setBlocked(false); setError('') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setBlocked(false); setLoading(true)
    try {
      const user = await login(form.username, form.password)
      const roles = user?.roles || []
      if      (roles.some(r => getRole(r) === 'ADMIN'))   navigate('/admin')
      else if (roles.some(r => getRole(r) === 'TEACHER')) navigate('/teacher')
      else navigate('/student')
    } catch (err) {
      const status  = err.response?.status
      const message = err.response?.data?.message
      if (status === 429) {
        setBlocked(true)
        setError(message || 'Tài khoản tạm bị khóa. Vui lòng thử lại sau.')
      } else {
        setError('Sai tên đăng nhập hoặc mật khẩu.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── Left: Form ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md animate-slide-up">

          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)' }}>
                <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10M5 7h8M5 11h9M5 15h6"/>
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>ExamPortal</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>
              Đăng nhập
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Nhập thông tin tài khoản để tiếp tục!
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3.5 rounded-2xl text-sm flex items-start gap-3"
              style={{
                background: blocked ? 'rgba(255,181,71,0.1)' : 'var(--danger-subtle)',
                border: `1px solid ${blocked ? 'rgba(255,181,71,0.3)' : 'var(--danger-border)'}`,
                color: blocked ? 'var(--warning)' : 'var(--danger)',
              }}>
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {blocked
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                }
              </svg>
              <span>{blocked ? 'Tài khoản tạm bị khóa — ' : ''}{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Tên đăng nhập</label>
              <input
                className="input-field"
                placeholder="Nhập tên đăng nhập..."
                value={form.username}
                onChange={handleUsernameChange}
                autoFocus required autoComplete="username"
              />
            </div>

            <div>
              <label className="input-label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password"
                />
                <button type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  tabIndex={-1}>
                  {showPass ? <EyeOpen/> : <EyeOff/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                    Đang đăng nhập...
                  </span>
                : 'Đăng nhập →'
              }
            </button>
          </form>

          <p className="mt-8 text-sm text-center" style={{ color: 'var(--text-3)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold transition-colors"
              style={{ color: 'var(--accent)' }}>
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right: Illustration ──────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--accent-dark) 0%, #1b254b 60%, #0b1437 100%)' }}>

        {/* Decorative circles */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <FloatingShape cx="80%"  cy="15%" r="120" delay={0}   opacity={0.04}/>
          <FloatingShape cx="10%"  cy="80%" r="180" delay={0.5} opacity={0.04}/>
          <FloatingShape cx="60%"  cy="70%" r="80"  delay={1}   opacity={0.06}/>
          <FloatingShape cx="30%"  cy="20%" r={60}  delay={1.5} opacity={0.05}/>
          <FloatingShape cx="90%"  cy="60%" r={100} delay={0.8} opacity={0.03}/>
        </svg>

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center px-8">
          {/* Mock dashboard card */}
          <div className="rounded-3xl p-6 mb-8 text-left animate-scale-in"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-xs font-bold mb-4" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>TỔNG QUAN HỆ THỐNG</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Học sinh', value: '1,248', color: '#7551ff' },
                { label: 'Đề thi',   value: '86',    color: '#01b574' },
                { label: 'Lượt thi', value: '3,421', color: '#3965ff' },
                { label: 'Tỉ lệ đạt', value: '78%', color: '#ffb547' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                  <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full" style={{ background: s.color, width: '65%' }}/>
                  </div>
                </div>
              ))}
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1.5 h-12">
              {[40,65,45,80,55,90,70].map((h,i) => (
                <div key={i} className="flex-1 rounded-t-lg transition-all"
                  style={{
                    height: `${h}%`,
                    background: i === 5
                      ? 'linear-gradient(180deg, #7551ff 0%, #422afb 100%)'
                      : 'rgba(255,255,255,0.12)',
                  }}/>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Hệ thống thi trực tuyến
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Quản lý đề thi, chấm điểm tự động và theo dõi tiến độ học tập của sinh viên.
          </p>
        </div>

        <style>{`
          @keyframes float {
            from { transform: translateY(0px); }
            to   { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    </div>
  )
}
