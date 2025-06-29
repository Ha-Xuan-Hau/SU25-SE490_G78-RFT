package com.rft.rft_be.dto;

import com.rft.rft_be.dto.vehicle.VehicleDTO;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryDTO {
     String categoryName;
     List<VehicleDTO> vehicles;
}