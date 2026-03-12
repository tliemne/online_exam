package com.example.online_exam.tag.entity;

import com.example.online_exam.question.entity.Question;
import jakarta.persistence.*;
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

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(length = 50)
    private String color; // hex color for UI badge e.g. "#3b82f6"

    @ManyToMany(mappedBy = "tags", fetch = FetchType.LAZY)
    private Set<Question> questions = new HashSet<>();
}