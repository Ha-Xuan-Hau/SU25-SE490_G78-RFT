package com.rft.rft_be.dto.vehicle.vehicleRent;

import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleThumbGroupDTO {
    private String thumb;
    private List<VehicleDetailDTO> vehicle;
    private Integer vehicleNumber;
} 