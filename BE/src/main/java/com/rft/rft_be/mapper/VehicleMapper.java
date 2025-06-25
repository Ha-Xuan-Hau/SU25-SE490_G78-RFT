package com.rft.rft_be.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.vehicle.*;
import com.rft.rft_be.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface VehicleMapper {

    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    @Mapping(source = "vehicleFeatures", target = "vehicleFeatures", qualifiedByName = "stringToFeatureList")
    @Mapping(source = "vehicleImages", target = "vehicleImages", qualifiedByName = "jsonToImageList")
    @Mapping(source = "user.address", target = "address", qualifiedByName = "extractDistrictAndCity")
    // @Mapping(source = "totalRatings", target = "rating")
    VehicleDTO toDTO(Vehicle vehicle);

    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "status", target = "status", qualifiedByName = "enumToString")
    @Mapping(source = "fuelType", target = "fuelType", qualifiedByName = "enumToString")
    @Mapping(source = "transmission", target = "transmission", qualifiedByName = "enumToString")
    @Mapping(source = "vehicleFeatures", target = "vehicleFeatures", qualifiedByName = "stringToFeatureList")
    @Mapping(source = "vehicleImages", target = "vehicleImages", qualifiedByName = "jsonToImageList")
    @Mapping(source = "user.address", target = "address", qualifiedByName = "extractDistrictAndCity")
    VehicleDetailDTO vehicleToVehicleDetail(Vehicle vehicle);

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
    @Mapping(source = "vehicleType", target = "vehicleType", qualifiedByName = "enumToString")
    @Mapping(source = "haveDriver", target = "haveDriver", qualifiedByName = "enumToString")
    VehicleGetDTO vehicleGet(Vehicle vehicle);


    @Named("stringToFeatureList")
    static List<VehicleFeatureDTO> stringToFeatureList(String features) {
        if (features == null || features.trim().isEmpty()) {
            return List.of();
        }

        return Arrays.stream(features.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(name -> new VehicleFeatureDTO(name))
                .collect(Collectors.toList());
    }

    @Named("enumToString")
    static String enumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }

    @Named("jsonToImageList")
    static List<VehicleImageDTO> jsonToImageList(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return List.of(); //return null if string is null
        }
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            List<String> imageUrls = objectMapper.readValue(jsonString, new TypeReference<List<String>>() {
            });
            return imageUrls.stream()
                    .map(VehicleImageDTO::new)
                    .collect(Collectors.toList());
        } catch (JsonProcessingException e) {
            System.err.println("Error parsing vehicle_image JSON: " + e.getMessage());
            return List.of(); // return null
        }
    }

    @Named("extractDistrictAndCity")
    static String extractDistrictAndCity(String fullAddress) {
        if (fullAddress == null || fullAddress.trim().isEmpty()) {
            return "";
        }
        String[] parts = fullAddress.split(",");
        if (parts.length >= 3) {
            return parts[parts.length - 2].trim() + ", " + parts[parts.length - 1].trim();
        } else if (parts.length == 2) {
            return fullAddress;
        } else {
            return fullAddress;
        }
    }
}
