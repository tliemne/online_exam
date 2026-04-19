import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { notifApi } from '../../api/services'
import websocket from '../../api/websocket'
import { useTranslation } from 'react-i18next'
import LanguageSwitcherSidebar from './LanguageSwitcherSidebar'

// ── SVG Icons ─────────────────────────────────────────────
const Icon = {
  dashboard:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5V5.25A2.25 2.25 0 015.25 3h3.5A2.25 2.25 0 0111 5.25V10.5m0 0H3m8 0v4.75A2.25 2.25 0 0013.25 17h3.5A2.25 2.25 0 0019 14.75V5.25A2.25 2.25 0 0016.75 3h-3.5A2.25 2.25 0 0011 5.25V10.5"/></svg>,
  courses:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
  questions:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>,
  exams:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  users:       <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  grading:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  results:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"/></svg>,
  logout:      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>,
  chevron:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>,
  chevronDown: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>,
  sun:         <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>,
  moon:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>,
  leaderboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/></svg>,
  schedule:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"/></svg>,
  stats:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/></svg>,
  profile:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  logs:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/></svg>,
  tags:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>,
  bell:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>,
  reports:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px] shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
}

// ── Nav structure with groups ─────────────────────────────
function getNavItems(role, t) {
  const p = role === 'ADMIN' ? '/admin' : '/teacher'

  const questionGroup = {
    group: true, label: t('nav.questions'), icon: Icon.questions,
    matchPrefixes: [`${p}/questions`, `${p}/tags`, `${p}/question-stats`],
    children: [
      { to: `${p}/questions`,      label: t('question.title'), icon: Icon.questions },
      { to: `${p}/tags`,           label: 'Tags',       icon: Icon.tags      },
      { to: `${p}/question-stats`, label: t('stats.title'),  icon: Icon.stats     },
    ]
  }

  const examGroup = {
    group: true, label: t('exam.title'), icon: Icon.exams,
    matchPrefixes: [`${p}/exams`, `${p}/grading`, `${p}/stats`],
    children: [
      { to: `${p}/exams`,   label: t('exam.title'),    icon: Icon.exams    },
      { to: `${p}/grading`, label: t('grade.title'), icon: Icon.grading  },
      { to: `${p}/stats`,   label: t('stats.title'),  icon: Icon.stats    },
    ]
  }

  if (role === 'ADMIN') return [
    { to: '/admin',          label: t('nav.dashboard'),   end: true, icon: Icon.dashboard },
    { to: '/admin/users',    label: 'Quản lý người dùng',             icon: Icon.users     },
    { to: '/admin/courses',  label: 'Quản lý lớp học',                icon: Icon.courses   },
    { to: '/admin/exams',    label: 'Quản lý đề thi',                  icon: Icon.exams     },
    { to: '/admin/tags',     label: 'Quản lý Tags',                    icon: Icon.tags      },
    { to: '/admin/reports',  label: 'Báo cáo & Thống kê',              icon: Icon.reports   },
    { to: '/admin/activity-logs',     label: t('nav.activityLog'),                icon: Icon.logs      },
  ]

  if (role === 'TEACHER') return [
    { to: '/teacher',         label: t('nav.dashboard'), end: true, icon: Icon.dashboard },
    { to: '/teacher/courses', label: t('course.title'),              icon: Icon.courses   },
    questionGroup,
    examGroup,
  ]

  // STUDENT — flat list
  return [
    { to: '/student',           label: t('nav.dashboard'),  end: true, icon: Icon.dashboard   },
    { to: '/student/courses',   label: t('course.title'),               icon: Icon.courses     },
    { to: '/student/exams',     label: t('exam.title'),               icon: Icon.exams        },
    { to: '/student/results',   label: t('attempt.result'),               icon: Icon.results      },
    { to: '/student/schedule',  label: t('nav.schedule'),              icon: Icon.schedule     },
    { to: '/student/rankings',  label: t('stats.title'),              icon: Icon.leaderboard  },
  ]
}

// ── NavItem (leaf) ────────────────────────────────────────
function NavItem({ to, icon, label, end, collapsed, indent }) {
  const location = useLocation()
  const isActive = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/')
  return (
    <NavLink to={to} end={end} title={collapsed ? label : undefined}
      style={isActive ? {
        color: 'var(--accent)',
        background: 'linear-gradient(135deg, var(--accent-subtle) 0%, transparent 100%)',
        boxShadow: 'inset 0 0 0 1px var(--accent-border)',
      } : {}}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200
        rounded-xl
        ${collapsed ? 'justify-center' : ''}
        ${indent && !collapsed ? 'pl-9' : ''}`}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}}>
      <span style={isActive ? { color: 'var(--accent)' } : { color: 'var(--text-3)' }}>{icon}</span>
      {!collapsed && <span style={isActive ? { fontWeight: 700, color: 'var(--accent)' } : { color: 'var(--text-2)' }}>{label}</span>}
    </NavLink>
  )
}

// ── NavGroup (collapsible parent) ─────────────────────────
function NavGroup({ item, collapsed }) {
  const location = useLocation()
  const isAnyChildActive = item.matchPrefixes?.some(p =>
    location.pathname === p || location.pathname.startsWith(p + '/')
  )
  const [open, setOpen] = useState(isAnyChildActive ?? true)

  if (collapsed) {
    // Collapsed: show only first child's icon as single link
    return (
      <div className="space-y-0.5">
        {item.children.map(child => (
          <NavItem key={child.to} {...child} collapsed={collapsed} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        style={{ color: isAnyChildActive ? 'var(--accent)' : 'var(--text-2)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '' }}>
        <span style={{ color: isAnyChildActive ? 'var(--accent)' : 'var(--text-3)' }}>{item.icon}</span>
        <span className="flex-1 text-left" style={{ fontWeight: isAnyChildActive ? 700 : 500 }}>{item.label}</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-3)' }}>
          {Icon.chevronDown}
        </span>
      </button>

      {/* Children */}
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map(child => (
            <NavItem key={child.to} {...child} indent />
          ))}
        </div>
      )}
    </div>
  )
}

const roleConfig = {
  ADMIN:   { label: 'Admin',      color: 'var(--danger)', bg: 'var(--danger-subtle)',  border: 'var(--danger-border)'  },
  TEACHER: { label: 'Teacher', color: 'var(--cyan)', bg: 'var(--cyan-subtle)', border: 'rgba(8,145,178,0.2)'  },
  STUDENT: { label: 'Student',  color: 'var(--success)', bg: 'var(--success-subtle)', border: 'var(--success-border)'  },
}

function SideBtn({ onClick, icon, label, collapsed, danger }) {
  return (
    <button onClick={onClick} title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
      style={{ color: 'var(--text-3)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'var(--danger-subtle)' : 'var(--bg-hover)'
        e.currentTarget.style.color      = danger ? 'var(--danger)' : 'var(--text-1)'
      }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-3)' }}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

// ── Notification Bell ─────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifs] = useState([])
  const [unread, setUnread]        = useState(0)
  const [loading, setLoading]      = useState(false)
  const ref = useRef(null)

  // Connect to WebSocket and subscribe to notifications
  useEffect(() => {
    if (!user?.id) return

    const destination = `/topic/user-${user.id}`

    const initWebSocket = async () => {
      try {
        await websocket.connect()
      } catch (error) {
        // Connection failed, fallback to polling
        const fetchUnread = () => notifApi.getUnread().then(r => setUnread(r.data.data || 0)).catch(() => {})
        fetchUnread()
        const id = setInterval(fetchUnread, 30000)
        return () => clearInterval(id)
      }
    }

    // Subscribe first (will auto-subscribe when connected)
    websocket.subscribe(destination, (event) => {
      if (event.type === 'notification:new') {
        setNotifs(prev => [event.data, ...prev])
        setUnread(u => u + 1)
      } else if (event.type === 'notification:read') {
        setUnread(u => Math.max(0, u - 1))
      }
    })

    initWebSocket()

    return () => {
      websocket.unsubscribe(destination)
    }
  }, [user?.id])

  // Load notifications khi mở dropdown
  useEffect(() => {
    if (!open) return
    setLoading(true)
    notifApi.getAll(0, 15)
      .then(r => {
        const page = r.data.data || {}
        setNotifs(page.notifications || [])
        setUnread(page.unreadCount || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  // Close khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkRead = async (notif) => {
    if (!notif.isRead) {
      await notifApi.markRead(notif.id).catch(() => {})
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
      setUnread(u => Math.max(0, u - 1))
    }
    if (notif.link) { navigate(notif.link); setOpen(false) }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await notifApi.deleteOne(id).catch(() => {})
    const removed = notifications.find(n => n.id === id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    if (removed && !removed.isRead) setUnread(u => Math.max(0, u - 1))
  }

  const handleDeleteAll = async () => {
    await notifApi.deleteAll().catch(() => {})
    setNotifs([])
    setUnread(0)
  }

  const handleMarkAllRead = async () => {
    await notifApi.markAllRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
  }

  const TYPE_COLOR = {
    EXAM_PUBLISHED: '#22c55e',
    ATTEMPT_GRADED: '#3b82f6',
    ESSAY_GRADED:   '#8b5cf6',
    ESSAY_PENDING:  '#f59e0b',
    ANNOUNCEMENT:   '#06b6d4',
    SYSTEM:         '#6b7280',
  }

  const timeAgo = (dt) => {
    if (!dt) return ''
    const diff = Date.now() - new Date(dt).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'Vừa xong'
    if (m < 60) return `${m} phút trước`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ trước`
    return `${Math.floor(h / 24)} ngày trước`
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-3)' }}>
        {Icon.bell}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: '#ef4444' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 overflow-hidden z-50"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderRadius: '20px', boxShadow: 'var(--shadow-lg)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              {t('common.loading')} {unread > 0 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: '#ef4444' }}>{unread}</span>}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs" style={{ color: 'var(--accent)' }}>
                  {t('common.confirm')}
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleDeleteAll} className="text-xs" style={{ color: 'var(--text-3)' }}
                  title={t('common.delete')}>
                  {t('common.delete')}
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-base)' }}>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }}/>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>{t('messages.notFound')}</p>
            ) : (
              notifications.map(n => {
                const dotColor = TYPE_COLOR[n.type] || '#6b7280'
                return (
                  <div key={n.id} onClick={() => handleMarkRead(n)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-all group"
                    style={{
                      background: n.isRead
                        ? 'transparent'
                        : `color-mix(in srgb, ${dotColor} 10%, var(--bg-surface))`,
                      borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${dotColor}`,
                    }}>
                    {/* Dot — chỉ hiện khi chưa đọc */}
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse"
                        style={{ background: dotColor }}/>
                    )}
                    {n.isRead && (
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 opacity-20"
                        style={{ background: 'var(--text-3)' }}/>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight"
                        style={{
                          color: 'var(--text-1)',
                          fontWeight: n.isRead ? 400 : 600,
                          opacity: n.isRead ? 0.7 : 1,
                        }}>
                        {n.title}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{timeAgo(n.createdAt)}</p>
                        {!n.isRead && (
                          <span className="text-[9px] font-semibold px-1 rounded"
                            style={{ background: dotColor, color: '#fff', opacity: 0.9 }}>
                            MỚI
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Nút xóa — hiện khi hover */}
                    <button
                      onClick={e => handleDelete(e, n.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ color: 'var(--text-3)' }}
                      title="Xóa thông báo">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout({ children }) {
  const { user, logout }          = useAuth()
  const { theme, toggleTheme }    = useSettings()
  const { i18n, t }               = useTranslation()
  const navigate                  = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const role     = Array.isArray(user?.roles) ? user.roles[0] : [...(user?.roles || [])][0]
  const navItems = getNavItems(role, t)
  const rc       = roleConfig[role] || { label: role, color: 'var(--text-3)', bg: 'var(--bg-elevated)', border: 'var(--border-base)' }
  
  // Get translated role label
  const roleLabel = role === 'ADMIN' ? t('user.roleAdmin') : role === 'TEACHER' ? t('user.roleTeacher') : role === 'STUDENT' ? t('user.roleStudent') : role

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* ── Sidebar ── */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 flex flex-col transition-all duration-300 sticky top-0 h-screen`}
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>

        {/* Logo */}
        <div className={`flex items-center px-5 ${collapsed ? 'justify-center h-16' : 'gap-3 h-20'}`}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)' }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h12M2 7h8M2 11h10M2 14h6"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-base tracking-tight block" style={{ color: 'var(--text-1)' }}>
                ExamPortal
              </span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t('common.systemShortName')}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 mb-2" style={{ height: '1px', background: 'var(--border-subtle)' }}/>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
          {navItems.map(item =>
            item.group
              ? <NavGroup key={item.label} item={item} collapsed={collapsed} />
              : <NavItem  key={item.to}    {...item}   collapsed={collapsed} />
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 space-y-0.5">
          <div className="mb-2" style={{ height: '1px', background: 'var(--border-subtle)' }}/>
          <LanguageSwitcherSidebar collapsed={collapsed} />
          <SideBtn
            onClick={toggleTheme}
            icon={theme === 'dark' ? Icon.sun : Icon.moon}
            label={theme === 'dark' ? t('common.theme') : t('common.theme')}
            collapsed={collapsed}
          />
          <NavLink to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)' }}>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover"/>
                : (user?.fullName || user?.username || '?')[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text-1)' }}>
                  {user?.fullName || user?.username}
                </p>
                <span className="inline-block text-[10px] font-medium px-1.5 py-px rounded border mt-0.5"
                  style={{ color: rc.color, background: rc.bg, borderColor: rc.border }}>
                  {roleLabel}
                </span>
              </div>
            )}
          </NavLink>
          <SideBtn onClick={handleLogout} icon={Icon.logout} label={t('common.logout')} collapsed={collapsed} danger/>
          <SideBtn
            onClick={() => setCollapsed(p => !p)}
            icon={<span className={`transition-transform duration-200 inline-flex ${collapsed ? 'rotate-180' : ''}`}>{Icon.chevron}</span>}
            label={t('common.back')}
            collapsed={collapsed}
          />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-page)' }}>
        {/* Top bar */}
        <div className="flex justify-end px-8 pt-6 pb-0">
          <NotificationBell />
        </div>
        <div className="min-h-screen px-8 py-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
