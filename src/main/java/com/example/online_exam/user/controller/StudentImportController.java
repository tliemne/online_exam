package com.example.online_exam.user.controller;

import com.example.online_exam.common.dto.BaseResponse;
import com.example.online_exam.user.dto.StudentImportResult;
import com.example.online_exam.user.service.StudentImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class StudentImportController {

    private final StudentImportService studentImportService;

    // Chỉ ADMIN import student
    @PostMapping("/students/import")
    @PreAuthorize("hasRole('ADMIN')")
    public BaseResponse<StudentImportResult> importStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long courseId) {

        if (file.isEmpty())
            return error("File khong duoc de trong");
        if (!isExcel(file))
            return error("Chi ho tro file Excel .xlsx");

        StudentImportResult result = studentImportService.importFromExcel(file, courseId);
        return ok(result, buildMsg(result));
    }

    // Admin import user (co the mix STUDENT + TEACHER, khong can courseId)
    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public BaseResponse<StudentImportResult> importUsers(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty())
            return error("File khong duoc de trong");
        if (!isExcel(file))
            return error("Chi ho tro file Excel .xlsx");

        StudentImportResult result = studentImportService.importUsersFromExcel(file);
        return ok(result, buildMsg(result));
    }

    // ── helpers ───────────────────────────────────────────

    private boolean isExcel(MultipartFile f) {
        String name = f.getOriginalFilename();
        return name != null && name.toLowerCase().endsWith(".xlsx");
    }

    private String buildMsg(StudentImportResult r) {
        return String.format("Import xong: %d thanh cong, %d loi%s",
                r.getSuccessCount(), r.getErrorCount(),
                r.getEmailSentCount() > 0 ? ", gui " + r.getEmailSentCount() + " email" : "");
    }

    private <T> BaseResponse<T> ok(T data, String msg) {
        return BaseResponse.<T>builder().status(200).message(msg)
                .data(data).timestamp(LocalDateTime.now()).build();
    }

    private <T> BaseResponse<T> error(String msg) {
        return BaseResponse.<T>builder().status(400).message(msg)
                .timestamp(LocalDateTime.now()).build();
    }
}