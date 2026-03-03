import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userApi } from '../../api/services'

const ROLES = ['STUDENT', 'TEACHER']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', email: '', fullName: '', role: 'STUDENT' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await userApi.register(form)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại, thử lại!')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-surface-950 bg-grid-pattern bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-64 bg-glow-accent pointer-events-none" />
      <div className="absolute left-1/4 top-1/3 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 mb-4 shadow-glow-sm">
            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M13.5 19.5H5.25A2.25 2.25 0 013 17.25V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15 19.5h3.75A2.25 2.25 0 0021 17.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary tracking-tight">ExamPortal</h1>
          <p className="text-text-secondary text-sm mt-1 font-body">Tạo tài khoản mới</p>
        </div>

        <div className="bg-surface-800/80 backdrop-blur-sm border border-surface-600 rounded-2xl p-8 shadow-card">
          <h2 className="font-display font-semibold text-lg text-text-primary mb-6">Đăng ký</h2>

          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-accent/10 border border-red-accent/30 text-red-accent text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và tên</label>
              <input className="input-field" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input-field" placeholder="username" value={form.username} onChange={set('username')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="email@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input type="password" className="input-field" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label className="label">Vai trò</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button key={r} type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      form.role === r
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-surface-500 bg-surface-700 text-text-secondary hover:border-surface-400'
                    }`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${form.role === r ? 'border-accent' : 'border-surface-400'}`}>
                      {form.role === r && <span className="w-2 h-2 rounded-full bg-accent block" />}
                    </span>
                    {r === 'STUDENT' ? '🎓 Sinh viên' : '📚 Giảng viên'}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base !mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                  Đang đăng ký...
                </span>
              ) : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-600 text-center text-sm text-text-secondary">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
