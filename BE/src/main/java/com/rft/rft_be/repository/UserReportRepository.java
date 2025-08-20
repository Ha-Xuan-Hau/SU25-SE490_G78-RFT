package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserReport;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.rft.rft_be.entity.UserReport.Status;
import java.time.LocalDateTime;
import java.util.List;

    public interface UserReportRepository extends JpaRepository<UserReport, String> {
        List<UserReport> findByReportedIdAndType(String reportedId, String type);

        // Đếm số cờ APPROVED của user
        long countByReportedIdAndTypeAndStatus(String reportedId, String type, UserReport.Status status);

        // Tìm STAFF_REPORT quá hạn để auto-approve
        List<UserReport> findByTypeAndStatusAndCreatedAtBefore(String type, UserReport.Status status, LocalDateTime deadline);

        // Check user đã appeal flag này chưa
        @Query("SELECT COUNT(ur) > 0 FROM UserReport ur " +
                "WHERE ur.reporter.id = :reporterId " +
                "AND ur.reportedId = :flagId " +
                "AND ur.type = 'APPEAL'")
        boolean existsAppealByReporterAndFlag(@Param("reporterId") String reporterId,
                                              @Param("flagId") String flagId);

        @Query("SELECT COUNT(r) FROM UserReport r WHERE r.type IN :types AND r.createdAt BETWEEN :from AND :to")
        long countByTypesAndDateRange(@Param("types") List<String> types,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);

        @Query("SELECT COUNT(r) FROM UserReport r WHERE r.type IN :types AND r.status = :status AND r.createdAt BETWEEN :from AND :to")
        long countByTypesAndStatusAndDateRange(@Param("types") List<String> types,
                                               @Param("status") Status status,
                                               @Param("from") LocalDateTime from,
                                               @Param("to") LocalDateTime to);

}