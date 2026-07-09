package com.apexpay.repository;

import com.apexpay.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {
    List<Refund> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
    Optional<Refund> findByTransactionId(UUID transactionId);
}
