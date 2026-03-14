import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseApi } from '../../api/services'

export default function StudentCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    courseApi.getAll()
      .then(r => setCourses(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Lớp học của tôi</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">{courses.length} lớp đang tham gia</p>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-2)]">Bạn chưa tham gia lớp học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c.id}
              className="card p-5 cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => navigate(`/student/courses/${c.id}`)}>

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20
                  flex items-center justify-center text-accent font-bold text-sm shrink-0">
                  {c.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                  Đang học
                </span>
              </div>

              {/* Info */}
              <h3 className="font-semibold text-[var(--text-1)] leading-snug">{c.name}</h3>
              {c.description && (
                <p className="text-xs text-[var(--text-3)] mt-1 line-clamp-2">{c.description}</p>
              )}

              {/* Teacher */}
              {c.teacherName && (
                <p className="text-xs text-[var(--text-3)] mt-3">
                Giáo Viên: {c.teacherName}
                </p>
              )}

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-3)]">
                  {c.studentCount ?? 0} sinh viên
                </span>
                <span className="text-xs text-accent font-medium">Xem chi tiết →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
