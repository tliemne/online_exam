package com.example.online_exam.lecture.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.lecture.dto.LectureRequest;
import com.example.online_exam.lecture.dto.LectureResponse;
import com.example.online_exam.lecture.service.LectureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}/lectures")
@RequiredArgsConstructor
public class LectureController {

    private final LectureService lectureService;

    /** Lấy danh sách bài giảng của lớp — tất cả role */
    @GetMapping
    public BaseResponse<List<LectureResponse>> getByCourse(@PathVariable Long courseId) {
        return BaseResponse.<List<LectureResponse>>builder()
                .status(200).message("ok")
                .data(lectureService.getByCourse(courseId))
                .timestamp(LocalDateTime.now()).build();
    }

    /** Thêm bài giảng — TEACHER / ADMIN */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<LectureResponse> create(
            @PathVariable Long courseId,
            @RequestBody @Valid LectureRequest request) {
        return BaseResponse.<LectureResponse>builder()
                .status(201).message("created")
                .data(lectureService.create(courseId, request))
                .timestamp(LocalDateTime.now()).build();
    }

    /** Sửa bài giảng */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<LectureResponse> update(
            @PathVariable Long courseId,
            @PathVariable Long id,
            @RequestBody @Valid LectureRequest request) {
        return BaseResponse.<LectureResponse>builder()
                .status(200).message("updated")
                .data(lectureService.update(id, request))
                .timestamp(LocalDateTime.now()).build();
    }

    /** Xóa bài giảng */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<Void> delete(@PathVariable Long courseId, @PathVariable Long id) {
        lectureService.delete(id);
        return BaseResponse.<Void>builder()
                .status(200).message("deleted")
                .timestamp(LocalDateTime.now()).build();
    }
}