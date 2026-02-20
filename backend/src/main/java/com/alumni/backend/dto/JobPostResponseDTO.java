package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

import com.alumni.backend.model.QuizQuestion;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobPostResponseDTO {
    private String id;
    private String alumniId;
    private String alumniName;
    private String title;
    private String company;
    private String location;
    private String jobType;
    private Double salaryMin;
    private Double salaryMax;
    private String description;
    private String requirements;
    private List<String> skills;
    private LocalDate applicationDeadline;
    private String applicationUrl;
    private LocalDate postedDate;
    private String status;
    private Boolean quizEnabled;
    private List<QuizQuestion> quizQuestions;
}