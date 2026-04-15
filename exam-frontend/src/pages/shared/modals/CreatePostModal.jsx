import { useState } from 'react'
import { discussionApi } from '../../../api/services'
import { useToast } from '../../../context/ToastContext'

const Icon = {
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
}

export default function CreatePostModal({ courseId, onClose, onCreated, post }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    tags: post?.tags || [],
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (form.title.length < 10 || form.title.length > 200) {
      toast.error('Tiêu đề phải từ 10 đến 200 ký tự')
      return
    }
    if (form.content.length < 1 || form.content.length > 10000) {
      toast.error('Nội dung không được để trống và tối đa 10000 ký tự')
      return
    }
    if (form.tags.length > 5) {
      toast.error('Tối đa 5 thẻ')
      return
    }

    setSaving(true)
    try {
      if (post) {
        await discussionApi.updatePost(post.id, { ...form, courseId })
      } else {
        await discussionApi.createPost(courseId, form)
      }
      toast.success(post ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu bài viết')
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (!tag) return
    if (tag.length < 2 || tag.length > 30) {
      toast.error('Thẻ phải từ 2 đến 30 ký tự')
      return
    }
    if (form.tags.includes(tag)) {
      toast.error('Thẻ đã tồn tại')
      return
    }
    if (form.tags.length >= 5) {
      toast.error('Tối đa 5 thẻ')
      return
    }
    setForm(p => ({ ...p, tags: [...p.tags, tag] }))
    setTagInput('')
  }

  const removeTag = (tag) => {
    setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <h2 className="section-title">{post ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="input-label">Tiêu đề *</label>
            <input className="input-field" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Câu hỏi hoặc chủ đề của bạn?" required minLength={10} maxLength={200} />
            <p className="text-xs text-[var(--text-3)] mt-1">{form.title.length}/200 ký tự</p>
          </div>

          {/* Content */}
          <div>
            <label className="input-label">Nội dung *</label>
            <textarea className="input-field resize-none" rows={8} value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Mô tả chi tiết câu hỏi hoặc chủ đề thảo luận..." required maxLength={10000} />
            <p className="text-xs text-[var(--text-3)] mt-1">{form.content.length}/10000 ký tự</p>
          </div>

          {/* Tags */}
          <div>
            <label className="input-label">Thẻ (tùy chọn, tối đa 5)</label>
            <div className="flex gap-2 mb-2">
              <input className="input-field flex-1" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Thêm thẻ..." maxLength={30} />
              <button type="button" onClick={addTag} className="btn-secondary px-4">Thêm</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-danger">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Đang lưu...' : post ? 'Cập nhật' : 'Tạo bài viết'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  )
}
