package com.apexpay.service;

import com.apexpay.entity.Role;
import com.apexpay.entity.enums.RoleName;

/**
 * Service interface for Role entity operations.
 */
public interface RoleService {
    Role findByName(RoleName name);
}
