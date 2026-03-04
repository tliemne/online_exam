package com.example.online_exam.question.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.question.dto.QuestionImportRequest;
import com.example.online_exam.question.dto.QuestionImportResult;
import com.example.online_exam.question.service.QuestionImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/questions/import")
@RequiredArgsConstructor
public class QuestionImportController {

    private final QuestionImportService importService;

    // POST /questions/import/excel?courseId=1
    @PostMapping("/excel")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<QuestionImportResult> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long courseId) {
        return BaseResponse.<QuestionImportResult>builder()
                .status(200).message("import excel success")
                .data(importService.importFromExcel(file, courseId))
                .timestamp(LocalDateTime.now()).build();
    }

    // POST /questions/import/csv?courseId=1
    @PostMapping("/csv")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<QuestionImportResult> importCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long courseId) {
        return BaseResponse.<QuestionImportResult>builder()
                .status(200).message("import csv success")
                .data(importService.importFromCsv(file, courseId))
                .timestamp(LocalDateTime.now()).build();
    }

    // POST /questions/import/json?courseId=1
    @PostMapping("/json")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public BaseResponse<QuestionImportResult> importJson(
            @RequestParam Long courseId,
            @RequestBody List<QuestionImportRequest> requests) {
        return BaseResponse.<QuestionImportResult>builder()
                .status(200).message("import json success")
                .data(importService.importFromJson(requests, courseId))
                .timestamp(LocalDateTime.now()).build();
    }
}