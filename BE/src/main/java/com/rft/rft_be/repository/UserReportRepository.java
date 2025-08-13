package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserReport;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

    public interface UserReportRepository extends JpaRepository<UserReport, String> {
        List<UserReport> findByReportedIdAndType(String reportedId, String type);


        // Thêm methods mới cho appeal
        List<UserReport> findByReportedId(String reportedId);

        @Query("SELECT ur FROM UserReport ur WHERE ur.reporter.id = :reporterId")
        List<UserReport> findByReporterId(@Param("reporterId") String reporterId);

        // Optional: method để check nhanh
        @Query("SELECT COUNT(ur) > 0 FROM UserReport ur " +
                "WHERE ur.reporter.id = :reporterId " +
                "AND ur.reportedId = :targetId")
        boolean existsByReporterIdAndReportedId(
                @Param("reporterId") String reporterId,
                @Param("targetId") String targetId
        );

        @Query("SELECT COUNT(ur) > 0 FROM UserReport ur " +
                "WHERE ur.reporter.id = :reporterId " +
                "AND ur.type = 'APPEAL' " +
                "AND ur.reportedId = :originalReportId")
        boolean existsByReporterIdAndOriginalReportId(
                @Param("reporterId") String reporterId,
                @Param("originalReportId") String originalReportId
        );

        // Tìm tất cả kháng cáo của một báo cáo
        @Query("SELECT ur FROM UserReport ur " +
                "WHERE ur.type = 'APPEAL' " +
                "AND ur.reportedId = :originalReportId")
        List<UserReport> findAppealsByOriginalReportId(@Param("originalReportId") String originalReportId);
}