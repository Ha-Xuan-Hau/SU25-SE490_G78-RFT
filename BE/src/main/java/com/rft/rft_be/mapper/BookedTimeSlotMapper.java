package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.booking.BookedSlotResponse;
import com.rft.rft_be.entity.BookedTimeSlot;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface BookedTimeSlotMapper {

    BookedSlotResponse toBookedSlotResponseDto(BookedTimeSlot bookedTimeSlot);
}