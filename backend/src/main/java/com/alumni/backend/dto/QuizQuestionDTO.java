package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionDTO {
    private String id;
    private String question;
    private List<String> options;
    private Integer correctAnswerIndex;
    private String explanation;
    private String difficulty;
    private String category;
}