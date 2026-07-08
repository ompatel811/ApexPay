package com.apexpay.repository;

import com.apexpay.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Transaction entity.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByTransactionReference(String transactionReference);

    @Query("SELECT t FROM Transaction t WHERE t.senderWallet.id = :walletId OR t.receiverWallet.id = :walletId")
    Page<Transaction> findByWalletId(@Param("walletId") UUID walletId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.senderWallet.user.id = :userId OR t.receiverWallet.user.id = :userId) AND t.paymentStatus = 'SUCCESS'")
    java.util.List<Transaction> findSuccessTransactionsByUserId(@Param("userId") UUID userId);

    @Query("SELECT t FROM Transaction t WHERE t.senderWallet.user.id = :userId OR t.receiverWallet.user.id = :userId")
    java.util.List<Transaction> findAllTransactionsByUserId(@Param("userId") UUID userId);
}
