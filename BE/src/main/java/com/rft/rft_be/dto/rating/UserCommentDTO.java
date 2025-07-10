package com.rft.rft_be.dto.rating;

import lombok.experimental.FieldDefaults;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCommentDTO {
    String comment;
    int star;
    LocalDateTime createdAt;
}