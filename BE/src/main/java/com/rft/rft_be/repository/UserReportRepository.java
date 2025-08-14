package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserReport;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

    public interface UserReportRepository extends JpaRepository<UserReport, String> {
        List<UserReport> findByReportedIdAndType(String reportedId, String type);


        // Đếm số cờ APPROVED của user
        long countByReportedIdAndTypeAndStatus(String reportedId, String type, UserReport.Status status);

        // Tìm STAFF_REPORT quá hạn để auto-approve
        List<UserReport> findByTypeAndStatusAndCreatedAtBefore(String type, UserReport.Status status, LocalDateTime deadline);

        // Check user đã appeal flag này chưa
        @Query("SELECT COUNT(ur) > 0 FROM UserReport ur WHERE ur.reporter.id = :reporterId AND ur.reportedId = :flagId AND ur.type = 'APPEAL'")
        boolean existsAppealByReporterAndFlag(@Param("reporterId") String reporterId, @Param("flagId") String flagId);

        // Đếm báo cáo non-serious cho escalation
        @Query("SELECT COUNT(ur) FROM UserReport ur WHERE ur.reportedId = :targetId AND ur.type IN :types AND ur.status != :excludeStatus")
        long countForEscalation(@Param("targetId") String targetId, @Param("types") List<String> types, @Param("excludeStatus") UserReport.Status excludeStatus);

        // Tìm các báo cáo cần escalation
        @Query("SELECT ur.reportedId, COUNT(ur) as reportCount FROM UserReport ur " +
                "WHERE ur.type IN :types AND ur.status != 'REJECTED' " +
                "GROUP BY ur.reportedId HAVING COUNT(ur) > :threshold")
        List<Object[]> findEscalationTargets(@Param("types") List<String> types, @Param("threshold") long threshold);

        // Tìm STAFF_REPORT còn trong thời hạn appeal
        @Query("SELECT ur FROM UserReport ur WHERE ur.id = :flagId AND ur.type = 'STAFF_REPORT' " +
                "AND ur.status = 'PENDING' AND ur.createdAt > :deadline")
        UserReport findAppealableFlag(@Param("flagId") String flagId, @Param("deadline") LocalDateTime deadline);
}