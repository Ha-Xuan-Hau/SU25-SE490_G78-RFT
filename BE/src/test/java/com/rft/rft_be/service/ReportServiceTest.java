package com.rft.rft_be.service;

import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.UserReport;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.ReportMapper;
import com.rft.rft_be.repository.UserReportRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.report.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock private UserReportRepository reportRepo;
    @Mock private UserRepository userRepo;
    @Mock private VehicleRepository vehicleRepo;
    @Mock private ReportMapper mapper;

    @InjectMocks private ReportServiceImpl reportService;

    private ReportRequest request;
    private User reporter;

    @BeforeEach
    void setUp() {
        reporter = new User();
        reporter.setId("user1");
        reporter.setFullName("John Doe");
        reporter.setEmail("john@example.com");

        request = new ReportRequest();
        request.setTargetId("target123");
        request.setReason("Vi phạm");
        request.setType("Lừa đảo");
    }

    @Test
    void testReport_withSeriousErrorType() {
        UserReport entity = new UserReport();
        when(mapper.toEntity(request)).thenReturn(entity);

        reportService.report(reporter, request);

        assertEquals("SERIOUS_ERROR", request.getGeneralType());
        verify(reportRepo).save(entity);
    }

    @Test
    void testReport_withNonSeriousType() {
        request.setType("Spam");
        UserReport entity = new UserReport();
        when(mapper.toEntity(request)).thenReturn(entity);

        reportService.report(reporter, request);

        assertEquals("NON_SERIOUS_ERROR", request.getGeneralType());
        verify(reportRepo).save(entity);
    }

    @Test
    void testReport_withUnknownTypeDefaultsToNonSerious() {
        request.setType("XYZ_UNKNOWN");
        UserReport entity = new UserReport();
        when(mapper.toEntity(request)).thenReturn(entity);

        reportService.report(reporter, request);

        assertEquals("NON_SERIOUS_ERROR", request.getGeneralType());
    }

    @Test
    void testGetReportsByType() {
        UserReport r1 = new UserReport();
        r1.setReportedId("userX");
        r1.setType("Lừa đảo");

        when(reportRepo.findAll()).thenReturn(List.of(r1));
        when(userRepo.findById("userX")).thenReturn(Optional.of(reporter));

        List<ReportGroupedByTargetDTO> result = reportService.getReportsByType("SERIOUS_ERROR", 0, 10);
        assertEquals(1, result.size());
    }

    @Test
    void testSearchReports() {
        UserReport r1 = new UserReport();
        r1.setReportedId("userX");
        r1.setType("Spam");

        when(reportRepo.findAll()).thenReturn(List.of(r1));
        when(userRepo.findById("userX")).thenReturn(Optional.of(reporter));

        List<ReportGroupedByTargetDTO> result = reportService.searchReports("NON_SERIOUS_ERROR", "john", "Spam", 0, 10);
        assertEquals(1, result.size());
    }

    @Test
    void testGetReportDetailByTargetAndType_emptyListReturnsNull() {
        when(reportRepo.findByReportedIdAndType("targetX", "Spam")).thenReturn(Collections.emptyList());

        ReportDetailDTO result = reportService.getReportDetailByTargetAndType("targetX", "Spam");

        assertNull(result);
    }

    @Test
    void testGetReportDetailByTargetAndType_success() {
        UserReport report = new UserReport();
        report.setId("r1");
        report.setType("Spam");
        report.setReportedId("target123");
        report.setReason("abc");
        report.setCreatedAt(LocalDateTime.now());
        report.setReporter(reporter);

        when(reportRepo.findByReportedIdAndType("target123", "Spam")).thenReturn(List.of(report));
        when(userRepo.findById("target123")).thenReturn(Optional.of(reporter));

        ReportDetailDTO result = reportService.getReportDetailByTargetAndType("target123", "Spam");

        assertNotNull(result);
        assertEquals("Spam", result.getReportSummary().getType());
        assertEquals("John Doe", result.getReportedUser().getFullName());
    }
    @Test
    void testReport_withStaffType() {
        request.setType("Report by staff");
        UserReport entity = new UserReport();
        when(mapper.toEntity(request)).thenReturn(entity);

        reportService.report(reporter, request);

        assertEquals("STAFF_ERROR", request.getGeneralType());
        verify(reportRepo).save(entity);
    }
    @Test
    void testSearchReports_withNullKeywordAndType() {
        UserReport r1 = new UserReport();
        r1.setReportedId("userX");
        r1.setType("Không phù hợp");

        when(reportRepo.findAll()).thenReturn(List.of(r1));
        when(userRepo.findById("userX")).thenReturn(Optional.of(reporter));

        List<ReportGroupedByTargetDTO> result = reportService.searchReports("NON_SERIOUS_ERROR", null, null, 0, 10);
        assertEquals(1, result.size());
    }
    @Test
    void testGetReportsByType_withStaffError() {
        UserReport r1 = new UserReport();
        r1.setReportedId("userX");
        r1.setType("Report by staff");

        when(reportRepo.findAll()).thenReturn(List.of(r1));
        when(userRepo.findById("userX")).thenReturn(Optional.of(reporter));

        List<ReportGroupedByTargetDTO> result = reportService.getReportsByType("STAFF_ERROR", 0, 10);
        assertEquals(1, result.size());
    }
}
