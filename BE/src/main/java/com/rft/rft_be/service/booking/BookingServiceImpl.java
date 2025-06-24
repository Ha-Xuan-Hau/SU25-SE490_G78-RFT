package com.rft.rft_be.service.booking;


import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.booking.BookingRequestDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.BookedTimeSlot;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.repository.BookedTimeSlotRepository;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingServiceImpl implements BookingService {

    BookingRepository bookingRepository;
    BookedTimeSlotRepository bookedTimeSlotRepository;
    UserRepository userRepository;
    VehicleRepository vehicleRepository;

    @Override
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, String userId) {
        // ... (Logic tạo booking)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + userId));
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe với ID: " + request.getVehicleId()));

        Instant start = request.getTimeBookingStart();
        Instant end = request.getTimeBookingEnd();

        if (start == null || end == null || !start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt không hợp lệ. Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        List<BookedTimeSlot> overlaps = bookedTimeSlotRepository.findByVehicleIdAndTimeRange(
                vehicle.getId(), start, end);
        if (!overlaps.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã được đặt trong khoảng thời gian này.");
        }

        Booking booking = Booking.builder()
                .user(user)
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .vehicle(vehicle)
                .timeBookingStart(start)
                .timeBookingEnd(end)
                .status(Booking.Status.PENDING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        bookingRepository.save(booking);

        BookedTimeSlot slot = BookedTimeSlot.builder()
                .vehicle(vehicle)
                .timeFrom(start)
                .timeTo(end)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        bookedTimeSlotRepository.save(slot);

        return mapToBookingResponseDTO(booking);
    }

    @Override
    @Transactional
    public void confirmBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId) // Đảm bảo query này JOIN FETCH cả user và vehicle.user
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));

        // Chỉ chủ xe mới đc xác nhận booking
        // Lấy ID của chủ sở hữu xe
        String vehicleOwnerId = booking.getVehicle().getUser().getId();
        if (!currentUserId.equals(vehicleOwnerId)) {
            throw new AccessDeniedException("Bạn không có quyền xác nhận booking này. Chỉ chủ xe mới được phép.");
        }

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking không ở trạng thái PENDING để xác nhận.");
        }

        booking.setStatus(Booking.Status.CONFIRMED);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);
    }

    @Override
    @Transactional
    public void cancelBooking(String bookingId, String currentUserId) {
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));

        // Chỉ người đặt HOẶC chủ xe mới được hủy booking
        String bookerUserId = booking.getUser().getId();
        String vehicleOwnerId = booking.getVehicle().getUser().getId();

        if (!currentUserId.equals(bookerUserId) && !currentUserId.equals(vehicleOwnerId)) {
            throw new AccessDeniedException("Bạn không có quyền hủy booking này. Chỉ người đặt hoặc chủ xe mới được phép.");
        }
        if (booking.getStatus() == Booking.Status.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể hủy Booking đã hoàn tất.");
        }

        booking.setStatus(Booking.Status.CANCELLED);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        // Xóa slot đã đặt khi booking bị hủy
        bookedTimeSlotRepository.deleteByVehicleIdAndTimeRange(
                booking.getVehicle().getId(),
                booking.getTimeBookingStart(),
                booking.getTimeBookingEnd()
        );
    }

    // --- Mapper methods ---

    private BookingResponseDTO mapToBookingResponseDTO(Booking booking) {
        if (booking == null) {
            return null;
        }

        // Tạo BookingResponseDTO và ánh xạ các trường cơ bản
        BookingResponseDTO dto = BookingResponseDTO.builder()
                .id(booking.getId())
                .timeBookingStart(booking.getTimeBookingStart())
                .timeBookingEnd(booking.getTimeBookingEnd())
                .phoneNumber(booking.getPhoneNumber())
                .address(booking.getAddress())
                .codeTransaction(booking.getCodeTransaction())
                .totalCost(booking.getTotalCost())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();

        if (booking.getUser() != null) {
            dto.setUser(mapToUserProfileDTO(booking.getUser()));
        }

        if (booking.getVehicle() != null) {
            dto.setVehicle(mapToVehicleForBookingDTO(booking.getVehicle()));
        }
        return dto;
    }

    // Chuyển đổi từ User Entity sang UserDTO
    private UserProfileDTO mapToUserProfileDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserProfileDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .dateOfBirth(user.getDateOfBirth())
                .phone(user.getPhone())
                .address(user.getAddress())
                .build();
    }

    // Phương thức này sẽ gọi mapToUserProfileDTO cho User của Vehicle
    private VehicleForBookingDTO mapToVehicleForBookingDTO(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }
        VehicleForBookingDTO dto = VehicleForBookingDTO.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .vehicleTypes(vehicle.getVehicleType().name())
                .thumb(vehicle.getThumb())
                .costPerDay(vehicle.getCostPerDay())
                .status(vehicle.getStatus().name())
                .build();

        if (vehicle.getUser() != null) {
            dto.setUser(mapToUserProfileDTO(vehicle.getUser()));
        }
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAllWithUserAndVehicle();
        return bookings.stream()
                .map(this::mapToBookingResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(String bookingId) {
        Booking booking = bookingRepository.findByIdWithUserAndVehicle(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Booking với ID: " + bookingId));
        return mapToBookingResponseDTO(booking);
    }
}