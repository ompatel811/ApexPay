package com.apexpay.repository;

import com.apexpay.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for BankAccount entity.
 */
@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {
    List<BankAccount> findByUserId(UUID userId);
    Optional<BankAccount> findByUserIdAndIsPrimaryTrue(UUID userId);
    boolean existsByUserIdAndAccountNumber(UUID userId, String accountNumber);
}
