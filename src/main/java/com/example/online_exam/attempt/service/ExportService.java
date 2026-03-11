package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.enums.AttemptStatus;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.exam.entity.Exam;
import com.example.online_exam.exam.repository.ExamRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final ExamRepository    examRepo;
    private final AttemptRepository attemptRepo;
    private final CurrentUserService currentUserService;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Xuất kết quả thi của 1 đề ra file Excel (.xlsx)
     * Teacher chỉ xuất được đề của mình, Admin xuất được tất cả.
     */
    public byte[] exportExamResults(Long examId) {
        Exam exam = examRepo.findById(examId)
                .orElseThrow(() -> new AppException(ErrorCode.EXAM_NOT_FOUND));

        User caller = currentUserService.requireCurrentUser();
        if (isTeacher(caller) && !isOwner(exam, caller)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<Attempt> attempts = attemptRepo.findByExamIdOrderBySubmittedAtDesc(examId)
                .stream()
                .filter(a -> a.getStatus() == AttemptStatus.GRADED
                        || a.getStatus() == AttemptStatus.SUBMITTED)
                .sorted(Comparator.comparing(a -> {
                    if (a.getStudent() != null) return a.getStudent().getFullName();
                    return "";
                }))
                .collect(Collectors.toList());

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Kết quả thi");
            sheet.setDefaultColumnWidth(18);

            // ── Styles ────────────────────────────────────
            CellStyle titleStyle = wb.createCellStyle();
            XSSFFont titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle headerStyle = wb.createCellStyle();
            XSSFFont headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)79,(byte)70,(byte)229}, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle passStyle = wb.createCellStyle();
            XSSFFont passFont = wb.createFont();
            passFont.setColor(new XSSFColor(new byte[]{(byte)22,(byte)163,(byte)74}, null));
            passFont.setBold(true);
            passStyle.setFont(passFont);
            passStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle failStyle = wb.createCellStyle();
            XSSFFont failFont = wb.createFont();
            failFont.setColor(new XSSFColor(new byte[]{(byte)220,(byte)38,(byte)38}, null));
            failFont.setBold(true);
            failStyle.setFont(failFont);
            failStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle pendingStyle = wb.createCellStyle();
            XSSFFont pendingFont = wb.createFont();
            pendingFont.setColor(new XSSFColor(new byte[]{(byte)217,(byte)119,(byte)6}, null));
            pendingStyle.setFont(pendingFont);
            pendingStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle centerStyle = wb.createCellStyle();
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle altRowStyle = wb.createCellStyle();
            altRowStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)248,(byte)250,(byte)252}, null));
            altRowStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ── Row 0: Tiêu đề ────────────────────────────
            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(28);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("KẾT QUẢ THI: " + exam.getTitle().toUpperCase());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 8));

            // ── Row 1: Thông tin đề ───────────────────────
            Row infoRow = sheet.createRow(1);
            String courseName = exam.getCourse() != null ? exam.getCourse().getName() : "—";
            String dateInfo   = exam.getStartTime() != null ? exam.getStartTime().format(DT) : "—";
            infoRow.createCell(0).setCellValue("Lớp: " + courseName
                    + "   |   Ngày thi: " + dateInfo
                    + "   |   Điểm đạt: " + (exam.getPassScore() != null ? exam.getPassScore() : "—")
                    + "/" + (exam.getTotalScore() != null ? exam.getTotalScore() : 10));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 8));

            // ── Row 2: Trống ──────────────────────────────
            sheet.createRow(2);

            // ── Row 3: Header ─────────────────────────────
            String[] headers = {"STT", "Họ và tên", "Mã sinh viên", "Lớp",
                    "Điểm số", "Điểm tối đa", "Đúng/Tổng", "Kết quả", "Thời gian nộp"};
            int[] colWidths  = {6, 24, 14, 14, 10, 12, 12, 12, 20};

            Row headerRow = sheet.createRow(3);
            headerRow.setHeightInPoints(20);
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, colWidths[i] * 256);
            }

            // ── Rows: Data ────────────────────────────────
            AtomicInteger stt = new AtomicInteger(1);
            long gradedCount = attempts.stream().filter(a -> a.getStatus() == AttemptStatus.GRADED).count();
            long passedCount = attempts.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
            double avgScore  = attempts.stream()
                    .filter(a -> a.getScore() != null)
                    .mapToDouble(Attempt::getScore).average().orElse(0);

            for (Attempt a : attempts) {
                int rowIdx = stt.get() + 3;
                Row row = sheet.createRow(rowIdx);
                row.setHeightInPoints(18);

                boolean isAlt = stt.get() % 2 == 0;

                setCell(row, 0, String.valueOf(stt.getAndIncrement()), isAlt ? altRowStyle : null, centerStyle);

                // Họ tên
                row.createCell(1).setCellValue(
                        a.getStudent() != null ? a.getStudent().getFullName() : "—");

                // Mã SV
                String code = (a.getStudent() != null && a.getStudent().getStudentProfile() != null)
                        ? a.getStudent().getStudentProfile().getStudentCode() : "—";
                Cell codeCell = row.createCell(2);
                codeCell.setCellValue(code != null ? code : "—");
                codeCell.setCellStyle(centerStyle);

                // Lớp SV
                String className = (a.getStudent() != null && a.getStudent().getStudentProfile() != null)
                        ? a.getStudent().getStudentProfile().getClassName() : "—";
                Cell classCell = row.createCell(3);
                classCell.setCellValue(className != null ? className : "—");
                classCell.setCellStyle(centerStyle);

                // Điểm
                Cell scoreCell = row.createCell(4);
                if (a.getScore() != null) scoreCell.setCellValue(a.getScore());
                else scoreCell.setCellValue("—");
                scoreCell.setCellStyle(centerStyle);

                // Điểm tối đa
                Cell maxCell = row.createCell(5);
                maxCell.setCellValue(a.getTotalScore() != null ? a.getTotalScore() : 10);
                maxCell.setCellStyle(centerStyle);

                // Đúng/Tổng câu
                long correct = a.getAnswers().stream()
                        .filter(aa -> Boolean.TRUE.equals(aa.getIsCorrect())).count();
                Cell correctCell = row.createCell(6);
                correctCell.setCellValue(correct + "/" + a.getAnswers().size());
                correctCell.setCellStyle(centerStyle);

                // Kết quả
                Cell resultCell = row.createCell(7);
                if (a.getStatus() == AttemptStatus.SUBMITTED) {
                    resultCell.setCellValue("Chờ chấm");
                    resultCell.setCellStyle(pendingStyle);
                } else if (Boolean.TRUE.equals(a.getPassed())) {
                    resultCell.setCellValue("Đạt");
                    resultCell.setCellStyle(passStyle);
                } else {
                    resultCell.setCellValue("Chưa đạt");
                    resultCell.setCellStyle(failStyle);
                }

                // Thời gian nộp
                Cell timeCell = row.createCell(8);
                timeCell.setCellValue(a.getSubmittedAt() != null ? a.getSubmittedAt().format(DT) : "—");
                timeCell.setCellStyle(centerStyle);
            }

            // ── Summary rows ──────────────────────────────
            int sumStart = attempts.size() + 5;
            sheet.createRow(sumStart);

            Row sumRow = sheet.createRow(sumStart + 1);
            sumRow.createCell(0).setCellValue("Tổng số bài:");
            sumRow.createCell(1).setCellValue(attempts.size());
            sumRow.createCell(3).setCellValue("Đã chấm:");
            sumRow.createCell(4).setCellValue(gradedCount);
            sumRow.createCell(6).setCellValue("Đạt:");
            sumRow.createCell(7).setCellValue(passedCount);

            Row sumRow2 = sheet.createRow(sumStart + 2);
            sumRow2.createCell(0).setCellValue("Điểm trung bình:");
            sumRow2.createCell(1).setCellValue(Math.round(avgScore * 10.0) / 10.0);
            if (gradedCount > 0) {
                sumRow2.createCell(3).setCellValue("Tỉ lệ đạt:");
                sumRow2.createCell(4).setCellValue(
                        Math.round((double) passedCount / gradedCount * 1000.0) / 10.0 + "%");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Export Excel thất bại: " + e.getMessage(), e);
        }
    }

    private void setCell(Row row, int col, String value, CellStyle alt, CellStyle center) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(center != null ? center : alt);
    }

    private boolean isTeacher(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.TEACHER);
    }

    private boolean isOwner(Exam exam, User user) {
        return exam.getCreatedBy() != null && exam.getCreatedBy().getId().equals(user.getId());
    }
}