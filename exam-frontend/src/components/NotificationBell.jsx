import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/violations/history/my-violations', {
        params: { page: 0, size: 10 }
      })
      setNotifications(response.data.data.content || [])
      setUnreadCount(response.data.data.content?.length || 0)
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (type) => {
    switch (type) {
      case 'WARNING':
        return 'bg-yellow/10 text-yellow'
      case 'MUTE':
        return 'bg-orange/10 text-orange'
      case 'BAN':
        return 'bg-danger/10 text-danger'
      case 'CONTENT_DELETED':
        return 'bg-danger/10 text-danger'
      default:
        return 'bg-accent/10 text-accent'
    }
  }

  const getActionLabel = (type) => {
    const labels = {
      WARNING: 'Cảnh cáo',
      MUTE: 'Tạm khóa',
      BAN: 'Cấm vĩnh viễn',
      CONTENT_DELETED: 'Nội dung bị xóa'
    }
    return labels[type] || type
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins}m trước`
    if (diffHours < 24) return `${diffHours}h trước`
    if (diffDays < 7) return `${diffDays}d trước`
    
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        title="Thông báo vi phạm"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-secondary)] rounded-lg shadow-lg border border-[var(--border-base)] z-50">
          <div className="p-4 border-b border-[var(--border-base)]">
            <h3 className="font-semibold text-[var(--text-1)]">Thông báo vi phạm</h3>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--text-3)]">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <a
                  key={notification.id}
                  href="/admin/moderation"
                  className={`block p-4 border-b border-[var(--border-base)] hover:bg-[var(--bg-hover)] transition-colors ${!notification.isRead ? 'bg-accent/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${getActionColor(notification.actionType)}`}>
                      {getActionLabel(notification.actionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-1)]">
                        {notification.reason}
                      </p>
                      <p className="text-xs text-[var(--text-3)] mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-[var(--border-base)] text-center">
            <a
              href="/admin/moderation"
              className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Xem tất cả →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
