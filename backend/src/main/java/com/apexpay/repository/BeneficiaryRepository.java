package com.apexpay.repository;

import com.apexpay.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Beneficiary entity.
 */
@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID> {
    List<Beneficiary> findByUserId(UUID userId);
    List<Beneficiary> findByUserIdAndNicknameContainingIgnoreCase(UUID userId, String nickname);
}
