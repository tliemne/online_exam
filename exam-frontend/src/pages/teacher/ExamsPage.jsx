import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { examApi, courseApi } from '../../api/services'
import api from '../../api/client'
import { useTranslation } from 'react-i18next'

import ExamFormModal from './modals/ExamFormModal'
import AddQuestionsModal from './modals/AddQuestionsModal'
import PreviewExamModal from './modals/PreviewExamModal'
import StudentAttendanceModal from './modals/StudentAttendanceModal'
import ExamCard from './components/ExamCard'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/common/ConfirmDialog'

// ── Icons ───────────────────────────
const Icon = {
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"/>
    </svg>
  ),
  back: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
    </svg>
  ),
  warn: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378"/>
    </svg>
  ),
}

export default function ExamsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()

  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedCourseId, setSelectedCourseId] = useState(null)

  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAiExam, setShowAiExam] = useState(false)

  const [previewExam, setPreviewExam] = useState(null)
  const [attendanceModal, setAttendanceModal] = useState(null)
  const [backendReady, setBackendReady] = useState(true)

  const load = useCallback(() => {
    setLoading(true)

    courseApi.getAll()
      .then(r => setCourses(r.data.data || []))
      .catch(() => setCourses([]))

    examApi.getAll()
      .then(r => {
        const raw = r.data.data || r.data || []
        const mapped = raw.map(e => ({
          ...e,
          duration: e.durationMinutes ?? e.duration,
          shuffleQuestions: e.randomizeQuestions ?? e.shuffleQuestions,
          allowResume: e.allowResume ?? true,
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

  const handleStats = (exam) => navigate(`/teacher/exams/${exam.id}/stats`)

  const handleDelete = async (exam) => {
    const now = new Date()
    const end = exam.endTime ? new Date(exam.endTime) : null
    const isLive = exam.status === 'PUBLISHED' && (!end || now <= end)

    if (isLive) {
      toast.warning(t('exam.cannotDeleteLive'))
      return
    }

    if (!(await confirmDialog({ title: `${t('exam.deleteConfirm')} "${exam.title}"?`, message: t('messages.confirmDelete'), danger: true, confirmLabel: t('common.delete') }))) return

    try {
      await examApi.delete(exam.id)
      setExams(prev => prev.filter(e => e.id !== exam.id))
    } catch (err) {
      toast.error(err?.response?.data?.message || t('messages.deleteFailed'))
    }
  }

  const handleClose = async (exam) => {
    if (!(await confirmDialog({ title: `${t('exam.closeConfirm')} "${exam.title}"?`, message: t('exam.closeMessage'), danger: false, confirmLabel: t('exam.close') }))) return

    try {
      await examApi.close(exam.id)
      setExams(prev =>
        prev.map(e => e.id === exam.id ? { ...e, status: 'CLOSED' } : e)
      )
    } catch (err) {
      toast.error(err?.response?.data?.message || t('exam.cannotClose'))
    }
  }

  const handlePublish = async (exam) => {
    if (!(await confirmDialog({ title: `${t('exam.publishConfirm')} "${exam.title}"?`, message: t('exam.publishMessage'), danger: false, confirmLabel: t('exam.publish') }))) return
    try {
      await examApi.publish(exam.id)
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'PUBLISHED' } : e))
      toast.success(`${t('exam.published')} "${exam.title}"`)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('exam.cannotPublish'))
    }
  }

  // ========== FILTER LOGIC ==========
  const filtered = exams.filter(e => {
    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.courseName?.toLowerCase().includes(search.toLowerCase())

    const matchStatus =
      filterStatus === 'ALL' || e.status === filterStatus

    const matchCourse =
      selectedCourseId ? String(e.courseId) === String(selectedCourseId) : true

    return matchSearch && matchStatus && matchCourse
  })

  const stats = {
    total: exams.length,
    published: exams.filter(e => e.status === 'PUBLISHED').length,
    draft: exams.filter(e => e.status === 'DRAFT').length,
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId)

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('exam.title')}</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {selectedCourse 
              ? `${filtered.length} ${t('exam.examsInCourse')} ${selectedCourse.name}`
              : `${exams.length} ${t('exam.totalExams')}`
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiExam(true)}
            className="btn-secondary flex items-center gap-2"
            style={{ color: 'var(--purple)', borderColor: 'var(--purple-subtle)' }}>
            ✦ {t('exam.aiGenerate')}
          </button>
          <button
            onClick={() => { setSelected(null); setModal('create') }}
            className="btn-primary"
          >
            {Icon.plus} {t('exam.createExam')}
          </button>
        </div>
      </div>

      {/* Warning */}
      {!backendReady && (
        <div className="flex items-start gap-3 px-5 py-3.5 rounded-xl bg-warning/10 border border-warning/20">
          <span className="text-warning">{Icon.warn}</span>
          <p className="text-warning text-sm">{t('exam.backendNotReady')}</p>
        </div>
      )}

      {/* Stats */}
      {!selectedCourseId && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card-bare py-5 text-center">
            <div className="text-2xl font-bold text-accent">{stats.total}</div>
            <div className="text-xs text-[var(--text-3)]">{t('exam.totalExamsLabel')}</div>
          </div>
          <div className="card-bare py-5 text-center">
            <div className="text-2xl font-bold text-success">{stats.published}</div>
            <div className="text-xs text-[var(--text-3)]">{t('exam.publishedLabel')}</div>
          </div>
          <div className="card-bare py-5 text-center">
            <div className="text-2xl font-bold">{stats.draft}</div>
            <div className="text-xs text-[var(--text-3)]">{t('exam.draftLabel')}</div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : !selectedCourseId ? (
        // ========== DANH SÁCH LỚP ==========
        <div>
          <h2 className="text-base font-semibold text-[var(--text-1)] mb-4">{t('exam.selectCourse')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => {
              const courseExamCount = exams.filter(e => e.courseId === course.id).length
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className="card p-4 hover:shadow-md transition-all text-left"
                >
                  <h3 className="font-semibold text-[var(--text-1)] line-clamp-2">{course.name}</h3>
                  <p className="text-sm text-[var(--text-3)] mt-2 line-clamp-2">
                    {course.description || t('exam.noDescription')}
                  </p>
                  <div className="mt-3 pt-3 border-t border-[var(--border-base)]">
                    <span className="text-xs font-medium text-[var(--accent)]">
                      {courseExamCount} {t('exam.title').toLowerCase()}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        // ========== DANH SÁCH ĐỀ CỦA LỚP ==========
        <div className="space-y-4">
          {/* Nút quay lại */}
          <button
            onClick={() => {
              setSelectedCourseId(null)
              setSearch('')
              setFilterStatus('ALL')
            }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {Icon.back} {t('common.back')}
          </button>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
                {Icon.search}
              </span>
              <input
                className="input-field pl-9"
                placeholder={t('exam.searchExam')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="input-field w-40"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t('exam.allStatus')}</option>
              <option value="DRAFT">{t('exam.draft')}</option>
              <option value="PUBLISHED">{t('exam.published')}</option>
              <option value="CLOSED">{t('exam.closed')}</option>
            </select>

            <button onClick={load} className="btn-secondary">
              {Icon.refresh}
            </button>
          </div>

          {/* Danh sách đề */}
          {filtered.length === 0 ? (
            <div className="card text-center py-12 text-[var(--text-3)]">
              {t('exam.noExamsInCourse')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onPreview={(e) => setPreviewExam(e)}
                  onEdit={(e) => { setSelected(e); setModal('edit') }}
                  onDelete={handleDelete}
                  onClose={handleClose}
                  onPublish={handlePublish}
                  onStats={handleStats}
                  onViewAttendance={(e) => {
                    const course = courses.find(c => c.id === e.courseId)
                    setAttendanceModal({ exam: e, course })
                  }}
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

      {previewExam && (
        <PreviewExamModal
          exam={previewExam}
          onClose={() => setPreviewExam(null)}
        />
      )}

      {attendanceModal && (
        <StudentAttendanceModal
          exam={attendanceModal.exam}
          course={attendanceModal.course}
          onClose={() => setAttendanceModal(null)}
        />
      )}

      {showAiExam && (
        <AiExamModal
          courses={courses}
          onClose={() => setShowAiExam(false)}
          onCreated={() => { setShowAiExam(false); load(); }}
        />
      )}

    </div>
    </>
  )
}

// ── AI Exam Generator Modal ────────────────────────────────
function AiExamModal({ courses, onClose, onCreated }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    courseId: courses[0]?.id || '',
    durationMinutes: 45,
    totalScore: 10,
    passScore: 5,
  })
  const [topics, setTopics] = useState([
    { topic: '', difficulty: 'MEDIUM', count: 5, type: 'MULTIPLE_CHOICE' }
  ])
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  const addTopic = () => setTopics(p => [...p, { topic: '', difficulty: 'MEDIUM', count: 5, type: 'MULTIPLE_CHOICE' }])
  const removeTopic = (i) => setTopics(p => p.filter((_, idx) => idx !== i))
  const updateTopic = (i, key, val) => setTopics(p => p.map((t, idx) => idx === i ? {...t, [key]: val} : t))

  const totalQuestions = topics.reduce((s, t) => s + +t.count, 0)

  const handleGenerate = async () => {
    if (!form.courseId) return setError(t('exam.selectCourseError'))
    if (topics.some(t => !t.topic.trim())) return setError(t('exam.enterAllTopics'))
    setStep(2); setError('')
    try {
      const r = await api.post('/exams/ai-generate', {
        ...form,
        topics: topics.map(t => ({...t, count: +t.count}))
      })
      setResult(r.data.data)
      setStep(3)
    } catch (e) {
      setError(e?.response?.data?.message || t('exam.aiGenerateError'))
      setStep(1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>

        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>✦ {t('exam.aiModalTitle')}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {t('exam.aiModalSubtitle')}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {step === 2 && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--purple)' }}/>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t('exam.aiGenerating')}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {t('exam.aiGeneratingDetail', { count: totalQuestions, topics: topics.length })}
              </p>
            </div>
          )}

          {step === 3 && result && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg text-center"
                style={{ background: 'var(--success-subtle)' }}>
                <p className="font-semibold" style={{ color: 'var(--success)' }}>{t('exam.aiSuccess')}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                  {t('exam.aiSuccessDetail', { count: result.totalSaved, title: result.exam?.title })}
                </p>
              </div>
              {result.errors?.length > 0 && (
                <div className="space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs" style={{ color: 'var(--warning)' }}>{e}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => onCreated(result.exam)} className="btn-primary flex-1">
                  {t('exam.viewExamList')}
                </button>
                <button onClick={onClose} className="btn-secondary">{t('common.close')}</button>
              </div>
            </div>
          )}

          {step === 1 && (<>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="input-label">{t('exam.examTitle')}</label>
                <input className="input-field" placeholder={t('exam.examTitlePlaceholder')}
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
              </div>
              <div>
                <label className="input-label">{t('exam.courseRequired')}</label>
                <select className="input-field" value={form.courseId}
                  onChange={e => setForm({...form, courseId: e.target.value})}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">{t('exam.durationMinutes')}</label>
                <input type="number" className="input-field" min={10}
                  value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: +e.target.value})}/>
              </div>
              <div>
                <label className="input-label">{t('exam.totalScore')}</label>
                <input type="number" className="input-field" min={1}
                  value={form.totalScore} onChange={e => setForm({...form, totalScore: +e.target.value})}/>
              </div>
              <div>
                <label className="input-label">{t('exam.passScore')}</label>
                <input type="number" className="input-field" min={1}
                  value={form.passScore} onChange={e => setForm({...form, passScore: +e.target.value})}/>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                  {t('exam.topicsLabel', { count: totalQuestions })}
                </p>
                <button onClick={addTopic} className="btn-ghost text-xs px-2 py-1">{t('exam.addTopic')}</button>
              </div>
              <div className="space-y-2">
                {topics.map((topic, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input className="input-field col-span-4 text-sm" placeholder={t('exam.topicPlaceholder')}
                      value={topic.topic} onChange={e => updateTopic(i, 'topic', e.target.value)}/>
                    <select className="input-field col-span-3 text-sm" value={topic.type}
                      onChange={e => updateTopic(i, 'type', e.target.value)}>
                      <option value="MULTIPLE_CHOICE">{t('question.multipleChoice')}</option>
                      <option value="TRUE_FALSE">{t('question.trueOrFalse')}</option>
                      <option value="ESSAY">{t('question.essay')}</option>
                    </select>
                    <select className="input-field col-span-2 text-sm" value={topic.difficulty}
                      onChange={e => updateTopic(i, 'difficulty', e.target.value)}>
                      <option value="EASY">{t('question.easy')}</option>
                      <option value="MEDIUM">{t('question.medium')}</option>
                      <option value="HARD">{t('question.hard')}</option>
                      <option value="ALL">{t('exam.allStatus')}</option>
                    </select>
                    <input type="number" className="input-field col-span-2 text-sm" min={1} placeholder={t('exam.questionCountLabel')}
                      value={topic.count} onChange={e => updateTopic(i, 'count', e.target.value)}/>
                    <button onClick={() => removeTopic(i)} disabled={topics.length === 1}
                      className="btn-icon col-span-1 text-xs" style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

            <button onClick={handleGenerate}
              disabled={topics.some(t => !t.topic.trim())}
              className="btn-primary w-full">
              {t('exam.generateButton', { count: totalQuestions })}
            </button>
          </>)}
        </div>
      </div>
    </div>
  )
}
