package com.alumni.backend.controller;

import com.alumni.backend.repository.UserRepository;
import com.alumni.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/test-email")
    public ResponseEntity<?> sendTestEmail(@RequestParam String userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (!currentUserId.equals(userId)
                && authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        notificationService.sendEmailNotification(
                userId,
                "System",
                "Test Email",
                "This is a test notification email.",
                "ACCOUNT");

        return new ResponseEntity<>(HttpStatus.OK);
    }
}
