package com.apexpay.repository;

import com.apexpay.entity.QRCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for QRCode entity.
 */
@Repository
public interface QRCodeRepository extends JpaRepository<QRCode, UUID> {
    List<QRCode> findByUserId(UUID userId);
    List<QRCode> findByUserIdOrderByCreatedAtDesc(UUID userId);
    java.util.Optional<QRCode> findByReferenceNumber(String referenceNumber);
}
