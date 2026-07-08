package com.apexpay.repository;

import com.apexpay.entity.UpiId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UpiIdRepository extends JpaRepository<UpiId, UUID> {
    Optional<UpiId> findByUpiId(String upiId);
    List<UpiId> findByUserId(UUID userId);
    boolean existsByUpiId(String upiId);
    Optional<UpiId> findByUserIdAndIsPrimaryTrue(UUID userId);
}
