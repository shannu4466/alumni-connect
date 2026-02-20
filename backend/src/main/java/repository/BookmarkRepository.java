package com.alumni.backend.repository;

import com.alumni.backend.model.Bookmark;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends MongoRepository<Bookmark, String> {
    List<Bookmark> findByUserId(String userId);

    Optional<Bookmark> findByUserIdAndJobPostId(String userId, String jobPostId);

    void deleteByUserIdAndJobPostId(String userId, String jobPostId);
}