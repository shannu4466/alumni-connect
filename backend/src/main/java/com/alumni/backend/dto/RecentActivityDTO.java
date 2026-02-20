package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDTO {
    private String id;
    private String type;
    private String title;
    private String description;
    private LocalDateTime timestamp;
}