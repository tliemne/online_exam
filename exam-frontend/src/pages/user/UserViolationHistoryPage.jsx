import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import axios from 'axios'

const Icon = {
  warning: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  stop: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
  ban: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
  info: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
}

function UserViolationHistoryPage() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    fetchViolationHistory()
  }, [page])

  const fetchViolationHistory = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/violations/history/my-violations', {
        params: { page, size: 10 }
      })
      setViolations(response.data.data.content || [])
      setTotalPages(response.data.data.totalPages || 0)
    } catch (error) {
      toast.error('Không thể tải lịch sử vi phạm')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'WARNING':
        return Icon.warning
      case 'MUTE':
        return Icon.stop
      case 'BAN':
        return Icon.ban
      case 'CONTENT_DELETED':
        return Icon.trash
      default:
        return Icon.info
    }
  }

  const getActionLabel = (actionType) => {
    const labels = {
      WARNING: 'Cảnh cáo',
      MUTE: 'Tạm khóa',
      BAN: 'Cấm vĩnh viễn',
      CONTENT_DELETED: 'Nội dung bị xóa'
    }
    return labels[actionType] || actionType
  }

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'WARNING':
        return 'bg-yellow/10 text-yellow border-yellow/20'
      case 'MUTE':
        return 'bg-orange/10 text-orange border-orange/20'
      case 'BAN':
        return 'bg-danger/10 text-danger border-danger/20'
      case 'CONTENT_DELETED':
        return 'bg-danger/10 text-danger border-danger/20'
      default:
        return 'bg-accent/10 text-accent border-accent/20'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (violation) => {
    if (!violation.expiresAt) return false
    return new Date(violation.expiresAt) < new Date()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Lịch sử vi phạm</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">
          Xem tất cả các cảnh cáo, tạm khóa và hành động khác liên quan đến tài khoản của bạn
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : violations.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-[var(--text-2)] font-medium">Không có vi phạm nào</p>
          <p className="text-sm text-[var(--text-3)] mt-2">Bạn đang tuân thủ tốt các quy tắc cộng đồng!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {violations.map(violation => (
            <div key={violation.id} className="card overflow-hidden">
              <div 
                className="p-5 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                onClick={() => setExpandedId(expandedId === violation.id ? null : violation.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-lg ${getActionColor(violation.actionType)}`}>
                      {getActionIcon(violation.actionType)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getActionColor(violation.actionType)}`}>
                        {getActionLabel(violation.actionType)}
                      </span>
                      {violation.actionType === 'MUTE' && !isExpired(violation) && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                          Đang hoạt động
                        </span>
                      )}
                      {violation.actionType === 'MUTE' && isExpired(violation) && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-success/10 text-success border border-success/20">
                          Đã hết hạn
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[var(--text-2)] font-medium mb-1">
                      {violation.reason}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-3)]">
                      <span>Ngày: {formatDate(violation.createdAt)}</span>
                      {violation.expiresAt && (
                        <span>Hết hạn: {formatDate(violation.expiresAt)}</span>
                      )}
                      <span>Admin: {violation.adminName}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <svg 
                      className={`w-5 h-5 text-[var(--text-3)] transition-transform ${expandedId === violation.id ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                    </svg>
                  </div>
                </div>
              </div>

              {expandedId === violation.id && (
                <div className="border-t border-[var(--border-base)] p-5 bg-[var(--bg-page)]">
                  <div className="space-y-4">
                    {violation.postTitle && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-3)] uppercase mb-1">Bài viết</p>
                        <p className="text-sm font-medium text-[var(--text-1)] mb-1">{violation.postTitle}</p>
                        <p className="text-sm text-[var(--text-2)] line-clamp-3">{violation.postContent}</p>
                      </div>
                    )}

                    {violation.replyContent && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-3)] uppercase mb-1">Bình luận</p>
                        <p className="text-sm text-[var(--text-2)] line-clamp-3">{violation.replyContent}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[var(--border-base)]">
                      <p className="text-xs font-semibold text-[var(--text-3)] uppercase mb-2">Chi tiết</p>
                      <div className="space-y-1 text-sm text-[var(--text-2)]">
                        <p>Loại vi phạm: <span className="font-medium">{getActionLabel(violation.actionType)}</span></p>
                        <p>Lý do: <span className="font-medium">{violation.reason}</span></p>
                        <p>Xử lý bởi: <span className="font-medium">{violation.adminName}</span></p>
                        <p>Ngày xử lý: <span className="font-medium">{formatDate(violation.createdAt)}</span></p>
                        {violation.expiresAt && (
                          <p>Hết hạn: <span className="font-medium">{formatDate(violation.expiresAt)}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-2 rounded font-medium transition-colors ${
                  page === i
                    ? 'bg-accent text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-1)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}

export default UserViolationHistoryPage
