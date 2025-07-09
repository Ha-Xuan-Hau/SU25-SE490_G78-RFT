package com.rft.rft_be.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "vehicle.id", target = "vehicleId")
    @Mapping(source = "vehicle.licensePlate", target = "vehicleLicensePlate")
    @Mapping(source = "vehicle.vehicleType", target = "vehicleType", qualifiedByName = "enumToString")
    @Mapping(source = "vehicle.thumb", target = "vehicleThumb")
    @Mapping(source = "vehicle.vehicleImages", target = "vehicleImage", qualifiedByName = "getFirstImageFromJson")
    // Additional vehicle information
    @Mapping(source = "vehicle.brand.name", target = "vehicleBrand")
    @Mapping(source = "vehicle.model.name", target = "vehicleModel")
    @Mapping(source = "vehicle.numberSeat", target = "vehicleNumberSeat")
    @Mapping(source = "vehicle.yearManufacture", target = "vehicleYearManufacture")
    @Mapping(source = "vehicle.transmission", target = "vehicleTransmission", qualifiedByName = "enumToString")
    @Mapping(source = "vehicle.fuelType", target = "vehicleFuelType", qualifiedByName = "enumToString")
    @Mapping(source = "vehicle.costPerDay", target = "vehicleCostPerDay")
    @Mapping(source = "vehicle.description", target = "vehicleDescription")
    @Mapping(source = "vehicle.user.id", target = "vehicleProviderId")

    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    // Penalty information - these are direct fields in Booking entity
    @Mapping(source = "penaltyType", target = "penaltyType", qualifiedByName = "enumToString")
    @Mapping(source = "penaltyValue", target = "penaltyValue")
    @Mapping(source = "minCancelHour", target = "minCancelHour")
    BookingDTO toDTO(Booking booking);

    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }

    @Named("getFirstImageFromJson")
    static String getFirstImageFromJson(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            List<String> imageUrls = objectMapper.readValue(jsonString, new TypeReference<List<String>>() {
            });
            return !imageUrls.isEmpty() ? imageUrls.get(0) : null;
        } catch (JsonProcessingException e) {
            System.err.println("Error parsing vehicle_image JSON: " + e.getMessage());
            return null;
        }
    }
}
