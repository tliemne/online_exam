# Redesign: Multiple Teachers Management

## Thay đổi chính

### Backend
1. **Course Entity**: Thay `teacher` (ManyToOne) → `teachers` (ManyToMany)
2. **CourseResponse**: Thêm `List<TeacherInfo> teachers` thay vì `teacherName`
3. **CourseMapper**: Map danh sách giáo viên
4. **CourseService**: 
   - `create()`: Thêm giáo viên chính vào `teachers` set
   - `getAll()`: Lấy lớp theo `createdBy` hoặc `teachers`
   - `findCourseByManageScope()`: Kiểm tra `createdBy` hoặc `teachers`
   - Thêm `addTeacher()` - Thêm giáo viên quản lý
   - Thêm `removeTeacher()` - Xóa giáo viên quản lý
   - Thêm `getTeachers()` - Lấy danh sách giáo viên
5. **CourseController**: 
   - POST `/courses/{id}/teachers/{teacherId}` - Thêm giáo viên
   - DELETE `/courses/{id}/teachers/{teacherId}` - Xóa giáo viên
   - GET `/courses/{id}/teachers` - Lấy danh sách giáo viên

### Frontend
1. **CoursesPage**: 
   - Thêm `ManageTeachersModal` component
   - Cập nhật `CourseCard` để hiển thị danh sách giáo viên
   - Thêm nút "Giáo viên" (text, không icon)
   - Chỉ hiển thị nút cho người tạo lớp

## Quyền hạn

### Người tạo lớp (Admin hoặc Teacher)
- ✅ Thêm giáo viên quản lý
- ✅ Xóa giáo viên quản lý
- ✅ Quản lý lớp

### Giáo viên quản lý (được thêm vào)
- ✅ Quản lý lớp (thêm/xóa sinh viên)
- ❌ Không thể thêm/xóa giáo viên khác
- ❌ Không thể xóa lớp

### Admin
- ✅ Toàn quyền quản lý tất cả lớp

## Hướng dẫn copy

### Backend
1. Sửa `src/main/java/com/example/online_exam/course/entity/Course.java` - Đã sửa
2. Sửa `src/main/java/com/example/online_exam/course/dto/CourseResponse.java` - Đã sửa
3. Sửa `src/main/java/com/example/online_exam/course/mapper/CourseMapper.java` - Đã sửa
4. Sửa `src/main/java/com/example/online_exam/course/service/CourseService.java` - Đã sửa
5. Sửa `src/main/java/com/example/online_exam/course/controller/CourseController.java` - Đã sửa

### Frontend
Ghép 3 file thành 1:
- `CoursesPage_REDESIGN_P1.jsx` (imports + modals)
- `CoursesPage_REDESIGN_P2.jsx` (AddStudents + Students + ManageTeachers)
- `CoursesPage_REDESIGN_P3.jsx` (CourseCard + Main)

Copy vào: `exam-frontend/src/pages/teacher/CoursesPage.jsx`

## Rebuild
```bash
mvn clean compile
```

Restart backend và refresh frontend.

## Kiểm tra
- [ ] Backend compile thành công
- [ ] Frontend load không lỗi
- [ ] Nút "Giáo viên" hiển thị cho người tạo lớp
- [ ] Có thể thêm giáo viên quản lý
- [ ] Có thể xóa giáo viên quản lý
- [ ] Hiển thị danh sách giáo viên trên card
- [ ] Teacher có thể quản lý lớp nếu là giáo viên quản lý
