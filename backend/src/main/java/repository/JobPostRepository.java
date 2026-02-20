package com.alumni.backend.repository;

import com.alumni.backend.model.JobPost;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface JobPostRepository extends MongoRepository<JobPost, String> {
    List<JobPost> findByAlumniId(String alumniId);

    List<JobPost> findByCompany(String company);

    List<JobPost> findBySkillsContaining(String skill);

    List<JobPost> findByAlumniIdAndStatus(String alumniId, String status);

    List<JobPost> findByStatus(String status);

    long count();
}