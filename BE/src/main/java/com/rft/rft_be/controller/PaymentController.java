package com.rft.rft_be.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rft.rft_be.config.VNPAYConfig;
import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.service.Contract.ContractService;
import com.rft.rft_be.service.payment.PaymentService;
import com.rft.rft_be.util.VNPayUtil;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final ContractService contractService;
    private final VNPAYConfig vnPayConfig;

    //lấy thông tin là id của bookingId chuyền vào từ RequestBody để tạo mã thanh toán cho booking bằng vnpay
    @PostMapping("/vn-pay")
    public ResponseEntity<VNPayResponse> pay(@RequestBody PaymentRequest dto, HttpServletRequest request) {
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
        // Bước 1: Lấy vnpParams từ request
        Map<String, String> vnpParams = VNPayUtil.extractVNPayParams(request);
        // Bước 2: Xác minh chữ ký
        boolean isValid = vnPayConfig.validateVNPayResponse(vnpParams);
        if (!isValid) {
            return ResponseEntity.badRequest().body(" Chữ ký không hợp lệ. Dữ liệu có thể bị giả mạo.");
        }
        String status = request.getParameter("vnp_ResponseCode");
        if (status.equals("00")) {
            contractService.createContractByPayment(vnpParams.get("vnp_TxnRef"));
//            return ResponseEntity.ok(new VNPayResponse("00", "Success", ""));

            //redirect về trang callback của client
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("http://localhost:3000/payment/callback?" + request.getQueryString()))
                    .build();
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new VNPayResponse(status, "Error", ""));
        }
    }

    //tạo giao dịch nạp tiền bằng ví từ vnpay dto nhận giá trị là bookingid, bankCode và amout
    @PostMapping("/topUp")
    public ResponseEntity<?> topUpWallet(@RequestBody PaymentRequest dto, HttpServletRequest request) {
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
