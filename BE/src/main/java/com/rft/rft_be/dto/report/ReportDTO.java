package com.rft.rft_be.dto.report;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
// DTO đại diện cho một loại lỗi cụ thể và số lần bị báo cáo
public class ReportDTO {

    private String type;//Loại báo cáo
    private long count; //Số lần bị báo cáo
}
