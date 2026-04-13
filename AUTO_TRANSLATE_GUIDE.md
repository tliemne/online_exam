# Hướng dẫn sử dụng Auto-Translate

## 🌐 Tính năng

Tự động dịch dữ liệu từ backend (tiếng Việt) sang ngôn ngữ khác khi người dùng chuyển đổi ngôn ngữ.

## 📦 Đã cài đặt

- ✅ Translation Service (LibreTranslate API - miễn phí)
- ✅ Cache system (localStorage)
- ✅ React Hooks để dễ sử dụng

## 🚀 Cách sử dụng

### 1. Dịch một đoạn text đơn giản

```jsx
import { useTranslateText } from '../hooks/useAutoTranslate'

function MyComponent() {
  const courseName = "Lập trình Java"
  const translatedName = useTranslateText(courseName)
  
  return <h1>{translatedName}</h1>
  // Khi chuyển sang English → "Java Programming"
}
```

### 2. Dịch một object

```jsx
import { useAutoTranslate } from '../hooks/useAutoTranslate'

function CourseCard({ course }) {
  const { data: translatedCourse, loading } = useAutoTranslate(
    course,
    ['name', 'description'] // Các field cần dịch
  )
  
  if (loading) return <div>Đang dịch...</div>
  
  return (
    <div>
      <h2>{translatedCourse.name}</h2>
      <p>{translatedCourse.description}</p>
    </div>
  )
}
```

### 3. Dịch một array of objects

```jsx
import { useAutoTranslate } from '../hooks/useAutoTranslate'

function CourseList() {
  const [courses, setCourses] = useState([])
  
  // Fetch data từ backend
  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data.data))
  }, [])
  
  // Tự động dịch
  const { data: translatedCourses, loading } = useAutoTranslate(
    courses,
    ['name', 'description', 'teacher'] // Các field cần dịch
  )
  
  if (loading) return <div>Đang dịch...</div>
  
  return (
    <div>
      {translatedCourses.map(course => (
        <div key={course.id}>
          <h3>{course.name}</h3>
          <p>{course.description}</p>
          <span>Giảng viên: {course.teacher}</span>
        </div>
      ))}
    </div>
  )
}
```

### 4. Ví dụ thực tế: TeacherDashboard

```jsx
import { useAutoTranslate } from '../hooks/useAutoTranslate'

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    api.get('/dashboard/teacher').then(r => setStats(r.data.data))
  }, [])
  
  // Tự động dịch courseStats
  const { data: translatedStats } = useAutoTranslate(
    stats?.courseStats || [],
    ['courseName'] // Dịch tên lớp
  )
  
  return (
    <div>
      {translatedStats.map(course => (
        <div key={course.courseId}>
          <h3>{course.courseName}</h3>
          <p>Lượt thi: {course.attemptCount}</p>
        </div>
      ))}
    </div>
  )
}
```

## ⚙️ Cấu hình

### Thay đổi API dịch

Mặc định sử dụng LibreTranslate (miễn phí). Nếu muốn dùng API khác, sửa file `translationService.js`:

```js
// Google Translate API (trả phí)
const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2'

// DeepL API (miễn phí 500k ký tự/tháng)
const DEEPL_API = 'https://api-free.deepl.com/v2/translate'
```

### Clear cache

```js
import translationService from '../services/translationService'

// Xóa cache khi cần
translationService.clearCache()
```

## 🎯 Các field nên dịch

**Courses:**
- `name` - Tên lớp
- `description` - Mô tả

**Exams:**
- `title` - Tên đề thi
- `description` - Mô tả

**Questions:**
- `text` - Nội dung câu hỏi
- `explanation` - Giải thích

**Users:**
- `fullName` - Họ tên (không nên dịch)
- `bio` - Tiểu sử

## ⚠️ Lưu ý

1. **Không dịch:**
   - Tên người (fullName, username)
   - Email
   - Số điện thoại
   - Mã code (courseCode, examCode)
   - Số liệu (score, count, etc.)

2. **Performance:**
   - Lần đầu dịch sẽ chậm (gọi API)
   - Lần sau nhanh hơn (đã cache)
   - Nên dịch ít field nhất có thể

3. **Chất lượng dịch:**
   - LibreTranslate: Tốt, miễn phí
   - Google Translate: Rất tốt, trả phí
   - DeepL: Tốt nhất, miễn phí 500k ký tự/tháng

## 🔧 Troubleshooting

**Vấn đề:** Dịch chậm
- **Giải pháp:** Giảm số field cần dịch, hoặc dùng API trả phí

**Vấn đề:** Dịch sai
- **Giải pháp:** Clear cache và thử lại

**Vấn đề:** API bị block
- **Giải pháp:** Đổi sang API khác hoặc self-host LibreTranslate

## 📝 TODO

- [ ] Cập nhật TeacherDashboard để dịch courseStats
- [ ] Cập nhật CoursesPage để dịch course names
- [ ] Cập nhật ExamsPage để dịch exam titles
- [ ] Cập nhật QuestionsPage để dịch question text
- [ ] Thêm loading indicator khi đang dịch
- [ ] Thêm error handling khi API fail
