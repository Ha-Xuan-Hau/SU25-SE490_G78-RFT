package com.rft.rft_be.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequestDTO {

    @NotNull(message = "Danh sách vehicleId không được để trống")
    @Size(min = 1, message = "Cần đặt ít nhất một xe")
    List<@NotBlank(message = "vehicleId không được phép trống") String> vehicleIds;

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

    @Pattern(regexp = "office|delivery", message = "Phương thức nhận xe phải là 'office' hoặc 'delivery'.")
    String pickupMethod;

    String couponId;
    String penaltyType;
    BigDecimal penaltyValue;
    Integer minCancelHour;

    //nếu thuê xe có lái
    BigDecimal driverFee;
}
