package com.apexpay.service.impl;

import com.apexpay.entity.AuditLog;
import com.apexpay.repository.AuditLogRepository;
import com.apexpay.service.AuditService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service implementation for platform security auditing.
 * Uses REQUIRES_NEW propagation to save logs even if transaction rolls back.
 */
@Slf4j
@Service
public class AuditServiceImpl implements AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String performedBy, String entityName, String entityId) {
        log.info("AUDIT LOG - Action: {}, User: {}, Target: {}/{}", action, performedBy, entityName, entityId);
        
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setPerformedBy(performedBy);
        auditLog.setEntityName(entityName);
        auditLog.setEntityId(entityId);
        auditLog.setTimestamp(LocalDateTime.now());

        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, UUID performedBy, String entityName, UUID entityId) {
        String performerStr = performedBy != null ? performedBy.toString() : "SYSTEM";
        String targetStr = entityId != null ? entityId.toString() : null;
        this.log(action, performerStr, entityName, targetStr);
    }
}
