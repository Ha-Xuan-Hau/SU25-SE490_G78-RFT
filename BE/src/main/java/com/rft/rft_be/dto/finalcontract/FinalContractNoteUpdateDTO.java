package com.rft.rft_be.dto.finalcontract;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalContractNoteUpdateDTO {
    @NotBlank
    private String note;
}
