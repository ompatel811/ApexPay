package com.apexpay.controller;

import com.apexpay.dto.admin.BlacklistRequest;
import com.apexpay.dto.admin.FraudReviewRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.admin.FraudAlert;
import com.apexpay.repository.admin.FraudAlertRepository;
import com.apexpay.service.admin.FraudService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@SuppressWarnings("null")
public class AdminFraudControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FraudService fraudService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetFraudAlerts_Unauthenticated_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/fraud/alerts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"PERMISSION_MANAGE_FRAUD"})
    public void testGetFraudAlerts_Authenticated_Success() throws Exception {
        when(fraudService.getAllAlerts()).thenReturn(new ArrayList<>());

        mockMvc.perform(get("/api/fraud/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"PERMISSION_MANAGE_FRAUD"})
    public void testGetHighRiskUsers_Authenticated_Success() throws Exception {
        when(fraudService.getHighRiskUsers()).thenReturn(new ArrayList<>());

        mockMvc.perform(get("/api/fraud/high-risk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"PERMISSION_MANAGE_FRAUD"})
    public void testReviewFraudAlert_Authenticated_Success() throws Exception {
        FraudReviewRequest request = new FraudReviewRequest(UUID.randomUUID(), "CLOSED_RESOLVED", "True violator transaction velocity");

        mockMvc.perform(post("/api/fraud/review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"PERMISSION_MANAGE_FRAUD"})
    public void testBlockEntity_Authenticated_Success() throws Exception {
        BlacklistRequest request = new BlacklistRequest("IP", "192.168.1.55", "Repeated velocity trigger");

        mockMvc.perform(post("/api/fraud/block")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(fraudService).blockEntity(any(BlacklistRequest.class), any());
    }
}
