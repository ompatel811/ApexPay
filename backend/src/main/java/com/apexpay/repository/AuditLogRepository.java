package com.apexpay.repository;

import com.apexpay.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for AuditLog entity.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByPerformedBy(String performedBy);
    List<AuditLog> findByEntityNameAndEntityId(String entityName, String entityId);
}
