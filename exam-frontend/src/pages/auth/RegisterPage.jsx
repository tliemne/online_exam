import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { userApi } from '../../api/services'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ username: '', password: '', email: '', fullName: '', role: 'STUDENT' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await userApi.register(form)
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registerFailed'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-page)" }}>
      <div className="w-full max-w-md animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg
            bg-accent/10 border border-accent/20 mb-4">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h10M5 7h8M5 11h9M5 15h6"/>
            </svg>
          </div>
          <h1 className="font-display font-semibold text-lg text-[var(--text-1)]">ExamPortal</h1>
          <p className="text-[var(--text-3)] text-sm mt-1">{t('auth.createNewAccount')}</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display font-semibold text-base text-[var(--text-1)] mb-5">{t('auth.registerTitle')}</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-danger/8 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="input-label">{t('auth.fullNameLabel')}</label>
              <input className="input-field" placeholder={t('auth.fullNamePlaceholder')}
                value={form.fullName} onChange={set('fullName')} required/>
            </div>
            <div>
              <label className="input-label">{t('auth.usernameLabel')}</label>
              <input className="input-field" placeholder={t('auth.usernamePlaceholder')}
                value={form.username} onChange={set('username')} required autoComplete="username"/>
            </div>
            <div>
              <label className="input-label">{t('auth.passwordLabel')}</label>
              <input type="password" className="input-field" placeholder={t('auth.passwordPlaceholder')}
                value={form.password} onChange={set('password')} required autoComplete="new-password"/>
            </div>
            <div>
              <label className="input-label">{t('auth.emailLabel')} <span className="text-[var(--text-3)] font-normal normal-case">{t('auth.emailOptional')}</span></label>
              <input type="email" className="input-field" placeholder={t('auth.emailPlaceholder')}
                value={form.email} onChange={set('email')}/>
            </div>
            <div>
              <label className="input-label">{t('auth.roleLabel')}</label>
              <select className="input-field" value={form.role} onChange={set('role')}>
                <option value="STUDENT">{t('auth.studentRole')}</option>
                <option value="TEACHER">{t('auth.teacherRole')}</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                    {t('auth.creatingAccount')}
                  </span>
                : t('auth.createAccountButton')}
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-[var(--border-base)] text-center text-sm text-[var(--text-3)]">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
              {t('auth.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
