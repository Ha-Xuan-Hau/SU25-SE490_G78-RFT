package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = {})
public interface BookingResponseMapper {
    @Mapping(source = "vehicle.vehicleType", target = "vehicle.vehicleTypes", qualifiedByName = "enumToString")
    @Mapping(source = "penaltyType", target = "penaltyType", qualifiedByName = "bookingEnumToString")
    @Mapping(source = "timeTransaction", target = "timeTransaction")
    @Mapping(source = "coupon.id", target = "couponId")
    BookingResponseDTO toResponseDTO(Booking booking);

    @Named("bookingEnumToString")
    default String bookingEnumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }
    @Named("enumToString")
    static String enumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }
}