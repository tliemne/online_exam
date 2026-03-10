import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

// ── SVG Icons ─────────────────────────────────────────────
const Icon = {
  dashboard: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5V5.25A2.25 2.25 0 015.25 3h3.5A2.25 2.25 0 0111 5.25V10.5m0 0H3m8 0v4.75A2.25 2.25 0 0013.25 17h3.5A2.25 2.25 0 0019 14.75V5.25A2.25 2.25 0 0016.75 3h-3.5A2.25 2.25 0 0011 5.25V10.5"/></svg>,
  courses:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  questions: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>,
  exams:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  users:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  grading:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  results:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"/></svg>,
  logout:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>,
  chevron:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>,
  sun:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>,
  moon:      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>,
  profile:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
}

function getNavItems(role) {
  const admin   = [
    { to: '/admin',             label: 'Tổng quan',    end: true, icon: Icon.dashboard },
    { to: '/admin/users',       label: 'Người dùng',              icon: Icon.users     },
    { to: '/admin/courses',     label: 'Lớp học',                 icon: Icon.courses   },
    { to: '/teacher/questions', label: 'Câu hỏi',                 icon: Icon.questions },
    { to: '/teacher/exams',     label: 'Bài kiểm tra',            icon: Icon.exams     },
    { to: '/teacher/grading',   label: 'Chấm điểm',               icon: Icon.grading   },
  ]
  const teacher = [
    { to: '/teacher',           label: 'Tổng quan',    end: true, icon: Icon.dashboard },
    { to: '/teacher/courses',   label: 'Lớp học',                 icon: Icon.courses   },
    { to: '/teacher/questions', label: 'Câu hỏi',                 icon: Icon.questions },
    { to: '/teacher/exams',     label: 'Bài kiểm tra',            icon: Icon.exams     },
    { to: '/teacher/grading',   label: 'Chấm điểm',               icon: Icon.grading   },
  ]
  const student = [
    { to: '/student',         label: 'Tổng quan',    end: true, icon: Icon.dashboard },
    { to: '/student/exams',   label: 'Bài kiểm tra',            icon: Icon.exams     },
    { to: '/student/results', label: 'Kết quả',                 icon: Icon.results   },
  ]
  if (role === 'ADMIN')   return admin
  if (role === 'TEACHER') return teacher
  return student
}

function NavItem({ to, icon, label, end, collapsed }) {
  const location = useLocation()
  const isActive = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/')
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined}
      style={isActive ? { color: 'var(--accent)', background: 'var(--accent-subtle)' } : {}}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150
        ${collapsed ? 'justify-center' : ''}`}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}}>
      <span style={isActive ? {} : { color: 'var(--text-3)' }}>{icon}</span>
      {!collapsed && <span style={isActive ? { fontWeight: 500 } : { color: 'var(--text-2)' }}>{label}</span>}
    </NavLink>
  )
}

const roleConfig = {
  ADMIN:   { label: 'Admin',      color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  border: 'rgba(220,38,38,0.2)'  },
  TEACHER: { label: 'Giảng viên', color: '#0891b2', bg: 'rgba(8,145,178,0.1)', border: 'rgba(8,145,178,0.2)'  },
  STUDENT: { label: 'Sinh viên',  color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.2)'  },
}

function SideBtn({ onClick, icon, label, collapsed, danger }) {
  return (
    <button onClick={onClick} title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
      style={{ color: 'var(--text-3)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'rgba(220,38,38,0.08)' : 'var(--bg-hover)'
        e.currentTarget.style.color      = danger ? '#dc2626' : 'var(--text-1)'
      }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-3)' }}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

export default function AppLayout({ children }) {
  const { user, logout }         = useAuth()
  const { theme, toggleTheme }   = useSettings()
  const navigate                 = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const role     = Array.isArray(user?.roles) ? user.roles[0] : [...(user?.roles || [])][0]
  const navItems = getNavItems(role)
  const rc       = roleConfig[role] || { label: role, color: 'var(--text-3)', bg: 'var(--bg-elevated)', border: 'var(--border-base)' }

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── Sidebar ── */}
      <aside
        className={`${collapsed ? 'w-14' : 'w-60'} shrink-0 flex flex-col transition-all duration-200 sticky top-0 h-screen`}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-base)' }}>

        {/* Logo */}
        <div
          className={`flex items-center h-16 px-3 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
          style={{ borderBottom: '1px solid var(--border-base)' }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h12M2 7h8M2 11h10M2 14h6"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-sm tracking-tight" style={{ color: 'var(--text-1)' }}>
              ExamPortal
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => <NavItem key={item.to} {...item} collapsed={collapsed}/>)}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-base)' }}>

          {/* Theme toggle */}
          <SideBtn
            onClick={toggleTheme}
            icon={theme === 'dark' ? Icon.sun : Icon.moon}
            label={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            collapsed={collapsed}
          />

          {/* Profile */}
          <NavLink to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', color: 'var(--text-1)' }}>
              {(user?.fullName || user?.username || '?')[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text-1)' }}>
                  {user?.fullName || user?.username}
                </p>
                <span className="inline-block text-[10px] font-medium px-1.5 py-px rounded border mt-0.5"
                  style={{ color: rc.color, background: rc.bg, borderColor: rc.border }}>
                  {rc.label}
                </span>
              </div>
            )}
          </NavLink>

          {/* Logout */}
          <SideBtn onClick={handleLogout} icon={Icon.logout} label="Đăng xuất" collapsed={collapsed} danger/>

          {/* Collapse */}
          <SideBtn
            onClick={() => setCollapsed(p => !p)}
            icon={<span className={`transition-transform duration-200 inline-flex ${collapsed ? 'rotate-180' : ''}`}>{Icon.chevron}</span>}
            label="Thu gọn"
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen px-8 py-7 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
