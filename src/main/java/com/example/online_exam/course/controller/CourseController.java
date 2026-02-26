package com.example.online_exam.course.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.course.dto.CourseRequest;
import com.example.online_exam.course.dto.CourseResponse;
import com.example.online_exam.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {
    private final CourseService courseService;
    @PostMapping("/create")
    public BaseResponse<CourseResponse> create(@RequestBody CourseRequest request)
    {
        return BaseResponse.<CourseResponse>builder()
                .status(200)
                .message("create course success")
                .data(courseService.create(request))
                .timestamp(java.time.LocalDateTime.now())
                .build();
    }
    @GetMapping
    public BaseResponse<List<CourseResponse>> getAll()
    {
        return BaseResponse.<List<CourseResponse>>builder()
                .status(200)
                .message("get all courses success")
                .data(courseService.getAll())
                .timestamp(java.time.LocalDateTime.now())
                .build();
    }
}
