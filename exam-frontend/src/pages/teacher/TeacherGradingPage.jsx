import { useState, useEffect } from 'react'
import { examApi } from '../../api/services'
import api from '../../api/client'

const Icon = {
  x:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  pen:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>,
  user: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
}

// ── Grade Modal ───────────────────────────────────────────
function GradeModal({ attempt, onClose, onGraded }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [grades, setGrades]   = useState({})  // answerId → { score, comment }
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get(`/attempts/${attempt.id}`)
      .then(r => {
        const d = r.data.data
        setDetail(d)
        // Init grades from existing data
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const answers = Object.entries(grades).map(([answerId, g]) => ({
        attemptAnswerId: Number(answerId),
        score: g.score !== '' ? Number(g.score) : null,
        isCorrect: g.score > 0,
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

  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">Chấm điểm bài thi</h3>
            <p className="text-xs text-[var(--text-3)]">
              {attempt.studentName} · {attempt.studentCode && `${attempt.studentCode} · `}{fmtDate(attempt.submittedAt)}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 text-[var(--text-3)]">{Icon.x}</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : detail ? (
            <>
              {/* Summary */}
              <div className="bg-[var(--bg-elevated)] rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[var(--text-3)] text-xs mb-1">Điểm hiện tại</p>
                  <p className={`text-2xl font-bold ${detail.score != null ? 'text-accent' : 'text-[var(--text-3)]'}`}>
                    {detail.score != null ? `${detail.score}/${detail.totalScore}` : 'Chưa chấm'}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-3)] text-xs mb-1">Trạng thái</p>
                  <p className={`text-sm font-semibold ${detail.status === 'GRADED' ? 'text-success' : 'text-yellow-400'}`}>
                    {detail.status === 'GRADED' ? '✓ Đã chấm' : '○ Chờ chấm'}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-3)] text-xs mb-1">Câu đúng</p>
                  <p className="text-[var(--text-1)] text-sm font-semibold">{detail.correctCount}/{detail.totalQuestions}</p>
                </div>
              </div>

              {/* Each answer */}
              {(detail.answers || []).map((a, i) => {
                const isEssay = a.questionType === 'ESSAY'
                const isAutoGraded = !isEssay
                const g = grades[a.id] || {}
                return (
                  <div key={a.id} className={`border rounded-xl p-4 ${
                    isEssay ? 'border-accent/25 bg-accent/5' : 'border-[var(--border-base)] bg-[var(--bg-elevated)]/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-[var(--border-base)] flex items-center justify-center text-xs font-mono font-bold text-[var(--text-3)]">{i+1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isEssay ? 'bg-accent/15 text-accent border border-accent/25' : 'bg-[var(--border-base)] text-[var(--text-3)]'}`}>
                        {isEssay ? '✏ Tự luận — cần chấm' : isAutoGraded ? 'Trắc nghiệm' : 'Đúng/Sai'}
                      </span>
                      {!isEssay && (
                        <span className={`ml-auto text-xs font-medium ${a.isCorrect ? 'text-success' : 'text-danger'}`}>
                          {a.isCorrect ? '✓ Đúng' : '✗ Sai'} · {a.score ?? 0}đ
                        </span>
                      )}
                    </div>

                    <p className="text-[var(--text-1)] text-sm mb-2">{a.questionContent}</p>

                    {/* Student answer */}
                    {a.selectedAnswerContent && (
                      <div className="mb-2 p-2 bg-[var(--border-base)] rounded-lg">
                        <p className="text-xs text-[var(--text-3)] mb-0.5">Đáp án chọn:</p>
                        <p className={`text-sm ${a.isCorrect ? 'text-success' : 'text-danger'}`}>{a.selectedAnswerContent}</p>
                      </div>
                    )}
                    {a.textAnswer && (
                      <div className="mb-2 p-3 bg-[var(--border-base)] rounded-lg">
                        <p className="text-xs text-[var(--text-3)] mb-1">Câu trả lời:</p>
                        <p className="text-sm text-[var(--text-1)] leading-relaxed">{a.textAnswer}</p>
                      </div>
                    )}

                    {/* Grading UI (only for essay) */}
                    {isEssay && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-3 items-center">
                          <label className="text-xs text-[var(--text-3)] w-16 shrink-0">Điểm:</label>
                          <input type="number" min="0" step="0.5"
                            value={g.score ?? ''}
                            onChange={e => setGrade(a.id, 'score', e.target.value)}
                            className="input-field py-1.5 w-24 text-sm"
                            placeholder="0.0"
                          />
                          <span className="text-xs text-[var(--text-3)]">/ {/* max score per question */}1.0đ</span>
                        </div>
                        <div className="flex gap-3 items-start">
                          <label className="text-xs text-[var(--text-3)] w-16 shrink-0 mt-2">Nhận xét:</label>
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
            <p className="text-center text-[var(--text-3)] py-8">Không tải được dữ liệu</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex justify-between shrink-0">
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
  const [exams, setExams]         = useState([])
  const [selectedExam, setSelExam]= useState(null)
  const [attempts, setAttempts]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [loadingExams, setLoadingExams] = useState(true)
  const [gradeModal, setGradeModal]= useState(null)
  const [filterStatus, setFilter] = useState('all')

  // Load danh sách đề thi
  useEffect(() => {
    examApi.getAll()
      .then(r => setExams(r.data.data || []))
      .finally(() => setLoadingExams(false))
  }, [])

  // Load bài nộp khi chọn đề
  const loadAttempts = (exam) => {
    setSelExam(exam)
    setLoading(true)
    api.get(`/attempts/exams/${exam.id}`)
      .then(r => setAttempts(r.data.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }

  const filtered = attempts.filter(a => {
    if (filterStatus === 'graded')  return a.status === 'GRADED'
    if (filterStatus === 'pending') return a.status === 'SUBMITTED'
    return true
  })

  const pendingCount = attempts.filter(a => a.status === 'SUBMITTED').length
  const gradedCount  = attempts.filter(a => a.status === 'GRADED').length

  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
    day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
  }) : '—'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Chấm điểm</h1>
        <p className="text-[var(--text-2)] text-sm mt-1">Xem danh sách bài nộp và chấm điểm tự luận</p>
      </div>

      {/* Exam selector */}
      <div className="card p-4">
        <p className="text-xs text-[var(--text-3)] uppercase tracking-wider mb-3 font-medium">Chọn đề thi</p>
        {loadingExams ? (
          <div className="h-10 flex items-center">
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {exams.map(e => (
              <button key={e.id} onClick={() => loadAttempts(e)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  selectedExam?.id === e.id
                    ? 'bg-accent text-white border-accent'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-2)] border-[var(--border-base)] hover:border-[var(--border-strong)]'
                }`}>
                {e.title}
                <span className="ml-2 text-xs opacity-70">{e.courseName}</span>
              </button>
            ))}
            {exams.length === 0 && <p className="text-[var(--text-3)] text-sm">Chưa có đề thi nào</p>}
          </div>
        )}
      </div>

      {/* Submissions */}
      {selectedExam && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: 'Tổng bài nộp', v: attempts.length, c: 'text-accent' },
              { l: 'Chờ chấm',     v: pendingCount,    c: 'text-yellow-400' },
              { l: 'Đã chấm',      v: gradedCount,     c: 'text-success' },
            ].map(s => (
              <div key={s.l} className="card text-center py-4">
                <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[var(--text-3)] text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {[{ k: 'all', l: 'Tất cả' }, { k: 'pending', l: '○ Chờ chấm' }, { k: 'graded', l: '✓ Đã chấm' }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === f.k ? 'bg-accent text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-3)] border border-[var(--border-base)]'
                }`}>
                {f.l}
                {f.k === 'pending' && pendingCount > 0 && (
                  <span className="ml-2 bg-yellow-400/20 text-yellow-400 px-1.5 rounded-full text-xs">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[var(--text-3)]">{attempts.length === 0 ? 'Chưa có sinh viên nào nộp bài' : 'Không có bài trong mục này'}</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-3)] uppercase tracking-wider">Sinh viên</th>
                    <th className="text-left px-5 py-3 text-xs text-[var(--text-3)] uppercase tracking-wider">Thời gian nộp</th>
                    <th className="text-center px-5 py-3 text-xs text-[var(--text-3)] uppercase tracking-wider">Điểm</th>
                    <th className="text-center px-5 py-3 text-xs text-[var(--text-3)] uppercase tracking-wider">Trạng thái</th>
                    <th className="text-center px-5 py-3 text-xs text-[var(--text-3)] uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, idx) => (
                    <tr key={a.id} className={`border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-elevated)]/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-[var(--bg-elevated)]/10'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                            {a.studentName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-[var(--text-1)] text-sm font-medium">{a.studentName}</p>
                            {a.studentCode && <p className="text-[var(--text-3)] text-xs font-mono">{a.studentCode}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-2)] text-sm">{fmtDate(a.submittedAt)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`font-semibold text-sm ${a.score != null ? 'text-[var(--text-1)]' : 'text-[var(--text-3)]'}`}>
                          {a.score != null ? `${a.score}/${a.totalScore}` : '—'}
                        </span>
                        {a.passed != null && (
                          <span className={`ml-2 text-xs ${a.passed ? 'text-success' : 'text-danger'}`}>
                            {a.passed ? '✓' : '✗'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          a.status === 'GRADED'
                            ? 'bg-success/10 border-success/30 text-success'
                            : 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                        }`}>
                          {a.status === 'GRADED' ? '✓ Đã chấm' : '○ Chờ chấm'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => setGradeModal(a)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                            a.status === 'SUBMITTED'
                              ? 'bg-accent text-white border-accent hover:bg-accent/90'
                              : 'text-accent border-accent/30 hover:bg-accent/10'
                          }`}>
                          {a.status === 'SUBMITTED' ? `${Icon.pen} Chấm` : 'Xem / Sửa'}
                        </button>
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
