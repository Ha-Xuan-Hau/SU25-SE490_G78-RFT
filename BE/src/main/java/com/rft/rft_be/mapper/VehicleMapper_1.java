package com.rft.rft_be.mapper;


import com.rft.rft_be.dto.vehicle.VehicleDTO_1;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface VehicleMapper_1 {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "brand.id", target = "brandId")
    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.id", target = "modelId")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "insuranceStatus", target = "insuranceStatus", qualifiedByName = "enumToString")
    @Mapping(source = "shipToAddress", target = "shipToAddress", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    VehicleDTO_1 toDTO(Vehicle vehicle);

    @Named("enumToString")
    default String enumToString(Enum<?> enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }
}

