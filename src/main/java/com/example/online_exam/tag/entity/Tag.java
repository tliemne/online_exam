package com.example.online_exam.tag.entity;

import com.example.online_exam.question.entity.Question;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tags")
@Getter @Setter
@NoArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tên tag không được để trống")
    @Size(max = 100, message = "Tên tag không được vượt quá 100 ký tự")
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Size(max = 255, message = "Mô tả không được vượt quá 255 ký tự")
    @Column(length = 255)
    private String description;

    @Size(max = 50, message = "Mã màu không được vượt quá 50 ký tự")
    @Column(length = 50)
    private String color; // hex color for UI badge e.g. "#3b82f6"

    @ManyToMany(mappedBy = "tags", fetch = FetchType.LAZY)
    private Set<Question> questions = new HashSet<>();
}