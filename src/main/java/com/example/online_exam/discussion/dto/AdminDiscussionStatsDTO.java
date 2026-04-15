package com.example.online_exam.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDiscussionStatsDTO {
    private Long totalPosts;        // Tổng bài viết toàn hệ thống
    private Long totalReplies;      // Tổng phản hồi
    private Long weeklyPosts;       // Bài viết tuần này
    private String topCourseName;   // Khóa học tích cực nhất
    private Long topCoursePostCount; // Số bài viết của khóa đó
}
