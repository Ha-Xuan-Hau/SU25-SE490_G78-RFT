package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.FinalContractDTO;
import com.rft.rft_be.entity.BookingDetail;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class ContractMapper {

    @Mapping(source = "booking.id", target = "bookingId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "user.phone", target = "userPhone")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "user.address", target = "userAddress")

    @Mapping(target = "providerId", expression = "java(getProviderId(contract))")
    @Mapping(target = "providerName", expression = "java(getProviderName(contract))")

    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")

    // Vehicle fields
    @Mapping(target = "vehicleId", expression = "java(getVehicleId(contract))")
    @Mapping(target = "vehicleLicensePlate", expression = "java(getVehicleLicensePlate(contract))")
    @Mapping(target = "vehicleType", expression = "java(getVehicleType(contract))")
    @Mapping(target = "vehicleBrand", expression = "java(getVehicleBrand(contract))")
    @Mapping(target = "vehicleModel", expression = "java(getVehicleModel(contract))")
    @Mapping(target = "vehicleNumberSeat", expression = "java(getVehicleNumberSeat(contract))")
    @Mapping(target = "vehicleYearManufacture", expression = "java(getVehicleYearManufacture(contract))")
    @Mapping(target = "vehicleTransmission", expression = "java(getVehicleTransmission(contract))")
    @Mapping(target = "vehicleFuelType", expression = "java(getVehicleFuelType(contract))")
    @Mapping(target = "vehicleCostPerDay", expression = "java(getVehicleCostPerDay(contract))")
    @Mapping(target = "vehicleThumb", expression = "java(getVehicleThumb(contract))")
    @Mapping(target = "vehicleDescription", expression = "java(getVehicleDescription(contract))")

    // Booking
    @Mapping(source = "booking.timeBookingStart", target = "bookingStartTime")
    @Mapping(source = "booking.timeBookingEnd", target = "bookingEndTime")
    @Mapping(source = "booking.address", target = "bookingAddress")
    @Mapping(source = "booking.totalCost", target = "bookingTotalCost")
    @Mapping(source = "booking.status", target = "bookingStatus", qualifiedByName = "enumToString")
    public abstract ContractDTO toDTO(Contract contract);

    @Mapping(source = "contract.id", target = "contractId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "contract.status", target = "contractStatus", qualifiedByName = "enumToString")
    public abstract FinalContractDTO finalContract(FinalContract finalContract);

    @Named("enumToString")
    protected String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }

    // --- Vehicle Field Getters ---

    protected Vehicle getFirstVehicle(Contract contract) {
        List<BookingDetail> details = contract.getBooking().getBookingDetails();
        return (details != null && !details.isEmpty()) ? details.get(0).getVehicle() : null;
    }

    protected String getProviderId(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return (v != null && v.getUser() != null) ? v.getUser().getId() : null;
    }

    protected String getProviderName(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return (v != null && v.getUser() != null) ? v.getUser().getFullName() : null;
    }

    protected String getVehicleId(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getId() : null;
    }

    protected String getVehicleLicensePlate(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getLicensePlate() : null;
    }

    protected String getVehicleType(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getVehicleType() != null ? v.getVehicleType().name() : null;
    }

    protected String getVehicleBrand(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getBrand() != null ? v.getBrand().getName() : null;
    }

    protected String getVehicleModel(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getModel() != null ? v.getModel().getName() : null;
    }

    protected Integer getVehicleNumberSeat(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getNumberSeat() : null;
    }

    protected Integer getVehicleYearManufacture(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getYearManufacture() : null;
    }

    protected String getVehicleTransmission(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getTransmission() != null ? v.getTransmission().name() : null;
    }

    protected String getVehicleFuelType(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getFuelType() != null ? v.getFuelType().name() : null;
    }

    protected BigDecimal getVehicleCostPerDay(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getCostPerDay() : null;
    }

    protected String getVehicleThumb(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getThumb() : null;
    }

    protected String getVehicleDescription(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getDescription() : null;
    }
}