package com.snoopiechat.backend.dto;

import lombok.Getter;

@Getter
public class PrekeyBundleRequest {
    private String signature;
    private String createdAt;
    private String prekeyJwk;
}
