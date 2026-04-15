package com.example.online_exam.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDiscussionStatsDTO {
    private Long myPosts;           // Số bài viết của sinh viên
    private Long myReplies;         // Số phản hồi của sinh viên
    private Long totalLikes;        // Tổng likes nhận được (voteCount)
    private Integer myRank;         // Xếp hạng của sinh viên
    private Long totalStudents;     // Tổng số sinh viên
    private Integer percentage;     // Top % (ví dụ: top 10%)
}
