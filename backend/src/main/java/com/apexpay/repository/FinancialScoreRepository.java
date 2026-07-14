package com.apexpay.repository;

import com.apexpay.entity.FinancialScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinancialScoreRepository extends JpaRepository<FinancialScore, UUID> {
    Optional<FinancialScore> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}
