package com.rft.rft_be.dto.vehicle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableVehicleListWithQuantityDTO {
    private int quantity;
    private List<VehicleGetDTO> data;
}
