# Hướng Dẫn Thống Kê Discussion Forum Theo Role

## 📊 Tổng Quan

Chức năng Discussion/Q&A Forum đã được implement hoàn chỉnh với các tính năng:
- ✅ Tạo bài viết, trả lời (nested replies - vô hạn cấp)
- ✅ Like/Dislike system
- ✅ Best answer marking
- ✅ Notifications
- ✅ Permissions (Admin, Teacher, Student)

## 🎯 Thống Kê Theo Role

### 1️⃣ ADMIN Dashboard

**Mục đích**: Giám sát toàn bộ hoạt động discussion trong hệ thống

**Thống kê nên hiển thị**:

#### A. System Overview (Cards)
- 📝 **Tổng bài viết**: Tổng số discussion posts trong hệ thống
- 💬 **Tổng phản hồi**: Tổng số replies
- ❓ **Bài chưa trả lời**: Số posts chưa có best answer
- 📈 **Hoạt động tuần này**: Posts + replies trong 7 ngày qua

#### B. Top Active Users (Table/List)
- Top 5-10 users có nhiều posts + replies nhất
- Hiển thị: Avatar, Name, Post count, Reply count, Total activity
- Có thể click vào để xem profile

#### C. Top Courses by Discussion (Table)
- Top 5-10 courses có nhiều discussion nhất
- Hiển thị: Course name, Post count, Reply count, Student count
- Có thể click vào để xem course detail

#### D. Discussion Growth Chart
- Line/Bar chart hiển thị số lượng posts + replies theo tháng (6 tháng gần nhất)
- Giúp admin thấy xu hướng tăng/giảm

**API Endpoint đề xuất**: `/api/admin/discussion/stats`

---

### 2️⃣ TEACHER Dashboard

**Mục đích**: Quản lý discussion trong các khóa học mình dạy

**Thống kê nên hiển thị**:

#### A. My Courses Discussion Overview (Cards)
- 📝 **Bài viết trong khóa của tôi**: Tổng posts trong các courses mình dạy
- 💬 **Phản hồi**: Tổng replies
- ⚠️ **Cần trả lời**: Số posts chưa có best answer (QUAN TRỌNG - cần nổi bật)
- 📊 **TB phản hồi/bài**: Average replies per post

#### B. Unanswered Questions (Priority Table)
- **Top 5-10 câu hỏi chưa được trả lời** trong courses của teacher
- Hiển thị: Title, Course, Author, Created date, Reply count
- Sắp xếp theo: Mới nhất hoặc ít reply nhất
- **Action button**: "Trả lời ngay" → Navigate to post detail
- **Màu sắc**: Highlight bằng màu warning/danger để thu hút attention

#### C. Top Active Students (List)
- Top 5 students tích cực nhất trong courses của teacher
- Hiển thị: Avatar, Name, Post count, Reply count
- Giúp teacher biết students nào engage nhiều

#### D. Course Discussion Activity (Table)
- Breakdown theo từng course mình dạy
- Hiển thị: Course name, Posts, Replies, Unanswered
- Có thể click vào để xem discussion của course đó

**API Endpoint đề xuất**: `/api/teacher/discussion/stats`

**Lưu ý quan trọng**:
- Teacher cần **dễ dàng nhìn thấy câu hỏi chưa trả lời** để kịp thời support students
- Có thể thêm notification badge khi có câu hỏi mới chưa trả lời

---

### 3️⃣ STUDENT Dashboard

**Mục đích**: Theo dõi hoạt động discussion của bản thân và khóa học

**Thống kê nên hiển thị**:

#### A. My Discussion Activity (Cards)
- 📝 **Bài viết của tôi**: Số posts đã tạo
- 💬 **Phản hồi của tôi**: Số replies đã viết
- 👍 **Tổng likes nhận được**: Tổng likes trên posts + replies
- ⭐ **Best answers**: Số replies được chọn là best answer
- 📈 **Hoạt động tuần này**: Posts + replies trong 7 ngày qua

#### B. My Recent Posts (List)
- 5 bài viết gần nhất của student
- Hiển thị: Title, Course, Reply count, Like count, Has best answer
- Click để xem chi tiết

#### C. Trending Discussions (List)
- Top 5 discussions hot nhất trong các courses student đang học
- Sắp xếp theo: Likes + Replies (activity score)
- Giúp student tham gia vào discussions sôi nổi

#### D. My Ranking in Courses (Cards/Table)
- Xếp hạng của student trong từng course theo discussion activity
- Hiển thị: Course name, My rank, Total students, My activity score
- **Gamification**: Tạo động lực cho students tham gia nhiều hơn

#### E. Unanswered Questions I Can Help (Optional)
- Câu hỏi chưa trả lời trong courses student đang học
- Khuyến khích students giúp đỡ lẫn nhau

**API Endpoint đề xuất**: `/api/student/discussion/stats`

**Lưu ý quan trọng**:
- Student dashboard nên có **yếu tố gamification** (ranking, badges)
- Khuyến khích **peer-to-peer learning** (students giúp students)

---

## 🎨 UI/UX Recommendations

### Color Coding
- 🟢 **Green**: Positive metrics (high activity, best answers)
- 🟡 **Yellow/Orange**: Needs attention (unanswered questions)
- 🔵 **Blue**: Neutral info (total counts)
- 🔴 **Red**: Urgent (old unanswered questions)

### Layout Suggestions
1. **Cards**: Cho các metrics đơn giản (counts, percentages)
2. **Tables**: Cho danh sách có nhiều columns (courses, users, posts)
3. **Charts**: Cho trends theo thời gian
4. **Lists**: Cho top items (top users, trending posts)

### Interactive Elements
- **Click-through**: Mọi item nên có thể click để xem chi tiết
- **Tooltips**: Giải thích các metrics
- **Filters**: Cho phép filter theo time range (7 days, 30 days, all time)
- **Refresh button**: Cập nhật stats real-time

---

## 🔧 Implementation Priority

### Phase 1 (Essential)
1. ✅ Discussion forum feature (DONE)
2. Teacher: Unanswered questions widget
3. Student: My activity summary

### Phase 2 (Important)
4. Admin: System overview stats
5. Teacher: Course breakdown
6. Student: My ranking

### Phase 3 (Nice to have)
7. Charts and trends
8. Top users/courses
9. Gamification elements

---

## 📝 Notes

- **Performance**: Sử dụng caching cho stats (Redis) vì queries có thể phức tạp
- **Real-time**: Có thể dùng WebSocket để update stats real-time
- **Privacy**: Students chỉ thấy ranking của mình, không thấy của người khác (trừ top 3)
- **Permissions**: Đảm bảo mỗi role chỉ thấy stats liên quan đến mình

---

## 🚀 Quick Start

Để thêm discussion stats vào dashboard hiện tại:

1. **Backend**: Tạo endpoint `/api/{role}/discussion/stats`
2. **Frontend**: Thêm API call trong dashboard component
3. **UI**: Thêm section mới hiển thị stats (cards, tables, charts)
4. **Testing**: Test với data thật để đảm bảo performance

---

**Tóm lại**: Mỗi role có nhu cầu thống kê khác nhau:
- **Admin**: Giám sát toàn hệ thống
- **Teacher**: Quản lý và support students
- **Student**: Theo dõi hoạt động cá nhân và tham gia nhiều hơn
