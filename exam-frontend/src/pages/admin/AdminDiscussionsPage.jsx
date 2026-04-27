import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  const [confirmDialog, ConfirmDialogUI] = useConfirm()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="CLOSED">Đã đóng</option>
            <option value="">Tất cả</option>
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
    </div>
    </>
  )
}
