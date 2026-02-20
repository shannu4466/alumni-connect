package com.alumni.backend.controller;

import com.alumni.backend.dto.QuizQuestionDTO;
import com.alumni.backend.dto.QuizSubmissionDTO;
import com.alumni.backend.dto.QuizResultResponseDTO;
import com.alumni.backend.model.QuizQuestion;
import com.alumni.backend.model.QuizResult;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.QuizQuestionRepository;
import com.alumni.backend.repository.QuizResultRepository;
import com.alumni.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

        private final QuizQuestionRepository quizQuestionRepository;
        private final QuizResultRepository quizResultRepository;
        private final UserRepository userRepository;

        public QuizController(QuizQuestionRepository quizQuestionRepository,
                        QuizResultRepository quizResultRepository,
                        UserRepository userRepository) {
                this.quizQuestionRepository = quizQuestionRepository;
                this.quizResultRepository = quizResultRepository;
                this.userRepository = userRepository;
        }

        @GetMapping("/questions")
        public ResponseEntity<List<QuizQuestionDTO>> getQuestionsByCategory(
                        @RequestParam List<String> categories,
                        @RequestParam(defaultValue = "10") int limit) {

                System.out.println("Skills : " + categories);
                List<String> comprehensiveCategories = categories.stream()
                                .filter(c -> c != null && !c.trim().isEmpty())
                                .flatMap(c -> {
                                        String lowerCased = c.toLowerCase();
                                        String titleCased = lowerCased.substring(0, 1).toUpperCase()
                                                        + lowerCased.substring(1);
                                        String upperCased = c.toUpperCase();
                                        // Query for the 3 most likely storage formats to ensure a match.
                                        return Stream.of(lowerCased, titleCased, upperCased);
                                })
                                .distinct()
                                .collect(Collectors.toList());

                List<QuizQuestion> questions = quizQuestionRepository.findByCategoryIn(comprehensiveCategories);

                if (questions.isEmpty()) {
                        return new ResponseEntity<>(Collections.emptyList(), HttpStatus.OK);
                }

                Collections.shuffle(questions);

                List<QuizQuestion> limitedQuestions = questions.stream()
                                .limit(limit)
                                .collect(Collectors.toList());

                List<QuizQuestionDTO> questionDTOs = limitedQuestions.stream()
                                .map(q -> new QuizQuestionDTO(
                                                q.getId(),
                                                q.getQuestion(),
                                                q.getOptions(),
                                                q.getCorrectAnswerIndex(),
                                                q.getExplanation(),
                                                q.getDifficulty(),
                                                q.getCategory()))
                                .collect(Collectors.toList());

                return new ResponseEntity<>(questionDTOs, HttpStatus.OK);
        }

        @PostMapping("/questions")
        public ResponseEntity<QuizQuestionDTO> createQuestion(@RequestBody QuizQuestionDTO quizQuestionDTO) {
                QuizQuestion question = new QuizQuestion();
                question.setQuestion(quizQuestionDTO.getQuestion());
                question.setOptions(quizQuestionDTO.getOptions());
                question.setCorrectAnswerIndex(quizQuestionDTO.getCorrectAnswerIndex());
                question.setExplanation(quizQuestionDTO.getExplanation());
                question.setDifficulty(quizQuestionDTO.getDifficulty());
                question.setCategory(quizQuestionDTO.getCategory());

                QuizQuestion savedQuestion = quizQuestionRepository.save(question);
                return new ResponseEntity<>(new QuizQuestionDTO(
                                savedQuestion.getId(), savedQuestion.getQuestion(), savedQuestion.getOptions(),
                                savedQuestion.getCorrectAnswerIndex(), savedQuestion.getExplanation(),
                                savedQuestion.getDifficulty(), savedQuestion.getCategory()), HttpStatus.CREATED);
        }

        @PostMapping("/submit-result")
        public ResponseEntity<QuizResultResponseDTO> submitQuizResult(
                        @Valid @RequestBody QuizSubmissionDTO submissionDTO) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String userEmail = authentication.getName();
                User currentUser = userRepository.findByEmail(userEmail);

                if (currentUser == null) {
                        return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
                }

                QuizResult quizResult = new QuizResult();
                quizResult.setUserId(currentUser.getId());
                quizResult.setUserName(currentUser.getFullName());
                quizResult.setJobId(submissionDTO.getJobId());
                quizResult.setQuizId(submissionDTO.getQuizId());
                quizResult.setScore(submissionDTO.getScore());
                quizResult.setPassed(submissionDTO.getPassed());
                quizResult.setUserAnswers(submissionDTO.getUserAnswers());
                quizResult.setAttemptedAt(LocalDateTime.now());

                QuizResult savedResult = quizResultRepository.save(quizResult);

                QuizResultResponseDTO responseDTO = new QuizResultResponseDTO(
                                savedResult.getId(), savedResult.getUserId(), savedResult.getUserName(),
                                savedResult.getJobId(), savedResult.getQuizId(), savedResult.getScore(),
                                savedResult.getPassed(), savedResult.getAttemptedAt(), savedResult.getUserAnswers());

                return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
        }

        @GetMapping("/results/user/{userId}")
        public ResponseEntity<List<QuizResultResponseDTO>> getUserQuizResults(@PathVariable String userId) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String currentUserId = userRepository.findByEmail(authentication.getName()).getId();
                User currentUser = userRepository.findByEmail(authentication.getName());

                if (!currentUserId.equals(userId) && !currentUser.getRole().equalsIgnoreCase("admin")) {
                        return new ResponseEntity<>(HttpStatus.FORBIDDEN);
                }

                List<QuizResult> results = quizResultRepository.findByUserId(userId);
                List<QuizResultResponseDTO> responseDTOs = results.stream()
                                .map(r -> new QuizResultResponseDTO(
                                                r.getId(), r.getUserId(), r.getUserName(), r.getJobId(),
                                                r.getQuizId(), r.getScore(), r.getPassed(), r.getAttemptedAt(),
                                                r.getUserAnswers()))
                                .collect(Collectors.toList());

                return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
        }

        @GetMapping("/results/{resultId}")
        public ResponseEntity<QuizResultResponseDTO> getQuizResultById(@PathVariable String resultId) {
                Optional<QuizResult> quizResultOptional = quizResultRepository.findById(resultId);
                if (quizResultOptional.isEmpty()) {
                        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
                }
                QuizResult result = quizResultOptional.get();

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String currentUserId = userRepository.findByEmail(authentication.getName()).getId();
                User currentUser = userRepository.findByEmail(authentication.getName());

                if (!result.getUserId().equals(currentUserId) && !currentUser.getRole().equalsIgnoreCase("admin")) {
                        return new ResponseEntity<>(HttpStatus.FORBIDDEN);
                }

                QuizResultResponseDTO responseDTO = new QuizResultResponseDTO(
                                result.getId(), result.getUserId(), result.getUserName(),
                                result.getJobId(), result.getQuizId(), result.getScore(),
                                result.getPassed(), result.getAttemptedAt(), result.getUserAnswers());
                return new ResponseEntity<>(responseDTO, HttpStatus.OK);
        }

        // Get quiz results for a specific job post
        @GetMapping("/results/job/{jobId}")
        public ResponseEntity<List<QuizResultResponseDTO>> getQuizResultsByJobId(@PathVariable String jobId) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String currentUserId = userRepository.findByEmail(authentication.getName()).getId();
                User currentUser = userRepository.findByEmail(authentication.getName());

                List<QuizResult> results = quizResultRepository.findByJobId(jobId);

                List<QuizResultResponseDTO> responseDTOs = results.stream()
                                .map(r -> new QuizResultResponseDTO(
                                                r.getId(), r.getUserId(), r.getUserName(), r.getJobId(),
                                                r.getQuizId(), r.getScore(), r.getPassed(), r.getAttemptedAt(),
                                                r.getUserAnswers()))
                                .collect(Collectors.toList());

                return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
        }
}