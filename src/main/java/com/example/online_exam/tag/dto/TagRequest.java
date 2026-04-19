package com.example.online_exam.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TagRequest {
    
    @NotBlank(message = "Tên tag không được để trống")
    @Size(max = 100, message = "Tên tag không được vượt quá 100 ký tự")
    private String name;
    
    @Size(max = 255, message = "Mô tả không được vượt quá 255 ký tự")
    private String description;
    
    @Size(max = 50, message = "Mã màu không được vượt quá 50 ký tự")
    private String color;
}