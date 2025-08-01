package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.UpdateWalletRequestDTO;
import com.rft.rft_be.dto.wallet.WalletDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.exception.ResourceNotFoundException;
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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@SpringBootTest
@AutoConfigureMockMvc
public class WalletControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WalletService walletService;

    private WalletDTO walletDTO;
    private WalletTransactionDTO transactionDTO;
    private ObjectMapper objectMapper = new ObjectMapper();

    private JwtAuthenticationToken buildJwtAuthToken(String userId, String role) {
        Instant now = Instant.now();
        Map<String, Object> claims = Map.of("userId", userId, "scope", role);
        Jwt jwt = new Jwt("fake-token", now, now.plusSeconds(3600), Map.of("alg", "none"), claims);

        return new JwtAuthenticationToken(jwt, List.of(
                (GrantedAuthority) () -> role,
                (GrantedAuthority) () -> "ROLE_" + role
        ));
    }

    @BeforeEach
    void init() {
        objectMapper.registerModule(new JavaTimeModule());

        walletDTO = new WalletDTO("wallet-001", "testuser", new BigDecimal("100000"), "123", "A", "SAVINGS");

        transactionDTO = new WalletTransactionDTO();
        transactionDTO.setId("txn-001");
        transactionDTO.setAmount(new BigDecimal("50000"));
        transactionDTO.setStatus("PENDING");
        transactionDTO.setUserId("testuser");
    }

    @Test
    void getWalletByUserId_success() throws Exception {
        Mockito.when(walletService.getWalletByUserId("testuser")).thenReturn(walletDTO);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/wallet/account")
                        .param("userId", "testuser")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("id").value("wallet-001"));
    }

    @Test
    void getWalletByUserId_forbidden() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/wallet/account")
                        .param("userId", "anotheruser")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void updateWallet_success() throws Exception {
        UpdateWalletRequestDTO dto = new UpdateWalletRequestDTO("testuser", "123", "A", "SAVINGS");

        Mockito.when(walletService.updateWallet(ArgumentMatchers.any())).thenReturn(walletDTO);

        mockMvc.perform(MockMvcRequestBuilders.put("/api/wallet/account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("id").value("wallet-001"));
    }

    @Test
    void updateWallet_forbidden() throws Exception {
        UpdateWalletRequestDTO dto = new UpdateWalletRequestDTO("anotheruser", "123", "A", "SAVINGS");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/wallet/account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void createWithdrawalRequest_success() throws Exception {
        CreateWithdrawalRequestDTO dto = new CreateWithdrawalRequestDTO("testuser", new BigDecimal("10000"));

        Mockito.when(walletService.createWithdrawal(ArgumentMatchers.any())).thenReturn(transactionDTO);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("id").value("txn-001"));
    }

    @Test
    void createWithdrawalRequest_forbidden() throws Exception {
        CreateWithdrawalRequestDTO dto = new CreateWithdrawalRequestDTO("anotheruser", new BigDecimal("10000"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/wallet/withdrawals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isForbidden());
    }

    @Test
    void getAllTransactions_success() throws Exception {
        List<WalletTransactionDTO> txns = List.of(transactionDTO);
        Mockito.when(walletService.getWithdrawalsByUser("testuser")).thenReturn(txns);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/wallet/withdrawals")
                        .param("userId", "testuser")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("[0].id").value("txn-001"));
    }

    @Test
    void cancelWithdrawal_success() throws Exception {
        Mockito.doNothing().when(walletService).cancelWithdrawalAsUser("txn-001", "testuser");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/wallet/withdrawals/txn-001/cancel")
                        .param("userId", "testuser")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("testuser", "USER")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void updateWithdrawalStatus_success() throws Exception {
        Mockito.doNothing().when(walletService).updateWithdrawalStatus("txn-001", "COMPLETED", "staffuser");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/wallet/staff/withdrawals/txn-001/status")
                        .param("status", "COMPLETED")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("staffuser", "STAFF")))
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void getWalletTransactionById_success() throws Exception {
        Mockito.when(walletService.getWithdrawalById("txn-001")).thenReturn(transactionDTO);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/wallet/staff/withdrawals/txn-001")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("staffuser", "STAFF"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("id").value("txn-001"));
    }

    @Test
    void getWalletTransactionById_exceptionHandling() throws Exception {
        Mockito.when(walletService.getWithdrawalById("txn-001"))
                .thenThrow(new ResourceNotFoundException("Transaction not found"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/wallet/staff/withdrawals/txn-001")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("staffuser", "STAFF"))))
                .andExpect(MockMvcResultMatchers.status().isNotFound())
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Transaction not found"));
    }

    @Test
    void getAllWithdrawals_success() throws Exception {
        List<WalletTransactionDTO> txns = List.of(transactionDTO);
        Mockito.when(walletService.getAllWithdrawals(WalletTransaction.Status.PENDING)).thenReturn(txns);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/wallet/staff/withdrawals")
                        .param("status", "PENDING")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(buildJwtAuthToken("staffuser", "STAFF"))))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("[0].id").value("txn-001"));
    }
}
