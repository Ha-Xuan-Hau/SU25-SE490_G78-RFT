package com.rft.rft_be.dto.rating;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingDTO {
    String id;
    String userId;
    String userName;
    String userImage;
    String vehicleId;
    String bookingId;
    String comment;
    int star;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
