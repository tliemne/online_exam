package com.example.online_exam.course.service;

import com.example.online_exam.course.dto.CourseRequest;
import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.mapper.CourseMapper;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseMapper courseMapper;

    public CourseResponse create(CourseRequest request)
    {
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Course course = new Course();
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        courseRepository.save(course);
        return courseMapper.toResponse(course);
    }
    public List<CourseResponse> getAll(){
        return courseMapper.toResponses(courseRepository.findAll());
    }

}
