package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.DiscussionReport;
import com.example.online_exam.discussion.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscussionReportRepository extends JpaRepository<DiscussionReport, Long> {
    
    boolean existsByReporterIdAndPostId(Long reporterId, Long postId);
    
    boolean existsByReporterIdAndReplyId(Long reporterId, Long replyId);
    
    Page<DiscussionReport> findByReporterId(Long reporterId, Pageable pageable);
    
    Page<DiscussionReport> findByStatus(ReportStatus status, Pageable pageable);
    
    long countByPostId(Long postId);
    
    long countByReplyId(Long replyId);
    
    void deleteByPostId(Long postId);
    
    void deleteByReplyId(Long replyId);
    
    java.util.List<DiscussionReport> findByPostId(Long postId);
    
    java.util.List<DiscussionReport> findByReplyId(Long replyId);
}
