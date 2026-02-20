package com.alumni.backend.dto;

import com.alumni.backend.model.QuizQuestion; // Might need to fetch QuizQuestion details for display
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultResponseDTO {
    private String id;
    private String userId;
    private String userName;
    private String jobId;
    private String quizId;
    private Integer score;
    private Boolean passed;
    private LocalDateTime attemptedAt;
    private Map<String, Integer> userAnswers;
}