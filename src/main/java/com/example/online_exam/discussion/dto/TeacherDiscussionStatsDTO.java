package com.example.online_exam.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDiscussionStatsDTO {
    private Long unansweredCount;        // Số câu hỏi chưa trả lời
    private Long totalPosts;             // Tổng bài viết trong các khóa của GV
    private Long totalReplies;           // Tổng phản hồi
    private Long answeredPosts;          // Số bài đã có câu trả lời
    private String topStudentName;       // Sinh viên tích cực nhất
    private Long topStudentPostCount;    // Số bài viết của sinh viên đó
}
