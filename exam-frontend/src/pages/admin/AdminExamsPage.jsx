import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function AdminExamsPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, DRAFT, PUBLISHED, CLOSED
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({ open: false, exam: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = () => {
    setLoading(true)
    // Admin endpoint to get all exams
    api.get('/exams/all')
      .then(res => {
        const data = res.data.data || []
        setExams(data)
      })
      .catch(err => {
        showToast(err.response?.data?.message || 'Không thể tải danh sách đề thi', 'error')
      })
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    if (!deleteDialog.exam) return
    
    setDeleting(true)
    try {
      await api.delete(`/exams/${deleteDialog.exam.id}`)
      showToast('Đã xóa đề thi thành công', 'success')
      loadExams()
      setDeleteDialog({ open: false, exam: null })
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xóa đề thi', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const search = searchTerm.toLowerCase()
    const matchSearch = (
      exam.title?.toLowerCase().includes(search) ||
      exam.courseName?.toLowerCase().includes(search) ||
      exam.createdByName?.toLowerCase().includes(search)
    )
    const matchStatus = statusFilter === 'ALL' || exam.status === statusFilter
    return matchSearch && matchStatus
  })

  // Pagination
  const totalElements = filteredExams.length
  const totalPages = Math.ceil(totalElements / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedExams = filteredExams.slice(startIndex, endIndex)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, statusFilter])

  // Status badge
  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { label: 'Nháp', class: 'bg-gray-500/15 text-gray-400 border border-gray-500/30' },
      PUBLISHED: { label: 'Đang mở', class: 'bg-green-500/15 text-green-400 border border-green-500/30' },
      CLOSED: { label: 'Đã đóng', class: 'bg-red-500/15 text-red-400 border border-red-500/30' },
    }
    const badge = badges[status] || badges.DRAFT
    return <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>{badge.label}</span>
  }

  // Stats
  const stats = {
    total: exams.length,
    draft: exams.filter(e => e.status === 'DRAFT').length,
    published: exams.filter(e => e.status === 'PUBLISHED').length,
    closed: exams.filter(e => e.status === 'CLOSED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Quản lý đề thi</h1>
          <p className="page-subtitle">Quản lý tất cả đề thi trong hệ thống</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng đề thi', value: stats.total, color: 'var(--accent)' },
          { label: 'Nháp', value: stats.draft, color: '#6b7280' },
          { label: 'Đang mở', value: stats.published, color: '#16a34a' },
          { label: 'Đã đóng', value: stats.closed, color: '#dc2626' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-[var(--text-3)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-2 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-lg p-1">
          {[
            ['ALL', 'Tất cả'],
            ['DRAFT', 'Nháp'],
            ['PUBLISHED', 'Đang mở'],
            ['CLOSED', 'Đã đóng'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === value
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-sm text-[var(--text-3)]">
          <span className="font-mono font-semibold text-[var(--text-1)]">{filteredExams.length}</span> đề thi
        </div>
      </div>

      {/* Exams Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedExams.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-3)]">
            {searchTerm || statusFilter !== 'ALL' ? 'Không tìm thấy đề thi nào' : 'Chưa có đề thi nào'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-8">#</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Tên đề thi</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Khóa học</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Trạng thái</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Thời gian</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Câu hỏi</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Người tạo</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Ngày tạo</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExams.map((exam, index) => {
                  const globalIndex = startIndex + index + 1
                  return (
                    <tr key={exam.id} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-3)] text-xs">{globalIndex}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-1)]">{exam.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--text-2)] text-xs">{exam.courseName || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {getStatusBadge(exam.status)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-2)]">{exam.durationMinutes} phút</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-2)]">{exam.questionCount || 0}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-2)]">{exam.createdByName || '—'}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-3)]">
                          {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDeleteDialog({ open: true, exam })}
                            className="text-red-500 hover:text-red-600 transition-colors"
                            title="Xóa đề thi"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            size={pageSize}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <ConfirmDialog
          title="Xác nhận xóa đề thi"
          message={`Bạn có chắc chắn muốn xóa đề thi "${deleteDialog.exam?.title || ''}"? Tất cả bài làm và dữ liệu liên quan sẽ bị xóa vĩnh viễn.`}
          confirmLabel={deleting ? "Đang xóa..." : "Xóa"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ open: false, exam: null })}
          danger
        />
      )}
    </div>
  )
}
