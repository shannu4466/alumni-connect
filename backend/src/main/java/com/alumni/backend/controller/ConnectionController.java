package com.alumni.backend.controller;

import com.alumni.backend.dto.ConnectionActionDTO;
import com.alumni.backend.dto.ConnectionRequestDTO;
import com.alumni.backend.dto.ConnectionResponseDTO;
import com.alumni.backend.model.ConnectionRequest;
import com.alumni.backend.model.ConnectionStatus;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.ConnectionRequestRepository;
import com.alumni.backend.repository.UserRepository;
import com.alumni.backend.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "*")
public class ConnectionController {

    private final ConnectionRequestRepository connectionRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ConnectionController(ConnectionRequestRepository connectionRequestRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.connectionRequestRepository = connectionRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendConnectionRequest(@Valid @RequestBody ConnectionRequestDTO requestDTO) {
        User sender = userRepository.findById(requestDTO.getSenderId()).orElse(null);
        if (sender == null) {
            return new ResponseEntity<>("Sender not found.", HttpStatus.NOT_FOUND);
        }

        User receiver = userRepository.findById(requestDTO.getReceiverId()).orElse(null);
        if (receiver == null) {
            return new ResponseEntity<>("Receiver not found.", HttpStatus.NOT_FOUND);
        }

        if (sender.getId().equals(receiver.getId())) {
            return new ResponseEntity<>("Cannot send connection request to yourself.", HttpStatus.BAD_REQUEST);
        }

        Optional<ConnectionRequest> existingRequest = connectionRequestRepository
                .findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(
                        sender.getId(), receiver.getId(), sender.getId(), receiver.getId());

        if (existingRequest.isPresent()) {
            ConnectionRequest req = existingRequest.get();
            if (req.getStatus() == ConnectionStatus.PENDING) {
                return new ResponseEntity<>("Connection request already pending.", HttpStatus.CONFLICT);
            } else if (req.getStatus() == ConnectionStatus.ACCEPTED) {
                return new ResponseEntity<>("Already connected.", HttpStatus.CONFLICT);
            }
        }

        ConnectionRequest connectionRequest = new ConnectionRequest();
        connectionRequest.setSenderId(sender.getId());
        connectionRequest.setSenderName(sender.getFullName());
        connectionRequest.setReceiverId(receiver.getId());
        connectionRequest.setReceiverName(receiver.getFullName());
        connectionRequest.setStatus(ConnectionStatus.PENDING);
        connectionRequest.setSentAt(LocalDateTime.now());

        ConnectionRequest savedRequest = connectionRequestRepository.save(connectionRequest);

        String senderNameForNotification = sender.getFullName();

        notificationService.sendEmailNotification( // Corrected method name and arguments
                receiver.getId(), // userId
                senderNameForNotification, // senderNameForEmail
                "New Connection Request", // title
                senderNameForNotification + " wants to connect with you.", // message
                "CONNECTION" // type
        );

        ConnectionResponseDTO responseDTO = new ConnectionResponseDTO(
                savedRequest.getId(), savedRequest.getSenderId(), savedRequest.getReceiverId(),
                savedRequest.getSenderName(), savedRequest.getReceiverName(), savedRequest.getStatus(),
                savedRequest.getSentAt(), savedRequest.getRespondedAt());

        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @PatchMapping("/request/{requestId}")
    public ResponseEntity<?> respondToConnectionRequest(@PathVariable String requestId,
            @Valid @RequestBody ConnectionActionDTO actionDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        Optional<ConnectionRequest> optionalRequest = connectionRequestRepository.findById(requestId);
        if (optionalRequest.isEmpty()) {
            return new ResponseEntity<>("Connection request not found.", HttpStatus.NOT_FOUND);
        }

        ConnectionRequest request = optionalRequest.get();

        if (!request.getReceiverId().equals(currentUserId)) {
            return new ResponseEntity<>("Unauthorized to respond to this request.", HttpStatus.FORBIDDEN);
        }

        if (request.getStatus() != ConnectionStatus.PENDING) {
            return new ResponseEntity<>("Request already responded to.", HttpStatus.CONFLICT);
        }

        String receiverNameForNotification = request.getReceiverName();
        String senderNameInRequest = request.getSenderName();

        if ("ACCEPT".equalsIgnoreCase(actionDTO.getAction())) {
            request.setStatus(ConnectionStatus.ACCEPTED);
            notificationService.sendEmailNotification( // Corrected method name and arguments
                    request.getSenderId(), // userId
                    receiverNameForNotification, // senderNameForEmail (alumni who accepted)
                    "Connection Accepted", // title
                    receiverNameForNotification + " accepted your connection request!", // message
                    "CONNECTION" // type
            );
        } else if ("REJECT".equalsIgnoreCase(actionDTO.getAction())) {
            request.setStatus(ConnectionStatus.REJECTED);
            notificationService.sendEmailNotification( // Corrected method name and arguments
                    request.getSenderId(), // userId
                    receiverNameForNotification, // senderNameForEmail (alumni who rejected)
                    "Connection Rejected", // title
                    receiverNameForNotification + " rejected your connection request.", // message
                    "CONNECTION" // type
            );
        } else {
            return new ResponseEntity<>("Invalid action. Must be 'ACCEPT' or 'REJECT'.", HttpStatus.BAD_REQUEST);
        }
        request.setRespondedAt(LocalDateTime.now());
        ConnectionRequest updatedRequest = connectionRequestRepository.save(request);

        ConnectionResponseDTO responseDTO = new ConnectionResponseDTO(
                updatedRequest.getId(), updatedRequest.getSenderId(), updatedRequest.getReceiverId(),
                updatedRequest.getSenderName(), updatedRequest.getReceiverName(), updatedRequest.getStatus(),
                updatedRequest.getSentAt(), updatedRequest.getRespondedAt());

        return new ResponseEntity<>(responseDTO, HttpStatus.OK);
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<ConnectionResponseDTO>> getPendingRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        List<ConnectionRequest> requests = connectionRequestRepository.findByReceiverId(currentUserId).stream()
                .filter(req -> req.getStatus() == ConnectionStatus.PENDING)
                .collect(Collectors.toList());

        List<ConnectionResponseDTO> responseDTOs = requests.stream()
                .map(req -> new ConnectionResponseDTO(
                        req.getId(), req.getSenderId(), req.getReceiverId(), req.getSenderName(),
                        req.getReceiverName(), req.getStatus(), req.getSentAt(), req.getRespondedAt()))
                .collect(Collectors.toList());

        return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
    }

    @GetMapping("/accepted")
    public ResponseEntity<List<ConnectionResponseDTO>> getAcceptedConnections() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        List<ConnectionRequest> connections = connectionRequestRepository
                .findBySenderIdAndStatusOrReceiverIdAndStatus(
                        currentUserId, ConnectionStatus.ACCEPTED,
                        currentUserId, ConnectionStatus.ACCEPTED);

        List<ConnectionResponseDTO> responseDTOs = connections.stream()
                .map(conn -> new ConnectionResponseDTO(
                        conn.getId(), conn.getSenderId(), conn.getReceiverId(), conn.getSenderName(),
                        conn.getReceiverName(), conn.getStatus(), conn.getSentAt(), conn.getRespondedAt()))
                .collect(Collectors.toList());

        return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<List<ConnectionResponseDTO>> getSentRequests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        List<ConnectionRequest> requests = connectionRequestRepository.findBySenderId(currentUserId);

        List<ConnectionResponseDTO> responseDTOs = requests.stream()
                .map(req -> new ConnectionResponseDTO(
                        req.getId(), req.getSenderId(), req.getReceiverId(), req.getSenderName(),
                        req.getReceiverName(), req.getStatus(), req.getSentAt(), req.getRespondedAt()))
                .collect(Collectors.toList());

        return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
    }

    @GetMapping("/status/{otherUserId}")
    public ResponseEntity<ConnectionResponseDTO> getConnectionStatus(@PathVariable String otherUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = userRepository.findByEmail(authentication.getName()).getId();

        if (currentUserId == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        if (currentUserId.equals(otherUserId)) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Optional<ConnectionRequest> connection = connectionRequestRepository
                .findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(
                        currentUserId, otherUserId, otherUserId, currentUserId);

        if (connection.isPresent()) {
            ConnectionRequest req = connection.get();
            ConnectionResponseDTO responseDTO = new ConnectionResponseDTO(
                    req.getId(), req.getSenderId(), req.getReceiverId(), req.getSenderName(),
                    req.getReceiverName(), req.getStatus(), req.getSentAt(), req.getRespondedAt());
            return new ResponseEntity<>(responseDTO, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
    }
}