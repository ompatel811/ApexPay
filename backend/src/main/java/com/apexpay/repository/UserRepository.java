package com.apexpay.repository;

import com.apexpay.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByMobileNumber(String mobileNumber);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByMobileNumber(String mobileNumber);
    long countByAccountStatus(com.apexpay.entity.enums.AccountStatus accountStatus);
}
