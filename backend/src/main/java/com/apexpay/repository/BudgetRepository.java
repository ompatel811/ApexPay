package com.apexpay.repository;

import com.apexpay.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    Optional<Budget> findByUserIdAndCategoryAndMonth(UUID userId, String category, String month);
    List<Budget> findByUserIdAndMonth(UUID userId, String month);
    List<Budget> findByUserId(UUID userId);
}
