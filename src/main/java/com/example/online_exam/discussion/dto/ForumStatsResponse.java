package com.example.online_exam.discussion.dto;

import lombok.Data;

import java.util.List;

@Data
public class ForumStatsResponse {
    private Integer totalPosts;
    private Integer totalReplies;
    private Integer answeredPosts;
    private List<ActiveStudentDTO> mostActiveStudents;
    private List<PopularTagDTO> popularTags;

    @Data
    public static class ActiveStudentDTO {
        private Long userId;
        private String username;
        private String fullName;
        private Integer postCount;
        private Integer replyCount;
        private Integer totalContributions; // postCount + replyCount
    }

    @Data
    public static class PopularTagDTO {
        private String name;
        private Integer usageCount;
    }
}
