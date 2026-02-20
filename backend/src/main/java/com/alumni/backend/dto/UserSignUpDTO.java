package com.alumni.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.time.LocalDateTime;

@Data
public class UserSignUpDTO {

    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    @NotBlank(message = "College Name is required")
    private String collegeName;

    @NotBlank(message = "Branch is required")
    private String branch;

    @NotNull(message = "Graduation Year is required")
    private Integer graduationYear;

    private String company;

    private String bio;

    private List<String> skills;

    private String linkedinProfile;
    private String githubProfile;
    private String location;
    private String profileImage;
    private String resume;
    private String rollNumber;
    private String applicationStatus;
}