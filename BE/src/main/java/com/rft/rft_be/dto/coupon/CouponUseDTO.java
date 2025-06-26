package com.rft.rft_be.dto.coupon;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class CouponUseDTO implements Serializable {
    String id;
    String name;
    BigDecimal discount;
    String description;
}