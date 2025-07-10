package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequestDTO {

    @NotBlank(message = "vehicleId không được phép trống")
    String vehicleId;

    @NotNull(message = "Thời gian bắt đầu không được phép trống.")
    @Future(message = "Thời gian bắt đầu phải ở tương lai.")
    LocalDateTime timeBookingStart;

    @NotNull(message = "Thời gian kết thúc không được phép trống.")
    @Future(message = "Thời gian kết thúc phải ở tương lai.")
    LocalDateTime timeBookingEnd;

    String fullname;

    @NotBlank(message = "Số điện thoại không được phép trống.")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không đúng định dạng")
    String phoneNumber;

    String address;


    @Pattern(regexp = "office|delivery", message = "Phương thức nhận xe phải là 'nhận tại văn phòng' hoặc 'giao xe tận nơi'.")
    String pickupMethod; // "office" hoặc "delivery"
    String couponId;
    String penaltyType;
    BigDecimal penaltyValue;
    Integer minCancelHour;
}
