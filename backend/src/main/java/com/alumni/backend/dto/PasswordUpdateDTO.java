package com.alumni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordUpdateDTO {
    @NotBlank
    private String token;
    @NotBlank
    private String newPassword;
}