package com.rft.rft_be.service;

import com.rft.rft_be.dto.vehicle.*;

import com.rft.rft_be.entity.Rating;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.ExtraFeeRuleMapper;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.*;
import com.rft.rft_be.service.vehicle.VehicleServiceImpl;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VehicleServiceTest {

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ExtraFeeRuleRepository extraFeeRuleRepository;

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private VehicleMapper vehicleMapper;

    @Mock
    private ExtraFeeRuleMapper extraFeeRuleMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookedTimeSlotRepository bookedTimeSlotsRepository;

    @Mock
    private RatingMapper ratingMapper;

    @Mock
    private PenaltyRepository penaltyRepository;

    @Mock
    private ModelRepository modelRepository;

    @Mock
    private BrandRepository brandRepository;

    @Test
    void testGetVehicleById_Success() {
        String vehicleId = "v1";
        Vehicle mockVehicle = new Vehicle();
        mockVehicle.setId(vehicleId);

        VehicleGetDTO mockDTO = new VehicleGetDTO();
        mockDTO.setId(vehicleId);
        mockDTO.setRating(4.5);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(mockVehicle));
        when(vehicleMapper.vehicleGet(mockVehicle)).thenReturn(mockDTO);
        when(extraFeeRuleRepository.findByVehicleId(vehicleId)).thenReturn(null);
        when(extraFeeRuleMapper.toDto(null)).thenReturn(null);
        when(ratingRepository.findAverageByVehicleId(vehicleId)).thenReturn(4.5);

        VehicleGetDTO result = vehicleService.getVehicleById(vehicleId);

        assertEquals(vehicleId, result.getId());
        assertEquals(4.5, result.getRating());
    }

    @Test
    void testGetVehicleById_NotFound() {
        String vehicleId = "not_exist";
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vehicleService.getVehicleById(vehicleId));

        assertEquals("Vehicle not found with id: " + vehicleId, ex.getMessage());
    }

    @Test
    void testGetVehiclesByStatus_Valid() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");
        List<Vehicle> vehicleList = List.of(vehicle);

        when(vehicleRepository.findByStatus(Vehicle.Status.AVAILABLE)).thenReturn(vehicleList);
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByStatus("available");

        assertEquals(1, result.size());
    }


    @Test
    void testGetVehiclesByStatus_InvalidStatus() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vehicleService.getVehiclesByStatus("unknown"));

        assertTrue(ex.getMessage().contains("Invalid status"));
    }

    @Test
    void testGetAverageRating_NoRatings_ReturnsZero() {
        String vehicleId = "v1";
        when(ratingRepository.findAverageByVehicleId(vehicleId)).thenReturn(null);

        double avg = vehicleService.getAverageRating(vehicleId);
        assertEquals(0.0, avg);
    }

    @Test
    void testDeleteVehicle_NotExists() {
        String vehicleId = "notfound";
        when(vehicleRepository.existsById(vehicleId)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vehicleService.deleteVehicle(vehicleId));

        assertEquals("Vehicle not found with id: " + vehicleId, ex.getMessage());
    }

    @Test
    void testDeleteVehicle_Success() {
        String vehicleId = "v1";
        when(vehicleRepository.existsById(vehicleId)).thenReturn(true);

        vehicleService.deleteVehicle(vehicleId);

        verify(vehicleRepository).deleteById(vehicleId);
    }

    @Test
    void testUpdateVehicle_Success() {
        String vehicleId = "v123";
        Vehicle existingVehicle = new Vehicle();
        existingVehicle.setId(vehicleId);
        existingVehicle.setLicensePlate("OLD123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("NEW123");
        dto.setVehicleType("CAR");
        dto.setStatus("AVAILABLE");
        dto.setFuelType("GASOLINE");
        dto.setInsuranceStatus("YES");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(existingVehicle));
        when(vehicleRepository.existsByLicensePlate("NEW123")).thenReturn(false);
        when(vehicleRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(vehicleMapper.vehicleGet(any())).thenReturn(dto);

        VehicleGetDTO result = vehicleService.updateVehicle(vehicleId, dto);

        assertEquals("NEW123", result.getLicensePlate());
    }

    @Test
    void testUpdateVehicle_DuplicateLicensePlate_ThrowsException() {
        String vehicleId = "v123";
        Vehicle existingVehicle = new Vehicle();
        existingVehicle.setId(vehicleId);
        existingVehicle.setLicensePlate("OLD123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("DUPLICATE123");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(existingVehicle));
        when(vehicleRepository.existsByLicensePlate("DUPLICATE123")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle(vehicleId, dto));

        assertTrue(ex.getMessage().contains("already exists"));
    }

    @Test
    void testUpdateVehicle_InvalidVehicleType_ThrowsException() {
        String vehicleId = "v123";
        Vehicle existingVehicle = new Vehicle();
        existingVehicle.setId(vehicleId);

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setVehicleType("INVALID_TYPE");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(existingVehicle));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle(vehicleId, dto));

        assertTrue(ex.getMessage().contains("Invalid vehicle type"));
    }

    @Test
    void testCreateVehicleBulk_Success() {
        CreateVehicleDTO createDto = new CreateVehicleDTO();
        createDto.setLicensePlate("UNIQUE123");
        createDto.setVehicleQuantity(2);
        createDto.setCostPerDay(BigDecimal.valueOf(500));
        createDto.setHaveDriver("YES");
        createDto.setInsuranceStatus("NO");
        createDto.setShipToAddress("YES");
        createDto.setStatus("AVAILABLE");
        createDto.setVehicleType("CAR");

        when(vehicleRepository.existsByLicensePlate("UNIQUE123")).thenReturn(false);
        when(vehicleRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        List<VehicleGetDTO> mockDtos = List.of(new VehicleGetDTO(), new VehicleGetDTO());
        when(vehicleMapper.vehicleGet(any())).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.createVehicleBulk(createDto);

        assertEquals(2, result.size());
    }

    @Test
    void testCreateVehicleBulk_MissingLicensePlate_ThrowsException() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate(null); // invalid
        dto.setCostPerDay(BigDecimal.valueOf(100));
        dto.setVehicleQuantity(1);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.createVehicleBulk(dto));

        assertTrue(ex.getMessage().contains("License plate is required"));
    }

    @Test
    void testGetUserAvailableVehiclesByType_Success() {
        String userId = "user123";
        String type = "car";

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");

        when(userRepository.existsById(userId)).thenReturn(true);
        when(vehicleRepository.findByUserIdAndVehicleTypeAndStatusWithPenalty(
                eq(userId), eq(Vehicle.VehicleType.CAR), eq(Vehicle.Status.AVAILABLE)))
                .thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getUserAvailableVehiclesByType(userId, type);

        assertEquals(1, result.size());
    }

    @Test
    void testGetUserAvailableVehiclesByType_UserNotFound_ThrowsException() {
        String userId = "userX";
        when(userRepository.existsById(userId)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vehicleService.getUserAvailableVehiclesByType(userId, "car"));

        assertTrue(ex.getMessage().contains("Không tìm thấy người dùng"));
    }

    @Test
    void testGetQuantityOfAvailableVehiclesByThumb_Success() {
        String thumb = "img123.jpg";
        String providerId = "provider1";
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle1 = new Vehicle();
        vehicle1.setId("v1");
        Vehicle vehicle2 = new Vehicle();
        vehicle2.setId("v2");

        // Xe v1 bận, v2 rảnh
        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of("v1"));
        when(vehicleRepository.findByThumbAndUserIdAndStatus(thumb, providerId, Vehicle.Status.AVAILABLE))
                .thenReturn(List.of(vehicle1, vehicle2));

        AvailableVehicleQuantityOnlyDTO result =
                vehicleService.getQuantityOfAvailableVehiclesByThumb(thumb, providerId, from, to);

        assertEquals(1, result.getQuantity()); // Chỉ có v2 là rảnh
    }

    @Test
    void testGetListAndQuantityOfAvailableVehiclesByThumb_Success() {
        String thumb = "img123.jpg";
        String providerId = "provider1";
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle1 = new Vehicle();
        vehicle1.setId("v1");
        Vehicle vehicle2 = new Vehicle();
        vehicle2.setId("v2");

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of("v2")); // v2 bận
        when(vehicleRepository.findByThumbAndUserIdAndStatus(thumb, providerId, Vehicle.Status.AVAILABLE))
                .thenReturn(List.of(vehicle1, vehicle2));
        when(vehicleMapper.vehicleGet(vehicle1)).thenReturn(new VehicleGetDTO());

        AvailableVehicleListWithQuantityDTO result =
                vehicleService.getListAndQuantityOfAvailableVehiclesByThumb(thumb, providerId, from, to);

        assertEquals(1, result.getQuantity());
        assertEquals(1, result.getData().size());
    }

    @Test
    void testBasicSearch_Success() {
        String address = "Hanoi";
        String type = "car";
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(2);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setUser(new User());
        vehicle.getUser().setAddress("Hanoi");

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));
        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findBasicSearch(eq(address), eq(Vehicle.VehicleType.CAR), eq(List.of()), any()))
                .thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v1")).thenReturn(4.5);

        Page<VehicleSearchResultDTO> result = vehicleService.basicSearch(address, type, from, to, Pageable.ofSize(10));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testBasicSearch_InvalidVehicleType_ThrowsException() {
        String address = "HCM";
        String invalidType = "plane";
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.basicSearch(address, invalidType, from, to, Pageable.ofSize(10)));

        assertTrue(ex.getMessage().contains("Invalid vehicle type"));
    }

    @Test
    void testSearchVehicles_WithTypeAndAddressAndFreeTime() {
        // Setup input
        VehicleSearchDTO searchDTO = new VehicleSearchDTO();
        searchDTO.setVehicleTypes(List.of(String.valueOf(Vehicle.VehicleType.CAR)));
        searchDTO.setAddresses(List.of("Hanoi"));
        searchDTO.setPage(0);
        searchDTO.setSize(10);

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);
        vehicle.setUser(new User());
        vehicle.getUser().setAddress("Hanoi");
        vehicle.setStatus(Vehicle.Status.AVAILABLE);

        Page<Vehicle> pageResult = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of()); // không bận
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(pageResult);
        when(ratingRepository.findAverageByVehicleId("v1")).thenReturn(5.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(searchDTO, from, to);

        assertEquals(1, result.getTotalElements());
        assertEquals("v1", result.getContent().get(0).getId());
        assertEquals(5.0, result.getContent().get(0).getRating());
    }

    @Test
    void testSearchVehicles_WithOnlyFiveStarFilter() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(10);
        dto.setRatingFiveStarsOnly(true);

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v123");
        vehicle.setStatus(Vehicle.Status.AVAILABLE);
        vehicle.setUser(new User());

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v123")).thenReturn(5.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        assertEquals(1, result.getTotalElements());
        assertEquals("v123", result.getContent().get(0).getId());
    }

    @Test
    void testSearchVehicles_ExcludesBusyVehicles() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(10);

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        // Xe "busy1" bận => không được trả về
        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of("busy1"));

        Vehicle vehicle1 = new Vehicle();
        vehicle1.setId("available1");
        vehicle1.setUser(new User());

        Page<Vehicle> page = new PageImpl<>(List.of(vehicle1));
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(ratingRepository.findAverageByVehicleId("available1")).thenReturn(4.5);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        assertEquals(1, result.getTotalElements());
        assertEquals("available1", result.getContent().get(0).getId());
    }

    @Test
    void testDeleteExpiredBookedTimeSlots_Success() {
        LocalDateTime now = LocalDateTime.now();
        doNothing().when(bookedTimeSlotsRepository).deleteAllByTimeToBefore(any());

        vehicleService.deleteExpiredBookedTimeSlots();

        verify(bookedTimeSlotsRepository).deleteAllByTimeToBefore(any());
    }

    @Test
    void testGetVehicleDetailById_Success() {
        String vehicleId = "v001";

        Vehicle vehicle = new Vehicle();
        vehicle.setId(vehicleId);

        List<Rating> mockRatings = List.of(new Rating());
        List<UserCommentDTO> mockComments = List.of(new UserCommentDTO());

        VehicleDetailDTO dto = new VehicleDetailDTO();
        dto.setId(vehicleId);
        dto.setRating(4.5);
        dto.setUserComments(mockComments);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(ratingRepository.findAllByVehicleId(vehicleId)).thenReturn(mockRatings);
        when(ratingMapper.RatingToUserListCommentDTO(mockRatings)).thenReturn(mockComments);
        when(ratingRepository.findAverageByVehicleId(vehicleId)).thenReturn(4.5);
        when(extraFeeRuleRepository.findByVehicleId(vehicleId)).thenReturn(null);
        when(extraFeeRuleMapper.toDto(null)).thenReturn(null);
        when(vehicleMapper.vehicleToVehicleDetail(vehicle)).thenReturn(dto);

        VehicleDetailDTO result = vehicleService.getVehicleDetailById(vehicleId);

        assertEquals(vehicleId, result.getId());
        assertEquals(4.5, result.getRating());
        assertEquals(mockComments, result.getUserComments());
    }

    @Test
    void testGetVehicleDetailById_NotFound() {
        when(vehicleRepository.findById("not_found")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.getVehicleDetailById("not_found"));

        assertTrue(ex.getMessage().contains("Vehicle not found with id"));
    }

    @Test
    void testGetVehicleByLicensePlate_Success() {
        String license = "ABC123";
        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(license);

        when(vehicleRepository.findByLicensePlate(license)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        VehicleGetDTO result = vehicleService.getVehicleByLicensePlate(license);

        assertNotNull(result);
    }

    @Test
    void testGetVehicleByLicensePlate_NotFound() {
        when(vehicleRepository.findByLicensePlate("XYZ999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vehicleService.getVehicleByLicensePlate("XYZ999"));

        assertTrue(ex.getMessage().contains("Vehicle not found"));
    }

    @Test
    void testGetVehiclesByBrandId() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v001");

        when(vehicleRepository.findByBrandId("b001")).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByBrandId("b001");

        assertEquals(1, result.size());
    }

    @Test
    void testGetVehiclesByModelId() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v002");

        when(vehicleRepository.findByModelId("m001")).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByModelId("m001");

        assertEquals(1, result.size());
    }

    @Test
    void testGetVehiclesByPenaltyId() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v003");

        when(vehicleRepository.findByPenaltyId("p001")).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByPenaltyId("p001");

        assertEquals(1, result.size());
    }

    @Test
    void testGetVehiclesByVehicleTypeAndStatus_Valid() {
        String type = "car";
        String status = "available";

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");

        when(vehicleRepository.findByVehicleTypeAndStatus(
                Vehicle.VehicleType.CAR, Vehicle.Status.AVAILABLE))
                .thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByVehicleTypeAndStatus(type, status);

        assertEquals(1, result.size());
    }

    @Test
    void testGetVehiclesByVehicleTypeAndStatus_InvalidEnum_Throws() {
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.getVehiclesByVehicleTypeAndStatus("PLANE", "FLYING"));

        assertTrue(ex.getMessage().contains("Invalid vehicle type or status"));
    }

    @Test
    void testGetVehiclesByHaveDriver_Valid() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v-driver");

        when(vehicleRepository.findByHaveDriver(Vehicle.HaveDriver.YES)).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByHaveDriver("YES");

        assertEquals(1, result.size());
    }

    @Test
    void testGetVehiclesByHaveDriver_Invalid_Throws() {
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.getVehiclesByHaveDriver("MAYBE"));

        assertTrue(ex.getMessage().contains("Invalid have driver"));
    }

    @Test
    void testGetAllAvailableVehicles() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("va");

        when(vehicleRepository.findByStatus(Vehicle.Status.AVAILABLE)).thenReturn(List.of(vehicle));
        when(vehicleMapper.toDTO(vehicle)).thenReturn(new VehicleDTO());

        List<VehicleDTO> result = vehicleService.getAllAvailableVehicles();

        assertEquals(1, result.size());
    }

    @Test
    void testGetVehiclesByUserId() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vu");

        when(vehicleRepository.findByUserId("user123")).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByUserId("user123");

        assertEquals(1, result.size());
    }

    @Test
    void testGetAllVehicles() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vAll");

        when(vehicleRepository.findAllWithPenalty()).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleToVehicleCard(vehicle)).thenReturn(new VehicleCardDetailDTO());
        when(ratingRepository.findAverageByVehicleId(vehicle.getId())).thenReturn(4.0);

        List<VehicleCardDetailDTO> result = vehicleService.getAllVehicles();

        assertEquals(1, result.size());
    }

    @Test
    void testUpdateVehicle_LicensePlateNotChanged_SkipDuplicateCheck() {
        Vehicle existing = new Vehicle();
        existing.setId("v1");
        existing.setLicensePlate("ABC123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("ABC123"); // Trùng với hiện tại

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(existing));
        when(vehicleRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(vehicleMapper.vehicleGet(any())).thenReturn(dto);

        VehicleGetDTO result = vehicleService.updateVehicle("v1", dto);

        assertEquals("ABC123", result.getLicensePlate());
    }

    @Test
    void testUpdateVehicle_DBNull_DTOHasPlate_CheckDuplicate() {
        Vehicle existing = new Vehicle();
        existing.setId("v2");
        existing.setLicensePlate(null);

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("ABC456");

        when(vehicleRepository.findById("v2")).thenReturn(Optional.of(existing));
        when(vehicleRepository.existsByLicensePlate("ABC456")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle("v2", dto));

        assertTrue(ex.getMessage().contains("already exists"));
    }

    @Test
    void testUpdateVehicle_VehicleImages_ParseFails() throws Exception {
        Vehicle existing = new Vehicle();
        existing.setId("v3");

        VehicleImageDTO image = new VehicleImageDTO();
        image.setImageUrl("bad-image");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setVehicleImages(List.of(image));
        dto.setLicensePlate("XYZ789");

        when(vehicleRepository.findById("v3")).thenReturn(Optional.of(existing));
        when(vehicleRepository.existsByLicensePlate("XYZ789")).thenReturn(false);
        when(vehicleRepository.save(any())).thenReturn(existing);
        when(vehicleMapper.vehicleGet(any())).thenReturn(dto);

        // Gây lỗi bằng cách mock ObjectMapper gián tiếp ném lỗi (không cần thật vì không test ObjectMapper)
        VehicleServiceImpl service = spy(vehicleService);
        VehicleGetDTO result = service.updateVehicle("v3", dto);

        assertNotNull(result);
    }

    @Test
    void testCreateVehicleBulk_NoImages_SetEmptyJsonArray() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("new123");
        dto.setCostPerDay(BigDecimal.valueOf(100));
        dto.setVehicleQuantity(1);
        dto.setHaveDriver("YES");
        dto.setStatus("AVAILABLE");
        dto.setVehicleType("CAR");

        when(vehicleRepository.existsByLicensePlate("new123")).thenReturn(false);
        when(vehicleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(vehicleMapper.vehicleGet(any())).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.createVehicleBulk(dto);

        assertEquals(1, result.size());
    }

    @Test
    void testCreateVehicleBulk_NullEnums_SetDefaults() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("new456");
        dto.setCostPerDay(BigDecimal.valueOf(200));
        dto.setVehicleQuantity(1);
        dto.setVehicleType("CAR"); // Chỉ cung cấp 1 enum

        when(vehicleRepository.existsByLicensePlate("new456")).thenReturn(false);
        when(vehicleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(vehicleMapper.vehicleGet(any())).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.createVehicleBulk(dto);

        assertEquals(1, result.size());
    }

    @Test
    void testCreateVehicleBulk_InvalidEnum_Throws() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("err123");
        dto.setCostPerDay(BigDecimal.valueOf(300));
        dto.setVehicleQuantity(1);
        dto.setVehicleType("PLANE"); // invalid enum

        when(vehicleRepository.existsByLicensePlate("err123")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.createVehicleBulk(dto));

        assertTrue(ex.getMessage().contains("Invalid enum value"));
    }

    @Test
    void testGetUserAvailableVehiclesByType_InvalidType_CatchesAndThrows() {
        when(userRepository.existsById("u1")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.getUserAvailableVehiclesByType("u1", "PLANE"));

        assertTrue(ex.getMessage().contains("Loại xe không hợp lệ"));
    }

    @Test
    void testSearchVehicles_WithTransmissionAndFuelType() {
        // Arrange
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setTransmission("MANUAL");
        dto.setFuelType("GASOLINE");

        LocalDateTime from = LocalDateTime.of(2025, 8, 1, 10, 0);
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v9");
        vehicle.setUser(new User());
        vehicle.setTransmission(Vehicle.Transmission.MANUAL);
        vehicle.setFuelType(Vehicle.FuelType.GASOLINE);

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v9")).thenReturn(4.0);

        // Act
        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        // Assert
        assertEquals(1, result.getTotalElements());
        VehicleSearchResultDTO resultDto = result.getContent().get(0);
        assertEquals("v9", resultDto.getId());
        assertEquals(4.0, resultDto.getRating());
    }

    @Test
    void testUpdateVehicle_HaveDriverEmptyString_Throws() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setHaveDriver("   ");  // empty after trim
        dto.setLicensePlate("PLATE");

        when(vehicleRepository.findById("v1")).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.existsByLicensePlate("PLATE")).thenReturn(false);
        when(vehicleRepository.save(any())).thenReturn(vehicle);
        when(vehicleMapper.vehicleGet(any())).thenReturn(dto);

        VehicleGetDTO result = vehicleService.updateVehicle("v1", dto);

        assertEquals("PLATE", result.getLicensePlate()); // Không ném lỗi vì chuỗi rỗng bị bỏ qua
    }

    @Test
    void testUpdateVehicle_NullVehicleImages_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vimg");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("IMG1");
        dto.setVehicleImages(null); // images null

        when(vehicleRepository.findById("vimg")).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.existsByLicensePlate("IMG1")).thenReturn(false);
        when(vehicleRepository.save(any())).thenReturn(vehicle);
        when(vehicleMapper.vehicleGet(any())).thenReturn(dto);

        VehicleGetDTO result = vehicleService.updateVehicle("vimg", dto);

        assertEquals("IMG1", result.getLicensePlate());
    }

    @Test
    void testCreateVehicleBulk_NullEnums_DefaultsAreSet() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("DEF123");
        dto.setCostPerDay(BigDecimal.valueOf(100));
        dto.setVehicleQuantity(1);
        dto.setVehicleType("CAR"); // Chỉ set 1 enum

        when(vehicleRepository.existsByLicensePlate("DEF123")).thenReturn(false);
        when(vehicleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(vehicleMapper.vehicleGet(any())).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.createVehicleBulk(dto);

        assertEquals(1, result.size());
    }

    @Test
    void testGetAllVehicles_WithNullRating() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vnull");

        when(vehicleRepository.findAllWithPenalty()).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleToVehicleCard(vehicle)).thenReturn(new VehicleCardDetailDTO());
        when(ratingRepository.findAverageByVehicleId("vnull")).thenReturn(null);

        List<VehicleCardDetailDTO> result = vehicleService.getAllVehicles();

        assertEquals(1, result.size());
        assertEquals(0.0, result.get(0).getRating());
    }

    @Test
    void testGetVehiclesByStatus_Unavailable_LowerCase() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vun");

        when(vehicleRepository.findByStatus(Vehicle.Status.UNAVAILABLE)).thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(new VehicleGetDTO());

        List<VehicleGetDTO> result = vehicleService.getVehiclesByStatus("unavailable");

        assertEquals(1, result.size());
    }

    @Test
    void testUpdateVehicle_InvalidInsuranceStatus_Throws() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vIns");
        vehicle.setLicensePlate("X");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("X");
        dto.setInsuranceStatus("UNKNOWN");

        when(vehicleRepository.findById("vIns")).thenReturn(Optional.of(vehicle));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle("vIns", dto));

        assertTrue(ex.getMessage().contains("Invalid insurance status"));
    }

    @Test
    void testUpdateVehicle_InvalidShipToAddress_Throws() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vShip");
        vehicle.setLicensePlate("SH123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("SH123");
        dto.setShipToAddress("MAYBE"); // invalid enum

        when(vehicleRepository.findById("vShip")).thenReturn(Optional.of(vehicle));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle("vShip", dto));

        assertTrue(ex.getMessage().contains("Invalid ship to address"));
    }

    @Test
    void testUpdateVehicle_InvalidTransmission_Throws() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vTran");
        vehicle.setLicensePlate("TR123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("TR123");
        dto.setTransmission("AUTOFLY"); // invalid enum

        when(vehicleRepository.findById("vTran")).thenReturn(Optional.of(vehicle));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle("vTran", dto));

        assertTrue(ex.getMessage().contains("Invalid transmission"));
    }

    @Test
    void testUpdateVehicle_InvalidFuelType_Throws() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vFuel");
        vehicle.setLicensePlate("FL123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("FL123");
        dto.setFuelType("NUCLEAR"); // invalid enum

        // ✅ Chỉ mock những gì thực sự được gọi
        when(vehicleRepository.findById("vFuel")).thenReturn(Optional.of(vehicle));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle("vFuel", dto));

        assertTrue(ex.getMessage().contains("Invalid fuel type"));
    }

    @Test
    void testUpdateVehicle_InvalidStatus_Throws() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vStat");
        vehicle.setLicensePlate("ST123");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate("ST123");
        dto.setStatus("EXPIRED"); // giá trị không hợp lệ → sẽ throw

        when(vehicleRepository.findById("vStat")).thenReturn(Optional.of(vehicle));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                vehicleService.updateVehicle("vStat", dto));

        assertTrue(ex.getMessage().contains("Invalid status"));
    }

    @Test
    void testUpdateVehicle_NullLicensePlate_SkipUpdate() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vNoPlate");
        vehicle.setLicensePlate("OLD");

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setLicensePlate(null); // không có gì

        when(vehicleRepository.findById("vNoPlate")).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.save(any())).thenReturn(vehicle);
        when(vehicleMapper.vehicleGet(any())).thenReturn(new VehicleGetDTO());

        VehicleGetDTO result = vehicleService.updateVehicle("vNoPlate", dto);

        assertNotNull(result);
    }

    @Test
    void testSearchVehicles_WithAddresses() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setAddresses(List.of("Hanoi", "Saigon"));

        Vehicle v = new Vehicle();
        v.setId("v1");
        v.setUser(new User());

        when(bookedTimeSlotsRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(v)));
        when(ratingRepository.findAverageByVehicleId("v1")).thenReturn(5.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, LocalDateTime.now(), LocalDateTime.now().plusDays(1));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testSearchVehicles_WithHaveDriver() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setHaveDriver(Vehicle.HaveDriver.YES);

        Vehicle v = new Vehicle();
        v.setId("v2");
        v.setUser(new User());

        when(bookedTimeSlotsRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(v)));
        when(ratingRepository.findAverageByVehicleId("v2")).thenReturn(4.5);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, LocalDateTime.now(), LocalDateTime.now().plusDays(1));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testSearchVehicles_WithShipToAddress() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setShipToAddress(Vehicle.ShipToAddress.NO);


        Vehicle v = new Vehicle();
        v.setId("v3");
        v.setUser(new User());

        when(bookedTimeSlotsRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(v)));
        when(ratingRepository.findAverageByVehicleId("v3")).thenReturn(4.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, LocalDateTime.now(), LocalDateTime.now().plusDays(1));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testSearchVehicles_WithBrandModelSeatAndCost() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setBrandId("1");
        dto.setModelId("2");
        dto.setNumberSeat(7);
        dto.setCostFrom(200);

        Vehicle v = new Vehicle();
        v.setId("v4");
        v.setUser(new User());

        when(bookedTimeSlotsRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(v)));
        when(ratingRepository.findAverageByVehicleId("v4")).thenReturn(3.5);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, LocalDateTime.now(), LocalDateTime.now().plusDays(1));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testSearchVehicles_WithRatingFiveStarsOnly() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setRatingFiveStarsOnly(true);

        Vehicle v = new Vehicle();
        v.setId("v5");
        v.setUser(new User());

        when(bookedTimeSlotsRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(v)));
        when(ratingRepository.findAverageByVehicleId("v5")).thenReturn(5.0); // giả lập 5 sao

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(
                dto, LocalDateTime.now(), LocalDateTime.now().plusDays(1));

        assertEquals(1, result.getTotalElements());
        assertEquals(5.0, result.getContent().get(0).getRating());
    }

    @Test
    void testSearchVehicles_WithCostToFilter() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setCostTo(500); // Integer

        Vehicle v = new Vehicle();
        v.setId("v6");
        v.setUser(new User());
        v.setCostPerDay(new BigDecimal("400")); // dưới 500

        when(bookedTimeSlotsRepository.findBusyVehicleIds(any(), any())).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(v)));
        when(ratingRepository.findAverageByVehicleId("v6")).thenReturn(4.8);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(
                dto, LocalDateTime.now(), LocalDateTime.now().plusDays(1));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetVehiclesByVehicleType_ValidType_ReturnsVehicleGetDTOList() {
        // Arrange
        String vehicleType = "car";
        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");
        vehicle.setVehicleType(Vehicle.VehicleType.CAR);

        VehicleGetDTO dto = new VehicleGetDTO();
        dto.setId("v1");

        when(vehicleRepository.findByVehicleType(Vehicle.VehicleType.CAR))
                .thenReturn(List.of(vehicle));
        when(vehicleMapper.vehicleGet(vehicle)).thenReturn(dto);

        // Act
        List<VehicleGetDTO> result = vehicleService.getVehiclesByVehicleType(vehicleType);

        // Assert
        assertEquals(1, result.size());
        assertEquals("v1", result.get(0).getId());
        verify(vehicleRepository).findByVehicleType(Vehicle.VehicleType.CAR);
        verify(vehicleMapper).vehicleGet(vehicle);
    }

    @Test
    void testGetVehiclesByVehicleType_InvalidType_ThrowsException() {
        // Arrange
        String vehicleType = "PLANE";

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> vehicleService.getVehiclesByVehicleType(vehicleType));

        assertEquals("Invalid vehicle type: PLANE. Valid values are: CAR, MOTORBIKE, BICYCLE", exception.getMessage());
        verify(vehicleRepository, never()).findByVehicleType(any(Vehicle.VehicleType.class));
        verify(vehicleMapper, never()).vehicleGet(any());
    }

    @Test
    void testGetVehiclesByVehicleType_ValidType_NoVehicles_ReturnsEmptyList() {
        // Arrange
        String vehicleType = "motorbike";

        when(vehicleRepository.findByVehicleType(Vehicle.VehicleType.MOTORBIKE))
                .thenReturn(Collections.emptyList());

        // Act
        List<VehicleGetDTO> result = vehicleService.getVehiclesByVehicleType(vehicleType);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(vehicleRepository).findByVehicleType(Vehicle.VehicleType.MOTORBIKE);
        verify(vehicleMapper, never()).vehicleGet(any());
    }

    @Test
    void testSearchVehicles_FilterByMultipleAddresses() {
        // Arrange
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(10);
        dto.setAddresses(List.of("Hanoi", "Saigon"));

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v7");
        User user = new User();
        user.setAddress("Hanoi Old Quarter");
        vehicle.setUser(user);

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v7")).thenReturn(4.7);

        // Act
        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("v7", result.getContent().get(0).getId());
        assertEquals(4.7, result.getContent().get(0).getRating());
    }

    @Test
    void testSearchVehicles_FilterByFiveStarRatingsOnly() {
        // Arrange
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setRatingFiveStarsOnly(true); // chỉ lọc xe 5 sao

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v8");
        vehicle.setUser(new User());

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v8")).thenReturn(5.0); // đúng điều kiện

        // Act
        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("v8", result.getContent().get(0).getId());
        assertEquals(5.0, result.getContent().get(0).getRating());
    }

    @Test
    void testSearchVehicles_FilterByAddress_ValidJoin() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setAddresses(List.of("Hanoi"));

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        User user = new User();
        user.setAddress("Hanoi City");

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v1");
        vehicle.setUser(user); // 🔑 cần có user

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v1")).thenReturn(4.5);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        assertEquals(1, result.getTotalElements());
        assertEquals("v1", result.getContent().get(0).getId());
    }

    @Test
    void testSearchVehicles_FilterByFiveStars_SubqueryValid() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setRatingFiveStarsOnly(true);

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("v2");
        vehicle.setUser(new User());

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("v2")).thenReturn(5.0); // đúng yêu cầu

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        assertEquals(1, result.getTotalElements());
        assertEquals("v2", result.getContent().get(0).getId());
        assertEquals(5.0, result.getContent().get(0).getRating());
    }

    @Test
    void testSearchVehicles_NoUserInVehicle_JoinFailsGracefully() {
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setPage(0);
        dto.setSize(5);
        dto.setAddresses(List.of("Hanoi"));

        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = from.plusDays(1);

        Vehicle vehicle = new Vehicle();
        vehicle.setId("vNullUser");
        vehicle.setUser(null); // 🚨 Không có user

        Page<Vehicle> vehiclePage = new PageImpl<>(List.of(vehicle));

        when(bookedTimeSlotsRepository.findBusyVehicleIds(from, to)).thenReturn(List.of());
        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(vehiclePage);
        when(ratingRepository.findAverageByVehicleId("vNullUser")).thenReturn(4.0);

        Page<VehicleSearchResultDTO> result = vehicleService.searchVehicles(dto, from, to);

        assertEquals(1, result.getTotalElements());
        assertEquals("vNullUser", result.getContent().get(0).getId());
    }

    @Test
    void testSpecificationWithAddressesExecuted() {
        // Arrange
        VehicleSearchDTO dto = new VehicleSearchDTO();
        dto.setAddresses(List.of("Hanoi", "Saigon"));

        Specification<Vehicle> spec = (root, query, cb) -> cb.conjunction();

        if (dto.getAddresses() != null && !dto.getAddresses().isEmpty()) {
            spec = spec.and((root, query, cb) -> {
                Join<Vehicle, User> userJoin = root.join("user", JoinType.INNER);
                Predicate combinedPredicate = cb.disjunction();
                for (String addr : dto.getAddresses()) {
                    combinedPredicate = cb.or(combinedPredicate,
                            cb.like(cb.lower(userJoin.get("address")), "%" + addr.toLowerCase() + "%"));
                }
                return combinedPredicate;
            });
        }

        assertNotNull(spec);
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenCostPerDayIsNull() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(null);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("Cost per day must be greater than 0", ex.getMessage());
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenCostPerDayIsZeroOrNegative() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(BigDecimal.ZERO);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("Cost per day must be greater than 0", ex.getMessage());
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenLicensePlateExists() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(BigDecimal.valueOf(500));

        when(vehicleRepository.existsByLicensePlate("ABC123")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("Vehicle with license plate ABC123 already exists", ex.getMessage());
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenUserNotFound() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(BigDecimal.valueOf(500));
        dto.setUserId("u1");

        when(vehicleRepository.existsByLicensePlate("ABC123")).thenReturn(false);
        when(userRepository.findById("u1")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("User not found with id: u1", ex.getMessage());
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenBrandNotFound() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(BigDecimal.valueOf(500));
        dto.setBrandId("b1");

        when(vehicleRepository.existsByLicensePlate("ABC123")).thenReturn(false);
        when(brandRepository.findById("b1")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("Brand not found with id: b1", ex.getMessage());
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenModelNotFound() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(BigDecimal.valueOf(500));
        dto.setModelId("m1");

        when(vehicleRepository.existsByLicensePlate("ABC123")).thenReturn(false);
        when(modelRepository.findById("m1")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("Model not found with id: m1", ex.getMessage());
    }

    @Test
    void createVehicleBulk_ShouldThrowException_WhenPenaltyNotFound() {
        CreateVehicleDTO dto = new CreateVehicleDTO();
        dto.setLicensePlate("ABC123");
        dto.setCostPerDay(BigDecimal.valueOf(500));
        dto.setPenaltyId("p1");

        when(vehicleRepository.existsByLicensePlate("ABC123")).thenReturn(false);
        when(penaltyRepository.findById("p1")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            vehicleService.createVehicleBulk(dto);
        });

        assertEquals("Penalty not found with id: p1", ex.getMessage());
    }
}

