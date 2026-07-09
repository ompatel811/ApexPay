package com.apexpay.repository;

import com.apexpay.entity.MerchantEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantEmployeeRepository extends JpaRepository<MerchantEmployee, UUID> {
    List<MerchantEmployee> findByMerchantId(UUID merchantId);
    Optional<MerchantEmployee> findByMerchantIdAndUserId(UUID merchantId, UUID userId);
    Optional<MerchantEmployee> findByUserId(UUID userId);
}
