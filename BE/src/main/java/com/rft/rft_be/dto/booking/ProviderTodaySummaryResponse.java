package com.rft.rft_be.dto.booking;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ProviderTodaySummaryResponse {
    private LocalDate date;

    private int totalOrders;       // tổng đơn hôm nay
    private int toDeliverCount;    // số đơn phải giao hôm nay (dựa timeBookingStart)
    private int toReceiveCount;    // số đơn nhận lại hôm nay (dựa timeBookingEnd)
    private int cancelledCount;    // số đơn hủy hôm nay
    private int resolvedCount;     // = total - 3 cái trên
}
