package com.example.online_exam.activitylog.entity;

public enum ActivityLogAction {
    // Auth
    LOGIN, LOGOUT,
    // User
    CREATE_USER, UPDATE_USER, DELETE_USER, CHANGE_PASSWORD,
    // Course
    CREATE_COURSE, UPDATE_COURSE, DELETE_COURSE,
    ADD_STUDENT, REMOVE_STUDENT,
    // Question
    CREATE_QUESTION, UPDATE_QUESTION, DELETE_QUESTION,
    // Exam
    CREATE_EXAM, UPDATE_EXAM, DELETE_EXAM,
    PUBLISH_EXAM, CLOSE_EXAM,
    // Attempt
    SUBMIT_ATTEMPT,
    // Grading
    GRADE_ATTEMPT,
    // Tag
    CREATE_TAG, UPDATE_TAG, DELETE_TAG
}