package com.snoopiechat.backend.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.snoopiechat.backend.model.ChatRoom;
import com.snoopiechat.backend.repository.ChatRoomRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatRoomService {
    private final ChatRoomRepo chatRoomRepo;
    
    public Optional<String> getChatRoomId(
            Long senderId,
            Long recipientId,
        boolean createIfNotExists
    ) {
        return chatRoomRepo.findBySenderIdAndRecipientId(senderId, recipientId)
            .map(ChatRoom::getChatId)
            .or(() -> {
                if (createIfNotExists) {
                    var chatId = createChatId(senderId, recipientId);
                    return Optional.of(chatId);
                }
                return Optional.empty();
            });
    }

    private String createChatId(Long senderId, Long recipientId) {
        var chatId = String.format("%s_%s", senderId, recipientId);
        ChatRoom senderRecipient = ChatRoom.builder()
            .chatId(chatId)
            .senderId(senderId)
            .recipientId(recipientId)
            .build();

        ChatRoom recipientSender = ChatRoom.builder()
        .chatId(chatId)
        .senderId(recipientId)
        .recipientId(senderId)
        .build();
        
        chatRoomRepo.save(senderRecipient);
        chatRoomRepo.save(recipientSender);

        return chatId;
    }
}
