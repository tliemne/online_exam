package com.example.online_exam.user.dto;

import lombok.Data;
import java.util.List;

@Data
public class StudentImportResult {
    private int totalRows;
    private int successCount;
    private int errorCount;
    private int emailSentCount;
    private List<CreateStudentResult> created;
    private List<String> errors;
}