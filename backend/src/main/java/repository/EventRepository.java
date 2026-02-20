package com.alumni.backend.repository;

import com.alumni.backend.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends MongoRepository<Event, String> {
    List<Event> findByEventDateTimeAfterOrderByEventDateTimeAsc(LocalDateTime dateTime); // For upcoming events

    List<Event> findByCreatedByUserId(String createdByUserId); // To find events posted by a specific admin
}