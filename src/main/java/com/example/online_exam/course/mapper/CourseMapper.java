package com.example.online_exam.course.mapper;

import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.fullName")
    @Mapping(target = "teachers", expression = "java(mapTeachers(course.getTeachers()))")
    @Mapping(target = "studentCount", expression = "java(course.getStudents() != null ? course.getStudents().size() : 0)")
    CourseResponse toResponse(Course course);

    List<CourseResponse> toResponses(List<Course> courses);

    default List<CourseResponse.TeacherInfo> mapTeachers(java.util.Set<com.example.online_exam.user.entity.User> teachers) {
        if (teachers == null) return List.of();
        return teachers.stream()
                .map(t -> CourseResponse.TeacherInfo.builder()
                        .id(t.getId())
                        .fullName(t.getFullName())
                        .username(t.getUsername())
                        .build())
                .collect(Collectors.toList());
    }
}
