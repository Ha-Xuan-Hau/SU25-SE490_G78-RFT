package com.rft.rft_be.config;

import com.rft.rft_be.util.VNPayUtil;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

@Configuration
public class VNPAYConfig {
    @Getter
    @Value("${vnpay.payUrl}")
    private String vnp_PayUrl;
    @Value("${vnpay.returnUrl}")
    private String vnp_ReturnUrl;
    @Value("${vnpay.tmnCode}")
    private String vnp_TmnCode;

    @Getter
    @Value("${vnpay.hashSecret}")
    private String secretKey;

    @Value("${vnpay.version}")
    private String vnp_Version;
    @Value("${vnpay.command}")
    private String vnp_Command;
    @Value("${vnpay.orderType}")
    private String orderType;

    public Map<String, String> getVNPayConfig() {
        Map<String, String> vnpParamsMap = new HashMap<>();
        vnpParamsMap.put("vnp_Version", this.vnp_Version);
        vnpParamsMap.put("vnp_Command", this.vnp_Command);
        vnpParamsMap.put("vnp_TmnCode", this.vnp_TmnCode);
        vnpParamsMap.put("vnp_CurrCode", "VND");
        vnpParamsMap.put("vnp_TxnRef",  VNPayUtil.getRandomNumber(8));
        vnpParamsMap.put("vnp_OrderInfo", "Thanh toan don hang:" +  VNPayUtil.getRandomNumber(8));
        vnpParamsMap.put("vnp_OrderType", this.orderType);
        vnpParamsMap.put("vnp_Locale", "vn");
        vnpParamsMap.put("vnp_ReturnUrl", this.vnp_ReturnUrl);
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnpCreateDate = formatter.format(calendar.getTime());
        vnpParamsMap.put("vnp_CreateDate", vnpCreateDate);
        calendar.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(calendar.getTime());
        vnpParamsMap.put("vnp_ExpireDate", vnp_ExpireDate);
        return vnpParamsMap;
    }

    public boolean validateVNPayResponse(Map<String, String> vnpParams) {
        // 1. Lấy vnp_SecureHash từ dữ liệu gửi về
        String receivedHash = vnpParams.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isEmpty()) {
            return false;
        }
        // 2. Tạo bản sao Map, và loại bỏ các key không tham gia tính toán
        Map<String, String> filteredParams = new HashMap<>(vnpParams);
        filteredParams.remove("vnp_SecureHash");
        // 3. Tạo chuỗi dữ liệu để tạo hash (giống cách khi gửi)
        String hashData = VNPayUtil.getPaymentURL(filteredParams, false);
        // 4. Tính lại chữ ký với secretKey
        String calculatedHash = VNPayUtil.hmacSHA512(secretKey, hashData);
        // 5. So sánh chữ ký trả về với chữ ký vừa tính lại (không phân biệt hoa/thường)
        return receivedHash.equalsIgnoreCase(calculatedHash);
    }
}
