package com.alumni.backend.repository;

import com.alumni.backend.model.Message;
import com.alumni.backend.model.MessageType;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query; // Add this import
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {

        // FIX: Use @Query for robust chat history fetching
        @Query("{ '$or': [ " +
                        "    { 'senderId': ?0, 'receiverId': ?1 }, " +
                        "    { 'senderId': ?1, 'receiverId': ?0 } " +
                        "] }")
        List<Message> findConversationMessages(String userId1, String userId2);

        long countByReceiverIdAndSenderIdAndIsReadFalse(String receiverId, String senderId);

        List<Message> findByReceiverIdAndSenderIdAndIsReadFalse(String receiverId, String senderId);

        @Aggregation(pipeline = {
                        "{ '$match': { '$or': [ { 'senderId': ?0 }, { 'receiverId': ?0 } ] } }",
                        "{ '$project': { 'partnerId': { '$cond': [ { '$eq': [ '$senderId', ?0 ] }, '$receiverId', '$senderId' ] }, '_id': 0 } }",
                        "{ '$group': { '_id': '$partnerId' } }"
        })
        List<String> findDistinctChatPartnerIds(String userId);

        List<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(String user1Id,
                        String user2Id,
                        String user3Id, String user4Id); // This method might become redundant after fixing
                                                         // findConversationMessages
}