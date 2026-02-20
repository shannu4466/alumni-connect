package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.util.List;

@Document(collection = "job_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobPost {
    @Id
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