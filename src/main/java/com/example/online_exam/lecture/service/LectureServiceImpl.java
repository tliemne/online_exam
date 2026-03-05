package com.example.online_exam.lecture.service;

import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.lecture.dto.LectureRequest;
import com.example.online_exam.lecture.dto.LectureResponse;
import com.example.online_exam.lecture.entity.Lecture;
import com.example.online_exam.lecture.repository.LectureRepository;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LectureServiceImpl implements LectureService {

    private final LectureRepository lectureRepository;
    private final CourseRepository courseRepository;
    private final CurrentUserService currentUserService;

    @Override
    public LectureResponse create(Long courseId, LectureRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        User currentUser = currentUserService.getCurrentUser()
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));

        Lecture lecture = new Lecture();
        lecture.setCourse(course);
        lecture.setCreatedBy(currentUser);
        lecture.setTitle(request.getTitle());
        lecture.setDescription(request.getDescription());
        lecture.setVideoUrl(request.getVideoUrl());
        lecture.setOrderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 1);

        return toResponse(lectureRepository.save(lecture));
    }

    @Override
    public LectureResponse update(Long id, LectureRequest request) {
        Lecture lecture = lectureRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LECTURE_NOT_FOUND));

        lecture.setTitle(request.getTitle());
        if (request.getDescription() != null) lecture.setDescription(request.getDescription());
        if (request.getVideoUrl() != null)    lecture.setVideoUrl(request.getVideoUrl());
        if (request.getOrderIndex() != null)  lecture.setOrderIndex(request.getOrderIndex());

        return toResponse(lectureRepository.save(lecture));
    }

    @Override
    public void delete(Long id) {
        if (!lectureRepository.existsById(id))
            throw new AppException(ErrorCode.LECTURE_NOT_FOUND);
        lectureRepository.deleteById(id);
    }

    @Override
    public List<LectureResponse> getByCourse(Long courseId) {
        return lectureRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream().map(this::toResponse).toList();
    }

    private LectureResponse toResponse(Lecture l) {
        LectureResponse r = new LectureResponse();
        r.setId(l.getId());
        r.setCourseId(l.getCourse().getId());
        r.setTitle(l.getTitle());
        r.setDescription(l.getDescription());
        r.setVideoUrl(l.getVideoUrl());
        r.setOrderIndex(l.getOrderIndex());
        r.setCreatedByName(l.getCreatedBy() != null ? l.getCreatedBy().getFullName() : null);
        r.setCreatedAt(l.getCreatedAt());
        return r;
    }
}