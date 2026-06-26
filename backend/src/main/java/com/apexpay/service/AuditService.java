package com.apexpay.service;

import java.util.UUID;

/**
 * Service interface for platform security auditing.
 */
public interface AuditService {
    void log(String action, String performedBy, String entityName, String entityId);
    void log(String action, UUID performedBy, String entityName, UUID entityId);
}
