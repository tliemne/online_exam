# WebSocket Real-Time Notification Fix

## Problem
Real-time notifications không hoạt động - khi teacher tạo post, student không nhận được thông báo real-time mà phải click vào chuông thông báo mới thấy.

## Root Cause
Spring WebSocket's user destination prefix (`/user`) yêu cầu authentication và transform destination internally. Khi backend gửi tới `/user/{userId}/queue/personal`, Spring không route đúng tới frontend subscription.

## Solution
Thay đổi từ user-specific destination sang topic-based destination:

### Backend Changes
**File**: `src/main/java/com/example/online_exam/websocket/service/WebSocketService.java`

```java
// OLD (không hoạt động):
String destination = "/user/" + userId + "/queue/personal";

// NEW (hoạt động):
String destination = "/topic/user-" + userId;
```

### Frontend Changes
**File**: `exam-frontend/src/components/layout/AppLayout.jsx`

```javascript
// OLD (không hoạt động):
const destination = `/user/${user.id}/queue/personal`

// NEW (hoạt động):
const destination = `/topic/user-${user.id}`
```

## How It Works
1. Backend gửi notification tới `/topic/user-{userId}`
2. Frontend subscribe tới `/topic/user-{userId}` 
3. Khi có notification mới, frontend nhận event ngay lập tức
4. Notification hiển thị real-time không cần refresh

## Testing Steps
1. Restart backend server
2. Mở 2 browsers:
   - Browser 1: Login as Teacher
   - Browser 2: Login as Student (cùng course)
3. Teacher tạo post mới
4. Student sẽ thấy notification bell có số đỏ ngay lập tức
5. Click vào bell để xem notification

## Expected Behavior
- ✅ Student nhận notification real-time khi teacher tạo post
- ✅ Bell icon hiển thị số unread ngay lập tức
- ✅ Không cần refresh page hoặc click bell để thấy notification mới
- ✅ Console log: "Notification event received:" với event data

## Files Changed
- `src/main/java/com/example/online_exam/websocket/service/WebSocketService.java`
- `exam-frontend/src/components/layout/AppLayout.jsx`
