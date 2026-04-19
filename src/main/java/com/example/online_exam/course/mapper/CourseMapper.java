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
    @Mapping(target = "createdBy", expression = "java(mapCreator(course.getCreatedBy()))")
    @Mapping(target = "teachers", expression = "java(mapTeachers(course.getTeachers()))")
    @Mapping(target = "students", expression = "java(mapStudents(course.getStudents()))")
    @Mapping(target = "studentCount", expression = "java(course.getStudents() != null ? course.getStudents().size() : 0)")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    CourseResponse toResponse(Course course);

    List<CourseResponse> toResponses(List<Course> courses);

    default CourseResponse.CreatorInfo mapCreator(com.example.online_exam.user.entity.User user) {
        if (user == null) return null;
        return CourseResponse.CreatorInfo.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .build();
    }

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
    
    default List<CourseResponse.StudentInfo> mapStudents(java.util.Set<com.example.online_exam.user.entity.User> students) {
        if (students == null) return List.of();
        return students.stream()
                .map(s -> CourseResponse.StudentInfo.builder()
                        .id(s.getId())
                        .fullName(s.getFullName())
                        .username(s.getUsername())
                        .build())
                .collect(Collectors.toList());
    }
}

