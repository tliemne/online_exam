import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function AdminTagsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10
  
  // Modals
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, tag: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tag: null })
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = () => {
    setLoading(true)
    api.get('/tags')
      .then(res => {
        const data = res.data.data || []
        setTags(data)
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Không thể tải danh sách tags')
      })
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên tag')
      return
    }
    
    setSubmitting(true)
    try {
      await api.post('/tags', formData)
      toast.success('Đã tạo tag thành công')
      loadTags()
      setCreateModal(false)
      setFormData({ name: '', description: '', color: '#3b82f6' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo tag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên tag')
      return
    }
    
    setSubmitting(true)
    try {
      await api.put(`/tags/${editModal.tag.id}`, formData)
      toast.success('Đã cập nhật tag thành công')
      loadTags()
      setEditModal({ open: false, tag: null })
      setFormData({ name: '', description: '', color: '#3b82f6' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật tag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.tag) return
    
    setSubmitting(true)
    try {
      await api.delete(`/tags/${deleteDialog.tag.id}`)
      toast.success('Đã xóa tag thành công')
      setDeleteDialog({ open: false, tag: null })
      loadTags() // Reload after closing dialog
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa tag')
      setDeleteDialog({ open: false, tag: null })
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' })
    setCreateModal(true)
  }

  const openEditModal = (tag) => {
    setFormData({ 
      name: tag.name, 
      description: tag.description || '', 
      color: tag.color || '#3b82f6' 
    })
    setEditModal({ open: true, tag })
  }

  // Filter tags
  const filteredTags = tags.filter(tag => {
    const search = searchTerm.toLowerCase()
    return (
      tag.name?.toLowerCase().includes(search) ||
      tag.description?.toLowerCase().includes(search)
    )
  })

  // Pagination
  const totalElements = filteredTags.length
  const totalPages = Math.ceil(totalElements / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTags = filteredTags.slice(startIndex, endIndex)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Quản lý Tags</h1>
          <p className="page-subtitle">Quản lý tất cả tags trong hệ thống</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo Tag
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-3)]">
          <span className="font-mono font-semibold text-[var(--text-1)]">{filteredTags.length}</span>
          tags
        </div>
      </div>

      {/* Tags Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedTags.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-3)]">
            {searchTerm ? 'Không tìm thấy tag nào' : 'Chưa có tag nào'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-8">#</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Tên Tag</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Mô tả</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Màu sắc</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Số câu hỏi</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTags.map((tag, index) => {
                  const globalIndex = startIndex + index + 1
                  return (
                    <tr key={tag.id} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-3)] text-xs">{globalIndex}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ background: tag.color || '#3b82f6' }}
                          />
                          <span className="font-medium text-[var(--text-1)]">{tag.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--text-2)] line-clamp-2 text-xs">
                          {tag.description || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-mono text-[var(--text-3)]">
                          {tag.color || '#3b82f6'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-2)]">
                          {tag.questionCount || 0}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(tag)}
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                            title="Sửa tag">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, tag })}
                            className="text-red-500 hover:text-red-600 transition-colors"
                            title="Xóa tag">
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

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Tạo Tag Mới</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Tên Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ví dụ: Java, Python, Database..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Mô tả về tag này..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Màu sắc
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input-field flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Sửa Tag</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Tên Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Màu sắc
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input-field flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, tag: null })}
                  className="btn-secondary flex-1"
                  disabled={submitting}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <ConfirmDialog
          title="Xác nhận xóa tag"
          message={`Bạn có chắc chắn muốn xóa tag "${deleteDialog.tag?.name || ''}"? ${deleteDialog.tag?.questionCount > 0 ? `Tag này đang được sử dụng bởi ${deleteDialog.tag.questionCount} câu hỏi.` : ''}`}
          confirmLabel={submitting ? "Đang xóa..." : "Xóa"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ open: false, tag: null })}
          danger
        />
      )}
    </div>
  )
}
