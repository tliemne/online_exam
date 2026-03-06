import { useState, useEffect } from 'react'
import api from '../../api/client'

const Icon = {
  x:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  clock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
}

// ── Score ring ────────────────────────────────────────────
function ScoreRing({ score, total, size = 80 }) {
  const pct     = total > 0 ? (score / total) : 0
  const r       = (size - 10) / 2
  const circ    = 2 * Math.PI * r
  const offset  = circ * (1 - pct)
  const color   = pct >= 0.8 ? '#4ade80' : pct >= 0.5 ? '#fb923c' : '#f87171'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:'stroke-dashoffset 0.8s ease'}}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="JetBrains Mono,monospace">
        {score != null ? score : '?'}
      </text>
    </svg>
  )
}

// ── Attempt Detail Modal ──────────────────────────────────
function AttemptDetailModal({ attempt, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/attempts/${attempt.id}`)
      .then(r => setDetail(r.data.data))
      .finally(() => setLoading(false))
  }, [attempt.id])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700 shrink-0">
          <div>
            <h3 className="font-semibold text-text-primary">Chi tiết bài làm</h3>
            <p className="text-xs text-text-muted">{detail?.examTitle || attempt.examTitle}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 text-text-muted hover:text-text-primary">{Icon.x}</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Score card */}
              <div className="bg-surface-700 rounded-xl p-4 flex items-center gap-6">
                <ScoreRing score={detail.score} total={detail.totalScore} />
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Điểm</p>
                    <p className="text-text-primary font-bold">
                      {detail.score != null ? `${detail.score}/${detail.totalScore}` : 'Chờ chấm'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Kết quả</p>
                    <p className={`font-semibold text-sm ${detail.passed ? 'text-green-accent' : detail.passed === false ? 'text-red-accent' : 'text-yellow-400'}`}>
                      {detail.passed == null ? '—' : detail.passed ? '✓ Đạt' : '✗ Chưa đạt'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Đúng</p>
                    <p className="text-text-primary font-bold">{detail.correctCount ?? '?'}/{detail.totalQuestions ?? '?'}</p>
                  </div>
                </div>
              </div>

              {/* Question answers */}
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Chi tiết từng câu</p>
              {(detail.answers || []).map((a, i) => (
                <div key={a.id} className={`border rounded-xl p-4 ${
                  a.isCorrect === true  ? 'border-green-accent/30 bg-green-accent/5'
                  : a.isCorrect === false ? 'border-red-accent/30 bg-red-accent/5'
                  : 'border-yellow-400/30 bg-yellow-400/5'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-surface-600 flex items-center justify-center text-xs font-mono text-text-muted font-bold shrink-0">{i+1}</span>
                    <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-surface-600">
                      {a.questionType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : a.questionType === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'}
                    </span>
                    <span className={`ml-auto text-xs font-semibold ${
                      a.isCorrect === true ? 'text-green-accent'
                      : a.isCorrect === false ? 'text-red-accent'
                      : 'text-yellow-400'
                    }`}>
                      {a.isCorrect === true ? '✓ Đúng' : a.isCorrect === false ? '✗ Sai' : '○ Chờ chấm'}
                      {a.score != null ? ` · ${a.score}đ` : ''}
                    </span>
                  </div>
                  <p className="text-text-primary text-sm mb-2 leading-relaxed">{a.questionContent}</p>
                  {a.selectedAnswerContent && (
                    <div className="text-xs">
                      <span className="text-text-muted">Bạn chọn: </span>
                      <span className={a.isCorrect ? 'text-green-accent' : 'text-red-accent'}>{a.selectedAnswerContent}</span>
                    </div>
                  )}
                  {a.textAnswer && (
                    <div className="text-xs">
                      <span className="text-text-muted">Trả lời: </span>
                      <span className="text-text-secondary italic">"{a.textAnswer}"</span>
                    </div>
                  )}
                  {a.correctAnswerContent && a.isCorrect === false && (
                    <div className="text-xs mt-1">
                      <span className="text-text-muted">Đáp án đúng: </span>
                      <span className="text-green-accent font-medium">{a.correctAnswerContent}</span>
                    </div>
                  )}
                  {a.teacherComment && (
                    <div className="mt-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
                      <span className="text-xs text-accent">💬 Nhận xét GV: </span>
                      <span className="text-xs text-text-secondary">{a.teacherComment}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-muted py-8">Không tải được dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function StudentResultsPage() {
  const [attempts, setAttempts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [detail, setDetail]       = useState(null)
  const [filterStatus, setFilter] = useState('all')

  useEffect(() => {
    api.get('/attempts/my')
      .then(r => setAttempts(r.data.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }, [])

  const graded    = attempts.filter(a => a.status === 'GRADED')
  const pending   = attempts.filter(a => a.status === 'SUBMITTED')
  const passed    = graded.filter(a => a.passed)
  const avgScore  = graded.length > 0
    ? (graded.reduce((s, a) => s + (a.score || 0), 0) / graded.length).toFixed(1)
    : null

  const filtered = attempts.filter(a => {
    if (filterStatus === 'graded')  return a.status === 'GRADED'
    if (filterStatus === 'pending') return a.status === 'SUBMITTED'
    return true
  })

  const statusColor = (a) => {
    if (a.status === 'GRADED') return a.passed ? 'text-green-accent' : 'text-red-accent'
    return 'text-yellow-400'
  }
  const statusLabel = (a) => {
    if (a.status === 'GRADED') return a.passed ? '✓ Đạt' : '✗ Chưa đạt'
    return '○ Chờ chấm'
  }
  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
  }) : '—'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Kết quả thi</h1>
        <p className="text-text-secondary text-sm mt-1">Lịch sử và điểm số các bài thi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bài đã nộp',    value: attempts.length, color: 'text-accent' },
          { label: 'Đã chấm',       value: graded.length,   color: 'text-green-accent' },
          { label: 'Chờ chấm',      value: pending.length,  color: 'text-yellow-400' },
          { label: 'Điểm TB',       value: avgScore ?? '—', color: 'text-text-primary' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-text-muted text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[{ k: 'all', l: 'Tất cả' }, { k: 'graded', l: 'Đã chấm' }, { k: 'pending', l: 'Chờ chấm' }].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === f.k ? 'bg-accent text-white' : 'bg-surface-700 text-text-muted hover:text-text-primary border border-surface-600'
            }`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-text-secondary font-medium">
            {attempts.length === 0 ? 'Chưa có bài thi nào' : 'Không có bài trong mục này'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, idx) => (
            <div key={a.id} className="card p-0 overflow-hidden hover:border-surface-500 transition-all">
              <div className="flex items-center gap-4 p-5">
                {/* Score ring */}
                <div className="shrink-0">
                  <ScoreRing score={a.score} total={a.totalScore || 10} size={60} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-text-muted">{a.courseName}</span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className={`text-xs font-semibold ${statusColor(a)}`}>{statusLabel(a)}</span>
                  </div>
                  <p className="text-text-primary font-semibold truncate">{a.examTitle}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span>{Icon.clock} {fmtDate(a.submittedAt)}</span>
                    <span>Đúng: {a.correctCount ?? '?'}/{a.totalQuestions ?? '?'} câu</span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => setDetail(a)}
                  className="btn-ghost text-sm px-4 py-2 text-accent border border-accent/30 rounded-xl hover:bg-accent/10 shrink-0">
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <AttemptDetailModal attempt={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  )
}
