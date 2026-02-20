package com.alumni.backend.dto;

import com.alumni.backend.model.MessageType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private String id; // For existing messages
    @NotBlank
    private String senderId;
    @NotBlank
    private String receiverId;
    private String senderName; 
    @NotBlank
    private String content;
    private LocalDateTime timestamp; 
    private Boolean isRead; 
    private MessageType type; 
}