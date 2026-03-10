import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    courseApi.getAll()
      .then(r => setCourses(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="page-title">Tổng quan</h1>
        <p className="text-text-muted text-sm mt-1">Xin chào, <span className="text-text-secondary">{user?.fullName || user?.username}</span></p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/student/exams"
          className="card p-4 hover:border-surface-500 transition-colors group">
          <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Bài kiểm tra</p>
          <p className="text-xs text-text-muted mt-1">Xem và làm bài thi</p>
        </Link>
        <Link to="/student/results"
          className="card p-4 hover:border-surface-500 transition-colors group">
          <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Kết quả của tôi</p>
          <p className="text-xs text-text-muted mt-1">Xem điểm và lịch sử thi</p>
        </Link>
      </div>

      {/* Courses */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 className="section-title">Lớp học đang tham gia</h2>
          <span className="text-xs text-text-muted">{courses.length} lớp</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">Chưa có lớp học nào</div>
        ) : (
          <div className="divide-y divide-surface-700">
            {courses.map(c => (
              <button key={c.id}
                onClick={() => navigate(`/student/courses/${c.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left
                  hover:bg-surface-700/40 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-surface-600 border border-surface-500
                  flex items-center justify-center shrink-0 text-xs font-semibold text-text-secondary">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">{c.name}</p>
                  <p className="text-xs text-text-muted truncate">{c.description || 'Không có mô tả'}</p>
                </div>
                <span className="badge-neutral shrink-0">Đang học</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
