package com.alumni.backend.repository;

import com.alumni.backend.model.QuizResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface QuizResultRepository extends MongoRepository<QuizResult, String> {
    // Find results for a specific user
    List<QuizResult> findByUserId(String userId);

    // Find a specific user's result for a specific job/quiz
    Optional<QuizResult> findByUserIdAndJobId(String userId, String jobId);

    // Find results for a specific job (e.g., for job poster to see applicants'
    // scores)
    List<QuizResult> findByJobId(String jobId);
}