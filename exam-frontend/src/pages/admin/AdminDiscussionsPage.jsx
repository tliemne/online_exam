import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../components/common/ConfirmDialog'
import api from '../../api/client'

const Icon = {
  search:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>,
  filter:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>,
  trash:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>,
  eye:      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  chevron:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>,
}

function Skeleton({ w = 'w-full', h = 'h-4' }) {
  return <span className={`inline-block rounded animate-pulse ${w} ${h}`}
    style={{ background: 'var(--bg-elevated)' }}/>
}

export default function AdminDiscussionsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Đọc query param ?tab=moderation để tự chuyển tab đúng
  const queryTab = new URLSearchParams(location.search).get('tab')
  const [activeTab, setActiveTab] = useState(queryTab === 'moderation' ? 'moderation' : 'discussions')
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE')
  const [courses, setCourses] = useState([])
  
  // Pagination
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Load courses for filter
  useEffect(() => {
    api.get('/courses')
      .then(r => setCourses(r.data.data || []))
      .catch(e => console.error('Failed to load courses:', e))
  }, [])

  // Load discussions
  useEffect(() => {
    loadDiscussions()
  }, [page, selectedCourse, selectedStatus, searchQuery])

  const loadDiscussions = () => {
    setLoading(true)
    setError(null)
    
    const params = {
      page,
      size: 20,
      status: selectedStatus,
    }
    if (selectedCourse) params.courseId = selectedCourse
    if (searchQuery.trim()) params.query = searchQuery.trim()

    api.get('/api/admin/discussions', { params })
      .then(r => {
        const data = r.data.data
        setPosts(data.content || [])
        setTotalPages(data.totalPages || 0)
        setTotalElements(data.totalElements || 0)
      })
      .catch(e => setError(e?.response?.data?.message || 'Không tải được dữ liệu'))
      .finally(() => setLoading(false))
  }

  const handleDelete = async (post) => {
    const ok = await confirmDialog({
      title: `Xác nhận xóa bài viết "${post.title}"?`,
      message: `Tác giả: ${post.author?.fullName || post.author?.username}\n\nThao tác này sẽ xóa:\n- Bài viết\n- Tất cả phản hồi\n- Tất cả votes\n- Tất cả attachments\n\nKhông thể hoàn tác!`,
      danger: true,
      confirmLabel: 'Xóa'
    })
    
    if (!ok) return

    try {
      await api.delete(`/discussions/${post.id}`)
      alert('Đã xóa bài viết thành công')
      loadDiscussions()
    } catch (e) {
      alert(e?.response?.data?.message || 'Xóa thất bại')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    loadDiscussions()
  }

  return (
    <>
    {ConfirmDialogUI}
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Quản lý diễn đàn</h1>
        <p className="page-subtitle">
          Moderation toàn hệ thống - Xem và xóa bài viết vi phạm
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-base)]">
        <button
          onClick={() => setActiveTab('discussions')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'discussions'
              ? 'border-accent text-accent'
              : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
          }`}
        >
          Danh sách bài viết
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'moderation'
              ? 'border-accent text-accent'
              : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
          }`}
        >
          Báo cáo vi phạm
        </button>
      </div>

      {activeTab === 'discussions' ? (
        <>
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm border"
              style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)', color: '#dc2626' }}>
              {error}
            </div>
          )}

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
              {Icon.search}
            </span>
          </div>
          <button type="submit" className="btn-primary px-4">
            Tìm
          </button>
        </form>

        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); setPage(0) }}
            className="input"
            style={{ width: '200px' }}
          >
            <option value="">Tất cả khóa học</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(0) }}
            className="input"
            style={{ width: '150px' }}
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="DELETED">Đã xóa</option>
          </select>

          <div className="text-sm flex items-center gap-2 ml-auto" style={{ color: 'var(--text-3)' }}>
            {Icon.filter}
            <span>Tìm thấy {totalElements} bài viết</span>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="card-bare">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-base)' }}>
          <h2 className="section-title">Danh sách bài viết</h2>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton w="w-20" h="h-5"/>
                <Skeleton w="w-full" h="h-5"/>
                <Skeleton w="w-24" h="h-5"/>
              </div>
            ))}
          </div>
        ) : !posts.length ? (
          <p className="text-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
            Không tìm thấy bài viết nào
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-base)' }}>
                    {['Tiêu đề', 'Khóa học', 'Tác giả', 'Phản hồi', 'Votes', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} className="table-row">
                      <td className="td">
                        <span className="font-medium" style={{ color: 'var(--text-1)' }}>
                          {post.title}
                        </span>
                        {post.isPinned && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                            style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                            📌 Ghim
                          </span>
                        )}
                      </td>
                      <td className="td" style={{ color: 'var(--text-2)' }}>
                        {post.courseName}
                      </td>
                      <td className="td" style={{ color: 'var(--text-2)' }}>
                        {post.author?.fullName || post.author?.username || '—'}
                      </td>
                      <td className="td text-center" style={{ color: 'var(--text-2)' }}>
                        {post.replyCount || 0}
                      </td>
                      <td className="td text-center font-mono" style={{ color: 'var(--text-2)' }}>
                        {post.voteCount || 0}
                      </td>
                      <td className="td">
                        <span className={post.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}>
                          {post.status === 'ACTIVE' ? 'Hoạt động' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className="td text-xs" style={{ color: 'var(--text-3)' }}>
                        {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="td">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleDelete(post)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            style={{ color: '#dc2626' }}
                            title="Xóa bài viết"
                          >
                            {Icon.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderTop: '1px solid var(--border-base)' }}>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  Trang {page + 1} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </>
      ) : (
        <AdminModerationContent />
      )}
    </div>
    </>
  )
}

// Moderation Tab Content Component
function AdminModerationContent() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionModal, setActionModal] = useState({ show: false, type: null })
  const [reason, setReason] = useState('')
  const [muteDays, setMuteDays] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const toast = { error: (msg) => alert(msg), success: (msg) => alert(msg) }

  useEffect(() => {
    fetchPendingReports()
  }, [])

  const fetchPendingReports = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/admin/moderation/reports/pending')
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
      
      await api.post(endpoint, payload)
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

  const IconMod = {
    check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
    warning: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
    stop: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
    ban: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
    trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>,
    x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-3)]">
        {reports.length} báo cáo đang chờ xử lý
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin"/>
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-2)]">Không có báo cáo nào đang chờ xử lý</p>
        </div>
      ) : (
        reports.map(report => (
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
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    {IconMod.check} Bỏ qua
                  </button>
                  <button 
                    onClick={() => openActionModal(report, 'warn')}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    {IconMod.warning} Cảnh cáo
                  </button>
                  <button 
                    onClick={() => openActionModal(report, 'mute')}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    {IconMod.stop} Tạm khóa
                  </button>
                  <button 
                    onClick={() => openActionModal(report, 'ban')}
                    className="text-xs px-3 py-1.5 rounded font-semibold bg-danger/10 text-danger hover:bg-danger/20 transition-colors flex items-center gap-1"
                  >
                    {IconMod.ban} Cấm vĩnh viễn
                  </button>
                  <button 
                    onClick={() => openActionModal(report, 'delete-content')}
                    className="text-xs px-3 py-1.5 rounded font-semibold bg-danger/10 text-danger hover:bg-danger/20 transition-colors flex items-center gap-1"
                  >
                    {IconMod.trash} Xóa nội dung
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {actionModal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="section-title">
                {getActionLabel(actionModal.type)} - {selectedReport?.authorFullName}
              </h2>
              <button onClick={closeModal} className="btn-ghost p-1.5">
                {IconMod.x}
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
