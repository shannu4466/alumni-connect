package com.alumni.backend.repository;

import com.alumni.backend.model.OtpVerification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OtpVerificationRepository extends MongoRepository<OtpVerification, String> {
    Optional<OtpVerification> findByEmailAndOtp(String email, String otp);

    Optional<OtpVerification> findByEmail(String email); // To check for existing unverified OTPs
}