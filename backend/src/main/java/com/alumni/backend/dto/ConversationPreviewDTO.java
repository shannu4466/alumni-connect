package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationPreviewDTO {
    private String partnerId;
    private String partnerName;
    private String partnerProfileImage;
    private String latestMessageContent;
    private LocalDateTime latestMessageTimestamp;
    private long unreadCount;
}