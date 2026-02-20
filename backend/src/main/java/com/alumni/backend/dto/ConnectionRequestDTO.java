package com.alumni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConnectionRequestDTO {
    @NotBlank(message = "Sender ID is required")
    private String senderId;
    @NotBlank(message = "Sender Name is required")
    private String senderName;
    @NotBlank(message = "Receiver ID is required")
    private String receiverId;
}