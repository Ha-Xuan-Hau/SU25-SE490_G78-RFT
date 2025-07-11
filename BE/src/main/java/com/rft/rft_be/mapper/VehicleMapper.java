package com.rft.rft_be.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.UserProfileDTO;
import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

@Mapper(componentModel = "spring")
public interface VehicleMapper {

    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    @Mapping(source = "vehicleFeatures", target = "vehicleFeatures", qualifiedByName = "stringToFeatureList")
    @Mapping(source = "vehicleImages", target = "vehicleImages", qualifiedByName = "jsonToImageList")
    @Mapping(source = "user.address", target = "address", qualifiedByName = "extractDistrictAndCity")
    // @Mapping(source = "totalRatings", target = "rating")
    VehicleDTO toDTO(Vehicle vehicle);

    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    @Mapping(source = "vehicleFeatures", target = "vehicleFeatures", qualifiedByName = "stringToFeatureList")
    @Mapping(source = "vehicleImages", target = "vehicleImages", qualifiedByName = "jsonToImageList")
    @Mapping(source = "user.address", target = "address")
    @Mapping(source = "penalty", target = "penalty")
    @Mapping(target = "openTime", expression = "java(vehicle.getUser() != null && vehicle.getUser().getOpenTime() != null ? vehicle.getUser().getOpenTime().toLocalTime().format(java.time.format.DateTimeFormatter.ofPattern(\"HH:mm:ss\")) : null)")
    @Mapping(target = "closeTime", expression = "java(vehicle.getUser() != null && vehicle.getUser().getCloseTime() != null ? vehicle.getUser().getCloseTime().toLocalTime().format(java.time.format.DateTimeFormatter.ofPattern(\"HH:mm:ss\")) : null)")
    VehicleDetailDTO vehicleToVehicleDetail(Vehicle vehicle);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "brand.id", target = "brandId")
    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.id", target = "modelId")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "penalty.id", target = "penaltyId")
    @Mapping(source = "penalty.penaltyType", target = "penaltyType", qualifiedByName = "enumToString")
    @Mapping(source = "penalty.penaltyValue", target = "penaltyValue")
    @Mapping(source = "penalty.minCancelHour", target = "minCancelHour")
    @Mapping(source = "vehicleImages", target = "vehicleImages", qualifiedByName = "jsonToImageList")
    @Mapping(source = "vehicleType", target = "vehicleType", qualifiedByName = "enumToString")
    @Mapping(source = "haveDriver", target = "haveDriver", qualifiedByName = "enumToString")
    @Mapping(source = "insuranceStatus", target = "insuranceStatus", qualifiedByName = "enumToString")
    @Mapping(source = "shipToAddress", target = "shipToAddress", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "user.address", target = "address")
    @Mapping(source = "penalty", target = "penalty")
    VehicleGetDTO vehicleGet(Vehicle vehicle);

    @Named("stringToFeatureList")
    static List<VehicleFeatureDTO> stringToFeatureList(String features) {
        if (features == null || features.trim().isEmpty()) {
            return List.of();
        }

        return Arrays.stream(features.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(name -> new VehicleFeatureDTO(name))
                .collect(Collectors.toList());
    }

    @Named("enumToString")
    static String enumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }

    @Named("jsonToImageList")
    static List<VehicleImageDTO> jsonToImageList(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return List.of(); //return null if string is null
        }
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            List<String> imageUrls = objectMapper.readValue(jsonString, new TypeReference<List<String>>() {
            });
            return imageUrls.stream()
                    .map(VehicleImageDTO::new)
                    .collect(Collectors.toList());
        } catch (JsonProcessingException e) {
            System.err.println("Error parsing vehicle_image JSON: " + e.getMessage());
            return List.of(); // return null
        }
    }

    @Named("extractDistrictAndCity")
    static String extractDistrictAndCity(String fullAddress) {
        if (fullAddress == null || fullAddress.trim().isEmpty()) {
            return "";
        }
        String[] parts = fullAddress.split(",");
        if (parts.length >= 3) {
            return parts[parts.length - 2].trim() + ", " + parts[parts.length - 1].trim();
        } else if (parts.length == 2) {
            return fullAddress;
        } else {
            return fullAddress;
        }
    }

    @Named("mapToBookingResponseDTO")
    default BookingResponseDTO mapToBookingResponseDTO(Booking booking) {
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
    @Named("mapToUserProfileDTO")
    default UserProfileDTO mapToUserProfileDTO(User user) {
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
    @Named("mapToVehicleForBookingDTO")
    default VehicleForBookingDTO mapToVehicleForBookingDTO(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }
        VehicleForBookingDTO dto = VehicleForBookingDTO.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .vehicleTypes(vehicle.getVehicleType() != null ? vehicle.getVehicleType().name() : null)
                .thumb(vehicle.getThumb())
                .costPerDay(vehicle.getCostPerDay())
                .status(vehicle.getStatus().name())
                .build();

        if (vehicle.getUser() != null) {
            dto.setUser(mapToUserProfileDTO(vehicle.getUser()));
        }
        return dto;
    }
}
