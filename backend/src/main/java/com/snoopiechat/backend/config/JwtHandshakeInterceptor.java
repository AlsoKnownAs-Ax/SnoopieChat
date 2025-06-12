package com.snoopiechat.backend.config;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.snoopiechat.backend.repository.UserRepo;
import com.snoopiechat.backend.service.CustomUserDetailsService;
import com.snoopiechat.backend.service.JWTService;

import jakarta.servlet.http.Cookie;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    @Autowired
    private JWTService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepo userRepo;

    @Override
    public boolean beforeHandshake(
            @SuppressWarnings("null") ServerHttpRequest request,
            @SuppressWarnings("null") ServerHttpResponse response,
            @SuppressWarnings("null") WebSocketHandler wsHandler,
            @SuppressWarnings("null") Map<String, Object> attributes
    ) throws Exception {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            Cookie[] cookies = servletRequest.getServletRequest().getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("token".equals(cookie.getName())) {
                        String token = cookie.getValue();
                        System.out.println("token: " + token);
                        String email = jwtService.extractEmail(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        if (jwtService.validateToken(token, userDetails)) {
                            Long id = userRepo.findByEmail(email).getId();
                            attributes.put("user_id", id);

                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    @Override
    public void afterHandshake(
            @SuppressWarnings("null") ServerHttpRequest request,
            @SuppressWarnings("null") ServerHttpResponse response,
            @SuppressWarnings("null") WebSocketHandler wsHandler,
            @SuppressWarnings("null") Exception exception
    ) {

    }
}
