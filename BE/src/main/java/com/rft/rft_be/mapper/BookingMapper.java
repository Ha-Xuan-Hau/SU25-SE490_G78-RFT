package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.booking.BookingDTO;
import com.rft.rft_be.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface BookingMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "vehicle.id", target = "vehicleId")
    @Mapping(source = "vehicle.licensePlate", target = "vehicleLicensePlate")
    @Mapping(source = "vehicle.vehicleType", target = "vehicleType", qualifiedByName = "enumToString")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    BookingDTO toDTO(Booking booking);

    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }
}
