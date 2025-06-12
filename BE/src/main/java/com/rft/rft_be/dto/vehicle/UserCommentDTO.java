package com.rft.rft_be.dto.vehicle;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCommentDTO {
    String userName;
    String userImage;
    String comment;
    Integer star;
}
