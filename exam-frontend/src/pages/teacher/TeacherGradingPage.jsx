import { useState, useEffect } from 'react'
import { examApi } from '../../api/services'
import api from '../../api/client'

const Icon = {
  x:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  pen:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/></svg>,
  export: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>,
  ai:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
}

// ── Confidence badge ──────────────────────────────────────
function ConfBadge({ conf }) {
  const map = {
    HIGH:   { label: 'Tin cậy cao', bg: 'rgba(22,163,74,0.12)',   color: '#16a34a', border: 'rgba(22,163,74,0.3)' },
    MEDIUM: { label: 'Trung bình',  bg: 'rgba(217,119,6,0.12)',   color: '#d97706', border: 'rgba(217,119,6,0.3)' },
    LOW:    { label: 'Thấp',        bg: 'rgba(220,38,38,0.12)',   color: '#dc2626', border: 'rgba(220,38,38,0.3)' },
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
      alert('Không thể kết nối AI. Vui lòng thử lại.')
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
      alert(err?.response?.data?.message || 'Lỗi khi lưu điểm')
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
                style={{ background: 'rgba(139,92,246,0.12)', color: '#7c3aed',
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
                    style={{ color: detail.status === 'GRADED' ? '#16a34a' : '#d97706' }}>
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
                           color: '#7c3aed' }}>
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
                          ? { background: 'rgba(139,92,246,0.12)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.25)' }
                          : { background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border-base)' }}>
                        {isEssay ? '✏ Tự luận' : a.questionType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                      </span>
                      {!isEssay && (
                        <span className="ml-auto text-xs font-medium"
                          style={{ color: a.isCorrect ? '#16a34a' : '#dc2626' }}>
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
                        <p className="text-sm" style={{ color: a.isCorrect ? '#16a34a' : '#dc2626' }}>
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
                              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#7c3aed' }}>
                                {Icon.ai} Gợi ý AI
                              </div>
                              <div className="flex items-center gap-2">
                                <ConfBadge conf={suggest.confidence}/>
                                <button onClick={() => applyAiSuggest(a.id)}
                                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                                  style={{ background: '#7c3aed', color: '#fff' }}>
                                  Áp dụng
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span style={{ color: 'var(--text-2)' }}>
                                Điểm gợi ý: <b style={{ color: '#7c3aed' }}>{suggest.suggestedScore ?? '—'}</b>
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
  const [exams,         setExams]       = useState([])
  const [selectedExam,  setSelExam]     = useState(null)
  const [attempts,      setAttempts]    = useState([])
  const [loading,       setLoading]     = useState(false)
  const [loadingExams,  setLoadingExams]= useState(true)
  const [gradeModal,    setGradeModal]  = useState(null)
  const [filterStatus,  setFilter]      = useState('all')
  const [exporting,     setExporting]   = useState(false)
  const [resetting,     setResetting]   = useState(null) // attemptId đang reset

  useEffect(() => {
    examApi.getAll()
      .then(r => setExams(r.data.data || []))
      .finally(() => setLoadingExams(false))
  }, [])

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
    } catch {
      alert('Xuất Excel thất bại. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const handleReset = async (attemptId, studentName) => {
    if (!confirm(`Reset bài thi của "${studentName}"?\nSinh viên sẽ được làm lại từ đầu.`)) return
    setResetting(attemptId)
    try {
      await api.delete(`/attempts/${attemptId}/reset`)
      loadAttempts(selectedExam)
    } catch {
      alert('Reset thất bại. Vui lòng thử lại.')
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
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={selectedExam?.id === e.id
                  ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-2)',
                      border: '1px solid var(--border-base)' }}>
                {e.title}
                <span className="ml-2 text-xs opacity-60">{e.courseName}</span>
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
                { l: 'Chờ chấm',     v: pendingCount,    color: '#d97706' },
                { l: 'Đã chấm',      v: gradedCount,     color: '#16a34a' },
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
              style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a',
                       border: '1px solid rgba(22,163,74,0.3)',
                       opacity: attempts.length === 0 ? 0.5 : 1 }}>
              {exporting
                ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"/>
                : Icon.export}
              <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
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
                    {['Sinh viên', 'Thời gian nộp', 'Điểm', 'Trạng thái', 'Hành động'].map(h => (
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
                          <span className="ml-2 text-xs" style={{ color: a.passed ? '#16a34a' : '#dc2626' }}>
                            {a.passed ? '✓' : '✗'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={a.status === 'GRADED'
                            ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)' }
                            : { background: 'rgba(217,119,6,0.1)', color: '#d97706', border: '1px solid rgba(217,119,6,0.3)' }}>
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
                            onClick={() => handleReset(a.id, a.studentName)}
                            disabled={resetting === a.id}
                            title="Reset — cho sinh viên làm lại"
                            className="text-xs px-2 py-1.5 rounded-lg font-medium transition-all"
                            style={{ color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)',
                                     background: 'rgba(220,38,38,0.06)' }}>
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

      {gradeModal && (
        <GradeModal
          attempt={gradeModal}
          onClose={() => setGradeModal(null)}
          onGraded={() => loadAttempts(selectedExam)}
        />
      )}
    </div>
  )
}
