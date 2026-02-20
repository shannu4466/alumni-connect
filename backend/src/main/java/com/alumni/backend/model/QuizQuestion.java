package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quiz_questions")
public class QuizQuestion {
    @Id
    private String id;
    private String question;
    private List<String> options;
    private int correctAnswerIndex;
    private String explanation; 
    private String difficulty; 
    private String category; 
}