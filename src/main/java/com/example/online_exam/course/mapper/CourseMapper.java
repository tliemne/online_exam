package com.example.online_exam.course.mapper;

import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "teacherId", source = "teacher.id")
    @Mapping(target = "teacherName", source = "teacher.fullName")
    CourseResponse toResponse(Course course);

    List<CourseResponse> toResponses(List<Course> courses);
}
