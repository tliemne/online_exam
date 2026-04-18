import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function StudentSchedulePage() {
  const [exams, setExams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('upcoming') // upcoming | open | ended | all
  const [page, setPage]       = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 5
  const navigate = useNavigate()

  const loadExams = (pageNum = 0) => {
    setLoading(true)
    // For now, we'll load all exams and paginate on frontend
    // TODO: Add backend pagination for /exams/student
    api.get('/exams/student')
      .then(r => {
        const allExams = r.data.data || []
        // Simple frontend pagination
        const startIdx = pageNum * pageSize
        const endIdx = startIdx + pageSize
        const paginatedExams = allExams.slice(startIdx, endIdx)
        
        setExams(allExams) // Keep all for filtering
        setTotalPages(Math.ceil(allExams.length / pageSize))
        setPage(pageNum)
      })
      .catch(() => {
        setExams([])
        setTotalPages(0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadExams(0) }, [])

  const now = new Date()

  const categorize = (exam) => {
    const start = exam.startTime ? new Date(exam.startTime) : null
    const end   = exam.endTime   ? new Date(exam.endTime)   : null
    if (end && now > end) return 'ended'
    if (start && now < start) return 'upcoming'
    return 'open'
  }

  const filtered = exams.filter(e => {
    const cat = categorize(e)
    if (filter === 'all') return true
    return cat === filter
  }).sort((a, b) => {
    const ta = a.startTime ? new Date(a.startTime) : new Date(0)
    const tb = b.startTime ? new Date(b.startTime) : new Date(0)
    return ta - tb
  })

  // Apply pagination to filtered results
  const startIdx = page * pageSize
  const endIdx = startIdx + pageSize
  const paginatedFiltered = filtered.slice(startIdx, endIdx)
  const filteredTotalPages = Math.ceil(filtered.length / pageSize)

  const fmt = (dt) => dt ? new Date(dt).toLocaleString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

  const counts = {
    upcoming: exams.filter(e => categorize(e) === 'upcoming').length,
    open:     exams.filter(e => categorize(e) === 'open').length,
    ended:    exams.filter(e => categorize(e) === 'ended').length,
    all:      exams.length,
  }

  const catStyle = {
    open:     { label: 'Đang mở',    dot: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)'  },
    upcoming: { label: 'Sắp diễn ra', dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    ended:    { label: 'Đã kết thúc', dot: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' },
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Lịch thi</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Theo dõi lịch thi và đề thi sắp diễn ra</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'open',     label: 'Đang mở',      color: '#22c55e', bg: 'rgba(34,197,94,0.08)'   },
          { key: 'upcoming', label: 'Sắp diễn ra',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
          { key: 'ended',    label: 'Đã kết thúc',  color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
        ].map(item => (
          <button key={item.key} onClick={() => { setFilter(item.key); setPage(0) }}
            className="card p-4 text-center transition-all hover:scale-[1.02]"
            style={filter === item.key ? { borderColor: item.color, background: item.bg } : {}}>
            <p className="text-2xl font-bold" style={{ color: item.color }}>{counts[item.key]}</p>
            <p className="text-xs text-[var(--text-3)] mt-1">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-[var(--border-base)]">
        {[
          { key: 'upcoming', label: 'Sắp diễn ra' },
          { key: 'open',     label: 'Đang mở' },
          { key: 'ended',    label: 'Đã kết thúc' },
          { key: 'all',      label: 'Tất cả' },
        ].map(t => (
          <button key={t.key} onClick={() => { setFilter(t.key); setPage(0) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}>
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">({counts[t.key] ?? exams.length})</span>
          </button>
        ))}
      </div>

      {/* Exam list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : paginatedFiltered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-3)]">
          <p className="text-sm">Không có đề thi nào phù hợp</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedFiltered.map(exam => {
            const cat = categorize(exam)
            const style = catStyle[cat]
            const myCount  = exam.myAttemptCount ?? 0
            const maxCount = exam.maxAttempts ?? 1
            const limitHit = myCount >= maxCount
            const canTake  = cat === 'open' && !limitHit

            return (
              <div key={exam.id} className="card p-0 overflow-hidden">
                <div className="flex">
                  {/* Color bar */}
                  <div className="w-1 shrink-0" style={{ background: style.dot }}/>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: style.bg, color: style.dot, border: `1px solid ${style.border}` }}>
                            {style.label}
                          </span>
                          <span className="text-xs text-[var(--text-3)]">{exam.courseName}</span>
                        </div>
                        <h3 className="font-semibold text-[var(--text-1)] truncate">{exam.title}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-3)]">
                          <span>Bắt đầu: {fmt(exam.startTime)}</span>
                          <span>Kết thúc: {fmt(exam.endTime)}</span>
                          <span>{exam.durationMinutes} phút</span>
                          <span>{exam.questionCount ?? 0} câu</span>
                          <span>Lần thi: {myCount}/{maxCount}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {canTake && (
                          <button onClick={() => navigate('/student/exams')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90">
                            Vào thi
                          </button>
                        )}
                        {myCount > 0 && (
                          <button onClick={() => navigate('/student/results')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-base)] text-[var(--text-2)] hover:border-accent/40">
                            Xem kết quả
                          </button>
                        )}
                        <button onClick={() => navigate(`/student/exams/${exam.id}/leaderboard`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-base)] text-[var(--text-2)] hover:border-accent/40">
                          BXH
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredTotalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newPage = page - 1
                setPage(newPage)
              }}
              disabled={page === 0}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'var(--bg-elevated)', 
                color: 'var(--text-2)',
                border: '1px solid var(--border-base)'
              }}>
              ← Trước
            </button>
            
            {Array.from({ length: Math.min(5, filteredTotalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(filteredTotalPages - 5, page - 2)) + i
              if (pageNum >= filteredTotalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={pageNum === page
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border-base)' }}>
                  {pageNum + 1}
                </button>
              )
            })}
            
            <button
              onClick={() => {
                const newPage = page + 1
                setPage(newPage)
              }}
              disabled={page >= filteredTotalPages - 1}
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
    </div>
  )
}
