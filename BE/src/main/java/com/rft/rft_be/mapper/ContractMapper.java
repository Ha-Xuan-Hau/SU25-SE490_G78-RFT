package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.FinalContractDTO;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.FinalContract;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ContractMapper {

    @Mapping(source = "booking.id", target = "bookingId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "user.phone", target = "userPhone")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "user.address", target = "userAddress")
    @Mapping(source = "booking.vehicle.user.id", target = "providerId")
    @Mapping(source = "booking.vehicle.user.fullName", target = "providerName")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    // Vehicle mappings
    @Mapping(source = "booking.vehicle.id", target = "vehicleId")
    @Mapping(source = "booking.vehicle.licensePlate", target = "vehicleLicensePlate")
    @Mapping(source = "booking.vehicle.vehicleType", target = "vehicleType", qualifiedByName = "enumToString")
    @Mapping(source = "booking.vehicle.brand.name", target = "vehicleBrand")
    @Mapping(source = "booking.vehicle.model.name", target = "vehicleModel")
    @Mapping(source = "booking.vehicle.numberSeat", target = "vehicleNumberSeat")
    @Mapping(source = "booking.vehicle.yearManufacture", target = "vehicleYearManufacture")
    @Mapping(source = "booking.vehicle.transmission", target = "vehicleTransmission")
    @Mapping(source = "booking.vehicle.fuelType", target = "vehicleFuelType")
    @Mapping(source = "booking.vehicle.costPerDay", target = "vehicleCostPerDay")
    @Mapping(source = "booking.vehicle.thumb", target = "vehicleThumb")
    @Mapping(source = "booking.vehicle.description", target = "vehicleDescription")
    // Booking mappings
    @Mapping(source = "booking.timeBookingStart", target = "bookingStartTime")
    @Mapping(source = "booking.timeBookingEnd", target = "bookingEndTime")
    @Mapping(source = "booking.address", target = "bookingAddress")
    @Mapping(source = "booking.totalCost", target = "bookingTotalCost")
    @Mapping(source = "booking.status", target = "bookingStatus", qualifiedByName = "enumToString")
    ContractDTO toDTO(Contract contract);

    @Mapping(source = "contract.id", target = "contractId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "contract.status", target = "contractStatus", qualifiedByName = "enumToString")
    FinalContractDTO finalContract(FinalContract finalContract);

    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }
}
