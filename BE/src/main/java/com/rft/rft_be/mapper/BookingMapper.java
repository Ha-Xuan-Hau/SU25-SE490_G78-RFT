package com.rft.rft_be.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.BookingDetail;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")

    @Mapping(target = "vehicleId", expression = "java(getVehicleFieldAsString(booking, \"id\"))")
    @Mapping(target = "vehicleLicensePlate", expression = "java(getVehicleFieldAsString(booking, \"licensePlate\"))")
    @Mapping(target = "vehicleType", expression = "java(getVehicleFieldAsString(booking, \"vehicleType\"))")
    @Mapping(target = "vehicleThumb", expression = "java(getVehicleFieldAsString(booking, \"thumb\"))")
    @Mapping(target = "vehicleImage", expression = "java(getVehicleFieldAsString(booking, \"firstImage\"))")
    @Mapping(target = "vehicleBrand", expression = "java(getVehicleFieldAsString(booking, \"brand\"))")
    @Mapping(target = "vehicleModel", expression = "java(getVehicleFieldAsString(booking, \"model\"))")
    @Mapping(target = "vehicleTransmission", expression = "java(getVehicleFieldAsString(booking, \"transmission\"))")
    @Mapping(target = "vehicleFuelType", expression = "java(getVehicleFieldAsString(booking, \"fuelType\"))")
    @Mapping(target = "vehicleDescription", expression = "java(getVehicleFieldAsString(booking, \"description\"))")
    @Mapping(target = "vehicleProviderId", expression = "java(getVehicleFieldAsString(booking, \"providerId\"))")

    @Mapping(target = "vehicleNumberSeat", expression = "java(getVehicleFieldAsInteger(booking, \"numberSeat\"))")
    @Mapping(target = "vehicleYearManufacture", expression = "java(getVehicleFieldAsInteger(booking, \"yearManufacture\"))")
    @Mapping(target = "vehicleCostPerDay", expression = "java(getVehicleFieldAsBigDecimal(booking, \"costPerDay\"))")

    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "penaltyType", target = "penaltyType", qualifiedByName = "enumToString")
    @Mapping(source = "penaltyValue", target = "penaltyValue")
    @Mapping(source = "minCancelHour", target = "minCancelHour")
    BookingDTO toDTO(Booking booking);

    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }

    // Helper: lấy vehicle đầu tiên trong danh sách
    default Vehicle getFirstVehicle(Booking booking) {
        List<BookingDetail> details = booking.getBookingDetails();
        return (details != null && !details.isEmpty()) ? details.get(0).getVehicle() : null;
    }

    // General field access
    default Object getVehicleField(Booking booking, String field) {
        Vehicle v = getFirstVehicle(booking);
        if (v == null) return null;

        return switch (field) {
            case "id" -> v.getId();
            case "licensePlate" -> v.getLicensePlate();
            case "vehicleType" -> enumToString(v.getVehicleType());
            case "thumb" -> v.getThumb();
            case "brand" -> v.getBrand() != null ? v.getBrand().getName() : null;
            case "model" -> v.getModel() != null ? v.getModel().getName() : null;
            case "numberSeat" -> v.getNumberSeat();
            case "yearManufacture" -> v.getYearManufacture();
            case "transmission" -> enumToString(v.getTransmission());
            case "fuelType" -> enumToString(v.getFuelType());
            case "costPerDay" -> v.getCostPerDay();
            case "description" -> v.getDescription();
            case "providerId" -> v.getUser() != null ? v.getUser().getId() : null;
            case "firstImage" -> getFirstImageFromJson(v.getVehicleImages());
            default -> null;
        };
    }

    // Type-specific helpers
    default String getVehicleFieldAsString(Booking booking, String field) {
        Object val = getVehicleField(booking, field);
        return val != null ? val.toString() : null;
    }

    default Integer getVehicleFieldAsInteger(Booking booking, String field) {
        Object val = getVehicleField(booking, field);
        return val instanceof Integer ? (Integer) val : null;
    }

    default BigDecimal getVehicleFieldAsBigDecimal(Booking booking, String field) {
        Object val = getVehicleField(booking, field);
        return val instanceof BigDecimal ? (BigDecimal) val : null;
    }

    @Named("getFirstImageFromJson")
    static String getFirstImageFromJson(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            List<String> imageUrls = objectMapper.readValue(jsonString, new TypeReference<List<String>>() {});
            return !imageUrls.isEmpty() ? imageUrls.get(0) : null;
        } catch (JsonProcessingException e) {
            System.err.println("Error parsing vehicle_image JSON: " + e.getMessage());
            return null;
        }
    }
}