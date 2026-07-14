package com.apexpay.repository.admin;

import com.apexpay.entity.admin.Blacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, UUID> {
    Optional<Blacklist> findByTypeAndItemValue(String type, String itemValue);
    boolean existsByTypeAndItemValue(String type, String itemValue);
    List<Blacklist> findByType(String type);
}
