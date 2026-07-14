package com.apexpay.repository.admin;

import com.apexpay.entity.admin.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {
    List<FraudAlert> findByRiskLevel(String riskLevel);
    List<FraudAlert> findByStatus(String status);
    List<FraudAlert> findByUserId(UUID userId);
    List<FraudAlert> findByWalletId(UUID walletId);
    List<FraudAlert> findTop50ByOrderByCreatedAtDesc();
    long countByRiskLevel(String riskLevel);
    long countByStatus(String status);

    @Query("SELECT DISTINCT fa.user.id FROM FraudAlert fa WHERE fa.riskLevel IN ('HIGH', 'CRITICAL')")
    List<UUID> findHighRiskUserIds();
}
