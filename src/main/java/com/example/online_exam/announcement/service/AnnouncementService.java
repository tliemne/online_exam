package com.example.online_exam.announcement.service;

import com.example.online_exam.announcement.dto.AnnouncementDto;
import com.example.online_exam.announcement.entity.Announcement;
import com.example.online_exam.announcement.repository.AnnouncementRepository;
import com.example.online_exam.course.entity.Course;
import com.example.online_exam.course.repository.CourseRepository;
import com.example.online_exam.exception.AppException;
import com.example.online_exam.exception.ErrorCode;
import com.example.online_exam.notification.service.NotificationService;
import com.example.online_exam.secutity.service.CurrentUserService;
import com.example.online_exam.user.entity.User;
import com.example.online_exam.user.enums.RoleName;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepo;
    private final CourseRepository       courseRepo;
    private final CurrentUserService     currentUserService;
    private final NotificationService    notificationService;


    @Transactional
    public AnnouncementDto.Response create(Long courseId, AnnouncementDto.Request req) {
        User caller = currentUserService.requireCurrentUser();
        Course course = findCourse(courseId);
        checkCanManage(caller, course);

        Announcement a = Announcement.builder()
                .course(course)
                .author(caller)
                .title(req.getTitle())
                .content(req.getContent())
                .build();
        announcementRepo.save(a);

        // Gửi notification cho tất cả student trong lớp
        course.getStudents().forEach(student ->
                notificationService.sendById(student.getId(), "ANNOUNCEMENT",
                        "" + course.getName() + ": " + req.getTitle(),
                        req.getContent().length() > 100
                                ? req.getContent().substring(0, 100) + "..."
                                : req.getContent(),
                        "/student/courses/" + courseId)
        );

        return toResponse(a);
    }


    @Transactional(readOnly = true)
    public List<AnnouncementDto.Response> getByCourse(Long courseId) {
        User caller = currentUserService.requireCurrentUser();
        Course course = findCourse(courseId);
        checkCanView(caller, course);
        return announcementRepo.findByCourseIdOrderByCreatedAtDesc(courseId)
                .stream().map(this::toResponse).toList();
    }


    @Transactional
    public AnnouncementDto.Response update(Long courseId, Long id, AnnouncementDto.Request req) {
        User caller = currentUserService.requireCurrentUser();
        Announcement a = announcementRepo.findByIdAndCourseId(id, courseId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        // Chỉ tác giả hoặc admin mới sửa được
        if (!a.getAuthor().getId().equals(caller.getId()) && !currentUserService.isAdmin(caller))
            throw new AppException(ErrorCode.FORBIDDEN);

        if (req.getTitle()   != null) a.setTitle(req.getTitle());
        if (req.getContent() != null) a.setContent(req.getContent());
        announcementRepo.save(a);
        return toResponse(a);
    }


    @Transactional
    public void delete(Long courseId, Long id) {
        User caller = currentUserService.requireCurrentUser();
        Announcement a = announcementRepo.findByIdAndCourseId(id, courseId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (!a.getAuthor().getId().equals(caller.getId()) && !currentUserService.isAdmin(caller))
            throw new AppException(ErrorCode.FORBIDDEN);
        announcementRepo.delete(a);
    }


    private Course findCourse(Long id) {
        return courseRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
    }

    private void checkCanManage(User user, Course course) {
        boolean isAdmin   = currentUserService.isAdmin(user);
        boolean isTeacher = course.getTeacher() != null
                && course.getTeacher().getId().equals(user.getId());
        if (!isAdmin && !isTeacher) throw new AppException(ErrorCode.FORBIDDEN);
    }

    private void checkCanView(User user, Course course) {
        if (currentUserService.isAdmin(user)) return;
        boolean isTeacher = course.getTeacher() != null
                && course.getTeacher().getId().equals(user.getId());
        boolean isStudent = course.getStudents().stream()
                .anyMatch(s -> s.getId().equals(user.getId()));
        if (!isTeacher && !isStudent) throw new AppException(ErrorCode.FORBIDDEN);
    }

    private AnnouncementDto.Response toResponse(Announcement a) {
        return AnnouncementDto.Response.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .authorId(a.getAuthor().getId())
                .authorName(a.getAuthor().getFullName() != null
                        ? a.getAuthor().getFullName() : a.getAuthor().getUsername())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}