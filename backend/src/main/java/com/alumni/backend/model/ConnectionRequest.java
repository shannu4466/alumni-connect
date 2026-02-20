package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "connection_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionRequest {
    @Id
    private String id;
    private String senderId;
    private String receiverId;
    private String senderName;
    private String receiverName;
    private ConnectionStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime respondedAt;
}