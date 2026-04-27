import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import axios from 'axios'

function AdminModerationPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionModal, setActionModal] = useState({ show: false, type: null })
  const [reason, setReason] = useState('')
  const [muteDays, setMuteDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchPendingReports()
  }, [])

  const fetchPendingReports = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/moderation/reports/pending')
      setReports(response.data.data.content || [])
    } catch (error) {
      toast.error('Không thể tải danh sách báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const openActionModal = (report, type) => {
    setSelectedReport(report)
    setActionModal({ show: true, type })
    setReason('')
    setMuteDays(7)
  }

  const closeModal = () => {
    setActionModal({ show: false, type: null })
    setSelectedReport(null)
    setReason('')
  }

  const handleAction = async (e) => {
    e.preventDefault()
    if (reason.length < 10) {
      toast.error('Lý do phải có ít nhất 10 ký tự')
      return
    }

    setSubmitting(true)
    try {
      const endpoint = `/api/admin/moderation/reports/${selectedReport.id}/${actionModal.type}`
      const payload = actionModal.type === 'mute' 
        ? { reason, muteDurationDays: muteDays }
        : { reason }
      
      await axios.post(endpoint, payload)
      toast.success('Đã xử lý thành công')
      closeModal()
      fetchPendingReports()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thực hiện')
    } finally {
      setSubmitting(false)
    }
  }

  const getActionLabel = (type) => {
    const labels = {
      dismiss: 'Bỏ qua',
      warn: 'Cảnh cáo',
      mute: 'Tạm khóa',
      ban: 'Cấm vĩnh viễn',
      'delete-content': 'Xóa nội dung'
    }
    return labels[type] || type
  }

  const getViolationLabel = (type) => {
    const labels = {
      SPAM: 'Spam',
      INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
      HARASSMENT: 'Quấy rối',
      OFF_TOPIC: 'Sai chủ đề',
      ABUSIVE_LANGUAGE: 'Ngôn từ thô tục',
      OTHER: 'Khác'
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Quản lý vi phạm</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">
          {reports.length} báo cáo đang chờ xử lý
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-2)]">Không có báo cáo nào đang chờ xử lý</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="card p-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                      {getViolationLabel(report.violationType)}
                    </span>
                    {report.reportCount > 1 && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                        {report.reportCount} báo cáo
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-[var(--text-1)] mb-2">
                    {report.postTitle || 'Reply'}
                  </h3>
                  <p className="text-sm text-[var(--text-3)] line-clamp-2 mb-3">
                    {report.postContent || report.replyContent}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[var(--text-3)] mb-3">
                    <span>Tác giả: <span className="font-medium text-[var(--text-2)]">{report.authorFullName}</span></span>
                    <span>Báo cáo bởi: <span className="font-medium text-[var(--text-2)]">{report.reporterUsername}</span></span>
                    <span>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {report.details && (
                    <div className="p-3 rounded bg-[var(--bg-page)] border border-[var(--border-base)] mb-3">
                      <p className="text-xs text-[var(--text-3)]">
                        <span className="font-semibold">Chi tiết:</span> {report.details}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => openActionModal(report, 'dismiss')}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Bỏ qua
                    </button>
                    <button 
                      onClick={() => openActionModal(report, 'warn')}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Cảnh cáo
                    </button>
                    <button 
                      onClick={() => openActionModal(report, 'mute')}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Tạm khóa
                    </button>
                    <button 
                      onClick={() => openActionModal(report, 'ban')}
                      className="text-xs px-3 py-1.5 rounded font-semibold bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    >
                      Cấm vĩnh viễn
                    </button>
                    <button 
                      onClick={() => openActionModal(report, 'delete-content')}
                      className="text-xs px-3 py-1.5 rounded font-semibold bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    >
                      Xóa nội dung
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actionModal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="section-title">
                {getActionLabel(actionModal.type)} - {selectedReport?.authorFullName}
              </h2>
              <button onClick={closeModal} className="btn-ghost p-1.5">
                ✕
              </button>
            </div>

            <form onSubmit={handleAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-1)] mb-2">
                  Lý do <span className="text-danger">*</span>
                </label>
                <textarea 
                  className="input-field resize-none"
                  rows={4}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Giải thích lý do bạn thực hiện hành động này..."
                  required
                  minLength={10}
                />
                <p className="text-xs text-[var(--text-3)] mt-1">{reason.length}/500 (tối thiểu 10)</p>
              </div>

              {actionModal.type === 'mute' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-1)] mb-2">
                    Thời gian khóa <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="input-field"
                    value={muteDays}
                    onChange={e => setMuteDays(Number(e.target.value))}
                  >
                    <option value={1}>1 ngày</option>
                    <option value={3}>3 ngày</option>
                    <option value={7}>7 ngày</option>
                    <option value={30}>30 ngày</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className={`btn-primary flex-1 ${
                    actionModal.type === 'ban' || actionModal.type === 'delete-content' 
                      ? 'bg-danger hover:bg-danger/90' 
                      : ''
                  }`}
                  disabled={submitting}
                >
                  {submitting ? 'Đang xử lý...' : `Xác nhận ${getActionLabel(actionModal.type).toLowerCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminModerationPage
