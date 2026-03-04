import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-accent/15 text-accent border border-accent/20'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-700 border border-transparent'
        }`
      }>
      <span className="w-5 h-5 shrink-0 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

// ── Icons ─────────────────────────────────────────────────
const Icons = {
  dashboard: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>,
  courses: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  questions: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>,
  exams: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  users: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  results: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  sun: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>,
  moon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>,
  logout: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>,
  collapse: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"/></svg>,
  globe: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253"/></svg>,
}

function getNavItems(role, t) {
  const admin = [
    { to: '/admin',         label: t('nav.dashboard'), end: true, icon: Icons.dashboard },
    { to: '/admin/users',   label: t('nav.users'),     icon: Icons.users },
    { to: '/admin/courses', label: t('nav.courses'),   icon: Icons.courses },
  ]
  const teacher = [
    { to: '/teacher',           label: t('nav.dashboard'), end: true, icon: Icons.dashboard },
    { to: '/teacher/courses',   label: t('nav.courses'),   icon: Icons.courses },
    { to: '/teacher/questions', label: t('nav.questions'), icon: Icons.questions },
    { to: '/teacher/exams',     label: t('nav.exams'),     icon: Icons.exams },
  ]
  const student = [
    { to: '/student',          label: t('nav.dashboard'), end: true, icon: Icons.dashboard },
    { to: '/student/exams',    label: t('nav.exams'),     icon: Icons.exams },
    { to: '/student/results',  label: t('nav.results'),   icon: Icons.results },
  ]
  if (role === 'ADMIN') return admin
  if (role === 'TEACHER') return teacher
  return student
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const { theme, lang, toggleTheme, toggleLang, t } = useSettings()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const roles = user?.roles || []
  const role = Array.isArray(roles) ? roles[0] : [...roles][0]
  const navItems = getNavItems(role, t)

  const handleLogout = async () => { await logout(); navigate('/login') }

  const roleLabel = t(`role.${role}`) || role
  const roleColor = { ADMIN: 'badge-red', TEACHER: 'badge-cyan', STUDENT: 'badge-green' }[role] || 'badge-muted'

  return (
    <div className="min-h-screen bg-surface-950 flex">

      {/* ── Sidebar ── */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 bg-surface-900 border-r border-surface-700 flex flex-col transition-all duration-200 sticky top-0 h-screen`}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-surface-700 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          {!collapsed && <span className="font-display font-bold text-text-primary tracking-tight">ExamPortal</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => collapsed ? (
            <NavLink key={item.to} to={item.to} end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                }`}>
              {item.icon}
            </NavLink>
          ) : (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-3 border-t border-surface-700 space-y-1">

          {/* Theme + Lang toggles */}
          {!collapsed && (
            <div className="flex gap-2 mb-2">
              {/* Theme toggle */}
              <button onClick={toggleTheme}
                title={t('theme.toggle')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-700 border border-surface-600 transition-all">
                {theme === 'dark' ? Icons.sun : Icons.moon}
                <span className="font-mono">{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
              </button>
              {/* Lang toggle */}
              <button onClick={toggleLang}
                title={t('lang.toggle')}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-700 border border-surface-600 transition-all">
                {Icons.globe}
                <span className="font-mono">{lang === 'vi' ? 'EN' : 'VI'}</span>
              </button>
            </div>
          )}

          {/* Collapsed: icon-only toggles */}
          {collapsed && (
            <div className="flex flex-col gap-1 mb-2">
              <button onClick={toggleTheme}
                className="flex items-center justify-center p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-all"
                title={t('theme.toggle')}>
                {theme === 'dark' ? Icons.sun : Icons.moon}
              </button>
              <button onClick={toggleLang}
                className="flex items-center justify-center p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-all"
                title={t('lang.toggle')}>
                {Icons.globe}
              </button>
            </div>
          )}

          {/* Profile link */}
          <NavLink to="/profile"
            className="flex items-center gap-3 p-2.5 hover:bg-surface-700 rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
              <span className="text-accent text-xs font-bold">{user?.fullName?.[0]?.toUpperCase()}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{user?.fullName || user?.username}</p>
                <p className={`text-xs ${roleColor}`}>{roleLabel}</p>
              </div>
            )}
          </NavLink>

          {/* Logout */}
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-red-accent hover:bg-red-accent/10 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}>
            {Icons.logout}
            {!collapsed && t('nav.logout')}
          </button>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary hover:bg-surface-700 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}>
            <span className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}>
              {Icons.collapse}
            </span>
            {!collapsed && t('nav.collapse')}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
