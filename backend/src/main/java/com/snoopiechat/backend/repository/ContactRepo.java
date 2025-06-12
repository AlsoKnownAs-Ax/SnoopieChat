package com.snoopiechat.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.snoopiechat.backend.model.Contact;
import com.snoopiechat.backend.model.Users;

@Repository
public interface ContactRepo extends JpaRepository<Contact, Long> {
    /**
     * Find all contacts for a given user
     * 
     * @param user the user whose contacts to find
     * @return list of contacts for the user
     */
    List<Contact> findByUser(Users user);
    
    /**
     * Find all contacts where the given user is the contact
     * 
     * @param contact the user who is the contact
     * @return list of contacts where this user is the contact
     */
    List<Contact> findByContact(Users contact);
    
    /**
     * Find a specific contact relationship between a user and a contact
     * 
     * @param user the user
     * @param contact the contact
     * @return the contact relationship if it exists
     */
    Optional<Contact> findByUserAndContact(Users user, Users contact);
    
    /**
     * Check if a contact relationship exists between a user and a contact
     * 
     * @param user the user
     * @param contact the contact
     * @return true if the relationship exists, false otherwise
     */
    boolean existsByUserAndContact(Users user, Users contact);
} 