import { useState, useEffect } from 'react'
import api from '../../api/client'
import { attemptApi } from '../../api/services'

const Icon = {
  x:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  wrong:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>,
  clock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  back:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>,
  eye:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
}

// ── Score Ring ────────────────────────────────────────────
function ScoreRing({ score, total, size = 80 }) {
  const pct    = total > 0 && score != null ? score / total : 0
  const r      = (size - 10) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const color  = pct >= 0.8 ? 'var(--success)' : pct >= 0.5 ? 'var(--warning)' : 'var(--danger)'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="JetBrains Mono,monospace">
        {score != null ? score : '?'}
      </text>
    </svg>
  )
}

// ── Question type label ───────────────────────────────────
function QTypeLabel({ type }) {
  const map = { MULTIPLE_CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng/Sai', ESSAY: 'Tự luận' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-3)', border: '1px solid var(--border-base)' }}>
      {map[type] || type}
    </span>
  )
}

// ── Detail Page (replaces modal) ──────────────────────────
function AttemptDetailPage({ attempt, onBack }) {
  const [detail, setDetail]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]   = useState('all') // all | correct | wrong | pending

  useEffect(() => {
    api.get(`/attempts/${attempt.id}`)
      .then(r => setDetail(r.data.data))
      .finally(() => setLoading(false))
  }, [attempt.id])

  const answers    = detail?.answers || []
  const correct    = answers.filter(a => a.isCorrect === true)
  const wrong      = answers.filter(a => a.isCorrect === false)
  const pending    = answers.filter(a => a.isCorrect == null)
  const pct        = answers.length > 0 ? Math.round(correct.length / answers.length * 100) : 0
  const scoreColor = detail?.passed ? 'var(--success)' : detail?.passed === false ? 'var(--danger)' : 'var(--warning)'

  const filtered = answers.filter(a => {
    if (filter === 'correct') return a.isCorrect === true
    if (filter === 'wrong')   return a.isCorrect === false
    if (filter === 'pending') return a.isCorrect == null
    return true
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
        {Icon.back}
        <span>Quay lại danh sách</span>
      </button>

      {/* Header card */}
      <div className="card">
        <div className="flex items-start gap-5">
          <ScoreRing score={detail?.score} total={detail?.totalScore || 10} size={72}/>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-lg leading-tight mb-1"
              style={{ color: 'var(--text-1)' }}>
              {detail?.examTitle || attempt.examTitle}
            </h2>
            <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>{attempt.courseName}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-semibold" style={{ color: scoreColor }}>
                {detail?.passed == null ? 'Chờ chấm' : detail.passed ? '✓ Đạt' : '✗ Chưa đạt'}
              </span>
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ color: 'var(--text-2)' }}>
                {detail?.score != null ? `${detail.score} / ${detail.totalScore} điểm` : 'Chưa có điểm'}
              </span>
              {attempt.submittedAt && (
                <>
                  <span style={{ color: 'var(--text-3)' }}>·</span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                    {Icon.clock}
                    {new Date(attempt.submittedAt).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {loading ? null : (
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
              <span>Tỉ lệ đúng</span>
              <span>{correct.length}/{answers.length} câu ({pct}%)</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}/>
            </div>
          </div>
        )}
      </div>

      {/* Summary chips */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>{correct.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Đúng</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--danger)' }}>{wrong.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Sai</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--warning)' }}>{pending.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Chờ chấm</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && answers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { k: 'all',     l: `Tất cả (${answers.length})` },
            { k: 'correct', l: `Đúng (${correct.length})` },
            { k: 'wrong',   l: `Sai (${wrong.length})` },
            ...(pending.length > 0 ? [{ k: 'pending', l: `Chờ chấm (${pending.length})` }] : []),
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={filter === f.k
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-3)',
                    border: '1px solid var(--border-base)' }}>
              {f.l}
            </button>
          ))}
        </div>
      )}

      {/* Questions */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => {
            const isCorrect  = a.isCorrect === true
            const isWrong    = a.isCorrect === false
            const isPending  = a.isCorrect == null
            const borderClr  = isCorrect ? 'rgba(22,163,74,0.3)' : isWrong ? 'rgba(220,38,38,0.3)' : 'rgba(217,119,6,0.3)'
            const bgClr      = isCorrect ? 'rgba(22,163,74,0.04)' : isWrong ? 'rgba(220,38,38,0.04)' : 'rgba(217,119,6,0.04)'
            const accentClr  = isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : 'var(--warning)'
            const idx        = answers.indexOf(a)

            return (
              <div key={a.id} className="rounded-lg p-4"
                style={{ border: `1px solid ${borderClr}`, background: bgClr }}>

                {/* Question header */}
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)' }}>
                    {idx + 1}
                  </span>
                  <QTypeLabel type={a.questionType}/>
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold"
                    style={{ color: accentClr }}>
                    {isCorrect && Icon.check}
                    {isWrong  && Icon.wrong}
                    {isCorrect ? 'Đúng' : isWrong ? 'Sai' : 'Chờ chấm'}
                    {a.score != null && <span className="font-normal ml-0.5" style={{ color: 'var(--text-3)' }}>· {a.score}đ</span>}
                  </span>
                </div>

                {/* Question content */}
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-1)' }}>
                  {a.questionContent}
                </p>

                {/* Answers */}
                <div className="space-y-1.5 text-sm">
                  {a.selectedAnswerContent && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>Bạn chọn:</span>
                      <span className="font-medium" style={{ color: isCorrect ? 'var(--success)' : isWrong ? 'var(--danger)' : 'var(--text-2)' }}>
                        {a.selectedAnswerContent}
                      </span>
                    </div>
                  )}
                  {a.textAnswer && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>Trả lời:</span>
                      <span className="italic" style={{ color: 'var(--text-2)' }}>"{a.textAnswer}"</span>
                    </div>
                  )}
                  {a.correctAnswerContent && isWrong && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5 font-medium" style={{ color: 'var(--text-3)' }}>Đáp án đúng:</span>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>{a.correctAnswerContent}</span>
                    </div>
                  )}
                </div>

                {/* Teacher comment */}
                {a.teacherComment && (
                  <div className="mt-3 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: 'var(--text-2)' }}>
                    <span className="font-medium" style={{ color: 'var(--accent)' }}>Nhận xét GV: </span>
                    {a.teacherComment}
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>
              Không có câu nào trong mục này
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── AI Explain Button + Modal ─────────────────────────────
function AiExplainButton({ attemptId }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  const handleOpen = async () => {
    setOpen(true)
    if (result) return // đã cache ở frontend
    setLoading(true); setError('')
    try {
      const r = await attemptApi.aiExplain(attemptId)
      setResult(r.data.data)
    } catch {
      setError('Không thể tải giải thích. Thử lại sau.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={handleOpen}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        style={{ color: 'var(--purple)', border: '1px solid var(--purple-subtle)',
                 background: 'var(--purple-subtle)' }}>
        ✦ AI Giải thích
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-xl border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
              style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>✦ AI Giải thích câu sai</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Phân tích bởi Gemini AI</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1.5">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {loading && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--purple)' }}/>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>AI đang phân tích bài làm...</p>
                </div>
              )}

              {error && <p className="text-sm text-center py-4" style={{ color: 'var(--danger)' }}>{error}</p>}

              {result && !loading && (<>
                {/* Overall feedback */}
                {result.overallFeedback && (
                  <div className="px-4 py-3 rounded-lg text-sm"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--text-2)' }}>
                    {result.overallFeedback}
                  </div>
                )}

                {/* Weak topics */}
                {result.weakTopics?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Chủ đề cần ôn tập</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.weakTopics.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* No wrong answers */}
                {result.explanations?.length === 0 && (
                  <p className="text-center py-4 text-sm" style={{ color: 'var(--success)' }}>
                    🎉 Bạn trả lời đúng tất cả các câu!
                  </p>
                )}

                {/* Explanations */}
                {result.explanations?.map((e, i) => (
                  <div key={e.attemptAnswerId} className="rounded-lg border p-4 space-y-2"
                    style={{ borderColor: 'var(--border-base)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                      <span className="text-xs mr-2" style={{ color: 'var(--text-3)' }}>Câu {i + 1}</span>
                      {e.questionContent}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="px-2.5 py-1.5 rounded"
                        style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
                        ✗ Bạn chọn: {e.yourAnswer}
                      </div>
                      <div className="px-2.5 py-1.5 rounded"
                        style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
                        ✓ Đúng: {e.correctAnswer}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {e.explanation}
                    </p>
                    {e.tip && (
                      <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>
                        💡 {e.tip}
                      </p>
                    )}
                  </div>
                ))}
              </>)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main Results List ─────────────────────────────────────
export default function StudentResultsPage() {
  const [attempts, setAttempts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [filterStatus, setFilter] = useState('all')

  useEffect(() => {
    api.get('/attempts/my')
      .then(r => setAttempts(r.data.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }, [])

  // Nếu đang xem chi tiết → render trang detail
  if (selected) {
    return <AttemptDetailPage attempt={selected} onBack={() => setSelected(null)}/>
  }

  const graded   = attempts.filter(a => a.status === 'GRADED')
  const pending  = attempts.filter(a => a.status === 'SUBMITTED')
  const passed   = graded.filter(a => a.passed)
  const avgScore = graded.length > 0
    ? (graded.reduce((s, a) => s + (a.score || 0), 0) / graded.length).toFixed(1)
    : null

  const filtered = attempts.filter(a => {
    if (filterStatus === 'graded')  return a.status === 'GRADED'
    if (filterStatus === 'pending') return a.status === 'SUBMITTED'
    return true
  })

  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

  const statusColor = (a) =>
    a.status === 'GRADED' ? (a.passed ? 'var(--success)' : 'var(--danger)') : 'var(--warning)'
  const statusLabel = (a) =>
    a.status === 'GRADED' ? (a.passed ? 'Đạt' : 'Chưa đạt') : 'Chờ chấm'

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="page-title">Kết quả thi</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Lịch sử và điểm số các bài thi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Bài đã nộp',  value: attempts.length,         color: 'var(--accent)' },
          { label: 'Đã chấm',     value: graded.length,           color: 'var(--success)'       },
          { label: 'Chờ chấm',    value: pending.length,          color: 'var(--warning)'       },
          { label: 'Điểm TB',     value: avgScore ?? '—',         color: 'var(--text-1)' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { k: 'all',     l: `Tất cả (${attempts.length})` },
          { k: 'graded',  l: `Đã chấm (${graded.length})` },
          { k: 'pending', l: `Chờ chấm (${pending.length})` },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={filterStatus === f.k
              ? { background: 'var(--accent)', color: '#fff' }
              : { background: 'var(--bg-elevated)', color: 'var(--text-3)',
                  border: '1px solid var(--border-base)' }}>
            {f.l}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="font-medium" style={{ color: 'var(--text-2)' }}>
            {attempts.length === 0 ? 'Chưa có bài thi nào' : 'Không có bài trong mục này'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="card p-0 overflow-hidden hover:border-[var(--border-strong)] transition-all">
              <div className="flex items-center gap-4 p-5">
                <div className="shrink-0">
                  <ScoreRing score={a.score} total={a.totalScore || 10} size={60}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{a.courseName}</span>
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span className="text-xs font-semibold" style={{ color: statusColor(a) }}>
                      {statusLabel(a)}
                    </span>
                  </div>
                  <p className="font-semibold truncate" style={{ color: 'var(--text-1)' }}>{a.examTitle}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-3)' }}>
                    <span className="flex items-center gap-1">{Icon.clock}{fmtDate(a.submittedAt)}</span>
                    {a.totalQuestions > 0 && (
                      <span>Đúng: {a.correctCount ?? 0}/{a.totalQuestions} câu</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(a)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ color: 'var(--accent)', border: '1px solid var(--accent-border)',
                           background: 'var(--accent-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,110,247,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-subtle)'}>
                  {Icon.eye}
                  <span>Xem chi tiết</span>
                </button>
                {a.status === 'GRADED' && (
                  <AiExplainButton attemptId={a.id}/>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
