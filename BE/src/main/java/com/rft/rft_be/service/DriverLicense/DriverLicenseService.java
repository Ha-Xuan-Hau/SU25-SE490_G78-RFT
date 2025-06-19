package com.rft.rft_be.service.DriverLicense;

import com.rft.rft_be.dto.DriverLicense.CreateDriverLicenseDTO;
import com.rft.rft_be.dto.DriverLicense.DriverLicenseDTO;

import java.util.List;

public interface DriverLicenseService {
    List<DriverLicenseDTO> getAllDriverLicenses();
    DriverLicenseDTO getDriverLicenseById(String id);
    List<DriverLicenseDTO> getDriverLicensesByUserId(String userId);
    List<DriverLicenseDTO> getDriverLicensesByStatus(String status);
    DriverLicenseDTO getDriverLicenseByLicenseNumber(String licenseNumber);
    DriverLicenseDTO createDriverLicense(CreateDriverLicenseDTO createDriverLicenseDTO);
    DriverLicenseDTO updateDriverLicense(String id, DriverLicenseDTO driverLicenseDTO);
    void deleteDriverLicense(String id);
}
