// ── QuestionPreviewModal ──────────────────────────────────

const TYPE_LABELS = { MULTIPLE_CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng / Sai', ESSAY: 'Tự luận' }
const TYPE_COLORS = { MULTIPLE_CHOICE: 'badge-blue', TRUE_FALSE: 'badge-cyan', ESSAY: 'badge-neutral' }
const DIFF_LABELS = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
const DIFF_COLORS = { EASY: 'badge-green', MEDIUM: 'badge-amber', HARD: 'badge-red' }

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/>
  </svg>
)

const TagIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z"/>
  </svg>
)

export default function QuestionPreviewModal({ question, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-lg shadow-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <h2 className="section-title">Xem câu hỏi</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <span className={TYPE_COLORS[question.type]}>{TYPE_LABELS[question.type]}</span>
            <span className={DIFF_COLORS[question.difficulty]}>{DIFF_LABELS[question.difficulty]}</span>
            <span className="badge-neutral text-xs">{question.courseName}</span>
          </div>

          {/* Content */}
          <p className="text-[var(--text-1)] leading-relaxed">{question.content}</p>

          {/* Answers */}
          {question.type !== 'ESSAY' && question.answers?.length > 0 && (
            <div className="space-y-2">
              {question.answers.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  a.correct ? 'border-success/40 bg-success/5 text-success' : 'border-[var(--border-base)] bg-[var(--bg-elevated)] text-[var(--text-2)]'
                }`}>
                  <span className="text-xs font-mono font-bold w-5 shrink-0">{String.fromCharCode(65+i)}.</span>
                  <span className="text-sm flex-1">{a.content}</span>
                  {a.correct && <CheckIcon />}
                </div>
              ))}
            </div>
          )}

          {question.type === 'ESSAY' && (
            <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-3)] text-sm italic">
              [Sinh viên nhập câu trả lời tại đây]
            </div>
          )}

          {/* Tags */}
          {question.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map(t => (
                <span key={t.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: t.color || '#6b7280' }}>
                  <TagIcon /> {t.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer info */}
          <div className="pt-2 border-t border-[var(--border-base)] text-xs text-[var(--text-3)]">
            Tạo bởi: {question.createdByName || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
