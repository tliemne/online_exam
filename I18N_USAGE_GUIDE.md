# Hướng dẫn sử dụng i18n (Đa ngôn ngữ)

## 1. Cài đặt

Đã cài đặt xong. Chỉ cần chạy:
```bash
npm install
```

## 2. Cấu trúc thư mục

```
exam-frontend/
├── src/
│   ├── i18n/
│   │   └── config.js          # Cấu hình i18n
│   ├── components/
│   │   └── common/
│   │       └── LanguageSwitcher.jsx  # Component chuyển ngôn ngữ
│   └── main.jsx               # Import i18n config
└── public/
    └── locales/
        ├── vi/
        │   └── translation.json
        ├── en/
        │   └── translation.json
        ├── es/
        │   └── translation.json
        ├── fr/
        │   └── translation.json
        └── zh/
            └── translation.json
```

## 3. Cách sử dụng trong Components

### Cách 1: Sử dụng hook `useTranslation()`

```jsx
import { useTranslation } from 'react-i18next'

export default function MyComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <p>{t('course.title')}</p>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
    </div>
  )
}
```

### Cách 2: Sử dụng `withTranslation()` (Class components)

```jsx
import { withTranslation } from 'react-i18next'

class MyComponent extends React.Component {
  render() {
    const { t } = this.props
    return <h1>{t('common.save')}</h1>
  }
}

export default withTranslation()(MyComponent)
```

## 4. Thêm ngôn ngữ mới

### Bước 1: Tạo file translation
Tạo file `exam-frontend/public/locales/[lang-code]/translation.json`

Ví dụ: `exam-frontend/public/locales/ja/translation.json` (Tiếng Nhật)

### Bước 2: Cập nhật LanguageSwitcher.jsx

```jsx
const languages = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },  // ← Thêm dòng này
]
```

## 5. Cấu trúc translation.json

```json
{
  "common": {
    "save": "Lưu",
    "cancel": "Hủy"
  },
  "course": {
    "title": "Lớp học",
    "createCourse": "Tạo lớp"
  }
}
```

**Quy tắc đặt tên:**
- Sử dụng camelCase cho keys
- Nhóm theo chức năng (common, course, exam, etc.)
- Tránh sử dụng ký tự đặc biệt

## 6. Sử dụng biến trong translation

```json
{
  "messages": {
    "welcome": "Chào mừng {{name}}"
  }
}
```

```jsx
const { t } = useTranslation()
<p>{t('messages.welcome', { name: 'John' })}</p>
// Output: "Chào mừng John"
```

## 7. Sử dụng Pluralization

```json
{
  "items": {
    "one": "1 mục",
    "other": "{{count}} mục"
  }
}
```

```jsx
const { t } = useTranslation()
<p>{t('items', { count: 5 })}</p>
// Output: "5 mục"
```

## 8. Thêm LanguageSwitcher vào Layout

```jsx
import LanguageSwitcher from './components/common/LanguageSwitcher'

export default function Layout() {
  return (
    <header>
      <nav>
        {/* ... other nav items ... */}
        <LanguageSwitcher />
      </nav>
    </header>
  )
}
```

## 9. Lấy ngôn ngữ hiện tại

```jsx
const { i18n } = useTranslation()
console.log(i18n.language) // 'vi', 'en', etc.
```

## 10. Thay đổi ngôn ngữ lập trình

```jsx
const { i18n } = useTranslation()

// Thay đổi ngôn ngữ
i18n.changeLanguage('en')

// Lấy ngôn ngữ hiện tại
const currentLang = i18n.language
```

## 11. Lưu ngôn ngữ được chọn

Ngôn ngữ được chọn sẽ tự động lưu vào localStorage, nên khi người dùng quay lại, ngôn ngữ sẽ được khôi phục.

## 12. Ví dụ đầy đủ

```jsx
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/common/LanguageSwitcher'

export default function CoursesPage() {
  const { t } = useTranslation()

  return (
    <div>
      <header>
        <h1>{t('course.title')}</h1>
        <LanguageSwitcher />
      </header>
      
      <button>{t('course.createCourse')}</button>
      <p>{t('course.noCourses')}</p>
    </div>
  )
}
```

## 13. Kiểm tra

1. Chạy `npm run dev`
2. Mở browser
3. Chọn ngôn ngữ từ dropdown
4. Trang sẽ tự động cập nhật

## 14. Troubleshooting

**Vấn đề:** Không thấy text dịch
- Kiểm tra key có đúng không (case-sensitive)
- Kiểm tra file translation.json có tồn tại không
- Kiểm tra console có lỗi không

**Vấn đề:** Ngôn ngữ không lưu
- Kiểm tra localStorage có bị disable không
- Kiểm tra browser console

**Vấn đề:** Thay đổi ngôn ngữ không cập nhật
- Kiểm tra component có sử dụng `useTranslation()` không
- Kiểm tra component có re-render không

## 15. Tiếp theo

Bây giờ bạn có thể:
1. Thêm LanguageSwitcher vào header/navbar
2. Cập nhật tất cả text trong components để sử dụng `t()`
3. Thêm ngôn ngữ mới khi cần
4. Dịch tất cả các trang sang các ngôn ngữ khác
