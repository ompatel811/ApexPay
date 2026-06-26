package com.apexpay.service.impl;

import com.apexpay.entity.Role;
import com.apexpay.entity.enums.RoleName;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.RoleRepository;
import com.apexpay.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service implementation for Role operations.
 */
@Service
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public Role findByName(RoleName name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + name));
    }
}
