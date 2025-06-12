package com.snoopiechat.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.snoopiechat.backend.model.ChatMessage;

public interface ChatMessageRepo extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatId(String s); 

    List<ChatMessage> findByChatIdOrderByTimestampAsc(String chatId);

    ChatMessage findTopByChatIdOrderByTimestampDesc(String chatId);
}
