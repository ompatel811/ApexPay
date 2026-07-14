package com.apexpay.repository.admin;

import com.apexpay.entity.admin.Investigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvestigationRepository extends JpaRepository<Investigation, UUID> {
    Optional<Investigation> findByAlertId(UUID alertId);
    List<Investigation> findByStatus(String status);
}
