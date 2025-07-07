package com.rft.rft_be.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@Getter
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidInputException extends RuntimeException {

    private final String fieldName;
    private final String fieldValue;

    public InvalidInputException(String fieldName, String fieldValue) {
        // eg: Invalid field: Status, with value: OPE
        super(String.format("Invalid field: %s, with value: %s", fieldName, fieldValue));
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }
}
