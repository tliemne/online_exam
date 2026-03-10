import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

const QuickLinks = [
  { to: '/teacher/courses',   label: 'Lớp học',      desc: 'Tạo lớp, quản lý sinh viên' },
  { to: '/teacher/questions', label: 'Ngân hàng đề', desc: 'Thêm và phân loại câu hỏi'  },
  { to: '/teacher/exams',     label: 'Bài kiểm tra', desc: 'Tạo đề thi, giao cho lớp'   },
  { to: '/teacher/grading',   label: 'Chấm điểm',    desc: 'Chấm bài tự luận còn tồn'   },
]

export default function TeacherDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    courseApi.getAll()
      .then(r => setCourses(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const myCourses = courses.filter(c => c.teacherId === user?.id || c.teacherName === user?.fullName)

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Tổng quan</h1>
        <p className="text-text-muted text-sm mt-1">Xin chào, <span className="text-text-secondary">{user?.fullName || user?.username}</span></p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QuickLinks.map(q => (
          <Link key={q.to} to={q.to}
            className="card p-4 hover:border-surface-500 transition-colors group">
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{q.label}</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">{q.desc}</p>
          </Link>
        ))}
      </div>

      {/* My courses */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 className="section-title">Lớp học của bạn</h2>
          <Link to="/teacher/courses" className="text-xs text-accent hover:text-accent-hover transition-colors">Quản lý</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : myCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">Bạn chưa có lớp học nào</p>
            <Link to="/teacher/courses" className="btn-primary mt-4 inline-flex">Tạo lớp đầu tiên</Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-700">
            {myCourses.map(c => (
              <button key={c.id} onClick={() => navigate(`/teacher/courses/${c.id}`)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left
                  hover:bg-surface-700/40 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-surface-600 border border-surface-500
                  flex items-center justify-center shrink-0 text-xs font-semibold text-text-secondary">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">{c.name}</p>
                  <p className="text-xs text-text-muted truncate">{c.description || 'Không có mô tả'}</p>
                </div>
                <span className="text-xs text-text-muted shrink-0">{c.studentCount ?? 0} SV</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
