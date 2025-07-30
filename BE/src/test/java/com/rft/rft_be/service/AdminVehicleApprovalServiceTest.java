package com.rft.rft_be.service;

import com.rft.rft_be.dto.admin.AdminUpdateVehicleStatusDTO;
import com.rft.rft_be.dto.vehicle.VehicleGetDTO;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.NotificationMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.Notification.NotificationService;
import com.rft.rft_be.service.admin.AdminVehicleApprovalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AdminVehicleApprovalServiceTest {

    @Mock
    VehicleRepository vehicleRepository;
    @Mock
    VehicleMapper vehicleMapper;
    @Mock
    NotificationService notificationService;
    @Mock
    NotificationMapper notificationMapper;

    @InjectMocks
    AdminVehicleApprovalServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getPendingVehicles_shouldReturnVehicleDTOs() {
        Vehicle vehicle = new Vehicle();
        VehicleGetDTO dto = new VehicleGetDTO();

        Page<Vehicle> page = new PageImpl<>(List.of(vehicle));
        when(vehicleRepository.findByStatus(eq(Vehicle.Status.PENDING), any(Pageable.class))).thenReturn(page);
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(dto);

        Page<VehicleGetDTO> result = service.getPendingVehicles(Optional.empty(), Optional.empty(), Optional.empty(), 0, 10);

        assertEquals(1, result.getTotalElements());
        verify(vehicleRepository).findByStatus(eq(Vehicle.Status.PENDING), any(Pageable.class));
        verify(vehicleMapper).vehicleGet(vehicle);
    }

    @Test
    void getPendingStats_shouldReturnCorrectCounts() {
        when(vehicleRepository.countByVehicleTypeAndStatus(Vehicle.VehicleType.CAR, Vehicle.Status.PENDING)).thenReturn(2L);
        when(vehicleRepository.countByVehicleTypeAndStatus(Vehicle.VehicleType.MOTORBIKE, Vehicle.Status.PENDING)).thenReturn(1L);
        when(vehicleRepository.countByVehicleTypeAndStatus(Vehicle.VehicleType.BICYCLE, Vehicle.Status.PENDING)).thenReturn(3L);

        Map<String, Long> stats = service.getPendingStats();

        assertEquals(2L, stats.get("car"));
        assertEquals(1L, stats.get("motorbike"));
        assertEquals(3L, stats.get("bicycle"));
    }

    @Test
    void getVehicleDetail_shouldReturnDTO_whenValid() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.PENDING);
        VehicleGetDTO dto = new VehicleGetDTO();

        when(vehicleRepository.findByIdWithBrandAndModel("v1")).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(dto);

        VehicleGetDTO result = service.getVehicleDetail("v1");

        assertEquals(dto, result);
    }

    @Test
    void getVehicleDetail_shouldThrow404_whenNotFound() {
        when(vehicleRepository.findByIdWithBrandAndModel("invalid")).thenReturn(Optional.empty());

        var ex = assertThrows(RuntimeException.class, () -> service.getVehicleDetail("invalid"));
        assertTrue(ex.getMessage().contains("Không tìm thấy phương tiện"));
    }

    @Test
    void getVehicleDetail_shouldThrow400_whenNotPending() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.AVAILABLE);

        when(vehicleRepository.findByIdWithBrandAndModel("v2")).thenReturn(Optional.of(vehicle));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            service.getVehicleDetail("v2");
        });

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Chỉ được xem chi tiết phương tiện ở trạng thái Pending", ex.getReason()); // tránh kiểm tra `ex.getMessage()`
    }

    @Test
    void updateVehicleStatus_shouldApproveVehicle() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.PENDING);
        User user = new User(); user.setId("user123");
        vehicle.setUser(user); vehicle.setThumb("Xe ABC");

        AdminUpdateVehicleStatusDTO request = new AdminUpdateVehicleStatusDTO();
        request.setStatus(Vehicle.Status.AVAILABLE);

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(vehicle));

        service.updateVehicleStatus("v1", request);

        assertEquals(Vehicle.Status.AVAILABLE, vehicle.getStatus());
        verify(notificationService).createNotification(any());
    }

    @Test
    void updateVehicleStatus_shouldRejectVehicleWithReason() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.PENDING);
        User user = new User(); user.setId("user123");
        vehicle.setUser(user); vehicle.setThumb("Xe ABC");

        AdminUpdateVehicleStatusDTO request = new AdminUpdateVehicleStatusDTO();
        request.setStatus(Vehicle.Status.UNAVAILABLE);
        request.setRejectReason("Không đạt tiêu chuẩn");

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(vehicle));

        service.updateVehicleStatus("v1", request);

        assertEquals(Vehicle.Status.UNAVAILABLE, vehicle.getStatus());
        verify(notificationService).createNotification(any());
    }

    @Test
    void updateVehicleStatus_shouldThrow_whenMissingRejectReason() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.PENDING);
        vehicle.setUser(new User());

        AdminUpdateVehicleStatusDTO request = new AdminUpdateVehicleStatusDTO();
        request.setStatus(Vehicle.Status.UNAVAILABLE);
        request.setRejectReason("   "); // blank

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(vehicle));

        var ex = assertThrows(RuntimeException.class, () -> service.updateVehicleStatus("v1", request));
        assertTrue(ex.getMessage().contains("lí do từ chối duyệt"));
    }

    @Test
    void updateVehicleStatus_shouldThrow_whenStatusIsSUSPENDED() {
        AdminUpdateVehicleStatusDTO request = new AdminUpdateVehicleStatusDTO();
        request.setStatus(Vehicle.Status.SUSPENDED);

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(new Vehicle()));

        var ex = assertThrows(RuntimeException.class, () -> service.updateVehicleStatus("v1", request));
        assertTrue(ex.getMessage().contains("Admin không thể trực tiếp"));
    }

    @Test
    void updateVehicleStatus_shouldThrow_whenSameStatus() {
        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.AVAILABLE);

        AdminUpdateVehicleStatusDTO request = new AdminUpdateVehicleStatusDTO();
        request.setStatus(Vehicle.Status.AVAILABLE);

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(vehicle));

        var ex = assertThrows(RuntimeException.class, () -> service.updateVehicleStatus("v1", request));
        assertTrue(ex.getMessage().contains("đã ở trạng thái AVAILABLE"));
    }

    @Test
    void updateMultipleVehicleStatuses_shouldCallUpdateForEach() {
        AdminUpdateVehicleStatusDTO req1 = new AdminUpdateVehicleStatusDTO("v1", Vehicle.Status.AVAILABLE, null);
        AdminUpdateVehicleStatusDTO req2 = new AdminUpdateVehicleStatusDTO("v2", Vehicle.Status.UNAVAILABLE, "Không đạt tiêu chuẩn");

        Vehicle vehicle = new Vehicle();
        vehicle.setStatus(Vehicle.Status.PENDING);
        User user = new User();
        user.setId("user1");
        vehicle.setUser(user);
        vehicle.setThumb("Xe ABC");

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.findById("v2")).thenReturn(Optional.of(vehicle));

        List<AdminUpdateVehicleStatusDTO> list = List.of(req1, req2);

        service.updateMultipleVehicleStatuses(list);

        verify(vehicleRepository, times(2)).save(any(Vehicle.class));
        verify(notificationService, times(2)).createNotification(any());
    }
}
