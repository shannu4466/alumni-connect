package com.alumni.backend.dto;

import java.time.LocalDateTime;
import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private String id;
    private String fullName;
    private String email;
    private String role;
    private String collegeName;
    private String branch;
    private Integer graduationYear;
    private String bio;
    private List<String> skills;
    private Boolean isApproved;
    private String linkedinProfile;
    private String githubProfile;
    private String location;
    private String profileImage;
    private String resume;
    private String rollNumber;
    private String company;
    private String position;
    private String applicationStatus;
    private LocalDateTime submittedDate;
}