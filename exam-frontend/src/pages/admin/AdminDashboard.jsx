import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userApi, courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

function StatCard({ label, value, icon, color, trend }) {
  const colors = {
    accent: 'border-accent/20 bg-accent/5 text-accent',
    cyan: 'border-cyan-accent/20 bg-cyan-accent/5 text-cyan-accent',
    green: 'border-green-accent/20 bg-green-accent/5 text-green-accent',
    amber: 'border-amber-accent/20 bg-amber-accent/5 text-amber-accent',
  }
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        {trend && <span className="text-xs text-green-accent bg-green-accent/10 border border-green-accent/20 rounded-full px-2 py-0.5">{trend}</span>}
      </div>
      <div className="font-display font-bold text-3xl text-text-primary mb-1">{value ?? '—'}</div>
      <div className="text-text-secondary text-sm">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([userApi.getAll(), courseApi.getAll()])
      .then(([u, c]) => {
        setUsers(u.data.data || [])
        setCourses(c.data.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const roleCount = (role) => users.filter((u) => u.roles?.some((r) => r.name === role)).length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-mono mb-1">Xin chào,</p>
          <h1 className="page-title">
            {user?.fullName || user?.username} 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">Tổng quan hệ thống ExamPortal</p>
        </div>
        <span className="badge-red">Admin</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng người dùng" value={loading ? null : users.length} color="accent"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>} />
        <StatCard label="Sinh viên" value={loading ? null : roleCount('STUDENT')} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/></svg>} />
        <StatCard label="Giảng viên" value={loading ? null : roleCount('TEACHER')} color="cyan"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>} />
        <StatCard label="Lớp học" value={loading ? null : courses.length} color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>} />
      </div>

      {/* Recent Users Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Người dùng gần đây</h2>
          <Link to="/admin/users" className="text-accent text-sm hover:text-accent-hover transition-colors">Xem tất cả →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-600">
                  <th className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 font-mono">Họ tên</th>
                  <th className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 font-mono">Username</th>
                  <th className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 font-mono">Email</th>
                  <th className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 font-mono">Vai trò</th>
                  <th className="text-left text-xs text-text-muted uppercase tracking-wider pb-3 font-mono">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {users.slice(0, 8).map((u) => (
                  <tr key={u.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="py-3 text-sm text-text-primary font-medium">{u.fullName || '—'}</td>
                    <td className="py-3 text-sm text-text-secondary font-mono">{u.username}</td>
                    <td className="py-3 text-sm text-text-secondary">{u.email || '—'}</td>
                    <td className="py-3">
                      {u.roles?.map((r) => (
                        <span key={r.name} className={
                          r.name === 'ADMIN' ? 'badge-red' :
                          r.name === 'TEACHER' ? 'badge-cyan' : 'badge-green'
                        }>{r.name}</span>
                      ))}
                    </td>
                    <td className="py-3">
                      <span className={u.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}>{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
