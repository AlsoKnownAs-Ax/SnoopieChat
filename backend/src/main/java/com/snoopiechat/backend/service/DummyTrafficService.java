package com.snoopiechat.backend.service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.security.SecureRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.snoopiechat.backend.dto.ChatNotification;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DummyTrafficService {
    
    @Autowired
    private DummyMessageService dummyMessageService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatRoomService chatRoomService;
    
    private final ScheduledExecutorService executorService = Executors.newScheduledThreadPool(10);
    private final Map<String, ScheduledFuture<?>> activeTrafficSessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    
    /**
     * Starts dummy traffic between two users
     * @param userId1 First user ID
     * @param userId2 Second user ID
     */
    public void startDummyTraffic(Long userId1, Long userId2) {
        String sessionKey = createSessionKey(userId1, userId2);
        
        // Don't start if already running for this pair
        if (activeTrafficSessions.containsKey(sessionKey)) {
            log.debug("Dummy traffic already active for session: {}", sessionKey);
            return;
        }
        
        log.info("Starting dummy traffic for session: {}", sessionKey);
        
        ScheduledFuture<?> future = executorService.schedule(() -> {
            sendDummyMessage(userId1, userId2);
            // Schedule next message
            scheduleNextMessage(sessionKey, userId1, userId2);
        }, dummyMessageService.generateRandomInterval(), TimeUnit.MILLISECONDS);
        
        activeTrafficSessions.put(sessionKey, future);
    }
    
    /**
     * Stops dummy traffic between two users
     * @param userId1 First user ID
     * @param userId2 Second user ID
     */
    public void stopDummyTraffic(Long userId1, Long userId2) {
        String sessionKey = createSessionKey(userId1, userId2);
        
        ScheduledFuture<?> future = activeTrafficSessions.remove(sessionKey);
        if (future != null) {
            future.cancel(false);
            log.info("Stopped dummy traffic for session: {}", sessionKey);
        }
    }
    
    /**
     * Schedules the next dummy message in the session
     */
    private void scheduleNextMessage(String sessionKey, Long userId1, Long userId2) {
        if (!activeTrafficSessions.containsKey(sessionKey)) {
            return; // Session was stopped
        }
        
        ScheduledFuture<?> future = executorService.schedule(() -> {
            sendDummyMessage(userId1, userId2);
            scheduleNextMessage(sessionKey, userId1, userId2);
        }, dummyMessageService.generateRandomInterval(), TimeUnit.MILLISECONDS);
        
        activeTrafficSessions.put(sessionKey, future);
    }
    
    /**
     * Sends a dummy message between two users
     */
    private void sendDummyMessage(Long userId1, Long userId2) {
        // Randomly choose sender and recipient
        Long senderId = random.nextBoolean() ? userId1 : userId2;
        Long recipientId = senderId.equals(userId1) ? userId2 : userId1;
        
        String dummyContent = dummyMessageService.generateDummyContent();
        LocalDateTime timestamp = LocalDateTime.now();
        
        // Create dummy notification
        ChatNotification dummyNotification = ChatNotification.builder()
            .id(-1L) // Use negative ID to indicate dummy message
            .senderId(senderId)
            .recipientId(recipientId)
            .content(dummyContent)
            .timestamp(timestamp)
            .isDummy(true)
            .build();
        
        // Send to both users
        String destination = "/queue/messages";
        
        log.debug("Sending dummy message from {} to {}: {}", senderId, recipientId, dummyContent);
        
        try {
            messagingTemplate.convertAndSendToUser(
                recipientId.toString(),
                destination,
                dummyNotification
            );
            
            messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                destination,
                dummyNotification
            );
        } catch (Exception e) {
            log.error("Failed to send dummy message", e);
        }
    }
    
    /**
     * Creates a consistent session key for two users
     */
    private String createSessionKey(Long userId1, Long userId2) {
        Long minId = Math.min(userId1, userId2);
        Long maxId = Math.max(userId1, userId2);
        return "dummy_traffic_" + minId + "_" + maxId;
    }
    
    /**
     * Cleanup method to stop all active sessions
     */
    public void stopAllDummyTraffic() {
        log.info("Stopping all dummy traffic sessions");
        activeTrafficSessions.values().forEach(future -> future.cancel(false));
        activeTrafficSessions.clear();
    }
} 