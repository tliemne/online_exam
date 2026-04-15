# Top Contributors API Fix

## Problem
User reported "Không thể tải dữ liệu" (Cannot load data) in the Top Contributors section even though they have posts with 2 student accounts commenting.

## Root Cause
The TopContributors component was using incorrect API endpoints:
1. `/courses/teacher` - This endpoint doesn't exist
2. `/courses/${courseId}/discussions/stats` - Missing `/api` prefix

## Solution
Fixed the API endpoints in `TopContributors` component:

### Before:
```javascript
api.get('/courses/teacher')  // ❌ Endpoint doesn't exist
api.get(`/courses/${c.id}/discussions/stats`)  // ❌ Missing /api prefix
```

### After:
```javascript
api.get('/courses')  // ✅ Returns courses filtered by logged-in teacher
api.get(`/api/courses/${c.id}/discussions/stats`)  // ✅ Correct API path
```

## How It Works

### 1. Get Teacher's Courses
- Endpoint: `GET /courses`
- Backend automatically filters courses based on logged-in user's role
- For teachers: Returns courses they created or manage
- For students: Returns courses they're enrolled in
- For admins: Returns all courses

### 2. Get Discussion Stats for Each Course
- Endpoint: `GET /api/courses/{courseId}/discussions/stats`
- Returns forum statistics including `mostActiveStudents` array
- Each student object contains:
  - `userId`: User ID
  - `username`: Username
  - `fullName`: Full name
  - `postCount`: Number of posts
  - `replyCount`: Number of replies
  - `totalContributions`: Total posts + replies

### 3. Merge Contributors Across Courses
- Creates a Map to aggregate contributions from all courses
- If a user appears in multiple courses, their counts are summed
- Sorts by total contributions (descending)
- Takes top 5 contributors

## Dark Mode Compatibility
The component already uses CSS variables and RGBA colors with opacity for dark mode compatibility:

```javascript
const rankColors = [
  { 
    bg: 'rgba(217, 119, 6, 0.15)',  // Gold with opacity
    text: 'rgb(217, 119, 6)', 
    bar: 'linear-gradient(90deg, rgb(217, 119, 6) 0%, rgba(217, 119, 6, 0.6) 100%)' 
  },
  // ... other ranks use similar pattern
  { 
    bg: 'var(--bg-elevated)',  // CSS variable for 4th & 5th place
    text: 'var(--text-3)', 
    bar: 'linear-gradient(90deg, var(--text-3) 0%, var(--border-strong) 100%)' 
  },
]
```

This ensures colors adapt properly in both light and dark themes.

## Testing
After this fix:
1. Teacher dashboard should load courses successfully
2. Discussion stats should be fetched for each course
3. Top contributors should display with proper data
4. Colors should work in both light and dark modes

## Files Modified
- `exam-frontend/src/pages/teacher/TeacherDashboard.jsx`
