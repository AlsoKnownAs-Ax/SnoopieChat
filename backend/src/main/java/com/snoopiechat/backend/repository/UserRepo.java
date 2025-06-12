package com.snoopiechat.backend.repository;

import java.util.List;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.snoopiechat.backend.model.Users;

@Repository
public interface UserRepo extends JpaRepository<Users, Integer> {
    Users findByUsername(String username);
    Users findByEmail(String email);

    Users findById(Long id);

    /**
     * Check if a user with the given email exists
     * 
     * @param email the email to check
     * @return true if a user with this email exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Check if a user with the given username exists
     * 
     * @param username the username to check
     * @return true if a user with this username exists, false otherwise
     */
    boolean existsByUsername(String username);
    
    /**
     * Find users by username containing the given string (case insensitive)
     * 
     * @param username part of the username to search for
     * @return list of users with usernames containing the search string
     */
    List<Users> findByUsernameContainingIgnoreCase(String username);
}
