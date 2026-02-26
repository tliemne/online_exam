package com.example.online_exam.course.mapper;

import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
@Mapper(componentModel = "spring")
//@Mapper(componentModel = "spring", uses = com.example.online_exam.user.mapper.UserMapper.class)
public interface CourseMapper {

//    @Mapping(
//            target = "teacherName",
//            expression = "java(course.getTeacher() != null ? course.getTeacher().getFullName() : null)"
//    )
    @Mapping(target = "teacherName", source = "teacher.fullName")
    CourseResponse toResponse(Course course);

    List<CourseResponse> toResponses(List<Course> courses);
}
