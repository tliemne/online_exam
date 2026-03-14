import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { notifApi } from '../../api/services'

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
}

// ── Nav structure with groups ─────────────────────────────
function getNavItems(role) {
  const p = role === 'ADMIN' ? '/admin' : '/teacher'

  const questionGroup = {
    group: true, label: 'Câu hỏi', icon: Icon.questions,
    matchPrefixes: [`${p}/questions`, `${p}/tags`, `${p}/question-stats`],
    children: [
      { to: `${p}/questions`,      label: 'Ngân hàng', icon: Icon.questions },
      { to: `${p}/tags`,           label: 'Tags',       icon: Icon.tags      },
      { to: `${p}/question-stats`, label: 'Thống kê',  icon: Icon.stats     },
    ]
  }

  const examGroup = {
    group: true, label: 'Bài kiểm tra', icon: Icon.exams,
    matchPrefixes: [`${p}/exams`, `${p}/grading`, `${p}/stats`],
    children: [
      { to: `${p}/exams`,   label: 'Đề thi',    icon: Icon.exams    },
      { to: `${p}/grading`, label: 'Chấm điểm', icon: Icon.grading  },
      { to: `${p}/stats`,   label: 'Thống kê',  icon: Icon.stats    },
    ]
  }

  if (role === 'ADMIN') return [
    { to: '/admin',          label: 'Tổng quan',   end: true, icon: Icon.dashboard },
    { to: '/admin/users',    label: 'Người dùng',             icon: Icon.users     },
    { to: '/admin/courses',  label: 'Lớp học',                icon: Icon.courses   },
    questionGroup,
    examGroup,
    { to: '/admin/logs',     label: 'Nhật ký',                icon: Icon.logs      },
  ]

  if (role === 'TEACHER') return [
    { to: '/teacher',         label: 'Tổng quan', end: true, icon: Icon.dashboard },
    { to: '/teacher/courses', label: 'Lớp học',              icon: Icon.courses   },
    questionGroup,
    examGroup,
  ]

  // STUDENT — flat list
  return [
    { to: '/student',           label: 'Tổng quan',  end: true, icon: Icon.dashboard   },
    { to: '/student/exams',     label: 'Bài thi',               icon: Icon.exams        },
    { to: '/student/results',   label: 'Kết quả',               icon: Icon.results      },
    { to: '/student/schedule',  label: 'Lịch thi',              icon: Icon.schedule     },
    { to: '/student/rankings',  label: 'Xếp hạng',              icon: Icon.leaderboard  },
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
      style={isActive ? { color: 'var(--accent)', background: 'var(--accent-subtle)' } : {}}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150
        ${collapsed ? 'justify-center' : ''}
        ${indent && !collapsed ? 'pl-8' : ''}`}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}}>
      <span style={isActive ? {} : { color: 'var(--text-3)' }}>{icon}</span>
      {!collapsed && <span style={isActive ? { fontWeight: 500 } : { color: 'var(--text-2)' }}>{label}</span>}
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
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150"
        style={{ color: isAnyChildActive ? 'var(--accent)' : 'var(--text-2)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '' }}>
        <span style={{ color: isAnyChildActive ? 'var(--accent)' : 'var(--text-3)' }}>{item.icon}</span>
        <span className="flex-1 text-left" style={{ fontWeight: isAnyChildActive ? 500 : 400 }}>{item.label}</span>
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

// ── Notification Bell ─────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifs] = useState([])
  const [unread, setUnread]        = useState(0)
  const [loading, setLoading]      = useState(false)
  const ref = useRef(null)

  // Poll unread count mỗi 30 giây
  useEffect(() => {
    const fetchUnread = () => notifApi.getUnread().then(r => setUnread(r.data.data || 0)).catch(() => {})
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [])

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

  const handleMarkAllRead = async () => {
    await notifApi.markAllRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
  }

  const TYPE_COLOR = {
    EXAM_PUBLISHED: '#22c55e',
    ATTEMPT_GRADED: '#3b82f6',
    ESSAY_GRADED:   '#8b5cf6',
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
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border overflow-hidden z-50"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-base)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              Thông báo {unread > 0 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: '#ef4444' }}>{unread}</span>}
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs" style={{ color: 'var(--accent)' }}>
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }}/>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>Chưa có thông báo</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => handleMarkRead(n)}
                  className="flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0"
                  style={{
                    borderColor: 'var(--border-base)',
                    background: n.isRead ? 'transparent' : 'var(--accent-subtle)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--accent-subtle)' }}>
                  {/* Dot */}
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: n.isRead ? 'var(--border-base)' : (TYPE_COLOR[n.type] || '#6b7280') }}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-1)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-3)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
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
  const navigate                  = useNavigate()
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
          {navItems.map(item =>
            item.group
              ? <NavGroup key={item.label} item={item} collapsed={collapsed} />
              : <NavItem  key={item.to}    {...item}   collapsed={collapsed} />
          )}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-base)' }}>
          <SideBtn
            onClick={toggleTheme}
            icon={theme === 'dark' ? Icon.sun : Icon.moon}
            label={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            collapsed={collapsed}
          />
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
          <SideBtn onClick={handleLogout} icon={Icon.logout} label="Đăng xuất" collapsed={collapsed} danger/>
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
        {/* Top bar với notification bell */}
        <div className="flex justify-end px-8 pt-5 pb-0">
          <NotificationBell />
        </div>
        <div className="min-h-screen px-8 py-4 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
