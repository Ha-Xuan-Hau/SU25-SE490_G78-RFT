package com.rft.rft_be.dto.vehicle.vehicleRent;

import com.rft.rft_be.dto.vehicle.VehicleImageDTO;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleBulkRequest {
    String userId;
    String brandId;
    String modelId;
    String penaltyId;
    String licensePlate;
    String vehicleType;
    String vehicleFeatures;
    List<VehicleImageDTO> vehicleImages;
    String haveDriver;
    String insuranceStatus; // YES, NO
    String shipToAddress; // YES, NO
    Integer numberSeat;
    Integer yearManufacture;
    String transmission; // MANUAL, AUTOMATIC
    String fuelType; // GASOLINE, ELECTRIC
    String description;
    Integer numberVehicle;
    BigDecimal costPerDay;
    String status; // AVAILABLE, UNAVAILABLE
    String thumb;
}
