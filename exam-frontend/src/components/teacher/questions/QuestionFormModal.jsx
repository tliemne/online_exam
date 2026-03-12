import { useState, useEffect } from 'react'
import { questionApi, tagApi } from '../../../api/services'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  plus: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  tag: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z"/></svg>,
}

// ── AnswerRow ─────────────────────────────────────────────
function AnswerRow({ answer, index, onChange, onRemove, canRemove }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      answer.correct ? 'border-success/40 bg-success/5' : 'border-[var(--border-base)] bg-[var(--bg-elevated)]'
    }`}>
      <button type="button"
        onClick={() => onChange(index, 'correct', !answer.correct)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          answer.correct ? 'bg-success border-success text-white' : 'border-[var(--border-strong)] hover:border-success'
        }`}>
        {answer.correct && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
      </button>
      <input className="input-field flex-1 py-1.5 text-sm"
        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
        value={answer.content}
        onChange={e => onChange(index, 'content', e.target.value)} />
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)} className="btn-ghost p-1 text-[var(--text-3)] hover:text-danger shrink-0">
          {Icon.x}
        </button>
      )}
    </div>
  )
}

// ── TagPicker ─────────────────────────────────────────────
function TagPicker({ selectedIds, onChange }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tagApi.getAll()
      .then(r => setTags(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id))
    else onChange([...selectedIds, id])
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-[var(--text-3)] text-xs">
      <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>
      Đang tải tags...
    </div>
  )

  if (tags.length === 0) return (
    <p className="text-[var(--text-3)] text-xs italic">Chưa có tag nào. Tạo tag tại trang Quản lý Tags.</p>
  )

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(t => {
        const active = selectedIds.includes(t.id)
        return (
          <button key={t.id} type="button" onClick={() => toggle(t.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              active
                ? 'border-transparent text-white shadow-sm'
                : 'border-[var(--border-base)] bg-[var(--bg-elevated)] text-[var(--text-2)] hover:border-[var(--border-strong)]'
            }`}
            style={active ? { backgroundColor: t.color || '#6b7280', borderColor: t.color || '#6b7280' } : {}}>
            {Icon.tag}
            {t.name}
            {active && (
              <svg className="w-3 h-3 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── QuestionFormModal ─────────────────────────────────────
export default function QuestionFormModal({ question, courses, onClose, onSaved }) {
  const defaultAnswers = [
    { content: '', correct: false }, { content: '', correct: false },
    { content: '', correct: false }, { content: '', correct: false },
  ]

  const [form, setForm] = useState({
    content: question?.content || '',
    type: question?.type || 'MULTIPLE_CHOICE',
    difficulty: question?.difficulty || 'MEDIUM',
    courseId: question?.courseId || (courses[0]?.id || ''),
    answers: question?.answers?.map(a => ({ content: a.content, correct: a.correct })) || defaultAnswers,
    tagIds: question?.tags?.map(t => t.id) || [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleTypeChange = (type) => {
    let answers = []
    if (type === 'MULTIPLE_CHOICE') answers = defaultAnswers
    else if (type === 'TRUE_FALSE') answers = [{ content: 'Đúng', correct: true }, { content: 'Sai', correct: false }]
    setForm(f => ({ ...f, type, answers }))
  }

  const handleAnswerChange = (index, field, value) => {
    setForm(f => {
      const answers = [...f.answers]
      if (field === 'correct' && value && f.type === 'MULTIPLE_CHOICE') {
        answers.forEach((_, i) => { answers[i] = { ...answers[i], correct: i === index } })
      } else {
        answers[index] = { ...answers[index], [field]: value }
      }
      return { ...f, answers }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.type !== 'ESSAY' && !form.answers.some(a => a.correct)) { setError('Cần chọn ít nhất 1 đáp án đúng'); return }
    if (form.type !== 'ESSAY' && form.answers.some(a => !a.content.trim())) { setError('Vui lòng điền đầy đủ nội dung các đáp án'); return }
    setSaving(true)
    try {
      const payload = {
        content: form.content,
        type: form.type,
        difficulty: form.difficulty,
        courseId: Number(form.courseId),
        answers: form.type === 'ESSAY' ? [] : form.answers,
        tagIds: form.tagIds,
      }
      if (question) await questionApi.update(question.id, payload)
      else await questionApi.create(payload)
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-2xl shadow-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <h2 className="section-title">{question ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Course */}
            <div>
              <label className="input-label">Lớp học *</label>
              <select className="input-field" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} required>
                <option value="">-- Chọn lớp --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Type + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Loại câu hỏi *</label>
                <select className="input-field" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                  <option value="TRUE_FALSE">Đúng / Sai</option>
                  <option value="ESSAY">Tự luận</option>
                </select>
              </div>
              <div>
                <label className="input-label">Độ khó</label>
                <select className="input-field" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="input-label">Nội dung câu hỏi *</label>
              <textarea className="input-field resize-none" rows={3} placeholder="Nhập nội dung câu hỏi..."
                value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
            </div>

            {/* Answers */}
            {form.type !== 'ESSAY' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Đáp án
                    <span className="text-[var(--text-3)] font-normal ml-2 normal-case tracking-normal">
                      {form.type === 'MULTIPLE_CHOICE' ? '(click vòng tròn để chọn đáp án đúng)' : ''}
                    </span>
                  </label>
                  {form.type === 'MULTIPLE_CHOICE' && form.answers.length < 6 && (
                    <button type="button" onClick={() => setForm(f => ({...f, answers: [...f.answers, {content:'',correct:false}]}))}
                      className="text-accent text-xs hover:underline flex items-center gap-1">
                      {Icon.plus} Thêm đáp án
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {form.answers.map((a, i) => (
                    <AnswerRow key={i} answer={a} index={i}
                      onChange={handleAnswerChange}
                      onRemove={(idx) => setForm(f => ({...f, answers: f.answers.filter((_,j) => j !== idx)}))}
                      canRemove={form.type === 'MULTIPLE_CHOICE' && form.answers.length > 2} />
                  ))}
                </div>
              </div>
            )}

            {form.type === 'ESSAY' && (
              <div className="px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-3)] text-sm">
                Câu tự luận — sinh viên sẽ nhập câu trả lời khi làm bài. Giáo viên chấm điểm thủ công.
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="input-label flex items-center gap-1.5">
                {Icon.tag} Tags
                <span className="text-[var(--text-3)] font-normal">(tuỳ chọn)</span>
              </label>
              <div className="mt-2 p-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-elevated)] min-h-[48px]">
                <TagPicker selectedIds={form.tagIds} onChange={ids => setForm(f => ({...f, tagIds: ids}))} />
              </div>
              {form.tagIds.length > 0 && (
                <p className="text-xs text-[var(--text-3)] mt-1.5">Đã chọn {form.tagIds.length} tag</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Đang lưu...' : question ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
