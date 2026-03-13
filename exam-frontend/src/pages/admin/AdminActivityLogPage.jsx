import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'

// ── Icons ─────────────────────────────────────────────────
const Icon = {
  search: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  filter: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>,
  chevLeft: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>,
  chevRight: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>,
}

// ── Action badge color map ────────────────────────────────
const ACTION_COLOR = {
  LOGIN:            'bg-emerald-500/15 text-emerald-400',
  LOGOUT:           'bg-slate-500/15 text-slate-400',
  CREATE_EXAM:      'bg-blue-500/15 text-blue-400',
  UPDATE_EXAM:      'bg-amber-500/15 text-amber-400',
  DELETE_EXAM:      'bg-red-500/15 text-red-400',
  PUBLISH_EXAM:     'bg-violet-500/15 text-violet-400',
  CLOSE_EXAM:       'bg-orange-500/15 text-orange-400',
  CREATE_QUESTION:  'bg-blue-500/15 text-blue-400',
  UPDATE_QUESTION:  'bg-amber-500/15 text-amber-400',
  DELETE_QUESTION:  'bg-red-500/15 text-red-400',
  CREATE_COURSE:    'bg-teal-500/15 text-teal-400',
  UPDATE_COURSE:    'bg-amber-500/15 text-amber-400',
  DELETE_COURSE:    'bg-red-500/15 text-red-400',
  ADD_STUDENT:      'bg-emerald-500/15 text-emerald-400',
  REMOVE_STUDENT:   'bg-red-500/15 text-red-400',
  SUBMIT_ATTEMPT:   'bg-cyan-500/15 text-cyan-400',
  GRADE_ATTEMPT:    'bg-indigo-500/15 text-indigo-400',
  CREATE_TAG:       'bg-pink-500/15 text-pink-400',
  UPDATE_TAG:       'bg-amber-500/15 text-amber-400',
  DELETE_TAG:       'bg-red-500/15 text-red-400',
  CREATE_USER:      'bg-blue-500/15 text-blue-400',
  DELETE_USER:      'bg-red-500/15 text-red-400',
}

const ACTION_LABEL = {
  LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất',
  CREATE_EXAM: 'Tạo đề', UPDATE_EXAM: 'Sửa đề', DELETE_EXAM: 'Xóa đề',
  PUBLISH_EXAM: 'Publish', CLOSE_EXAM: 'Đóng đề',
  CREATE_QUESTION: 'Tạo câu hỏi', UPDATE_QUESTION: 'Sửa câu hỏi', DELETE_QUESTION: 'Xóa câu hỏi',
  CREATE_COURSE: 'Tạo lớp', UPDATE_COURSE: 'Sửa lớp', DELETE_COURSE: 'Xóa lớp',
  ADD_STUDENT: 'Thêm SV', REMOVE_STUDENT: 'Xóa SV',
  SUBMIT_ATTEMPT: 'Nộp bài', GRADE_ATTEMPT: 'Chấm điểm',
  CREATE_TAG: 'Tạo tag', UPDATE_TAG: 'Sửa tag', DELETE_TAG: 'Xóa tag',
  CREATE_USER: 'Tạo user', DELETE_USER: 'Xóa user',
}

const ALL_ACTIONS = [
  'LOGIN', 'LOGOUT',
  'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE', 'ADD_STUDENT', 'REMOVE_STUDENT',
  'CREATE_EXAM', 'UPDATE_EXAM', 'DELETE_EXAM', 'PUBLISH_EXAM', 'CLOSE_EXAM',
  'CREATE_QUESTION', 'UPDATE_QUESTION', 'DELETE_QUESTION',
  'CREATE_TAG', 'UPDATE_TAG', 'DELETE_TAG',
]

function ActionBadge({ action }) {
  const color = ACTION_COLOR[action] || 'bg-slate-500/15 text-slate-400'
  const label = ACTION_LABEL[action] || action
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function formatDateTime(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

export default function AdminActivityLogPage() {
  const toast = useToast()

  // ── Filter state ──────────────────────────────────────
  const [keyword, setKeyword]   = useState('')
  const [action,  setAction]    = useState('')
  const [from,    setFrom]      = useState('')
  const [to,      setTo]        = useState('')
  const [page,    setPage]      = useState(0)
  const SIZE = 20

  // ── Data state ────────────────────────────────────────
  const [logs,       setLogs]       = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [loading,    setLoading]    = useState(false)

  // ── Fetch ─────────────────────────────────────────────
  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = {
        page: p,
        size: SIZE,
        ...(keyword && { keyword }),
        ...(action  && { action  }),
        ...(from    && { from: from + ':00' }),
        ...(to      && { to:   to   + ':59' }),
      }
      const res = await adminApi.getLogs(params)
      const data = res.data.data
      setLogs(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalItems(data.totalElements || 0)
    } catch {
      toast.error('Không thể tải nhật ký hoạt động')
    } finally {
      setLoading(false)
    }
  }, [page, keyword, action, from, to])

  useEffect(() => { fetchLogs(page) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchLogs(0)
  }

  const handleReset = () => {
    setKeyword(''); setAction(''); setFrom(''); setTo('')
    setPage(0)
    setTimeout(() => fetchLogs(0), 50)
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Nhật ký hoạt động</h1>
          <p className="page-subtitle">Theo dõi tất cả hoạt động trong hệ thống</p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="btn-ghost flex items-center gap-2 px-3 py-2"
          disabled={loading}
        >
          <span className={loading ? 'animate-spin' : ''}>{Icon.refresh}</span>
          Làm mới
        </button>
      </div>

      {/* Filter */}
      <form onSubmit={handleSearch}
        className="card p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-2)' }}>
          {Icon.filter}
          <span>Bộ lọc</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
              {Icon.search}
            </span>
            <input
              className="input-field pl-9 w-full"
              placeholder="Username / mô tả..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>

          {/* Action */}
          <select
            className="input-field w-full"
            value={action}
            onChange={e => setAction(e.target.value)}
          >
            <option value="">-- Tất cả hành động --</option>
            {ALL_ACTIONS.map(a => (
              <option key={a} value={a}>{ACTION_LABEL[a]} ({a})</option>
            ))}
          </select>

          {/* From */}
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-3)' }}>Từ ngày</label>
            <input
              type="datetime-local"
              className="input-field w-full"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>

          {/* To */}
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-3)' }}>Đến ngày</label>
            <input
              type="datetime-local"
              className="input-field w-full"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={loading}>
            {Icon.search} <span className="ml-1">Tìm kiếm</span>
          </button>
          <button type="button" onClick={handleReset} className="btn-ghost px-4 py-2 text-sm">
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* Stats bar */}
      {!loading && (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Tìm thấy <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{totalItems}</span> bản ghi
          {totalPages > 1 && ` — trang ${page + 1}/${totalPages}`}
        </p>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--text-3)' }}>
            <p className="text-lg">Không có dữ liệu</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc làm mới trang</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-base)' }}>
                  {['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'Mô tả', 'IP'].map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--text-3)', background: 'var(--bg-elevated)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id}
                    style={{
                      borderBottom: '1px solid var(--border-base)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)'
                    }}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-3)' }}>
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-xs" style={{ color: 'var(--text-1)' }}>
                        {log.username}
                      </div>
                      {log.fullName && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {log.fullName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-2)' }}>
                      {log.targetType
                        ? <span>{log.targetType}{log.targetId ? ` #${log.targetId}` : ''}</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>
                      }
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-xs line-clamp-2" style={{ color: 'var(--text-2)' }}>
                        {log.description || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="btn-ghost p-2 disabled:opacity-40"
          >
            {Icon.chevLeft}
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p
            if (totalPages <= 7) p = i
            else if (page < 4)   p = i
            else if (page > totalPages - 5) p = totalPages - 7 + i
            else p = page - 3 + i
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm transition-colors ${
                  p === page
                    ? 'btn-primary'
                    : 'btn-ghost'
                }`}
              >
                {p + 1}
              </button>
            )
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="btn-ghost p-2 disabled:opacity-40"
          >
            {Icon.chevRight}
          </button>
        </div>
      )}
    </div>
  )
}
