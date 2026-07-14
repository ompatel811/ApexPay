package com.apexpay.repository;

import com.apexpay.entity.FinancialInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface FinancialInsightRepository extends JpaRepository<FinancialInsight, UUID> {
    List<FinancialInsight> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<FinancialInsight> findByUserIdAndType(UUID userId, String type);
}
