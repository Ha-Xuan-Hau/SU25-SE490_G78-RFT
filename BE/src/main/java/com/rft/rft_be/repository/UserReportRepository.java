package com.rft.rft_be.repository;

import com.rft.rft_be.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserReportRepository extends JpaRepository<UserReport, String> {
}