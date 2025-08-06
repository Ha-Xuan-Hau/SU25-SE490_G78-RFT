package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

    public interface UserReportRepository extends JpaRepository<UserReport, String> {
        List<UserReport> findByReportedIdAndType(String reportedId, String type);

}