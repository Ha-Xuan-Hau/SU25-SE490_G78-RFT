package com.rft.rft_be.mapper;


import com.rft.rft_be.dto.penalty.PenaltyDTO;
import com.rft.rft_be.dto.penalty.CreatePenaltyDTO;
import com.rft.rft_be.entity.Penalty;
import com.rft.rft_be.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface PenaltyMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "penaltyType", target = "penaltyType", qualifiedByName = "enumToString")
    PenaltyDTO toDTO(Penalty penalty);

    @Mapping(source = "userId", target = "user", qualifiedByName = "userIdToUser")
    @Mapping(source = "penaltyType", target = "penaltyType", qualifiedByName = "stringToEnum")
    Penalty toEntity(CreatePenaltyDTO createPenaltyDTO);

    @Named("enumToString")
    default String enumToString(Penalty.PenaltyType enumValue) {
        return enumValue != null ? enumValue.name() : null;
    }

    @Named("stringToEnum")
    default Penalty.PenaltyType stringToEnum(String value) {
        return value != null ? Penalty.PenaltyType.valueOf(value.toUpperCase()) : null;
    }

    @Named("userIdToUser")
    default User userIdToUser(String userId) {
        if (userId == null) return null;
        User user = new User();
        user.setId(userId);
        return user;
    }
}