# STEP 4: Update CourseResponse DTO & Add Teacher Management UI

## Backend Changes

### 1. Update `CourseResponse.java`
**File**: `src/main/java/com/example/online_exam/course/dto/CourseResponse.java`

Copy content from: `CourseResponse_STEP4_UPDATE.java`

**Changes**:
- Add `teacherId` field (Long)
- Add `createdById` field (Long)
- Add `createdByName` field (String)
- Keep existing fields: `id`, `name`, `description`, `teacherName`, `studentCount`

### 2. Update `CourseMapper.java`
**File**: `src/main/java/com/example/online_exam/course/mapper/CourseMapper.java`

Copy content from: `CourseMapper_STEP4_UPDATE.java`

**Changes**:
- Add mapping: `teacherId` ← `teacher.id`
- Add mapping: `createdById` ← `createdBy.id`
- Add mapping: `createdByName` ← `createdBy.fullName`

---

## Frontend Changes

### 3. Update `CoursesPage.jsx`
**File**: `exam-frontend/src/pages/teacher/CoursesPage.jsx`

Reference: `CoursesPage_STEP4_WITH_TEACHER_MANAGEMENT.jsx`

**Changes**:

#### A. Add new state variable (in CoursesPage function):
```javascript
const [teacherModal, setTeacherModal] = useState(null)
```

#### B. Add new TeacherManagementModal component (before CoursesPage function):
```javascript
function TeacherManagementModal({ course, onClose, onSaved, allUsers, isAdmin, currentUser }) {
  // See CoursesPage_STEP4_WITH_TEACHER_MANAGEMENT.jsx for full implementation
}
```

#### C. Update CourseCard component:
- Add props: `canManageTeacher`, `onManageTeacher`
- Add button to manage teacher (only shows if `canManageTeacher` is true)
- Display `course.createdByName` in the card

#### D. Update grid view rendering:
```javascript
<CourseCard key={c.id} course={c}
  isOwner={myCourses.some(m => m.id === c.id)}
  canManageTeacher={isAdmin && c.createdById === user?.id}
  onEdit={(c) => { setSelected(c); setModal('edit') }}
  onDelete={handleDelete}
  onManageTeacher={(c) => setTeacherModal(c)}
  onDetail={(c) => navigate(`${basePath}/courses/${c.id}`)}
/>
```

#### E. Update table view rendering:
Add teacher management button in the actions column (only for admin-created courses)

#### F. Add TeacherManagementModal at the end (before closing main div):
```javascript
{teacherModal && (
  <TeacherManagementModal
    course={teacherModal}
    isAdmin={isAdmin}
    currentUser={user}
    allUsers={allUsers}
    onClose={() => setTeacherModal(null)}
    onSaved={load}
  />
)}
```

---

## API Integration

The frontend will call the existing endpoint:
- `PUT /courses/{id}/teacher/{teacherId}` - Already implemented in CourseController

---

## Permission Logic

**Teacher Management is only available when**:
1. Current user is ADMIN
2. Course was created by the current admin (`course.createdById === user.id`)
3. Course is NOT created by a teacher

**Teacher cannot**:
- Change teacher for courses they created
- Change teacher for courses created by admin

---

## Summary

After applying these changes:
- ✅ CourseResponse will include creator info and teacher ID
- ✅ Frontend will display who created the course
- ✅ Admin can manage teacher for courses they created
- ✅ UI will show teacher management button only when appropriate
- ✅ All existing functionality remains unchanged
