package com.apexpay.repository.admin;

import com.apexpay.entity.admin.Whitelist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WhitelistRepository extends JpaRepository<Whitelist, UUID> {
    Optional<Whitelist> findByTypeAndItemValue(String type, String itemValue);
    boolean existsByTypeAndItemValue(String type, String itemValue);
    List<Whitelist> findByType(String type);
}
