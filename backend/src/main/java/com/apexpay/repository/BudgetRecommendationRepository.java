package com.apexpay.repository;

import com.apexpay.entity.BudgetRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetRecommendationRepository extends JpaRepository<BudgetRecommendation, UUID> {
    List<BudgetRecommendation> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<BudgetRecommendation> findByUserIdAndIsApplied(UUID userId, boolean isApplied);
    Optional<BudgetRecommendation> findByUserIdAndCategoryAndIsApplied(UUID userId, String category, boolean isApplied);
}
