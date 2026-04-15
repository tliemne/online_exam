package com.example.online_exam.discussion.repository;

import com.example.online_exam.discussion.entity.DiscussionTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscussionTagRepository extends JpaRepository<DiscussionTag, Long> {

    Optional<DiscussionTag> findByCourseIdAndNameIgnoreCase(Long courseId, String name);

    List<DiscussionTag> findByCourseIdOrderByUsageCountDesc(Long courseId);
}
