package com.snoopiechat.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.snoopiechat.backend.dto.LoginRequest;
import com.snoopiechat.backend.dto.UserRegisterRequest;
import com.snoopiechat.backend.dto.client.UserClientDto;
import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.service.PkiService;
import com.snoopiechat.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class UserController {
    @Autowired
    private PkiService pkiService;
    
    @PostMapping("/fetch-and-validate-certificate")
    public ResponseEntity<?> fetchAndValidateCertificate(@RequestBody String username) {
        try {
            boolean result = pkiService.fetchAndValidateCertificate(username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Error in validate-certificate: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error validating certificate");
        }
    }
    
    @Autowired
    private UserService service;

    @PostMapping("/register")
    public Users register(@RequestBody UserRegisterRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest){
        return service.verify(loginRequest.getEmail(), loginRequest.getPassword());
    }

    @GetMapping("/verify-token")
    public ResponseEntity<UserClientDto> verifyToken(HttpServletRequest request) {
        try {
            UserClientDto user = service.verifyToken(request);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.out.println("Error in verify-token: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
