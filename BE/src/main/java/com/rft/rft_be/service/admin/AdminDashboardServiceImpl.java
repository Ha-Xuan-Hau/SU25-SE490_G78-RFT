package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.AvgDurationResponse;
import com.rft.rft_be.dto.admin.CountResponse;
import com.rft.rft_be.dto.admin.MoneyResponse;
import com.rft.rft_be.dto.admin.MonthlyBookingSummaryResponse;
import com.rft.rft_be.dto.admin.AdminDashboardSummaryDTO;
import com.rft.rft_be.entity.Booking.Status;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.FinalContractRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.entity.User;
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
    private final VehicleRepository vehicleRepo;
    private final UserRepository userRepo;

    public AdminDashboardServiceImpl(BookingRepository bookingRepo,
                                     FinalContractRepository finalContractRepo,
                                     VehicleRepository vehicleRepo,
                                     UserRepository userRepo) {
        this.bookingRepo = bookingRepo;
        this.finalContractRepo = finalContractRepo;
        this.vehicleRepo = vehicleRepo;
        this.userRepo = userRepo;
    }

    private record Range(LocalDateTime start, LocalDateTime end) {}

    // month == null -> mặc định tháng hiện tại theo Asia/Ho_Chi_Minh
    private Range monthRange(YearMonth month) {
        YearMonth ym = Objects.requireNonNullElse(month, YearMonth.now());
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

    @Override
    public AdminDashboardSummaryDTO getVehicle_User(YearMonth month) {
        var current = monthRange(month);
        var previous = monthRange(month == null ? YearMonth.now().minusMonths(1) : month.minusMonths(1));

        long totalVehicles = vehicleRepo.count();
        long activeVehicles = vehicleRepo.findByStatus(Vehicle.Status.AVAILABLE).size();
        long pendingVehicles = vehicleRepo.findByStatus(Vehicle.Status.PENDING).size();

        long pendingPrev = vehicleRepo.findByStatus(Vehicle.Status.PENDING).size(); // không có lịch sử trạng thái, tạm thời dùng số hiện tại
        double pendingChange = calcChangePercent(pendingPrev, pendingVehicles);

        // Users
        long totalUsers = userRepo.count();
        long totalProviders = userRepo.countByRole(User.Role.PROVIDER);
        long newUsersThisMonth = userRepo.countByCreatedAtBetween(current.start(), current.end());
        long newUsersPrevMonth = userRepo.countByCreatedAtBetween(previous.start(), previous.end());
        double usersChange = calcChangePercent(newUsersPrevMonth, newUsersThisMonth);

        long newProvidersThisMonth = userRepo.countByRoleAndCreatedAtBetween(User.Role.PROVIDER, current.start(), current.end());
        long newProvidersPrevMonth = userRepo.countByRoleAndCreatedAtBetween(User.Role.PROVIDER, previous.start(), previous.end());
        double providersChange = calcChangePercent(newProvidersPrevMonth, newProvidersThisMonth);

        long newUsersLast30Days = userRepo.countByCreatedAtBetween(java.time.LocalDateTime.now().minusDays(30), java.time.LocalDateTime.now());

        // Vehicle status summary
        long vsActive = vehicleRepo.findByStatus(Vehicle.Status.AVAILABLE).size();
        long vsPending = vehicleRepo.findByStatus(Vehicle.Status.PENDING).size();
        long vsSuspended = vehicleRepo.findByStatus(Vehicle.Status.SUSPENDED).size();
        long vsDeleted = vehicleRepo.findByStatus(Vehicle.Status.UNAVAILABLE).size();

        // Vehicle types
        var typeItems = new java.util.ArrayList<AdminDashboardSummaryDTO.VehicleTypeItem>();
        typeItems.add(AdminDashboardSummaryDTO.VehicleTypeItem.builder()
                .type("CAR")
                .active(vehicleRepo.countByVehicleTypeAndStatus(Vehicle.VehicleType.CAR, Vehicle.Status.AVAILABLE))
                .total(vehicleRepo.findByVehicleType(Vehicle.VehicleType.CAR).size())
                .providers(vehicleRepo.countDistinctUserByVehicleType(Vehicle.VehicleType.CAR))
                .build());
        typeItems.add(AdminDashboardSummaryDTO.VehicleTypeItem.builder()
                .type("MOTORBIKE")
                .active(vehicleRepo.countByVehicleTypeAndStatus(Vehicle.VehicleType.MOTORBIKE, Vehicle.Status.AVAILABLE))
                .total(vehicleRepo.findByVehicleType(Vehicle.VehicleType.MOTORBIKE).size())
                .providers(vehicleRepo.countDistinctUserByVehicleType(Vehicle.VehicleType.MOTORBIKE))
                .build());
        typeItems.add(AdminDashboardSummaryDTO.VehicleTypeItem.builder()
                .type("BICYCLE")
                .active(vehicleRepo.countByVehicleTypeAndStatus(Vehicle.VehicleType.BICYCLE, Vehicle.Status.AVAILABLE))
                .total(vehicleRepo.findByVehicleType(Vehicle.VehicleType.BICYCLE).size())
                .providers(vehicleRepo.countDistinctUserByVehicleType(Vehicle.VehicleType.BICYCLE))
                .build());

        double totalVehiclesD = totalVehicles == 0 ? 1.0 : (double) totalVehicles;

        return AdminDashboardSummaryDTO.builder()
                .overview(AdminDashboardSummaryDTO.Overview.builder()
                        .activeVehicles(activeVehicles)
                        .totalVehicles(totalVehicles)
                        .pendingVehicles(pendingVehicles)
                        .pendingChangePercent(pendingChange)
                        .build())
                .users(AdminDashboardSummaryDTO.Users.builder()
                        .totalUsers(totalUsers)
                        .newUsersLast30Days(newUsersLast30Days)
                        .usersChangePercent(usersChange)
                        .totalProviders(totalProviders)
                        .providersChangePercent(providersChange)
                        .build())
                .vehicles(AdminDashboardSummaryDTO.Vehicles.builder()
                        .active(vsActive)
                        .pending(vsPending)
                        .suspended(vsSuspended)
                        .deleted(vsDeleted)
                        .total(totalVehicles)
                        .activePercent(vsActive / totalVehiclesD * 100.0)
                        .pendingPercent(vsPending / totalVehiclesD * 100.0)
                        .suspendedPercent(vsSuspended / totalVehiclesD * 100.0)
                        .deletedPercent(vsDeleted / totalVehiclesD * 100.0)
                        .build())
                .vehicleTypes(typeItems)
                .build();
    }

    private double calcChangePercent(long previous, long current) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((double) (current - previous) / (double) previous) * 100.0;
    }
}