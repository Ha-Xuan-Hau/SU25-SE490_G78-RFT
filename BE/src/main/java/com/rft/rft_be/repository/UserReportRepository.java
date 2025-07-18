package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

    public interface UserReportRepository extends JpaRepository<UserReport, String> {
    List<UserReport> findByReportedId(String reportedId);
    List<UserReport> findByType(String type);
    List<UserReport> findByTypeOrderByCreatedAtDesc(String type);
        List<UserReport> findByReportedIdIn(List<String> ids);
}