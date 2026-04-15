import { useState, useRef } from 'react'
import { useToast } from '../../context/ToastContext'

const Icon = {
  file: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
}

export default function FileUploader({ files, onChange, maxFiles = 3 }) {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file) => {
    // Check file type
    const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']
    const extension = file.name.split('.').pop().toLowerCase()
    
    if (!validExtensions.includes(extension)) {
      toast.error('Chỉ chấp nhận file: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR')
      return false
    }

    // Check file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Kích thước file tối đa 10MB')
      return false
    }

    return true
  }

  const handleFiles = (fileList) => {
    const fileArray = Array.from(fileList)
    
    // Check max files
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Tối đa ${maxFiles} file`)
      return
    }

    // Validate and add files
    const validFiles = fileArray.filter(validateFile)
    if (validFiles.length === 0) return

    // Create file objects
    const newFiles = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
    }))

    onChange([...files, ...newFiles])
  }

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

  const removeFile = (index) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onChange(newFiles)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    const colors = {
      pdf: 'text-red-500 bg-red-50',
      doc: 'text-blue-500 bg-blue-50',
      docx: 'text-blue-500 bg-blue-50',
      xls: 'text-green-500 bg-green-50',
      xlsx: 'text-green-500 bg-green-50',
      ppt: 'text-orange-500 bg-orange-50',
      pptx: 'text-orange-500 bg-orange-50',
      zip: 'text-purple-500 bg-purple-50',
      rar: 'text-purple-500 bg-purple-50',
      txt: 'text-gray-500 bg-gray-50',
    }
    return colors[ext] || 'text-gray-500 bg-gray-50'
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
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
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              {Icon.file}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-1)]">
                Kéo thả file vào đây hoặc <span className="text-accent">chọn file</span>
              </p>
              <p className="text-xs text-[var(--text-3)] mt-1">
                PDF, DOC, XLS, PPT, TXT, ZIP - Tối đa 10MB - Tối đa {maxFiles} file
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-base)] group">
              <div className={`${getFileIcon(file.name)} p-2 rounded-lg shrink-0`}>
                {Icon.file}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-1)] truncate">{file.name}</p>
                <p className="text-xs text-[var(--text-3)]">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1.5 rounded-full hover:bg-danger/10 text-danger transition-colors opacity-0 group-hover:opacity-100"
              >
                {Icon.x}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Count */}
      {files.length > 0 && (
        <p className="text-xs text-[var(--text-3)]">
          {files.length} / {maxFiles} file
        </p>
      )}
    </div>
  )
}
