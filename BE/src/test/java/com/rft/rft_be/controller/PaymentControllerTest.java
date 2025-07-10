package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.service.Contract.ContractService;
import com.rft.rft_be.service.payment.PaymentService;
import com.rft.rft_be.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
public class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private ContractService contractService;


    private PaymentRequest paymentRequest;
    private VNPayResponse vnPayResponse;
    private Map<String, String> vnpParams;

    @BeforeEach
    void initData() {
        paymentRequest = PaymentRequest.builder()
                .amout(new BigDecimal("1000000"))
                .bankCode("NCB")
                .bookingId("booking_001")
                .build();

        vnPayResponse = VNPayResponse.builder()
                .code("00")
                .message("Success")
                .paymentUrl("https://vnpay.vn/payment?txnRef=booking_001")
                .build();

        vnpParams = new HashMap<>();
        vnpParams.put("vnp_TxnRef", "booking_001");
        vnpParams.put("vnp_ResponseCode", "00");
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"}) // Giả lập người dùng đã xác thực
    void createVnPayPayment_validRequest_success() throws Exception {
        // GIVEN
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(paymentRequest);

        // WHEN
        Mockito.when(paymentService.createVnPayPayment(ArgumentMatchers.any(PaymentRequest.class), ArgumentMatchers.any(HttpServletRequest.class)))
                .thenReturn(vnPayResponse);

        // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/payment/vn-pay")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())) // Thêm CSRF token giả lập
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("00"))
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Success"))
                .andExpect(MockMvcResultMatchers.jsonPath("paymentUrl").value("https://vnpay.vn/payment?txnRef=booking_001"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"}) // Giả lập người dùng đã xác thực
    void createVnPayPayment_invalidRequestAmountNegative_fail() throws Exception {
        // GIVEN
        paymentRequest.setAmout(new BigDecimal("0")); // Số tiền không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(paymentRequest);

        //WHEN //THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/payment/vn-pay")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())) // Thêm CSRF token giả lập
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("errors.amout").value("Số tiền phải lớn hơn 0"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"}) // Giả lập người dùng đã xác thực
    void createVnPayPayment_invalidRequestAmountNull_fail() throws Exception {
        // GIVEN
        paymentRequest.setAmout(null); // Số tiền không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(paymentRequest);

        //WHEN //THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/payment/vn-pay")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())) // Thêm CSRF token giả lập
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("errors.amout").value("Số tiền không được bỏ trống"));
    }

    @Test
    void payCallbackHandler_validSignature_success() throws Exception {
        // GIVEN
        Mockito.when(paymentService.validateVNPayResponse(ArgumentMatchers.anyMap())).thenReturn(true);
        Mockito.doNothing().when(contractService).createContractByPayment(ArgumentMatchers.anyString());

        // WHEN // THEN
        MvcResult result = mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/payment/vn-pay-callback?vnp_ResponseCode="+vnpParams.get("vnp_ResponseCode")
                        +"&vnp_TxnRef="+vnpParams.get("vnp_TxnRef"))
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TxnRef", "booking_001"))
                .andExpect(MockMvcResultMatchers.status().isFound())
                .andReturn();

        String redirecteUrl = result.getResponse().getRedirectedUrl();
        assertTrue(redirecteUrl.contains("/payment/callback"));
        assertTrue(redirecteUrl.contains("vnp_TxnRef=booking_001"));
        assertTrue(redirecteUrl.contains("vnp_ResponseCode=00"));
    }

    @Test
    void payCallbackHandler_invalidResponseCode_fail() throws Exception {
        // GIVEN
        vnpParams.put("vnp_ResponseCode", "01"); // Mã phản hồi không hợp lệ
        Mockito.when(paymentService.validateVNPayResponse(ArgumentMatchers.anyMap())).thenReturn(true);

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/payment/vn-pay-callback")
                        .param("vnp_ResponseCode", "01")
                        .param("vnp_TxnRef", "booking_001"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("01"))
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Error"));
    }

    @Test
    void payCallbackHandler_invalidSignature_fail() throws Exception {
        // GIVEN
        Mockito.when(paymentService.validateVNPayResponse(ArgumentMatchers.anyMap())).thenReturn(false);

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/payment/vn-pay-callback")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TxnRef", "booking_001"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.content()
                        .encoding("UTF-8"))
                .andExpect(MockMvcResultMatchers.content()
                        .string("Chữ ký không hợp lệ. Dữ liệu có thể bị giả mạo."));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"}) // Giả lập người dùng đã xác thực
    void topUpWallet_validRequest_success() throws Exception {
        // GIVEN
        paymentRequest.setBankCode(null);
        paymentRequest.setBookingId(null);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(paymentRequest);

        // WHEN
        Mockito.when(paymentService.createTopUpPayment(ArgumentMatchers.any(PaymentRequest.class), ArgumentMatchers.any(HttpServletRequest.class)))
                .thenReturn(vnPayResponse);

        // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/payment/topUp")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())) // Thêm CSRF token giả lập
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("00"))
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Success"))
                .andExpect(MockMvcResultMatchers.jsonPath("paymentUrl").value("https://vnpay.vn/payment?txnRef=booking_001"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"}) // Giả lập người dùng đã xác thực
    void topUpWallet_invalidRequestAmountNegative_fail() throws Exception {
        // GIVEN
        paymentRequest.setAmout(new BigDecimal("-1000")); // Số tiền không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(paymentRequest);

        // WHEN
        Mockito.when(paymentService.createTopUpPayment(ArgumentMatchers.any(PaymentRequest.class), ArgumentMatchers.any(HttpServletRequest.class)))
                .thenThrow(new IllegalArgumentException("Số tiền phải lớn hơn 0"));

        // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/payment/topUp")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())) // Thêm CSRF token giả lập
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("errors.amout").value("Số tiền phải lớn hơn 0"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"}) // Giả lập người dùng đã xác thực
    void topUpWallet_invalidRequestAmountNull_fail() throws Exception {
        // GIVEN
        paymentRequest.setAmout(null); // Số tiền không hợp lệ
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(paymentRequest);

        //WHEN //THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .post("/api/payment/topUp")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())) // Thêm CSRF token giả lập
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("errors.amout").value("Số tiền không được bỏ trống"));
    }

    @Test
    void topUpCallbackHandler_validSignature_success() throws Exception {
        // GIVEN
        Mockito.when(paymentService.validateVNPayResponse(ArgumentMatchers.anyMap())).thenReturn(true);
        Mockito.doNothing().when(paymentService).addWalletMoney(ArgumentMatchers.anyMap());

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/payment/topUpCallBack")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_TxnRef", "booking_001"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("00"))
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Success"));
    }

    @Test
    void topUpCallbackHandler_invalidResponseCode_fail() throws Exception {
        // GIVEN
        vnpParams.put("vnp_ResponseCode", "01"); // Mã phản hồi không hợp lệ
        Mockito.when(paymentService.validateVNPayResponse(ArgumentMatchers.anyMap())).thenReturn(true);

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/payment/topUpCallBack")
                        .param("vnp_ResponseCode", "01")
                        .param("vnp_TxnRef", "booking_001"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("01"))
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("Error"));
    }

    @Test
    void topUpCallbackHandler_invalidSignature_fail() throws Exception {
        // GIVEN
        Mockito.when(paymentService.validateVNPayResponse(ArgumentMatchers.anyMap())).thenReturn(false);

        // WHEN // THEN
        mockMvc.perform(MockMvcRequestBuilders
                        .get("/api/payment/topUpCallBack")
                        .param("vnp_ResponseCode", "01")
                        .param("vnp_TxnRef", "booking_001"))
                        .andExpect(MockMvcResultMatchers.status().isBadRequest())
                        .andExpect(MockMvcResultMatchers.content()
                                .encoding("UTF-8"))
                        .andExpect(MockMvcResultMatchers.content()
                                .string("Chữ ký không hợp lệ. Dữ liệu có thể bị giả mạo."));
    }
}