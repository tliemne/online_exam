package com.example.online_exam.course.service;

import com.example.online_exam.activitylog.entity.ActivityLogAction;
import com.example.online_exam.activitylog.service.ActivityLogService;
import com.example.online_exam.course.dto.CourseRequest;
import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.dto.CourseUpdateRequest;
import com.example.online_exam.course.dto.StudentWithProfileResponse;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.mapper.CourseMapper;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
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

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseMapper courseMapper;
    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;
    private final StudentProfileRepository studentProfileRepository;
    private final ActivityLogService activityLogService;

    public CourseResponse create(CourseRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        User teacher;
        if (currentUserService.isAdmin(currentUser)) {
            teacher = findValidTeacher(request.getTeacherId());
        } else if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            teacher = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        } else {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Course course = new Course();
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
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
            courses = courseRepository.findByTeacherId(currentUser.getId());
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
        if (request.getTeacherId() != null) {
            User currentUser = currentUserService.requireCurrentUser();
            if (!currentUserService.isAdmin(currentUser)) throw new AppException(ErrorCode.FORBIDDEN);
            course.setTeacher(findValidTeacher(request.getTeacherId()));
        }
        courseRepository.save(course);

        User caller = currentUserService.requireCurrentUser();
        activityLogService.logUser(caller, ActivityLogAction.UPDATE_COURSE,
                "COURSE", id, "Cập nhật lớp học: " + course.getName());

        return courseMapper.toResponse(course);
    }

    public void delete(Long id) {
        Course course = findCourseByManageScope(id);
        String name = course.getName();
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
            studentProfileRepository.findByUserId(s.getId()).ifPresent(p -> {
                res.setStudentCode(p.getStudentCode());
                res.setPhone(p.getPhone());
                res.setDateOfBirth(p.getDateOfBirth());
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
        if (currentUserService.hasRole(currentUser, RoleName.TEACHER))
            return courseRepository.findByIdAndTeacherId(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        if (currentUserService.hasRole(currentUser, RoleName.STUDENT))
            return courseRepository.findByIdAndStudents_Id(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private Course findCourseByManageScope(Long id) {
        User currentUser = currentUserService.requireCurrentUser();
        if (currentUserService.isAdmin(currentUser))
            return courseRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        if (currentUserService.hasRole(currentUser, RoleName.TEACHER))
            return courseRepository.findByIdAndTeacherId(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
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
}