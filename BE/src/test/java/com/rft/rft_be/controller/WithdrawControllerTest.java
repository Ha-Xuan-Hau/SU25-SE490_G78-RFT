package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.service.wallet.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class WithdrawControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WalletService walletService;

    private ObjectMapper objectMapper;

    private CreateWithdrawalRequestDTO requestDTO;
    private WalletTransactionDTO responseDTO;

    @BeforeEach
    void init() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        requestDTO = CreateWithdrawalRequestDTO.builder()
                .userId("user-001")
                .amount(new BigDecimal("500000"))
                .build();

        responseDTO = WalletTransactionDTO.builder()
                .id("txn-001")
                .userId("user-001")
                .amount(new BigDecimal("500000"))
                .status("PENDING")
                .build();
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createWithdrawal_validRequest_success() throws Exception {
        // GIVEN
        Mockito.when(walletService.createWithdrawal(ArgumentMatchers.any(CreateWithdrawalRequestDTO.class)))
                .thenReturn(responseDTO);

        // WHEN // THEN
        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(requestDTO))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("txn-001"))
                .andExpect(jsonPath("$.userId").value("user-001"))
                .andExpect(jsonPath("$.amount").value(500000))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createWithdrawal_insufficientBalance_fail() throws Exception {
        // GIVEN
        requestDTO.setAmount(new BigDecimal("99999999"));
        Mockito.when(walletService.createWithdrawal(ArgumentMatchers.any(CreateWithdrawalRequestDTO.class)))
                .thenThrow(new RuntimeException("Số dư không đủ"));

        // WHEN // THEN
        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(requestDTO))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("message").value("Số dư không đủ"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void createWithdrawal_invalidInput_fail() throws Exception {
        // GIVEN
        CreateWithdrawalRequestDTO invalidRequest = CreateWithdrawalRequestDTO.builder()
                .userId("user-001")
                .amount(null)
                .build();

        // WHEN // THEN
        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(invalidRequest))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("errors.amount").value("Số tiền không được bỏ trống"));
    }
}
