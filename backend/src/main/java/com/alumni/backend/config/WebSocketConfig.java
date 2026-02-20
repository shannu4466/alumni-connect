package com.alumni.backend.config;

import com.alumni.backend.security.JwtUtil; // Import JwtUtil
import com.alumni.backend.security.CustomUserDetailsService; // Import CustomUserDetailsService
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public WebSocketConfig(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/user");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override // NEW: Add an interceptor to authenticate WebSocket connections
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // Only process CONNECT frames (initial handshake)
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    String jwt = null;

                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        jwt = authToken.substring(7);
                    } else {
                        // For SockJS, token might be in query param if passed during handshake
                        String sessionId = accessor.getSessionId();
                        // This part is complex. The token needs to be passed via HTTP request for
                        // SockJS handshake.
                        // Spring Security's filter chain usually handles HTTP authentication before
                        // WebSocket.
                        // However, if the JWT filter isn't active on /ws handshake, this won't work.
                        // The user's frontend passes token in URL as access_token for SockJS
                        // The default Spring Security config passes principal.
                        // If Authorization header is empty here, it means the HTTP security filter
                        // chain didn't process it.
                    }

                    if (jwt != null) {
                        try {
                            String username = jwtUtil.extractUsername(jwt);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            if (jwtUtil.validateToken(jwt, userDetails)) {
                                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails,
                                        null, userDetails.getAuthorities());
                                accessor.setUser(authentication); // Set the authenticated user on the WebSocket session
                            }
                        } catch (Exception e) {
                            System.err.println("WebSocket authentication failed: " + e.getMessage());
                            // Deny connection or log
                            // accessor.setLeaveMutable(true);
                            // accessor.setException(new MessageDeliveryException("Unauthorized"));
                        }
                    } else {
                        // No JWT token found, connection will proceed as anonymous unless secured by
                        // SecurityConfig
                        System.out.println("No JWT token found in WebSocket CONNECT headers.");
                    }
                }
                return message;
            }
        });
    }
}