package com.alumni.backend.controller;

import com.alumni.backend.dto.EventRequestDTO;
import com.alumni.backend.dto.EventResponseDTO;
import com.alumni.backend.model.Event;
import com.alumni.backend.model.User;
import com.alumni.backend.repository.EventRepository;
import com.alumni.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final EventRepository eventRepository;
    private final UserRepository userRepository; // To get admin's full name

    public EventController(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@Valid @RequestBody EventRequestDTO eventRequestDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String adminEmail = authentication.getName();
        User adminUser = userRepository.findByEmail(adminEmail);

        if (adminUser == null || !"admin".equalsIgnoreCase(adminUser.getRole())) {
            return new ResponseEntity<>("Only administrators can post events.", HttpStatus.FORBIDDEN);
        }

        Event newEvent = new Event();
        newEvent.setTitle(eventRequestDTO.getTitle());
        newEvent.setDescription(eventRequestDTO.getDescription());
        newEvent.setEventDateTime(eventRequestDTO.getEventDateTime());
        newEvent.setLocation(eventRequestDTO.getLocation());
        newEvent.setImageUrl(eventRequestDTO.getImageUrl());
        newEvent.setRegistrationUrl(eventRequestDTO.getRegistrationUrl());
        newEvent.setCreatedByUserId(adminUser.getId());
        newEvent.setCreatedByUserName(adminUser.getFullName());
        newEvent.setPostedAt(LocalDateTime.now());

        Event savedEvent = eventRepository.save(newEvent);

        EventResponseDTO responseDTO = new EventResponseDTO(
                savedEvent.getId(), savedEvent.getTitle(), savedEvent.getDescription(),
                savedEvent.getEventDateTime(), savedEvent.getLocation(),
                savedEvent.getCreatedByUserId(), savedEvent.getCreatedByUserName(),
                savedEvent.getPostedAt(), savedEvent.getImageUrl(), savedEvent.getRegistrationUrl());

        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<EventResponseDTO>> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        List<EventResponseDTO> responseDTOs = events.stream()
                .map(e -> new EventResponseDTO(
                        e.getId(), e.getTitle(), e.getDescription(),
                        e.getEventDateTime(), e.getLocation(),
                        e.getCreatedByUserId(), e.getCreatedByUserName(),
                        e.getPostedAt(), e.getImageUrl(), e.getRegistrationUrl()))
                .collect(Collectors.toList());
        return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventResponseDTO>> getUpcomingEvents() {
        List<Event> upcomingEvents = eventRepository
                .findByEventDateTimeAfterOrderByEventDateTimeAsc(LocalDateTime.now());
        List<EventResponseDTO> responseDTOs = upcomingEvents.stream()
                .map(e -> new EventResponseDTO(
                        e.getId(), e.getTitle(), e.getDescription(),
                        e.getEventDateTime(), e.getLocation(),
                        e.getCreatedByUserId(), e.getCreatedByUserName(),
                        e.getPostedAt(), e.getImageUrl(), e.getRegistrationUrl()))
                .collect(Collectors.toList());
        return new ResponseEntity<>(responseDTOs, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponseDTO> getEventById(@PathVariable String id) {
        return eventRepository.findById(id)
                .map(event -> new EventResponseDTO(
                        event.getId(), event.getTitle(), event.getDescription(),
                        event.getEventDateTime(), event.getLocation(),
                        event.getCreatedByUserId(), event.getCreatedByUserName(),
                        event.getPostedAt(), event.getImageUrl(), event.getRegistrationUrl()))
                .map(dto -> new ResponseEntity<>(dto, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}