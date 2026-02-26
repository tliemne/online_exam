package com.example.online_exam.course.service;

import com.example.online_exam.course.dto.CourseRequest;
import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.dto.CourseUpdateRequest;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.mapper.CourseMapper;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import com.example.online_exam.user.repository.UserRepository;
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

    public CourseResponse create(CourseRequest request)
    {
       User currentUser = currentUserService.requireCurrentUser();
       User teacher;
       if (currentUserService.isAdmin(currentUser))
       {
           teacher = findValidTeacher(request.getTeacherId());
       }else if (currentUserService.hasRole(currentUser, RoleName.TEACHER))
        {
           teacher = userRepository.findById(currentUser.getId()).orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND));
       }
       else{
            throw new AppException(ErrorCode.FORBIDDEN);
       }
        Course course = new Course();
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        courseRepository.save(course);
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

        if (request.getName() != null) {
            course.setName(request.getName());
        }

        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }

        if (request.getTeacherId() != null) {
            User currentUser = currentUserService.requireCurrentUser();
            if (!currentUserService.isAdmin(currentUser)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            User teacher = findValidTeacher(request.getTeacherId());
            course.setTeacher(teacher);
        }

        courseRepository.save(course);
        return courseMapper.toResponse(course);
    }

    public void delete(Long id) {
        Course course = findCourseByManageScope(id);
        courseRepository.delete(course);
    }

    private Course findCourseByDataScope(Long id) {
        User currentUser = currentUserService.requireCurrentUser();

        if (currentUserService.isAdmin(currentUser)) {
            return courseRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        }

        if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            return courseRepository.findByIdAndTeacherId(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        }

        if (currentUserService.hasRole(currentUser, RoleName.STUDENT)) {
            return courseRepository.findByIdAndStudents_Id(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        }

        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private Course findCourseByManageScope(Long id) {
        User currentUser = currentUserService.requireCurrentUser();

        if (currentUserService.isAdmin(currentUser)) {
            return courseRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        }

        if (currentUserService.hasRole(currentUser, RoleName.TEACHER)) {
            return courseRepository.findByIdAndTeacherId(id, currentUser.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        }

        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private User findValidTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean isTeacher = teacher.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.TEACHER);

        if (!isTeacher) {
            throw new AppException(ErrorCode.INVALID_TEACHER);
        }

        return teacher;
    }
}
