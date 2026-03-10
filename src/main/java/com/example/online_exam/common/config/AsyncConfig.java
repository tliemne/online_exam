package com.example.online_exam.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Bật @Async để gửi email không block luồng chính.
 * Email sẽ được gửi trong background thread riêng.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring tự tạo thread pool mặc định
    // Nếu muốn custom: khai báo Executor bean ở đây
}