import { useRef } from 'react'

const Icon = {
  emoji: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  image: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  file: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>,
  gif: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>,
  sticker: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
}

export default function AttachmentToolbar({ onImageSelect, onFileSelect, imageDisabled, fileDisabled }) {
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleImageClick = () => {
    imageInputRef.current?.click()
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(Array.from(e.target.files))
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect?.(Array.from(e.target.files))
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Emoji - Coming soon */}
      <button
        type="button"
        disabled
        className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-3)] transition-colors disabled:opacity-30"
        title="Emoji (Sắp có)"
      >
        {Icon.emoji}
      </button>

      {/* Image */}
      <button
        type="button"
        onClick={handleImageClick}
        disabled={imageDisabled}
        className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-accent hover:text-accent transition-colors disabled:opacity-30"
        title="Thêm ảnh"
      >
        {Icon.image}
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />

      {/* File */}
      <button
        type="button"
        onClick={handleFileClick}
        disabled={fileDisabled}
        className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-accent hover:text-accent transition-colors disabled:opacity-30"
        title="Đính kèm file"
      >
        {Icon.file}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* GIF - Coming soon */}
      <button
        type="button"
        disabled
        className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-3)] transition-colors disabled:opacity-30"
        title="GIF (Sắp có)"
      >
        {Icon.gif}
      </button>

      {/* Sticker - Coming soon */}
      <button
        type="button"
        disabled
        className="p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-3)] transition-colors disabled:opacity-30"
        title="Sticker (Sắp có)"
      >
        {Icon.sticker}
      </button>
    </div>
  )
}
