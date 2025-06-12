package com.snoopiechat.backend.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactDTO {
    @Schema(required = true)
    private Long id;

    @Schema(required = true)
    private String username;

    @Schema(required = true)
    private String email;

    @Schema(required = true)
    private boolean blocked;

    @Schema(required = false)
    private String lastMessage;

    @Schema(required = false)
    private LocalDateTime messageTimestamp;

    // private int unread;
    private boolean online;

}