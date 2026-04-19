import { useState, useEffect } from 'react'
import api from '../../api/client'
import { courseApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function AdminCoursesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10
  
  // Modals
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, course: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, course: null })
  
  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', teacherIds: [] })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCourses()
    loadTeachers()
  }, [])

  const loadCourses = () => {
    setLoading(true)
    courseApi.getAll()
      .then(res => {
        const data = res.data.data || []
        setCourses(data)
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Không thể tải danh sách khóa học')
      })
      .finally(() => setLoading(false))
  }

  const loadTeachers = () => {
    api.get('/users')
      .then(res => {
        const users = res.data.data || []
        const teacherList = users.filter(u => u.roles?.includes('TEACHER') && u.status === 'ACTIVE')
        setTeachers(teacherList)
      })
      .catch(err => {
        toast.error('Không thể tải danh sách giảng viên')
      })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên khóa học')
      return
    }
    if (!formData.teacherIds || formData.teacherIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một giảng viên phụ trách')
      return
    }
    
    setSubmitting(true)
    try {
      await courseApi.create(formData)
      toast.success('Đã tạo khóa học thành công')
      loadCourses()
      setCreateModal(false)
      setFormData({ name: '', description: '', teacherIds: [] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo khóa học')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên khóa học')
      return
    }
    if (!formData.teacherIds || formData.teacherIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một giảng viên phụ trách')
      return
    }
    
    setSubmitting(true)
    try {
      await courseApi.update(editModal.course.id, formData)
      toast.success('Đã cập nhật khóa học thành công')
      loadCourses()
      setEditModal({ open: false, course: null })
      setFormData({ name: '', description: '', teacherIds: [] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật khóa học')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.course) return
    
    setSubmitting(true)
    try {
      await courseApi.delete(deleteDialog.course.id)
      toast.success('Đã xóa khóa học thành công')
      loadCourses()
      setDeleteDialog({ open: false, course: null })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa khóa học')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', description: '', teacherIds: [] })
    setCreateModal(true)
  }

  const openEditModal = (course) => {
    setFormData({ 
      name: course.name, 
      description: course.description || '',
      teacherIds: course.teachers?.map(t => t.id) || []
    })
    setEditModal({ open: true, course })
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const search = searchTerm.toLowerCase()
    return (
      course.name?.toLowerCase().includes(search) ||
      course.description?.toLowerCase().includes(search) ||
      course.createdBy?.fullName?.toLowerCase().includes(search)
    )
  })

  // Pagination
  const totalElements = filteredCourses.length
  const totalPages = Math.ceil(totalElements / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Quản lý khóa học</h1>
          <p className="page-subtitle">Quản lý tất cả khóa học trong hệ thống</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo khóa học
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-3)]">
          <span className="font-mono font-semibold text-[var(--text-1)]">{filteredCourses.length}</span>
          khóa học
        </div>
      </div>

      {/* Courses Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedCourses.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[var(--text-3)]">
            {searchTerm ? 'Không tìm thấy khóa học nào' : 'Chưa có khóa học nào'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium w-8">#</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Tên khóa học</th>
                  <th className="text-left px-4 py-3 text-[var(--text-3)] font-medium">Mô tả</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Giảng viên</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Sinh viên</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Người tạo</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-32">Ngày tạo</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.map((course, index) => {
                  const globalIndex = startIndex + index + 1
                  return (
                    <tr key={course.id} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-3)] text-xs">{globalIndex}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-1)]">{course.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--text-2)] line-clamp-2 text-xs">
                          {course.description || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col gap-0.5">
                          {course.teachers?.length > 0 ? (
                            course.teachers.map((teacher, idx) => (
                              <span key={idx} className="text-xs text-[var(--text-2)]">
                                {teacher.fullName}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--text-3)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-2)]">
                          {course.students?.length || 0}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-2)]">
                          {course.createdBy?.fullName || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-[var(--text-3)]">
                          {course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(course)}
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                            title="Sửa khóa học"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ open: true, course })}
                            className="text-red-500 hover:text-red-600 transition-colors"
                            title="Xóa khóa học"
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

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Tạo khóa học mới</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Tên khóa học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ví dụ: Lập trình Java cơ bản"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Giảng viên phụ trách <span className="text-red-500">*</span>
                </label>
                <div className="border border-[var(--border-base)] rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {teachers.length === 0 ? (
                    <p className="text-xs text-[var(--text-3)]">Không có giảng viên nào</p>
                  ) : (
                    teachers.map(teacher => (
                      <label key={teacher.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-elevated)] p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.teacherIds.includes(teacher.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, teacherIds: [...formData.teacherIds, teacher.id] })
                            } else {
                              setFormData({ ...formData, teacherIds: formData.teacherIds.filter(id => id !== teacher.id) })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[var(--text-1)]">
                          {teacher.fullName} <span className="text-[var(--text-3)]">({teacher.username})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {formData.teacherIds.length > 0 && (
                  <p className="text-xs text-accent mt-2">Đã chọn {formData.teacherIds.length} giảng viên</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  rows={4}
                  placeholder="Mô tả về khóa học..."
                />
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
                  {submitting ? 'Đang tạo...' : 'Tạo khóa học'}
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
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>Sửa khóa học</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Tên khóa học <span className="text-red-500">*</span>
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
                  Giảng viên phụ trách <span className="text-red-500">*</span>
                </label>
                <div className="border border-[var(--border-base)] rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {teachers.length === 0 ? (
                    <p className="text-xs text-[var(--text-3)]">Không có giảng viên nào</p>
                  ) : (
                    teachers.map(teacher => (
                      <label key={teacher.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-elevated)] p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.teacherIds.includes(teacher.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, teacherIds: [...formData.teacherIds, teacher.id] })
                            } else {
                              setFormData({ ...formData, teacherIds: formData.teacherIds.filter(id => id !== teacher.id) })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[var(--text-1)]">
                          {teacher.fullName} <span className="text-[var(--text-3)]">({teacher.username})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {formData.teacherIds.length > 0 && (
                  <p className="text-xs text-accent mt-2">Đã chọn {formData.teacherIds.length} giảng viên</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full"
                  rows={4}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, course: null })}
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
          title="Xác nhận xóa khóa học"
          message={`Bạn có chắc chắn muốn xóa khóa học "${deleteDialog.course?.name || ''}"? Tất cả đề thi, câu hỏi và dữ liệu liên quan sẽ bị xóa vĩnh viễn.`}
          confirmLabel={submitting ? "Đang xóa..." : "Xóa"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ open: false, course: null })}
          danger
        />
      )}
    </div>
  )
}
