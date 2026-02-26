package com.example.online_exam.user.service;

import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

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

    @Override
    public UserResponse register(UserRegisterRequest request) {


        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTS);
        }


        if (request.getEmail() != null &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
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
            studentProfileRepository.save(profile);
        }
        if(roleName == RoleName.TEACHER){
            TeacherProfile profile = new TeacherProfile();
            profile.setUser(user);
            teacherProfileRepository.save(profile);
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
        return userRepository.findAll()
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
                    studentProfileResponse.setPhone(profile.getPhone());
                    studentProfileResponse.setDateOfBirth(profile.getDateOfBirth());
                    studentProfileResponse.setClassName(profile.getClassName());
                    response.setStudentProfile(studentProfileResponse);
                });

        teacherProfileRepository.findByUserId(user.getId())
                .ifPresent(profile -> {
                    TeacherProfileResponse teacherProfileResponse = new TeacherProfileResponse();
                    teacherProfileResponse.setTeacherCode(profile.getTeacherCode());
                    teacherProfileResponse.setPhone(profile.getPhone());
                    teacherProfileResponse.setDepartment(profile.getDepartment());
                    teacherProfileResponse.setSpecialization(profile.getSpecialization());
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

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }

        userRepository.save(user);
        return mapByVisibility(user);
    }

    @Override
    public StudentProfileResponse updateMyStudentProfile(StudentProfileUpdateRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        if (!currentUserService.hasRole(currentUser, RoleName.STUDENT)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        StudentProfile profile = studentProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        profile.setStudentCode(request.getStudentCode());
        profile.setPhone(request.getPhone());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setClassName(request.getClassName());
        studentProfileRepository.save(profile);

        StudentProfileResponse response = new StudentProfileResponse();
        response.setStudentCode(profile.getStudentCode());
        response.setPhone(profile.getPhone());
        response.setDateOfBirth(profile.getDateOfBirth());
        response.setClassName(profile.getClassName());
        return response;
    }
    @Override
    public TeacherProfileResponse updateMyTeacherProfile(TeacherProfileUpdateRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        if (!currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        TeacherProfile profile = teacherProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        profile.setTeacherCode(request.getTeacherCode());
        profile.setPhone(request.getPhone());
        profile.setDepartment(request.getDepartment());
        profile.setSpecialization(request.getSpecialization());
        teacherProfileRepository.save(profile);

        TeacherProfileResponse response = new TeacherProfileResponse();
        response.setTeacherCode(profile.getTeacherCode());
        response.setPhone(profile.getPhone());
        response.setDepartment(profile.getDepartment());
        response.setSpecialization(profile.getSpecialization());
        return response;
    }
    @Override
    public void delete(Long id) {

        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        studentProfileRepository.findByUserId(id).ifPresent(studentProfileRepository::delete);
        teacherProfileRepository.findByUserId(id).ifPresent(teacherProfileRepository::delete);
        userRepository.deleteById(id);
    }
    private UserResponse mapByVisibility(User targetUser) {
        User viewer = currentUserService.getCurrentUser().orElse(null);

        if (viewer == null) {
            return userMapper.toRoleAwareResponse(targetUser, true, false);
        }

        boolean viewerIsAdmin = currentUserService.isAdmin(viewer);
        boolean viewerIsOwner = viewer.getId().equals(targetUser.getId());
        boolean includeSensitive = viewerIsAdmin || viewerIsOwner;

        boolean viewerIsStudentOnly = currentUserService.hasRole(viewer, RoleName.STUDENT)
                && !currentUserService.hasRole(viewer, RoleName.ADMIN)
                && !currentUserService.hasRole(viewer, RoleName.TEACHER);
        boolean includeId = !viewerIsStudentOnly;

        return userMapper.toRoleAwareResponse(targetUser, includeSensitive, includeId);
    }

}