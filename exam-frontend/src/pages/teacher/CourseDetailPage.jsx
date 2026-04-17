import { useState, useEffect, useCallback } from 'react'
import CreateStudentModal from '../../components/common/CreateStudentModal'
import ResetPasswordModal from '../../components/common/ResetPasswordModal'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { courseApi, userApi, lectureApi, announcementApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/common/ConfirmDialog'
import { useTranslation } from 'react-i18next'
import api from '../../api/client'
import DiscussionForumPage from '../shared/DiscussionForumPage'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  back:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>,
  plus:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  trash:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  search:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  x:       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  user:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
  video:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"/></svg>,
  exam:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  check:   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5"/></svg>,
  youtube: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  link:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
}

// ── Manage Teachers Modal ────────────────────────────────
function ManageTeachersModal({ course, onClose, onSaved, allUsers, currentUser, isAdmin, t }) {
  const [teachers, setTeachers] = useState(course?.teachers || [])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canManage = isAdmin || course?.createdById === currentUser?.id

  if (!canManage) return null

  const availableTeachers = allUsers.filter(u =>
    u.roles?.includes('TEACHER') &&
    !teachers.some(t => t.id === u.id)
  )

  const handleAddTeacher = async () => {
    if (!selectedTeacherId) {
      setError(t('course.selectTeacherError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await courseApi.addTeacher(course.id, Number(selectedTeacherId))
      setTeachers(res.data.data.teachers || [])
      setSelectedTeacherId('')
      if (onSaved) onSaved()
    } catch (err) {
      setError(err.response?.data?.message || t('messages.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTeacher = async (teacherId) => {
    // Ngăn xóa giáo viên cuối cùng
    if (teachers.length === 1) {
      setError(t('course.minOneTeacher'))
      return
    }
    // Ngăn creator tự xóa mình
    if (teacherId === course.createdById) {
      setError('Không thể xóa giáo viên tạo lớp. Chỉ admin mới có thể thực hiện.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await courseApi.removeTeacher(course.id, teacherId)
      setTeachers(res.data.data.teachers || [])
      if (onSaved) onSaved()
    } catch (err) {
      setError(err.response?.data?.message || t('messages.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-lg">
        <div className="modal-header">
          <h2 className="section-title">{t('course.manageTeachers')}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="p-6 space-y-5">
          {error && <div className="px-4 py-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
          
          <div>
            <label className="label">{t('course.teacherList')}</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {teachers.length === 0 ? (
                <p className="text-[var(--text-3)] text-sm py-3">{t('course.noTeachers')}</p>
              ) : teachers.map(teacher => {
                const isCreator = teacher.id === course.createdById
                const canRemove = teachers.length > 1 && !isCreator
                return (
                  <div key={teacher.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[var(--text-1)] text-sm font-medium">{teacher.fullName || teacher.username}</p>
                        {isCreator && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent font-medium">
                            Người tạo
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-3)] text-xs">@{teacher.username}</p>
                    </div>
                    {canRemove && (
                      <button onClick={() => handleRemoveTeacher(teacher.id)} disabled={loading}
                        className="btn-ghost text-danger/70 hover:text-danger hover:bg-danger/10 px-2 py-1 text-xs">
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {availableTeachers.length > 0 && (
            <div>
              <label className="label">{t('course.addTeacher')}</label>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}>
                  <option value="">{t('common.selectPlaceholder')}</option>
                  {availableTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.fullName || teacher.username}</option>
                  ))}
                </select>
                <button onClick={handleAddTeacher} disabled={loading || !selectedTeacherId}
                  className="btn-primary px-4">
                  {loading ? t('common.adding') : t('common.add')}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">{t('common.close')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add Student Modal ──────────────────────────────────────
function AddStudentModal({ courseId, currentStudents, onClose, onAdded }) {
  const toast = useToast()
  const [allStudents, setAllStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    userApi.getAllStudents()
      .then(r => setAllStudents(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const currentIds = new Set(currentStudents.map(s => s.id))
  const filtered = allStudents
    .filter(s => !currentIds.has(s.id)) // Chỉ SV chưa trong lớp
    .filter(s =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(search.toLowerCase())
    )

  const toggle = (id) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleAdd = async () => {
    if (!selected.length) return
    setSaving(true)
    try {
      await courseApi.addStudents(courseId, selected)
      onAdded()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <div>
            <h2 className="section-title">Thêm sinh viên vào lớp</h2>
            <p className="text-[var(--text-3)] text-xs mt-0.5">Chọn từ danh sách sinh viên đã có tài khoản</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[var(--border-base)] shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
            <input className="input-field pl-9 text-sm" placeholder="Tìm tên, username, mã SV..."
              value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          {selected.length > 0 && (
            <p className="text-xs text-accent mt-2">Đã chọn {selected.length} sinh viên</p>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-3)] text-sm">
              {search ? 'Không tìm thấy sinh viên nào' : 'Tất cả sinh viên đã có trong lớp'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s => {
                const isSelected = selected.includes(s.id)
                const code = s.studentCode
                return (
                  <div key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent/50 bg-accent/8'
                        : 'border-[var(--border-base)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)]'
                    }`}>
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border ${
                      isSelected ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-[var(--border-base)] border-[var(--border-strong)] text-[var(--text-2)]'
                    }`}>
                      {s.fullName?.[0]?.toUpperCase() || s.username?.[0]?.toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-1)] text-sm font-medium truncate">{s.fullName || s.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[var(--text-3)] text-xs font-mono">@{s.username}</span>
                        {code && <span className="text-xs font-mono bg-[var(--border-base)] border border-[var(--border-strong)] px-1.5 py-0.5 rounded text-[var(--text-2)]">{code}</span>}
                      </div>
                    </div>
                    {/* Check */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-accent border-accent text-white' : 'border-[var(--border-strong)]'
                    }`}>
                      {isSelected && Icon.check}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border-base)] shrink-0">
          <button onClick={handleAdd} disabled={!selected.length || saving}
            className="btn-primary flex-1">
            {saving ? 'Đang thêm...' : `Thêm ${selected.length > 0 ? selected.length + ' sinh viên' : ''}`}
          </button>
          <button onClick={onClose} className="btn-secondary">Hủy</button>
        </div>
      </div>
    </div>
  )
}

// ── Add Lecture Modal ─────────────────────────────────────
function AddLectureModal({ onClose, onSaved, lecture }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: lecture?.title || '',
    description: lecture?.description || '',
    videoUrl: lecture?.videoUrl || '',
    order: lecture?.order || 1,
  })
  const [saving, setSaving] = useState(false)

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  // Detect loại URL
  const isYoutube = form.videoUrl.includes('youtube.com') || form.videoUrl.includes('youtu.be')
  const isDrive   = form.videoUrl.includes('drive.google.com')

  const getEmbedUrl = (url) => {
    if (!url) return null
    // YouTube
    const yt = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    // Google Drive
    const gd = url.match(/\/d\/([^/]+)/)
    if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`
    return null
  }

  const embedUrl = getEmbedUrl(form.videoUrl)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSaved(form)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)] shrink-0">
          <h2 className="section-title">{lecture ? 'Sửa bài giảng' : 'Thêm bài giảng'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="input-label">Tiêu đề *</label>
            <input className="input-field" value={form.title} onChange={f('title')}
              placeholder="vd: Bài 1 — Giới thiệu Java" required />
          </div>
          <div>
            <label className="input-label">Mô tả</label>
            <textarea className="input-field resize-none" rows={2} value={form.description}
              onChange={f('description')} placeholder="Mô tả ngắn về nội dung bài giảng..." />
          </div>
          <div>
            <label className="input-label">Link video</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.link}</span>
              <input className="input-field pl-9" value={form.videoUrl} onChange={f('videoUrl')}
                placeholder="YouTube hoặc Google Drive link..." />
            </div>
            {form.videoUrl && (
              <p className={`text-xs mt-1.5 flex items-center gap-1 ${isYoutube ? 'text-red-400' : isDrive ? 'text-blue-400' : 'text-[var(--text-3)]'}`}>
                {isYoutube ? <>{Icon.youtube} YouTube detected</>
                  : isDrive ? 'Google Drive detected'
                  : '🔗 Link thường'}
              </p>
            )}
          </div>

          {/* Preview embed */}
          {embedUrl && (
            <div className="rounded-xl overflow-hidden border border-[var(--border-base)] aspect-video">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          )}

          <div>
            <label className="input-label">Thứ tự</label>
            <input type="number" min={1} className="input-field w-24" value={form.order}
              onChange={f('order')} />
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border-base)] shrink-0">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Đang lưu...' : lecture ? 'Lưu thay đổi' : 'Thêm bài giảng'}
          </button>
          <button onClick={onClose} className="btn-secondary">Hủy</button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Students ─────────────────────────────────────────
function TabStudents({ course, isTeacher, isAdmin, onRefresh }) {
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    courseApi.getStudents(course.id)
      .then(r => setStudents(r.data.data || []))
      .finally(() => setLoading(false))
  }, [course.id])

  useEffect(() => { load() }, [load])

  const handleRemove = async (studentId) => {
    if (!(await confirmDialog({ title: 'Xóa sinh viên khỏi lớp?', danger: true, confirmLabel: 'Xóa' }))) return
    setRemoving(studentId)
    try {
      await courseApi.removeStudent(course.id, studentId)
      setStudents(p => p.filter(s => s.id !== studentId))
    } finally { setRemoving(null) }
  }

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
    {ConfirmDialogUI}
    <div className="space-y-5">
      {showCreateStudent && (
        <CreateStudentModal
          courseId={course.id}
          courseName={course?.name}
          onClose={() => setShowCreateStudent(false)}
          onCreated={load}
        />
      )}
      {showAdd && (
        <AddStudentModal
          courseId={course.id}
          currentStudents={students}
          onClose={() => setShowAdd(false)}
          onAdded={() => { load(); onRefresh() }}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
          <input className="input-field pl-9 text-sm" placeholder="Tìm sinh viên..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isTeacher && (
          <div className="flex gap-2 shrink-0">
            {isAdmin && (
              <button onClick={() => setShowCreateStudent(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm">
                ✚ Tạo tài khoản
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
              {Icon.plus} Thêm sinh viên có sẵn
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          
          <p className="text-[var(--text-2)] text-sm">{search ? 'Không tìm thấy' : 'Chưa có sinh viên nào trong lớp'}</p>
          {isTeacher && !search && (
            <div className="flex gap-2 justify-center mt-4">
              {isAdmin && (
                <button onClick={() => setShowCreateStudent(true)} className="btn-secondary text-sm">✚ Tạo tài khoản</button>
              )}
              <button onClick={() => setShowAdd(true)} className="btn-primary">{Icon.plus} Thêm sinh viên có sẵn</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-bare">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                <th className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider px-5 py-3 font-mono">STT</th>
                <th className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider px-5 py-3 font-mono">Sinh viên</th>
                <th className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider px-5 py-3 font-mono">Mã SV</th>
                <th className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider px-5 py-3 font-mono">Email</th>
                <th className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider px-5 py-3 font-mono">Lớp</th>
                {isTeacher && <th className="px-6 py-3.5"/>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                  <td className="px-6 py-4.5 text-xs text-[var(--text-3)] font-mono">{idx + 1}</td>
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-success/15 border border-success/25 flex items-center justify-center shrink-0">
                        <span className="text-success text-xs font-bold">
                          {s.fullName?.[0]?.toUpperCase() || s.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[var(--text-1)] text-sm font-medium">{s.fullName || '—'}</p>
                        <p className="text-[var(--text-3)] text-xs font-mono">@{s.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4.5">
                    {s.studentCode
                      ? <span className="text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-0.5 rounded">{s.studentCode}</span>
                      : <span className="text-[var(--text-3)] text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4.5 text-sm text-[var(--text-2)]">{s.email || '—'}</td>
                  <td className="px-6 py-4.5 text-sm text-[var(--text-2)]">{s.className || '—'}</td>
                  {isTeacher && (
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button onClick={() => setResetTarget(s)}
                            className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-accent hover:bg-accent/10"
                            title="Đặt lại mật khẩu">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                            </svg>
                          </button>
                        )}
                        <button onClick={() => handleRemove(s.id)} disabled={removing === s.id}
                          className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-danger hover:bg-danger/10">
                          {removing === s.id
                            ? <span className="w-4 h-4 border border-danger border-t-transparent rounded-full animate-spin block"/>
                            : Icon.trash}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-[var(--border-base)] text-xs text-[var(--text-3)]">
            {filtered.length} sinh viên
          </div>
        </div>
      )}
      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
      )}    </div>

    </>
  )
}

// ── Tab: Lectures ─────────────────────────────────────────
function TabLectures({ course, isTeacher }) {
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const [lectures, setLectures] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [playing, setPlaying] = useState(null)

  const [loading, setLoading] = useState(true)

  const loadLectures = useCallback(() => {
    setLoading(true)
    lectureApi.getByCourse(course.id)
      .then(r => setLectures(r.data.data || []))
      .catch(() => setLectures([]))
      .finally(() => setLoading(false))
  }, [course.id])

  useEffect(() => { loadLectures() }, [loadLectures])

  const handleSave = async (form) => {
    if (editing) {
      await lectureApi.update(course.id, editing.id, { ...form, orderIndex: form.order })
      setEditing(null)
    } else {
      await lectureApi.create(course.id, { ...form, orderIndex: form.order })
    }
    loadLectures()
  }

  const handleDelete = async (id) => {
    if (!(await confirmDialog({ title: 'Xóa bài giảng này?', danger: true, confirmLabel: 'Xóa' }))) return
    await lectureApi.delete(course.id, id)
    loadLectures()
  }

  const getEmbedUrl = (url) => {
    if (!url) return null
    const yt = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    const gd = url.match(/\/d\/([^/]+)/)
    if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`
    return null
  }

  const sorted = [...lectures].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))

  return (
    <>
    {ConfirmDialogUI}
    <div className="space-y-5">
      {(showAdd || editing) && (
        <AddLectureModal
          lecture={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSaved={handleSave}
        />
      )}

      {isTeacher && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            {Icon.plus} Thêm bài giảng
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card text-center py-12">
          
          <p className="text-[var(--text-2)] text-sm">Chưa có bài giảng nào</p>
          {isTeacher && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">{Icon.plus} Thêm bài giảng</button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {sorted.map((l, idx) => {
            const embedUrl = getEmbedUrl(l.videoUrl)
            const isPlaying = playing === l.id
            return (
              <div key={l.id} className="card-bare">
                <div className="flex items-start gap-4 p-4">
                  {/* Order badge */}
                  <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-bold font-mono">{idx + 1}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-1)] font-medium text-sm">{l.title}</p>
                    {l.description && <p className="text-[var(--text-3)] text-xs mt-0.5 line-clamp-2">{l.description}</p>}
                    {l.videoUrl && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs text-[var(--text-3)]">{Icon.link}</span>
                        <span className="text-xs text-accent truncate max-w-xs">
                          {l.videoUrl.includes('youtube') ? 'YouTube' : l.videoUrl.includes('drive') ? 'Google Drive' : l.videoUrl}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {embedUrl && (
                      <button onClick={() => setPlaying(isPlaying ? null : l.id)}
                        className={`btn-ghost px-3 py-1.5 text-xs font-medium ${isPlaying ? 'text-accent' : ''}`}>
                        {isPlaying ? 'Ẩn' : 'Xem'}
                      </button>
                    )}
                    {isTeacher && (
                      <>
                        <button onClick={() => setEditing(l)} className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-accent">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(l.id)} className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-danger hover:bg-danger/10">
                          {Icon.trash}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Video embed */}
                {isPlaying && embedUrl && (
                  <div className="border-t border-[var(--border-base)] aspect-video">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                      title={l.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"/>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isTeacher && lectures.length > 0 && (
        <p className="text-xs text-[var(--text-3)] text-center">
          💡 Click "Xem" để xem bài giảng ngay tại đây
        </p>
      )}    </div>

    </>
  )
}

// ── Tab: Exams ────────────────────────────────────────────
function TabExams({ course, isTeacher }) {
  return (
    <div className="card text-center py-12">
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
        {Icon.exam}
      </div>
      <p className="text-[var(--text-1)] font-medium">Đề thi của lớp {course.name}</p>
      <p className="text-[var(--text-3)] text-sm mt-1">Quản lý đề thi trực tiếp trong module Đề thi</p>
      <Link
        to={isTeacher ? '/teacher/exams' : '/student/exams'}
        className="btn-primary mt-4 inline-flex"
      >
        {isTeacher ? 'Quản lý đề thi →' : 'Xem đề thi của tôi →'}
      </Link>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
// ── Tab: Announcements ────────────────────────────────────
function TabAnnouncements({ course, isTeacher }) {
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({ title: '', content: '' })
  const [saving, setSaving]     = useState(false)

  const load = () => {
    setLoading(true)
    announcementApi.getAll(course.id)
      .then(r => setList(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [course.id])

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '' }); setShowForm(true) }
  const openEdit   = (a) => { setEditing(a); setForm({ title: a.title, content: a.content }); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) await announcementApi.update(course.id, editing.id, form)
      else         await announcementApi.create(course.id, form)
      toast.success(editing ? 'Đã cập nhật' : 'Đã đăng thông báo')
      setShowForm(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!(await confirmDialog({ title: 'Xóa thông báo này?', danger: true, confirmLabel: 'Xóa' }))) return
    await announcementApi.delete(course.id, id).catch(() => {})
    setList(p => p.filter(a => a.id !== id))
  }

  const timeAgo = (dt) => {
    if (!dt) return ''
    const diff = Date.now() - new Date(dt).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'Vừa xong'
    if (m < 60) return `${m} phút trước`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ trước`
    return `${Math.floor(h / 24)} ngày trước`
  }

  return (
    <>
      {ConfirmDialogUI}
      <div className="space-y-5">
        {/* Toolbar teacher */}
        {isTeacher && !showForm && (
          <div className="flex justify-end">
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              {Icon.plus} Đăng thông báo
            </button>
          </div>
        )}

        {/* Form tạo/sửa */}
        {showForm && (
          <div className="card p-5">
            <h3 className="section-title mb-4">{editing ? 'Sửa thông báo' : 'Thông báo mới'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="input-label">Tiêu đề</label>
                <input className="input-field" required value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})} placeholder="Tiêu đề thông báo..." />
              </div>
              <div>
                <label className="input-label">Nội dung</label>
                <textarea className="input-field min-h-[100px]" required value={form.content}
                  onChange={e => setForm({...form, content: e.target.value})} placeholder="Nội dung..."/>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Đăng'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Hủy</button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
          </div>
        ) : list.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[var(--text-2)] text-sm">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(a => (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[var(--text-1)]">{a.title}</h4>
                    <p className="text-xs text-[var(--text-3)] mt-0.5">
                      {a.authorName} · {timeAgo(a.createdAt)}
                      {a.updatedAt && a.updatedAt !== a.createdAt && ' (đã sửa)'}
                    </p>
                  </div>
                  {isTeacher && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(a)}
                        className="btn-ghost p-1.5 text-xs text-[var(--text-3)] hover:text-accent">✎</button>
                      <button onClick={() => handleDelete(a.id)}
                        className="btn-ghost p-1.5 text-xs text-[var(--text-3)] hover:text-danger">✕</button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-[var(--text-2)] mt-3 whitespace-pre-wrap">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Tab: Discussions ──────────────────────────────────────
function TabDiscussions({ courseId }) {
  return <DiscussionForumPage courseId={courseId} />
}

// ── Tab: AI Analysis ──────────────────────────────────────
function TabAiAnalysis({ courseId }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get(`/attempts/ai-class/${courseId}`)
      .then(r => setData(r.data.data))
      .catch(() => setError('Không tải được phân tích. Thử lại.'))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent)' }}/>
      <span className="text-sm" style={{ color: 'var(--text-3)' }}>AI đang phân tích lớp học...</span>
    </div>
  )
  if (error) return <p className="text-center py-8 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
  if (!data)  return null

  return (
    <div className="space-y-6 py-2">
      {/* Overview stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Sinh viên',   value: data.totalStudents },
          { label: 'Lượt thi',    value: data.totalAttempts },
          { label: 'Điểm TB',     value: data.avgScore ? data.avgScore.toFixed(1) + '%' : '—' },
          { label: 'Tỉ lệ đạt',  value: data.passRate + '%',
            color: data.passRate >= 70 ? 'var(--success)' : data.passRate >= 50 ? 'var(--warning)' : 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: s.color || 'var(--text-1)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* AI advice */}
      {data.aiAdvice && (
        <div className="card p-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>NHẬN XÉT CỦA AI</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{data.aiAdvice}</p>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions?.length > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-3)' }}>GỢI Ý CẢI THIỆN</p>
          {data.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }}/>
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Topic stats */}
        {data.topicStats?.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-3)' }}>TỈ LỆ ĐÚNG THEO CHỦ ĐỀ</p>
            <div className="space-y-3">
              {data.topicStats.map(t => {
                const clr = t.correctPct >= 70 ? 'var(--success)' : t.correctPct >= 50 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <div key={t.topic}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-2)' }}>{t.topic}</span>
                      <span className="font-mono" style={{ color: clr }}>{t.correctPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-base)' }}>
                      <div className="h-full rounded-full" style={{ width: `${t.correctPct}%`, background: clr }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Weak questions */}
        {data.weakQuestions?.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-3)' }}>CÂU HỎI CẦN XEM LẠI</p>
            <div className="space-y-3">
              {data.weakQuestions.map(q => {
                const { bg, clr, label } = q.flag === 'TOO_HARD'
                  ? { bg: 'var(--danger-subtle)', clr: 'var(--danger)', label: 'Quá khó' }
                  : q.flag === 'TOO_EASY'
                  ? { bg: 'var(--success-subtle)', clr: 'var(--success)', label: 'Quá dễ' }
                  : { bg: 'var(--warning-subtle)', clr: 'var(--warning)', label: 'Bất thường' }
                return (
                  <div key={q.questionId} className="rounded-lg p-3 space-y-1"
                    style={{ background: bg }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: clr + '20', color: clr }}>{label}</span>
                      <span className="text-xs font-mono" style={{ color: clr }}>{q.correctPct}% đúng</span>
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-2)' }}>{q.content}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{q.totalAnswers} lượt trả lời</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {data.topicStats?.length === 0 && data.weakQuestions?.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>
          Cần thêm dữ liệu bài thi đã chấm để phân tích (mỗi chủ đề ≥5 lượt trả lời).
        </p>
      )}
    </div>
  )
}

const TEACHER_TABS = [
  { key: 'students',      label: 'Sinh viên'  },
  { key: 'announcements', label: 'Thông báo'  },
  { key: 'lectures',      label: 'Bài giảng'  },
  { key: 'exams',         label: 'Đề thi'     },
  { key: 'discussions',   label: '💬 Thảo luận' },
  { key: 'ai_analysis',   label: '✦ AI Phân tích' },
]

const STUDENT_TABS = [
  { key: 'announcements', label: 'Thông báo'  },
  { key: 'lectures',      label: 'Bài giảng'  },
  { key: 'exams',         label: 'Đề thi'     },
  { key: 'discussions',   label: '💬 Thảo luận' },
]

export default function CourseDetailPage() {
  const { id: courseId } = useParams ? useParams() : {}
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { t } = useTranslation()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const { hasRole, user } = useAuth()
  const isTeacher = hasRole('TEACHER') || hasRole('ADMIN')
  const isAdmin   = hasRole('ADMIN')

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(isTeacher ? 'students' : 'announcements')
  const [exporting, setExporting] = useState(false)
  const [showManageTeachers, setShowManageTeachers] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const TABS = isTeacher ? TEACHER_TABS : STUDENT_TABS

  // Auto-open discussion tab from notification link
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'discussion') {
      setTab('discussions')
    }
  }, [location.search])

  const handleExportReport = async () => {
    setExporting(true)
    try {
      const resp = await api.get(`/attempts/courses/${course.id}/report/export`, { responseType: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([resp.data]))
      link.download = `bao-cao-${course.name.replace(/\s+/g, '-')}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success(t('messages.saveSuccess'))
    } catch {
      toast.error(t('messages.saveFailed'))
    } finally {
      setExporting(false)
    }
  }

  const loadCourse = useCallback(() => {
    courseApi.getById(id)
      .then(r => setCourse(r.data.data))
      .catch((err) => {
        console.error('CourseDetail load error:', err?.response?.status, err?.response?.data)
        navigate(-1)
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => { loadCourse() }, [loadCourse])

  // Load danh sách giáo viên nếu là teacher hoặc admin
  useEffect(() => {
    if (isTeacher) {
      userApi.getAllTeachers()
        .then(r => setAllUsers(r.data.data || []))
        .catch(() => setAllUsers([]))
    }
  }, [isTeacher])

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  if (!course) return null

  const backPath = isTeacher ? '/teacher/courses' : '/student'

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Breadcrumb + Header */}
      <div>
        <button onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-[var(--text-3)] hover:text-[var(--text-1)] text-sm mb-4 transition-colors">
          {Icon.back} {t('common.back')}
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--border-base)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
              <span className="text-[var(--text-1)] text-base font-semibold">
                {course.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="page-title">{course.name}</h1>
              {course.description && (
                <p className="text-[var(--text-2)] text-sm mt-1">{course.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2.5 text-sm text-[var(--text-3)]">
                <span>
                  Giáo viên: {
                    course.teachers && course.teachers.length > 0
                      ? course.teachers.map(t => t.fullName || t.username).join(', ')
                      : 'Chưa có giáo viên'
                  }
                </span>
                <span>·</span>
                <span>{course.studentCount ?? 0} Sinh viên</span>
              </div>
            </div>
          </div>
          {/* Action buttons — gom lại 1 chỗ */}
          <div className="flex items-center gap-2 shrink-0">
            {(course.createdById === user?.id || isAdmin) && (
              <button
                onClick={() => setShowManageTeachers(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
                title="Thêm hoặc xóa giáo viên quản lý lớp"
              >
                Thêm giáo viên
              </button>
            )}
            <button
              onClick={() => navigate(`${isTeacher ? (isAdmin ? `/admin` : `/teacher`) : `/student`}/courses/${course.id}/leaderboard`)}
              className="btn-secondary flex items-center gap-2 text-sm"
              title="Bảng xếp hạng lớp"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              BXH lớp
            </button>
            {isTeacher && (
              <button
                onClick={handleExportReport}
                disabled={exporting}
                className="btn-secondary flex items-center gap-2 text-sm"
                title="Xuất báo cáo tổng hợp Excel"
              >
                {exporting
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                    </svg>
                }
                Báo cáo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)] -mx-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tab === 'announcements' && <TabAnnouncements course={course} isTeacher={isTeacher} />}
        {tab === 'students' && <TabStudents course={course} isTeacher={isTeacher} isAdmin={isAdmin} onRefresh={loadCourse} />}
        {tab === 'lectures' && <TabLectures course={course} isTeacher={isTeacher} />}
        {tab === 'exams'    && <TabExams    course={course} isTeacher={isTeacher} />}
        {tab === 'discussions' && <TabDiscussions courseId={course.id} />}
        {tab === 'ai_analysis' && <TabAiAnalysis courseId={course.id} />}
      </div>

      {/* Manage Teachers Modal */}
      {showManageTeachers && (
        <ManageTeachersModal
          course={course}
          onClose={() => setShowManageTeachers(false)}
          onSaved={loadCourse}
          allUsers={allUsers}
          currentUser={user}
          isAdmin={isAdmin}
          t={t}
        />
      )}
    </div>
    </>
  )
}