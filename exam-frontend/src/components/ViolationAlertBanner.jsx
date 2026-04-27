import { useState, useEffect } from 'react'
import axios from 'axios'

const Icon = {
  warning: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  stop: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
  ban: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
  close: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  info: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
}

/**
 * Component hiển thị banner cảnh báo khi user bị cảnh cáo/mute/ban
 * Hiển thị ở đầu trang
 */
function ViolationAlertBanner() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    fetchLatestViolations()
    // Cập nhật mỗi 5 phút
    const interval = setInterval(fetchLatestViolations, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchLatestViolations = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/violations/history/my-violations', {
        params: { page: 0, size: 5 }
      })
      const violations = response.data.data.content || []
      
      // Lọc chỉ lấy vi phạm gần đây (trong 7 ngày)
      const recentViolations = violations.filter(v => {
        const createdDate = new Date(v.createdAt)
        const now = new Date()
        const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24)
        return diffDays <= 7
      })
      
      setViolations(recentViolations)
    } catch (error) {
      console.error('Error fetching violations:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (violationId) => {
    setDismissed(new Set([...dismissed, violationId]))
  }

  const getAlertColor = (actionType) => {
    switch (actionType) {
      case 'WARNING':
        return 'bg-yellow/10 border-yellow/30 text-yellow'
      case 'MUTE':
        return 'bg-orange/10 border-orange/30 text-orange'
      case 'BAN':
        return 'bg-danger/10 border-danger/30 text-danger'
      case 'CONTENT_DELETED':
        return 'bg-danger/10 border-danger/30 text-danger'
      default:
        return 'bg-accent/10 border-accent/30 text-accent'
    }
  }

  const getAlertIcon = (actionType) => {
    switch (actionType) {
      case 'WARNING':
        return Icon.warning
      case 'MUTE':
        return Icon.stop
      case 'BAN':
        return Icon.ban
      case 'CONTENT_DELETED':
        return Icon.info
      default:
        return Icon.info
    }
  }

  const getAlertTitle = (actionType) => {
    switch (actionType) {
      case 'WARNING':
        return '⚠️ Bạn đã nhận cảnh cáo'
      case 'MUTE':
        return '🔇 Tài khoản đang bị tạm khóa'
      case 'BAN':
        return '🚫 Tài khoản bị cấm vĩnh viễn'
      case 'CONTENT_DELETED':
        return '🗑️ Nội dung của bạn bị xóa'
      default:
        return '📢 Thông báo'
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

  // Lọc chỉ hiển thị những cái chưa dismiss
  const visibleViolations = violations.filter(v => !dismissed.has(v.id))

  if (visibleViolations.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visibleViolations.map(violation => (
        <div
          key={violation.id}
          className={`border-l-4 rounded-lg p-4 flex items-start gap-4 ${getAlertColor(violation.actionType)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getAlertIcon(violation.actionType)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">
              {getAlertTitle(violation.actionType)}
            </h3>
            
            <p className="text-sm opacity-90 mb-2">
              {violation.reason}
            </p>

            <div className="flex flex-wrap gap-3 text-xs opacity-75">
              <span>Ngày: {formatDate(violation.createdAt)}</span>
              {violation.expiresAt && (
                <span>
                  Hết hạn: {formatDate(violation.expiresAt)}
                  {isExpired(violation) && <span className="ml-1">(Đã hết hạn)</span>}
                </span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href="/user/violations"
                className="text-xs font-medium underline hover:opacity-75 transition-opacity"
              >
                Xem chi tiết →
              </a>
            </div>
          </div>

          <button
            onClick={() => dismissAlert(violation.id)}
            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            title="Đóng"
          >
            {Icon.close}
          </button>
        </div>
      ))}
    </div>
  )
}

export default ViolationAlertBanner
