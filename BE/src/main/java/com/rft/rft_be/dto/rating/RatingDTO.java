package com.rft.rft_be.dto.rating;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingDTO {
    String id;
    String userId;
    String vehicleId;
    String bookingId;
    String comment;
    int star;
    Instant createdAt;
    Instant updatedAt;
}
