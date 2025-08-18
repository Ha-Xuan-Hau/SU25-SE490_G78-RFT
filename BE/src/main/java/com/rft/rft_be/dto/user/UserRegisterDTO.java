package com.rft.rft_be.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRegisterDTO {
    @Email
    @NotBlank
    String email;
    @NotBlank
    String password;
    @NotBlank
    String phone;
//    @NotBlank
//    String address;
    @NotBlank
    String otp;
}