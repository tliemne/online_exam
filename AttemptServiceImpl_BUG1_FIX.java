// ========== PHẦN CẦN SỬA - Dòng 217-220 ==========
// CŨNG (BUG):
/*
        // Thông báo cho teacher khi có bài tự luận cần chấm
        if (hasEssay && exam.getCreatedBy() != null) {
            notificationService.essayPendingGrade(
                    exam.getCreatedBy(), exam.getTitle(), student.getFullName());
        }
*/

// MỚI (FIX):
        // Thông báo cho teacher khi có bài tự luận cần chấm
        // Gửi cho: người tạo đề + teacher của lớp (nếu có)
        if (hasEssay) {
            Set<User> notifyTeachers = new HashSet<>();
            
            // Thêm người tạo đề
            if (exam.getCreatedBy() != null) {
                notifyTeachers.add(exam.getCreatedBy());
            }
            
            // Thêm teacher của lớp (nếu có)
            if (exam.getCourse() != null && exam.getCourse().getTeacher() != null) {
                notifyTeachers.add(exam.getCourse().getTeacher());
            }
            
            // Gửi thông báo cho tất cả teachers
            for (User teacher : notifyTeachers) {
                notificationService.essayPendingGrade(
                        teacher, exam.getTitle(), student.getFullName());
            }
        }
