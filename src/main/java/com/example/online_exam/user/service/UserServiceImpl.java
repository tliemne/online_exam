package com.example.online_exam.user.service;

import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.common.service.EmailService;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.attempt.repository.AttemptAnswerRepository;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.auth.repository.RedisRefreshTokenRepository;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exam.repository.ExamQuestionRepository;
import com.example.online_exam.lecture.repository.LectureRepository;
import com.example.online_exam.question.repository.QuestionRepository;
import com.example.online_exam.user.dto.CreateStudentRequest;
import com.example.online_exam.user.dto.CreateStudentResult;
import com.example.online_exam.user.dto.MyProfileResponse;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.dto.UserUpdateRequest;
import com.example.online_exam.user.entity.Role;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.enums.UserStatus;
import com.example.online_exam.user.mapper.UserMapper;
import com.example.online_exam.user.repository.RoleRepository;
import com.example.online_exam.user.repository.UserRepository;
import com.example.online_exam.userprofile.dto.StudentProfileResponse;
import com.example.online_exam.userprofile.dto.StudentProfileUpdateRequest;
import com.example.online_exam.userprofile.dto.TeacherProfileResponse;
import com.example.online_exam.userprofile.dto.TeacherProfileUpdateRequest;
import com.example.online_exam.userprofile.entity.StudentProfile;
import com.example.online_exam.userprofile.entity.TeacherProfile;
import com.example.online_exam.userprofile.repository.StudentProfileRepository;
import com.example.online_exam.userprofile.repository.TeacherProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final CurrentUserService currentUserService;
    private final CourseRepository courseRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final AttemptRepository attemptRepository;
    private final RedisRefreshTokenRepository refreshTokenRepository;
    private final ExamRepository examRepository;
    private final LectureRepository lectureRepository;
    private final QuestionRepository questionRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final com.example.online_exam.activitylog.repository.ActivityLogRepository activityLogRepository;
    private final com.example.online_exam.notification.repository.NotificationRepository notificationRepository;

    // Optional — null nếu spring-boot-starter-mail chưa được cấu hình
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private EmailService emailService;

    @Override
    public UserResponse register(UserRegisterRequest request) {


        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTS);
        }


        if (request.getEmail() != null && !request.getEmail().isBlank() &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        // Chỉ set email nếu không blank
        user.setEmail(request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail() : null);
        user.setFullName(request.getFullName());

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));


        user.setStatus(UserStatus.ACTIVE);


        RoleName roleName = request.getRole() != null ? request.getRole() : RoleName.STUDENT;
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_ERROR));

        user.setRoles(Set.of(role));

        userRepository.save(user);

        if(roleName == RoleName.STUDENT){
            StudentProfile profile = new StudentProfile();
            profile.setUser(user);
            profile.setStudentCode(String.format("SV%d%04d",
                    java.time.Year.now().getValue(), user.getId()));
            studentProfileRepository.save(profile);
        }
        if(roleName == RoleName.TEACHER){
            TeacherProfile profile = new TeacherProfile();
            profile.setUser(user);
            profile.setTeacherCode(String.format("GV%d%04d",
                    java.time.Year.now().getValue(), user.getId()));
            teacherProfileRepository.save(profile);
        }

        // Gửi email thông báo nếu có email thật
        log.info("[EMAIL-DEBUG] register: emailService={}, email={}", emailService != null ? "OK" : "NULL", request.getEmail());
        if (emailService != null
                && request.getEmail() != null
                && !request.getEmail().isBlank()
                && !request.getEmail().endsWith("@school.edu.vn")) {
            log.info("[EMAIL-DEBUG] Attempting to send email to {}", request.getEmail());
            final String plainPwd = request.getPassword();
            final User finalUser = user;
            emailService.sendStudentCredentials(
                    request.getEmail(),
                    finalUser.getFullName() != null ? finalUser.getFullName() : finalUser.getUsername(),
                    finalUser.getUsername(),
                    plainPwd,
                    null
            );
        }

        return mapByVisibility(user);
//        return userMapper.toResponse(user);
//
    }

    @Override
    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return mapByVisibility(user);
    }

    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAllBy()
                .stream()
                .map(userMapper::toPrivateResponse)
                .toList();
    }
    @Override
    public MyProfileResponse getMyProfile() {
        User currentUser = currentUserService.requireCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        MyProfileResponse response = new MyProfileResponse();
        response.setAccount(mapByVisibility(user));

        studentProfileRepository.findByUserId(user.getId())
                .ifPresent(profile -> {
                    StudentProfileResponse studentProfileResponse = new StudentProfileResponse();
                    studentProfileResponse.setStudentCode(profile.getStudentCode());
                    studentProfileResponse.setClassName(profile.getClassName());
                    // phone, dateOfBirth đã chuyển lên users
                    studentProfileResponse.setPhone(user.getPhone());
                    studentProfileResponse.setDateOfBirth(user.getDateOfBirth());
                    response.setStudentProfile(studentProfileResponse);
                });

        teacherProfileRepository.findByUserId(user.getId())
                .ifPresent(profile -> {
                    TeacherProfileResponse teacherProfileResponse = new TeacherProfileResponse();
                    teacherProfileResponse.setTeacherCode(profile.getTeacherCode());
                    teacherProfileResponse.setDepartment(profile.getDepartment());
                    teacherProfileResponse.setSpecialization(profile.getSpecialization());
                    // phone đã chuyển lên users
                    teacherProfileResponse.setPhone(user.getPhone());
                    response.setTeacherProfile(teacherProfileResponse);
                });

        return response;
    }

    @Override
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getStatus() != null) user.setStatus(request.getStatus());

        userRepository.save(user);
        return mapByVisibility(user);
    }

    /** User tự cập nhật fullName + email của mình (không đổi được status) */
    public UserResponse updateMe(UserUpdateRequest request) {
        User user = currentUserService.requireCurrentUser();

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        if (request.getEmail()   != null) user.setEmail(request.getEmail());
        if (request.getFullName() != null) user.setFullName(request.getFullName());

        userRepository.save(user);
        return mapByVisibility(user);
    }

    public void updateAvatar(String avatarUrl) {
        User user = currentUserService.requireCurrentUser();
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
    }

    @Override
    public StudentProfileResponse updateMyStudentProfile(StudentProfileUpdateRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        if (!currentUserService.hasRole(currentUser, RoleName.STUDENT)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Cập nhật email + fullName trên bảng users
        if (request.getEmail() != null && !request.getEmail().equals(currentUser.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail()))
                throw new AppException(ErrorCode.EMAIL_EXISTS);
            currentUser.setEmail(request.getEmail());
        }
        if (request.getFullName() != null) currentUser.setFullName(request.getFullName());
        userRepository.save(currentUser);

        StudentProfile profile = studentProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // studentCode không cho phép tự sửa
        // phone, dateOfBirth lưu vào users (đã chuyển từ student_profiles)
        if (request.getPhone() != null)       currentUser.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) currentUser.setDateOfBirth(request.getDateOfBirth());
        userRepository.save(currentUser);

        profile.setClassName(request.getClassName());
        studentProfileRepository.save(profile);

        StudentProfileResponse response = new StudentProfileResponse();
        response.setStudentCode(profile.getStudentCode());
        response.setClassName(profile.getClassName());
        response.setPhone(currentUser.getPhone());
        response.setDateOfBirth(currentUser.getDateOfBirth());
        return response;
    }
    @Override
    public TeacherProfileResponse updateMyTeacherProfile(TeacherProfileUpdateRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        if (!currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Cập nhật email + fullName trên bảng users
        if (request.getEmail() != null && !request.getEmail().equals(currentUser.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail()))
                throw new AppException(ErrorCode.EMAIL_EXISTS);
            currentUser.setEmail(request.getEmail());
        }
        if (request.getFullName() != null) currentUser.setFullName(request.getFullName());
        userRepository.save(currentUser);

        TeacherProfile profile = teacherProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // teacherCode không cho phép tự sửa
        // phone lưu vào users (đã chuyển từ teacher_profiles)
        if (request.getPhone() != null) currentUser.setPhone(request.getPhone());
        userRepository.save(currentUser);

        profile.setDepartment(request.getDepartment());
        profile.setSpecialization(request.getSpecialization());
        teacherProfileRepository.save(profile);

        TeacherProfileResponse response = new TeacherProfileResponse();
        response.setTeacherCode(profile.getTeacherCode());
        response.setDepartment(profile.getDepartment());
        response.setSpecialization(profile.getSpecialization());
        response.setPhone(currentUser.getPhone());
        return response;
    }
    @Override
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        // Không cho xóa chính mình
        User caller = currentUserService.requireCurrentUser();
        if (caller.getId().equals(id)) {
            throw new AppException(ErrorCode.CANNOT_DELETE_SELF);
        }
        // Không cho xóa tài khoản Admin khác
        User target = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean targetIsAdmin = target.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ADMIN);
        if (targetIsAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        // 1. Xóa refresh token trong Redis
        refreshTokenRepository.deleteByUserId(id);
        // 2a. Null hóa teacher_id trong courses nếu user là teacher
        courseRepository.nullifyTeacher(id);
        // 2b. Xóa khỏi course_students nếu user là student
        courseRepository.removeStudentFromAllCourses(id);
        // 3. Xóa attempt_answers trước (FK constraint), rồi xóa attempts của student
        attemptAnswerRepository.deleteByAttemptStudentId(id);
        attemptRepository.deleteByStudentId(id);
        // 4. Xóa attempt_answers, attempts, exam_questions của các exam do user tạo
        attemptAnswerRepository.deleteByAttemptExamCreatedById(id);
        examQuestionRepository.deleteByExamCreatedById(id);
        attemptRepository.deleteByExamCreatedById(id);
        examRepository.deleteByCreatedById(id);
        // 5. Xóa lectures do user tạo
        lectureRepository.deleteByCreatedById(id);
        // 6. Xóa exam_questions trỏ đến questions của user, rồi xóa questions
        examQuestionRepository.deleteByQuestionCreatedById(id);
        questionRepository.deleteByCreatedById(id);
        // 7. Xóa profile
        studentProfileRepository.deleteByUserId(id);
        teacherProfileRepository.deleteByUserId(id);
        // 8. Xóa notifications
        notificationRepository.deleteAllByUser(id);
        // 9. Xóa activity logs
        activityLogRepository.deleteByUserId(id);
        // 10. Xóa user
        userRepository.deleteById(id);    }
    private UserResponse mapByVisibility(User targetUser) {
        User viewer = currentUserService.getCurrentUser().orElse(null);

        if (viewer == null) {
            // Chưa đăng nhập (vd: vừa register) → trả đủ info của chính user đó
            return userMapper.toRoleAwareResponse(targetUser, true, true);
        }

        boolean viewerIsAdmin = currentUserService.isAdmin(viewer);
        boolean viewerIsOwner = viewer.getId().equals(targetUser.getId());
        boolean includeSensitive = viewerIsAdmin || viewerIsOwner;
        boolean includeId = viewerIsAdmin || viewerIsOwner;

        return userMapper.toRoleAwareResponse(targetUser, includeSensitive, includeId);
    }
    @Override
    public List<UserResponse> getAllByRole(RoleName role) {
        return userRepository.findAllBy().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == role))
                .map(userMapper::toPrivateResponse)
                .toList();
    }

    // ── Teacher tạo Student ───────────────────────────────

    @Override
    @Transactional
    public CreateStudentResult createStudent(CreateStudentRequest req) {
        // Kiểm tra username trùng
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTS);
        }

        // Tự sinh mật khẩu nếu không nhập
        String plainPwd = (req.getPassword() != null && !req.getPassword().isBlank())
                ? req.getPassword()
                : req.getUsername() + "123";

        // Tạo user
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(plainPwd));
        user.setEmail(req.getEmail() != null ? req.getEmail() : req.getUsername() + "@school.edu.vn");
        user.setFullName(req.getFullName());
        user.setStatus(UserStatus.ACTIVE);

        Role studentRole = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        user.setRoles(java.util.Set.of(studentRole));
        user = userRepository.save(user);

        // Tạo StudentProfile
        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        // Auto-gen studentCode nếu không nhập
        String studentCode = (req.getStudentCode() != null && !req.getStudentCode().isBlank())
                ? req.getStudentCode()
                : String.format("SV%d%04d", java.time.Year.now().getValue(), user.getId());
        profile.setStudentCode(studentCode);
        profile.setClassName(req.getClassName());
        studentProfileRepository.save(profile);

        // Gắn vào lớp học nếu có courseId
        Long enrolledCourseId = null;
        if (req.getCourseId() != null) {
            Course course = courseRepository.findById(req.getCourseId())
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
            course.getStudents().add(user);
            courseRepository.save(course);
            enrolledCourseId = course.getId();
        }

        // Gửi email thông báo nếu có email thật và EmailService đã cấu hình
        final String finalPlainPwd = plainPwd;
        final Long finalEnrolledId = enrolledCourseId;
        final User savedUser = user;
        log.info("[EMAIL-DEBUG] emailService={}, req.email={}", emailService != null ? "OK" : "NULL", req.getEmail());
        if (emailService != null
                && req.getEmail() != null
                && !req.getEmail().isBlank()
                && !req.getEmail().endsWith("@school.edu.vn")) {
            log.info("[EMAIL-DEBUG] Attempting to send email to {}", req.getEmail());
            String courseName = null;
            if (enrolledCourseId != null) {
                courseName = courseRepository.findById(enrolledCourseId)
                        .map(c -> c.getName()).orElse(null);
            }
            emailService.sendStudentCredentials(
                    req.getEmail(),
                    user.getFullName(),
                    user.getUsername(),
                    plainPwd,
                    courseName
            );
        } else {
            log.info("[EMAIL-DEBUG] Skipped email: emailService={}, email={}",
                    emailService != null ? "OK" : "NULL", req.getEmail());
        }

        return new CreateStudentResult(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                finalPlainPwd,
                studentCode,
                req.getClassName(),
                finalEnrolledId
        );
    }

    // ── Password ──────────────────────────────────────────

    @Override
    public void changeMyPassword(String oldPassword, String newPassword) {
        User me = currentUserService.requireCurrentUser();
        if (!passwordEncoder.matches(oldPassword, me.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Sai mật khẩu cũ
        }
        me.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(me);
    }

    @Override
    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Gửi email thông báo nếu user có email thật
        if (emailService != null
                && user.getEmail() != null
                && !user.getEmail().endsWith("@school.edu.vn")) {
            emailService.sendPasswordReset(user.getEmail(), user.getFullName(), newPassword);
        }
    }

}