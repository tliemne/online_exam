package com.example.online_exam.user.entity;

import com.example.online_exam.common.entity.BaseEntity;
import com.example.online_exam.user.enums.UserStatus;
import com.example.online_exam.userprofile.entity.StudentProfile;
import com.example.online_exam.userprofile.entity.TeacherProfile;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @NotBlank(message = "Tên đăng nhập là bắt buộc")
    @Size(min = 3, max = 255, message = "Tên đăng nhập phải từ 3 đến 255 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Tên đăng nhập chỉ có thể chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang")
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    @Column(nullable = false)
    private String passwordHash;

    @Email(message = "Email phải hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    @Column(unique = true)
    private String email;

    @Size(max = 255, message = "Tên đầy đủ không được vượt quá 255 ký tự")
    private String fullName;

    @Size(max = 500, message = "URL ảnh đại diện không được vượt quá 500 ký tự")
    @Column(length = 500)
    private String avatarUrl;

    // Chuyển từ StudentProfile/TeacherProfile lên đây — chung cho mọi role
    @Pattern(regexp = "^[0-9+\\-\\s()]*$", message = "Số điện thoại chỉ có thể chứa chữ số, khoảng trắng và +-()")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    @Column(length = 20)
    private String phone;

    @Past(message = "Ngày sinh phải trong quá khứ")
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;   // chủ yếu dùng cho STUDENT, role khác để null

    @NotNull(message = "Trạng thái người dùng là bắt buộc")
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private StudentProfile studentProfile;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private TeacherProfile teacherProfile;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
                .toList();
    }
}