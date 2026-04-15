# 🎨 Teacher Dashboard - Discussion Stats Redesign

## 🎯 Mục Tiêu

Thay đổi phần thống kê discussion trong Teacher Dashboard để:
- ✅ Khoa học và hợp lý hơn
- ✅ Hiển thị **Top người đóng góp** (bất kể role) thay vì chỉ "SV tích cực"
- ✅ Có biểu đồ bar mini để dễ so sánh
- ✅ Không dùng icon AI/emoji
- ✅ Phù hợp với giao diện hiện tại

---

## 📊 Layout Mới

### **Trước:**
```
[4 cards ngang: Bài viết | Phản hồi | Đã trả lời | SV tích cực]
```

### **Sau:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Warning Card (nếu có câu hỏi chưa trả lời)               │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────┐
│ 3 Stat Cards     │  Top Người Đóng Góp (với biểu đồ bar)   │
│ (vertical)       │  - Rank badges (1,2,3)                   │
│                  │  - Progress bars                          │
│ • Bài viết       │  - Posts + Replies count                 │
│ • Phản hồi       │  - Total contributions                    │
│ • Đã trả lời     │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 🎨 Design Details

### **1. Warning Card** (không đổi)
- Hiển thị khi có câu hỏi chưa trả lời
- Màu warning (vàng/cam)
- Button "Xem câu hỏi"

### **2. Stat Cards** (3 cards vertical)
```
┌─────────────────┐
│ [Icon] Bài viết │
│   150           │
│ Trong các khóa  │
└─────────────────┘
┌─────────────────┐
│ [Icon] Phản hồi │
│   450           │
│ Tổng số phản hồi│
└─────────────────┘
┌─────────────────┐
│ [Icon] Đã trả   │
│   145           │
│ 97% bài viết    │
└─────────────────┘
```

**Features:**
- Icon với background color 20% opacity
- Số lớn (text-2xl)
- Label và sub-label
- Hover effect: shadow-md

### **3. Top Contributors List** (2 columns)

```
┌────────────────────────────────────────────────┐
│ Top người đóng góp                             │
│ Tài khoản tích cực nhất trong các khóa của bạn│
├────────────────────────────────────────────────┤
│ [1] Nguyễn Văn A              125 đóng góp     │
│     50 bài viết · 75 phản hồi                  │
│     ████████████████████████████████ 100%      │
│                                                 │
│ [2] Trần Thị B                 98 đóng góp     │
│     40 bài viết · 58 phản hồi                  │
│     ████████████████████████ 78%               │
│                                                 │
│ [3] Lê Văn C                   85 đóng góp     │
│     35 bài viết · 50 phản hồi                  │
│     ████████████████████ 68%                   │
│                                                 │
│ [4] Phạm Thị D                 72 đóng góp     │
│     30 bài viết · 42 phản hồi                  │
│     ████████████████ 58%                       │
│                                                 │
│ [5] Hoàng Văn E                65 đóng góp     │
│     28 bài viết · 37 phản hồi                  │
│     ████████████ 52%                           │
└────────────────────────────────────────────────┘
```

**Features:**
- **Rank badges**: 
  - #1: Vàng (#d97706)
  - #2: Xám (#6b7280)
  - #3: Nâu (#92400e)
  - #4-5: Text-3
- **User info**:
  - Full name (bold, truncate)
  - Posts + Replies count (small text)
- **Progress bar**:
  - Gradient color theo rank
  - Width = percentage so với top 1
  - Smooth animation (duration-500)
- **Total contributions**:
  - Số lớn (text-lg, bold)
  - Label "đóng góp"

---

## 🔧 Implementation

### **Backend Changes**

#### `DiscussionStatsService.java`
- Removed logic tìm "top student"
- Simplified `getTeacherStats()` - chỉ trả về basic stats
- Top contributors được lấy từ `getCourseForumStats()` (đã có sẵn)

### **Frontend Changes**

#### `TeacherDashboard.jsx`
1. **Added `TopContributors` component**:
   - Fetch tất cả courses của teacher
   - Gọi `/courses/{id}/discussions/stats` cho mỗi course
   - Merge contributors từ tất cả courses
   - Sort và lấy top 5
   - Render với rank badges + progress bars

2. **Updated layout**:
   - Grid: 1 column (3 stat cards) + 2 columns (top contributors)
   - Responsive: Stack vertical trên mobile

3. **Styling**:
   - Rank colors: Gold, Silver, Bronze
   - Progress bars với gradient
   - Smooth animations
   - Hover effects

---

## 📊 Data Flow

```
Teacher Dashboard
    ↓
GET /dashboard/discussion/teacher
    → Basic stats (posts, replies, answered, unanswered)
    ↓
GET /courses/teacher
    → List of teacher's courses
    ↓
For each course:
    GET /courses/{id}/discussions/stats
        → mostActiveStudents (top 5 per course)
    ↓
Merge all contributors
    ↓
Sort by totalContributions
    ↓
Take top 5
    ↓
Render with progress bars
```

---

## 🎨 Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| **Rank #1** | `#d97706` (Orange) | Badge + Progress bar |
| **Rank #2** | `#6b7280` (Gray) | Badge + Progress bar |
| **Rank #3** | `#92400e` (Brown) | Badge + Progress bar |
| **Rank #4-5** | `var(--text-3)` | Badge + Progress bar |
| **Posts** | `#7551FF` (Purple) | Icon background |
| **Replies** | `#16a34a` (Green) | Icon background |
| **Answered** | `#01B574` (Success) | Icon background |

---

## ✨ Features

### **Rank Badges**
- Circular badges với số thứ tự
- Color-coded (gold, silver, bronze)
- 20% opacity background

### **Progress Bars**
- Width = percentage so với top 1 (100%)
- Gradient color theo rank
- Smooth animation (500ms)
- Rounded corners

### **User Info**
- Full name (truncate nếu quá dài)
- Posts + Replies breakdown
- Total contributions (lớn, bold)

### **Responsive**
- Desktop: 3 cards + list side-by-side
- Mobile: Stack vertical

---

## 🚀 Benefits

### **Khoa học hơn**
- ✅ Hiển thị **tất cả tài khoản** tham gia, không chỉ sinh viên
- ✅ Có breakdown: posts + replies
- ✅ Có biểu đồ để dễ so sánh

### **Đẹp mắt hơn**
- ✅ Rank badges với màu sắc phân biệt
- ✅ Progress bars với gradient
- ✅ Smooth animations
- ✅ Không dùng emoji/AI icons

### **Hợp lý hơn**
- ✅ Teacher có thể thấy ai đang tích cực nhất
- ✅ Merge data từ tất cả courses
- ✅ Top 5 thay vì chỉ 1 người

---

## 📝 Notes

### **Performance**
- Gọi API cho mỗi course (có thể chậm nếu nhiều courses)
- Có thể optimize bằng cách:
  - Cache results
  - Batch API calls
  - Server-side aggregation

### **Edge Cases**
- Nếu không có courses → Hiển thị "Chưa có dữ liệu"
- Nếu không có contributors → Hiển thị "Chưa có dữ liệu"
- Nếu API fail → Graceful fallback

### **Future Improvements**
- Filter by date range
- Export to CSV
- Click to view user profile
- Show trend (up/down arrows)

---

**Status**: ✅ HOÀN THÀNH
**Date**: 2026-04-15
**Files Changed**: 2 files (1 Service, 1 Dashboard)
