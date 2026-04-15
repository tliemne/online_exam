import { useRef, useState } from 'react'

const Icon = {
  emoji: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  image: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  file: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>,
  link: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
}

export default function AttachmentToolbar({ onImageSelect, onFileSelect, onLinkInsert, imageDisabled, fileDisabled }) {
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect?.(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleLinkSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const url = linkUrl.trim()
    if (!url) return
    // Add https:// if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    onLinkInsert?.(fullUrl)
    setLinkUrl('')
    setShowLinkInput(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Emoji - Coming soon */}
        <button type="button" disabled
          className="p-2 rounded-full text-[var(--text-3)] transition-colors disabled:opacity-30"
          title="Emoji (Sắp có)">
          {Icon.emoji}
        </button>

        {/* Image */}
        <button type="button" onClick={() => imageInputRef.current?.click()} disabled={imageDisabled}
          className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-accent transition-colors disabled:opacity-30"
          title="Thêm ảnh">
          {Icon.image}
        </button>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple onChange={handleImageChange} className="hidden" />

        {/* File */}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={fileDisabled}
          className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-accent transition-colors disabled:opacity-30"
          title="Đính kèm file">
          {Icon.file}
        </button>
        <input ref={fileInputRef} type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          multiple onChange={handleFileChange} className="hidden" />

        {/* Link */}
        <button type="button" onClick={() => setShowLinkInput(p => !p)}
          className={`p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors ${
            showLinkInput ? 'text-accent bg-accent/10' : 'text-accent'
          }`}
          title="Chèn link">
          {Icon.link}
        </button>
      </div>

      {/* Link input popup */}
      {showLinkInput && (
        <div className="absolute bottom-full left-0 mb-2 z-20 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-lg p-3 w-72">
          <p className="text-xs font-medium text-[var(--text-2)] mb-2">Chèn link</p>
          <form onSubmit={handleLinkSubmit} className="flex gap-2">
            <input
              type="text"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="input-field flex-1 text-sm py-1.5"
              autoFocus
              onKeyDown={e => e.key === 'Escape' && setShowLinkInput(false)}
            />
            <button type="submit" className="btn-primary px-3 py-1.5 text-sm">
              Thêm
            </button>
          </form>
          <p className="text-xs text-[var(--text-3)] mt-1.5">
            Link sẽ được thêm vào cuối nội dung
          </p>
        </div>
      )}
    </div>
  )
}
