import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function StudentRankingsPage() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 5
  const navigate = useNavigate()

  const loadAttempts = (pageNum = 0) => {
    setLoading(true)
    // Always call with pagination parameters
    api.get(`/attempts/my?page=${pageNum}&size=${pageSize}`)
      .then(r => {
        const data = r.data.data
        if (data && typeof data === 'object' && data.content) {
          // Paginated response
          setAttempts(data.content || [])
          setTotalPages(data.totalPages || 0)
          setPage(pageNum)
        } else {
          // Legacy non-paginated response
          setAttempts(data || [])
          setTotalPages(1)
          setPage(0)
        }
      })
      .catch(() => {
        setAttempts([])
        setTotalPages(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAttempts(0) }, [])

  const graded = attempts.filter(a => a.status === 'GRADED')
  const totalExams   = graded.length
  const passedExams  = graded.filter(a => a.passed).length
  const failedExams  = totalExams - passedExams
  const avgScore     = totalExams > 0
    ? Math.round(graded.reduce((sum, a) => sum + (a.score ?? 0), 0) / totalExams * 10) / 10
    : 0
  const avgPct       = totalExams > 0
    ? Math.round(graded.reduce((sum, a) => sum + (a.totalScore > 0 ? a.score/a.totalScore*100 : 0), 0) / totalExams)
    : 0
  const bestScore    = graded.length > 0 ? Math.max(...graded.map(a => a.score ?? 0)) : 0

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }) : '—'

  const pct = (a) => a.totalScore > 0 ? Math.round(a.score / a.totalScore * 100) : 0

  const scoreColor = (p) => p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Thành tích của tôi</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Tổng hợp kết quả thi và xếp hạng</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Bài đã thi',   value: totalExams,  color: 'var(--accent)', suffix: '' },
              { label: 'Điểm TB',      value: avgScore,    color: scoreColor(avgPct), suffix: '' },
              { label: 'Tỉ lệ đậu',   value: totalExams > 0 ? Math.round(passedExams/totalExams*100) : 0, color: '#22c55e', suffix: '%' },
              { label: 'Điểm cao nhất', value: bestScore,  color: '#f59e0b', suffix: '' },
            ].map((s, i) => (
              <div key={i} className="card p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}{s.suffix}</p>
                <p className="text-xs text-[var(--text-3)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pass/Fail bar */}
          {totalExams > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-[var(--text-2)] font-medium">Kết quả tổng</span>
                <span className="text-[var(--text-3)]">{passedExams} đậu / {failedExams} rớt</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-[var(--bg-elevated)] flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${passedExams/totalExams*100}%` }}/>
                <div className="h-full bg-red-400 transition-all" style={{ width: `${failedExams/totalExams*100}%` }}/>
              </div>
            </div>
          )}

          {/* Exam history */}
          <div>
            <h2 className="font-semibold text-[var(--text-1)] mb-3">Lịch sử thi</h2>
            {graded.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-3)]">
                <p className="text-[var(--text-3)] text-sm">Chưa có bài thi nào được chấm</p>
              </div>
            ) : (
              <div className="space-y-2">
                {graded.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).map((a, idx) => {
                  const p = pct(a)
                  return (
                    <div key={a.id} className="card p-4 flex items-center gap-4">
                      {/* Rank badge */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: idx === 0 ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)',
                                 color: idx === 0 ? '#f59e0b' : 'var(--text-3)' }}>
                        {idx + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-1)] truncate">{a.examTitle}</p>
                        <p className="text-xs text-[var(--text-3)]">{a.courseName} · {fmt(a.submittedAt)}</p>
                      </div>

                      {/* Score bar */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${p}%`, background: scoreColor(p) }}/>
                        </div>
                        <p className="text-xs text-center mt-1" style={{ color: scoreColor(p) }}>{p}%</p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg" style={{ color: scoreColor(p) }}>
                          {a.score ?? 0}<span className="text-xs text-[var(--text-3)] font-normal">/{a.totalScore}</span>
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          a.passed ? 'bg-green-500/10 text-green-500' : 'bg-red-400/10 text-red-400'
                        }`}>{a.passed ? 'Đậu' : 'Rớt'}</span>
                      </div>

                      {/* BXH button */}
                   <button
                        onClick={() => navigate(`/student/exams/${a.examId}/leaderboard`)}
                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md transition btn-ghost"
                        title="Bảng xếp hạng">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M8 21V9m4 12V3m4 18v-6"/>
                        </svg>
                    </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadAttempts(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--bg-elevated)', 
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-base)'
                  }}>
                  ← Trước
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i
                  if (pageNum >= totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => loadAttempts(pageNum)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={pageNum === page
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border-base)' }}>
                      {pageNum + 1}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => loadAttempts(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--bg-elevated)', 
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-base)'
                  }}>
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
