import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi } from '../../api/services'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

const Icon = {
  x:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  pen:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/></svg>,
  export: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>,
  ai:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
}

// ── Confidence badge ──────────────────────────────────────
function ConfBadge({ conf }) {
  const map = {
    HIGH:   { label: 'Tin cậy cao', bg: 'rgba(22,163,74,0.12)',   color: 'var(--success)', border: 'rgba(22,163,74,0.3)' },
    MEDIUM: { label: 'Trung bình',  bg: 'rgba(217,119,6,0.12)',   color: 'var(--warning)', border: 'rgba(217,119,6,0.3)' },
    LOW:    { label: 'Thấp',        bg: 'rgba(220,38,38,0.12)',   color: 'var(--danger)', border: 'rgba(220,38,38,0.3)' },
  }
  const s = map[conf] || map.LOW
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

// ── Grade Modal ───────────────────────────────────────────
function GradeModal({ attempt, onClose, onGraded }) {
  const [detail,      setDetail]   = useState(null)
  const [loading,     setLoading]  = useState(true)
  const [grades,      setGrades]   = useState({})
  const [saving,      setSaving]   = useState(false)
  const [aiLoading,   setAiLoading]= useState(false)
  const [aiSuggests,  setAiSugg]   = useState({}) // answerId → { suggestedScore, confidence, comment }

  useEffect(() => {
    api.get(`/attempts/${attempt.id}`)
      .then(r => {
        const d = r.data.data
        setDetail(d)
        const init = {}
        ;(d.answers || []).forEach(a => {
          init[a.id] = { score: a.score ?? '', comment: a.teacherComment ?? '' }
        })
        setGrades(init)
      })
      .finally(() => setLoading(false))
  }, [attempt.id])

  const setGrade = (answerId, field, value) => {
    setGrades(p => ({ ...p, [answerId]: { ...p[answerId], [field]: value } }))
  }

  // Áp dụng gợi ý AI vào ô điểm + nhận xét
  const applyAiSuggest = (answerId) => {
    const s = aiSuggests[answerId]
    if (!s) return
    setGrades(p => ({
      ...p,
      [answerId]: {
        score:   s.suggestedScore ?? p[answerId]?.score ?? '',
        comment: s.comment || p[answerId]?.comment || '',
      }
    }))
  }

  const handleAiSuggest = async () => {
    setAiLoading(true)
    try {
      const r = await api.get(`/attempts/${attempt.id}/ai-suggest`)
      const suggestions = r.data.data || []
      const map = {}
      suggestions.forEach(s => { map[s.attemptAnswerId] = s })
      setAiSugg(map)
    } catch {
      toast.error('Không thể kết nối AI. Vui lòng thử lại.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const answers = Object.entries(grades).map(([answerId, g]) => ({
        attemptAnswerId: Number(answerId),
        score:          g.score !== '' ? Number(g.score) : null,
        isCorrect:      g.score !== '' ? Number(g.score) > 0 : null,
        teacherComment: g.comment || null,
      }))
      await api.put(`/attempts/${attempt.id}/grade`, { answers })
      onGraded()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu điểm')
    } finally {
      setSaving(false)
    }
  }

  const hasEssayUnchecked = (detail?.answers || []).some(
    a => a.questionType === 'ESSAY' && grades[a.id]?.score === ''
  )
  const fmtDate = d => d ? new Date(d).toLocaleString('vi-VN') : '—'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>Chấm điểm bài thi</h3>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              {attempt.studentName}
              {attempt.studentCode && ` · ${attempt.studentCode}`}
              {` · ${fmtDate(attempt.submittedAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Suggest button */}
            {(detail?.answers || []).some(a => a.questionType === 'ESSAY') && (
              <button onClick={handleAiSuggest} disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--purple)',
                         border: '1px solid rgba(139,92,246,0.3)' }}>
                {aiLoading
                  ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"/>
                  : Icon.ai}
                {aiLoading ? 'Đang gợi ý...' : 'AI gợi ý'}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}>{Icon.x}</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
            </div>
          ) : detail ? (
            <>
              {/* Summary */}
              <div className="rounded-xl p-4 grid grid-cols-3 gap-4 text-center"
                style={{ background: 'var(--bg-elevated)' }}>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Điểm hiện tại</p>
                  <p className="text-2xl font-bold" style={{ color: detail.score != null ? 'var(--accent)' : 'var(--text-3)' }}>
                    {detail.score != null ? `${detail.score}/${detail.totalScore}` : 'Chưa chấm'}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Trạng thái</p>
                  <p className="text-sm font-semibold"
                    style={{ color: detail.status === 'GRADED' ? 'var(--success)' : 'var(--warning)' }}>
                    {detail.status === 'GRADED' ? '✓ Đã chấm' : '○ Chờ chấm'}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Câu đúng</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                    {detail.correctCount}/{detail.totalQuestions}
                  </p>
                </div>
              </div>

              {/* AI info banner nếu có gợi ý */}
              {Object.keys(aiSuggests).length > 0 && (
                <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
                           color: 'var(--purple)' }}>
                  {Icon.ai}
                  <span>AI đã gợi ý điểm cho {Object.keys(aiSuggests).length} câu tự luận.
                    Nhấn <b>"Áp dụng"</b> để điền vào ô điểm, hoặc tự nhập tay.</span>
                </div>
              )}

              {/* Each answer */}
              {(detail.answers || []).map((a, i) => {
                const isEssay = a.questionType === 'ESSAY'
                const g       = grades[a.id] || {}
                const suggest = aiSuggests[a.id]

                return (
                  <div key={a.id} className="rounded-xl p-4"
                    style={{
                      border: `1px solid ${isEssay ? 'rgba(139,92,246,0.25)' : 'var(--border-subtle)'}`,
                      background: isEssay ? 'rgba(139,92,246,0.04)' : 'var(--bg-elevated)'
                    }}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-2)' }}>{i + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={isEssay
                          ? { background: 'rgba(139,92,246,0.12)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.25)' }
                          : { background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border-base)' }}>
                        {isEssay ? '✏ Tự luận' : a.questionType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                      </span>
                      {!isEssay && (
                        <span className="ml-auto text-xs font-medium"
                          style={{ color: a.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                          {a.isCorrect ? '✓ Đúng' : '✗ Sai'} · {a.score ?? 0}đ
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-1)' }}>
                      {a.questionContent}
                    </p>

                    {a.selectedAnswerContent && (
                      <div className="mb-2 p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Đáp án chọn:</p>
                        <p className="text-sm" style={{ color: a.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                          {a.selectedAnswerContent}
                        </p>
                      </div>
                    )}
                    {a.textAnswer && (
                      <div className="mb-2 p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Câu trả lời:</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>
                          {a.textAnswer}
                        </p>
                      </div>
                    )}

                    {/* Essay grading UI */}
                    {isEssay && (
                      <div className="mt-3 space-y-2">
                        {/* AI suggestion card */}
                        {suggest && (
                          <div className="rounded-lg p-3 mb-3"
                            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--purple)' }}>
                                {Icon.ai} Gợi ý AI
                              </div>
                              <div className="flex items-center gap-2">
                                <ConfBadge conf={suggest.confidence}/>
                                <button onClick={() => applyAiSuggest(a.id)}
                                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                                  style={{ background: 'var(--purple)', color: '#fff' }}>
                                  Áp dụng
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span style={{ color: 'var(--text-2)' }}>
                                Điểm gợi ý: <b style={{ color: 'var(--purple)' }}>{suggest.suggestedScore ?? '—'}</b>
                              </span>
                            </div>
                            {suggest.comment && (
                              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                                {suggest.comment}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3 items-center">
                          <label className="text-xs w-16 shrink-0" style={{ color: 'var(--text-3)' }}>Điểm:</label>
                          <input type="number" min="0" step="0.5"
                            value={g.score ?? ''}
                            onChange={e => setGrade(a.id, 'score', e.target.value)}
                            className="input-field py-1.5 w-24 text-sm"
                            placeholder="0.0"
                          />
                        </div>
                        <div className="flex gap-3 items-start">
                          <label className="text-xs w-16 shrink-0 mt-2" style={{ color: 'var(--text-3)' }}>Nhận xét:</label>
                          <textarea
                            value={g.comment ?? ''}
                            onChange={e => setGrade(a.id, 'comment', e.target.value)}
                            className="input-field py-1.5 text-sm resize-none flex-1"
                            rows={2}
                            placeholder="Nhận xét cho sinh viên (tuỳ chọn)..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>
              Không tải được dữ liệu
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-between shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn-secondary">Đóng</button>
          <button onClick={handleSave} disabled={saving || loading} className="btn-primary">
            {saving ? 'Đang lưu...' : '✓ Lưu điểm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function TeacherGradingPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [exams,         setExams]       = useState([])
  const [pendingCounts, setPendingCounts] = useState({}) // examId → count
  const [selectedExam,  setSelExam]     = useState(null)
  const [attempts,      setAttempts]    = useState([])
  const [loading,       setLoading]     = useState(false)
  const [loadingExams,  setLoadingExams]= useState(true)
  const [gradeModal,    setGradeModal]  = useState(null)
  const [filterStatus,  setFilter]      = useState('all')
  const [exporting,     setExporting]   = useState(false)
  const [resetting,     setResetting]   = useState(null)
  const [confirmReset,  setConfirmReset] = useState(null) // { id, studentName }

  useEffect(() => {
    examApi.getAll()
      .then(async r => {
        const list = r.data.data || []
        setExams(list)
        // Load pending count cho tất cả exam song song
        const counts = {}
        await Promise.all(list.map(e =>
          api.get(`/attempts/grading/pending/${e.id}`)
            .then(res => { counts[e.id] = res.data.data || 0 })
            .catch(() => { counts[e.id] = 0 })
        ))
        setPendingCounts(counts)
      })
      .finally(() => setLoadingExams(false))
  }, [])

  // Refresh pending count sau khi chấm xong
  const refreshPendingCount = (examId) => {
    api.get(`/attempts/grading/pending/${examId}`)
      .then(r => setPendingCounts(prev => ({ ...prev, [examId]: r.data.data || 0 })))
      .catch(() => {})
  }

  const loadAttempts = (exam) => {
    setSelExam(exam)
    setLoading(true)
    api.get(`/attempts/exams/${exam.id}`)
      .then(r => setAttempts(r.data.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }

  const handleExport = async () => {
    if (!selectedExam) return
    setExporting(true)
    try {
      const resp = await api.get(`/attempts/exams/${selectedExam.id}/export`, {
        responseType: 'blob'
      })
      const url  = URL.createObjectURL(new Blob([resp.data]))
      const link = document.createElement('a')
      link.href     = url
      link.download = `ket-qua-${selectedExam.title.replace(/\s+/g, '-')}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Xuất Excel thành công')
    } catch {
      toast.error('Xuất Excel thất bại. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const handleReset = async () => {
    if (!confirmReset) return
    const { id, studentName } = confirmReset
    setConfirmReset(null)
    setResetting(id)
    try {
      await api.delete(`/attempts/${id}/reset`)
      loadAttempts(selectedExam)
    } catch {
      toast.error('Reset thất bại. Vui lòng thử lại.')
    } finally {
      setResetting(null)
    }
  }

  const filtered     = attempts.filter(a => {
    if (filterStatus === 'graded')  return a.status === 'GRADED'
    if (filterStatus === 'pending') return a.status === 'SUBMITTED'
    return true
  })
  const pendingCount = attempts.filter(a => a.status === 'SUBMITTED').length
  const gradedCount  = attempts.filter(a => a.status === 'GRADED').length
  const fmtDate = d => d ? new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }) : '—'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Chấm điểm</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Xem danh sách bài nộp và chấm điểm tự luận</p>
      </div>

      {/* Exam selector */}
      <div className="card p-4">
        <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: 'var(--text-3)' }}>Chọn đề thi</p>
        {loadingExams ? (
          <div className="h-10 flex items-center">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {exams.map(e => (
              <button key={e.id} onClick={() => loadAttempts(e)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 w-full text-left"
                style={selectedExam?.id === e.id
                  ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-2)',
                      border: '1px solid var(--border-base)' }}>
                <span className="flex-1 truncate">
                  {e.title}
                  <span className="ml-2 text-xs opacity-60">{e.courseName}</span>
                </span>
                {pendingCounts[e.id] > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: selectedExam?.id === e.id ? 'rgba(255,255,255,0.25)' : '#f59e0b',
                      color: selectedExam?.id === e.id ? '#fff' : '#fff',
                      minWidth: '1.25rem', textAlign: 'center'
                    }}>
                    {pendingCounts[e.id]}
                  </span>
                )}
              </button>
            ))}
            {exams.length === 0 && <p className="text-sm" style={{ color: 'var(--text-3)' }}>Chưa có đề thi nào</p>}
          </div>
        )}
      </div>

      {selectedExam && (
        <>
          {/* Stats + Export */}
          <div className="flex items-start gap-4">
            <div className="grid grid-cols-3 gap-4 flex-1">
              {[
                { l: 'Tổng bài nộp', v: attempts.length, color: 'var(--accent)' },
                { l: 'Chờ chấm',     v: pendingCount,    color: 'var(--warning)' },
                { l: 'Đã chấm',      v: gradedCount,     color: 'var(--success)' },
              ].map(s => (
                <div key={s.l} className="card text-center py-4">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.v}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Export button */}
            <button onClick={handleExport} disabled={exporting || attempts.length === 0}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all self-stretch"
              style={{ background: 'var(--success-subtle)', color: 'var(--success)',
                       border: '1px solid rgba(22,163,74,0.3)',
                       opacity: attempts.length === 0 ? 0.5 : 1 }}>
              {exporting
                ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"/>
                : Icon.export}
              <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
            </button>

            {/* Stats button */}
            <button onClick={() => navigate(`/teacher/exams/${selectedExam.id}/stats`)}
              disabled={attempts.length === 0}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all self-stretch"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
                       border: '1px solid rgba(139,92,246,0.3)',
                       opacity: attempts.length === 0 ? 0.5 : 1 }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V3.375zm-9.75 9.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25"/></svg>
              <span>Thống kê</span>
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {[
              { k: 'all',     l: `Tất cả (${attempts.length})` },
              { k: 'pending', l: `○ Chờ chấm (${pendingCount})` },
              { k: 'graded',  l: `✓ Đã chấm (${gradedCount})` },
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

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }}/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text-3)' }}>
                {attempts.length === 0 ? 'Chưa có sinh viên nào nộp bài' : 'Không có bài trong mục này'}
              </p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Sinh viên', 'Thời gian nộp', 'Điểm', 'Vi phạm', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium"
                        style={{ color: 'var(--text-3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, idx) => (
                    <tr key={a.id}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 !== 0 ? 'var(--bg-elevated)' : 'transparent'
                      }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: 'rgba(79,110,247,0.15)', color: 'var(--accent)' }}>
                            {a.studentName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{a.studentName}</p>
                            {a.studentCode && <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{a.studentCode}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-2)' }}>{fmtDate(a.submittedAt)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-semibold text-sm" style={{ color: a.score != null ? 'var(--text-1)' : 'var(--text-3)' }}>
                          {a.score != null ? `${a.score}/${a.totalScore}` : '—'}
                        </span>
                        {a.passed != null && (
                          <span className="ml-2 text-xs" style={{ color: a.passed ? 'var(--success)' : 'var(--danger)' }}>
                            {a.passed ? '✓' : '✗'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {/* Vi phạm tab + số lần thi */}
                        <div className="flex flex-col items-center gap-1">
                          {(a.tabViolationCount > 0) ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: a.tabViolationCount >= 3 ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)',
                                       color: a.tabViolationCount >= 3 ? 'var(--danger)' : 'var(--warning)',
                                       border: `1px solid ${a.tabViolationCount >= 3 ? 'rgba(220,38,38,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                              ⚠ {a.tabViolationCount} lần
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={a.status === 'GRADED'
                            ? { background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.3)' }
                            : { background: 'var(--warning-subtle)', color: 'var(--warning)', border: '1px solid rgba(217,119,6,0.3)' }}>
                          {a.status === 'GRADED' ? '✓ Đã chấm' : '○ Chờ chấm'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setGradeModal(a)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                            style={a.status === 'SUBMITTED'
                              ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                              : { color: 'var(--accent)', border: '1px solid rgba(79,110,247,0.3)',
                                  background: 'rgba(79,110,247,0.08)' }}>
                            {a.status === 'SUBMITTED' ? '✏ Chấm' : 'Xem / Sửa'}
                          </button>
                          <button
                            onClick={() => setConfirmReset({ id: a.id, studentName: a.studentName })}
                            disabled={resetting === a.id}
                            title="Reset — cho sinh viên làm lại"
                            className="text-xs px-2 py-1.5 rounded-lg font-medium transition-all"
                            style={{ color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.3)',
                                     background: 'var(--danger-subtle)' }}>
                            {resetting === a.id ? '...' : '↺'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Confirm Reset Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--danger-subtle)' }}>
              <svg className="w-6 h-6" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <h3 className="text-center font-semibold mb-2" style={{ color: 'var(--text-1)' }}>
              Reset bài thi?
            </h3>
            <p className="text-center text-sm mb-1" style={{ color: 'var(--text-2)' }}>
              Bài thi của <b>{confirmReset.studentName}</b> sẽ bị xóa.
            </p>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-3)' }}>
              Sinh viên có thể làm lại từ đầu.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(null)} className="btn-secondary flex-1">
                Hủy
              </button>
              <button onClick={handleReset}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: 'var(--danger)' }}>
                Xác nhận Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {gradeModal && (
        <GradeModal
          attempt={gradeModal}
          onClose={() => setGradeModal(null)}
          onGraded={() => { loadAttempts(selectedExam); refreshPendingCount(selectedExam.id) }}
        />
      )}
    </div>
  )
}
