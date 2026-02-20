package com.alumni.backend.repository;

import com.alumni.backend.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByEmail(String email);
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByEmailAndToken(String email, String token);
}