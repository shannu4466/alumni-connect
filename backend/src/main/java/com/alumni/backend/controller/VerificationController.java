package com.alumni.backend.controller;

import com.alumni.backend.model.OtpVerification;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.OtpVerificationRepository;
import com.alumni.backend.repository.UserRepository;
import com.alumni.backend.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/verify")
@CrossOrigin(origins = "*")
public class VerificationController {

    private final OtpVerificationRepository otpVerificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private static final int DAILY_OTP_LIMIT = 3;

    public VerificationController(OtpVerificationRepository otpVerificationRepository, UserRepository userRepository,
            EmailService emailService) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Data
    static class SendOtpRequest {
        @NotBlank
        @Email
        String email;
    }

    @Data
    static class CheckOtpRequest {
        @NotBlank
        @Email
        String email;
        @NotBlank
        String otp;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail());
        if (user == null || !"student".equalsIgnoreCase(user.getRole())) {
            return new ResponseEntity<>(Map.of("message", "User not found or not a student."), HttpStatus.BAD_REQUEST);
        }
        if (user.getIsApproved() != null && user.getIsApproved()) {
            return new ResponseEntity<>(Map.of("message", "User is already verified/approved."),
                    HttpStatus.BAD_REQUEST);
        }

        // NEW: Check daily OTP limit
        LocalDate today = LocalDate.now();
        if (user.getLastOtpSendDate() != null && user.getLastOtpSendDate().isEqual(today)) {
            if (user.getDailyOtpSends() >= DAILY_OTP_LIMIT) {
                return new ResponseEntity<>(
                        Map.of("message", "You have exceeded the daily OTP limit of 3. Please try again tomorrow."),
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            user.setDailyOtpSends(user.getDailyOtpSends() + 1);
        } else {
            user.setDailyOtpSends(1);
            user.setLastOtpSendDate(today);
        }
        userRepository.save(user);

        String otp = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        otpVerificationRepository.findByEmail(request.getEmail()).ifPresent(otpVerificationRepository::delete);

        OtpVerification otpVerification = new OtpVerification(null, request.getEmail(), otp, expiryTime, false,
                user.getId());
        otpVerificationRepository.save(otpVerification);

        String subject = "Alumni Connect: Your OTP for Registration Verification";
        String body = "Dear " + user.getFullName() + ",\n\n"
                + "Your One-Time Password (OTP) for Alumni Connect registration is: " + otp + "\n"
                + "This OTP is valid for 5 minutes. Please do not share it with anyone.\n\n"
                + "Regards,\nAlumni Connect Team";
        emailService.sendEmail(request.getEmail(), subject, body);

        // Return the number of remaining sends
        return new ResponseEntity<>(Map.of("message", "OTP sent successfully.", "dailySendsLeft",
                DAILY_OTP_LIMIT - user.getDailyOtpSends()), HttpStatus.OK);
    }

    @PostMapping("/check-otp")
    public ResponseEntity<?> checkOtp(@Valid @RequestBody CheckOtpRequest request) {
        Optional<OtpVerification> otpVerificationOptional = otpVerificationRepository
                .findByEmailAndOtp(request.getEmail(), request.getOtp());

        if (otpVerificationOptional.isEmpty()) {
            return new ResponseEntity<>(Map.of("message", "Invalid OTP or email."), HttpStatus.BAD_REQUEST);
        }

        OtpVerification otpVerification = otpVerificationOptional.get();

        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpVerificationRepository.delete(otpVerification);
            return new ResponseEntity<>(Map.of("message", "OTP has expired."), HttpStatus.BAD_REQUEST);
        }

        if (otpVerification.isVerified()) {
            return new ResponseEntity<>(Map.of("message", "OTP already used."), HttpStatus.BAD_REQUEST);
        }

        otpVerification.setVerified(true);
        otpVerificationRepository.save(otpVerification);

        userRepository.findById(otpVerification.getUserId()).ifPresent(user -> {
            user.setIsApproved(true);
            user.setApplicationStatus("APPROVED");
            userRepository.save(user);
        });

        return new ResponseEntity<>(Map.of("message", "Email verified successfully. You can now log in."),
                HttpStatus.OK);
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}