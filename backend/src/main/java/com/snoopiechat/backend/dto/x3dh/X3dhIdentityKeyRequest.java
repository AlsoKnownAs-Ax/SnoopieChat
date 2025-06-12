package com.snoopiechat.backend.dto.x3dh;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class X3dhIdentityKeyRequest {
    @Schema(required = true)
    private String username;

    @Schema(required = true)
    private String identityPublicKey;
}
