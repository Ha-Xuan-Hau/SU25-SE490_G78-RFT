package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.UserReport;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ReportMapper {
    @Mapping(source = "reporter.id", target = "reporterId")
    @Mapping(source = "reportedId", target = "targetId")
    ReportDTO toDto(UserReport entity);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "type", source = "type")
    @Mapping(target = "reason", source = "reason")
    @Mapping(target = "reportedId", source = "targetId")
    UserReport toEntity(ReportRequest request);


}
