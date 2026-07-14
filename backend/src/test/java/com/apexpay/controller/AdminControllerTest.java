package com.apexpay.controller;

import com.apexpay.dto.admin.AdminLoginRequest;
import com.apexpay.entity.admin.AdminRole;
import com.apexpay.entity.admin.AdminUser;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.repository.admin.AdminRoleRepository;
import com.apexpay.repository.admin.AdminUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@SuppressWarnings("null")
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private AdminRoleRepository adminRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private AdminUser testAdmin;

    @BeforeEach
    void setUp() {
        adminUserRepository.deleteAll();

        // Ensure roles are set up if not loaded
        AdminRole adminRole = adminRoleRepository.findByName("SUPER_ADMIN")
                .orElseGet(() -> {
                    AdminRole r = new AdminRole();
                    r.setName("SUPER_ADMIN");
                    r.setDescription("Super Administrator");
                    return adminRoleRepository.save(r);
                });

        testAdmin = new AdminUser();
        testAdmin.setFullName("Test Admin User");
        testAdmin.setUsername("testadmin");
        testAdmin.setEmail("testadmin@apexpay.com");
        testAdmin.setPasswordHash(passwordEncoder.encode("TestAdminPass123!"));
        testAdmin.setStatus(AccountStatus.ACTIVE);
        testAdmin.setCreatedAt(LocalDateTime.now());
        testAdmin.setUpdatedAt(LocalDateTime.now());
        testAdmin.getRoles().add(adminRole);

        testAdmin = adminUserRepository.save(testAdmin);
    }

    @Test
    public void testAdminLogin_Success() throws Exception {
        AdminLoginRequest request = new AdminLoginRequest("testadmin", "TestAdminPass123!");

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.profile.username").value("testadmin"));
    }

    @Test
    public void testAdminLogin_InvalidCredentials() throws Exception {
        AdminLoginRequest request = new AdminLoginRequest("testadmin", "wrong-password");

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testGetDashboardData_Unauthenticated_ShouldFail() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
