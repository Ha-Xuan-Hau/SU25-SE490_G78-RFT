package com.rft.rft_be.dto.error;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class ValidationErrorResponse {
    private Map<String, String> errors;
}
