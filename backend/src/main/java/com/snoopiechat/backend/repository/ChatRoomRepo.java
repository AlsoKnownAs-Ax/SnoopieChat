package com.snoopiechat.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.snoopiechat.backend.model.ChatRoom;

public interface ChatRoomRepo extends JpaRepository<ChatRoom, Long>  {
    Optional<ChatRoom> findBySenderIdAndRecipientId(Long senderId, Long recipientId);
}
