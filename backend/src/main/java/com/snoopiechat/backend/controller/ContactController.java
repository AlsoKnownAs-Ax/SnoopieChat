package com.snoopiechat.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.snoopiechat.backend.dto.AcceptContactRequest;
import com.snoopiechat.backend.dto.AddContactRequest;
import com.snoopiechat.backend.dto.ContactDTO;
import com.snoopiechat.backend.dto.FirendRequestDTO;
import com.snoopiechat.backend.model.UserPrincipal;
import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.repository.UserRepo;
import com.snoopiechat.backend.service.ContactService;

@RestController
@RequestMapping("/contacts")
public class ContactController {

    @Autowired
    private ContactService contactService;

    @Autowired
    private UserRepo userRepo;

    /**
     * Get the current user ID from the authentication object
     */
    private Users getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String email = userPrincipal.getUsername(); // This returns the user's email
        Users user = userRepo.findByEmail(email);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return user;
    }

    /**
     * Get all contacts for the authenticated user
     * 
     * @param authentication current authentication context
     * @return list of contacts
     */
    @GetMapping
    public ResponseEntity<List<ContactDTO>> getContacts(Authentication authentication) {
        Long userId = getCurrentUser(authentication).getId();
        return ResponseEntity.ok(contactService.getUserContacts(userId));
    }

    /**
     * Get all contacts for the authenticated user
     * 
     * @param authentication current authentication context
     * @return list of contacts
     */
    @GetMapping("/{contactId}")
    public ResponseEntity<ContactDTO> getContactData(
            @PathVariable Long contactId,
            Authentication authentication) {
        Users user = getCurrentUser(authentication);
        return ResponseEntity.ok(contactService.getContactData(user, contactId));
    }

    /**
     * Search for potential contacts by username
     * 
     * @param query          the search query
     * @param authentication current authentication context
     * @return list of matching users
     */
    @GetMapping("/search")
    public ResponseEntity<List<Users>> searchUsers(
            @RequestParam String query,
            Authentication authentication) {
        Long userId = getCurrentUser(authentication).getId();
        return ResponseEntity.ok(contactService.searchUsers(userId, query));
    }

    /**
     * Add a new contact
     * 
     * @param contactUsername the username of the user to add as a contact
     * @param authentication  current authentication context
     * @return the created contact
     */
    @PostMapping("/add-contact")
    public ResponseEntity<String> addContact(
            @RequestBody AddContactRequest request,
            Authentication authentication) {
        Users user = getCurrentUser(authentication);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contactService.addContact(user, request.getUsername()));
    }

    @PostMapping("/accept-contact")
    public ResponseEntity<ContactDTO> acceptContact(
            @RequestBody AcceptContactRequest request,
            Authentication authentication) {
        Users user = getCurrentUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contactService.acceptContact(user, request.getId()));
    }

    // Alex: This could've been moved to its own controller but i was lazy
    @GetMapping("/friend-requests/pending")
    public ResponseEntity<List<FirendRequestDTO>> getPendingFriendRequests(
            Authentication authentication) {
        Users user = getCurrentUser(authentication);

        return ResponseEntity.status(HttpStatus.OK)
                .body(contactService.getPendingFriendRequests(user));
    }

    @GetMapping("/friend-requests/pending/count")
    public ResponseEntity<Long> getPendingFriendRequestsCount(
            Authentication authentication) {
        Users user = getCurrentUser(authentication);

        return ResponseEntity.status(HttpStatus.OK)
                .body(contactService.getPendingFriendRequestsCount(user));
    }

    /**
     * Remove a contact
     * 
     * @param contactId      the ID of the contact relationship to remove
     * @param authentication current authentication context
     * @return empty response with 204 status
     */
    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> removeContact(
            @PathVariable Long contactId,
            Authentication authentication) {
        Long userId = getCurrentUser(authentication).getId();
        contactService.removeContact(userId, contactId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Toggle block/unblock status of a contact
     * 
     * @param contactId      the ID of the contact relationship to toggle
     * @param authentication current authentication context
     * @return the updated contact
     */
    @PutMapping("/{contactId}/toggle-block")
    public ResponseEntity<ContactDTO> toggleBlockContact(
            @PathVariable Long contactId,
            Authentication authentication) {
        Long userId = getCurrentUser(authentication).getId();
        return ResponseEntity.ok(contactService.toggleBlockContact(userId, contactId));
    }
}