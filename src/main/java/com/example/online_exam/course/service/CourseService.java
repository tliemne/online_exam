package com.example.online_exam.course.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.attempt.repository.AttemptAnswerRepository;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.course.dto.CourseRequest;
import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.dto.CourseUpdateRequest;
import com.example.online_exam.course.dto.StudentWithProfileResponse;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.mapper.CourseMapper;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exam.repository.ExamQuestionRepository;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.question.repository.QuestionStatRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.mapper.UserMapper;
import com.example.online_exam.user.repository.UserRepository;
import com.example.online_exam.userprofile.repository.StudentProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository       courseRepository;
    private final UserRepository         userRepository;
    private final CourseMapper           courseMapper;
    private final CurrentUserService     currentUserService;
    private final UserMapper             userMapper;
    private final StudentProfileRepository studentProfileRepository;
    private final ActivityLogService     activityLogService;
    // Dùng để xóa cascade khi xóa course
    private final QuestionRepository     questionRepository;
    private final QuestionStatRepository questionStatRepository;
    private final ExamRepository         examRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final AttemptRepository      attemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;

    public CourseResponse create(CourseRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        User primaryTeacher;
        if (currentUserService.isAdmin(currentUser)) {
            primaryTeacher = findValidTeacher(request.getTeacherId());
        } else if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            primaryTeacher = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        } else {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Course course = new Course();
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.getTeachers().add(primaryTeacher);  // Thêm giáo viên chính vào danh sách
        course.setCreatedBy(currentUser);  // Set người tạo lớp
        courseRepository.save(course);

        activityLogService.logUser(currentUser, ActivityLogAction.CREATE_COURSE,
                "COURSE", course.getId(), "Tạo lớp học: " + course.getName());

        return courseMapper.toResponse(course);
    }


    public CourseResponse getById(Long id) {
        return courseMapper.toResponse(findCourseByDataScope(id));
    }

    public List<CourseResponse> getAll() {
        User currentUser = currentUserService.requireCurrentUser();
        List<Course> courses;
        if (currentUserService.isAdmin(currentUser)) {
            courses = courseRepository.findAll();
        } else if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            // Lấy lớp do teacher tạo
            List<Course> createdCourses = courseRepository.findAll().stream()
                    .filter(c -> c.getCreatedBy() != null && c.getCreatedBy().getId().equals(currentUser.getId()))
                    .toList();
            // Lấy lớp mà teacher là giáo viên quản lý (teachers set)
            List<Course> managedCourses = courseRepository.findAll().stream()
                    .filter(c -> c.getTeachers().stream().anyMatch(t -> t.getId().equals(currentUser.getId())))
                    .toList();
            // Lấy lớp cũ (dùng teacher field - backward compatible)
            List<Course> oldCourses = courseRepository.findByTeacherId(currentUser.getId());
            
            // Gộp lại (loại bỏ trùng)
            courses = java.util.stream.Stream.concat(
                    java.util.stream.Stream.concat(createdCourses.stream(), managedCourses.stream()),
                    oldCourses.stream()
            ).distinct().toList();
        } else if (currentUserService.hasRole(currentUser, RoleName.STUDENT)) {
            courses = courseRepository.findByStudents_Id(currentUser.getId());
        } else {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return courseMapper.toResponses(courses);
    }

    public CourseResponse update(Long id, CourseUpdateRequest request) {
        Course course = findCourseByManageScope(id);
        if (request.getName() != null) course.setName(request.getName());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        courseRepository.save(course);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.UPDATE_COURSE,
                "COURSE", id, "Cập nhật lớp học: " + course.getName());

        return courseMapper.toResponse(course);
    }

    public void delete(Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        // Chỉ admin hoặc creator mới có quyền xóa lớp
        boolean isAdmin = currentUserService.isAdmin(currentUser);
        boolean isCreator = course.getCreatedBy() != null && course.getCreatedBy().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isCreator) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        
        String name = course.getName();

        // ── Xóa đúng thứ tự để không vi phạm FK ──────────────────────────
        // 1. Lấy danh sách exam trong course
        java.util.List<Long> examIds = examRepository.findByCourseId(id)
                .stream().map(e -> e.getId()).collect(java.util.stream.Collectors.toList());

        // 2. Lấy danh sách question trong course
        java.util.List<Long> questionIds = questionRepository.findByCourseId(id)
                .stream().map(q -> q.getId()).collect(java.util.stream.Collectors.toList());

        // 3. Xóa attempt_answers TRƯỚC (bulk JPQL không trigger JPA cascade)
        //    sau đó xóa attempts
        for (Long examId : examIds) {
            attemptAnswerRepository.deleteByAttemptExamId(examId);
            attemptRepository.deleteByExamId(examId);
        }

        // 4. Xóa exam_questions → exams
        for (Long examId : examIds) {
            examQuestionRepository.deleteByExamId(examId);
        }
        examRepository.deleteAll(examRepository.findByCourseId(id));

        // 5. Xóa question_statistics → attempt_answers by question (đã xóa ở trên)
        //    question_statistics: ON DELETE CASCADE theo question_id → tự xóa khi xóa question
        //    question_tags: ON DELETE CASCADE → tự xóa
        //    answers: ON DELETE CASCADE → tự xóa
        questionRepository.deleteAll(questionRepository.findByCourseId(id));

        // 6. Xóa course (cascade: course_students, lectures, announcements)
        courseRepository.delete(course);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.DELETE_COURSE,
                "COURSE", id, "Xóa lớp học: " + name);
    }

    public CourseResponse addStudent(Long courseId, Long studentId) {
        Course course = findCourseByManageScope(courseId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean isStudent = student.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.STUDENT);
        if (!isStudent) throw new AppException(ErrorCode.FORBIDDEN);

        course.getStudents().add(student);
        courseRepository.save(course);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.ADD_STUDENT,
                "COURSE", courseId,
                "Thêm sinh viên " + student.getUsername() + " vào lớp: " + course.getName());

        return courseMapper.toResponse(course);
    }

    public void removeStudent(Long courseId, Long studentId) {
        Course course = findCourseByManageScope(courseId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        course.getStudents().remove(student);
        courseRepository.save(course);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.REMOVE_STUDENT,
                "COURSE", courseId,
                "Xóa sinh viên " + student.getUsername() + " khỏi lớp: " + course.getName());
    }

    public CourseResponse addStudents(Long courseId, List<Long> studentIds) {
        Course course = findCourseByManageScope(courseId);
        List<User> students = userRepository.findAllById(studentIds);

        if (students.size() != studentIds.size()) throw new AppException(ErrorCode.USER_NOT_FOUND);

        boolean allAreStudents = students.stream()
                .allMatch(s -> s.getRoles().stream()
                        .anyMatch(r -> r.getName() == RoleName.STUDENT));
        if (!allAreStudents) throw new AppException(ErrorCode.FORBIDDEN);

        course.getStudents().addAll(students);
        courseRepository.save(course);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.ADD_STUDENT,
                "COURSE", courseId,
                "Thêm " + students.size() + " sinh viên vào lớp: " + course.getName());

        return courseMapper.toResponse(course);
    }

    public List<StudentWithProfileResponse> getStudents(Long courseId) {
        Course course = findCourseByDataScope(courseId);
        return course.getStudents().stream().map(s -> {
            StudentWithProfileResponse res = new StudentWithProfileResponse();
            res.setId(s.getId());
            res.setUsername(s.getUsername());
            res.setFullName(s.getFullName());
            res.setEmail(s.getEmail());
            // phone, dateOfBirth từ users trực tiếp
            res.setPhone(s.getPhone());
            res.setDateOfBirth(s.getDateOfBirth());
            studentProfileRepository.findByUserId(s.getId()).ifPresent(p -> {
                res.setStudentCode(p.getStudentCode());
                res.setClassName(p.getClassName());
            });
            return res;
        }).toList();
    }

    // ── Helpers ──────────────────────────────────────────────
    private Course findCourseByDataScope(Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        if (currentUserService.isAdmin(currentUser))
            return courseRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            Course course = courseRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
            boolean isCreator = course.getCreatedBy() != null && course.getCreatedBy().getId().equals(currentUser.getId());
            boolean isTeacher = course.getTeachers().stream().anyMatch(t -> t.getId().equals(currentUser.getId()));
            boolean isOldTeacher = course.getTeacher() != null && course.getTeacher().getId().equals(currentUser.getId());
            if (!isCreator && !isTeacher && !isOldTeacher) throw new AppException(ErrorCode.FORBIDDEN);
            return course;
        }
        if (currentUserService.hasRole(currentUser, RoleName.STUDENT))
            return courseRepository.findByIdAndStudents_Id(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private Course findCourseByManageScope(Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        if (currentUserService.isAdmin(currentUser))
            return courseRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            // Teacher có thể quản lý nếu:
            // 1. Tạo lớp (createdBy = teacher)
            // 2. Là giáo viên quản lý (trong teachers set)
            // 3. Là giáo viên chính (teacher field - backward compatible)
            Course course = courseRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
            boolean isCreator = course.getCreatedBy() != null && course.getCreatedBy().getId().equals(currentUser.getId());
            boolean isTeacher = course.getTeachers().stream().anyMatch(t -> t.getId().equals(currentUser.getId()));
            boolean isOldTeacher = course.getTeacher() != null && course.getTeacher().getId().equals(currentUser.getId());
            if (!isCreator && !isTeacher && !isOldTeacher) throw new AppException(ErrorCode.FORBIDDEN);
            return course;
        }
        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private User findValidTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean isTeacher = teacher.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.TEACHER);
        if (!isTeacher) throw new AppException(ErrorCode.INVALID_TEACHER);
        return teacher;
    }

    /**
     * Thêm giáo viên quản lý lớp
     */
    public CourseResponse addTeacher(Long courseId, Long teacherId) {
        User currentUser = currentUserService.requireCurrentUser();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Chỉ người tạo lớp mới có quyền thêm giáo viên
        if (!course.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        User teacher = findValidTeacher(teacherId);
        course.getTeachers().add(teacher);
        courseRepository.save(course);

        activityLogService.logUser(currentUser, ActivityLogAction.UPDATE_COURSE,
                "COURSE", courseId,
                "Thêm giáo viên " + teacher.getUsername() + " quản lý lớp: " + course.getName());

        return courseMapper.toResponse(course);
    }

    /**
     * Xóa giáo viên quản lý lớp
     */
    public CourseResponse removeTeacher(Long courseId, Long teacherId) {
        User currentUser = currentUserService.requireCurrentUser();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Chỉ người tạo lớp hoặc admin mới có quyền xóa giáo viên
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ADMIN);
        boolean isCreator = course.getCreatedBy().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isCreator) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Ngăn xóa người tạo lớp (chỉ admin mới được xóa creator)
        if (teacherId.equals(course.getCreatedBy().getId()) && !isAdmin) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Không thể xóa giáo viên tạo lớp");
        }

        // Ngăn xóa giáo viên cuối cùng
        if (course.getTeachers().size() <= 1) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Lớp phải có ít nhất 1 giáo viên quản lý");
        }

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        course.getTeachers().remove(teacher);
        courseRepository.save(course);

        activityLogService.logUser(currentUser, ActivityLogAction.UPDATE_COURSE,
                "COURSE", courseId,
                "Xóa giáo viên " + teacher.getUsername() + " khỏi lớp: " + course.getName());

        return courseMapper.toResponse(course);
    }

    /**
     * Lấy danh sách giáo viên quản lý lớp
     */
    public List<CourseResponse.TeacherInfo> getTeachers(Long courseId) {
        Course course = findCourseByDataScope(courseId);
        return course.getTeachers().stream()
                .map(t -> CourseResponse.TeacherInfo.builder()
                        .id(t.getId())
                        .fullName(t.getFullName())
                        .username(t.getUsername())
                        .build())
                .toList();
    }
}
