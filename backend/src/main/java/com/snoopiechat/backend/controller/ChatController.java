package com.snoopiechat.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.snoopiechat.backend.dto.ChatNotification;
import com.snoopiechat.backend.mixnets.Envelope;
import com.snoopiechat.backend.mixnets.MixnetRouter;
import com.snoopiechat.backend.model.ChatMessage;
import com.snoopiechat.backend.service.ChatMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;

    @MessageMapping("/chat")
    public void processMessage(
        @Payload ChatMessage chatMessage,
        StompHeaderAccessor headerAccessor
    ) {
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        if (sessionAttributes != null) {
            Long senderId = (Long) sessionAttributes.get("user_id");

            if (senderId != null) {
                chatMessage.setSenderId(senderId);
                log.info("Sender ID: " + senderId);
            } else {
                log.error("Sender ID not found...");
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender ID not found.");
            }
        }
        
        ChatMessage savedMessage = chatMessageService.save(chatMessage);
        String recipientId = chatMessage.getRecipientId().toString();
        String destination = "/queue/messages";

        log.info("Attempting to send message to user '{}' with destination '{}'", recipientId, destination);

        //add encryption
        Envelope env;
        try {
            env = Envelope.createOnion(
                List.of(MixnetRouter.getNode1(), MixnetRouter.getNode2(), MixnetRouter.getNode3()),
                savedMessage
            );
        } catch (Exception e) {
            log.error("Failed to create onion envelope", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create onion envelope.");
        }

        CompletableFuture<Object> result = MixnetRouter.send(env);

        result.thenAccept(finalPayload -> {
            ChatMessage msg = (ChatMessage) finalPayload;

            messagingTemplate.convertAndSendToUser(
                recipientId,
                destination,
                ChatNotification.builder()
                    .id(msg.getId())
                    .senderId(msg.getSenderId())
                    .recipientId(msg.getRecipientId())
                    .content(msg.getContent())
                    .timestamp(msg.getTimestamp())
                    .isDummy(false)
                    .build()
            );
        })
        .exceptionally(ex -> {
            log.error("Mixnet Delivery failed", ex);
            return null;
        });

        log.info("Message dispatch completed");
    }

    @GetMapping("/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessage>> findChatMessages(
            @PathVariable("senderId") Long senderId,
            @PathVariable("recipientId") Long recipientId
    ) {
        return ResponseEntity
            .ok(chatMessageService.findChatMessages(senderId, recipientId));
    }
    
}
