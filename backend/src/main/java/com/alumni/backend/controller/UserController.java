package com.alumni.backend.controller;

import com.alumni.backend.dto.UserLoginDTO;
import com.alumni.backend.dto.UserProfileUpdateDTO;
import com.alumni.backend.dto.UserResponseDTO;
import com.alumni.backend.dto.UserSignUpDTO;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.UserRepository;
import com.alumni.backend.security.JwtUtil;
import com.alumni.backend.service.CloudinaryService;
import com.alumni.backend.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    private final VerificationController verificationController;

    @Autowired
    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CloudinaryService cloudinaryService,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            NotificationService notificationService,
            VerificationController verificationController) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.cloudinaryService = cloudinaryService;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.notificationService = notificationService;
        this.verificationController = verificationController;
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(@RequestParam(required = false) String role) {
        List<User> users = (role != null) ? userRepository.findByRole(role) : userRepository.findAll();
        List<UserResponseDTO> userDTOs = users.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signUpUser(@Valid @RequestBody UserSignUpDTO signUpDTO) {
        if (!signUpDTO.getPassword().equals(signUpDTO.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password and Confirm Password do not match."));
        }
        if (userRepository.existsByEmail(signUpDTO.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already registered."));
        }
        if ("student".equalsIgnoreCase(signUpDTO.getRole()) && signUpDTO.getRollNumber() != null
                && userRepository.existsByRollNumber(signUpDTO.getRollNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Roll number already registered."));
        }

        User newUser = new User();
        newUser.setPassword(passwordEncoder.encode(signUpDTO.getPassword()));
        newUser.setRole(signUpDTO.getRole());
        newUser.setFullName(signUpDTO.getFullName());
        newUser.setEmail(signUpDTO.getEmail());
        newUser.setCollegeName(signUpDTO.getCollegeName());
        newUser.setBranch(signUpDTO.getBranch());
        newUser.setGraduationYear(signUpDTO.getGraduationYear());
        newUser.setBio(signUpDTO.getBio());
        newUser.setSkills(signUpDTO.getSkills());
        newUser.setLinkedinProfile(signUpDTO.getLinkedinProfile());
        newUser.setGithubProfile(signUpDTO.getGithubProfile());
        newUser.setLocation(signUpDTO.getLocation());
        newUser.setProfileImage(signUpDTO.getProfileImage());
        newUser.setResume(signUpDTO.getResume());
        newUser.setRollNumber(signUpDTO.getRollNumber());
        newUser.setCompany(signUpDTO.getCompany());
        newUser.setIsApproved(false);
        newUser.setApplicationStatus("student".equalsIgnoreCase(signUpDTO.getRole())
                ? "PENDING_EMAIL_VERIFICATION"
                : "PENDING_ADMIN_APPROVAL");
        newUser.setSubmittedDate(LocalDateTime.now());

        User savedUser = userRepository.save(newUser);

        if ("student".equalsIgnoreCase(savedUser.getRole())) {
            try {
                VerificationController.SendOtpRequest otpRequest = new VerificationController.SendOtpRequest();
                otpRequest.setEmail(savedUser.getEmail());
                verificationController.sendOtp(otpRequest);
            } catch (Exception e) {
                System.err.println("Failed to send OTP: " + e.getMessage());
                userRepository.delete(savedUser);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Registration failed. Could not send verification email."));
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponseDTO(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody UserLoginDTO loginDTO) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword()));
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
            }
            if ("student".equalsIgnoreCase(user.getRole())
                    && "PENDING_EMAIL_VERIFICATION".equalsIgnoreCase(user.getApplicationStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Your email is not verified. Please verify it to log in."));
            }
            if ("alumni".equalsIgnoreCase(user.getRole())
                    && "PENDING_ADMIN_APPROVAL".equalsIgnoreCase(user.getApplicationStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Your alumni account is pending admin approval.",
                                "user", convertToResponseDTO(user)));
            }

            String token = jwtUtil.generateToken(userDetails, user.getId(), user.getRole());
            Map<String, Object> loginResponse = new HashMap<>();
            loginResponse.put("user", convertToResponseDTO(user));
            loginResponse.put("token", token);
            return ResponseEntity.ok(loginResponse);

        } catch (Exception e) {
            System.err.println("Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable String id,
            @RequestBody UserProfileUpdateDTO updatedUserDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(authentication.getName());
        if (currentUser == null || !currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized."));
        }
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        User user = userOptional.get();
        if (updatedUserDto.getFullName() != null)
            user.setFullName(updatedUserDto.getFullName());
        if (updatedUserDto.getBio() != null)
            user.setBio(updatedUserDto.getBio());
        if (updatedUserDto.getSkills() != null)
            user.setSkills(updatedUserDto.getSkills());
        if (updatedUserDto.getCollegeName() != null)
            user.setCollegeName(updatedUserDto.getCollegeName());
        if (updatedUserDto.getBranch() != null)
            user.setBranch(updatedUserDto.getBranch());
        if (updatedUserDto.getGraduationYear() != null)
            user.setGraduationYear(updatedUserDto.getGraduationYear());
        if (updatedUserDto.getLinkedinProfile() != null)
            user.setLinkedinProfile(updatedUserDto.getLinkedinProfile());
        if (updatedUserDto.getGithubProfile() != null)
            user.setGithubProfile(updatedUserDto.getGithubProfile());
        if (updatedUserDto.getLocation() != null)
            user.setLocation(updatedUserDto.getLocation());
        if (updatedUserDto.getRollNumber() != null)
            user.setRollNumber(updatedUserDto.getRollNumber());
        if (updatedUserDto.getPosition() != null)
            user.setPosition(updatedUserDto.getPosition());
        if (updatedUserDto.getCompany() != null)
            user.setCompany(updatedUserDto.getCompany());
        if (updatedUserDto.getProfileImage() != null)
            user.setProfileImage(updatedUserDto.getProfileImage());
        if (updatedUserDto.getResume() != null)
            user.setResume(updatedUserDto.getResume());

        userRepository.save(user);
        return ResponseEntity.ok(convertToResponseDTO(user));
    }

    @PostMapping("/upload/profile-image/{userId}")
    public ResponseEntity<Map<String, String>> uploadProfileImage(
            @PathVariable String userId, @RequestParam("file") MultipartFile file) {
        return userRepository.findById(userId)
                .map(user -> {
                    String imageUrl = cloudinaryService.uploadFile(file, "alumni-connect/profile-images");
                    user.setProfileImage(imageUrl);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
                }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    @PostMapping("/upload/resume/{userId}")
    public ResponseEntity<Map<String, String>> uploadResume(
            @PathVariable String userId, @RequestParam("file") MultipartFile file) {
        return userRepository.findById(userId)
                .map(user -> {
                    String resumeUrl = cloudinaryService.uploadFile(file, "alumni-connect/resumes");
                    user.setResume(resumeUrl);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("resumeUrl", resumeUrl));
                }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAccount(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(authentication.getName());
        if (currentUser == null || (!currentUser.getId().equals(id)
                && authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized."));
        }
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Account deleted."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Account not found."));
        }
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> updateApprovalStatus(@PathVariable String id, @RequestParam Boolean status) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User adminUser = userRepository.findByEmail(authentication.getName());
        if (adminUser == null || !"admin".equalsIgnoreCase(adminUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admins only."));
        }
        return userRepository.findById(id).map(user -> {
            user.setIsApproved(status);
            if (status) {
                user.setApplicationStatus("APPROVED");
                notificationService.sendEmailNotification(user.getId(), adminUser.getFullName(),
                        "Account Approved", "Your alumni account has been approved.", "ACCOUNT");
            } else {
                user.setApplicationStatus("REJECTED");
                notificationService.sendEmailNotification(user.getId(), adminUser.getFullName(),
                        "Account Rejected", "Your alumni account was rejected.", "ACCOUNT");
            }
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Status updated",
                    "userId", user.getId(),
                    "isApproved", user.getIsApproved(),
                    "applicationStatus", user.getApplicationStatus()));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    private UserResponseDTO convertToResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getCollegeName(),
                user.getBranch(),
                user.getGraduationYear(),
                user.getBio(),
                user.getSkills(),
                user.getIsApproved(),
                user.getLinkedinProfile(),
                user.getGithubProfile(),
                user.getLocation(),
                user.getProfileImage(),
                user.getResume(),
                user.getRollNumber(),
                user.getPosition(),
                user.getCompany(),
                user.getApplicationStatus(),
                user.getSubmittedDate());
    }
}
