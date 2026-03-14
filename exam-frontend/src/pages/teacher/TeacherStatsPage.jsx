import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi, courseApi } from '../../api/services'

export default function TeacherStatsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      examApi.getAll(),
      courseApi.getAll(),
    ]).then(([examsRes, coursesRes]) => {
      const exams   = examsRes.data.data   || []
      const courses = coursesRes.data.data || []

      const published = exams.filter(e => e.status === 'PUBLISHED')
      const draft     = exams.filter(e => e.status === 'DRAFT')
      const closed    = exams.filter(e => e.status === 'CLOSED')

      setData({ exams, courses, published, draft, closed })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  const { exams, courses, published, draft, closed } = data

  const statCards = [
    { label: 'Tổng đề thi',   value: exams.length,     color: 'var(--accent)' },
    { label: 'Đang mở',       value: published.length, color: '#22c55e' },
    { label: 'Bản nháp',      value: draft.length,     color: '#f59e0b' },
    { label: 'Đã đóng',       value: closed.length,    color: '#6b7280' },
    { label: 'Lớp học',       value: courses.length,   color: '#8b5cf6' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Thống kê</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Tổng quan hoạt động giảng dạy</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[var(--text-3)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exam list with quick stats */}
      <div>
        <h2 className="font-semibold text-[var(--text-1)] mb-3">Đề thi gần đây</h2>
        <div className="space-y-2">
          {exams.slice(0, 10).map(exam => {
            const statusMap = {
              PUBLISHED: { label: 'Đang mở',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
              DRAFT:     { label: 'Nháp',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
              CLOSED:    { label: 'Đã đóng',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
            }
            const s = statusMap[exam.status] || statusMap.DRAFT
            return (
              <div key={exam.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-1)] truncate">{exam.title}</p>
                  <p className="text-xs text-[var(--text-3)]">{exam.courseName} · {exam.questionCount ?? 0} câu · {exam.durationMinutes} phút</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
                  style={{ background: s.bg, color: s.color }}>
                  {s.label}
                </span>
                <button onClick={() => navigate(`/teacher/exams/${exam.id}/stats`)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs border border-[var(--border-base)] text-[var(--text-2)] hover:border-accent/40 transition-colors">
                  Thống kê
                </button>
              </div>
            )
          })}
        </div>
        {exams.length > 10 && (
          <p className="text-center text-xs text-[var(--text-3)] mt-3">
            và {exams.length - 10} đề thi khác...
            <button onClick={() => navigate('/teacher/exams')} className="ml-1 text-accent hover:underline">Xem tất cả</button>
          </p>
        )}
      </div>

      {/* Courses */}
      <div>
        <h2 className="font-semibold text-[var(--text-1)] mb-3">Lớp học ({courses.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {courses.map(c => (
            <div key={c.id} className="card p-4 cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => navigate(`/teacher/courses/${c.id}`)}>
              <p className="font-medium text-[var(--text-1)] truncate">{c.name}</p>
              <p className="text-xs text-[var(--text-3)] mt-1">{c.studentCount ?? 0} sinh viên</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
