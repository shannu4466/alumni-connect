package com.alumni.backend.dto;

import com.alumni.backend.model.QuizQuestion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class JobPostRequestDTO {
    private String alumniId;
    private String alumniName;

    @NotBlank(message = "Job title is required")
    private String title;
    @NotBlank(message = "Company is required")
    private String company;
    @NotBlank(message = "Location is required")
    private String location;
    @NotBlank(message = "Job type is required")
    private String jobType;

    @PositiveOrZero(message = "Minimum salary cannot be negative")
    private Double salaryMin;
    @PositiveOrZero(message = "Maximum salary cannot be negative")
    private Double salaryMax;

    @NotBlank(message = "Job description is required")
    private String description;

    private String requirements;

    private List<String> skills;

    @NotNull(message = "Application deadline is required")
    private LocalDate applicationDeadline;
    private String applicationUrl;
    private Boolean quizEnabled;

    private List<QuizQuestion> quizQuestions;
}