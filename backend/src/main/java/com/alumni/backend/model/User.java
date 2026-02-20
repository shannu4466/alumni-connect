package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.util.List;
import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    private String role;
    private String fullName;
    @Indexed(unique = true)
    private String email;
    private String password;
    private String collegeName;
    private String branch;
    private Integer graduationYear;
    private String bio;
    private List<String> skills;
    private Boolean isApproved;
    private String linkedinProfile;
    private String githubProfile;
    private String profileImage;
    private String resume;
    private String location;
    private String company;
    private String position;
    @Indexed(unique = true, sparse = true)
    private String rollNumber;
    private String applicationStatus;
    private Integer dailyOtpSends;
    private LocalDate lastOtpSendDate;
    private LocalDateTime submittedDate;
}