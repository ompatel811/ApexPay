package com.apexpay.repository;

import com.apexpay.entity.WalletLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for WalletLedger entity.
 */
@Repository
public interface WalletLedgerRepository extends JpaRepository<WalletLedger, UUID> {
    List<WalletLedger> findByWalletIdOrderByTimestampDesc(UUID walletId);
    List<WalletLedger> findByWalletIdAndTimestampAfter(UUID walletId, LocalDateTime timestamp);
}
