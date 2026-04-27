import { useState } from 'react'
import { discussionApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'

export default function ReportButton({ postId, replyId, authorId, currentUserId, onReported }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [violationType, setViolationType] = useState('')
  const [details, setDetails] = useState('')
  const toast = useToast()

  // Không cho phép báo cáo chính mình
  const isOwnContent = authorId && currentUserId && authorId === currentUserId
  const isDisabled = isOwnContent || loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!violationType) {
      toast.error('Vui lòng chọn loại vi phạm')
      return
    }
    
    setLoading(true)
    try {
      if (replyId) {
        await discussionApi.reportReply(replyId, { violationType, details })
      } else {
        await discussionApi.reportPost(postId, { violationType, details })
      }
      toast.success('Đã gửi báo cáo')
      setShowModal(false)
      setViolationType('')
      setDetails('')
      if (onReported) onReported()
    } catch (err) {
      if (err.response?.data?.message?.includes('already reported')) {
        toast.warning('Bạn đã báo cáo nội dung này rồi')
      } else if (err.response?.data?.message?.includes('cannot report your own')) {
        toast.warning('Bạn không thể báo cáo bài viết của chính mình')
      } else {
        toast.error(err.response?.data?.message || 'Không thể gửi báo cáo')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        disabled={isDisabled}
        title={isOwnContent ? 'Bạn không thể báo cáo bài viết của chính mình' : ''}
        className={`font-semibold py-1 transition-colors ${
          isDisabled 
            ? 'text-[var(--text-4)] cursor-not-allowed opacity-50' 
            : 'text-[var(--text-3)] hover:text-danger'
        }`}
      >
        Báo cáo
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="section-title">Báo cáo vi phạm</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-1)] mb-2">
                  Loại vi phạm <span className="text-danger">*</span>
                </label>
                <select 
                  className="input-field"
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
                  required
                >
                  <option value="">-- Chọn loại vi phạm --</option>
                  <option value="SPAM">Spam</option>
                  <option value="INAPPROPRIATE_CONTENT">Nội dung không phù hợp</option>
                  <option value="HARASSMENT">Quấy rối</option>
                  <option value="OFF_TOPIC">Sai chủ đề</option>
                  <option value="ABUSIVE_LANGUAGE">Ngôn từ thô tục</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-1)] mb-2">
                  Chi tiết (Tùy chọn)
                </label>
                <textarea 
                  className="input-field resize-none"
                  rows={4}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Mô tả thêm về vi phạm..."
                  maxLength={500}
                />
                <p className="text-xs text-[var(--text-3)] mt-1">{details.length}/500</p>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 bg-danger hover:bg-danger/90"
                  disabled={loading}
                >
                  {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
