package com.snoopiechat.backend.dto;

import com.snoopiechat.backend.model.Users;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Getter
public class UserRegisterRequest {
    private Users userData;

    @Schema(required = true)
    private String publicKey;

    @Schema(required = true)
    private String identityPublicKey;
}
