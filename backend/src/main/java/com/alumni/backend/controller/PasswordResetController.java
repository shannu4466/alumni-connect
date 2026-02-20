package com.alumni.backend.controller;

import com.alumni.backend.dto.PasswordResetRequestDTO;
import com.alumni.backend.dto.PasswordResetVerificationDTO;
import com.alumni.backend.dto.PasswordUpdateDTO;
import com.alumni.backend.model.PasswordResetToken;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.PasswordResetTokenRepository;
import com.alumni.backend.repository.UserRepository;
import com.alumni.backend.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/password")
@CrossOrigin(origins = "*")
public class PasswordResetController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetController(UserRepository userRepository, PasswordResetTokenRepository resetTokenRepository,
            EmailService emailService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/forgot-otp")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody PasswordResetRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail());
        if (user == null) {
            return new ResponseEntity<>(
                    Map.of("message", "No account found with that email address."),
                    HttpStatus.NOT_FOUND);
        }

        if(!user.getIsApproved()) {
            return new ResponseEntity<>(Map.of("message", "Your account is not approved. Wait for approval from admin"), HttpStatus.BAD_REQUEST);
        }

        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);

        resetTokenRepository.findByEmail(request.getEmail()).ifPresent(resetTokenRepository::delete);

        PasswordResetToken resetToken = new PasswordResetToken(null, request.getEmail(), otp,
                LocalDateTime.now().plusMinutes(10));
        resetTokenRepository.save(resetToken);

        String subject = "Alumni Connect: Your OTP for Password Reset";
        String body = "Dear " + user.getFullName() + ",\n\n"
                + "Your One-Time Password (OTP) for password reset is: " + otp + "\n"
                + "This OTP is valid for 10 minutes.\n\n"
                + "Regards,\nAlumni Connect Team";
        emailService.sendEmail(request.getEmail(), subject, body);

        return new ResponseEntity<>(
                Map.of("message", "If an account with that email exists, a password reset OTP has been sent."),
                HttpStatus.OK);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @Valid @RequestBody PasswordResetVerificationDTO verificationDTO) {
        Optional<PasswordResetToken> tokenOptional = resetTokenRepository
                .findByEmailAndToken(verificationDTO.getEmail(), verificationDTO.getOtp());

        if (tokenOptional.isEmpty() || tokenOptional.get().getExpiryTime().isBefore(LocalDateTime.now())) {
            return new ResponseEntity<>(Map.of("message", "Invalid or expired OTP."), HttpStatus.BAD_REQUEST);
        }

        // Use a UUID for the final password reset token for security
        String finalResetToken = UUID.randomUUID().toString();

        PasswordResetToken validatedToken = tokenOptional.get();
        validatedToken.setToken(finalResetToken);
        resetTokenRepository.save(validatedToken);

        return new ResponseEntity<>(Map.of("message", "OTP verified successfully.", "token", finalResetToken),
                HttpStatus.OK);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody PasswordUpdateDTO request) {
        Optional<PasswordResetToken> tokenOptional = resetTokenRepository.findByToken(request.getToken());

        if (tokenOptional.isEmpty() || tokenOptional.get().getExpiryTime().isBefore(LocalDateTime.now())) {
            return new ResponseEntity<>(Map.of("message", "Invalid or expired token."), HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(tokenOptional.get().getEmail());
        if (user == null) {
            return new ResponseEntity<>(Map.of("message", "User not found."), HttpStatus.NOT_FOUND);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetTokenRepository.delete(tokenOptional.get());

        return new ResponseEntity<>(Map.of("message", "Password reset successfully."), HttpStatus.OK);
    }
}