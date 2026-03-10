package com.example.online_exam.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    // Dùng khi user tự đổi mật khẩu (cần xác nhận mật khẩu cũ)
    private String oldPassword;

    @NotBlank
    @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
    private String newPassword;
}