import { createContext, useContext, useState, useEffect } from 'react'

// ── Translations nhúng thẳng vào — không cần file JSON ──
const translations = {
  vi: {
    nav: {
      dashboard: 'Dashboard', courses: 'Lớp học', questions: 'Ngân hàng đề',
      exams: 'Đề thi', users: 'Quản lý Users', results: 'Kết quả',
      profile: 'Hồ sơ', logout: 'Đăng xuất', collapse: 'Thu gọn'
    },
    role: { ADMIN: 'Quản trị viên', TEACHER: 'Giảng viên', STUDENT: 'Sinh viên' },
    common: {
      create: 'Tạo mới', edit: 'Sửa', delete: 'Xóa', save: 'Lưu', cancel: 'Hủy',
      search: 'Tìm kiếm', loading: 'Đang tải...', saving: 'Đang lưu...',
      refresh: 'Làm mới', confirm_delete: 'Bạn có chắc muốn xóa?',
      no_data: 'Không có dữ liệu', error: 'Có lỗi xảy ra', success: 'Thành công',
      all: 'Tất cả', close: 'Đóng', add: 'Thêm', import: 'Import',
      export: 'Export', preview: 'Xem trước', actions: 'Thao tác', total: 'Tổng cộng'
    },
    theme: { dark: 'Tối', light: 'Sáng', toggle: 'Giao diện' },
    lang: { vi: 'Tiếng Việt', en: 'English', toggle: 'Ngôn ngữ' },
    question: {
      title: 'Ngân hàng câu hỏi', create: 'Tạo câu hỏi', edit: 'Sửa câu hỏi',
      import: 'Import câu hỏi', no_questions: 'Chưa có câu hỏi nào',
      types: { MULTIPLE_CHOICE: 'Trắc nghiệm', TRUE_FALSE: 'Đúng / Sai', ESSAY: 'Tự luận' },
      difficulties: { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
    },
    exam: {
      title: 'Đề thi', create: 'Tạo đề thi',
      status: { DRAFT: 'Nháp', PUBLISHED: 'Đã mở', CLOSED: 'Đã đóng' },
      duration: 'Thời gian (phút)', total_score: 'Tổng điểm', pass_score: 'Điểm đạt'
    },
    course: {
      title: 'Lớp học', create: 'Tạo lớp mới', name: 'Tên lớp',
      no_courses: 'Chưa có lớp học nào', student_count: 'sinh viên'
    },
    profile: {
      title: 'Hồ sơ cá nhân', edit: 'Chỉnh sửa hồ sơ', dob: 'Ngày sinh',
      phone: 'Số điện thoại', student_code: 'Mã sinh viên', teacher_code: 'Mã giảng viên',
      department: 'Khoa', specialization: 'Chuyên ngành'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard', courses: 'Courses', questions: 'Question Bank',
      exams: 'Exams', users: 'Manage Users', results: 'Results',
      profile: 'Profile', logout: 'Logout', collapse: 'Collapse'
    },
    role: { ADMIN: 'Administrator', TEACHER: 'Teacher', STUDENT: 'Student' },
    common: {
      create: 'Create', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
      search: 'Search', loading: 'Loading...', saving: 'Saving...',
      refresh: 'Refresh', confirm_delete: 'Are you sure you want to delete?',
      no_data: 'No data available', error: 'An error occurred', success: 'Success',
      all: 'All', close: 'Close', add: 'Add', import: 'Import',
      export: 'Export', preview: 'Preview', actions: 'Actions', total: 'Total'
    },
    theme: { dark: 'Dark', light: 'Light', toggle: 'Theme' },
    lang: { vi: 'Tiếng Việt', en: 'English', toggle: 'Language' },
    question: {
      title: 'Question Bank', create: 'Create Question', edit: 'Edit Question',
      import: 'Import Questions', no_questions: 'No questions yet',
      types: { MULTIPLE_CHOICE: 'Multiple Choice', TRUE_FALSE: 'True / False', ESSAY: 'Essay' },
      difficulties: { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' }
    },
    exam: {
      title: 'Exams', create: 'Create Exam',
      status: { DRAFT: 'Draft', PUBLISHED: 'Published', CLOSED: 'Closed' },
      duration: 'Duration (min)', total_score: 'Total Score', pass_score: 'Pass Score'
    },
    course: {
      title: 'Courses', create: 'Create Course', name: 'Course Name',
      no_courses: 'No courses yet', student_count: 'students'
    },
    profile: {
      title: 'Profile', edit: 'Edit Profile', dob: 'Date of Birth',
      phone: 'Phone', student_code: 'Student ID', teacher_code: 'Teacher ID',
      department: 'Department', specialization: 'Specialization'
    }
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('ep_theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  )
  const [lang, setLang] = useState(() => localStorage.getItem('ep_lang') || 'vi')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ep_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('ep_lang', lang)
  }, [lang])

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark')
  const toggleLang  = () => setLang(p => p === 'vi' ? 'en' : 'vi')

  // t('nav.dashboard') => 'Dashboard'
  const t = (key) => {
    const parts = key.split('.')
    let val = translations[lang]
    for (const k of parts) {
      if (val == null) return key
      val = val[k]
    }
    return val ?? key
  }

  return (
    <SettingsContext.Provider value={{ theme, lang, toggleTheme, toggleLang, t }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
