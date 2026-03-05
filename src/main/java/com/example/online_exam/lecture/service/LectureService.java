package com.example.online_exam.lecture.service;

import com.example.online_exam.lecture.dto.LectureRequest;
import com.example.online_exam.lecture.dto.LectureResponse;

import java.util.List;

public interface LectureService {
    LectureResponse create(Long courseId, LectureRequest request);
    LectureResponse update(Long id, LectureRequest request);
    void delete(Long id);
    List<LectureResponse> getByCourse(Long courseId);
}