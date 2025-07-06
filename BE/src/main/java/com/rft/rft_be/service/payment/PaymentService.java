package com.rft.rft_be.service.payment;

import com.rft.rft_be.config.VNPAYConfig;
import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.dto.wallet.CreateWithdrawalRequestDTO;
import com.rft.rft_be.dto.wallet.UpdateWalletRequestDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.service.Contract.ContractService;
import com.rft.rft_be.service.booking.BookingService;
import com.rft.rft_be.service.wallet.WalletService;
import com.rft.rft_be.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    @Value("${vnpay.returnUrl}")
    String vnp_ReturnUrl;
    @Value("${vnpay.returnWalletUrl}")
    String vnp_ReturnWalletUrl;

    final VNPAYConfig vnPayConfig;
    final ContractService contractService;
    final BookingService bookingService;
    final WalletService walletService;
    public VNPayResponse createVnPayPayment(PaymentRequest dto, HttpServletRequest request) {
        long amount = dto.getAmout().multiply(BigDecimal.valueOf(100)) // nhân 100 theo yêu cầu
                .setScale(0, RoundingMode.HALF_UP) // làm tròn đúng chuẩn tài chính
                .longValue();
        String bankCode = dto.getBankCode();
        Map<String, String> vnpParamsMap = vnPayConfig.getVNPayConfig();
        vnpParamsMap.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnpParamsMap.put("vnp_Amount", String.valueOf(amount));
        if (bankCode != null && !bankCode.isEmpty()) {
            vnpParamsMap.put("vnp_BankCode", bankCode);
        }
        vnpParamsMap.put("vnp_IpAddr", VNPayUtil.getIpAddress(request));
        //build query url
        String queryUrl = VNPayUtil.getPaymentURL(vnpParamsMap, true);
        String hashData = VNPayUtil.getPaymentURL(vnpParamsMap, false);
        String vnpSecureHash = VNPayUtil.hmacSHA512(vnPayConfig.getSecretKey(), hashData);
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
        return VNPayResponse.builder()
                .code("ok")
                .message("success")
                .paymentUrl(paymentUrl).build();
    }

    public VNPayResponse createTopUpPayment(PaymentRequest dto, HttpServletRequest request) {
        JwtAuthenticationToken authentication = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getToken().getClaim("userId");
        if(dto.getAmout().compareTo(BigDecimal.ZERO) < 0){
            throw new IllegalStateException("Số tiền không đuược nhỏ hơn 0");
        }

        WalletTransactionDTO walletTransaction =  walletService.createTopUp(new CreateWithdrawalRequestDTO(userId, dto.getAmout()));
        long amount = dto.getAmout().multiply(BigDecimal.valueOf(100)) // nhân 100 theo yêu cầu
                .setScale(0, RoundingMode.HALF_UP) // làm tròn đúng chuẩn tài chính
                .longValue();
        String bankCode = dto.getBankCode();
        Map<String, String> vnpParamsMap = vnPayConfig.getVNPayConfig();
        vnpParamsMap.put("vnp_ReturnUrl", vnp_ReturnWalletUrl);
        vnpParamsMap.put("vnp_Amount", String.valueOf(amount));
        vnpParamsMap.put("vnp_TxnRef",walletTransaction.getId());
        if (bankCode != null && !bankCode.isEmpty()) {
            vnpParamsMap.put("vnp_BankCode", bankCode);
        }
        vnpParamsMap.put("vnp_IpAddr", VNPayUtil.getIpAddress(request));
        //build query url
        String queryUrl = VNPayUtil.getPaymentURL(vnpParamsMap, true);
        String hashData = VNPayUtil.getPaymentURL(vnpParamsMap, false);
        String vnpSecureHash = VNPayUtil.hmacSHA512(vnPayConfig.getSecretKey(), hashData);
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
        return VNPayResponse.builder()
                .code("ok")
                .message("success")
                .paymentUrl(paymentUrl).build();
    }

    public void addWalletMoney(Map<String, String> vnpParams) {
        String txnRef = vnpParams.get("vnp_TxnRef");
        String amountStr = vnpParams.get("vnp_Amount");

        if (txnRef == null || amountStr == null) {
            throw new IllegalArgumentException("Thiếu thông tin mã giao dịch hoặc số tiền");
        }

        // Chuyển đổi vnp_Amount từ đơn vị "đồng × 100" → BigDecimal
        BigDecimal amount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));

        // Gọi tới service để cập nhật giao dịch và cộng tiền vào ví
        walletService.updateWalletBalance(txnRef, amount);
    }


}
