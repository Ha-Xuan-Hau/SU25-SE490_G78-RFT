package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.VehicleDTO;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface VehicleMapper {

    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    VehicleDTO toDTO(Vehicle vehicle);

    @Named("enumToString")
    static String enumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }
}