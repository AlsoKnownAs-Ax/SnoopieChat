package com.snoopiechat.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;


@Configuration
public class PkiConfig {
    @Value("${pki.origin}")
    private String pkiOrigin;

    public String getPkiOrigin() {
        return pkiOrigin;
    }
}
