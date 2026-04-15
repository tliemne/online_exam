# Pagination Implementation Plan

## Overview
Add pagination to all pages except dashboards to handle large datasets efficiently.

## Pages to Implement (Priority Order)

### High Priority
1. **QuestionsPage** (Teacher) - 15 items/page
   - Current: Loads all questions at once
   - Backend: Already has pagination support
   - Frontend: Need to add Pagination component

2. **ExamsPage** (Teacher) - 10 items/page
   - Current: Loads all exams at once
   - Backend: Need to check pagination support
   - Frontend: Need to add Pagination component

3. **StudentResultsPage** (Student) - 15 items/page
   - Current: Loads all attempts at once
   - Backend: Need to check pagination support
   - Frontend: Need to add Pagination component

4. **AdminUsers** (Admin) - 15 items/page
   - Current: Loads all users at once
   - Backend: Need to add pagination
   - Frontend: Need to add Pagination component

### Medium Priority
5. **CoursesPage** (Teacher) - 12 items/page
6. **StudentCoursesPage** (Student) - 12 items/page
7. **StudentExamsPage** (Student) - 10 items/page
8. **AdminActivityLogPage** (Admin) - 20 items/page

### Low Priority
9. **TagsPage** (Teacher) - 20 items/page

## Implementation Steps

### 1. Backend Changes
For each endpoint that doesn't have pagination:
- Add `Pageable` parameter
- Return `Page<T>` instead of `List<T>`
- Update service methods

### 2. Frontend Changes
For each page:
- Add state for `page` and `totalPages`
- Update API call to include page parameter
- Add `<Pagination>` component at bottom
- Handle page change events

## Pagination Component
Already exists at: `exam-frontend/src/components/common/Pagination.jsx`

Usage:
```jsx
<Pagination 
  currentPage={page} 
  totalPages={totalPages} 
  onPageChange={setPage} 
/>
```

## Standard Page Sizes
- Small lists (Tags): 20 items
- Medium lists (Users, Results, Logs): 15 items
- Large items (Courses): 12 items
- Very large items (Exams): 10 items
- Discussion posts: 20 items (already implemented)

## Notes
- All pagination is 0-indexed on backend
- Frontend displays 1-indexed to users
- Pagination component handles the conversion
