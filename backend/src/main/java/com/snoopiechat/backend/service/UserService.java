package com.snoopiechat.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.snoopiechat.backend.dto.UserRegisterRequest;
import com.snoopiechat.backend.dto.client.UserClientDto;
import com.snoopiechat.backend.dto.x3dh.X3dhIdentityKeyRequest;
import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.repository.UserRepo;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class UserService {
    @Autowired
    private JWTService jwtService;

    @Autowired
    private PkiService pkiService;

    @Autowired
    AuthenticationManager authManager;

    @Autowired
    private UserRepo userRepo;

    private PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    public Users register(UserRegisterRequest request) {
        Users user = request.getUserData();

        if(userRepo.existsByEmail(user.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use.");
        
        if(userRepo.existsByUsername(user.getUsername()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists.");

        user.setPassword(encoder.encode(user.getPassword()));
        // PKi registeration
        try {
            pkiService.registerUser(user.getUsername(), user.getPassword(), request.getPublicKey());
            pkiService.uploadIdentityPublicKey(
                    new X3dhIdentityKeyRequest(user.getUsername(), request.getIdentityPublicKey()));
        } catch (Exception e) {
            log.error("PKI registration failed for user {}: {}", user.getUsername(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to register with PKI service: " + e.getMessage());
        }

        userRepo.save(user);
        user.setPassword(null);
        return user;
    }

    public String verify(String email, String password){
        try {
            Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );
            
            if(authentication.isAuthenticated()){
                return jwtService.generateToken(email);
            }else{
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
            }
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
    }

    public UserClientDto verifyToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final int BEARER_OFFSET_INDEX = 7;
            token = authHeader.substring(BEARER_OFFSET_INDEX);
            email = jwtService.extractEmail(token);
        }

        if (token == null || email == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or Expired Token");

        Users user = userRepo.findByEmail(email);
        return new UserClientDto(
                user.getId(),
                user.getUsername(),
                user.getEmail());
    }
}
