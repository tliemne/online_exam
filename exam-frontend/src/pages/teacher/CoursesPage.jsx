import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseApi, userApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'

// ── Icons ────────────────────────────────────────────────
const Icon = {
  grid: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>,
  list: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  search: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
}

// ── Modal wrapper ────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-lg">
        <div className="modal-header">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Course Form Modal ────────────────────────────────────
function CourseFormModal({ course, onClose, onSaved, isAdmin, allUsers }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: course?.name || '',
    description: course?.description || '',
    teacherId: course?.teachers?.[0]?.id || (isAdmin ? '' : user?.id),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const teachers = allUsers.filter(u => u.roles?.includes('TEACHER'))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        teacherId: isAdmin ? Number(form.teacherId) : null,
      }
      if (course) await courseApi.update(course.id, payload)
      else await courseApi.create(payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={course ? t('course.editCourse') : t('course.createNewCourse')} onClose={onClose}>
      {error && <div className="mb-4 px-4 py-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">{t('course.courseName')}</label>
          <input className="input-field" placeholder={t('course.coursePlaceholder')} value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
        </div>
        <div>
          <label className="label">{t('course.description')}</label>
          <textarea className="input-field resize-none" rows={3} placeholder={t('course.descriptionPlaceholder')}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        {isAdmin && (
          <div>
            <label className="label">{t('course.mainTeacher')}</label>
            <select className="input-field" value={form.teacherId}
              onChange={e => setForm({ ...form, teacherId: e.target.value })} required>
              <option value="">{t('course.selectTeacher')}</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName || t.username}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? t('course.saving') : course ? t('course.saveChanges') : t('course.createCourse')}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
        </div>
      </form>
    </Modal>
  )
}
// ── Add Students Modal ───────────────────────────────────
function AddStudentsModal({ courseId, currentStudents, onClose, onSaved, allUsers }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentIds = currentStudents.map(s => s.id)
  const available = allUsers.filter(u =>
    u.roles?.includes('STUDENT') &&
    !currentIds.includes(u.id) &&
    (u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
     u.username?.toLowerCase().includes(search.toLowerCase()))
  )

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const handleAdd = async () => {
    if (!selected.length) return
    setSaving(true)
    setError('')
    try {
      await courseApi.addStudents(courseId, selected)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('course.addStudentsToCourse')} onClose={onClose}>
      {error && <div className="mb-4 px-4 py-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
      <div className="space-y-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
          <input className="input-field pl-9" placeholder={t('course.searchStudent')} value={search}
            onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {available.length === 0 ? (
            <p className="text-center text-[var(--text-3)] text-sm py-6">{t('course.noStudentsAvailable')}</p>
          ) : available.map(u => (
            <label key={u.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selected.includes(u.id)
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)] shadow-sm'
                  : 'border-[var(--border-base)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:shadow-sm'
              }`}>
              <input type="checkbox" className="hidden" checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)} />
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected.includes(u.id) ? 'bg-accent border-accent' : 'border-[var(--border-strong)]'
              }`}>
                {selected.includes(u.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-1)] text-sm font-medium">{u.fullName || u.username}</p>
                <p className="text-[var(--text-3)] text-xs font-mono">@{u.username}</p>
              </div>
              {selected.includes(u.id) && <span className="badge-blue text-xs">{t('course.selected')}</span>}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <p className="text-accent text-sm">{t('course.selected')} {selected.length} {t('course.students').toLowerCase()}</p>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={handleAdd} disabled={saving || !selected.length} className="btn-primary flex-1">
            {saving ? t('course.adding') : `${t('course.addStudents')}${selected.length > 0 ? ' ' + selected.length : ''}`}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Students Modal ───────────────────────────────────────
function StudentsModal({ course, onClose, onUpdated, allUsers }) {
  const { t } = useTranslation()
  const [confirmDialog] = useConfirm()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    courseApi.getStudents(course.id)
      .then(r => setStudents(r.data.data || []))
      .finally(() => setLoading(false))
  }, [course.id])

  useEffect(() => { load() }, [load])

  const handleRemove = async (studentId) => {
    if (!(await confirmDialog({ title: t('course.removeStudent'), danger: true, confirmLabel: t('common.delete') }))) return
    setRemoving(studentId)
    try {
      await courseApi.removeStudent(course.id, studentId)
      load()
      onUpdated()
    } finally {
      setRemoving(null)
    }
  }

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Modal title={`${t('course.studentList')} — ${course.name}`} onClose={onClose}>
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
              <input className="input-field pl-9" placeholder={t('course.searchStudent')} value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary shrink-0">
              {Icon.plus} {t('common.add')}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-3)] text-sm">
                {students.length === 0 ? t('course.noStudentsInCourse') : t('course.notFound')}
              </p>
              {students.length === 0 && (
                <button onClick={() => setShowAdd(true)} className="btn-primary mt-3">{t('course.addStudent')}</button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)]">
                  <div className="w-9 h-9 rounded-full bg-success/15 border border-success/25 flex items-center justify-center shrink-0">
                    <span className="text-success text-xs font-bold">
                      {s.fullName?.[0]?.toUpperCase() || s.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-1)] text-sm font-medium truncate">{s.fullName || s.username}</p>
                    <div className="flex gap-2 mt-0.5">
                      {s.studentCode && <span className="text-[var(--text-3)] text-xs font-mono">{s.studentCode}</span>}
                      {s.className && <span className="text-[var(--text-3)] text-xs">· {s.className}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleRemove(s.id)} disabled={removing === s.id}
                    className="btn-ghost text-danger/70 hover:text-danger hover:bg-danger/10 p-1.5">
                    {removing === s.id ? <span className="w-4 h-4 border border-danger border-t-transparent rounded-full animate-spin block"/> : Icon.trash}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-base)]">
            <span className="text-[var(--text-3)] text-sm">{students.length} {t('course.students').toLowerCase()}</span>
            <button onClick={onClose} className="btn-secondary">{t('common.close')}</button>
          </div>
        </div>
      </Modal>

      {showAdd && (
        <AddStudentsModal
          courseId={course.id}
          currentStudents={students}
          allUsers={allUsers}
          onClose={() => setShowAdd(false)}
          onSaved={() => { load(); onUpdated() }}
        />
      )}
    </>
  )
}

// ── Manage Teachers Modal ────────────────────────────────
function ManageTeachersModal({ course, onClose, onSaved, allUsers, currentUser }) {
  const { t } = useTranslation()
  const [teachers, setTeachers] = useState(course?.teachers || [])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canManage = course?.createdById === currentUser?.id

  if (!canManage) return null

  const availableTeachers = allUsers.filter(u =>
    u.roles?.includes('TEACHER') &&
    !teachers.some(t => t.id === u.id)
  )

  const handleAddTeacher = async () => {
    if (!selectedTeacherId) {
      setError(t('course.selectTeacher'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await courseApi.addTeacher(course.id, Number(selectedTeacherId))
      setTeachers(res.data.data.teachers || [])
      setSelectedTeacherId('')
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTeacher = async (teacherId) => {
    if (teachers.length === 1) {
      setError(t('course.minOneTeacher'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await courseApi.removeTeacher(course.id, teacherId)
      setTeachers(res.data.data.teachers || [])
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={t('course.manageTeachers')} onClose={onClose}>
      {error && <div className="mb-4 px-4 py-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}
      <div className="space-y-5">
        <div>
          <label className="label">{t('course.teacherList')}</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-[var(--text-3)] text-sm py-3">{t('course.noTeachers')}</p>
            ) : teachers.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)]">
                <div>
                  <p className="text-[var(--text-1)] text-sm font-medium">{t.fullName || t.username}</p>
                  <p className="text-[var(--text-3)] text-xs">@{t.username}</p>
                </div>
                {teachers.length > 1 && (
                  <button onClick={() => handleRemoveTeacher(t.id)} disabled={loading}
                    className="btn-ghost text-danger/70 hover:text-danger hover:bg-danger/10 px-2 py-1 text-xs">
                    {t('common.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {availableTeachers.length > 0 && (
          <div>
            <label className="label">{t('course.addTeacher')}</label>
            <div className="flex gap-2">
              <select className="input-field flex-1" value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}>
                <option value="">{t('course.selectTeacher')}</option>
                {availableTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName || t.username}</option>
                ))}
              </select>
              <button onClick={handleAddTeacher} disabled={loading || !selectedTeacherId}
                className="btn-primary px-4">
                {loading ? '...' : t('common.add')}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.close')}</button>
        </div>
      </div>
    </Modal>
  )
}
// ── Course Card ──────────────────────────────────────────
function CourseCard({ course, onEdit, onDelete, onDetail, isOwner, canManageTeachers, onManageTeachers }) {
  const { t } = useTranslation()
  return (
    <div className="card group flex flex-col gap-4 hover:border-accent/30 transition-all duration-200">
      <div className="flex-1 cursor-pointer" onClick={() => onDetail(course)}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-cyan-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <span className="text-accent font-bold font-display">{course.name?.[0]?.toUpperCase()}</span>
          </div>
          {isOwner && <span className="badge-blue">{t('course.myCourse')}</span>}
        </div>
        <h3 className="font-display font-semibold text-[var(--text-1)] group-hover:text-accent transition-colors">{course.name}</h3>
        <p className="text-[var(--text-3)] text-sm mt-1 line-clamp-2">{course.description || t('course.noDescription')}</p>
        {course.teachers && course.teachers.length > 0 && (
          <p className="text-[var(--text-2)] text-xs mt-2">
            {t('course.teacher')}: {course.teachers.map(t => t.fullName || t.username).join(', ')}
          </p>
        )}
        {course.createdByName && (
          <p className="text-[var(--text-3)] text-xs mt-1">{t('course.createdBy')}: {course.createdByName}</p>
        )}
      </div>
      <div className="flex gap-2 pt-3 border-t border-[var(--border-base)]">
        <button onClick={() => onDetail(course)} className="btn-ghost flex-1 text-xs py-1.5">
          {Icon.users} {t('course.details')}
        </button>
        {canManageTeachers && (
          <button onClick={() => onManageTeachers(course)} className="btn-ghost px-2.5 py-1.5 text-xs text-[var(--text-2)] hover:text-accent">
            {t('course.teachers')}
          </button>
        )}
        {isOwner && (
          <button onClick={() => onEdit(course)} className="btn-ghost px-2.5 py-1.5 text-[var(--text-2)] hover:text-accent">
            {Icon.edit}
          </button>
        )}
        {isOwner && (
          <button onClick={() => onDelete(course)} className="btn-ghost px-2.5 py-1.5 text-[var(--text-2)] hover:text-danger hover:bg-danger/10">
            {Icon.trash}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function CoursesPage() {
  const { t } = useTranslation()
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const isAdmin = hasRole('ADMIN')
  const basePath = isAdmin ? '/admin' : '/teacher'
  const [courses, setCourses] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [teachersModal, setTeachersModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const calls = [courseApi.getAll()]
    if (isAdmin) calls.push(userApi.getAll())
    Promise.all(calls)
      .then(([c, u]) => {
        setCourses(c.data.data || [])
        if (u) setAllUsers(u.data.data || [])
      })
      .finally(() => setLoading(false))
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!isAdmin && hasRole('TEACHER')) {
      userApi.getAllStudents().then(r => setAllUsers(r.data.data || [])).catch(() => {})
    }
  }, [isAdmin, hasRole])

  const handleDelete = async (course) => {
    if (!(await confirmDialog({ title: `${t('course.deleteConfirm')} "${course.name}"?`, message: t('course.deleteMessage'), danger: true, confirmLabel: t('course.deleteConfirm') }))) return
    setDeleting(course.id)
    try {
      await courseApi.delete(course.id)
      setCourses(prev => prev.filter(c => c.id !== course.id))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = courses.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.teachers?.some(t => t.fullName?.toLowerCase().includes(search.toLowerCase()))
  )

  const myCourses = filtered.filter(c => c.createdById === user?.id)

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('course.title')}</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">{courses.length} {t('course.totalCourses')}</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary">
          {Icon.plus} {t('course.createCourse')}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">{Icon.search}</span>
          <input className="input-field pl-9" placeholder={t('course.searchCourses')} value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={load} className="btn-secondary">{Icon.refresh}</button>
        <div className="flex bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-lg p-1 gap-1">
          <button onClick={() => setView('grid')}
            className={`p-1.5 rounded transition-all ${view === 'grid' ? 'bg-accent text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}>
            {Icon.grid}
          </button>
          <button onClick={() => setView('table')}
            className={`p-1.5 rounded transition-all ${view === 'table' ? 'bg-accent text-white' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'}`}>
            {Icon.list}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[var(--text-2)]">{t('course.createFirst')}</p>
          <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary mt-4">{t('course.createCourse')}</button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <CourseCard key={c.id} course={c}
              isOwner={myCourses.some(m => m.id === c.id)}
              canManageTeachers={c.createdById === user?.id}
              onEdit={(c) => { setSelected(c); setModal('edit') }}
              onDelete={handleDelete}
              onManageTeachers={(c) => setTeachersModal(c)}
              onDetail={(c) => navigate(`${basePath}/courses/${c.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-base)]">
                {['#', t('course.courseName'), t('course.description'), t('course.teacher'), ''].map(h => (
                  <th key={h} className="text-left text-xs text-[var(--text-3)] uppercase tracking-wider pb-3 pr-4 font-mono">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-[var(--bg-elevated)]/30 transition-colors">
                  <td className="py-3 pr-4 text-xs text-[var(--text-3)] font-mono">#{c.id}</td>
                  <td className="py-3 pr-4">
                    <p className="text-[var(--text-1)] font-medium text-sm">{c.name}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--text-2)] text-sm max-w-xs">
                    <p className="truncate">{c.description || '—'}</p>
                  </td>
                  <td className="py-3 pr-4 text-[var(--text-2)] text-sm">
                    {c.teachers?.map(t => t.fullName || t.username).join(', ') || '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`${basePath}/courses/${c.id}`)}
                        className="btn-ghost px-2 py-1.5 text-xs">{Icon.users}</button>
                      {c.createdById === user?.id && (
                        <button onClick={() => setTeachersModal(c)}
                          className="btn-ghost px-2 py-1.5 text-xs text-[var(--text-2)] hover:text-accent">
                          {t('course.teachers')}
                        </button>
                      )}
                      {c.createdById === user?.id && (
                        <button onClick={() => { setSelected(c); setModal('edit') }}
                          className="btn-ghost px-2 py-1.5 text-xs text-[var(--text-2)] hover:text-accent">{Icon.edit}</button>
                      )}
                      {c.createdById === user?.id && (
                        <button onClick={() => handleDelete(c)} disabled={deleting === c.id}
                          className="btn-ghost px-2 py-1.5 text-xs text-[var(--text-2)] hover:text-danger hover:bg-danger/10">
                          {deleting === c.id ? '...' : Icon.trash}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <CourseFormModal
          course={modal === 'edit' ? selected : null}
          isAdmin={isAdmin}
          allUsers={allUsers}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal === 'students' && selected && (
        <StudentsModal
          course={selected}
          allUsers={allUsers}
          onClose={() => setModal(null)}
          onUpdated={load}
        />
      )}
      {teachersModal && (
        <ManageTeachersModal
          course={teachersModal}
          currentUser={user}
          allUsers={allUsers}
          onClose={() => setTeachersModal(null)}
          onSaved={load}
        />
      )}
    </div>
    </>
  )
}
