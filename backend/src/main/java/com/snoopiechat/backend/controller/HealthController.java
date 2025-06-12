package com.snoopiechat.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.snoopiechat.backend.service.PkiService;

@RestController
@RequestMapping("")
public class HealthController {
    @Autowired
    private PkiService pkiService;

    @GetMapping("/health")
    public String pingHealth() {
        return "Snoopie Chat backend is up and running.";
    }

    @GetMapping("/pki-status")
    public String pkiStatus(){
        boolean isHealthy = pkiService.isPkiHealthy();
        if (isHealthy) {
            return "PKI service is healthy and connected.";
        } else {
            return "PKI service is unavailable.";
        }
    }
}
