import DateTimePicker from '../../components/common/DateTimePicker'
import { useState, useEffect, useCallback } from 'react'
import { examApi, courseApi, questionApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  plus:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>,
  trash:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  search:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  x:       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  eye:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  send:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>,
  clock:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  check:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  list:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>,
  warn:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>,
}

// ── Helpers ───────────────────────────────────────────────
const STATUS_META = {
  DRAFT:     { label: 'Nháp',       cls: 'badge-neutral',  dot: 'bg-text-muted' },
  PUBLISHED: { label: 'Đã xuất bản', cls: 'badge-green',  dot: 'bg-success' },
  CLOSED:    { label: 'Đã đóng',    cls: 'badge-red',    dot: 'bg-danger' },
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}/>
      {m.label}
    </span>
  )
}

// ── Modal wrapper ─────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-surface-800 border border-surface-600 rounded-xl w-full shadow-modal animate-slide-up flex flex-col max-h-[90vh] ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ── Exam Form Modal ───────────────────────────────────────
function ExamFormModal({ exam, courses, onClose, onSaved }) {
  const emptyForm = {
    title: '',
    description: '',
    courseId: '',
    duration: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    showResult: true,
    startTime: '',
    endTime: '',
  }

  const [form, setForm] = useState(exam ? {
    title: exam.title || '',
    description: exam.description || '',
    courseId: exam.courseId || '',
    duration: exam.duration || 60,
    maxAttempts: exam.maxAttempts || 1,
    shuffleQuestions: exam.shuffleQuestions ?? false,
    showResult: exam.showResult ?? true,
    startTime: exam.startTime ? exam.startTime.slice(0, 16) : '',
    endTime: exam.endTime ? exam.endTime.slice(0, 16) : '',
  } : emptyForm)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const fb = (k) => () => setForm({ ...form, [k]: !form[k] })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        courseId: Number(form.courseId),
        durationMinutes: Number(form.duration),
        duration: Number(form.duration),
        maxAttempts: Number(form.maxAttempts),
        randomizeQuestions: form.shuffleQuestions,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
      }
      if (exam) await examApi.update(exam.id, payload)
      else await examApi.create(payload)
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={exam ? 'Sửa đề thi' : 'Tạo đề thi mới'} onClose={onClose} wide>
      {error && (
        <div className="mx-7 mt-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="p-7 space-y-5">
        {/* Tên đề thi */}
        <div>
          <label className="input-label">Tên đề thi <span className="text-danger">*</span></label>
          <input className="input-field" placeholder="Kiểm tra giữa kỳ..." value={form.title}
            onChange={f('title')} required autoFocus />
        </div>

        {/* Mô tả */}
        <div>
          <label className="input-label">Mô tả</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Ghi chú cho sinh viên..."
            value={form.description} onChange={f('description')} />
        </div>

        {/* Lớp học */}
        <div>
          <label className="input-label">Lớp học <span className="text-danger">*</span></label>
          <select className="input-field" value={form.courseId} onChange={f('courseId')} required>
            <option value="">-- Chọn lớp --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Thời gian làm bài + Số lần thi */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Thời gian (phút) <span className="text-danger">*</span></label>
            <input className="input-field" type="number" min={1} max={300}
              value={form.duration} onChange={f('duration')} required />
          </div>
          <div>
            <label className="input-label">Số lần thi tối đa</label>
            <input className="input-field" type="number" min={1} max={10}
              value={form.maxAttempts} onChange={f('maxAttempts')} />
          </div>
        </div>

        {/* Thời gian mở / đóng */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <DateTimePicker label="Mở thi từ" value={form.startTime} onChange={f('startTime')} />
          </div>
          <div>
          <DateTimePicker label="Đóng thi lúc" value={form.endTime} onChange={f('endTime')} />
          </div>
        </div>

        {/* Tùy chọn */}
        <div className="flex flex-col gap-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={fb('shuffleQuestions')}
              className={`w-9 h-5 rounded-full transition-colors relative ${form.shuffleQuestions ? 'bg-accent' : 'bg-surface-600'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.shuffleQuestions ? 'left-4.5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Xáo trộn thứ tự câu hỏi</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={fb('showResult')}
              className={`w-9 h-5 rounded-full transition-colors relative ${form.showResult ? 'bg-accent' : 'bg-surface-600'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.showResult ? 'left-4.5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Hiển thị kết quả sau khi nộp</span>
          </label>
        </div>

        <div className="flex gap-3 px-7 py-4 border-t border-surface-600">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : exam ? 'Lưu thay đổi' : 'Tạo đề thi'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Questions Modal ───────────────────────────────────
function AddQuestionsModal({ exam, onClose, onSaved }) {
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState(new Set((exam.questions || []).map(q => q.questionId || q.id)))
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!exam.courseId) {
      console.warn('exam.courseId is null, cannot load questions', exam)
      setLoading(false)
      return
    }
    questionApi.getAll(exam.courseId, {})
      .then(r => setQuestions(r.data.data || []))
      .catch((err) => {
        console.error('Load questions error:', err?.response?.status, err?.response?.data)
        setQuestions([])
      })
      .finally(() => setLoading(false))
  }, [exam.courseId])

  const toggle = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const DIFF_META = {
    EASY:   { label: 'Dễ',    cls: 'badge-green' },
    MEDIUM: { label: 'TB',    cls: 'badge-blue' },
    HARD:   { label: 'Khó',   cls: 'badge-red' },
  }
  const TYPE_META = {
    MULTIPLE_CHOICE: 'Trắc nghiệm',
    TRUE_FALSE:      'Đúng/Sai',
    ESSAY:           'Tự luận',
  }

  const filtered = questions.filter(q => {
    const matchSearch = q.content?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || q.difficulty === filter
    return matchSearch && matchFilter
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // Lấy câu hỏi hiện có trong đề (từ exam.questions)
      const currentIds = new Set((exam.questions || []).map(q => q.questionId || q.id))
      
      // Câu hỏi cần thêm mới
      const toAdd = [...selected].filter(id => !currentIds.has(id))
      // Câu hỏi cần xóa (bỏ tick)  
      const toRemove = [...currentIds].filter(id => !selected.has(id))

      // Thêm câu hỏi mới — dùng POST /exams/{id}/questions
      if (toAdd.length > 0) {
        const items = toAdd.map((qId, i) => ({ questionId: qId, score: 1.0, orderIndex: i + 1 }))
        // Gọi trực tiếp axios nếu examApi.addQuestions chưa có
        if (typeof examApi.addQuestions === 'function') {
          await examApi.addQuestions(exam.id, items)
        } else {
          const { default: api } = await import('../../api/client')
          await api.post(`/exams/${exam.id}/questions`, items)
        }
      }

      // Xóa câu hỏi bỏ tick
      for (const qId of toRemove) {
        if (typeof examApi.removeQuestion === 'function') {
          await examApi.removeQuestion(exam.id, qId)
        } else {
          const { default: api } = await import('../../api/client')
          await api.delete(`/exams/${exam.id}/questions/${qId}`)
        }
      }

      onSaved(); onClose()
    } catch (err) {
      console.error('Save questions error:', err)
      alert(err?.message || err?.response?.data?.message || 'Có lỗi khi lưu câu hỏi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Chọn câu hỏi cho đề thi" onClose={onClose} wide>
      <div className="p-7 space-y-5">
        {/* Toolbar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.search}</span>
            <input className="input-field pl-9" placeholder="Tìm câu hỏi..." value={search}
              onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <select className="input-field w-32" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">Tất cả</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{filtered.length} câu hỏi</span>
          <span className="text-accent font-medium">Đã chọn: {selected.size}</span>
        </div>

        {/* Question list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">
              {questions.length === 0
                ? 'Lớp này chưa có câu hỏi nào. Hãy thêm câu hỏi trong Ngân hàng đề.'
                : 'Không tìm thấy câu hỏi phù hợp'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filtered.map((q, i) => (
              <div key={q.id}
                onClick={() => toggle(q.id)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selected.has(q.id)
                    ? 'border-accent bg-accent/8'
                    : 'border-surface-600 bg-surface-700 hover:border-surface-500'
                }`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  selected.has(q.id) ? 'bg-accent border-accent' : 'border-surface-400'
                }`}>
                  {selected.has(q.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm line-clamp-2">{i + 1}. {q.content}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-xs text-text-muted">{TYPE_META[q.type] || q.type}</span>
                    {q.difficulty && (
                      <span className={`text-xs ${DIFF_META[q.difficulty]?.cls || 'badge-neutral'}`}>
                        {DIFF_META[q.difficulty]?.label || q.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 px-7 py-4 border-t border-surface-600">
          <button onClick={handleSave} disabled={saving || selected.size === 0} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : `Lưu ${selected.size} câu hỏi`}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Exam Card ─────────────────────────────────────────────
function ExamCard({ exam, onEdit, onDelete, onPublish, onClose, onManageQuestions }) {
  const statusMeta = STATUS_META[exam.status] || STATUS_META.DRAFT
  const isDraft = exam.status === 'DRAFT'
  const isPublished = exam.status === 'PUBLISHED'

  return (
    <div className="card flex flex-col gap-5 hover:border-surface-500 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={exam.status} />
            {exam.courseName && (
              <span className="text-xs text-text-muted truncate">· {exam.courseName}</span>
            )}
          </div>
          <h3 className="font-display font-semibold text-text-primary truncate">{exam.title}</h3>
          {exam.description && (
            <p className="text-text-muted text-xs mt-1 line-clamp-2">{exam.description}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <span className="text-accent font-semibold text-sm">
            {exam.title?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-700 rounded-lg px-3 py-2 text-center">
          <div className="text-text-primary font-semibold text-sm">{exam.duration ?? '—'}</div>
          <div className="text-text-muted text-xs mt-0.5">phút</div>
        </div>
        <div className="bg-surface-700 rounded-lg px-3 py-2 text-center">
          <div className="text-text-primary font-semibold text-sm">{exam.questionCount ?? 0}</div>
          <div className="text-text-muted text-xs mt-0.5">câu hỏi</div>
        </div>
        <div className="bg-surface-700 rounded-lg px-3 py-2 text-center">
          <div className="text-text-primary font-semibold text-sm">{exam.maxAttempts ?? 1}</div>
          <div className="text-text-muted text-xs mt-0.5">lần thi</div>
        </div>
      </div>

      {/* Thời gian */}
      {(exam.startTime || exam.endTime) && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          {Icon.clock}
          <span>
            {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : '—'}
            {' → '}
            {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN') : '—'}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-surface-600">
        {/* Quản lý câu hỏi */}
        <button onClick={() => onManageQuestions(exam)}
          className="btn-ghost flex-1 text-xs py-1.5 gap-1.5">
          {Icon.list} <span>Câu hỏi</span>
          {exam.questionCount > 0 && (
            <span className="ml-auto bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-full">{exam.questionCount}</span>
          )}
        </button>

        {/* Close button — chỉ hiện khi PUBLISHED */}
        {isPublished && (
          <button onClick={() => onClose(exam)}
            className="btn-ghost p-1.5 text-text-muted hover:text-yellow-400" title="Đóng đề thi">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
          </button>
        )}

        {/* Publish button — hiện khi DRAFT hoặc CLOSED */}
        {(isDraft || exam.status === 'CLOSED') && (
        <button onClick={() => onPublish(exam)}
            title={exam.status === 'CLOSED' ? 'Mở lại đề thi' : 'Xuất bản đề thi'}
            className="btn-ghost px-2.5 py-1.5 text-success hover:bg-success/10">
            {Icon.send}
        </button>
        )}
        {isPublished && (
          <span className="flex items-center px-2.5 py-1.5 text-success text-xs">
            {Icon.check}
          </span>
        )}

        <button onClick={() => onEdit(exam)}
          className="btn-ghost px-2.5 py-1.5 text-text-secondary hover:text-accent">
          {Icon.edit}
        </button>
        <button onClick={() => onDelete(exam)}
          className="btn-ghost px-2.5 py-1.5 text-text-secondary hover:text-danger hover:bg-danger/10">
          {Icon.trash}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function ExamsPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterCourse, setFilterCourse] = useState('ALL')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'questions'
  const [selected, setSelected] = useState(null)
  const [backendReady, setBackendReady] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    // Load courses luôn (đã có backend)
    courseApi.getAll()
      .then(r => setCourses(r.data.data || []))
      .catch(() => setCourses([]))

    // Load exams — backend có thể chưa xong
    examApi.getAll()
      .then(r => {
        const raw = r.data.data || r.data || []
        // Map backend fields → frontend fields
        const mapped = raw.map(e => ({
          ...e,
          duration: e.durationMinutes ?? e.duration,
          shuffleQuestions: e.randomizeQuestions ?? e.shuffleQuestions,
        }))
        setExams(mapped)
        setBackendReady(true)
      })
      .catch(() => {
        setBackendReady(false)
        setExams([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (exam) => {
    const now = new Date()
    const end = exam.endTime ? new Date(exam.endTime) : null
    const isLive = exam.status === 'PUBLISHED' && (!end || now <= end)

    if (isLive) {
      alert('Đề đang mở — không thể xóa. Hãy đóng đề trước hoặc chờ hết thời gian.')
      return
    }
    if (!confirm(`Xóa đề thi "${exam.title}"? Hành động này không thể hoàn tác.`)) return
    try {
      await examApi.delete(exam.id)
      setExams(prev => prev.filter(e => e.id !== exam.id))
    } catch (err) {
      const msg = err?.response?.data?.message || ''
      alert(msg || 'Không thể xóa đề thi này')
    }
  }

  const handleClose = async (exam) => {
    if (!confirm(`Đóng đề thi "${exam.title}"? Sinh viên sẽ không thể làm bài nữa.`)) return
    try {
      await examApi.close(exam.id)
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'CLOSED' } : e))
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể đóng đề thi')
    }
  }

  const handlePublish = async (exam) => {
    if (!confirm(`Xuất bản đề thi "${exam.title}"? Sinh viên sẽ thấy và có thể làm bài.`)) return
    try {
      await examApi.publish(exam.id)
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'PUBLISHED' } : e))
    } catch {
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'PUBLISHED' } : e))
    }
  }

  // Filter
  const filtered = exams.filter(e => {
    const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.courseName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus
    const matchCourse = filterCourse === 'ALL' || String(e.courseId) === filterCourse
    return matchSearch && matchStatus && matchCourse
  })

  // Stats
  const stats = {
    total: exams.length,
    published: exams.filter(e => e.status === 'PUBLISHED').length,
    draft: exams.filter(e => e.status === 'DRAFT').length,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Đề thi</h1>
          <p className="text-text-secondary text-sm mt-1">{exams.length} đề thi trong hệ thống</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary">
          {Icon.plus} Tạo đề thi
        </button>
      </div>

      {/* Backend warning */}
      {!backendReady && (
        <div className="flex items-start gap-3 px-5 py-3.5 rounded-xl bg-warning/10 border border-warning/20">
          <span className="text-warning shrink-0 mt-0.5">{Icon.warn}</span>
          <p className="text-warning text-sm">
            <span className="font-semibold">Backend Exam chưa sẵn sàng</span> — đang hiển thị dữ liệu mẫu.
            Khi backend hoàn thiện, dữ liệu thật sẽ tự động hiển thị.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng đề thi', value: stats.total, color: 'text-accent' },
          { label: 'Đã xuất bản', value: stats.published, color: 'text-success' },
          { label: 'Đang soạn', value: stats.draft, color: 'text-text-muted' },
        ].map(s => (
          <div key={s.label} className="card-bare py-5 px-4 text-center">
            <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-text-muted text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.search}</span>
          <input className="input-field pl-9" placeholder="Tìm đề thi..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="input-field w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="CLOSED">Đã đóng</option>
        </select>

        {courses.length > 0 && (
          <select className="input-field w-44" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="ALL">Tất cả lớp</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        <button onClick={load} className="btn-secondary">{Icon.refresh}</button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          
          <p className="text-text-secondary">
            {exams.length === 0 ? 'Chưa có đề thi nào. Hãy tạo đề thi đầu tiên!' : 'Không tìm thấy đề thi phù hợp'}
          </p>
          {exams.length === 0 && (
            <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary mt-4">
              Tạo đề thi
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exam => (
            <ExamCard key={exam.id} exam={exam}
              onEdit={(e) => { setSelected(e); setModal('edit') }}
              onDelete={handleDelete}
              onClose={handleClose}
              onPublish={handlePublish}
              onManageQuestions={async (e) => {
                try {
                  const r = await examApi.getById(e.id, true)
                  setSelected(r.data.data || e)
                } catch {
                  setSelected(e)
                }
                setModal('questions')
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <ExamFormModal
          exam={modal === 'edit' ? selected : null}
          courses={courses}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal === 'questions' && selected && (
        <AddQuestionsModal
          exam={selected}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
