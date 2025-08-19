package com.rft.rft_be.controller;

import java.net.URI;
import java.util.Map;

import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.service.Contract.ContractService;
import com.rft.rft_be.service.payment.PaymentService;
import com.rft.rft_be.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final ContractService contractService;

    @NonFinal
    @Value("${next.publicReactURL}")
    protected String FE_URL;


    //lấy thông tin là id của bookingId chuyền vào từ RequestBody để tạo mã thanh toán cho booking bằng vnpay
    @PostMapping("/vn-pay")
    public ResponseEntity<VNPayResponse> pay(@Valid @RequestBody PaymentRequest dto, HttpServletRequest request) {
        try {
            VNPayResponse response = paymentService.createVnPayPayment(dto, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new VNPayResponse("", e.getMessage(), ""));
        }
    }

    //xác nhận thông tin từ vnpay để kiểm tra và hoàn thành thanh toán đơn
    @GetMapping("/vn-pay-callback")
    public ResponseEntity<?> payCallbackHandler(HttpServletRequest request) {
        Map<String, String> vnpParams = VNPayUtil.extractVNPayParams(request);
        try {
            boolean isValid = paymentService.validateVNPayResponse(vnpParams);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FE_URL+"/payment/callback?error=INVALID_SIGNATURE"))
                        .build();
            }

            String status = request.getParameter("vnp_ResponseCode");
            if ("00".equals(status)) {
                contractService.createContractByPayment(vnpParams.get("vnp_TxnRef"));
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FE_URL+"/payment/callback?" + request.getQueryString()))
                        .build();
            } else {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FE_URL+"/payment/callback?" + request.getQueryString()))
                        .build();
            }
        } catch (RuntimeException e) {
            // Gửi lỗi về FE qua redirect
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(FE_URL+"/payment/callback?error=" + e.getMessage().replace(" ", "%20")))
                    .build();
        }
    }

    //tạo giao dịch nạp tiền bằng ví từ vnpay dto nhận giá trị là amount
    @PostMapping("/topUp")
    public ResponseEntity<?> topUpWallet(@Valid @RequestBody PaymentRequest dto, HttpServletRequest request) {
        try {
            VNPayResponse response = paymentService.createTopUpPayment(dto, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new VNPayResponse("", e.getMessage(), ""));
        }
    }

    //Kiểm tra xác thực thông tin phản hồi từ vnpay để nạp tiền cho ví
    @GetMapping("/topUpCallBack")
    public ResponseEntity<?> topUpCallbackHandler(HttpServletRequest request) {
        Map<String, String> vnpParams = VNPayUtil.extractVNPayParams(request);

        try {
            // Bước 1: Xác minh chữ ký
            boolean isValid = paymentService.validateVNPayResponse(vnpParams);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FE_URL+"/payment/wallet-callback?error=INVALID_SIGNATURE"))
                        .build();
            }

            // Bước 2: Kiểm tra mã phản hồi thanh toán
            String status = request.getParameter("vnp_ResponseCode");
            if ("00".equals(status)) {
                paymentService.addWalletMoney(vnpParams);

                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FE_URL+"/payment/wallet-callback?" + request.getQueryString()))
                        .build();
            } else {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(FE_URL+"/payment/wallet-callback?" + request.getQueryString()))
                        .build();
            }

        } catch (RuntimeException ex) {
            // Encode lỗi để truyền qua URL (tránh lỗi khi có khoảng trắng, ký tự đặc biệt)
            String errorMessage = ex.getMessage().replace(" ", "%20");

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(FE_URL+"/payment/wallet-callback?error=" + errorMessage))
                    .build();
        }
    }
}
