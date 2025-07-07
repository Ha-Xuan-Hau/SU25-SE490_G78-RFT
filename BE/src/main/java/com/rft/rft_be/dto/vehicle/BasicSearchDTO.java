package com.rft.rft_be.dto.vehicle;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BasicSearchDTO {
    String address;
    String vehicleType;
    String pickupDateTime;
    String returnDateTime;
    int page = 0;
    int size = 10;
}