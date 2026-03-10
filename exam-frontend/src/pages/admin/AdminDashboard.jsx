import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userApi, courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

const StatIcon = {
  users: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  student: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/></svg>,
  teacher: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
  course: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>,
}

const ROLE_MAP = { ADMIN: 'Admin', TEACHER: 'Giảng viên', STUDENT: 'Sinh viên' }
const ROLE_BADGE = { ADMIN: 'badge-red', TEACHER: 'badge-cyan', STUDENT: 'badge-green' }

export default function AdminDashboard() {
  const { user } = useAuth()
  const [users, setUsers]     = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([userApi.getAll(), courseApi.getAll()])
      .then(([u, c]) => { setUsers(u.data.data || []); setCourses(c.data.data || []) })
      .finally(() => setLoading(false))
  }, [])

  const count = (role) => users.filter(u => u.roles?.includes(role)).length

  const stats = [
    { label: 'Tổng tài khoản', value: users.length,     icon: StatIcon.users,   to: '/admin/users'   },
    { label: 'Sinh viên',      value: count('STUDENT'),  icon: StatIcon.student, to: '/admin/users'   },
    { label: 'Giảng viên',     value: count('TEACHER'),  icon: StatIcon.teacher, to: '/admin/users'   },
    { label: 'Lớp học',        value: courses.length,    icon: StatIcon.course,  to: '/admin/courses' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Tổng quan</h1>
        <p className="text-text-muted text-sm mt-1">Xin chào, <span className="text-text-secondary">{user?.fullName || user?.username}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="card p-4 hover:border-surface-500 transition-colors group">
            <div className="text-text-muted mb-3 group-hover:text-accent transition-colors">{s.icon}</div>
            <div className="font-display font-semibold text-2xl text-text-primary">
              {loading ? <span className="inline-block w-8 h-6 bg-surface-600 rounded animate-pulse"/> : s.value}
            </div>
            <div className="text-text-muted text-xs mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent users */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 className="section-title">Người dùng gần đây</h2>
          <Link to="/admin/users" className="text-xs text-accent hover:text-accent-hover transition-colors">Xem tất cả</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                {['Họ tên', 'Username', 'Email', 'Vai trò', 'Trạng thái'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {users.slice(0, 8).map(u => (
                <tr key={u.id} className="hover:bg-surface-700/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-text-primary font-medium">{u.fullName || '—'}</td>
                  <td className="px-5 py-3 text-sm font-mono text-text-secondary">{u.username}</td>
                  <td className="px-5 py-3 text-sm text-text-muted">{u.email || '—'}</td>
                  <td className="px-5 py-3">
                    {u.roles?.map(r => (
                      <span key={r} className={ROLE_BADGE[r] || 'badge-neutral'}>{ROLE_MAP[r] || r}</span>
                    ))}
                  </td>
                  <td className="px-5 py-3">
                    <span className={u.status === 'ACTIVE' ? 'badge-green' : 'badge-neutral'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
