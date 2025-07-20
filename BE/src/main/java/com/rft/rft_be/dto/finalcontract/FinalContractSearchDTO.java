package com.rft.rft_be.dto.finalcontract;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalContractSearchDTO {
    private String bookingId;
    @Email(message = "Invalid renter email format")
    private String renterEmail;

    @Email(message = "Invalid vehicle owner email format")
    private String vehicleOwnerEmail;
    private String sortBy;
    private String order;
}
