package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.finalcontract.FinalContractDTO;
import com.rft.rft_be.entity.BookingDetail;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ContractMapper {

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
    ContractDTO toDTO(Contract contract);

    @Mapping(source = "contract.id", target = "contractId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "contract.status", target = "contractStatus", qualifiedByName = "enumToString")
    @Mapping(target = "providerId", expression = "java(getProviderIdFromFinalContract(finalContract))")
    @Mapping(target = "providerName", expression = "java(getProviderNameFromFinalContract(finalContract))")
    @Mapping(target = "providerEmail", expression = "java(getProviderEmailFromFinalContract(finalContract))")
    @Mapping(target = "providerPhone", expression = "java(getProviderPhoneFromFinalContract(finalContract))")
    @Mapping(target = "providerBankAccountNumber", expression = "java(getProviderBankAccountNumberFromFinalContract(finalContract))")
    @Mapping(target = "providerBankAccountName", expression = "java(getProviderBankAccountNameFromFinalContract(finalContract))")
    @Mapping(target = "providerBankAccountType", expression = "java(getProviderBankAccountTypeFromFinalContract(finalContract))")
    FinalContractDTO finalContract(FinalContract finalContract);

    // ------------------ Helpers ------------------

    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }

    default Vehicle getFirstVehicle(Contract contract) {
        List<BookingDetail> details = contract.getBooking().getBookingDetails();
        return (details != null && !details.isEmpty()) ? details.get(0).getVehicle() : null;
    }

    default Vehicle getFirstVehicleFromFinalContract(FinalContract finalContract) {
        List<BookingDetail> details = finalContract.getContract().getBooking().getBookingDetails();
        return (details != null && !details.isEmpty()) ? details.get(0).getVehicle() : null;
    }

    default String getProviderId(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return (v != null && v.getUser() != null) ? v.getUser().getId() : null;
    }

    default String getProviderName(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return (v != null && v.getUser() != null) ? v.getUser().getFullName() : null;
    }

    default String getProviderIdFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        return (v != null && v.getUser() != null) ? v.getUser().getId() : null;
    }

    default String getProviderNameFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        return (v != null && v.getUser() != null) ? v.getUser().getFullName() : null;
    }

    default String getProviderEmailFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        return (v != null && v.getUser() != null) ? v.getUser().getEmail() : null;
    }

    default String getProviderPhoneFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        return (v != null && v.getUser() != null) ? v.getUser().getPhone() : null;
    }

    default String getVehicleId(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getId() : null;
    }

    default String getVehicleLicensePlate(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getLicensePlate() : null;
    }

    default String getVehicleType(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getVehicleType() != null ? v.getVehicleType().name() : null;
    }

    default String getVehicleBrand(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getBrand() != null ? v.getBrand().getName() : null;
    }

    default String getVehicleModel(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getModel() != null ? v.getModel().getName() : null;
    }

    default Integer getVehicleNumberSeat(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getNumberSeat() : null;
    }

    default Integer getVehicleYearManufacture(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getYearManufacture() : null;
    }

    default String getVehicleTransmission(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getTransmission() != null ? v.getTransmission().name() : null;
    }

    default String getVehicleFuelType(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null && v.getFuelType() != null ? v.getFuelType().name() : null;
    }

    default BigDecimal getVehicleCostPerDay(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getCostPerDay() : null;
    }

    default String getVehicleThumb(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getThumb() : null;
    }

    default String getVehicleDescription(Contract contract) {
        Vehicle v = getFirstVehicle(contract);
        return v != null ? v.getDescription() : null;
    }

    // --- Bank info helpers ---
    default String getProviderBankAccountNumberFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        if (v != null && v.getUser() != null && v.getUser().getId() != null) {
            // You need to inject WalletRepository/WalletService here in real code
            // For now, return null or implement in service layer
            return null;
        }
        return null;
    }
    default String getProviderBankAccountNameFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        if (v != null && v.getUser() != null && v.getUser().getId() != null) {
            return null;
        }
        return null;
    }
    default String getProviderBankAccountTypeFromFinalContract(FinalContract finalContract) {
        Vehicle v = getFirstVehicleFromFinalContract(finalContract);
        if (v != null && v.getUser() != null && v.getUser().getId() != null) {
            return null;
        }
        return null;
    }
}