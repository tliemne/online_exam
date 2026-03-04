import { useState, useEffect, useCallback } from 'react'
import { questionApi, courseApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  search: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  eye: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
}

const TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  TRUE_FALSE: 'Đúng / Sai',
  ESSAY: 'Tự luận',
}
const TYPE_COLORS = {
  MULTIPLE_CHOICE: 'badge-accent',
  TRUE_FALSE: 'badge-cyan',
  ESSAY: 'badge-muted',
}
const DIFF_LABELS = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
const DIFF_COLORS = { EASY: 'badge-green', MEDIUM: 'badge-amber', HARD: 'badge-red' }

// ── Modal wrapper ─────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-surface-800 border border-surface-600 rounded-2xl w-full ${maxWidth} shadow-glow-md max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Answer input row ──────────────────────────────────────
function AnswerRow({ answer, index, onChange, onRemove, canRemove }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      answer.correct ? 'border-green-accent/40 bg-green-accent/5' : 'border-surface-600 bg-surface-700'
    }`}>
      <button type="button"
        onClick={() => onChange(index, 'correct', !answer.correct)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          answer.correct ? 'bg-green-accent border-green-accent text-white' : 'border-surface-400 hover:border-green-accent'
        }`}>
        {answer.correct && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
      </button>
      <input className="input-field flex-1 py-1.5 text-sm"
        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
        value={answer.content}
        onChange={e => onChange(index, 'content', e.target.value)} />
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)}
          className="btn-ghost p-1 text-text-muted hover:text-red-accent shrink-0">
          {Icon.x}
        </button>
      )}
    </div>
  )
}

// ── Question Form Modal ───────────────────────────────────
function QuestionFormModal({ question, courses, onClose, onSaved }) {
  const defaultAnswers = [
    { content: '', correct: false },
    { content: '', correct: false },
    { content: '', correct: false },
    { content: '', correct: false },
  ]

  const [form, setForm] = useState({
    content: question?.content || '',
    type: question?.type || 'MULTIPLE_CHOICE',
    difficulty: question?.difficulty || 'MEDIUM',
    courseId: question?.courseId || (courses[0]?.id || ''),
    answers: question?.answers?.map(a => ({ content: a.content, correct: a.correct })) || defaultAnswers,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Khi đổi type → reset answers
  const handleTypeChange = (type) => {
    let answers = []
    if (type === 'MULTIPLE_CHOICE') answers = defaultAnswers
    else if (type === 'TRUE_FALSE') answers = [
      { content: 'Đúng', correct: true },
      { content: 'Sai', correct: false },
    ]
    else answers = [] // ESSAY không cần answers
    setForm(f => ({ ...f, type, answers }))
  }

  const handleAnswerChange = (index, field, value) => {
    setForm(f => {
      const answers = [...f.answers]
      // MULTIPLE_CHOICE: chỉ 1 đáp án đúng
      if (field === 'correct' && value && f.type === 'MULTIPLE_CHOICE') {
        answers.forEach((a, i) => { answers[i] = { ...a, correct: i === index } })
      } else {
        answers[index] = { ...answers[index], [field]: value }
      }
      return { ...f, answers }
    })
  }

  const addAnswer = () => {
    if (form.answers.length >= 6) return
    setForm(f => ({ ...f, answers: [...f.answers, { content: '', correct: false }] }))
  }

  const removeAnswer = (index) => {
    setForm(f => ({ ...f, answers: f.answers.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate
    if (form.type !== 'ESSAY' && !form.answers.some(a => a.correct)) {
      setError('Cần chọn ít nhất 1 đáp án đúng')
      return
    }
    if (form.type !== 'ESSAY' && form.answers.some(a => !a.content.trim())) {
      setError('Vui lòng điền đầy đủ nội dung các đáp án')
      return
    }

    setSaving(true)
    try {
      const payload = {
        content: form.content,
        type: form.type,
        difficulty: form.difficulty,
        courseId: Number(form.courseId),
        answers: form.type === 'ESSAY' ? [] : form.answers,
      }
      if (question) await questionApi.update(question.id, payload)
      else await questionApi.create(payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={question ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'} onClose={onClose}>
      {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-accent/10 border border-red-accent/30 text-red-accent text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Lớp học */}
        <div>
          <label className="label">Lớp học *</label>
          <select className="input-field" value={form.courseId}
            onChange={e => setForm({...form, courseId: e.target.value})} required>
            <option value="">-- Chọn lớp --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Loại + Độ khó */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Loại câu hỏi *</label>
            <select className="input-field" value={form.type}
              onChange={e => handleTypeChange(e.target.value)}>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>
          <div>
            <label className="label">Độ khó</label>
            <select className="input-field" value={form.difficulty}
              onChange={e => setForm({...form, difficulty: e.target.value})}>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <div>
          <label className="label">Nội dung câu hỏi *</label>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Nhập nội dung câu hỏi..."
            value={form.content}
            onChange={e => setForm({...form, content: e.target.value})} required />
        </div>

        {/* Đáp án */}
        {form.type !== 'ESSAY' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">
                Đáp án
                <span className="text-text-muted font-normal ml-2">
                  {form.type === 'MULTIPLE_CHOICE' ? '(click vòng tròn để chọn đáp án đúng)' : '(chọn đáp án đúng)'}
                </span>
              </label>
              {form.type === 'MULTIPLE_CHOICE' && form.answers.length < 6 && (
                <button type="button" onClick={addAnswer}
                  className="text-accent text-xs hover:underline flex items-center gap-1">
                  {Icon.plus} Thêm đáp án
                </button>
              )}
            </div>
            <div className="space-y-2">
              {form.answers.map((a, i) => (
                <AnswerRow key={i} answer={a} index={i}
                  onChange={handleAnswerChange}
                  onRemove={removeAnswer}
                  canRemove={form.type === 'MULTIPLE_CHOICE' && form.answers.length > 2} />
              ))}
            </div>
          </div>
        )}

        {form.type === 'ESSAY' && (
          <div className="px-4 py-3 rounded-lg bg-surface-700 border border-surface-600 text-text-muted text-sm">
            Câu tự luận — sinh viên sẽ nhập câu trả lời khi làm bài. Giáo viên chấm điểm thủ công.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : question ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Preview Modal ─────────────────────────────────────────
function PreviewModal({ question, onClose }) {
  return (
    <Modal title="Xem câu hỏi" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <span className={TYPE_COLORS[question.type]}>{TYPE_LABELS[question.type]}</span>
          <span className={DIFF_COLORS[question.difficulty]}>{DIFF_LABELS[question.difficulty]}</span>
          <span className="badge-muted text-xs">{question.courseName}</span>
        </div>
        <p className="text-text-primary leading-relaxed">{question.content}</p>
        {question.type !== 'ESSAY' && question.answers?.length > 0 && (
          <div className="space-y-2">
            {question.answers.map((a, i) => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                a.correct ? 'border-green-accent/40 bg-green-accent/5 text-green-accent' : 'border-surface-600 bg-surface-700 text-text-secondary'
              }`}>
                <span className="text-xs font-mono font-bold w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                <span className="text-sm flex-1">{a.content}</span>
                {a.correct && <span className="text-green-accent shrink-0">{Icon.check}</span>}
              </div>
            ))}
          </div>
        )}
        {question.type === 'ESSAY' && (
          <div className="p-4 rounded-lg bg-surface-700 border border-surface-600 text-text-muted text-sm italic">
            [Sinh viên nhập câu trả lời tại đây]
          </div>
        )}
        <div className="pt-2 border-t border-surface-600 text-xs text-text-muted">
          Tạo bởi: {question.createdByName || '—'}
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function QuestionsPage() {
  const { hasRole } = useAuth()
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('ADMIN')

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'preview'
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [keyword, setKeyword] = useState('')

  // Load courses
  useEffect(() => {
    courseApi.getAll().then(r => {
      const list = r.data.data || []
      setCourses(list)
      if (list.length > 0) setSelectedCourse(list[0].id)
    })
  }, [])

  // Load questions khi đổi course hoặc filter
  const loadQuestions = useCallback(() => {
    if (!selectedCourse) return
    setLoading(true)
    questionApi.getAll(selectedCourse, {
      type: filterType || undefined,
      difficulty: filterDiff || undefined,
      keyword: keyword || undefined,
    }).then(r => setQuestions(r.data.data || []))
      .finally(() => setLoading(false))
  }, [selectedCourse, filterType, filterDiff, keyword])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const handleDelete = async (q) => {
    if (!confirm(`Xóa câu hỏi này?`)) return
    setDeleting(q.id)
    try {
      await questionApi.delete(q.id)
      setQuestions(prev => prev.filter(x => x.id !== q.id))
    } finally {
      setDeleting(null)
    }
  }

  const counts = {
    all: questions.length,
    MULTIPLE_CHOICE: questions.filter(q => q.type === 'MULTIPLE_CHOICE').length,
    TRUE_FALSE: questions.filter(q => q.type === 'TRUE_FALSE').length,
    ESSAY: questions.filter(q => q.type === 'ESSAY').length,
    EASY: questions.filter(q => q.difficulty === 'EASY').length,
    MEDIUM: questions.filter(q => q.difficulty === 'MEDIUM').length,
    HARD: questions.filter(q => q.difficulty === 'HARD').length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="text-text-secondary text-sm mt-1">{questions.length} câu hỏi</p>
        </div>
        {isTeacherOrAdmin && (
          <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary flex items-center gap-2">
            {Icon.plus} Tạo câu hỏi
          </button>
        )}
      </div>

      {/* Course selector + stats */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Lớp học</label>
            <select className="input-field" value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Loại câu hỏi</label>
            <select className="input-field" value={filterType}
              onChange={e => setFilterType(e.target.value)}>
              <option value="">Tất cả loại</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label text-xs">Độ khó</label>
            <select className="input-field" value={filterDiff}
              onChange={e => setFilterDiff(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Tìm kiếm</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.search}</span>
              <input className="input-field pl-9" placeholder="Nội dung câu hỏi..."
                value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
          </div>
          <div className="pt-5">
            <button onClick={loadQuestions} className="btn-secondary">{Icon.refresh}</button>
          </div>
        </div>

        {/* Stats */}
        {questions.length > 0 && (
          <div className="flex gap-3 flex-wrap pt-1 border-t border-surface-600">
            <span className="text-xs text-text-muted">Phân bố:</span>
            {Object.entries(TYPE_LABELS).map(([k, v]) => counts[k] > 0 && (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[k]}`}>
                {v}: {counts[k]}
              </span>
            ))}
            <span className="text-text-muted text-xs">|</span>
            {Object.entries(DIFF_LABELS).map(([k, v]) => counts[k] > 0 && (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[k]}`}>
                {v}: {counts[k]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Question list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">❓</div>
          <p className="text-text-secondary">Chưa có câu hỏi nào. {isTeacherOrAdmin && 'Hãy tạo câu hỏi đầu tiên!'}</p>
          {isTeacherOrAdmin && (
            <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary mt-4">
              Tạo câu hỏi
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <div key={q.id} className="card hover:border-accent/20 transition-all">
              <div className="flex items-start gap-4">
                {/* Index */}
                <span className="text-text-muted text-sm font-mono shrink-0 mt-0.5 w-6">{index + 1}.</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs ${TYPE_COLORS[q.type]}`}>{TYPE_LABELS[q.type]}</span>
                    <span className={`text-xs ${DIFF_COLORS[q.difficulty]}`}>{DIFF_LABELS[q.difficulty]}</span>
                  </div>
                  <p className="text-text-primary text-sm leading-relaxed line-clamp-2">{q.content}</p>

                  {/* Answers preview */}
                  {q.type !== 'ESSAY' && q.answers?.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {q.answers.map((a, i) => (
                        <span key={a.id} className={`text-xs px-2 py-0.5 rounded border ${
                          a.correct
                            ? 'border-green-accent/40 bg-green-accent/10 text-green-accent'
                            : 'border-surface-600 text-text-muted'
                        }`}>
                          {String.fromCharCode(65 + i)}. {a.content.length > 20 ? a.content.slice(0, 20) + '…' : a.content}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isTeacherOrAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setSelected(q); setModal('preview') }}
                      className="btn-ghost p-1.5 text-text-muted hover:text-accent">
                      {Icon.eye}
                    </button>
                    <button onClick={() => { setSelected(q); setModal('edit') }}
                      className="btn-ghost p-1.5 text-text-muted hover:text-accent">
                      {Icon.edit}
                    </button>
                    <button onClick={() => handleDelete(q)} disabled={deleting === q.id}
                      className="btn-ghost p-1.5 text-text-muted hover:text-red-accent hover:bg-red-accent/10">
                      {deleting === q.id
                        ? <span className="w-4 h-4 border border-red-accent border-t-transparent rounded-full animate-spin block"/>
                        : Icon.trash}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <QuestionFormModal
          question={modal === 'edit' ? selected : null}
          courses={courses}
          onClose={() => setModal(null)}
          onSaved={loadQuestions}
        />
      )}
      {modal === 'preview' && selected && (
        <PreviewModal question={selected} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
