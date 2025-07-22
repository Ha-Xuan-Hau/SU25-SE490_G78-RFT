package com.rft.rft_be.dto.admin;

import com.rft.rft_be.entity.Vehicle;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateVehicleStatusDTO {
    @NotNull(message = "Trạng thái không được trống")
    private Vehicle.Status status;

    private String rejectReason;
}
