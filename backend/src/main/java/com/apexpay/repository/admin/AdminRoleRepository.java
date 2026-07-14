package com.apexpay.repository.admin;

import com.apexpay.entity.admin.AdminRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminRoleRepository extends JpaRepository<AdminRole, UUID> {
    Optional<AdminRole> findByName(String name);
}
