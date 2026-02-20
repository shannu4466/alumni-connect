package com.alumni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventRequestDTO {
    @NotBlank(message = "Event title is required")
    private String title;
    @NotBlank(message = "Event description is required")
    private String description;
    @NotNull(message = "Event date and time is required")
    private LocalDateTime eventDateTime;
    @NotBlank(message = "Event location is required")
    private String location;
    private String imageUrl;
    private String registrationUrl;
}