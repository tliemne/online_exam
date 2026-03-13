import { useState, useEffect } from 'react'
import { examApi, questionApi, tagApi } from '../../../api/services'
import api from '../../../api/client'
import { useToast } from '../../../context/ToastContext'

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

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl w-full shadow-modal animate-slide-up flex flex-col max-h-[90vh] ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

export default function AddQuestionsModal({ exam, onClose, onSaved }) {
  const toast = useToast()
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState(new Set((exam.questions || []).map(q => q.questionId || q.id)))
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [filterTag, setFilterTag] = useState('ALL')
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    tagApi.getAll().then(r => setTags(r.data.data || [])).catch(() => {})
  }, [])

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
    const matchType   = filterType === 'ALL' || q.type === filterType
    const matchTag    = filterTag === 'ALL' || (q.tags || []).some(t => String(t.id) === filterTag)
    return matchSearch && matchFilter && matchType && matchTag
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
          const { default: api } = await import('../../../api/client')
          await api.post(`/exams/${exam.id}/questions`, items)
        }
      }

      // Xóa câu hỏi bỏ tick
      for (const qId of toRemove) {
        if (typeof examApi.removeQuestion === 'function') {
          await examApi.removeQuestion(exam.id, qId)
        } else {
          const { default: api } = await import('../../../api/client')
          await api.delete(`/exams/${exam.id}/questions/${qId}`)
        }
      }

      onSaved(); onClose()
    } catch (err) {
      console.error('Save questions error:', err)
      toast.error(err?.message || err?.response?.data?.message || 'Có lỗi khi lưu câu hỏi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Chọn câu hỏi cho đề thi" onClose={onClose} wide>
      <div className="p-7 space-y-5">
        {/* Toolbar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
            <input className="input-field pl-9" placeholder="Tìm câu hỏi..." value={search}
              onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <select className="input-field w-36" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="ALL">Tất cả loại</option>
            <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
            <option value="TRUE_FALSE">Đúng / Sai</option>
            <option value="ESSAY">Tự luận</option>
          </select>
          <select className="input-field w-32" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">Tất cả độ khó</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
          <select className="input-field w-36" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
            <option value="ALL">Tất cả tag</option>
            {tags.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-3)]">{filtered.length} câu hỏi</span>
          <span className="text-accent font-medium">Đã chọn: {selected.size}</span>
        </div>

        {/* Question list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-3)] text-sm">
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
                    : 'border-[var(--border-base)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                }`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  selected.has(q.id) ? 'bg-accent border-accent' : 'border-[var(--border-strong)]'
                }`}>
                  {selected.has(q.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-1)] text-sm line-clamp-2">{i + 1}. {q.content}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                    <span className="text-xs text-[var(--text-3)]">{TYPE_META[q.type] || q.type}</span>
                    {q.difficulty && (
                      <span className={`text-xs ${DIFF_META[q.difficulty]?.cls || 'badge-neutral'}`}>
                        {DIFF_META[q.difficulty]?.label || q.difficulty}
                      </span>
                    )}
                    {(q.tags || []).map(t => (
                      <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: (t.color || '#6b7280') + '22', color: t.color || '#6b7280' }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 px-7 py-4 border-t border-[var(--border-base)]">
          <button onClick={handleSave} disabled={saving || selected.size === 0} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : `Lưu ${selected.size} câu hỏi`}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        </div>
      </div>
    </Modal>
  )
}
