import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { courseApi, userApi, lectureApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'

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

// ── Add Student Modal ──────────────────────────────────────
function AddStudentModal({ courseId, currentStudents, onClose, onAdded }) {
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
      s.studentProfile?.studentCode?.toLowerCase().includes(search.toLowerCase())
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
      alert(e.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <div>
            <h2 className="section-title">Thêm sinh viên vào lớp</h2>
            <p className="text-text-muted text-xs mt-0.5">Chọn từ danh sách sinh viên đã có tài khoản</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-surface-600 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.search}</span>
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
            <div className="text-center py-8 text-text-muted text-sm">
              {search ? 'Không tìm thấy sinh viên nào' : 'Tất cả sinh viên đã có trong lớp'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(s => {
                const isSelected = selected.includes(s.id)
                const code = s.studentProfile?.studentCode
                return (
                  <div key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent/50 bg-accent/8'
                        : 'border-surface-600 hover:border-surface-500 bg-surface-700'
                    }`}>
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border ${
                      isSelected ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-surface-600 border-surface-500 text-text-secondary'
                    }`}>
                      {s.fullName?.[0]?.toUpperCase() || s.username?.[0]?.toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium truncate">{s.fullName || s.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-text-muted text-xs font-mono">@{s.username}</span>
                        {code && <span className="text-xs font-mono bg-surface-600 border border-surface-500 px-1.5 py-0.5 rounded text-text-secondary">{code}</span>}
                      </div>
                    </div>
                    {/* Check */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-accent border-accent text-white' : 'border-surface-400'
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
        <div className="flex gap-3 px-6 py-4 border-t border-surface-600 shrink-0">
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
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-600 shrink-0">
          <h2 className="section-title">{lecture ? 'Sửa bài giảng' : 'Thêm bài giảng'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="label">Tiêu đề *</label>
            <input className="input-field" value={form.title} onChange={f('title')}
              placeholder="vd: Bài 1 — Giới thiệu Java" required />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea className="input-field resize-none" rows={2} value={form.description}
              onChange={f('description')} placeholder="Mô tả ngắn về nội dung bài giảng..." />
          </div>
          <div>
            <label className="label">Link video</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.link}</span>
              <input className="input-field pl-9" value={form.videoUrl} onChange={f('videoUrl')}
                placeholder="YouTube hoặc Google Drive link..." />
            </div>
            {form.videoUrl && (
              <p className={`text-xs mt-1.5 flex items-center gap-1 ${isYoutube ? 'text-red-400' : isDrive ? 'text-blue-400' : 'text-text-muted'}`}>
                {isYoutube ? <>{Icon.youtube} YouTube detected</>
                  : isDrive ? '📁 Google Drive detected'
                  : '🔗 Link thường'}
              </p>
            )}
          </div>

          {/* Preview embed */}
          {embedUrl && (
            <div className="rounded-xl overflow-hidden border border-surface-600 aspect-video">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          )}

          <div>
            <label className="label">Thứ tự</label>
            <input type="number" min={1} className="input-field w-24" value={form.order}
              onChange={f('order')} />
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-surface-600 shrink-0">
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
function TabStudents({ course, isTeacher, onRefresh }) {
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
    if (!confirm('Xóa sinh viên khỏi lớp này?')) return
    setRemoving(studentId)
    try {
      await courseApi.removeStudent(course.id, studentId)
      setStudents(p => p.filter(s => s.id !== studentId))
    } finally { setRemoving(null) }
  }

  const filtered = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentProfile?.studentCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{Icon.search}</span>
          <input className="input-field pl-9 text-sm" placeholder="Tìm sinh viên..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isTeacher && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 shrink-0">
            {Icon.plus} Thêm sinh viên
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-3xl mb-3">👥</div>
          <p className="text-text-secondary text-sm">{search ? 'Không tìm thấy' : 'Chưa có sinh viên nào trong lớp'}</p>
          {isTeacher && !search && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">{Icon.plus} Thêm sinh viên</button>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-600 bg-surface-700">
                <th className="text-left text-xs text-text-muted uppercase tracking-wider px-5 py-3 font-mono">STT</th>
                <th className="text-left text-xs text-text-muted uppercase tracking-wider px-5 py-3 font-mono">Sinh viên</th>
                <th className="text-left text-xs text-text-muted uppercase tracking-wider px-5 py-3 font-mono">Mã SV</th>
                <th className="text-left text-xs text-text-muted uppercase tracking-wider px-5 py-3 font-mono">Email</th>
                <th className="text-left text-xs text-text-muted uppercase tracking-wider px-5 py-3 font-mono">Lớp</th>
                {isTeacher && <th className="px-5 py-3"/>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-surface-700/40 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-text-muted font-mono">{idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-accent/15 border border-green-accent/25 flex items-center justify-center shrink-0">
                        <span className="text-green-accent text-xs font-bold">
                          {s.fullName?.[0]?.toUpperCase() || s.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-text-primary text-sm font-medium">{s.fullName || '—'}</p>
                        <p className="text-text-muted text-xs font-mono">@{s.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.studentProfile?.studentCode
                      ? <span className="text-xs font-mono bg-surface-700 border border-surface-500 px-2 py-0.5 rounded">{s.studentProfile.studentCode}</span>
                      : <span className="text-text-muted text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{s.email || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{s.studentProfile?.className || '—'}</td>
                  {isTeacher && (
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleRemove(s.id)} disabled={removing === s.id}
                        className="btn-ghost p-1.5 text-text-muted hover:text-red-accent hover:bg-red-accent/10">
                        {removing === s.id
                          ? <span className="w-4 h-4 border border-red-accent border-t-transparent rounded-full animate-spin block"/>
                          : Icon.trash}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-surface-600 text-xs text-text-muted">
            {filtered.length} sinh viên
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Lectures ─────────────────────────────────────────
function TabLectures({ course, isTeacher }) {
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
    if (!confirm('Xóa bài giảng này?')) return
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
    <div className="space-y-4">
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
          <div className="text-3xl mb-3">🎬</div>
          <p className="text-text-secondary text-sm">Chưa có bài giảng nào</p>
          {isTeacher && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">{Icon.plus} Thêm bài giảng</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((l, idx) => {
            const embedUrl = getEmbedUrl(l.videoUrl)
            const isPlaying = playing === l.id
            return (
              <div key={l.id} className="card p-0 overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  {/* Order badge */}
                  <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-bold font-mono">{idx + 1}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium text-sm">{l.title}</p>
                    {l.description && <p className="text-text-muted text-xs mt-0.5 line-clamp-2">{l.description}</p>}
                    {l.videoUrl && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs text-text-muted">{Icon.link}</span>
                        <span className="text-xs text-accent truncate max-w-xs">
                          {l.videoUrl.includes('youtube') ? '▶ YouTube' : l.videoUrl.includes('drive') ? '📁 Google Drive' : l.videoUrl}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {embedUrl && (
                      <button onClick={() => setPlaying(isPlaying ? null : l.id)}
                        className={`btn-ghost px-3 py-1.5 text-xs font-medium ${isPlaying ? 'text-accent' : ''}`}>
                        {isPlaying ? '⏹ Ẩn' : '▶ Xem'}
                      </button>
                    )}
                    {isTeacher && (
                      <>
                        <button onClick={() => setEditing(l)} className="btn-ghost p-1.5 text-text-muted hover:text-accent">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(l.id)} className="btn-ghost p-1.5 text-text-muted hover:text-red-accent hover:bg-red-accent/10">
                          {Icon.trash}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Video embed */}
                {isPlaying && embedUrl && (
                  <div className="border-t border-surface-600 aspect-video">
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
        <p className="text-xs text-text-muted text-center">
          💡 Click "Xem" để xem bài giảng ngay tại đây
        </p>
      )}
    </div>
  )
}

// ── Tab: Exams ────────────────────────────────────────────
function TabExams({ course, isTeacher }) {
  return (
    <div className="card text-center py-12">
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
        {Icon.exam}
      </div>
      <p className="text-text-primary font-medium">Đề thi của lớp {course.name}</p>
      <p className="text-text-muted text-sm mt-1">Quản lý đề thi trực tiếp trong module Đề thi</p>
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
const TEACHER_TABS = [
  { key: 'students', label: 'Sinh viên',  icon: '👥' },
  { key: 'lectures', label: 'Bài giảng',  icon: '🎬' },
  { key: 'exams',    label: 'Đề thi',     icon: '📝' },
]

const STUDENT_TABS = [
  { key: 'lectures', label: 'Bài giảng',  icon: '🎬' },
  { key: 'exams',    label: 'Đề thi',     icon: '📝' },
]

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isTeacher = hasRole('TEACHER') || hasRole('ADMIN')

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(isTeacher ? 'students' : 'lectures')
  const TABS = isTeacher ? TEACHER_TABS : STUDENT_TABS

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
    </div>
  )

  if (!course) return null

  const backPath = isTeacher ? '/teacher/courses' : '/student'

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Breadcrumb + Header */}
      <div>
        <button onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-4 transition-colors">
          {Icon.back} Quay lại danh sách lớp
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
              <span className="text-accent text-lg font-bold font-display">
                {course.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="page-title">{course.name}</h1>
              {course.description && (
                <p className="text-text-secondary text-sm mt-1">{course.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                <span>👨‍🏫 {course.teacherName || 'Chưa có giảng viên'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-700">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tab === 'students' && <TabStudents course={course} isTeacher={isTeacher} onRefresh={loadCourse} />}
        {tab === 'lectures' && <TabLectures course={course} isTeacher={isTeacher} />}
        {tab === 'exams'    && <TabExams    course={course} isTeacher={isTeacher} />}
      </div>
    </div>
  )
}
