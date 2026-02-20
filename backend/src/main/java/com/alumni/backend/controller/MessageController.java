package com.alumni.backend.controller;

import com.alumni.backend.dto.MessageDTO;
import com.alumni.backend.model.Message;
import com.alumni.backend.model.MessageType;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.MessageRepository;
import com.alumni.backend.repository.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.alumni.backend.dto.ConversationPreviewDTO;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageController(SimpMessageSendingOperations messagingTemplate, MessageRepository messageRepository,
            UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/chat.privateMessage")
    public void sendPrivateMessage(@Payload MessageDTO message, SimpMessageHeaderAccessor headerAccessor) {
        Authentication authentication = (Authentication) headerAccessor.getUser();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return;
        }

        String senderIdFromAuth = userRepository.findByEmail(authentication.getName()).getId();

        if (!senderIdFromAuth.equals(message.getSenderId())) {
            return;
        }

        User sender = userRepository.findById(message.getSenderId()).orElse(null);
        if (sender == null) {
            return;
        }

        User receiver = userRepository.findById(message.getReceiverId()).orElse(null);
        if (receiver == null) {
            return;
        }

        if (message.getSenderId().equals(message.getReceiverId())) {
            return;
        }

        Message savedMessage = new Message();
        savedMessage.setSenderId(sender.getId());
        savedMessage.setSenderName(sender.getFullName());
        savedMessage.setReceiverId(receiver.getId());
        savedMessage.setReceiverName(receiver.getFullName());
        savedMessage.setContent(message.getContent());
        savedMessage.setTimestamp(LocalDateTime.now());
        savedMessage.setIsRead(false);
        savedMessage.setType(MessageType.TEXT);

        Message persistedMessage = messageRepository.save(savedMessage);

        messagingTemplate.convertAndSendToUser(
                message.getReceiverId(), "/queue/messages",
                new MessageDTO(
                        persistedMessage.getId(), persistedMessage.getSenderId(), persistedMessage.getReceiverId(),
                        persistedMessage.getSenderName(), persistedMessage.getContent(),
                        persistedMessage.getTimestamp(),
                        persistedMessage.getIsRead(), persistedMessage.getType()));
        messagingTemplate.convertAndSendToUser(
                message.getSenderId(), "/queue/messages",
                new MessageDTO(
                        persistedMessage.getId(), persistedMessage.getSenderId(), persistedMessage.getReceiverId(),
                        persistedMessage.getSenderName(), persistedMessage.getContent(),
                        persistedMessage.getTimestamp(),
                        persistedMessage.getIsRead(), persistedMessage.getType()));
    }

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<MessageDTO>> getChatHistory(@PathVariable String otherUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        // FIX: Use the new @Query method for consistent results
        List<Message> messages = messageRepository.findConversationMessages(currentUserId, otherUserId);

        // Sorting here to guarantee order even if database doesn't guarantee it for
        // @Query result
        messages.sort((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()));

        messages.stream()
                .filter(msg -> msg.getReceiverId().equals(currentUserId) && !msg.getIsRead())
                .forEach(msg -> {
                    msg.setIsRead(true);
                    messageRepository.save(msg);
                });

        List<MessageDTO> messageDTOs = messages.stream()
                .map(msg -> new MessageDTO(
                        msg.getId(), msg.getSenderId(), msg.getReceiverId(), msg.getSenderName(),
                        msg.getContent(), msg.getTimestamp(), msg.getIsRead(), msg.getType()))
                .collect(Collectors.toList());

        return new ResponseEntity<>(messageDTOs, HttpStatus.OK);
    }

    @PatchMapping("/read/{senderId}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable String senderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String receiverId = userRepository.findByEmail(authentication.getName()).getId();

        if (receiverId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        List<Message> unreadMessages = messageRepository.findByReceiverIdAndSenderIdAndIsReadFalse(receiverId,
                senderId);
        unreadMessages.forEach(msg -> {
            msg.setIsRead(true);
            messageRepository.save(msg);
        });

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationPreviewDTO>> getConversations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        List<String> partnerIds = messageRepository.findDistinctChatPartnerIds(currentUserId);

        List<ConversationPreviewDTO> conversations = partnerIds.stream().map(partnerId -> {
            User partnerUser = userRepository.findById(partnerId).orElse(null);
            if (partnerUser == null) {
                return null;
            }

            // Using the new method for latest message
            List<Message> latestMessages = messageRepository
                    .findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
                            currentUserId, partnerId, partnerId, currentUserId);

            Message latestMessage = latestMessages.isEmpty() ? null : latestMessages.get(0);
            long unreadCount = messageRepository.countByReceiverIdAndSenderIdAndIsReadFalse(currentUserId, partnerId);

            return new ConversationPreviewDTO(
                    partnerUser.getId(),
                    partnerUser.getFullName(),
                    partnerUser.getProfileImage(),
                    latestMessage != null ? latestMessage.getContent() : "No messages yet.",
                    latestMessage != null ? latestMessage.getTimestamp() : null,
                    unreadCount);
        }).filter(java.util.Objects::nonNull).collect(Collectors.toList());

        conversations.sort((a, b) -> {
            LocalDateTime tsA = a.getLatestMessageTimestamp();
            LocalDateTime tsB = b.getLatestMessageTimestamp();
            if (tsA == null && tsB == null)
                return 0;
            if (tsA == null)
                return 1;
            if (tsB == null)
                return -1;
            return tsB.compareTo(tsA);
        });

        return new ResponseEntity<>(conversations, HttpStatus.OK);
    }
}