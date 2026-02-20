package com.alumni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordResetVerificationDTO {
    @NotBlank
    private String email;
    @NotBlank
    private String otp;
}