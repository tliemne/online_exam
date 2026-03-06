package com.example.online_exam.course.mapper;

import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(target = "id",           source = "id")
    @Mapping(target = "teacherName",  source = "teacher.fullName")
    @Mapping(target = "studentCount", expression = "java(course.getStudents() != null ? course.getStudents().size() : 0)")
    CourseResponse toResponse(Course course);

    List<CourseResponse> toResponses(List<Course> courses);
}