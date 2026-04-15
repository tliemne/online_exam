import { useState, useRef, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'

const Icon = {
  image: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
}

export default function ImageUploader({ images, onChange, maxImages = 5 }) {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)')
      return false
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Kích thước ảnh tối đa 5MB')
      return false
    }

    return true
  }

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    
    // Check max images
    if (images.length + fileArray.length > maxImages) {
      toast.error(`Tối đa ${maxImages} ảnh`)
      return
    }

    // Validate and add files
    const validFiles = fileArray.filter(validateFile)
    if (validFiles.length === 0) return

    // Create preview URLs
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }))

    onChange([...images, ...newImages])
  }

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      let hasImage = false
      const files = []
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          hasImage = true
          const file = items[i].getAsFile()
          if (file) files.push(file)
        }
      }

      if (hasImage && files.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        handleFiles(files)
        toast.success(`Đã dán ${files.length} ảnh từ clipboard`)
      }
    }

    // Add listener to document for paste
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [images, maxImages, onChange, toast]) // Add all dependencies

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (index) => {
    const newImages = [...images]
    // Revoke object URL to free memory
    URL.revokeObjectURL(newImages[index].preview)
    newImages.splice(index, 1)
    onChange(newImages)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-3">
      {/* Hidden input to catch paste events */}
      <input
        type="text"
        className="sr-only"
        onPaste={(e) => {
          const items = e.clipboardData?.items
          if (!items) return

          const files = []
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile()
              if (file) files.push(file)
            }
          }

          if (files.length > 0) {
            e.preventDefault()
            handleFiles(files)
            toast.success(`Đã dán ${files.length} ảnh từ clipboard`)
          }
        }}
        placeholder="Paste images here"
      />
      
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-accent bg-accent/5'
              : 'border-[var(--border-base)] hover:border-accent/50 hover:bg-accent/5'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              {Icon.image}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-1)]">
                Kéo thả ảnh vào đây hoặc <span className="text-accent">chọn file</span>
              </p>
              <p className="text-xs text-[var(--text-3)] mt-1">
                JPG, PNG, GIF, WEBP - Tối đa 5MB - Tối đa {maxImages} ảnh
              </p>
              <p className="text-xs text-accent mt-1">
                💡 Hoặc Ctrl+V để dán ảnh từ clipboard
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-base)]">
              <img
                src={img.preview}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-2 rounded-full bg-danger text-white hover:bg-danger/90 transition-colors"
                >
                  {Icon.x}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                <p className="truncate">{img.name}</p>
                <p className="text-white/60">{formatFileSize(img.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-xs text-[var(--text-3)]">
          {images.length} / {maxImages} ảnh
        </p>
      )}
    </div>
  )
}
