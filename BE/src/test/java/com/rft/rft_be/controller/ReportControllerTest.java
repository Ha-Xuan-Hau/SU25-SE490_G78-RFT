package com.rft.rft_be.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rft.rft_be.dto.report.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.service.report.ReportService;
import com.rft.rft_be.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.http.MediaType;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportControllerTest {

    @Mock ReportService reportService;
    @Mock UserRepository userRepo;

    @InjectMocks ReportController reportController;

    MockMvc mockMvc;
    ObjectMapper objectMapper;

    User reporter;
    ReportRequest request;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(reportController).build();
        objectMapper = new ObjectMapper();

        reporter = new User();
        reporter.setId("u1");
        reporter.setFullName("User A");
        reporter.setEmail("userA@mail.com");

        request = new ReportRequest();
        request.setTargetId("target123");
        request.setReason("Vi phạm");
        request.setType("Lừa đảo");
        request.setGeneralType("SERIOUS_ERROR");
    }

    private JwtAuthenticationToken mockAuthToken(String userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claims(c -> {
                    c.put("userId", userId);
                    c.put("role", role);
                })
                .build();

        return new JwtAuthenticationToken(jwt);
    }

    @Test
    void testCreateReport() throws Exception {
        when(userRepo.findById("u1")).thenReturn(Optional.of(reporter));

        JwtAuthenticationToken jwtAuth = mockAuthToken("u1", "USER");

        SecurityContextHolder.getContext().setAuthentication(jwtAuth);

        mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(reportService).report(any(User.class), any(ReportRequest.class));

        SecurityContextHolder.clearContext();
    }


    @Test
    void testCreateReportByStaff_success() throws Exception {
        when(userRepo.findById("staff1")).thenReturn(Optional.of(reporter));

        JwtAuthenticationToken jwtAuth = mockAuthToken("staff1", "STAFF");
        SecurityContextHolder.getContext().setAuthentication(jwtAuth);

        mockMvc.perform(post("/api/reports/staff")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(reportService).report(any(User.class), any(ReportRequest.class));

        SecurityContextHolder.clearContext();
    }
    @Test
    void testGetReportsByType() throws Exception {
        List<ReportGroupedByTargetDTO> reports = List.of(
                new ReportGroupedByTargetDTO("t1", "A", "a@gmail.com", "Lừa đảo", 2)
        );
        when(reportService.getReportsByType("SERIOUS_ERROR", 0, 10)).thenReturn(reports);

        mockMvc.perform(get("/api/reports?type=SERIOUS_ERROR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].targetId").value("t1"))
                .andExpect(jsonPath("$[0].type").value("Lừa đảo"));
    }

    @Test
    void testSearchReports() throws Exception {
        List<ReportGroupedByTargetDTO> reports = List.of(
                new ReportGroupedByTargetDTO("t1", "B", "b@gmail.com", "Spam", 3)
        );
        when(reportService.searchReports("NON_SERIOUS_ERROR", "B", "Spam", 0, 10)).thenReturn(reports);

        mockMvc.perform(get("/api/reports/search")
                        .param("generalType", "NON_SERIOUS_ERROR")
                        .param("keyword", "B")
                        .param("type", "Spam"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("Spam"))
                .andExpect(jsonPath("$[0].count").value(3));
    }

    @Test
    void testGetReportDetail() throws Exception {
        ReportDetailDTO dto = new ReportDetailDTO();
        dto.setReportSummary(new ReportSummaryDTO());
        dto.setReportedUser(new ReportedUserDTO());
        dto.setReporters(new ArrayList<>());

        when(reportService.getReportDetailByTargetAndType("target123", "Spam")).thenReturn(dto);

        mockMvc.perform(get("/api/reports/detail/target123")
                        .param("type", "Spam"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetReportDetail_notFound() throws Exception {
        when(reportService.getReportDetailByTargetAndType("targetXYZ", "Spam")).thenReturn(null);

        mockMvc.perform(get("/api/reports/detail/targetXYZ")
                        .param("type", "Spam"))
                .andExpect(status().isOk())
                .andExpect(content().string(""));
    }
    @Test
    void testCreateReportByStaff_asStaff() throws Exception {
        User staffUser = new User();
        staffUser.setId("staff123");
        staffUser.setRole(User.Role.STAFF);

        when(userRepo.findById("staff123")).thenReturn(Optional.of(staffUser));

        JwtAuthenticationToken jwtAuth = mockAuthToken("staff123", "STAFF");
        SecurityContextHolder.getContext().setAuthentication(jwtAuth);

        mockMvc.perform(post("/api/reports/staff")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(reportService).report(any(User.class), any(ReportRequest.class));
        SecurityContextHolder.clearContext();
    }
    @Test
    void testCreateReportByStaff_asAdmin() throws Exception {
        User adminUser = new User();
        adminUser.setId("admin123");
        adminUser.setRole(User.Role.ADMIN);

        when(userRepo.findById("admin123")).thenReturn(Optional.of(adminUser));

        JwtAuthenticationToken jwtAuth = mockAuthToken("admin123", "ADMIN");
        SecurityContextHolder.getContext().setAuthentication(jwtAuth);

        mockMvc.perform(post("/api/reports/staff")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(reportService).report(any(User.class), any(ReportRequest.class));
        SecurityContextHolder.clearContext();
    }
    @Test
    void testGetReportDetail_returnNull() throws Exception {
        when(reportService.getReportDetailByTargetAndType("nonexistent-id", "Spam")).thenReturn(null);

        mockMvc.perform(get("/api/reports/detail/nonexistent-id")
                        .param("type", "Spam"))
                .andExpect(status().isOk())
                .andExpect(content().string("")); // hoặc kiểm tra empty response body
    }

}
