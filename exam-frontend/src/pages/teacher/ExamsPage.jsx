import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { examApi, courseApi } from '../../api/services'
import api from '../../api/client'

import ExamFormModal from './modals/ExamFormModal'
import AddQuestionsModal from './modals/AddQuestionsModal'
import PreviewExamModal from './modals/PreviewExamModal'
import ExamCard from './components/ExamCard'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/common/ConfirmDialog'

// ── Icons (GIỮ NGUYÊN ICON CŨ) ───────────────────────────
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
  warn: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378"/>
    </svg>
  ),
}

export default function ExamsPage() {
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
  const [filterCourse, setFilterCourse] = useState('ALL')

  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAiExam, setShowAiExam] = useState(false)

  const [previewExam, setPreviewExam] = useState(null)

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
      toast.warning('Đề đang mở — không thể xóa.')
      return
    }

    if (!(await confirmDialog({ title: `Xóa đề thi "${exam.title}"?`, message: 'Hành động này không thể hoàn tác.', danger: true, confirmLabel: 'Xóa' }))) return

    try {

      await examApi.delete(exam.id)
      setExams(prev => prev.filter(e => e.id !== exam.id))

    } catch (err) {

      toast.error(err?.response?.data?.message || 'Không thể xóa')

    }

  }

  const handleClose = async (exam) => {

    if (!(await confirmDialog({ title: `Đóng đề thi "${exam.title}"?`, message: 'Sinh viên sẽ không thể vào thi sau khi đóng.', danger: false, confirmLabel: 'Đóng đề' }))) return

    try {

      await examApi.close(exam.id)

      setExams(prev =>
        prev.map(e => e.id === exam.id ? { ...e, status: 'CLOSED' } : e)
      )

    } catch (err) {

      toast.error(err?.response?.data?.message || 'Không thể đóng đề')

    }

  }

  const handlePublish = async (exam) => {
    if (!(await confirmDialog({ title: `Xuất bản "${exam.title}"?`, message: 'Sau khi xuất bản, sinh viên có thể vào thi.', danger: false, confirmLabel: 'Xuất bản' }))) return
    try {
      await examApi.publish(exam.id)
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'PUBLISHED' } : e))
      toast.success(`Đã xuất bản "${exam.title}"`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xuất bản đề thi')
    }
  }

  const filtered = exams.filter(e => {

    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.courseName?.toLowerCase().includes(search.toLowerCase())

    const matchStatus =
      filterStatus === 'ALL' || e.status === filterStatus

    const matchCourse =
      filterCourse === 'ALL' || String(e.courseId) === filterCourse

    return matchSearch && matchStatus && matchCourse

  })

  const stats = {
    total: exams.length,
    published: exams.filter(e => e.status === 'PUBLISHED').length,
    draft: exams.filter(e => e.status === 'DRAFT').length,
  }

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="page-title">Đề thi</h1>

          <p className="text-[var(--text-2)] text-sm mt-1">
            {exams.length} đề thi trong hệ thống
          </p>

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiExam(true)}
            className="btn-secondary flex items-center gap-2"
            style={{ color: 'var(--purple)', borderColor: 'var(--purple-subtle)' }}>
            ✦ AI Tạo đề
          </button>
          <button
            onClick={() => { setSelected(null); setModal('create') }}
            className="btn-primary"
          >
            {Icon.plus} Tạo đề thi
          </button>
        </div>

      </div>

      {/* Warning */}

      {!backendReady && (

        <div className="flex items-start gap-3 px-5 py-3.5 rounded-xl bg-warning/10 border border-warning/20">

          <span className="text-warning">{Icon.warn}</span>

          <p className="text-warning text-sm">
            Backend Exam chưa sẵn sàng
          </p>

        </div>

      )}

      {/* Stats */}

      <div className="grid grid-cols-3 gap-4">

        <div className="card-bare py-5 text-center">
          <div className="text-2xl font-bold text-accent">{stats.total}</div>
          <div className="text-xs text-[var(--text-3)]">Tổng đề thi</div>
        </div>

        <div className="card-bare py-5 text-center">
          <div className="text-2xl font-bold text-success">{stats.published}</div>
          <div className="text-xs text-[var(--text-3)]">Đã xuất bản</div>
        </div>

        <div className="card-bare py-5 text-center">
          <div className="text-2xl font-bold">{stats.draft}</div>
          <div className="text-xs text-[var(--text-3)]">Đang soạn</div>
        </div>

      </div>

      {/* Toolbar */}

      <div className="flex items-center gap-3 flex-wrap">

        <div className="relative flex-1 min-w-48">

          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
            {Icon.search}
          </span>

          <input
            className="input-field pl-9"
            placeholder="Tìm đề thi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

        </div>

        <select
          className="input-field w-40"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="CLOSED">Đã đóng</option>
        </select>

        {courses.length > 0 && (

          <select
            className="input-field w-44"
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
          >

            <option value="ALL">Tất cả lớp</option>

            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}

          </select>

        )}

        <button onClick={load} className="btn-secondary">
          {Icon.refresh}
        </button>

      </div>

      {/* Content */}

      {loading ? (

        <div className="flex justify-center py-16">

          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/>

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

      {showAiExam && (
        <AiExamModal
          courses={courses}
          onClose={() => setShowAiExam(false)}
          onCreated={(exam) => { setShowAiExam(false); load(); navigate(`/teacher/exams/${exam.id}`) }}
        />
      )}

    </div>
    </>
  )
}

// ── AI Exam Generator Modal ────────────────────────────────
function AiExamModal({ courses, onClose, onCreated }) {
  const toast = useToast()
  const [step, setStep] = useState(1) // 1=config, 2=generating, 3=done
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

  const totalQuestions = topics.reduce((s, t) => {
    return s + (t.difficulty === 'ALL' ? Math.floor(t.count / 3) * 3 : t.count)
  }, 0)

  const handleGenerate = async () => {
    if (!form.courseId) return setError('Chọn lớp học')
    if (topics.some(t => !t.topic.trim())) return setError('Nhập chủ đề cho tất cả dòng')
    setStep(2); setError('')
    try {
      const r = await api.post('/exams/ai-generate', {
        ...form,
        topics: topics.map(t => ({...t, count: +t.count}))
      })
      setResult(r.data.data)
      setStep(3)
    } catch (e) {
      setError(e?.response?.data?.message || 'Lỗi tạo đề. Thử lại.')
      setStep(1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-base)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>✦ AI Tạo đề thi</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              AI tạo câu hỏi → lưu ngân hàng → tạo đề thi hoàn chỉnh
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 2: generating */}
          {step === 2 && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--purple)' }}/>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>AI đang tạo đề thi...</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Tạo {totalQuestions} câu hỏi cho {topics.length} chủ đề
              </p>
            </div>
          )}

          {/* Step 3: done */}
          {step === 3 && result && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg text-center"
                style={{ background: 'var(--success-subtle)' }}>
                <p className="font-semibold" style={{ color: 'var(--success)' }}>Tạo đề thành công!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                  {result.totalSaved} câu hỏi · đề "{result.exam?.title}"
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
                  Xem đề thi →
                </button>
                <button onClick={onClose} className="btn-secondary">Đóng</button>
              </div>
            </div>
          )}

          {/* Step 1: config */}
          {step === 1 && (<>
            {/* Exam info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="input-label">Tên đề thi</label>
                <input className="input-field" placeholder="Để trống sẽ tự đặt tên..."
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
              </div>
              <div>
                <label className="input-label">Lớp học *</label>
                <select className="input-field" value={form.courseId}
                  onChange={e => setForm({...form, courseId: e.target.value})}>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Thời gian (phút)</label>
                <input type="number" className="input-field" min={10}
                  value={form.durationMinutes} onChange={e => setForm({...form, durationMinutes: +e.target.value})}/>
              </div>
              <div>
                <label className="input-label">Tổng điểm</label>
                <input type="number" className="input-field" min={1}
                  value={form.totalScore} onChange={e => setForm({...form, totalScore: +e.target.value})}/>
              </div>
              <div>
                <label className="input-label">Điểm đạt</label>
                <input type="number" className="input-field" min={1}
                  value={form.passScore} onChange={e => setForm({...form, passScore: +e.target.value})}/>
              </div>
            </div>

            {/* Topics */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                  Chủ đề · {totalQuestions} câu
                </p>
                <button onClick={addTopic} className="btn-ghost text-xs px-2 py-1">+ Thêm chủ đề</button>
              </div>
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input className="input-field col-span-4 text-sm" placeholder="Chủ đề..."
                      value={t.topic} onChange={e => updateTopic(i, 'topic', e.target.value)}/>
                    <select className="input-field col-span-3 text-sm" value={t.type}
                      onChange={e => updateTopic(i, 'type', e.target.value)}>
                      <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                      <option value="TRUE_FALSE">Đúng/Sai</option>
                      <option value="ESSAY">Tự luận</option>
                    </select>
                    <select className="input-field col-span-2 text-sm" value={t.difficulty}
                      onChange={e => updateTopic(i, 'difficulty', e.target.value)}>
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">TB</option>
                      <option value="HARD">Khó</option>
                      <option value="ALL">Tất cả</option>
                    </select>
                    <input type="number" className="input-field col-span-2 text-sm" min={1} placeholder="Số câu"
                      value={t.count} onChange={e => updateTopic(i, 'count', e.target.value)}/>
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
              ✦ Tạo {totalQuestions} câu hỏi + đề thi
            </button>
          </>)}
        </div>
      </div>
    </div>
  )
}
