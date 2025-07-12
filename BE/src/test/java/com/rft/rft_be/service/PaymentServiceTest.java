package com.rft.rft_be.service;

import com.rft.rft_be.config.VNPAYConfig;
import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.WalletTransaction;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.service.payment.PaymentService;
import com.rft.rft_be.service.wallet.WalletService;
import com.rft.rft_be.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
public class PaymentServiceTest {

    @Autowired
    private PaymentService paymentService;

    @MockBean
    private VNPAYConfig vnPayConfig;

    @MockBean
    private BookingRepository bookingRepository;

    @MockBean
    private WalletService walletService;

    @MockBean
    private HttpServletRequest request;

    private PaymentRequest paymentRequest;
    private VNPayResponse vnPayResponse;
    private Booking booking;
    private Map<String, String> mockVnpConfig;
    private Map<String, String> vnpParamsCreate; // For createVnPayPayment
    private Map<String, String> vnpParamsCallback; // For validateVNPayResponse and addWalletMoney
    private WalletTransactionDTO walletTransaction;
    private final String vnpayHashSecret = "A41OWOUDJKP8C3FUSAM2UD7XQLIFVCMK";
    private final String vnpTmnCode = "EYEGOV1A";

    @BeforeEach
    void initData() {
        mockVnpConfig = new HashMap<>();
        mockVnpConfig.put("vnp_TmnCode", vnpTmnCode);
        mockVnpConfig.put("vnp_Version", "2.1.0");
        mockVnpConfig.put("vnp_Command", "pay");
        mockVnpConfig.put("vnp_CurrCode", "VND");
        mockVnpConfig.put("vnp_Locale", "vn");
        mockVnpConfig.put("vnp_OrderType", "other");
        mockVnpConfig.put("vnp_OrderInfo", "Thanh toan don hang:19597463");
        mockVnpConfig.put("vnp_CreateDate", "20250709191248");
        mockVnpConfig.put("vnp_ExpireDate", "20250709192748");

        // Initialize sample data for createVnPayPayment
        ReflectionTestUtils.setField(paymentService, "vnp_ReturnUrl", "http://localhost:8080/api/payment/vn-pay-callback");
        ReflectionTestUtils.setField(paymentService, "vnp_ReturnWalletUrl", "http://localhost:8080/api/payment/wallet-callback");

        paymentRequest = PaymentRequest.builder()
                .amout(new BigDecimal("1600000")) // 1,600,000 VND
                .bookingId("booking_003")
                .build();

        vnPayResponse = VNPayResponse.builder()
                .code("00")
                .message("success")
                .paymentUrl("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=160000000&vnp_Command=pay&vnp_CreateDate=20250709191248&vnp_CurrCode=VND&vnp_ExpireDate=20250709192748&vnp_IpAddr=0%3A0%3A0%3A0%3A0%3A0%3A0%3A1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang%3A19597463&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fpayment%2Fvn-pay-callback&vnp_TmnCode=EYEGOV1A&vnp_TxnRef=71799119&vnp_Version=2.1.0&vnp_SecureHash=be4abe2f580cac6347ea43574defc0e8d1e6984db8f66f64d9bcc7de4c34b19e8523d9d88f64c2896f31f62510f42570d7363650bfcb65a343cfc8649313870a")
                .build();

        booking = Booking.builder()
                .id("booking_003")
                .status(Booking.Status.UNPAID)
                .totalCost(new BigDecimal("1600000"))
                .build();

        // Initialize vnpParamsCreate with data from the URL sent to VNPay
        vnpParamsCreate = new HashMap<>();
        vnpParamsCreate.put("vnp_Amount", "160000000"); // 1,600,000 VND * 100
        vnpParamsCreate.put("vnp_Command", "pay");
        vnpParamsCreate.put("vnp_CreateDate", "20250709191248");
        vnpParamsCreate.put("vnp_CurrCode", "VND");
        vnpParamsCreate.put("vnp_ExpireDate", "20250709192748");
        vnpParamsCreate.put("vnp_IpAddr", "0:0:0:0:0:0:0:1");
        vnpParamsCreate.put("vnp_Locale", "vn");
        vnpParamsCreate.put("vnp_OrderInfo", "Thanh toan don hang:19597463");
        vnpParamsCreate.put("vnp_OrderType", "other");
        vnpParamsCreate.put("vnp_ReturnUrl", "http://localhost:8080/api/payment/vn-pay-callback");
        vnpParamsCreate.put("vnp_TmnCode", vnpTmnCode);
        vnpParamsCreate.put("vnp_TxnRef", "71799119");
        vnpParamsCreate.put("vnp_Version", "2.1.0");

        // Initialize vnpParamsCallback with data from the VNPay callback URL
        vnpParamsCallback = new HashMap<>();
        vnpParamsCallback.put("vnp_Amount", "160000000"); // 1,600,000 VND * 100
        vnpParamsCallback.put("vnp_BankCode", "NCB");
        vnpParamsCallback.put("vnp_BankTranNo", "VNP15064925");
        vnpParamsCallback.put("vnp_CardType", "ATM");
        vnpParamsCallback.put("vnp_OrderInfo", "Thanh toan don hang:19597463");
        vnpParamsCallback.put("vnp_PayDate", "20250709191438");
        vnpParamsCallback.put("vnp_ResponseCode", "00");
        vnpParamsCallback.put("vnp_TmnCode", vnpTmnCode);
        vnpParamsCallback.put("vnp_TransactionNo", "15064925");
        vnpParamsCallback.put("vnp_TransactionStatus", "00");
        vnpParamsCallback.put("vnp_TxnRef", "71799119");
        vnpParamsCallback.put("vnp_SecureHash", "4a3577df734c99312888adaa2a7f558ffbf4445f4e0f04a84d6564d350d2408ea5ccd1c5c050423b12ff7e367fed692d63cdac6a8a64a6b050a393c489d7fb60");

        walletTransaction = new WalletTransactionDTO();
        walletTransaction.setId("71799119");
        walletTransaction.setAmount(BigDecimal.valueOf(1600000));
        walletTransaction.setUserId("user123");
        walletTransaction.setStatus(WalletTransaction.Status.PENDING.name());
        LocalDateTime localDateTime = LocalDateTime.of(2025, 7, 9, 19, 28, 48);
        walletTransaction.setCreatedAt(localDateTime);

        // Mock authentication
        JwtAuthenticationToken authentication = mock(JwtAuthenticationToken.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.getToken()).thenReturn(mock(org.springframework.security.oauth2.jwt.Jwt.class));
        when(authentication.getToken().getClaim("userId")).thenReturn("user123");
    }

    @Test
    void createVnPayPayment_validRequest_success() {
        // GIVEN
        mockVnpConfig.put("vnp_TxnRef", "71799119");

        when(bookingRepository.findById(anyString())).thenReturn(Optional.of(booking));
        booking.setCodeTransaction("71799119");
        when(bookingRepository.save(any())).thenReturn(booking);
        when(vnPayConfig.getVnp_PayUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        when(vnPayConfig.getVNPayConfig()).thenReturn(mockVnpConfig);
        when(vnPayConfig.getSecretKey()).thenReturn(vnpayHashSecret);
        when(request.getHeader("X-FORWARDED-FOR")).thenReturn("0:0:0:0:0:0:0:1");

        // WHEN
        VNPayResponse response = paymentService.createVnPayPayment(paymentRequest, request);

        // THEN
        Assertions.assertThat(booking.getId()).isEqualTo("booking_003");
        Assertions.assertThat(response.getCode()).isEqualTo("00");
        Assertions.assertThat(response.getMessage()).isEqualTo("success");
        Assertions.assertThat(response.getPaymentUrl())
                .startsWith(vnPayResponse.getPaymentUrl());
    }

    @Test
    void createVnPayPayment_bookingNotFound_fail() {
        // GIVEN
        when(bookingRepository.findById(anyString())).thenReturn(Optional.empty());

        // WHEN
        VNPayResponse response = paymentService.createVnPayPayment(paymentRequest, request);

        // THEN
        Assertions.assertThat(response.getCode()).isEqualTo("error");
        Assertions.assertThat(response.getMessage()).isEqualTo("Đã xảy ra lỗi khi tạo thanh toán VNPay. Không tìm thấy đơn booking");
        Assertions.assertThat(response.getPaymentUrl()).isNull();
    }

    @Test
    void createVnPayPayment_bookingAlreadyPaid_fail() {
        // GIVEN
        booking.setStatus(Booking.Status.PENDING);
        when(bookingRepository.findById(anyString())).thenReturn(Optional.of(booking));

        // WHEN
        VNPayResponse response = paymentService.createVnPayPayment(paymentRequest, request);

        // THEN
        Assertions.assertThat(response.getCode()).isEqualTo("error");
        Assertions.assertThat(response.getMessage()).isEqualTo("Đã xảy ra lỗi khi tạo thanh toán VNPay. Hóa đơn đã thanh toán");
        Assertions.assertThat(response.getPaymentUrl()).isNull();
    }

    @Test
    void createTopUpPayment_validRequest_success() {
        // GIVEN
        vnPayResponse.setPaymentUrl( "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=160000000&vnp_Command=pay&vnp_CreateDate=20250709191248&vnp_CurrCode=VND&vnp_ExpireDate=20250709192748&vnp_IpAddr=0%3A0%3A0%3A0%3A0%3A0%3A0%3A1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang%3A19597463&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fpayment%2Fwallet-callback&vnp_TmnCode=EYEGOV1A&vnp_TxnRef=71799119&vnp_Version=2.1.0&vnp_SecureHash=95e2502521aa7fb2899090f23778a65f4d1542130a3a7861d0d7a102e7dce79440c8bf27c450d6e9b0ffb5a6ad928323ba3966cd96f9200b61e7077e5af634ab");
        when(walletService.createTopUp(any(CreateWithdrawalRequestDTO.class))).thenReturn(walletTransaction);
        when(vnPayConfig.getVnp_PayUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        when(vnPayConfig.getVNPayConfig()).thenReturn(mockVnpConfig);
        when(vnPayConfig.getSecretKey()).thenReturn(vnpayHashSecret);
        when(request.getHeader("X-FORWARDED-FOR")).thenReturn("0:0:0:0:0:0:0:1");

        // WHEN
        VNPayResponse response = paymentService.createTopUpPayment(paymentRequest, request);

        // THEN
        Assertions.assertThat(walletTransaction.getId()).isEqualTo("71799119");
        Assertions.assertThat(response.getCode()).isEqualTo("00");
        Assertions.assertThat(response.getMessage()).isEqualTo("success");
        Assertions.assertThat(response.getPaymentUrl())
                .startsWith(vnPayResponse.getPaymentUrl());
        verify(walletService).createTopUp(any(CreateWithdrawalRequestDTO.class));
    }

    @Test
    void createTopUpPayment_negativeAmount_fail() {
        // GIVEN
        paymentRequest.setAmout(new BigDecimal("-1000"));

        // WHEN
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            paymentService.createTopUpPayment(paymentRequest, request);
        });

        // THEN
        Assertions.assertThat(exception.getMessage()).isEqualTo("Số tiền không được nhỏ hơn 0");
    }

    @Test
    void createTopUpPayment_zeroAmount_fail() {
        // GIVEN
        paymentRequest.setAmout(BigDecimal.ZERO);

        // WHEN
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            paymentService.createTopUpPayment(paymentRequest, request);
        });

        // THEN
        Assertions.assertThat(exception.getMessage()).isEqualTo("Số tiền không được nhỏ hơn 0");
    }

    @Test
    void addWalletMoney_validRealParams_success() {
        // GIVEN
        doAnswer(invocation -> {
            String txnRef = invocation.getArgument(0);
            BigDecimal amount = invocation.getArgument(1);
            return null;
        }).when(walletService).updateWalletBalance(anyString(), any(BigDecimal.class));

        // WHEN
        paymentService.addWalletMoney(vnpParamsCallback);

        // THEN
        verify(walletService).updateWalletBalance(
                eq("71799119"),
                eq(new BigDecimal("1600000"))
        );
    }

    @Test
    void addWalletMoney_missingTxnRef_fail() {
        // GIVEN
        Map<String, String> invalidParams = new HashMap<>(vnpParamsCallback);
        invalidParams.remove("vnp_TxnRef");

        // WHEN
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            paymentService.addWalletMoney(invalidParams);
        });

        // THEN
        Assertions.assertThat(exception.getMessage()).isEqualTo("Thiếu thông tin mã giao dịch hoặc số tiền");
    }

    @Test
    void addWalletMoney_missingAmount_fail() {
        // GIVEN
        Map<String, String> invalidParams = new HashMap<>(vnpParamsCallback);
        invalidParams.remove("vnp_Amount");

        // WHEN
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            paymentService.addWalletMoney(invalidParams);
        });

        // THEN
        Assertions.assertThat(exception.getMessage()).isEqualTo("Thiếu thông tin mã giao dịch hoặc số tiền");
    }

    @Test
    void validateVNPayResponse_validRealSignature_success() {
        // GIVEN
        when(vnPayConfig.getSecretKey()).thenReturn(vnpayHashSecret);

        // WHEN
        boolean isValid = paymentService.validateVNPayResponse(vnpParamsCallback);

        // THEN
        Assertions.assertThat(isValid).isTrue();
    }

    @Test
    void validateVNPayResponse_invalidRealSignature_fail() {
        // GIVEN
        when(vnPayConfig.getSecretKey()).thenReturn("wrongSecretKey");

        // WHEN
        boolean isValid = paymentService.validateVNPayResponse(vnpParamsCallback);

        // THEN
        Assertions.assertThat(isValid).isFalse();
    }

    @Test
    void validateVNPayResponse_missingRealSecureHash_fail() {
        // GIVEN
        Map<String, String> invalidParams = new HashMap<>(vnpParamsCallback);
        invalidParams.remove("vnp_SecureHash");

        // WHEN
        boolean isValid = paymentService.validateVNPayResponse(invalidParams);

        // THEN
        Assertions.assertThat(isValid).isFalse();
    }
    @Test
    void validateVNPayResponse_invalidDetailResponse_fail(){
        // GIVEN
        Map<String, String> invalidParams = new HashMap<>(vnpParamsCallback);
        // xử thông tin giao dịch 1600000 -> 1700000
        invalidParams.put("vnp_Amount", "170000000");

        // WHEN
        boolean isValid = paymentService.validateVNPayResponse(invalidParams);

        //THEN
        Assertions.assertThat(isValid).isFalse();
    }

}