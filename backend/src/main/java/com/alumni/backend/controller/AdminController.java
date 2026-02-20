package com.alumni.backend.controller;

import com.alumni.backend.dto.AdminStatsDTO;
import com.alumni.backend.dto.RecentActivityDTO;
import com.alumni.backend.dto.MonthlyAnalyticsDTO;
import com.alumni.backend.dto.UserRoleAnalyticsDTO;
// import com.alumni.backend.dto.UserStatusAnalyticsDTO;
import com.alumni.backend.model.ConnectionRequest;
import com.alumni.backend.model.ConnectionStatus;
import com.alumni.backend.model.JobPost;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.ConnectionRequestRepository;
import com.alumni.backend.repository.JobPostRepository;
import com.alumni.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

        private final UserRepository userRepository;
        private final JobPostRepository jobPostRepository;
        private final ConnectionRequestRepository connectionRequestRepository;

        public AdminController(UserRepository userRepository, JobPostRepository jobPostRepository,
                        ConnectionRequestRepository connectionRequestRepository) {
                this.userRepository = userRepository;
                this.jobPostRepository = jobPostRepository;
                this.connectionRequestRepository = connectionRequestRepository;
        }

        @GetMapping("/stats")
        public ResponseEntity<AdminStatsDTO> getAdminStats() {
                long totalUsers = userRepository.count();
                long totalStudents = userRepository.findByRole("student").size();
                long totalAlumni = userRepository.findByRole("alumni").size();
                long activeReferrals = jobPostRepository.findByStatus("ACTIVE").size();
                long connectionsMade = connectionRequestRepository.countByStatus(ConnectionStatus.ACCEPTED);
                long pendingAlumni = userRepository.findByRoleAndApplicationStatus("alumni", "PENDING_ADMIN_APPROVAL")
                                .size();

                long totalReferrals = jobPostRepository.count();
                long hiredReferrals = jobPostRepository.findByStatus("HIRED").size();
                double successRate = totalReferrals > 0 ? (double) hiredReferrals / totalReferrals * 100 : 0;

                AdminStatsDTO stats = new AdminStatsDTO(totalUsers, totalStudents, totalAlumni, activeReferrals,
                                connectionsMade, pendingAlumni, hiredReferrals, successRate);

                return new ResponseEntity<>(stats, HttpStatus.OK);
        }

        @GetMapping("/recent-activities")
        public ResponseEntity<List<RecentActivityDTO>> getRecentActivities() {
                List<User> recentUsers = userRepository.findAll().stream()
                                .filter(user -> user.getSubmittedDate() != null)
                                .sorted(Comparator.comparing(User::getSubmittedDate).reversed())
                                .limit(3)
                                .collect(Collectors.toList());

                List<ConnectionRequest> recentConnections = connectionRequestRepository.findAll().stream()
                                .sorted(Comparator.comparing(ConnectionRequest::getSentAt).reversed())
                                .limit(3)
                                .collect(Collectors.toList());

                List<JobPost> recentJobPosts = jobPostRepository.findAll().stream()
                                .sorted(Comparator.comparing(JobPost::getPostedDate).reversed())
                                .limit(3)
                                .collect(Collectors.toList());

                Stream<RecentActivityDTO> userActivities = recentUsers.stream()
                                .map(user -> new RecentActivityDTO(
                                                user.getId(),
                                                "ACCOUNT",
                                                "New account created: " + user.getFullName(),
                                                user.getRole() + " account created",
                                                user.getSubmittedDate()));

                Stream<RecentActivityDTO> connectionActivities = recentConnections.stream()
                                .map(conn -> new RecentActivityDTO(
                                                conn.getId(),
                                                "CONNECTION",
                                                "New connection request from " + conn.getSenderName(),
                                                "New connection request",
                                                conn.getSentAt()));

                Stream<RecentActivityDTO> jobPostActivities = recentJobPosts.stream()
                                .map(job -> new RecentActivityDTO(
                                                job.getId(),
                                                "JOB",
                                                "New job referral: " + job.getTitle() + " at " + job.getCompany(),
                                                "New job post",
                                                job.getPostedDate().atStartOfDay()));

                List<RecentActivityDTO> combinedActivities = Stream
                                .of(userActivities, connectionActivities, jobPostActivities)
                                .flatMap(s -> s)
                                .sorted(Comparator.comparing(RecentActivityDTO::getTimestamp).reversed())
                                .limit(10)
                                .collect(Collectors.toList());

                return new ResponseEntity<>(combinedActivities, HttpStatus.OK);
        }

        @GetMapping("/analytics/monthly")
        public ResponseEntity<List<MonthlyAnalyticsDTO>> getMonthlyAnalyticsData() {
                LocalDate today = LocalDate.now();
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

                List<MonthlyAnalyticsDTO> monthlyData = Stream
                                .iterate(today.minusMonths(11), date -> date.plusMonths(1))
                                .limit(12)
                                .map(date -> {
                                        String monthStr = date.format(formatter);
                                        LocalDate startOfMonth = date.withDayOfMonth(1);
                                        LocalDate endOfMonth = date.withDayOfMonth(date.lengthOfMonth());

                                        long newUsers = userRepository.findAll().stream()
                                                        .filter(user -> user.getSubmittedDate() != null &&
                                                                        user.getSubmittedDate().toLocalDate().isAfter(
                                                                                        startOfMonth.minusDays(1))
                                                                        &&
                                                                        user.getSubmittedDate().toLocalDate().isBefore(
                                                                                        endOfMonth.plusDays(1)))
                                                        .count();

                                        long newReferrals = jobPostRepository.findAll().stream()
                                                        .filter(job -> job.getPostedDate() != null &&
                                                                        !job.getPostedDate().isBefore(startOfMonth) &&
                                                                        !job.getPostedDate().isAfter(endOfMonth))
                                                        .count();

                                        long newConnections = connectionRequestRepository.findAll().stream()
                                                        .filter(conn -> conn.getSentAt() != null &&
                                                                        !conn.getSentAt().toLocalDate()
                                                                                        .isBefore(startOfMonth)
                                                                        &&
                                                                        !conn.getSentAt().toLocalDate()
                                                                                        .isAfter(endOfMonth))
                                                        .count();

                                        return new MonthlyAnalyticsDTO(monthStr, newUsers, newReferrals,
                                                        newConnections);
                                })
                                .collect(Collectors.toList());

                return new ResponseEntity<>(monthlyData, HttpStatus.OK);
        }

        @GetMapping("/analytics/user-roles")
        public ResponseEntity<UserRoleAnalyticsDTO> getUserRoleAnalytics() {
                long totalStudents = userRepository.findByRole("student").size();
                long totalAlumni = userRepository.findByRole("alumni").size();
                UserRoleAnalyticsDTO analyticsDTO = new UserRoleAnalyticsDTO(totalStudents, totalAlumni);
                return new ResponseEntity<>(analyticsDTO, HttpStatus.OK);
        }

        @GetMapping("/analytics/referral-status")
        public ResponseEntity<Map<String, Long>> getReferralStatusAnalytics() {
                long activeCount = jobPostRepository.findByStatus("ACTIVE").size();
                long hiredCount = jobPostRepository.findByStatus("HIRED").size();
                long closedCount = jobPostRepository.findByStatus("CLOSED").size();

                Map<String, Long> referralStatus = Map.of(
                                "active", activeCount,
                                "hired", hiredCount,
                                "closed", closedCount);
                return new ResponseEntity<>(referralStatus, HttpStatus.OK);
        }

        // @GetMapping("/analytics/alumni-status")
        // public ResponseEntity<UserStatusAnalyticsDTO> getAlumniStatusAnalytics() {
        //         long pending = userRepository.findByRoleAndApplicationStatus("alumni", "PENDING_ADMIN_APPROVAL").size();
        //         long approved = userRepository.findByRoleAndApplicationStatus("alumni", "APPROVED").size();
        //         long rejected = userRepository.findByRoleAndApplicationStatus("alumni", "REJECTED").size();

        //         UserStatusAnalyticsDTO statusAnalytics = new UserStatusAnalyticsDTO(pending, approved, rejected);
        //         return new ResponseEntity<>(statusAnalytics, HttpStatus.OK);
        // }
}