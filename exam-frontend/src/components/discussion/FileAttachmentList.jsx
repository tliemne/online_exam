import { discussionApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'
import { useState } from 'react'

const Icon = {
  pdf: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>,
  doc: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h3"/></svg>,
  xls: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>,
  ppt: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M10 13h4v4h-4z"/></svg>,
  zip: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M12 11v6M10 13h4M10 15h4"/></svg>,
  txt: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 9h6M9 13h6M9 17h6"/></svg>,
  file: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>,
  download: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
}

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: { icon: Icon.pdf, color: 'text-red-500', bg: 'bg-red-50' },
    doc: { icon: Icon.doc, color: 'text-blue-500', bg: 'bg-blue-50' },
    docx: { icon: Icon.doc, color: 'text-blue-500', bg: 'bg-blue-50' },
    xls: { icon: Icon.xls, color: 'text-green-500', bg: 'bg-green-50' },
    xlsx: { icon: Icon.xls, color: 'text-green-500', bg: 'bg-green-50' },
    ppt: { icon: Icon.ppt, color: 'text-orange-500', bg: 'bg-orange-50' },
    pptx: { icon: Icon.ppt, color: 'text-orange-500', bg: 'bg-orange-50' },
    zip: { icon: Icon.zip, color: 'text-purple-500', bg: 'bg-purple-50' },
    rar: { icon: Icon.zip, color: 'text-purple-500', bg: 'bg-purple-50' },
    txt: { icon: Icon.txt, color: 'text-gray-500', bg: 'bg-gray-50' },
  }
  return iconMap[ext] || { icon: Icon.file, color: 'text-gray-500', bg: 'bg-gray-50' }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function FileAttachmentList({ attachments, canDelete, onDelete }) {
  const toast = useToast()
  const [deleting, setDeleting] = useState(null)

  if (!attachments || attachments.length === 0) return null

  const files = attachments.filter(a => a.fileType === 'DOCUMENT' || a.fileType === 'OTHER')
  if (files.length === 0) return null

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return
    setDeleting(attachmentId)
    try {
      await discussionApi.deleteAttachment(attachmentId)
      toast.success('Đã xóa file')
      onDelete?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa file')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (attachment) => {
    const url = discussionApi.getAttachmentUrl(attachment.id)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.originalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-2 mt-3">
      {files.map((file) => {
        const { icon, color, bg } = getFileIcon(file.originalFilename)
        return (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-page)] transition-colors group"
          >
            {/* File Icon */}
            <div className={`${bg} ${color} p-2 rounded-lg shrink-0`}>
              {icon}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-1)] truncate">
                {file.originalFilename}
              </p>
              <p className="text-xs text-[var(--text-3)]">
                {formatFileSize(file.fileSize)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownload(file)}
                className="p-2 rounded-full hover:bg-accent/10 text-accent transition-colors"
                title="Tải xuống"
              >
                {Icon.download}
              </button>
              {canDelete && (
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deleting === file.id}
                  className="p-2 rounded-full hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  {Icon.trash}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
