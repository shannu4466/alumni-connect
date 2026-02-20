package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventResponseDTO {
    private String id;
    private String title;
    private String description;
    private LocalDateTime eventDateTime;
    private String location;
    private String createdByUserId;
    private String createdByUserName;
    private LocalDateTime postedAt;
    private String imageUrl;
    private String registrationUrl;
}