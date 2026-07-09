package com.apexpay.repository;

import com.apexpay.entity.MerchantWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantWalletRepository extends JpaRepository<MerchantWallet, UUID> {
    Optional<MerchantWallet> findByMerchantId(UUID merchantId);
    Optional<MerchantWallet> findByWalletNumber(String walletNumber);
    boolean existsByWalletNumber(String walletNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT mw FROM MerchantWallet mw WHERE mw.id = :id")
    Optional<MerchantWallet> findByIdForUpdate(@Param("id") UUID id);
}
