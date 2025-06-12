package com.snoopiechat.backend.config;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import com.snoopiechat.backend.service.DummyTrafficService;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class WebSocketEventListener {
    
    @Autowired
    private DummyTrafficService dummyTrafficService;
    
    // Track active user sessions and their conversations
    private final Map<String, Long> sessionToUserId = new ConcurrentHashMap<>();
    private final Map<Long, String> userIdToSession = new ConcurrentHashMap<>();
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Long userId = (Long) sessionAttributes.get("user_id");
            if (userId != null) {
                sessionToUserId.put(sessionId, userId);
                userIdToSession.put(userId, sessionId);
                log.info("User {} connected with session {}", userId, sessionId);
            }
        }
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        Long userId = sessionToUserId.remove(sessionId);
        if (userId != null) {
            userIdToSession.remove(userId);
            log.info("User {} disconnected with session {}", userId, sessionId);
            
            // Stop any dummy traffic involving this user
            stopDummyTrafficForUser(userId);
        }
    }
    
    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        String sessionId = headerAccessor.getSessionId();
        
        // Check if user is subscribing to a message queue (indicating they're in a chat)
        if (destination != null && destination.startsWith("/user/") && destination.endsWith("/queue/messages")) {
            Long userId = sessionToUserId.get(sessionId);
            if (userId != null) {
                log.info("User {} subscribed to messages in session {}", userId, sessionId);
                // We'll start dummy traffic when actual messages are sent between users
                // rather than just on subscription, to avoid unnecessary traffic
            }
        }
    }
    
    /**
     * Start dummy traffic between two users when they begin chatting
     * This should be called when a real message is sent between users
     */
    public void startDummyTrafficBetweenUsers(Long userId1, Long userId2) {
        // Only start if both users are currently connected
        if (userIdToSession.containsKey(userId1) && userIdToSession.containsKey(userId2)) {
            log.info("Starting dummy traffic between users {} and {}", userId1, userId2);
            dummyTrafficService.startDummyTraffic(userId1, userId2);
        }
    }
    
    /**
     * Stop dummy traffic involving a specific user
     */
    private void stopDummyTrafficForUser(Long userId) {
        // We need to stop dummy traffic for all conversations involving this user
        // Since we don't track all pairs, we'll let the DummyTrafficService handle cleanup
        // when it detects failed message delivery
        log.debug("Stopping dummy traffic involving user {}", userId);
    }
    
    /**
     * Check if a user is currently connected
     */
    public boolean isUserConnected(Long userId) {
        return userIdToSession.containsKey(userId);
    }
} 