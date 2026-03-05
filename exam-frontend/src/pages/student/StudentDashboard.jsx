import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    courseApi.getAll()
      .then((r) => setCourses(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-text-muted text-sm font-mono mb-1">Xin chào,</p>
        <h1 className="page-title">{user?.fullName || user?.username} 🎓</h1>
        <p className="text-text-secondary text-sm mt-1">Chào mừng bạn quay lại ExamPortal</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/student/exams"
          className="card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
            </div>
            <div>
              <div className="font-display font-semibold text-text-primary group-hover:text-accent transition-colors">Đề thi sắp tới</div>
              <div className="text-text-muted text-sm">Xem và làm bài thi</div>
            </div>
          </div>
        </Link>
        <Link to="/student/results"
          className="card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-green-accent/15 border border-green-accent/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
            </div>
            <div>
              <div className="font-display font-semibold text-text-primary group-hover:text-green-accent transition-colors">Kết quả của tôi</div>
              <div className="text-text-muted text-sm">Xem điểm và lịch sử thi</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Available courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Các lớp học</h2>
          <span className="badge-muted">{courses.length} lớp</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">Chưa có lớp học nào</div>
        ) : (
          <div className="grid gap-3">
            {courses.map((c) => (
              <div key={c.id}
                onClick={() => navigate(`/student/courses/${c.id}`)}
                className="flex items-center gap-4 p-4 rounded-lg bg-surface-700 border border-surface-600 hover:border-accent/30 hover:bg-surface-600/50 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-cyan-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold font-display text-sm">{c.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium text-sm group-hover:text-accent transition-colors">{c.name}</div>
                  <div className="text-text-muted text-xs mt-0.5 truncate">{c.description || 'Không có mô tả'}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="badge-accent">Đang học</span>
                  <span className="text-accent text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming soon notice */}
      <div className="card border-dashed border-surface-500">
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🚀</div>
          <p className="text-text-secondary text-sm">Tính năng <span className="text-accent font-medium">làm bài thi trực tuyến</span> sẽ sẵn sàng khi backend hoàn thiện module Exam & Attempt.</p>
        </div>
      </div>
    </div>
  )
}
