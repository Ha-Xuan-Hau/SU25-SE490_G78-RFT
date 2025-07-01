package com.rft.rft_be.dto.rating;

import lombok.experimental.FieldDefaults;
import lombok.*;
import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCommentDTO {
    String userName;
    String userImage;
    String comment;
    int star;
    Instant createdAt;
}