package com.apexpay.security;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.entity.User;
import com.apexpay.repository.UserRepository;

/**
 * Service to load user principles from user identifiers (Email, Mobile, or Username).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // 1. Try finding by email
        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByMobileNumber(identifier)
                        .orElseGet(() -> userRepository.findByUsername(identifier)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                        "User not found with email, mobile, or username: " + identifier))));

        return UserPrincipal.create(user);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return UserPrincipal.create(user);
    }
}
