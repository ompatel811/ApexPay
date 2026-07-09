package com.apexpay.repository;

import com.apexpay.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    List<Settlement> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
    Optional<Settlement> findByReferenceNumber(String referenceNumber);
}
