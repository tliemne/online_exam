# Hướng dẫn dịch toàn bộ ứng dụng

## ✅ Đã hoàn tất
- AppLayout (sidebar, notifications)
- TeacherDashboard

## 📝 Cần dịch

### Teacher Pages (Ưu tiên cao)
- [ ] CoursesPage
- [ ] CourseDetailPage  
- [ ] ExamsPage
- [ ] ExamStatsPage
- [ ] QuestionsPage
- [ ] QuestionStatPage
- [ ] TagsPage
- [ ] TeacherGradingPage
- [ ] TeacherStatsPage

### Student Pages
- [ ] StudentDashboard
- [ ] StudentCoursesPage
- [ ] StudentExamsPage
- [ ] StudentResultsPage
- [ ] StudentSchedulePage
- [ ] StudentRankingsPage

### Admin Pages
- [ ] AdminDashboard
- [ ] AdminUsers
- [ ] AdminActivityLogPage

### Auth & Profile
- [ ] LoginPage
- [ ] RegisterPage
- [ ] ProfilePage

### Modals & Components
- [ ] ExamFormModal
- [ ] QuestionFormModal
- [ ] CourseFormModal
- [ ] ConfirmDialog
- [ ] DateTimePicker
- [ ] Pagination

## 🔧 Cách dịch một page

### Bước 1: Import useTranslation
```jsx
import { useTranslation } from 'react-i18next'

export default function MyPage() {
  const { t } = useTranslation()
  // ...
}
```

### Bước 2: Thay thế hardcoded text
```jsx
// ❌ Trước
<h1>Lớp học</h1>
<button>Tạo lớp</button>

// ✅ Sau
<h1>{t('course.title')}</h1>
<button>{t('course.createCourse')}</button>
```

### Bước 3: Thêm keys vào translation.json nếu chưa có

**vi/translation.json:**
```json
{
  "course": {
    "title": "Lớp học",
    "createCourse": "Tạo lớp"
  }
}
```

**en/translation.json:**
```json
{
  "course": {
    "title": "Courses",
    "createCourse": "Create Course"
  }
}
```

## 📋 Checklist cho mỗi page

- [ ] Import `useTranslation`
- [ ] Thêm `const { t } = useTranslation()`
- [ ] Tìm tất cả hardcoded Vietnamese text
- [ ] Thay bằng `t('key')`
- [ ] Thêm keys vào translation.json (vi + en)
- [ ] Test chuyển ngôn ngữ

## 🎯 Quy tắc đặt tên keys

- `common.*` - Text dùng chung (save, cancel, delete, etc.)
- `nav.*` - Navigation items
- `course.*` - Course related
- `exam.*` - Exam related
- `question.*` - Question related
- `user.*` - User related
- `stats.*` - Statistics
- `messages.*` - Success/error messages

## ⚠️ Lưu ý

1. **Không dịch:**
   - Tên người (user.fullName)
   - Email
   - Mã code (courseCode, examCode)
   - Số liệu (counts, scores)
   - Data từ database

2. **Cần dịch:**
   - Labels, buttons
   - Placeholders
   - Messages
   - Headers, titles
   - Navigation items

3. **Dynamic text:**
```jsx
// ✅ Đúng
<p>{t('stats.attempts')}: {count}</p>

// ❌ Sai
<p>{count} lượt thi</p>
```

## 🚀 Bắt đầu dịch

Tôi sẽ dịch từng page theo thứ tự ưu tiên. Mỗi lần commit sẽ dịch 1-2 pages để dễ review.
