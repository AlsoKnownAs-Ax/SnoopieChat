package com.snoopiechat.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.snoopiechat.backend.dto.ContactDTO;
import com.snoopiechat.backend.dto.FirendRequestDTO;
import com.snoopiechat.backend.model.ChatMessage;
import com.snoopiechat.backend.model.Contact;
import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.model.FriendRequest.FriendRequest;
import com.snoopiechat.backend.model.FriendRequest.RequestStatus;
import com.snoopiechat.backend.repository.ChatMessageRepo;
import com.snoopiechat.backend.repository.ContactRepo;
import com.snoopiechat.backend.repository.FriendRequestRepo;
import com.snoopiechat.backend.repository.UserRepo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ContactService {

    @SuppressWarnings("unused")
    private static final Logger logger = LoggerFactory.getLogger(ContactService.class);

    @Autowired
    private ContactRepo contactRepo;
    
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ChatMessageRepo chatMessageRepo;

    @Autowired
    private FriendRequestRepo friendRequestRepo;

    /**
     * Convert Contact entity to ContactDTO
     */
    private ContactDTO convertToDTO(Contact contact, ChatMessage lastMessage) {
        ContactDTO dto = new ContactDTO(
                contact.getContact().getId(),
                contact.getContact().getUsername(),
                contact.getContact().getEmail(),
                contact.isBlocked(),
                lastMessage != null ? lastMessage.getContent() : null,
                lastMessage != null ? lastMessage.getTimestamp() : null,
                false // placeholder for online
        );

        return dto;
    }
    
    /**
     * Get all contacts for a user
     * 
     * @param userId the user's ID
     * @return list of contact DTOs
     */
    public List<ContactDTO> getUserContacts(Long userId) {
        Users user = userRepo.findById(userId.intValue())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        List<Contact> contacts = contactRepo.findByUser(user);

        return contacts.stream()
                .map(contact -> {
                    Long senderId = user.getId();
                    Long recipientId = contact.getId();
                    // Build chatID
                    String chatId = senderId < recipientId
                            ? senderId + "_" + recipientId
                            : recipientId + "_" + senderId;

                    // Get the last message between user and contact
                    ChatMessage lastMessage = chatMessageRepo.findTopByChatIdOrderByTimestampDesc(chatId);

                    return convertToDTO(contact, lastMessage);
                })
            .collect(Collectors.toList());
    }
    
    /**
     * Search for users by username
     * 
     * @param userId the current user's ID
     * @param query the search query
     * @return list of users matching the query, excluding the current user and already added contacts
     */
    public List<Users> searchUsers(Long userId, String query) {
        if (query == null || query.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search query cannot be empty");
        }
        
        Users currentUser = userRepo.findById(userId.intValue())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        // Get all users whose username contains the query (case insensitive)
        List<Users> matchingUsers = userRepo.findByUsernameContainingIgnoreCase(query);
        
        // Get the user's existing contacts
        List<Contact> existingContacts = contactRepo.findByUser(currentUser);
        List<Long> contactIds = existingContacts.stream()
            .map(contact -> contact.getContact().getId())
            .collect(Collectors.toList());
        
        // Filter out the current user and existing contacts
        return matchingUsers.stream()
            .filter(user -> !user.getId().equals(userId) && !contactIds.contains(user.getId()))
            .collect(Collectors.toList());
    }
    
    /**
     * Add a contact for a user
     * 
     * @param userId the user's ID
     * @param contactId the contact's ID
     * @return the created contact DTO
     */
    public String addContact(Users user, String contactUsername) {
        if (user.getUsername().equals(contactUsername)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add yourself as a contact");
        }


        Users contactUser = userRepo.findByUsername(contactUsername);
        
        if (contactUser == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "We couldn't find a user with that username. Please check for typos.");
        }

        if (friendRequestRepo.existsBySenderAndRecipientAndStatus(user, contactUser, RequestStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already sent.");
        }

        if (contactRepo.existsByUserAndContact(user, contactUser)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This user is already in your contacts.");
        }

        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(user);
        friendRequest.setRecipient(contactUser);

        friendRequestRepo.save(friendRequest);

        return "Friend Request send succesfully";
    }
    
    /**
     * Remove a contact
     * 
     * @param userId the user's ID
     * @param contactId the contact relationship ID
     */
    public void removeContact(Long userId, Long contactId) {
        Contact contact = contactRepo.findById(contactId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
        
        // Make sure the contact belongs to the user
        if (!contact.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contact does not belong to this user");
        }
        
        contactRepo.delete(contact);
    }
    
    /**
     * Toggle the blocked status of a contact
     * 
     * @param userId the user's ID
     * @param contactId the contact relationship ID
     * @return the updated contact DTO
     */
    public ContactDTO toggleBlockContact(Long userId, Long contactId) {
        Contact contact = contactRepo.findById(contactId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
        
        // Make sure the contact belongs to the user
        if (!contact.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contact does not belong to this user");
        }
        
        // Toggle blocked status
        contact.setBlocked(!contact.isBlocked());
        Contact updatedContact = contactRepo.save(contact);
        
        return convertToDTO(updatedContact, null);
    }

    public ContactDTO acceptContact(Users user, Long requestId) {
        FriendRequest request = friendRequestRepo.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend Request not found"));

        // We make sure the request is accepted by a legitimate user
        if (!(request.getRecipient().getId() == user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This friend request is not yours.");
        }

        request.setStatus(RequestStatus.ACCEPTED);

        Users senderUser = userRepo.findById(request.getSender().getId());

        if (senderUser == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Contact associated to the friend request was not found");
        }

        Contact senderContact = new Contact();
        senderContact.setUser(user);
        senderContact.setContact(senderUser);

        Contact recipientContact = new Contact();
        recipientContact.setUser(senderUser);
        recipientContact.setContact(user);

        contactRepo.save(senderContact);
        contactRepo.save(recipientContact);
        friendRequestRepo.save(request);

        return convertToDTO(senderContact, null);
    }

    public List<FirendRequestDTO> getPendingFriendRequests(Users user) {
        List<FriendRequest> pendingRequests = friendRequestRepo.findByRecipientAndStatus(user, RequestStatus.PENDING);

        return pendingRequests.stream()
                .map(request -> new FirendRequestDTO(
                        request.getId(),
                        request.getSender().getUsername()))
                .collect(Collectors.toList());
    }

    public Long getPendingFriendRequestsCount(Users user) {
        return friendRequestRepo.countByRecipientAndStatus(user, RequestStatus.PENDING);
    }

    public ContactDTO getContactData(Users user, Long contactId) {
        Users userContact = userRepo.findById(contactId);
        Contact contact = contactRepo.findByUserAndContact(user, userContact)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact Data not found."));

        return convertToDTO(contact, null);
    }
} 