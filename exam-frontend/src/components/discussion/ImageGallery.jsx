import { useState } from 'react'
import { discussionApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'

const Icon = {
  x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  chevronLeft: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
  chevronRight: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>,
}

export default function ImageGallery({ attachments, canDelete, onDelete }) {
  const toast = useToast()
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (!attachments || attachments.length === 0) return null

  const images = attachments.filter(a => a.fileType === 'IMAGE')
  if (images.length === 0) return null

  console.log('ImageGallery - Images to display:', images.map(img => ({
    id: img.id,
    filename: img.originalFilename,
    thumbnailUrl: discussionApi.getThumbnailUrl(img.id)
  })))

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return
    setDeleting(attachmentId)
    try {
      await discussionApi.deleteAttachment(attachmentId)
      toast.success('Đã xóa ảnh')
      onDelete?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa ảnh')
    } finally {
      setDeleting(null)
    }
  }

  const openLightbox = (index) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const nextImage = () => setLightboxIndex((lightboxIndex + 1) % images.length)
  const prevImage = () => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)

  // Grid layout based on number of images
  const getGridClass = () => {
    if (images.length === 1) return 'grid-cols-1 max-w-md'
    if (images.length === 2) return 'grid-cols-2 max-w-lg'
    return 'grid-cols-2 md:grid-cols-3 max-w-2xl'
  }

  return (
    <>
      {/* Image Grid */}
      <div className={`grid ${getGridClass()} gap-2 mt-3`}>
        {images.map((img, idx) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-base)] max-h-48">
            <img
              src={discussionApi.getThumbnailUrl(img.id)}
              alt={img.originalFilename}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openLightbox(idx)}
              onError={(e) => {
                console.error('Failed to load image:', img.id, discussionApi.getThumbnailUrl(img.id))
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E'
              }}
            />
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(img.id)
                }}
                disabled={deleting === img.id}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/90 disabled:opacity-50"
              >
                {Icon.trash}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
          >
            {Icon.x}
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              >
                {Icon.chevronLeft}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              >
                {Icon.chevronRight}
              </button>
            </>
          )}

          <div className="max-w-7xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={discussionApi.getAttachmentUrl(images[lightboxIndex].id)}
              alt={images[lightboxIndex].originalFilename}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4 text-white">
              <p className="text-sm">{images[lightboxIndex].originalFilename}</p>
              {images.length > 1 && (
                <p className="text-xs text-white/60 mt-1">{lightboxIndex + 1} / {images.length}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
