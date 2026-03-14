package com.example.online_exam.exam.dto;

import com.example.online_exam.question.enums.Difficulty;
import lombok.Data;

import java.util.List;

/**
 * Request random câu hỏi vào đề thi.
 *
 * Mỗi rule = 1 nhóm câu cần random:
 *   tagId      — bắt buộc, random từ tag này
 *   count      — số câu cần lấy
 *   difficulty — tuỳ chọn, lọc thêm theo độ khó
 *   score      — điểm mỗi câu (mặc định 1.0)
 *
 * Ví dụ: lấy 5 câu Java-EASY + 3 câu OOP-MEDIUM
 */
@Data
public class RandomQuestionRequest {

    private List<RandomRule> rules;

    /** Nếu true — xóa toàn bộ câu cũ trong đề trước khi thêm */
    private boolean replaceExisting = false;

    @Data
    public static class RandomRule {
        private Long       tagId;
        private int        count      = 1;
        private Difficulty difficulty;       // null = bất kỳ độ khó
        private Double     score      = 1.0;
    }
}