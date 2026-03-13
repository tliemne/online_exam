import { useState, useEffect } from 'react'
import { tagApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../components/common/ConfirmDialog'

// ── Preset colors ─────────────────────────────────────────
const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#6b7280', '#ef4444',
]

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  tag:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z"/></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>,
  trash:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  x:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
}

// ── TagFormModal ──────────────────────────────────────────
function TagFormModal({ tag, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        tag?.name        || '',
    description: tag?.description || '',
    color:       tag?.color       || PRESET_COLORS[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!form.name.trim()) { setError('Tên tag không được để trống'); return }
    setSaving(true)
    try {
      if (tag) await tagApi.update(tag.id, form)
      else     await tagApi.create(form)
      onSaved(); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl w-full max-w-md shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-base)]">
          <h2 className="section-title">{tag ? 'Sửa tag' : 'Tạo tag mới'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + color preview */}
            <div>
              <label className="input-label">Tên tag *</label>
              <div className="flex items-center gap-3">
                <input className="input-field flex-1" placeholder="vd: Java, OOP, Backend..."
                  value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
                {/* Live preview */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white shrink-0"
                  style={{ backgroundColor: form.color }}>
                  {form.name || 'Preview'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="input-label">Mô tả <span className="text-[var(--text-3)] font-normal">(tuỳ chọn)</span></label>
              <input className="input-field" placeholder="Mô tả ngắn về tag này..."
                value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>

            {/* Color picker */}
            <div>
              <label className="input-label">Màu badge</label>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setForm(f => ({...f, color: c}))}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] scale-110' : ''}`}
                    style={{ backgroundColor: c, '--tw-ring-color': c }}
                  />
                ))}
                {/* Custom color */}
                <div className="relative">
                  <input type="color" value={form.color}
                    onChange={e => setForm(f => ({...f, color: e.target.value}))}
                    className="w-7 h-7 rounded-full cursor-pointer border border-[var(--border-base)] p-0.5 bg-transparent"
                    title="Chọn màu tuỳ chỉnh" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Đang lưu...' : tag ? 'Lưu thay đổi' : 'Tạo tag'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── TagCard ───────────────────────────────────────────────
function TagCard({ tag, onEdit, onDelete, deleting }) {
  return (
    <div className="card flex items-center gap-4 hover:border-accent/20 transition-all">
      {/* Color dot */}
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color || '#6b7280' }} />

      {/* Badge preview */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shrink-0"
        style={{ backgroundColor: tag.color || '#6b7280' }}>
        {tag.name}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {tag.description && (
          <p className="text-[var(--text-3)] text-xs truncate">{tag.description}</p>
        )}
      </div>

      {/* Question count */}
      <div className="text-center shrink-0">
        <div className="text-sm font-semibold font-mono text-[var(--text-1)]">{tag.questionCount ?? 0}</div>
        <div className="text-xs text-[var(--text-3)]">câu hỏi</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(tag)} className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-accent">
          {Icon.edit}
        </button>
        <button onClick={() => onDelete(tag)} disabled={deleting === tag.id}
          className="btn-ghost p-1.5 text-[var(--text-3)] hover:text-danger hover:bg-danger/10">
          {deleting === tag.id
            ? <span className="w-4 h-4 border border-danger border-t-transparent rounded-full animate-spin block"/>
            : Icon.trash}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function TagsPage() {
  const toast = useToast()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const { hasRole } = useAuth()
  const isTeacherOrAdmin = hasRole('TEACHER') || hasRole('ADMIN')

  const [tags, setTags]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)   // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [keyword, setKeyword]   = useState('')

  const loadTags = () => {
    setLoading(true)
    tagApi.getAll()
      .then(r => setTags(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTags() }, [])

  const handleDelete = async (tag) => {
    if (!(await confirmDialog({ title: `Xóa tag "${tag.name}"?`, message: "Tag sẽ bị gỡ khỏi tất cả câu hỏi liên quan.", danger: true, confirmLabel: "Xóa" }))) return
    setDeleting(tag.id)
    try {
      await tagApi.delete(tag.id)
      loadTags()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa tag')
    } finally { setDeleting(null) }
  }

  const filtered = keyword.trim()
    ? tags.filter(t => t.name.toLowerCase().includes(keyword.toLowerCase()))
    : tags

  const totalQuestions = tags.reduce((s, t) => s + (t.questionCount ?? 0), 0)

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quản lý Tags</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {tags.length} tags · {totalQuestions} câu hỏi được gắn tag
          </p>
        </div>
        {isTeacherOrAdmin && (
          <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary flex items-center gap-2">
            {Icon.plus} Tạo tag mới
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input className="input-field pl-9" placeholder="Tìm tag theo tên..."
            value={keyword} onChange={e => setKeyword(e.target.value)} />
        </div>

        {/* All tags preview */}
        {tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-base)] flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t.id}
                onClick={() => { setSelected(t); setModal('edit') }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: t.color || '#6b7280' }}>
                {t.name}
                {t.questionCount > 0 && (
                  <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-mono">{t.questionCount}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          {keyword ? (
            <p className="text-[var(--text-2)]">Không tìm thấy tag nào khớp với "{keyword}".</p>
          ) : (
            <>
              <p className="text-[var(--text-2)]">Chưa có tag nào.{isTeacherOrAdmin && ' Hãy tạo tag để phân loại câu hỏi!'}</p>
              {isTeacherOrAdmin && (
                <button onClick={() => { setSelected(null); setModal('create') }} className="btn-primary mt-4">
                  {Icon.plus} Tạo tag đầu tiên
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tag => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={t => { setSelected(t); setModal('edit') }}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <TagFormModal
          tag={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={loadTags}
        />
      )}
    </div>
    </>
  )
}
