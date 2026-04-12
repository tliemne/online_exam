import { useState, useEffect } from 'react'
import api from '../../../api/client'

export default function PreviewExamModal({ exam, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    setLoading(true)

    api
      .get(`/exams/${exam.id}`, {
        params: { includeQuestions: true, hideCorrect: true },
      })
      .then((r) => {
        setQuestions(r.data.data?.questions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [exam.id])

  const q = questions[current]
  const total = questions.length

  const fmt = (dt) => (dt ? new Date(dt).toLocaleString('vi-VN') : '—')

  const TYPE_LABELS = {
    MULTIPLE_CHOICE: 'Trắc nghiệm',
    TRUE_FALSE: 'Đúng / Sai',
    ESSAY: 'Tự luận',
  }

  const DIFF_LABELS = {
    EASY: 'Dễ',
    MEDIUM: 'Trung bình',
    HARD: 'Khó',
  }

  const DIFF_COLORS = {
    EASY: 'text-green-500',
    MEDIUM: 'text-yellow-500',
    HARD: 'text-red-500',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
    >
      <div className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col" style={{ background:"var(--bg-surface,#18181b)", border:"1px solid var(--border-strong,#3f3f46)" }}>

        {/* HEADER */}
        <div className="modal-header">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/30 font-medium">
                Xem trước
              </span>
              <span className="text-xs text-[var(--text-3)]">
                {exam.courseName}
              </span>
            </div>

            <h2 className="font-semibold text-[var(--text-1)] truncate">
              {exam.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="ml-4 btn-ghost p-1.5 text-[var(--text-3)]"
          >
            ✕
          </button>
        </div>

        {/* INFO BAR */}
        <div className="flex items-center gap-4 px-6 py-2.5 text-xs text-[var(--text-3)] flex-wrap" style={{ background:"var(--bg-elevated,#27272a)", borderBottom:"1px solid var(--border-base,#3f3f46)" }}>

          <span>{exam.duration ?? exam.durationMinutes} phút</span>
          <span>·</span>

          <span>{total} câu hỏi</span>

          {exam.passingScore && (
            <>
              <span>·</span>
              <span>Điểm qua: {exam.passingScore}</span>
            </>
          )}

          {exam.startTime && (
            <>
              <span>·</span>
              <span>Mở: {fmt(exam.startTime)}</span>
            </>
          )}

          {exam.endTime && (
            <>
              <span>·</span>
              <span>Đóng: {fmt(exam.endTime)}</span>
            </>
          )}

          <span className="ml-auto text-sky-500 font-medium">
            Chế độ xem trước — không ghi điểm
          </span>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : total === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-3)]">
            Đề thi chưa có câu hỏi.
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">

            {/* SIDEBAR */}
            <div className="w-44 border-r border-[var(--border-base)] overflow-y-auto p-3 space-y-1">
              <p className="text-xs text-[var(--text-3)] mb-2">Danh sách câu</p>

              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    i === current
                      ? 'bg-accent text-white'
                      : 'hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  Câu {i + 1}
                </button>
              ))}
            </div>

            {/* QUESTION AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* META */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 border rounded text-[var(--text-3)]">
                  {TYPE_LABELS[q.type]}
                </span>

                <span className={`text-xs ${DIFF_COLORS[q.difficulty]}`}>
                  {DIFF_LABELS[q.difficulty]}
                </span>

                {q.score && (
                  <span className="ml-auto text-xs text-[var(--text-3)]">
                    {q.score} điểm
                  </span>
                )}
              </div>

              {/* CONTENT */}
              <div className="text-[var(--text-1)] font-medium">
                <span className="text-[var(--text-3)] mr-2">
                  Câu {current + 1}.
                </span>
                {q.content}
              </div>

              {/* ANSWERS */}
              {q.type === 'ESSAY' ? (
                <textarea
                  className="w-full input-field min-h-[120px]"
                  placeholder="Nhập câu trả lời..."
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  }
                />
              ) : (
                <div className="space-y-2">
                  {q.answers?.map((ans, i) => {
                    const selected = answers[q.id] === ans.id
                    const label = String.fromCharCode(65 + i)

                    return (
                      <button
                        key={ans.id}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [q.id]: ans.id }))
                        }
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border ${
                          selected
                            ? 'border-[var(--accent)] bg-[var(--accent-subtle)] shadow-sm'
                            : 'border-[var(--border-base)]'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-full border flex items-center justify-center text-xs">
                          {label}
                        </span>

                        {ans.content}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* TAGS */}
              {q.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {q.tags.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        background: (t.color || '#6b7280') + '20',
                        color: t.color || '#6b7280',
                        borderColor: (t.color || '#6b7280') + '50',
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop:"1px solid var(--border-base,#3f3f46)" }}>

            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-secondary text-sm"
            >
              Câu trước
            </button>

            <span className="text-sm text-[var(--text-3)]">
              {current + 1} / {total}
            </span>

            <button
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={current === total - 1}
              className="btn-secondary text-sm"
            >
              Câu tiếp
            </button>

          </div>
        )}
      </div>
    </div>
  )
}