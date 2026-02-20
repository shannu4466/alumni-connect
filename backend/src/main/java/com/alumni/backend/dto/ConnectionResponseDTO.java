package com.alumni.backend.dto;

import com.alumni.backend.model.ConnectionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionResponseDTO {
    private String id;
    private String senderId;
    private String receiverId;
    private String senderName;
    private String receiverName;
    private ConnectionStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime respondedAt;
}