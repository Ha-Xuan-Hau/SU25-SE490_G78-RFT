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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

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

    private JwtAuthenticationToken buildJwtAuthToken(String userId) {
        Instant now = Instant.now();
        Map<String, Object> claims = Map.of("userId", userId);
        Jwt jwt = new Jwt(
                "fake-token",
                now,
                now.plusSeconds(3600), // expiresAt
                Map.of("alg", "none"),
                claims
        );
        return new JwtAuthenticationToken(jwt, List.of(() -> "USER")); // quyền đúng với controller
    }

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
    void createWithdrawal_validRequest_success() throws Exception {
        Mockito.when(walletService.createWithdrawal(ArgumentMatchers.any(CreateWithdrawalRequestDTO.class)))
                .thenReturn(responseDTO);

        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(requestDTO))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("user-001")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("txn-001"))
                .andExpect(jsonPath("$.userId").value("user-001"))
                .andExpect(jsonPath("$.amount").value(500000))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createWithdrawal_insufficientBalance_fail() throws Exception {
        requestDTO.setAmount(new BigDecimal("99999999"));
        Mockito.when(walletService.createWithdrawal(ArgumentMatchers.any(CreateWithdrawalRequestDTO.class)))
                .thenThrow(new RuntimeException("Số dư không đủ"));

        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(requestDTO))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("user-001")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số dư không đủ"));
    }

    @Test
    void createWithdrawal_invalidInput_fail() throws Exception {
        CreateWithdrawalRequestDTO invalidRequest = CreateWithdrawalRequestDTO.builder()
                .userId("user-001")
                .amount(null)
                .build();

        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(invalidRequest))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("user-001")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amount").value("Số tiền không được bỏ trống"));
    }

    @Test
    void createWithdrawal_amountZero_fail() throws Exception {
        CreateWithdrawalRequestDTO zeroAmountRequest = CreateWithdrawalRequestDTO.builder()
                .userId("user-001")
                .amount(BigDecimal.ZERO)
                .build();

        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(zeroAmountRequest))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("user-001")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amount").value("Số tiền phải lớn hơn 0"));
    }

    @Test
    void createWithdrawal_negativeAmount_fail() throws Exception {
        CreateWithdrawalRequestDTO negativeAmountRequest = CreateWithdrawalRequestDTO.builder()
                .userId("user-001")
                .amount(new BigDecimal("-1000"))
                .build();

        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(negativeAmountRequest))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("user-001")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amount").value("Số tiền phải lớn hơn 0"));
    }

    @Test
    void createWithdrawal_invalidUserId_fail() throws Exception {
        mockMvc.perform(post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(objectMapper.writeValueAsString(requestDTO))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("user-999")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bạn không có quyền truy cập tài nguyên này"));
    }
}
