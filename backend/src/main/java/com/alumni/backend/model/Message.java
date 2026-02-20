package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    private String id;
    private String senderId;
    private String receiverId;
    private String senderName;
    private String receiverName; // For denormalization and easy display
    private String content;
    private LocalDateTime timestamp;
    private Boolean isRead; // To track if receiver has read
    private MessageType type; // TEXT, FILE, etc.
}