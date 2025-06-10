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
    @Mapping(source = "status", target = "status")
    @Mapping(source = "fuelType", target = "fuelType")
    @Mapping(source = "transmission", target = "transmission")
    VehicleDTO toDTO(Vehicle vehicle);



    @Named("enumToString")
    static String enumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }
}