package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.AvgDurationResponse;
import com.rft.rft_be.dto.admin.CountResponse;
import com.rft.rft_be.dto.admin.MoneyResponse;
import com.rft.rft_be.dto.admin.MonthlyBookingSummaryResponse;
import com.rft.rft_be.entity.Booking.Status;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.FinalContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final BookingRepository bookingRepo;
    private final FinalContractRepository finalContractRepo;

    public AdminDashboardServiceImpl(BookingRepository bookingRepo, FinalContractRepository finalContractRepo) {
        this.bookingRepo = bookingRepo;
        this.finalContractRepo = finalContractRepo;
    }

    private record Range(LocalDateTime start, LocalDateTime end) {}

    // month == null -> mặc định tháng hiện tại theo Asia/Ho_Chi_Minh
    private Range monthRange(YearMonth month) {
        YearMonth ym = Objects.requireNonNullElse(month, YearMonth.now());
        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();
        // giữ LocalDateTime vì entity dùng LocalDateTime
        return new Range(start, end);
    }

    @Override
    public CountResponse getTotalSettlements(YearMonth month) {
        var r = monthRange(month);
        long total = finalContractRepo.countByTimeFinishBetween(r.start(), r.end());
        return new CountResponse(total);
    }

    @Override
    public MoneyResponse getTotalSettlementAmount(YearMonth month) {
        var r = monthRange(month);
        BigDecimal amount = finalContractRepo
                .sumCostSettlementByTimeFinishAndContractStatus(r.start(), r.end(), Contract.Status.FINISHED);
        return new MoneyResponse(amount == null ? BigDecimal.ZERO : amount);
    }

    @Override
    public AvgDurationResponse getAverageRentalDurationDays(YearMonth month) {
        var r = monthRange(month);
        // Tính trên booking COMPLETED, dùng time_booking_end rơi trong tháng
        Double avgDays = bookingRepo.avgRentalDaysCompletedByEndBetween(r.start(), r.end());
        return new AvgDurationResponse(avgDays == null ? 0.0 : avgDays);
    }

    @Override
    public MonthlyBookingSummaryResponse getMonthlyBookingSummary(YearMonth month) {
        var r = monthRange(month);

        // “Đang chạy” = các trạng thái đang hoạt động
        List<Status> runningStatuses = List.of(Status.CONFIRMED, Status.DELIVERED, Status.RECEIVED_BY_CUSTOMER);

        long running   = bookingRepo.countByStatusInAndCreatedAtBetween(runningStatuses, r.start(), r.end());
        long completed = bookingRepo.countByStatusAndCreatedAtBetween(Status.COMPLETED, r.start(), r.end());
        long canceled  = bookingRepo.countByStatusAndCreatedAtBetween(Status.CANCELLED, r.start(), r.end());
        long total     = bookingRepo.countByCreatedAtBetween(r.start(), r.end());

        return new MonthlyBookingSummaryResponse(running, completed, canceled, total);
    }

    @Override
    public CountResponse getMonthlyTotalBookings(YearMonth month) {
        var r = monthRange(month);
        long total = bookingRepo.countByCreatedAtBetween(r.start(), r.end());
        return new CountResponse(total);
    }
}