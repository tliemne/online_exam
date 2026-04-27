import { useState, useEffect } from 'react'
import axios from 'axios'

/**
 * Component hiển thị badge trạng thái vi phạm trên header
 * Hiển thị: Cảnh cáo, Tạm khóa, Cấm
 */
function ViolationStatusBadge() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkViolationStatus()
    // Cập nhật mỗi 2 phút
    const interval = setInterval(checkViolationStatus, 120000)
    return () => clearInterval(interval)
  }, [])

  const checkViolationStatus = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/violations/history/my-violations', {
        params: { page: 0, size: 1 }
      })
      
      const violations = response.data.data.content || []
      if (violations.length > 0) {
        const latestViolation = violations[0]
        
        // Chỉ hiển thị nếu là MUTE hoặc BAN
        if (latestViolation.actionType === 'MUTE' || latestViolation.actionType === 'BAN') {
          setStatus(latestViolation)
        } else {
          setStatus(null)
        }
      } else {
        setStatus(null)
      }
    } catch (error) {
      console.error('Error checking violation status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!status) return null

  const getStatusColor = () => {
    switch (status.actionType) {
      case 'MUTE':
        return 'bg-orange text-white'
      case 'BAN':
        return 'bg-danger text-white'
      default:
        return 'bg-accent text-white'
    }
  }

  const getStatusLabel = () => {
    switch (status.actionType) {
      case 'MUTE':
        return '🔇 Tạm khóa'
      case 'BAN':
        return '🚫 Bị cấm'
      default:
        return '⚠️ Vi phạm'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="group relative">
      <button
        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor()} hover:opacity-90 transition-opacity`}
        title={status.reason}
      >
        {getStatusLabel()}
      </button>

      {/* Tooltip */}
      <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-secondary)] rounded-lg shadow-lg border border-[var(--border-base)] p-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50 hidden group-hover:block">
        <p className="text-xs font-semibold text-[var(--text-1)] mb-1">
          {status.actionType === 'MUTE' ? 'Tạm khóa' : 'Cấm vĩnh viễn'}
        </p>
        <p className="text-xs text-[var(--text-2)] mb-2">
          {status.reason}
        </p>
        {status.expiresAt && (
          <p className="text-xs text-[var(--text-3)]">
            Hết hạn: {formatDate(status.expiresAt)}
          </p>
        )}
        <a
          href="/user/violations"
          className="text-xs text-accent hover:underline mt-2 inline-block"
        >
          Xem chi tiết →
        </a>
      </div>
    </div>
  )
}

export default ViolationStatusBadge
