package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "quiz_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResult {
    @Id
    private String id;
    private String userId; // ID of the user who attempted the quiz
    private String userName; // Name of the user (for display/lookup)
    private String jobId; // ID of the job post this quiz was for
    private String quizId; // ID of the specific quiz (or skills assessed)
    private Integer score; // Percentage score (e.g., 75)
    private Boolean passed; // Whether the user passed based on passingScore
    private LocalDateTime attemptedAt;
    private Map<String, Integer> userAnswers; // Store user's selected answers {questionId: selectedOptionIndex}
}