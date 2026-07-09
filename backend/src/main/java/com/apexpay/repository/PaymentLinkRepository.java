package com.apexpay.repository;

import com.apexpay.entity.PaymentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentLinkRepository extends JpaRepository<PaymentLink, UUID> {
    Optional<PaymentLink> findByReferenceNumber(String referenceNumber);
    List<PaymentLink> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
}
