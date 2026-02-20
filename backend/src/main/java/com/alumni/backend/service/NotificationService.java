package com.alumni.backend.service;

import com.alumni.backend.model.User;
import com.alumni.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(UserRepository userRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public void sendEmailNotification(String userId, String senderNameForEmail, String title, String message,
            String type) {
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String emailSubject = "Alumni Connect Notification: " + title;
                String emailBody = "Dear " + user.getFullName() + ",\n\n" + message
                        + "\n\nRegards,\nAlumni Connect Team";

                // Conditions for sending email based on type and content
                if ("JOB".equals(type) || "ACCOUNT".equals(type)
                        || ("CONNECTION".equals(type) && (title.contains("Accepted") || title.contains("Rejected")))) {
                    emailService.sendEmail(user.getEmail(), emailSubject, emailBody);
                }
            }
        });
    }
}