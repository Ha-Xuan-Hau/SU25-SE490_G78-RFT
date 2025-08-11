package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.report.ReportDTO;
import com.rft.rft_be.dto.report.ReportRequest;
import com.rft.rft_be.entity.UserReport;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ReportMapper {

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "type", source = "type")
    @Mapping(target = "reason", source = "reason")
    @Mapping(target = "reportedId", source = "targetId")
    @Mapping(target = "evidenceUrl", source = "evidenceUrl")

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "booking", ignore = true)
    @Mapping(target = "reporter", ignore = true)
    @Mapping(target = "createdAt", ignore = true)

    UserReport toEntity(ReportRequest request);
}
