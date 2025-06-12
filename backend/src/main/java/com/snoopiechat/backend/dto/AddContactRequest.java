package com.snoopiechat.backend.dto;

public class AddContactRequest {
    private String username;

    public String getUsername() {
        return username != null ? username.trim() : null;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
