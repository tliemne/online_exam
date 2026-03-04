package com.example.online_exam.question.dto;

import lombok.Data;
import java.util.List;

/**
 * Kết quả trả về sau khi import.
 */
@Data
public class QuestionImportResult {
    private int totalRows;      // Tổng số dòng trong file
    private int successCount;   // Số câu import thành công
    private int failCount;      // Số dòng lỗi
    private List<String> errors; // Chi tiết lỗi từng dòng: "Dòng 3: content rỗng"
    private List<QuestionResponse> imported; // Danh sách câu đã import thành công
}