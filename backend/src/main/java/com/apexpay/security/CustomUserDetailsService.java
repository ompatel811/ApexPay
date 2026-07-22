package com.apexpay.security;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.entity.User;
import com.apexpay.entity.admin.AdminUser;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.admin.AdminUserRepository;

/**
 * Service to load user principles from user identifiers (Email, Mobile, or Username).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // 1. Try finding in normal user database
        Optional<User> userOpt = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByMobileNumber(identifier))
                .or(() -> userRepository.findByUsername(identifier));

        if (userOpt.isPresent()) {
            return UserPrincipal.create(userOpt.get());
        }

        // 2. Try finding in admin user database
        Optional<AdminUser> adminOpt = adminUserRepository.findByEmail(identifier)
                .or(() -> adminUserRepository.findByUsername(identifier));

        if (adminOpt.isPresent()) {
            return AdminPrincipal.create(adminOpt.get());
        }

        throw new UsernameNotFoundException("User or Admin not found with identifier: " + identifier);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        // 1. Check user repository first
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return UserPrincipal.create(user.get());
        }

        // 2. Check admin repository
        Optional<AdminUser> adminUser = adminUserRepository.findById(id);
        if (adminUser.isPresent()) {
            return AdminPrincipal.create(adminUser.get());
        }

        throw new UsernameNotFoundException("User or Admin not found with id: " + id);
    }
}
