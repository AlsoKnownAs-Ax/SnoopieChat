package com.snoopiechat.backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatNotification {
    private Long id;
    
    private Long senderId;
    private Long recipientId;
    private String content;
    private LocalDateTime timestamp;
    
    @Builder.Default
    private Boolean isDummy = false;
}
