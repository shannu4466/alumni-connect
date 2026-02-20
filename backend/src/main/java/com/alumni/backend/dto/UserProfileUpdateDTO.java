package com.alumni.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserProfileUpdateDTO {
    private String fullName;
    private String bio;
    private List<String> skills;
    private String collegeName;
    private Integer graduationYear;
    private String linkedinProfile;
    private String githubProfile;
    private String location;
    private String rollNumber;
    private String company;
    private String position;
    private String profileImage;
    private String resume;
    private String branch;
}
