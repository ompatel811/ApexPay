package com.apexpay.repository;

import com.apexpay.entity.DeviceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for DeviceSession entity.
 */
@Repository
public interface DeviceSessionRepository extends JpaRepository<DeviceSession, UUID> {
    List<DeviceSession> findByUserId(UUID userId);
    List<DeviceSession> findByUserIdAndIsActiveTrue(UUID userId);
}
