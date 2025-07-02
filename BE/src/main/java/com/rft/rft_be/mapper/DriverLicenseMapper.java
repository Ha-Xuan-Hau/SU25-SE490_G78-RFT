package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.driverLicense.DriverLicenseDTO;
import com.rft.rft_be.entity.DriverLicense;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface DriverLicenseMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "classField", target = "classField")
    @Mapping(source = "status", target = "status", qualifiedByName = "statusToString")
    DriverLicenseDTO toDTO(DriverLicense driverLicense);

    @Named("statusToString")
    default String statusToString(DriverLicense.Status status) {
        return status != null ? status.name() : null;
    }
}
