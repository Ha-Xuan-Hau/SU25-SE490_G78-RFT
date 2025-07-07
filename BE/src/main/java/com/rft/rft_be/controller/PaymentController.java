package com.rft.rft_be.controller;


import com.rft.rft_be.config.VNPAYConfig;
import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.service.payment.PaymentService;
import com.rft.rft_be.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final VNPAYConfig vnPayConfig;

    @PostMapping("/vn-pay")
    public ResponseEntity<VNPayResponse> pay(@RequestBody PaymentRequest dto, HttpServletRequest request) {
        try{
            VNPayResponse response = paymentService.createVnPayPayment(dto, request);
            return ResponseEntity.ok(response);
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new VNPayResponse("", e.getMessage(), ""));
        }

    }

    @GetMapping("/vn-pay-callback")
    public ResponseEntity<VNPayResponse> payCallbackHandler(HttpServletRequest request) {
        String status = request.getParameter("vnp_ResponseCode");
        if (status.equals("00")) {
            return ResponseEntity.ok(new VNPayResponse("00", "Success", ""));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new VNPayResponse(status, "Error", ""));
        }
    }

    @PostMapping("/topUp")
    public ResponseEntity<?> topUpWallet(@RequestBody PaymentRequest dto, HttpServletRequest request){
        try{
            VNPayResponse response = paymentService.createTopUpPayment(dto, request);
            return ResponseEntity.ok(response);
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new VNPayResponse("", e.getMessage(), ""));
        }
    }

    @GetMapping("/topUpCallBack")
    public ResponseEntity<?> topUpCallbackHandler(HttpServletRequest request) {
        // Bước 1: Lấy vnpParams từ request
        Map<String, String> vnpParams = VNPayUtil.extractVNPayParams(request);
        // Bước 2: Xác minh chữ ký
        boolean isValid = vnPayConfig.validateVNPayResponse(vnpParams);
        if (!isValid) {
            return ResponseEntity.badRequest().body(" Chữ ký không hợp lệ. Dữ liệu có thể bị giả mạo.");
        }
        String status = request.getParameter("vnp_ResponseCode");
        if (status.equals("00")) {
            paymentService.addWalletMoney(vnpParams);
            return ResponseEntity.ok(new VNPayResponse("00", "Success", ""));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new VNPayResponse(status, "Error", ""));
        }
    }
}
