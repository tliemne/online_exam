package com.example.online_exam.attempt.service;

import com.example.online_exam.attempt.dto.CourseLeaderboardResponse;
import com.example.online_exam.attempt.entity.Attempt;
import com.example.online_exam.attempt.enums.AttemptStatus;
import com.example.online_exam.attempt.repository.AttemptRepository;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
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

    private final ExamRepository           examRepo;
    private final AttemptRepository        attemptRepo;
    private final CourseRepository         courseRepo;
    private final CourseLeaderboardService leaderboardService;
    private final CurrentUserService       currentUserService;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

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
    // ── Export BXH lớp ───────────────────────────────────────────────────
    public byte[] exportCourseLeaderboard(Long courseId) {
        User caller = currentUserService.requireCurrentUser();
        if (!isTeacher(caller) && !isAdmin(caller)) throw new AppException(ErrorCode.FORBIDDEN);

        CourseLeaderboardResponse data = leaderboardService.getLeaderboard(courseId);

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Bảng xếp hạng");
            sheet.setDefaultColumnWidth(20);

            CellStyle titleStyle  = makeTitleStyle(wb);
            CellStyle headerStyle = makeHeaderStyle(wb);
            CellStyle centerStyle = makeCenterStyle(wb);
            CellStyle goldStyle   = makeRankStyle(wb, new byte[]{(byte)202,(byte)138,(byte)4});
            CellStyle silverStyle = makeRankStyle(wb, new byte[]{(byte)100,(byte)116,(byte)139});
            CellStyle bronzeStyle = makeRankStyle(wb, new byte[]{(byte)180,(byte)83,(byte)9});

            Row title = sheet.createRow(0); title.setHeightInPoints(26);
            Cell tc = title.createCell(0);
            tc.setCellValue("BẢNG XẾP HẠNG LỚP: " + data.getCourseName().toUpperCase());
            tc.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

            Row info = sheet.createRow(1);
            info.createCell(0).setCellValue(
                    "Tổng sinh viên đã thi: " + data.getTotalStudents()
                            + "   |   Số đề thi: " + data.getTotalExams());
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));
            sheet.createRow(2);

            String[] headers = {"Hạng", "Tên sinh viên", "Mã SV", "Bài đã thi", "Điểm TB (%)", "Đạt / Tổng", "Bài thi gần nhất"};
            int[]    widths  = {8, 26, 14, 14, 14, 14, 28};
            Row hrow = sheet.createRow(3); hrow.setHeightInPoints(18);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hrow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, widths[i] * 256);
            }

            int rowIdx = 4;
            for (CourseLeaderboardResponse.StudentRankEntry e : data.getRanking()) {
                Row row = sheet.createRow(rowIdx++);
                row.setHeightInPoints(17);

                CellStyle rankSt = e.getRank() == 1 ? goldStyle
                        : e.getRank() == 2 ? silverStyle
                        : e.getRank() == 3 ? bronzeStyle : centerStyle;

                Cell rankCell = row.createCell(0);
                rankCell.setCellValue("#" + e.getRank());
                rankCell.setCellStyle(rankSt);
                row.createCell(1).setCellValue(e.getStudentName() != null ? e.getStudentName() : "");
                Cell codeCell = row.createCell(2); codeCell.setCellValue(e.getStudentCode() != null ? e.getStudentCode() : ""); codeCell.setCellStyle(centerStyle);
                Cell takenCell = row.createCell(3); takenCell.setCellValue(e.getExamsTaken()); takenCell.setCellStyle(centerStyle);
                Cell avgCell = row.createCell(4); avgCell.setCellValue(Math.round(e.getAvgScore() * 10.0) / 10.0 + "%"); avgCell.setCellStyle(centerStyle);
                Cell passCell = row.createCell(5); passCell.setCellValue(e.getExamsPasssed() + " / " + e.getExamsTaken()); passCell.setCellStyle(centerStyle);
                row.createCell(6).setCellValue(e.getLastExamTitle() != null ? e.getLastExamTitle() : "");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (AppException e) { throw e; }
        catch (Exception e) { throw new RuntimeException("Export BXH lớp thất bại: " + e.getMessage(), e); }
    }

    // ── Export báo cáo tổng hợp lớp ─────────────────────────────────────
    public byte[] exportCourseReport(Long courseId) {
        User caller = currentUserService.requireCurrentUser();
        if (!isTeacher(caller) && !isAdmin(caller)) throw new AppException(ErrorCode.FORBIDDEN);

        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        java.util.List<Attempt> attempts = attemptRepo.findForCourseLeaderboard(courseId);
        java.util.Map<Long, java.util.List<Attempt>> byExam = attempts.stream()
                .collect(java.util.stream.Collectors.groupingBy(a -> a.getExam().getId()));

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Báo cáo tổng hợp");
            sheet.setDefaultColumnWidth(18);

            CellStyle titleStyle  = makeTitleStyle(wb);
            CellStyle headerStyle = makeHeaderStyle(wb);
            CellStyle centerStyle = makeCenterStyle(wb);
            CellStyle greenStyle  = makeColorStyle(wb, new byte[]{(byte)21,(byte)128,(byte)61});
            CellStyle redStyle    = makeColorStyle(wb, new byte[]{(byte)185,(byte)28,(byte)28});

            Row title = sheet.createRow(0); title.setHeightInPoints(26);
            Cell tc = title.createCell(0);
            tc.setCellValue("BÁO CÁO TỔNG HỢP LỚP: " + course.getName().toUpperCase());
            tc.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            Row info = sheet.createRow(1);
            info.createCell(0).setCellValue("Số đề thi: " + byExam.size() + "   |   Tổng lượt thi: " + attempts.size());
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));
            sheet.createRow(2);

            String[] headers = {"Đề thi", "Lượt thi", "Điểm TB", "Cao nhất", "Thấp nhất", "Đạt", "Trượt", "Tỉ lệ đạt"};
            int[]    widths  = {32, 10, 12, 12, 12, 10, 10, 12};
            Row hrow = sheet.createRow(3); hrow.setHeightInPoints(18);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hrow.createCell(i); c.setCellValue(headers[i]); c.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, widths[i] * 256);
            }

            int rowIdx = 4;
            double grandTotal = 0; int grandCount = 0, grandPass = 0, grandFail = 0;

            for (java.util.Map.Entry<Long, java.util.List<Attempt>> entry : byExam.entrySet()) {
                java.util.List<Attempt> ea = entry.getValue();
                Attempt any = ea.get(0);
                double maxScore = any.getExam().getTotalScore() != null ? any.getExam().getTotalScore() : 10.0;

                int pass = (int) ea.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();
                int fail = ea.size() - pass;
                double avg = ea.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() / maxScore * 100 : 0).average().orElse(0);
                double max = ea.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() / maxScore * 100 : 0).max().orElse(0);
                double min = ea.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() / maxScore * 100 : 0).min().orElse(0);
                double passRate = ea.isEmpty() ? 0 : Math.round((double) pass / ea.size() * 1000.0) / 10.0;
                grandTotal += avg * ea.size(); grandCount += ea.size(); grandPass += pass; grandFail += fail;

                Row row = sheet.createRow(rowIdx++); row.setHeightInPoints(17);
                row.createCell(0).setCellValue(any.getExam().getTitle());
                Cell c1 = row.createCell(1); c1.setCellValue(ea.size()); c1.setCellStyle(centerStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(Math.round(avg*10)/10.0+"%"); c2.setCellStyle(centerStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(Math.round(max*10)/10.0+"%"); c3.setCellStyle(centerStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(Math.round(min*10)/10.0+"%"); c4.setCellStyle(centerStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(pass); c5.setCellStyle(greenStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(fail); c6.setCellStyle(redStyle);
                Cell c7 = row.createCell(7); c7.setCellValue(passRate+"%"); c7.setCellStyle(centerStyle);
            }

            sheet.createRow(rowIdx++);
            Row sumRow = sheet.createRow(rowIdx); sumRow.setHeightInPoints(18);
            sumRow.createCell(0).setCellValue("TỔNG KẾT");
            Cell sc1 = sumRow.createCell(1); sc1.setCellValue(grandCount); sc1.setCellStyle(centerStyle);
            double grandAvg = grandCount > 0 ? grandTotal / grandCount : 0;
            Cell sc2 = sumRow.createCell(2); sc2.setCellValue(Math.round(grandAvg*10)/10.0+"%"); sc2.setCellStyle(centerStyle);
            Cell sc5 = sumRow.createCell(5); sc5.setCellValue(grandPass); sc5.setCellStyle(greenStyle);
            Cell sc6 = sumRow.createCell(6); sc6.setCellValue(grandFail); sc6.setCellStyle(redStyle);
            double grandRate = grandCount > 0 ? Math.round((double) grandPass / grandCount * 1000.0) / 10.0 : 0;
            Cell sc7 = sumRow.createCell(7); sc7.setCellValue(grandRate+"%"); sc7.setCellStyle(centerStyle);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (AppException e) { throw e; }
        catch (Exception e) { throw new RuntimeException("Export báo cáo lớp thất bại: " + e.getMessage(), e); }
    }

    // ── Style helpers ─────────────────────────────────────────────────────
    private CellStyle makeTitleStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont f = wb.createFont(); f.setBold(true); f.setFontHeightInPoints((short) 14);
        s.setFont(f); s.setAlignment(HorizontalAlignment.CENTER); return s;
    }

    private CellStyle makeHeaderStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont f = wb.createFont(); f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        ((XSSFCellStyle) s).setFillForegroundColor(new XSSFColor(new byte[]{(byte)79,(byte)70,(byte)229}, null));
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER); return s;
    }

    private CellStyle makeCenterStyle(XSSFWorkbook wb) {
        CellStyle s = wb.createCellStyle(); s.setAlignment(HorizontalAlignment.CENTER); return s;
    }

    private CellStyle makeRankStyle(XSSFWorkbook wb, byte[] rgb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont f = wb.createFont(); f.setBold(true); f.setColor(new XSSFColor(rgb, null));
        s.setFont(f); s.setAlignment(HorizontalAlignment.CENTER); return s;
    }

    private CellStyle makeColorStyle(XSSFWorkbook wb, byte[] rgb) {
        CellStyle s = wb.createCellStyle();
        XSSFFont f = wb.createFont(); f.setBold(true); f.setColor(new XSSFColor(rgb, null));
        s.setFont(f); s.setAlignment(HorizontalAlignment.CENTER); return s;
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMIN);
    }

}