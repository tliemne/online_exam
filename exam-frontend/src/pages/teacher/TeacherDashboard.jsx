import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    courseApi.getAll()
      .then((r) => setCourses(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const myCourses = courses.filter((c) => c.teacherId === user?.id)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-text-muted text-sm font-mono mb-1">Xin chào,</p>
        <h1 className="page-title">{user?.fullName || user?.username} 📚</h1>
        <p className="text-text-secondary text-sm mt-1">Quản lý lớp học và đề thi của bạn</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { to: '/teacher/courses', label: 'Tạo lớp học', desc: 'Quản lý sinh viên', color: 'accent', icon: '📚' },
          { to: '/teacher/questions', label: 'Ngân hàng đề', desc: 'Thêm câu hỏi mới', color: 'cyan', icon: '❓' },
          { to: '/teacher/exams', label: 'Tạo đề thi', desc: 'Giao đề cho sinh viên', color: 'green', icon: '📝' },
        ].map((item) => (
          <Link key={item.to} to={item.to}
            className="card-hover group flex flex-col gap-3">
            <div className="text-2xl">{item.icon}</div>
            <div>
              <div className="font-display font-semibold text-text-primary group-hover:text-accent transition-colors">{item.label}</div>
              <div className="text-text-muted text-sm mt-0.5">{item.desc}</div>
            </div>
            <div className="text-accent text-sm opacity-0 group-hover:opacity-100 transition-opacity">Vào ngay →</div>
          </Link>
        ))}
      </div>

      {/* My courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Lớp học của bạn</h2>
          <Link to="/teacher/courses" className="text-accent text-sm hover:text-accent-hover transition-colors">Quản lý →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : myCourses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">Bạn chưa có lớp học nào</p>
            <Link to="/teacher/courses" className="btn-primary mt-4 inline-flex">Tạo lớp đầu tiên</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myCourses.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-4 rounded-lg bg-surface-700 border border-surface-600 hover:border-accent/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                  <span className="text-accent text-xs font-bold font-display">{c.name?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-text-primary text-sm font-medium">{c.name}</div>
                  <div className="text-text-muted text-xs mt-0.5 line-clamp-1">{c.description || 'Không có mô tả'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modules coming soon */}
      <div className="card border-dashed border-surface-500">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-amber-accent/10 border border-amber-accent/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
          </div>
          <p className="text-text-secondary text-sm">Module <span className="text-amber-accent font-mono">Questions</span>, <span className="text-amber-accent font-mono">Exams</span>, <span className="text-amber-accent font-mono">Attempts</span> đang được backend phát triển.</p>
          <p className="text-text-muted text-xs mt-1">UI đã sẵn sàng, chỉ cần kết nối API!</p>
        </div>
      </div>
    </div>
  )
}
