package com.rft.rft_be.dto.user;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterProviderRequestDTO {
     String userId;
     List<String> vehicleTypes;
}
