import { useState, useEffect } from 'react'
import api from '../../../api/client'

export default function StudentAttendanceModal({ exam, course, onClose }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!course?.id) return

    Promise.all([
      api.get(`/courses/${course.id}/students`),
      api.get(`/attempts/exams/${exam.id}`)
    ])
      .then(([studentsRes, attemptsRes]) => {
        const studentList = studentsRes.data.data || []
        const attempts = attemptsRes.data.data || []
        
        console.log('[StudentAttendance] Students:', studentList)
        console.log('[StudentAttendance] Attempts:', attempts)

        const merged = studentList.map(s => {
          const studentAttempts = attempts.filter(a => a.studentId === s.id)
          const lastAttempt = studentAttempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0]
          console.log(`[StudentAttendance] Student ${s.id} (${s.fullName}): attempts=${studentAttempts.length}, graded=${lastAttempt?.status}`)
          return {
            ...s,
            attempted: studentAttempts.length > 0,
            graded: lastAttempt?.status === 'GRADED',
            score: lastAttempt?.score,
            totalScore: lastAttempt?.totalScore,
            attemptCount: studentAttempts.length,
            lastAttempt
          }
        })

        console.log('[StudentAttendance] Merged:', merged)
        setStudents(merged)
      })
      .catch(err => {
        console.error('[StudentAttendance] Error:', err)
        setStudents([])
      })
      .finally(() => setLoading(false))
  }, [exam.id, course?.id])

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(search.toLowerCase())
  )

  const attempted = filtered.filter(s => s.attempted).length
  const notAttempted = filtered.filter(s => !s.attempted).length

  const fmtDate = d => d ? new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }) : '—'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Danh sách sinh viên</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              {exam.title} · {course.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 flex gap-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex-1 px-3 py-2 rounded-lg text-center"
            style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Tổng sinh viên</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{students.length}</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg text-center"
            style={{ background: 'rgba(34,197,94,0.1)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Đã chấm</p>
            <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
              {students.filter(s => s.graded).length}
            </p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg text-center"
            style={{ background: 'rgba(217,119,6,0.1)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Chờ chấm</p>
            <p className="text-lg font-bold" style={{ color: 'var(--warning)' }}>
              {students.filter(s => s.attempted && !s.graded).length}
            </p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-lg text-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Chưa thi</p>
            <p className="text-lg font-bold" style={{ color: 'var(--danger)' }}>
              {students.filter(s => !s.attempted).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <input type="text" placeholder="Tìm theo tên hoặc mã sinh viên..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field w-full text-sm"
          />
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-3)' }}>Không tìm thấy sinh viên</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-3)' }}>Sinh viên</th>
                  <th className="text-center px-5 py-3 text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-3)' }}>Trạng thái</th>
                  <th className="text-center px-5 py-3 text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-3)' }}>Điểm</th>
                  <th className="text-center px-5 py-3 text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-3)' }}>Lần thi</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-3)' }}>Lần cuối</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 !== 0 ? 'var(--bg-elevated)' : 'transparent'
                    }}>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-1)' }}>{s.fullName}</p>
                        {s.studentCode && <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{s.studentCode}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {s.attempted ? (
                        s.graded ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)',
                                     border: '1px solid rgba(34,197,94,0.3)' }}>
                            ✓ Đã chấm
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(217,119,6,0.12)', color: 'var(--warning)',
                                     border: '1px solid rgba(217,119,6,0.3)' }}>
                            ○ Chờ chấm
                          </span>
                        )
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)',
                                   border: '1px solid rgba(239,68,68,0.3)' }}>
                          ✗ Chưa thi
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-mono" style={{ color: 'var(--text-2)' }}>
                      {s.score != null ? `${s.score}/${s.totalScore}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center font-mono" style={{ color: 'var(--text-2)' }}>
                      {s.attemptCount || '—'}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-3)' }}>
                      {s.lastAttempt ? fmtDate(s.lastAttempt.submittedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn-secondary w-full">Đóng</button>
        </div>
      </div>
    </div>
  )
}
