package com.snoopiechat.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.snoopiechat.backend.model.ChatMessage;
import com.snoopiechat.backend.repository.ChatMessageRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatMessageRepo chatMessageRepo;
    private final ChatRoomService chatRoomService;

    public ChatMessage save(ChatMessage chatMessage) {
        // Don't save dummy messages to database
        if (chatMessage.getIsDummy() != null && chatMessage.getIsDummy()) {
            return chatMessage; // Return as-is without saving
        }
        
        var chatId = chatRoomService.getChatRoomId(
            chatMessage.getSenderId(), 
            chatMessage.getRecipientId(), 
            true
        ).orElseThrow(); // TODO add exception
        
        chatMessage.setChatId(chatId);
        return chatMessageRepo.save(chatMessage);
    }

    public List<ChatMessage> findChatMessages(
            Long senderId,
            Long recipientId
    ) {
        var chatId = chatRoomService.getChatRoomId(
            senderId, 
            recipientId, 
            false);
        
        List<ChatMessage> messages = chatId.map(chatMessageRepo::findByChatIdOrderByTimestampAsc)
            .orElse(new ArrayList<>());
            
        // Filter out any dummy messages (shouldn't be in DB, but just in case)
        return messages.stream()
            .filter(msg -> msg.getIsDummy() == null || !msg.getIsDummy())
            .collect(Collectors.toList());
    }
}
