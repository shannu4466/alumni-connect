package com.alumni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;

@Data
public class QuizSubmissionDTO {
    @NotBlank(message = "User ID is required")
    private String userId;
    @NotBlank(message = "Job ID is required")
    private String jobId;
    @NotBlank(message = "Quiz ID is required") // This could be the jobId or a specific quiz identifier
    private String quizId;
    @NotNull(message = "Score is required")
    private Integer score;
    @NotNull(message = "Passed status is required")
    private Boolean passed;
    @NotNull(message = "User answers map is required")
    private Map<String, Integer> userAnswers; // {questionId: selectedOptionIndex}
}