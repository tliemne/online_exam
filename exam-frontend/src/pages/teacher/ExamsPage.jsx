import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { examApi, courseApi } from '../../api/services'

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

        <button
          onClick={() => { setSelected(null); setModal('create') }}
          className="btn-primary"
        >
          {Icon.plus} Tạo đề thi
        </button>

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

    </div>
    </>
  )
}
