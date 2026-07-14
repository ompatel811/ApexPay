package com.apexpay.repository.admin;

import com.apexpay.entity.admin.FraudRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FraudRuleRepository extends JpaRepository<FraudRule, UUID> {
    Optional<FraudRule> findByRuleKey(String ruleKey);
}
