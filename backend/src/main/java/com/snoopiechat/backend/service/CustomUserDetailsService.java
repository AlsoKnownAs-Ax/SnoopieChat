package com.snoopiechat.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.snoopiechat.backend.model.UserPrincipal;
import com.snoopiechat.backend.model.Users;
import com.snoopiechat.backend.repository.UserRepo;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Users user = userRepo.findByEmail(username);
        if(user == null){
            throw new UsernameNotFoundException("user not found");
        }

        return new UserPrincipal(user);
    }
}
