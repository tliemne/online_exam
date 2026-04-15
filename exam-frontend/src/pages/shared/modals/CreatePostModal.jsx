import { useState } from 'react'
import { discussionApi } from '../../../api/services'
import { useToast } from '../../../context/ToastContext'
import AttachmentToolbar from '../../../components/discussion/AttachmentToolbar'
import LinkPreview from '../../../components/discussion/LinkPreview'
import { useUrlDetector } from '../../../hooks/useUrlDetector'

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
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const contentUrls = useUrlDetector(form.content)

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
      let postId
      if (post) {
        await discussionApi.updatePost(post.id, { ...form, courseId })
        postId = post.id
      } else {
        const response = await discussionApi.createPost(courseId, form)
        postId = response.data.data.id
      }

      // Upload images if any
      if (images.length > 0 && postId) {
        const uploadPromises = images.map(img => 
          discussionApi.uploadPostAttachment(postId, img.file)
        )
        await Promise.all(uploadPromises)
      }

      // Upload files if any
      if (files.length > 0 && postId) {
        const uploadPromises = files.map(file => 
          discussionApi.uploadPostAttachment(postId, file.file)
        )
        await Promise.all(uploadPromises)
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
      <div className="modal-box max-w-2xl max-h-[90vh] flex flex-col">
        <div className="modal-header shrink-0">
          <h2 className="section-title">{post ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">{Icon.x}</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
            <textarea className="input-field resize-none" rows={5} value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Mô tả chi tiết câu hỏi hoặc chủ đề thảo luận..." required maxLength={10000} />
            <p className="text-xs text-[var(--text-3)] mt-1">{form.content.length}/10000 ký tự</p>
            {/* Link Preview while typing */}
            {contentUrls.length > 0 && (
              <div className="mt-2 space-y-2">
                {contentUrls.slice(0, 1).map((url, i) => (
                  <LinkPreview key={i} url={url} />
                ))}
              </div>
            )}
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

          {/* Attachments - compact toolbar style */}
          {!post && (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <AttachmentToolbar
                  onImageSelect={(files) => {
                    const newImgs = files.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name, size: f.size }))
                    setImages(prev => [...prev, ...newImgs].slice(0, 5))
                  }}
                  onFileSelect={(files) => {
                    const newFiles = files.map(f => ({ file: f, name: f.name, size: f.size }))
                    setFiles(prev => [...prev, ...newFiles].slice(0, 3))
                  }}
                  onLinkInsert={(url) => setForm(p => ({ ...p, content: p.content ? `${p.content}\n${url}` : url }))}
                  imageDisabled={images.length >= 5}
                  fileDisabled={files.length >= 3}
                />
                <span className="text-xs text-[var(--text-3)]">
                  {images.length > 0 && `${images.length} ảnh`}
                  {images.length > 0 && files.length > 0 && ' · '}
                  {files.length > 0 && `${files.length} file`}
                </span>
              </div>

              {/* Image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--border-base)]">
                      <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File previews */}
              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)] group">
                      <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <span className="text-xs text-[var(--text-1)] truncate flex-1">{file.name}</span>
                      <span className="text-xs text-[var(--text-3)]">{(file.size/1024).toFixed(0)}KB</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="p-0.5 rounded hover:bg-danger/10 text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
