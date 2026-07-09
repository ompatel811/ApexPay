package com.apexpay.repository;

import com.apexpay.entity.MerchantRole;
import com.apexpay.entity.enums.MerchantRoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MerchantRoleRepository extends JpaRepository<MerchantRole, UUID> {
    Optional<MerchantRole> findByName(MerchantRoleName name);
}
