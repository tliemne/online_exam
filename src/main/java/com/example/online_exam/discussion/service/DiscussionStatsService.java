package com.example.online_exam.discussion.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.discussion.dto.AdminDiscussionStatsDTO;
import com.example.online_exam.discussion.dto.ForumStatsResponse;
import com.example.online_exam.discussion.dto.StudentDiscussionStatsDTO;
import com.example.online_exam.discussion.dto.TeacherDiscussionStatsDTO;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionReply;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionReplyRepository;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscussionStatsService {

    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    /**
     * Thống kê cho Teacher Dashboard
     */
    public TeacherDiscussionStatsDTO getTeacherStats(Long teacherId) {
        // Lấy danh sách khóa học của giảng viên
        List<Course> teacherCourses = courseRepository.findByTeacherId(teacherId);
        List<Long> courseIds = teacherCourses.stream().map(Course::getId).collect(Collectors.toList());

        if (courseIds.isEmpty()) {
            return TeacherDiscussionStatsDTO.builder()
                    .unansweredCount(0L)
                    .totalPosts(0L)
                    .totalReplies(0L)
                    .answeredPosts(0L)
                    .topStudentName(null)
                    .topStudentPostCount(0L)
                    .build();
        }

        // Lấy tất cả posts trong các khóa của GV
        List<DiscussionPost> allPosts = postRepository.findAll().stream()
                .filter(p -> courseIds.contains(p.getCourse().getId()))
                .collect(Collectors.toList());

        Long totalPosts = (long) allPosts.size();
        Long unansweredCount = allPosts.stream()
                .filter(p -> !p.getHasBestAnswer())
                .count();
        Long answeredPosts = totalPosts - unansweredCount;

        // Đếm replies
        Long totalReplies = courseIds.stream()
                .mapToLong(replyRepository::countByCourseId)
                .sum();

        // Tính tỉ lệ tham gia (số người đã đăng bài / tổng sinh viên trong các khóa)
        // Tạm thời set null, sẽ tính ở frontend nếu cần
        
        return TeacherDiscussionStatsDTO.builder()
                .unansweredCount(unansweredCount)
                .totalPosts(totalPosts)
                .totalReplies(totalReplies)
                .answeredPosts(answeredPosts)
                .topStudentName(null) // Không dùng nữa
                .topStudentPostCount(0L) // Không dùng nữa
                .build();
    }

    /**
     * Thống kê cho Student Dashboard
     */
    public StudentDiscussionStatsDTO getStudentStats(Long studentId) {
        // Đếm posts và replies của sinh viên
        Long myPosts = postRepository.countByAuthorId(studentId);
        Long myReplies = replyRepository.countByAuthorIdAndIsDeletedFalse(studentId);

        // Tính tổng likes (voteCount) từ posts và replies
        List<DiscussionPost> studentPosts = postRepository.findAll().stream()
                .filter(p -> p.getAuthor().getId().equals(studentId))
                .collect(Collectors.toList());
        
        Long postLikes = studentPosts.stream()
                .mapToLong(p -> p.getVoteCount() != null ? p.getVoteCount() : 0L)
                .sum();

        List<DiscussionReply> studentReplies = replyRepository.findAll().stream()
                .filter(r -> r.getAuthor().getId().equals(studentId) && !r.getIsDeleted())
                .collect(Collectors.toList());
        
        Long replyLikes = studentReplies.stream()
                .mapToLong(r -> r.getVoteCount() != null ? r.getVoteCount() : 0L)
                .sum();

        Long totalLikes = postLikes + replyLikes;

        // Tính xếp hạng (dựa trên tổng posts + replies)
        Long myTotal = myPosts + myReplies;
        
        // Lấy tất cả users và tính điểm của họ
        List<User> allUsers = userRepository.findAll();
        
        // Tính điểm cho mỗi user (posts + replies)
        Map<Long, Long> userScores = allUsers.stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> postRepository.countByAuthorId(u.getId()) + 
                             replyRepository.countByAuthorIdAndIsDeletedFalse(u.getId())
                ));

        // Lọc ra những user có điểm > 0 (có tham gia discussion)
        List<Long> activeUserScores = userScores.values().stream()
                .filter(score -> score > 0)
                .sorted((a, b) -> Long.compare(b, a)) // Sort descending
                .collect(Collectors.toList());

        // Tìm rank của student hiện tại
        int myRank = 1;
        int totalActiveUsers = activeUserScores.size();
        
        if (myTotal > 0) {
            for (int i = 0; i < activeUserScores.size(); i++) {
                if (activeUserScores.get(i).equals(myTotal)) {
                    myRank = i + 1;
                    break;
                }
            }
        } else {
            // Nếu student chưa có hoạt động nào, rank = total + 1
            myRank = totalActiveUsers + 1;
        }

        int percentage = totalActiveUsers > 0 ? (myRank * 100 / totalActiveUsers) : 0;

        return StudentDiscussionStatsDTO.builder()
                .myPosts(myPosts)
                .myReplies(myReplies)
                .totalLikes(totalLikes)
                .myRank(myRank)
                .totalStudents((long) totalActiveUsers)
                .percentage(percentage)
                .build();
    }

    /**
     * Thống kê cho Admin Dashboard
     */
    public AdminDiscussionStatsDTO getAdminStats() {
        Long totalPosts = postRepository.count();
        Long totalReplies = replyRepository.count();

        // Bài viết tuần này (7 ngày gần đây)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        Long weeklyPosts = postRepository.countByCreatedAtAfter(weekAgo);

        // Tìm khóa học tích cực nhất
        List<Course> allCourses = courseRepository.findAll();
        
        String topCourseName = null;
        Long topCoursePostCount = 0L;

        for (Course course : allCourses) {
            Long postCount = postRepository.countByCourseId(course.getId());
            if (postCount > topCoursePostCount) {
                topCoursePostCount = postCount;
                topCourseName = course.getName();
            }
        }

        return AdminDiscussionStatsDTO.builder()
                .totalPosts(totalPosts)
                .totalReplies(totalReplies)
                .weeklyPosts(weeklyPosts)
                .topCourseName(topCourseName)
                .topCoursePostCount(topCoursePostCount)
                .build();
    }

    /**
     * Thống kê forum cho một khóa học cụ thể (Task 12.15)
     * Dùng cho endpoint GET /courses/{courseId}/discussions/stats
     */
    public ForumStatsResponse getCourseForumStats(Long courseId) {
        // Lấy tất cả posts trong course với eager loading
        List<DiscussionPost> coursePosts = postRepository.findByCourseIdWithAuthor(courseId);

        int totalPosts = coursePosts.size();
        int answeredPosts = (int) coursePosts.stream()
                .filter(DiscussionPost::getHasBestAnswer)
                .count();

        // Đếm replies
        Long totalReplies = replyRepository.countByCourseId(courseId);

        // Tìm top 5 active students
        Map<Long, Integer> userPostCounts = new HashMap<>();
        Map<Long, Integer> userReplyCounts = new HashMap<>();

        // Đếm posts của mỗi user
        for (DiscussionPost post : coursePosts) {
            Long userId = post.getAuthor().getId();
            userPostCounts.put(userId, userPostCounts.getOrDefault(userId, 0) + 1);
        }

        // Đếm replies của mỗi user - sử dụng repository method với eager loading
        List<DiscussionReply> courseReplies = replyRepository.findByCourseIdWithAuthor(courseId);

        for (DiscussionReply reply : courseReplies) {
            Long userId = reply.getAuthor().getId();
            userReplyCounts.put(userId, userReplyCounts.getOrDefault(userId, 0) + 1);
        }

        // Tính tổng contributions và sort
        Map<Long, Integer> userTotalContributions = new HashMap<>();
        for (Long userId : userPostCounts.keySet()) {
            int posts = userPostCounts.getOrDefault(userId, 0);
            int replies = userReplyCounts.getOrDefault(userId, 0);
            userTotalContributions.put(userId, posts + replies);
        }
        for (Long userId : userReplyCounts.keySet()) {
            if (!userTotalContributions.containsKey(userId)) {
                int replies = userReplyCounts.get(userId);
                userTotalContributions.put(userId, replies);
            }
        }

        // Lấy top 5 users
        List<ForumStatsResponse.ActiveStudentDTO> mostActiveStudents = userTotalContributions.entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue(), e1.getValue()))
                .limit(5)
                .map(entry -> {
                    Long userId = entry.getKey();
                    User user = userRepository.findById(userId).orElse(null);
                    if (user == null) return null;

                    ForumStatsResponse.ActiveStudentDTO dto = new ForumStatsResponse.ActiveStudentDTO();
                    dto.setUserId(userId);
                    dto.setUsername(user.getUsername());
                    dto.setFullName(user.getFullName());
                    dto.setPostCount(userPostCounts.getOrDefault(userId, 0));
                    dto.setReplyCount(userReplyCounts.getOrDefault(userId, 0));
                    dto.setTotalContributions(entry.getValue());
                    return dto;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());

        // Popular tags - tạm thời trả về empty list vì chưa implement tags
        List<ForumStatsResponse.PopularTagDTO> popularTags = new java.util.ArrayList<>();

        ForumStatsResponse response = new ForumStatsResponse();
        response.setTotalPosts(totalPosts);
        response.setTotalReplies(totalReplies.intValue());
        response.setAnsweredPosts(answeredPosts);
        response.setMostActiveStudents(mostActiveStudents);
        response.setPopularTags(popularTags);

        return response;
    }
}
