package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequestDTO {

    String vehicleId;

    // Nhận từ FE dưới dạng LocalDateTime, convert sang Instant
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    LocalDateTime startDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    LocalDateTime endDate;

    String fullname;
    String phone;
    String address;
    String pickupMethod; // "office" hoặc "delivery"
    String couponId;

    // Penalty fields
    String penaltyType;
    BigDecimal penaltyValue;
    Integer minCancelHour;

    // Helper methods để convert sang Instant với +7 giờ (VN time)
    public Instant getTimeBookingStart() {
        if (startDate == null) {
            return null;
        }
        // Convert LocalDateTime VN sang Instant UTC bằng cách cộng 7 giờ
        return startDate.plusHours(7).atZone(java.time.ZoneId.of("UTC")).toInstant();
    }

    public Instant getTimeBookingEnd() {
        if (endDate == null) {
            return null;
        }
        // Convert LocalDateTime VN sang Instant UTC bằng cách cộng 7 giờ
        return endDate.plusHours(7).atZone(java.time.ZoneId.of("UTC")).toInstant();
    }

    // Legacy getters cho compatibility
    public String getPhoneNumber() {
        return phone;
    }
}
