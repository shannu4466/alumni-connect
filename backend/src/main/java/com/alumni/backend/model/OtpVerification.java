package com.alumni.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "otp_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerification {
    @Id
    private String id;
    @Indexed(unique = true) // Ensure email is unique for OTP
    private String email;
    private String otp;
    private LocalDateTime expiryTime;
    private boolean verified; // To track if this OTP has been used
    private String userId; // Link to the user being verified
}