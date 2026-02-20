package com.alumni.backend.repository;

import com.alumni.backend.model.ConnectionRequest;
import com.alumni.backend.model.ConnectionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ConnectionRequestRepository extends MongoRepository<ConnectionRequest, String> {
    List<ConnectionRequest> findBySenderId(String senderId);

    List<ConnectionRequest> findByReceiverId(String receiverId);

    Optional<ConnectionRequest> findBySenderIdAndReceiverId(String senderId, String receiverId);

    Optional<ConnectionRequest> findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(String senderId1, String receiverId1,
            String senderId2, String receiverId2);

    List<ConnectionRequest> findBySenderIdAndStatusOrReceiverIdAndStatus(String senderId, ConnectionStatus status1,
            String receiverId, ConnectionStatus status2);

    List<ConnectionRequest> findBySenderIdAndStatus(String senderId, ConnectionStatus status);

    long countByStatus(ConnectionStatus status);

    long count();

    List<ConnectionRequest> findAll();
}