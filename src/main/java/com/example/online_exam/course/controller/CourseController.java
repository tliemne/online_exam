package com.example.online_exam.course.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.course.dto.CourseRequest;
import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.dto.CourseUpdateRequest;
import com.example.online_exam.course.service.CourseService;
import com.example.online_exam.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CourseResponse> create(@RequestBody CourseRequest request) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("create course success")
                .data(courseService.create(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping
    public BaseResponse<List<CourseResponse>> getAll() {
        return BaseResponse.<List<CourseResponse>>builder()
                .status(200)
                .message("get all courses success")
                .data(courseService.getAll())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    public BaseResponse<CourseResponse> getById(@PathVariable Long id) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("get course success")
                .data(courseService.getById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CourseResponse> update(@PathVariable Long id,
                                               @RequestBody CourseUpdateRequest request) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("update course success")
                .data(courseService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return BaseResponse.<Void>builder()
                .status(200)
                .message("delete course success")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Thêm sinh viên vào lớp
    @PostMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CourseResponse> addStudent(@PathVariable Long id,
                                                   @PathVariable Long studentId) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("add student success")
                .data(courseService.addStudent(id, studentId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Xóa sinh viên khỏi lớp
    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> removeStudent(@PathVariable Long id,
                                            @PathVariable Long studentId) {
        courseService.removeStudent(id, studentId);
        return BaseResponse.<Void>builder()
                .status(200)
                .message("remove student success")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Lấy danh sách sinh viên trong lớp
    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<List<?>> getStudents(@PathVariable Long id) {
        return BaseResponse.<List<?>>builder()
                .status(200)
                .message("get students success")
                .data(courseService.getStudents(id))
                .timestamp(LocalDateTime.now())
                .build();
    }
    // Thêm nhiều sinh viên cùng lúc
    @PostMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CourseResponse> addStudents(@PathVariable Long id,
                                                    @RequestBody List<Long> studentIds) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("add students success")
                .data(courseService.addStudents(id, studentIds))
                .timestamp(LocalDateTime.now())
                .build();
    }
    @PostMapping("/{id}/teachers/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CourseResponse> addTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("add teacher success")
                .data(courseService.addTeacher(id, teacherId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}/teachers/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<CourseResponse> removeTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId) {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("remove teacher success")
                .data(courseService.removeTeacher(id, teacherId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}/teachers")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','STUDENT')")
    public BaseResponse<List<CourseResponse.TeacherInfo>> getTeachers(@PathVariable Long id) {
        return BaseResponse.<List<CourseResponse.TeacherInfo>>builder()
                .status(200)
                .message("get teachers success")
                .data(courseService.getTeachers(id))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
