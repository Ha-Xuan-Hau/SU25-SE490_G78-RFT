package com.rft.rft_be.dto.user;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterProviderRequestDTO {
     String userId;
     String name;
     List<String> vehicleTypes;
     private String openTime;
     private String closeTime;
}
