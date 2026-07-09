package com.apexpay.repository;

import com.apexpay.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, UUID> {
    Optional<Merchant> findByOwnerId(UUID ownerId);
    Optional<Merchant> findByBusinessEmail(String businessEmail);
    Optional<Merchant> findByBusinessMobile(String businessMobile);
    boolean existsByBusinessEmail(String businessEmail);
    boolean existsByBusinessMobile(String businessMobile);

    @Query("SELECT me.merchant FROM MerchantEmployee me WHERE me.user.id = :userId AND me.status = 'ACTIVE'")
    Optional<Merchant> findMerchantByEmployeeUserId(@Param("userId") UUID userId);
}
