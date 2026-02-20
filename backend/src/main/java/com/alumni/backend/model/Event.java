package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    private String id;
    private String title;
    private String description;
    private LocalDateTime eventDateTime; // Date and time of the event
    private String location; // Physical address or "Virtual"
    private String createdByUserId; // ID of the admin who posted the event
    private String createdByUserName; // Name of the admin
    private LocalDateTime postedAt;
    private String imageUrl; // Optional: for event poster/banner
    private String registrationUrl; // Optional: link for registration
}