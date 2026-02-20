package com.alumni.backend.controller;

import com.alumni.backend.model.Bookmark;
import com.alumni.backend.model.JobPost;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.BookmarkRepository;
import com.alumni.backend.repository.JobPostRepository;
import com.alumni.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookmarks")
@CrossOrigin(origins = "*")
public class BookmarkController {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final JobPostRepository jobPostRepository;

    public BookmarkController(BookmarkRepository bookmarkRepository, UserRepository userRepository,
            JobPostRepository jobPostRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.userRepository = userRepository;
        this.jobPostRepository = jobPostRepository;
    }

    @PostMapping
    public ResponseEntity<?> addBookmark(@RequestBody Map<String, String> payload) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();
        String jobPostId = payload.get("jobPostId");

        if (currentUserId == null || jobPostId == null) {
            return new ResponseEntity<>(Map.of("message", "User or job ID is missing."), HttpStatus.BAD_REQUEST);
        }

        if (bookmarkRepository.findByUserIdAndJobPostId(currentUserId, jobPostId).isPresent()) {
            return new ResponseEntity<>(Map.of("message", "Job already bookmarked."), HttpStatus.CONFLICT);
        }

        if (jobPostRepository.findById(jobPostId).isEmpty()) {
            return new ResponseEntity<>(Map.of("message", "Job post not found."), HttpStatus.NOT_FOUND);
        }

        Bookmark bookmark = new Bookmark(null, currentUserId, jobPostId);
        bookmarkRepository.save(bookmark);

        return new ResponseEntity<>(Map.of("message", "Job bookmarked successfully."), HttpStatus.CREATED);
    }

    @DeleteMapping("/{jobPostId}")
    public ResponseEntity<?> removeBookmark(@PathVariable String jobPostId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(Map.of("message", "User not authenticated."), HttpStatus.UNAUTHORIZED);
        }

        bookmarkRepository.deleteByUserIdAndJobPostId(currentUserId, jobPostId);

        return new ResponseEntity<>(Map.of("message", "Bookmark removed successfully."), HttpStatus.OK);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<String>> getUserBookmarks(@PathVariable String userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (!currentUserId.equals(userId)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        List<String> bookmarkedJobIds = bookmarkRepository.findByUserId(userId).stream()
                .map(Bookmark::getJobPostId)
                .collect(Collectors.toList());

        return new ResponseEntity<>(bookmarkedJobIds, HttpStatus.OK);
    }
}