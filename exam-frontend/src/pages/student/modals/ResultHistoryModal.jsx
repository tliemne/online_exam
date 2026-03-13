import { useState, useEffect } from 'react'
import api from '../../../api/client'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  clock:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  doc:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  play:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/></svg>,
  x:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  check:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  warn:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>,
}


// ── Result History Modal ──────────────────────────────────

export default function ResultHistoryModal({ exam, onClose }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [detail, setDetail]     = useState(null)  // attempt detail

  useEffect(() => {
    api.get(`/attempts/my/exams/${exam.id}`)
      .then(r => setAttempts(r.data.data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }, [exam.id])

  const statusColor = (s) => s === 'GRADED' ? 'text-success' : 'text-warning'
  const statusLabel = (s) => s === 'GRADED' ? 'Đã chấm' : s === 'SUBMITTED' ? 'Chờ chấm' : 'Đang làm'

  if (detail) return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">Chi tiết bài làm</h3>
            <p className="text-xs text-[var(--text-3)]">{exam.title}</p>
          </div>
          <button onClick={() => setDetail(null)} className="btn-ghost p-2 text-[var(--text-3)]">{Icon.x}</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Score summary */}
          <div className="bg-[var(--bg-elevated)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-3)] mb-1">Điểm số</p>
              <p className={`text-2xl font-bold ${detail.passed ? 'text-success' : 'text-danger'}`}>
                {detail.score != null ? `${detail.score}/${detail.totalScore}` : 'Chờ chấm'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-3)] mb-1">Kết quả</p>
              <p className={`text-sm font-semibold ${detail.passed ? 'text-success' : detail.passed === false ? 'text-danger' : 'text-warning'}`}>
                {detail.passed == null ? '—' : detail.passed ? 'Đạt' : 'Chưa đạt'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-3)] mb-1">Đúng/Tổng</p>
              <p className="text-sm font-semibold text-[var(--text-1)]">{detail.correctCount ?? '?'}/{detail.totalQuestions ?? '?'}</p>
            </div>
          </div>

          {/* Answer details */}
          {(detail.answers || []).map((a, i) => (
            <div key={a.id} className={`border rounded-xl p-4 ${
              a.isCorrect === true  ? 'border-success/30 bg-success/5'
              : a.isCorrect === false ? 'border-danger/30 bg-danger/5'
              : 'border-[var(--border-base)] bg-[var(--bg-elevated)]/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-lg bg-[var(--border-base)] flex items-center justify-center text-xs font-mono font-bold text-[var(--text-3)]">{i+1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border-base)] text-[var(--text-3)]">{
                  a.questionType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm'
                  : a.questionType === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'
                }</span>
                <span className={`ml-auto text-xs font-medium ${a.isCorrect === true ? 'text-success' : a.isCorrect === false ? 'text-danger' : 'text-warning'}`}>
                  {a.isCorrect === true ? 'Đúng' : a.isCorrect === false ? 'Sai' : 'Chờ chấm'}
                  {a.score != null ? ` · ${a.score}đ` : ''}
                </span>
              </div>
              <p className="text-[var(--text-1)] text-sm mb-2">{a.questionContent}</p>
              {a.selectedAnswerContent && (
                <p className="text-xs text-[var(--text-3)]">Bạn chọn: <span className="text-[var(--text-2)]">{a.selectedAnswerContent}</span></p>
              )}
              {a.textAnswer && (
                <p className="text-xs text-[var(--text-3)]">Câu trả lời: <span className="text-[var(--text-2)]">{a.textAnswer}</span></p>
              )}
              {a.correctAnswerContent && a.isCorrect === false && (
                <p className="text-xs text-success mt-1">Đáp án đúng: {a.correctAnswerContent}</p>
              )}
              {a.teacherComment && (
                <p className="text-xs text-accent mt-1 italic">💬 GV: {a.teacherComment}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full max-w-lg shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-semibold text-[var(--text-1)]">Lịch sử bài làm</h3>
            <p className="text-xs text-[var(--text-3)]">{exam.title}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 text-[var(--text-3)]">{Icon.x}</button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : attempts.length === 0 ? (
            <p className="text-center text-[var(--text-3)] py-8">Chưa có bài làm nào</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((a, i) => (
                <div key={a.id} className="bg-[var(--bg-elevated)] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--border-base)] flex items-center justify-center text-sm font-bold text-[var(--text-3)] font-mono">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${statusColor(a.status)}`}>{statusLabel(a.status)}</span>
                      <span className="text-xs text-[var(--text-3)]">{a.submittedAt ? new Date(a.submittedAt).toLocaleString('vi-VN') : ''}</span>
                    </div>
                    <p className="text-[var(--text-1)] font-semibold text-sm">
                      {a.score != null ? `${a.score}/${a.totalScore} điểm` : 'Chờ chấm tự luận'}
                      {a.passed != null && <span className={`ml-2 text-xs ${a.passed ? 'text-success' : 'text-danger'}`}>{a.passed ? 'Đạt' : 'Chưa đạt'}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      api.get(`/attempts/${a.id}`).then(r => setDetail(r.data.data))
                    }}
                    className="btn-ghost text-xs px-3 py-1.5 text-accent border border-accent/30 rounded-lg hover:bg-accent/10">
                    Xem chi tiết
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
