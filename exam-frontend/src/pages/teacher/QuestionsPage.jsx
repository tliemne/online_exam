import { useState, useEffect, useCallback } from 'react'
import { questionApi, courseApi, tagApi } from '../../api/services'
import Pagination from '../../components/common/Pagination'
import { useAuth } from '../../context/AuthContext'
import ImportQuestionsModal from '../../components/teacher/questions/ImportQuestionsModal'
import QuestionFormModal from '../../components/teacher/questions/QuestionFormModal'
import QuestionPreviewModal from '../../components/teacher/questions/QuestionPreviewModal'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/common/ConfirmDialog'

const TYPE_LABELS = { MULTIPLE_CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng / Sai', ESSAY: 'Tự luận' }
const TYPE_COLORS = { MULTIPLE_CHOICE: 'badge-blue', TRUE_FALSE: 'badge-cyan', ESSAY: 'badge-neutral' }
const DIFF_LABELS = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
const DIFF_COLORS = { EASY: 'badge-green', MEDIUM: 'badge-amber', HARD: 'badge-red' }

const Icon = {
  plus:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>,
  trash:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  eye:     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  search:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  upload:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>,
  tag:     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z"/></svg>,
}

function QuestionCard({ question, globalIndex, isTeacherOrAdmin, onPreview, onEdit, onDelete, deleting }) {
  return (
    <div className="card hover:border-accent/20 transition-all">
      <div className="flex items-start gap-4">
        <span className="text-[var(--text-3)] text-sm font-mono shrink-0 mt-0.5 w-6">{globalIndex}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs ${TYPE_COLORS[question.type]}`}>{TYPE_LABELS[question.type]}</span>
            <span className={`text-xs ${DIFF_COLORS[question.difficulty]}`}>{DIFF_LABELS[question.difficulty]}</span>
          </div>
          <p className="text-[var(--text-1)] text-sm leading-relaxed line-clamp-2">{question.content}</p>
          {question.type !== 'ESSAY' && question.answers?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {question.answers.map((a, i) => (
                <span key={a.id} className={`text-xs px-2 py-0.5 rounded border ${
                  a.correct ? 'border-success/40 bg-success/10 text-success' : 'border-[var(--border-base)] text-[var(--text-3)]'
                }`}>
                  {String.fromCharCode(65+i)}. {a.content.length > 20 ? a.content.slice(0,20)+'…' : a.content}
                </span>
              ))}
            </div>
          )}
          {question.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {question.tags.map(t => (
                <span key={t.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: t.color || '#6b7280' }}>
                  {Icon.tag} {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onPreview(question)} className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-accent">{Icon.eye}</button>
            <button onClick={() => onEdit(question)}    className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-accent">{Icon.edit}</button>
            <button onClick={() => onDelete(question)}  disabled={deleting === question.id}
              className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-danger hover:bg-danger/10">
              {deleting === question.id
                ? <span className="w-4 h-4 border border-danger border-t-transparent rounded-full animate-spin block"/>
                : Icon.trash}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuestionsPage() {
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const { hasRole } = useAuth()
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('ADMIN')

  const [courses, setCourses]   = useState([])
  const [tags, setTags]         = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]   = useState(false)

  const [selectedCourse, setSelectedCourse] = useState('')
  const [filterType, setFilterType]         = useState('')
  const [filterDiff, setFilterDiff]         = useState('')
  const [filterTag, setFilterTag]           = useState('')
  const [keyword, setKeyword]               = useState('')

  const [page, setPage]                   = useState(0)
  const [pageSize]                        = useState(20)
  const [totalPages, setTotalPages]       = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    courseApi.getAll().then(r => {
      const list = r.data.data || []
      setCourses(list)
      if (list.length > 0) setSelectedCourse(list[0].id)
    })
    tagApi.getAll().then(r => setTags(r.data.data || [])).catch(() => {})
  }, [])

  const loadQuestions = useCallback(() => {
    if (!selectedCourse) return
    setLoading(true)
    questionApi.getAll(selectedCourse, {
      type:       filterType || undefined,
      difficulty: filterDiff || undefined,
      keyword:    keyword    || undefined,
      tagId:      filterTag  || undefined,
      paged: true, page, size: pageSize,
    }).then(r => {
      const data = r.data.data
      if (data?.content) {
        setQuestions(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } else {
        setQuestions(data || [])
      }
    }).finally(() => setLoading(false))
  }, [selectedCourse, filterType, filterDiff, filterTag, keyword, page, pageSize])

  useEffect(() => { setPage(0) }, [selectedCourse, filterType, filterDiff, filterTag, keyword])
  useEffect(() => { loadQuestions() }, [loadQuestions])

  const handleDelete = async (q) => {
    if (!(await confirmDialog({ title: 'Xóa câu hỏi này?', message: 'Câu hỏi sẽ bị xóa khỏi tất cả đề thi.', danger: true, confirmLabel: 'Xóa' }))) return
    setDeleting(q.id)
    try {
      await questionApi.delete(q.id)
      loadQuestions()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa câu hỏi')
    } finally { setDeleting(null) }
  }

  const hasActiveFilter = filterType || filterDiff || filterTag || keyword
  const activeTagInfo   = filterTag ? tags.find(t => t.id == filterTag) : null

  const counts = {
    MULTIPLE_CHOICE: questions.filter(q => q.type === 'MULTIPLE_CHOICE').length,
    TRUE_FALSE:      questions.filter(q => q.type === 'TRUE_FALSE').length,
    ESSAY:           questions.filter(q => q.type === 'ESSAY').length,
    EASY:   questions.filter(q => q.difficulty === 'EASY').length,
    MEDIUM: questions.filter(q => q.difficulty === 'MEDIUM').length,
    HARD:   questions.filter(q => q.difficulty === 'HARD').length,
  }

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="text-[var(--text-2)] text-sm mt-1 flex items-center gap-2">
            {totalElements || questions.length} câu hỏi
            {activeTagInfo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: activeTagInfo.color || '#6b7280' }}>
                {Icon.tag} {activeTagInfo.name}
              </span>
            )}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
              {Icon.upload} Import file
            </button>
            <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary flex items-center gap-2">
              {Icon.plus} Tạo câu hỏi
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-44">
            <label className="label text-xs">Lớp học</label>
            <select className="input-field" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label text-xs">Loại câu hỏi</label>
            <select className="input-field" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tất cả loại</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
              <option value="ESSAY">Tự luận</option>
            </select>
          </div>
          <div className="flex-1 min-w-32">
            <label className="label text-xs">Độ khó</label>
            <select className="input-field" value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label text-xs flex items-center gap-1">{Icon.tag} Tag</label>
            <select className="input-field" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
              <option value="">Tất cả tag</option>
              {tags.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.questionCount ?? 0})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-44">
            <label className="label text-xs">Tìm kiếm</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
              <input className="input-field pl-9" placeholder="Nội dung câu hỏi..."
                value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
          </div>
          <div className="pt-5 flex items-center gap-2">
            <button onClick={loadQuestions} className="btn-secondary">{Icon.refresh}</button>
            {hasActiveFilter && (
              <button onClick={() => { setFilterType(''); setFilterDiff(''); setFilterTag(''); setKeyword('') }}
                className="text-xs text-[var(--text-3)] hover:text-danger px-2 py-1">
                Xóa filter
              </button>
            )}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="flex gap-3 flex-wrap pt-1 border-t border-[var(--border-base)]">
            <span className="text-xs text-[var(--text-3)]">Phân bố:</span>
            {Object.entries(TYPE_LABELS).map(([k, v]) => counts[k] > 0 && (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[k]}`}>{v}: {counts[k]}</span>
            ))}
            <span className="text-[var(--text-3)] text-xs">|</span>
            {Object.entries(DIFF_LABELS).map(([k, v]) => counts[k] > 0 && (
              <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[k]}`}>{v}: {counts[k]}</span>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-2)]">
            {hasActiveFilter ? 'Không tìm thấy câu hỏi nào phù hợp.' : `Chưa có câu hỏi nào.${isTeacherOrAdmin ? ' Hãy tạo hoặc import câu hỏi!' : ''}`}
          </p>
          {isTeacherOrAdmin && !hasActiveFilter && (
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => setShowImport(true)} className="btn-secondary">{Icon.upload} Import file</button>
              <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary">{Icon.plus} Tạo câu hỏi</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              globalIndex={page * pageSize + index + 1}
              isTeacherOrAdmin={isTeacherOrAdmin}
              onPreview={q => { setSelected(q); setModal('preview') }}
              onEdit={q    => { setSelected(q); setModal('edit') }}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} size={pageSize} onPageChange={setPage} />
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
        <QuestionPreviewModal question={selected} onClose={() => setModal(null)} />
      )}
      {showImport && selectedCourse && (
        <ImportQuestionsModal courseId={selectedCourse} onClose={() => setShowImport(false)} onImported={loadQuestions} />
      )}
    </div>
    </>
  )
}
