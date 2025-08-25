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
        Double avgHours = bookingRepo.avgRentalHoursCompletedByEndBetween(r.start(), r.end());
        return AvgDurationResponse.fromHours(avgHours);
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

        // 1. Lấy tất cả thống kê vehicle trong 1 lần gọi
        List<Object[]> vehicleStatusCounts = vehicleRepo.countByStatusGroup();
        List<Object[]> vehicleTypeStatusCounts = vehicleRepo.countByVehicleTypeAndStatusGroup();
        List<Object[]> vehicleTypeCounts = vehicleRepo.countByVehicleTypeGroup();

        // 2. Lấy thống kê user trong 1 lần gọi
        List<Object[]> userRoleCounts = userRepo.countByRoleGroup();

        // 3. Lấy thông tin user theo thời gian (3 lần gọi)
        long newUsersThisMonth = userRepo.countByCreatedAtBetween(current.start(), current.end());
        long newUsersPrevMonth = userRepo.countByCreatedAtBetween(previous.start(), previous.end());
        long newUsersLast30Days = userRepo.countByCreatedAtBetween(
            java.time.LocalDateTime.now().minusDays(30), 
            java.time.LocalDateTime.now()
        );
        long newProvidersThisMonth = userRepo.countByRoleAndCreatedAtBetween(User.Role.PROVIDER, current.start(), current.end());
        long newProvidersPrevMonth = userRepo.countByRoleAndCreatedAtBetween(User.Role.PROVIDER, previous.start(), previous.end());

        // Xử lý dữ liệu vehicle status
        long totalVehicles = 0, activeVehicles = 0, pendingVehicles = 0, suspendedVehicles = 0, deletedVehicles = 0;
        for (Object[] result : vehicleStatusCounts) {
            Vehicle.Status status = (Vehicle.Status) result[0];
            long count = (Long) result[1];
            totalVehicles += count;
            
            switch (status) {
                case AVAILABLE -> activeVehicles = count;
                case PENDING -> pendingVehicles = count;
                case SUSPENDED -> suspendedVehicles = count;
                case UNAVAILABLE -> deletedVehicles = count;
            }
        }

        // Xử lý dữ liệu user role
        long totalUsers = 0, totalProviders = 0;
        for (Object[] result : userRoleCounts) {
            User.Role role = (User.Role) result[0];
            long count = (Long) result[1];
            totalUsers += count;
            
            if (role == User.Role.PROVIDER) {
                totalProviders = count;
            }
        }

        // Xử lý dữ liệu vehicle type
        var typeItems = new java.util.ArrayList<AdminDashboardSummaryDTO.VehicleTypeItem>();
        var vehicleTypeMap = new java.util.HashMap<Vehicle.VehicleType, java.util.Map<Vehicle.Status, Long>>();
        
        // Tạo map cho vehicle type và status
        for (Object[] result : vehicleTypeStatusCounts) {
            Vehicle.VehicleType type = (Vehicle.VehicleType) result[0];
            Vehicle.Status status = (Vehicle.Status) result[1];
            long count = (Long) result[2];
            
            vehicleTypeMap.computeIfAbsent(type, k -> new java.util.HashMap<>()).put(status, count);
        }

        // Tạo map cho vehicle type và provider count
        var vehicleTypeProviderMap = new java.util.HashMap<Vehicle.VehicleType, Long>();
        for (Object[] result : vehicleTypeCounts) {
            Vehicle.VehicleType type = (Vehicle.VehicleType) result[0];
            long totalCount = (Long) result[1];
            long providerCount = (Long) result[2];
            vehicleTypeProviderMap.put(type, providerCount);
        }

        // Tạo vehicle type items
        for (Vehicle.VehicleType type : Vehicle.VehicleType.values()) {
            var statusMap = vehicleTypeMap.getOrDefault(type, new java.util.HashMap<>());
            long active = statusMap.getOrDefault(Vehicle.Status.AVAILABLE, 0L);
            long pending = statusMap.getOrDefault(Vehicle.Status.PENDING, 0L);
            long suspended = statusMap.getOrDefault(Vehicle.Status.SUSPENDED, 0L);
            long total = statusMap.values().stream().mapToLong(Long::longValue).sum();
            long providers = vehicleTypeProviderMap.getOrDefault(type, 0L);
            
            typeItems.add(AdminDashboardSummaryDTO.VehicleTypeItem.builder()
                    .type(type.name())
                    .active(active)
                    .total(total)
                    .pending(pending)
                    .suspended(suspended)
                    .providers(providers)
                    .build());
        }

        // Tính toán phần trăm thay đổi
        double pendingChange = calcChangePercent(pendingVehicles, pendingVehicles); // Không có lịch sử, dùng hiện tại
        double usersChange = calcChangePercent(newUsersPrevMonth, newUsersThisMonth);
        double providersChange = calcChangePercent(newProvidersPrevMonth, newProvidersThisMonth);

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
                        .active(activeVehicles)
                        .pending(pendingVehicles)
                        .suspended(suspendedVehicles)
                        .deleted(deletedVehicles)
                        .total(totalVehicles)
                        .activePercent(activeVehicles / totalVehiclesD * 100.0)
                        .pendingPercent(pendingVehicles / totalVehiclesD * 100.0)
                        .suspendedPercent(suspendedVehicles / totalVehiclesD * 100.0)
                        .deletedPercent(deletedVehicles / totalVehiclesD * 100.0)
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