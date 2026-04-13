# Hướng dẫn Debug Redis Cache

## Kiểm tra dữ liệu trong Redis

### 1. Kết nối Redis CLI:
```bash
redis-cli
```

### 2. Xem tất cả keys:
```bash
KEYS *
```

### 3. Xem keys liên quan đến câu hỏi:
```bash
KEYS "questions:*"
```

### 4. Xem chi tiết một key:
```bash
GET "questions:list::1::null::null::::null"
```

### 5. Xem TTL của key:
```bash
TTL "questions:list::1::null::null::::null"
```

### 6. Xóa một key:
```bash
DEL "questions:list::1::null::null::::null"
```

### 7. Xóa tất cả keys:
```bash
FLUSHDB
```

### 8. Xem số lượng keys:
```bash
DBSIZE
```

## Dữ liệu được cache:

### 1. **Câu hỏi search** (QuestionCacheService):
- Key pattern: `questions:list::{courseId}::{type}::{difficulty}::{keyword}::{tagId}`
- Key pattern: `questions:paged::{courseId}::{type}::{difficulty}::{keyword}::{tagId}::{page}::{size}`
- TTL: 5 phút
- Dữ liệu: List<QuestionResponse>

### 2. **Thống kê câu hỏi** (QuestionStat):
- **KHÔNG được cache** - Luôn query trực tiếp từ DB
- Dữ liệu real-time

### 3. **Đề thi** (ExamCacheService):
- Có thể được cache khi student lấy đề thi
- TTL: Tùy config

## Vấn đề có thể gặp:

1. **Dữ liệu cũ bị cache** → Xóa cache: `FLUSHDB`
2. **Cache không được invalidate** → Kiểm tra code invalidation
3. **TTL quá dài** → Giảm TTL xuống

## Cách xóa cache theo courseId:

```bash
KEYS "questions:*::1::*" | xargs redis-cli DEL
```

Thay `1` bằng courseId cần xóa.

## Kiểm tra dữ liệu thống kê:

```bash
# Kiểm tra database trực tiếp
SELECT * FROM question_statistics WHERE question_id = ?;

# Kiểm tra API
GET /questions/stats/course/1
```

## Nếu vẫn không cập nhật:

1. Kiểm tra log backend: `[QuestionStat]`
2. Kiểm tra database: `question_statistics` table
3. Xóa Redis cache: `FLUSHDB`
4. Refresh frontend: Click nút "Làm mới"
