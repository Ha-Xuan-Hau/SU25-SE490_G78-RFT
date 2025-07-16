package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.booking.BookingResponseDTO;
import com.rft.rft_be.dto.vehicle.VehicleForBookingDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.BookingDetail;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {VehicleMapper.class})
public abstract class BookingResponseMapper {

    @Autowired
    protected VehicleMapper vehicleMapper;

    @Mapping(source = "penaltyType", target = "penaltyType", qualifiedByName = "bookingEnumToString")
    @Mapping(source = "timeTransaction", target = "timeTransaction")
    @Mapping(source = "coupon.id", target = "couponId")
    public abstract BookingResponseDTO toResponseDTO(Booking booking);

    @Named("bookingEnumToString")
    protected String bookingEnumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }

    @AfterMapping
    protected void mapVehicles(Booking booking, @MappingTarget BookingResponseDTO dto) {
        if (booking.getBookingDetails() != null && !booking.getBookingDetails().isEmpty()) {
            List<VehicleForBookingDTO> vehicleDTOs = booking.getBookingDetails().stream()
                    .map(detail -> vehicleMapper.mapToVehicleForBookingDTO(detail.getVehicle()))
                    .collect(Collectors.toList());
            dto.setVehicles(vehicleDTOs);
        }
    }
}