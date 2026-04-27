package com.example.online_exam.discussion.service;

import com.example.online_exam.discussion.dto.ReportRequest;
import com.example.online_exam.discussion.dto.ReportResponse;
import com.example.online_exam.discussion.entity.DiscussionPost;
import com.example.online_exam.discussion.entity.DiscussionReply;
import com.example.online_exam.discussion.entity.DiscussionReport;
import com.example.online_exam.discussion.enums.PostStatus;
import com.example.online_exam.discussion.enums.ReportStatus;
import com.example.online_exam.discussion.repository.DiscussionPostRepository;
import com.example.online_exam.discussion.repository.DiscussionReplyRepository;
import com.example.online_exam.discussion.repository.DiscussionReportRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.notification.service.NotificationService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class DiscussionReportService {

    private final DiscussionReportRepository reportRepository;
    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ReportResponse reportPost(Long postId, ReportRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        DiscussionPost post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Post not found"));
        
        // Không cho phép báo cáo chính mình
        if (post.getAuthor().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "You cannot report your own post");
        }
        
        if (reportRepository.existsByReporterIdAndPostId(currentUser.getId(), postId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "You have already reported this post");
        }

        DiscussionReport report = new DiscussionReport();
        report.setReporter(currentUser);
        report.setPost(post);
        report.setViolationType(request.getViolationType());
        report.setDetails(request.getDetails());
        report.setStatus(ReportStatus.PENDING);
        reportRepository.save(report);

        // Gửi thông báo cho tất cả admin
        String contentTitle = post.getTitle();
        String reporterName = currentUser.getFullName();
        userRepository.findAllAdmins().forEach(admin ->
            notificationService.sendById(
                admin.getId(),
                "REPORT_NEW",
                "Báo cáo nội dung mới",
                reporterName + " vừa báo cáo bài viết: \"" + contentTitle + "\"",
                "/admin/discussions?tab=moderation"
            )
        );

        return mapToResponse(report);
    }

    public ReportResponse reportReply(Long replyId, ReportRequest request) {
        User currentUser = currentUserService.requireCurrentUser();
        DiscussionReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Reply not found"));

        // Không cho phép báo cáo chính mình
        if (reply.getAuthor().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "You cannot report your own reply");
        }

        if (reportRepository.existsByReporterIdAndReplyId(currentUser.getId(), replyId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "You have already reported this reply");
        }

        DiscussionReport report = new DiscussionReport();
        report.setReporter(currentUser);
        report.setReply(reply);
        report.setViolationType(request.getViolationType());
        report.setDetails(request.getDetails());
        report.setStatus(ReportStatus.PENDING);
        reportRepository.save(report);

        // Gửi thông báo cho tất cả admin
        String postTitle = reply.getPost().getTitle();
        String reporterName = currentUser.getFullName();
        userRepository.findAllAdmins().forEach(admin ->
            notificationService.sendById(
                admin.getId(),
                "REPORT_NEW",
                "Báo cáo nội dung mới",
                reporterName + " vừa báo cáo bình luận trong bài: \"" + postTitle + "\"",
                "/admin/discussions?tab=moderation"
            )
        );

        return mapToResponse(report);
    }

    public Page<ReportResponse> getMyReports(Pageable pageable) {
        User currentUser = currentUserService.requireCurrentUser();
        return reportRepository.findByReporterId(currentUser.getId(), pageable).map(this::mapToResponse);
    }

    public ReportResponse mapToResponse(DiscussionReport report) {
        ReportResponse response = new ReportResponse();
        response.setId(report.getId());
        response.setViolationType(report.getViolationType());
        response.setDetails(report.getDetails());
        response.setStatus(report.getStatus());
        response.setResolutionNote(report.getResolutionNote());
        response.setCreatedAt(report.getCreatedAt());
        response.setUpdatedAt(report.getUpdatedAt());
        response.setReporterId(report.getReporter().getId());
        response.setReporterUsername(report.getReporter().getUsername());

        if (report.getPost() != null) {
            response.setPostId(report.getPost().getId());
            response.setPostTitle(report.getPost().getTitle());
            response.setPostContent(report.getPost().getContent());
            response.setAuthorId(report.getPost().getAuthor().getId());
            response.setAuthorUsername(report.getPost().getAuthor().getUsername());
            response.setAuthorFullName(report.getPost().getAuthor().getFullName());
            response.setCourseId(report.getPost().getCourse().getId());
            response.setCourseName(report.getPost().getCourse().getName());
            response.setReportCount(reportRepository.countByPostId(report.getPost().getId()));
        }

        if (report.getReply() != null) {
            response.setReplyId(report.getReply().getId());
            response.setReplyContent(report.getReply().getContent());
            response.setAuthorId(report.getReply().getAuthor().getId());
            response.setAuthorUsername(report.getReply().getAuthor().getUsername());
            response.setAuthorFullName(report.getReply().getAuthor().getFullName());
            response.setPostId(report.getReply().getPost().getId());
            response.setPostTitle(report.getReply().getPost().getTitle());
            response.setCourseId(report.getReply().getPost().getCourse().getId());
            response.setCourseName(report.getReply().getPost().getCourse().getName());
            response.setReportCount(reportRepository.countByReplyId(report.getReply().getId()));
        }

        if (report.getReviewedBy() != null) {
            response.setReviewedById(report.getReviewedBy().getId());
            response.setReviewedByUsername(report.getReviewedBy().getUsername());
        }

        return response;
    }
}
