package com.alumni.backend.repository;

import com.alumni.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {
    User findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(String role);

    List<User> findByIsApproved(Boolean isApproved);

    List<User> findByRoleAndIsApproved(String role, Boolean isApproved);

    boolean existsByRollNumber(String rollNumber);

    long count();

    List<User> findByRoleAndApplicationStatus(String role, String applicationStatus);
}