package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.extraFeeRule.ExtraFeeRuleDTO;
import com.rft.rft_be.entity.ExtraFeeRule;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ExtraFeeRuleMapper {
    ExtraFeeRule toEntity(ExtraFeeRuleDTO extraFeeRuleDTO);

    ExtraFeeRuleDTO toDto(ExtraFeeRule extraFeeRule);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    ExtraFeeRule partialUpdate(ExtraFeeRuleDTO extraFeeRuleDTO, @MappingTarget ExtraFeeRule extraFeeRule);
}