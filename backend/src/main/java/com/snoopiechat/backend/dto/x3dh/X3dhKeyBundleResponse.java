package com.snoopiechat.backend.dto.x3dh;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class X3dhKeyBundleResponse {
    @Schema(required = true)
    private String identityPublicKey;

    @Schema(required = true)
    private String signedPrekey;
    
    @Schema(required = true)
    private String signedPrekeySignature;
}