package com.example.online_exam.user.service;

import com.example.online_exam.common.service.EmailService;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.user.dto.CreateStudentRequest;
import com.example.online_exam.user.dto.CreateStudentResult;
import com.example.online_exam.user.dto.StudentImportResult;
import com.example.online_exam.user.dto.UserImportRequest;
import com.example.online_exam.user.dto.UserRegisterRequest;
import com.example.online_exam.user.dto.UserResponse;
import com.example.online_exam.user.enums.RoleName;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentImportService {

    private final UserService userService;
    private final CourseRepository courseRepository;

    @Autowired(required = false)
    private EmailService emailService;

    // ── Import student (Teacher dùng) ─────────────────────
    // Format: Họ tên | Username | Mật khẩu | Email | Mã SV | Lớp
    public StudentImportResult importFromExcel(MultipartFile file, Long courseId) {
        Course course = null;
        if (courseId != null) {
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        }
        StudentImportResult result = new StudentImportResult();
        List<CreateStudentResult> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int emailSent = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            result.setTotalRows(sheet.getLastRowNum());
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                try {
                    CreateStudentRequest req = parseStudentRow(row, courseId, i);
                    CreateStudentResult r = userService.createStudent(req);
                    created.add(r);
                    // Email đã được gửi trong createStudent() — không gửi lại
                    if (shouldSendEmail(req.getEmail())) emailSent++;
                } catch (Exception e) {
                    errors.add("Dong " + (i + 1) + ": " + sanitizeError(e));
                }
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Excel parse error: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        result.setCreated(created);
        result.setErrors(errors);
        result.setSuccessCount(created.size());
        result.setErrorCount(errors.size());
        result.setEmailSentCount(emailSent);
        return result;
    }

    // ── Import user hon hop (Admin dung) ──────────────────
    // Format: Họ tên | Username | Mật khẩu | Email | Role | Mã SV/GV | Lớp/Khoa
    public StudentImportResult importUsersFromExcel(MultipartFile file) {
        StudentImportResult result = new StudentImportResult();
        List<CreateStudentResult> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int emailSent = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            result.setTotalRows(sheet.getLastRowNum());
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;
                try {
                    UserImportRequest req = parseUserRow(row, i);
                    String plainPwd = (req.getPassword() != null && !req.getPassword().isBlank())
                            ? req.getPassword() : req.getUsername() + "123";

                    UserRegisterRequest regReq = new UserRegisterRequest();
                    regReq.setUsername(req.getUsername());
                    regReq.setFullName(req.getFullName());
                    regReq.setPassword(plainPwd);
                    regReq.setEmail(req.getEmail() != null ? req.getEmail()
                            : req.getUsername() + "@school.edu.vn");
                    regReq.setRole(req.getRole() != null ? req.getRole() : RoleName.STUDENT);

                    UserResponse userResp = userService.register(regReq);
                    CreateStudentResult r = new CreateStudentResult(
                            userResp.getId(), userResp.getUsername(),
                            userResp.getFullName(), userResp.getEmail(),
                            plainPwd, req.getStudentCode(), req.getClassName(), null);
                    created.add(r);

                    // Email đã được gửi trong register() — không gửi lại
                    if (shouldSendEmail(req.getEmail())) emailSent++;
                } catch (Exception e) {
                    errors.add("Dong " + (i + 1) + ": " + sanitizeError(e));
                }
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Excel parse error (admin): {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        result.setCreated(created);
        result.setErrors(errors);
        result.setSuccessCount(created.size());
        result.setErrorCount(errors.size());
        result.setEmailSentCount(emailSent);
        return result;
    }

    // ── Parse rows ────────────────────────────────────────

    private CreateStudentRequest parseStudentRow(Row row, Long courseId, int idx) {
        String fullName = getString(row, 0);
        String username = getString(row, 1);
        if (fullName == null || fullName.isBlank())
            throw new IllegalArgumentException("Ho ten khong duoc de trong");
        if (username == null || username.isBlank())
            username = generateUsername(fullName, idx);
        CreateStudentRequest req = new CreateStudentRequest();
        req.setFullName(fullName.trim());
        req.setUsername(username.trim());
        req.setPassword(getString(row, 2));
        req.setEmail(getString(row, 3));
        req.setStudentCode(getString(row, 4));
        req.setClassName(getString(row, 5));
        req.setCourseId(courseId);
        return req;
    }

    private UserImportRequest parseUserRow(Row row, int idx) {
        String fullName = getString(row, 0);
        String username = getString(row, 1);
        String roleStr  = getString(row, 4);
        if (fullName == null || fullName.isBlank())
            throw new IllegalArgumentException("Ho ten khong duoc de trong");
        if (username == null || username.isBlank())
            username = generateUsername(fullName, idx);

        RoleName role = RoleName.STUDENT;
        if (roleStr != null) {
            String r = roleStr.trim().toUpperCase();
            if (r.contains("TEACHER") || r.contains("GV")) role = RoleName.TEACHER;
        }
        UserImportRequest req = new UserImportRequest();
        req.setFullName(fullName.trim());
        req.setUsername(username.trim());
        req.setPassword(getString(row, 2));
        req.setEmail(getString(row, 3));
        req.setRole(role);
        String code = getString(row, 5);
        String dept = getString(row, 6);
        if (role == RoleName.STUDENT) { req.setStudentCode(code); req.setClassName(dept); }
        else                          { req.setTeacherCode(code); req.setDepartment(dept); }
        return req;
    }

    // ── Helpers ───────────────────────────────────────────

    private boolean shouldSendEmail(String email) {
        return emailService != null && email != null
                && !email.isBlank() && !email.endsWith("@school.edu.vn");
    }

    private String sanitizeError(Exception e) {
        String msg = e.getMessage();
        if (msg == null) return e.getClass().getSimpleName();
        if (msg.toLowerCase().contains("exist")) return "Username da ton tai";
        return msg;
    }

    private String generateUsername(String fullName, int index) {
        String n = fullName.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]","a").replaceAll("[èéẹẻẽêềếệểễ]","e")
                .replaceAll("[ìíịỉĩ]","i").replaceAll("[òóọỏõôồốộổỗơờớợởỡ]","o")
                .replaceAll("[ùúụủũưừứựửữ]","u").replaceAll("[ỳýỵỷỹ]","y")
                .replaceAll("đ","d").replaceAll("[^a-z0-9 ]","").trim();
        String[] p = n.split("\\s+");
        StringBuilder sb = new StringBuilder();
        if (p.length > 0) sb.append(p[p.length - 1]);
        for (int i = 0; i < p.length - 1; i++) if (!p[i].isEmpty()) sb.append(p[i].charAt(0));
        sb.append(String.format("%02d", index));
        return sb.toString();
    }

    private static final DataFormatter DATA_FORMATTER = new DataFormatter();

    private String getString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        String val;
        if (cell.getCellType() == CellType.STRING) {
            val = cell.getStringCellValue();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            // Số nguyên (mã SV dạng số) → không có dấu .0
            double d = cell.getNumericCellValue();
            val = (d == Math.floor(d)) ? String.valueOf((long) d) : String.valueOf(d);
        } else if (cell.getCellType() == CellType.BOOLEAN) {
            val = String.valueOf(cell.getBooleanCellValue());
        } else {
            val = DATA_FORMATTER.formatCellValue(cell);
        }
        return (val == null || val.isBlank()) ? null : val.trim();
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }
}