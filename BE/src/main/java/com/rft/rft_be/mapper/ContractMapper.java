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
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    ContractDTO toDTO(Contract contract);

    @Mapping(source = "contract.id", target = "contractId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    FinalContractDTO finalContract(FinalContract finalContract);
    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }
}
