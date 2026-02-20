package com.alumni.backend.controller;

import com.alumni.backend.dto.JobPostRequestDTO;
import com.alumni.backend.dto.JobPostResponseDTO;
import com.alumni.backend.model.JobPost;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.JobPostRepository;
import com.alumni.backend.repository.UserRepository;
import com.alumni.backend.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;

@RestController
@RequestMapping("/api/job-posts")
@CrossOrigin(origins = "*")
public class JobPostController {

        private final JobPostRepository jobPostRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;

        public JobPostController(JobPostRepository jobPostRepository, UserRepository userRepository,
                        NotificationService notificationService) {
                this.jobPostRepository = jobPostRepository;
                this.userRepository = userRepository;
                this.notificationService = notificationService;
        }

        private JobPostResponseDTO mapToJobPostResponseDTO(JobPost post) {
                // This helper method centralizes the DTO creation, ensuring all fields are
                // mapped.
                // NOTE: This assumes your JobPostResponseDTO constructor now accepts the new
                // Boolean quizEnabled
                // as the last argument before quizQuestions (or its corresponding position).
                return new JobPostResponseDTO(
                                post.getId(),
                                post.getAlumniId(),
                                post.getAlumniName(),
                                post.getTitle(),
                                post.getCompany(),
                                post.getLocation(),
                                post.getJobType(),
                                post.getSalaryMin(),
                                post.getSalaryMax(),
                                post.getDescription(),
                                post.getRequirements(),
                                post.getSkills(),
                                post.getApplicationDeadline(),
                                post.getApplicationUrl(),
                                post.getPostedDate(),
                                post.getStatus(),
                                post.getQuizEnabled(), // NEW: Map quizEnabled from the JobPost model
                                post.getQuizQuestions());
        }

        @PostMapping
        public ResponseEntity<?> createJobPost(@Valid @RequestBody JobPostRequestDTO jobPostRequestDTO) {
                User alumniUser = userRepository.findById(jobPostRequestDTO.getAlumniId()).orElse(null);
                if (alumniUser == null) {
                        return new ResponseEntity<>("Alumni user not found for provided ID.", HttpStatus.NOT_FOUND);
                }

                JobPost newJobPost = new JobPost();
                newJobPost.setAlumniId(alumniUser.getId());
                newJobPost.setAlumniName(alumniUser.getFullName());
                newJobPost.setTitle(jobPostRequestDTO.getTitle());
                newJobPost.setCompany(jobPostRequestDTO.getCompany());
                newJobPost.setLocation(jobPostRequestDTO.getLocation());
                newJobPost.setJobType(jobPostRequestDTO.getJobType());
                newJobPost.setSalaryMin(jobPostRequestDTO.getSalaryMin());
                newJobPost.setSalaryMax(jobPostRequestDTO.getSalaryMax());
                newJobPost.setDescription(jobPostRequestDTO.getDescription());
                newJobPost.setRequirements(jobPostRequestDTO.getRequirements());
                newJobPost.setSkills(jobPostRequestDTO.getSkills());
                newJobPost.setApplicationDeadline(jobPostRequestDTO.getApplicationDeadline());
                newJobPost.setApplicationUrl(jobPostRequestDTO.getApplicationUrl());
                newJobPost.setPostedDate(LocalDate.now());
                newJobPost.setStatus("ACTIVE");
                newJobPost.setQuizEnabled(jobPostRequestDTO.getQuizEnabled()); // NEW: Map the flag
                newJobPost.setQuizQuestions(jobPostRequestDTO.getQuizQuestions());

                // Crucial logic: If quiz is NOT enabled, ensure quizQuestions is null/empty
                // in the DB, even if the DTO carried some old/junk data.
                if (Boolean.FALSE.equals(newJobPost.getQuizEnabled())) {
                        newJobPost.setQuizQuestions(null);
                }

                JobPost savedJobPost = jobPostRepository.save(newJobPost);

                List<User> students = userRepository.findByRole("student");
                List<String> jobSkills = savedJobPost.getSkills() != null
                                ? savedJobPost.getSkills().stream().map(String::toLowerCase)
                                                .collect(Collectors.toList())
                                : List.of();
                final int SKILL_MATCH_THRESHOLD = 70;

                for (User student : students) {
                        if (student.getSkills() == null || student.getSkills().isEmpty())
                                continue;

                        List<String> studentSkills = student.getSkills().stream().map(String::toLowerCase)
                                        .collect(Collectors.toList());
                        long matchedSkillsCount = jobSkills.stream().filter(studentSkills::contains).count();
                        double skillMatchPercentage = jobSkills.isEmpty() ? 100
                                        : (double) matchedSkillsCount / jobSkills.size() * 100;

                        if (skillMatchPercentage >= SKILL_MATCH_THRESHOLD) {
                                notificationService.sendEmailNotification(
                                                student.getId(),
                                                savedJobPost.getAlumniName(),
                                                "New Job Alert!",
                                                "A new referral for " + savedJobPost.getTitle() + " at "
                                                                + savedJobPost.getCompany()
                                                                + " matches your skills.",
                                                "JOB");
                        }
                }

                return new ResponseEntity<>(mapToJobPostResponseDTO(savedJobPost), HttpStatus.CREATED);
        }

        @GetMapping
        public ResponseEntity<List<JobPostResponseDTO>> getAllJobPosts() {
                List<JobPost> jobPosts = jobPostRepository.findAll();
                List<JobPostResponseDTO> responseDTOs = jobPosts.stream()
                                .map(this::mapToJobPostResponseDTO)
                                .collect(Collectors.toList());
                return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
        }

        @GetMapping("/{id}")
        public ResponseEntity<JobPostResponseDTO> getJobPostById(@PathVariable String id) {
                Optional<JobPost> jobPostOptional = jobPostRepository.findById(id);
                if (jobPostOptional.isEmpty()) {
                        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
                }
                JobPost post = jobPostOptional.get();

                return new ResponseEntity<>(mapToJobPostResponseDTO(post), HttpStatus.OK);
        }

        @GetMapping("/by-alumni/{alumniId}")
        public ResponseEntity<List<JobPostResponseDTO>> getJobPostsByAlumni(@PathVariable String alumniId) {
                List<JobPost> jobPosts = jobPostRepository.findByAlumniId(alumniId);
                List<JobPostResponseDTO> responseDTOs = jobPosts.stream()
                                .map(this::mapToJobPostResponseDTO)
                                .collect(Collectors.toList());
                return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
        }

        @PatchMapping("/{id}/status")
        public ResponseEntity<?> updateJobPostStatus(@PathVariable String id,
                        @RequestBody Map<String, String> payload) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                User currentUser = userRepository.findByEmail(authentication.getName());

                if (currentUser == null) {
                        return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
                }

                Optional<JobPost> jobPostOptional = jobPostRepository.findById(id);
                if (jobPostOptional.isEmpty()) {
                        return new ResponseEntity<>(Map.of("message", "Job post not found."), HttpStatus.NOT_FOUND);
                }
                JobPost jobPost = jobPostOptional.get();

                if (!jobPost.getAlumniId().equals(currentUser.getId())
                                && !"admin".equalsIgnoreCase(currentUser.getRole())) {
                        return new ResponseEntity<>(Map.of("message", "Unauthorized to update this job post status."),
                                        HttpStatus.FORBIDDEN);
                }

                String newStatus = payload.get("status");
                if (newStatus == null || newStatus.isBlank()) {
                        return new ResponseEntity<>(Map.of("message", "New status is required."),
                                        HttpStatus.BAD_REQUEST);
                }

                if (!newStatus.equals("ACTIVE") && !newStatus.equals("HIRED") && !newStatus.equals("CLOSED")) {
                        return new ResponseEntity<>(
                                        Map.of("message", "Invalid status provided. Allowed: ACTIVE, HIRED, CLOSED."),
                                        HttpStatus.BAD_REQUEST);
                }

                jobPost.setStatus(newStatus);
                JobPost updatedJobPost = jobPostRepository.save(jobPost);

                return new ResponseEntity<>(updatedJobPost, HttpStatus.OK);
        }
}