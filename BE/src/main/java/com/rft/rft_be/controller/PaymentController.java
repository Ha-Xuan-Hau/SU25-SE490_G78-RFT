package com.rft.rft_be.controller;


import com.rft.rft_be.dto.payment.PaymentRequest;
import com.rft.rft_be.dto.payment.VNPayResponse;
import com.rft.rft_be.service.payment.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
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
}
