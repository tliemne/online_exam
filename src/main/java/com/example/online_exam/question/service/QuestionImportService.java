package com.example.online_exam.question.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.question.dto.AnswerRequest;
import com.example.online_exam.question.dto.QuestionImportRequest;
import com.example.online_exam.question.dto.QuestionImportResult;
import com.example.online_exam.question.dto.QuestionRequest;
import com.example.online_exam.question.enums.Difficulty;
import com.example.online_exam.question.enums.QuestionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionImportService {

    private final QuestionService questionService;
    private final CourseRepository courseRepository;

    // ── Excel Import ─────────────────────────────────────
    public QuestionImportResult importFromExcel(MultipartFile file, Long courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        QuestionImportResult result = new QuestionImportResult();
        List<String> errors = new ArrayList<>();
        List<com.example.online_exam.question.dto.QuestionResponse> imported = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int totalRows = sheet.getLastRowNum(); // row 0 = header
            result.setTotalRows(totalRows);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                try {
                    QuestionRequest req = parseExcelRow(row, courseId, i);
                    imported.add(questionService.create(req));
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        result.setSuccessCount(imported.size());
        result.setFailCount(errors.size());
        result.setErrors(errors);
        result.setImported(imported);
        return result;
    }

    // ── CSV Import ───────────────────────────────────────
    public QuestionImportResult importFromCsv(MultipartFile file, Long courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        QuestionImportResult result = new QuestionImportResult();
        List<String> errors = new ArrayList<>();
        List<com.example.online_exam.question.dto.QuestionResponse> imported = new ArrayList<>();
        int rowNum = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), "UTF-8"))) {

            String headerLine = reader.readLine(); // Bỏ qua header
            String line;

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.isBlank()) continue;
                try {
                    QuestionRequest req = parseCsvLine(line, courseId, rowNum);
                    imported.add(questionService.create(req));
                } catch (Exception e) {
                    errors.add("Dòng " + (rowNum + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        result.setTotalRows(rowNum);
        result.setSuccessCount(imported.size());
        result.setFailCount(errors.size());
        result.setErrors(errors);
        result.setImported(imported);
        return result;
    }

    // ── JSON Import ──────────────────────────────────────
    public QuestionImportResult importFromJson(List<QuestionImportRequest> requests, Long courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        QuestionImportResult result = new QuestionImportResult();
        List<String> errors = new ArrayList<>();
        List<com.example.online_exam.question.dto.QuestionResponse> imported = new ArrayList<>();
        result.setTotalRows(requests.size());

        for (int i = 0; i < requests.size(); i++) {
            try {
                QuestionImportRequest r = requests.get(i);
                QuestionRequest req = new QuestionRequest();
                req.setContent(r.getContent());
                req.setType(r.getType());
                req.setDifficulty(r.getDifficulty() != null ? r.getDifficulty() : Difficulty.MEDIUM);
                req.setCourseId(courseId);
                req.setAnswers(r.getAnswers());
                imported.add(questionService.create(req));
            } catch (Exception e) {
                errors.add("Câu " + (i + 1) + ": " + e.getMessage());
            }
        }

        result.setSuccessCount(imported.size());
        result.setFailCount(errors.size());
        result.setErrors(errors);
        result.setImported(imported);
        return result;
    }

    // ── Helpers ──────────────────────────────────────────

    /**
     * Format Excel (mỗi row):
     * Col 0: content
     * Col 1: type (MULTIPLE_CHOICE / TRUE_FALSE / ESSAY)
     * Col 2: difficulty (EASY / MEDIUM / HARD)
     * Col 3: answer A
     * Col 4: answer B
     * Col 5: answer C
     * Col 6: answer D
     * Col 7: correct answer (A / B / C / D  hoặc  ĐÚNG/SAI  hoặc  bỏ trống nếu ESSAY)
     */
    private QuestionRequest parseExcelRow(Row row, Long courseId, int rowIdx) {
        String content = getCellString(row, 0);
        if (content == null || content.isBlank())
            throw new IllegalArgumentException("Content rỗng");

        QuestionType type = parseType(getCellString(row, 1), rowIdx);
        Difficulty diff   = parseDifficulty(getCellString(row, 2));

        QuestionRequest req = new QuestionRequest();
        req.setContent(content.trim());
        req.setType(type);
        req.setDifficulty(diff);
        req.setCourseId(courseId);
        req.setAnswers(buildAnswers(type, row));
        return req;
    }

    /**
     * Format CSV: content,type,difficulty,A,B,C,D,correct
     */
    private QuestionRequest parseCsvLine(String line, Long courseId, int rowNum) {
        // Handle quoted fields with commas inside
        List<String> cols = splitCsv(line);
        if (cols.size() < 3)
            throw new IllegalArgumentException("Thiếu cột (cần ít nhất: content, type, difficulty)");

        String content = cols.get(0).trim().replaceAll("^\"|\"$", "");
        if (content.isBlank()) throw new IllegalArgumentException("Content rỗng");

        QuestionType type = parseType(cols.get(1).trim(), rowNum);
        Difficulty diff   = parseDifficulty(cols.size() > 2 ? cols.get(2).trim() : "MEDIUM");

        List<AnswerRequest> answers = new ArrayList<>();
        if (type == QuestionType.MULTIPLE_CHOICE && cols.size() >= 8) {
            String[] labels = {"A", "B", "C", "D"};
            String correctLabel = cols.get(7).trim().toUpperCase();
            for (int i = 0; i < 4; i++) {
                String ans = cols.size() > (3 + i) ? cols.get(3 + i).trim().replaceAll("^\"|\"$", "") : "";
                if (!ans.isBlank()) {
                    AnswerRequest a = new AnswerRequest();
                    a.setContent(ans);
                    a.setCorrect(labels[i].equals(correctLabel));
                    answers.add(a);
                }
            }
        } else if (type == QuestionType.TRUE_FALSE) {
            String correct = cols.size() > 3 ? cols.get(3).trim().toUpperCase() : "TRUE";
            answers.add(makeAnswer("Đúng", correct.equals("ĐÚNG") || correct.equals("TRUE") || correct.equals("A")));
            answers.add(makeAnswer("Sai",  !correct.equals("ĐÚNG") && !correct.equals("TRUE") && !correct.equals("A")));
        }

        QuestionRequest req = new QuestionRequest();
        req.setContent(content);
        req.setType(type);
        req.setDifficulty(diff);
        req.setCourseId(courseId);
        req.setAnswers(answers);
        return req;
    }

    private List<AnswerRequest> buildAnswers(QuestionType type, Row row) {
        List<AnswerRequest> answers = new ArrayList<>();
        if (type == QuestionType.ESSAY) return answers;

        if (type == QuestionType.TRUE_FALSE) {
            String correct = getCellString(row, 7);
            boolean trueIsCorrect = correct == null || correct.toUpperCase().contains("ĐÚNG")
                    || correct.toUpperCase().contains("TRUE") || correct.toUpperCase().equals("A");
            answers.add(makeAnswer("Đúng", trueIsCorrect));
            answers.add(makeAnswer("Sai", !trueIsCorrect));
            return answers;
        }

        // MULTIPLE_CHOICE: col 3-6 = A/B/C/D, col 7 = đáp án đúng
        String[] labels = {"A","B","C","D"};
        String correctLabel = getCellString(row, 7);
        if (correctLabel != null) correctLabel = correctLabel.trim().toUpperCase();

        for (int i = 0; i < 4; i++) {
            String ans = getCellString(row, 3 + i);
            if (ans != null && !ans.isBlank()) {
                answers.add(makeAnswer(ans.trim(), labels[i].equals(correctLabel)));
            }
        }
        if (answers.stream().noneMatch(AnswerRequest::isCorrect))
            throw new IllegalArgumentException("Không có đáp án đúng (cột H phải là A/B/C/D)");
        return answers;
    }

    private QuestionType parseType(String raw, int row) {
        if (raw == null) throw new IllegalArgumentException("Thiếu loại câu hỏi");
        return switch (raw.trim().toUpperCase()) {
            case "MULTIPLE_CHOICE", "MC", "TRẮC NGHIỆM" -> QuestionType.MULTIPLE_CHOICE;
            case "TRUE_FALSE", "TF", "ĐÚNG SAI"         -> QuestionType.TRUE_FALSE;
            case "ESSAY", "TL", "TỰ LUẬN"               -> QuestionType.ESSAY;
            default -> throw new IllegalArgumentException("Loại câu hỏi không hợp lệ: " + raw);
        };
    }

    private Difficulty parseDifficulty(String raw) {
        if (raw == null || raw.isBlank()) return Difficulty.MEDIUM;
        return switch (raw.trim().toUpperCase()) {
            case "EASY",   "DỄ"        -> Difficulty.EASY;
            case "HARD",   "KHÓ"       -> Difficulty.HARD;
            default                    -> Difficulty.MEDIUM;
        };
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> null;
        };
    }

    private boolean isRowEmpty(Row row) {
        for (Cell cell : row)
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        return true;
    }

    private AnswerRequest makeAnswer(String content, boolean correct) {
        AnswerRequest a = new AnswerRequest();
        a.setContent(content);
        a.setCorrect(correct);
        return a;
    }

    private List<String> splitCsv(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { result.add(sb.toString()); sb.setLength(0); }
            else { sb.append(c); }
        }
        result.add(sb.toString());
        return result;
    }
}