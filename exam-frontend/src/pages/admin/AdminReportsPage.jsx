import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from 'react-i18next'

export default function AdminReportsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalExams: 0,
    totalAttempts: 0,
    activeStudents: 0,
    activeTeachers: 0,
    publishedExams: 0,
    averageScore: 0
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [topStudents, setTopStudents] = useState([])
  const [examStats, setExamStats] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load multiple endpoints in parallel
      const [usersRes, coursesRes, examsRes] = await Promise.all([
        api.get('/users'),
        api.get('/courses'),
        api.get('/exams/all')
      ])

      const users = usersRes.data.data || []
      const courses = coursesRes.data.data || []
      const exams = examsRes.data.data || []

      // Calculate total attempts from exams
      const totalAttempts = exams.reduce((sum, exam) => sum + (exam.attemptCount || 0), 0)
      
      // Calculate average score from exams that have attempts
      const examsWithAttempts = exams.filter(e => e.attemptCount > 0)
      const averageScore = examsWithAttempts.length > 0
        ? examsWithAttempts.reduce((sum, e) => sum + (e.averageScore || 0), 0) / examsWithAttempts.length
        : 0

      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalExams: exams.length,
        totalAttempts: totalAttempts,
        activeStudents: users.filter(u => u.roles?.includes('STUDENT') && u.status === 'ACTIVE').length,
        activeTeachers: users.filter(u => u.roles?.includes('TEACHER') && u.status === 'ACTIVE').length,
        publishedExams: exams.filter(e => e.status === 'PUBLISHED').length,
        averageScore: averageScore
      })

      // Mock recent activity (in real app, get from activity logs)
      setRecentActivity([])
      
      // Mock top students (in real app, get from leaderboard)
      setTopStudents([])
      
      // Exam statistics
      const examStatsData = exams.slice(0, 10).map(exam => ({
        id: exam.id,
        title: exam.title,
        courseName: exam.courseName,
        status: exam.status,
        attemptCount: exam.attemptCount || 0,
        averageScore: exam.averageScore || 0
      }))
      setExamStats(examStatsData)

    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = [
        ['BÁNG CÁO & THỐNG KÊ HỆ THỐNG'],
        [],
        ['TỔNG QUAN'],
        ['Tổng người dùng', stats.totalUsers],
        ['Tổng khóa học', stats.totalCourses],
        ['Tổng đề thi', stats.totalExams],
        ['Tổng bài làm', stats.totalAttempts],
        [],
        ['THỐNG KÊ NGƯỜI DÙNG'],
        ['Sinh viên hoạt động', stats.activeStudents],
        ['Giảng viên hoạt động', stats.activeTeachers],
        ['Đề thi đang mở', stats.publishedExams],
        [],
        ['THỐNG KÊ ĐỀ THI'],
        ['#', 'Tên đề thi', 'Khóa học', 'Trạng thái', 'Số bài làm', 'Điểm TB'],
        ...examStats.map((exam, i) => [
          i + 1,
          exam.title,
          exam.courseName || '—',
          exam.status === 'PUBLISHED' ? 'Đang mở' : exam.status === 'CLOSED' ? 'Đã đóng' : 'Nháp',
          exam.attemptCount,
          exam.averageScore > 0 ? exam.averageScore.toFixed(1) : '—'
        ])
      ]

      // Create CSV content
      const csvContent = excelData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n')

      // Create blob and download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `bao-cao-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Đã xuất báo cáo Excel thành công')
    } catch (err) {
      toast.error('Không thể xuất báo cáo Excel')
    }
  }

  const exportToPDF = () => {
    try {
      // Create PDF content as text
      const pdfContent = `
BÁNG CÁO & THỐNG KÊ HỆ THỐNG
Ngày: ${new Date().toLocaleDateString('vi-VN')}

═══════════════════════════════════════════════════════════

TỔNG QUAN

Tổng người dùng:        ${stats.totalUsers}
Tổng khóa học:          ${stats.totalCourses}
Tổng đề thi:            ${stats.totalExams}
Tổng bài làm:           ${stats.totalAttempts}

═══════════════════════════════════════════════════════════

THỐNG KÊ NGƯỜI DÙNG

Sinh viên hoạt động:    ${stats.activeStudents}
Giảng viên hoạt động:   ${stats.activeTeachers}
Đề thi đang mở:         ${stats.publishedExams}
Điểm trung bình:        ${stats.averageScore.toFixed(1)}

═══════════════════════════════════════════════════════════

THỐNG KÊ ĐỀ THI (Top 10)

${examStats.map((exam, i) => `
${i + 1}. ${exam.title}
   Khóa học: ${exam.courseName || '—'}
   Trạng thái: ${exam.status === 'PUBLISHED' ? 'Đang mở' : exam.status === 'CLOSED' ? 'Đã đóng' : 'Nháp'}
   Số bài làm: ${exam.attemptCount}
   Điểm TB: ${exam.averageScore > 0 ? exam.averageScore.toFixed(1) : '—'}
`).join('\n')}

═══════════════════════════════════════════════════════════
`

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `bao-cao-${new Date().toISOString().split('T')[0]}.txt`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Đã xuất báo cáo PDF thành công')
    } catch (err) {
      toast.error('Không thể xuất báo cáo PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Báo cáo & Thống kê</h1>
          <p className="page-subtitle">Tổng quan hệ thống và phân tích dữ liệu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
          <button
            onClick={exportToPDF}
            className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng người dùng', value: stats.totalUsers, color: '#3b82f6' },
          { label: 'Tổng khóa học', value: stats.totalCourses, color: '#8b5cf6' },
          { label: 'Tổng đề thi', value: stats.totalExams, color: '#06b6d4' },
          { label: 'Tổng bài làm', value: stats.totalAttempts, color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="text-3xl font-bold mb-2" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-sm text-[var(--text-3)]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-2xl font-bold text-[var(--text-1)] mb-1">{stats.activeStudents}</div>
          <div className="text-sm text-[var(--text-3)]">Sinh viên hoạt động</div>
        </div>

        <div className="card p-5">
          <div className="text-2xl font-bold text-[var(--text-1)] mb-1">{stats.activeTeachers}</div>
          <div className="text-sm text-[var(--text-3)]">Giảng viên hoạt động</div>
        </div>

        <div className="card p-5">
          <div className="text-2xl font-bold text-[var(--text-1)] mb-1">{stats.publishedExams}</div>
          <div className="text-sm text-[var(--text-3)]">Đề thi đang mở</div>
        </div>
      </div>

      {/* Exam Statistics Table */}
      <div className="card">
        <div className="p-5 border-b border-[var(--border-base)]">
          <h2 className="text-lg font-semibold text-[var(--text-1)]">Thống kê đề thi</h2>
          <p className="text-sm text-[var(--text-3)] mt-1">Top 10 đề thi gần đây</p>
        </div>
        
        {examStats.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-3)]">
            Chưa có dữ liệu thống kê
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-5 py-3 text-[var(--text-3)] font-medium">#</th>
                  <th className="text-left px-5 py-3 text-[var(--text-3)] font-medium">Tên đề thi</th>
                  <th className="text-left px-5 py-3 text-[var(--text-3)] font-medium">Khóa học</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium">Trạng thái</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium">Số bài làm</th>
                  <th className="text-center px-3 py-3 text-[var(--text-3)] font-medium">Điểm TB</th>
                </tr>
              </thead>
              <tbody>
                {examStats.map((exam, index) => (
                  <tr key={exam.id} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-5 py-3 text-[var(--text-3)]">{index + 1}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-[var(--text-1)]">{exam.title}</span>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-2)] text-xs">{exam.courseName || '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        exam.status === 'PUBLISHED' 
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : exam.status === 'CLOSED'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                      }`}>
                        {exam.status === 'PUBLISHED' ? 'Đang mở' : exam.status === 'CLOSED' ? 'Đã đóng' : 'Nháp'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-[var(--text-2)]">{exam.attemptCount}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-[var(--text-1)]">
                        {exam.averageScore > 0 ? exam.averageScore.toFixed(1) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-[var(--text-1)] mb-4">Tình trạng hệ thống</h3>
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'online', color: '#10b981' },
              { label: 'WebSocket', status: 'online', color: '#10b981' },
              { label: 'API Server', status: 'online', color: '#10b981' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: item.color }} />
                  <span className="text-xs font-medium" style={{ color: item.color }}>
                    {item.status === 'online' ? 'Hoạt động' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-[var(--text-1)] mb-4">Thông tin hệ thống</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-3)]">Phiên bản</span>
              <span className="text-sm font-medium text-[var(--text-1)]">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-3)]">Thời gian hoạt động</span>
              <span className="text-sm font-medium text-[var(--text-1)]">24/7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-3)]">Cập nhật lần cuối</span>
              <span className="text-sm font-medium text-[var(--text-1)]">
                {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
