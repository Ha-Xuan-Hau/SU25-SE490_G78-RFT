package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.VehicleDTO;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private VehicleMapper vehicleMapper;

    @Override
    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll()
                .stream()
                .map(vehicleMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDTO getVehicleById(String id) {
        return vehicleRepository.findById(id)
                .map(vehicleMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    @Override
    public List<CategoryDTO> getAllVehiclesByCategory() {
        List<Vehicle> vehicles = vehicleRepository.findAll();

        Map<String, List<Vehicle>> grouped = vehicles.stream()
                .collect(Collectors.groupingBy(Vehicle::getVehicleTypes));

        return grouped.entrySet().stream()
                .map(entry -> CategoryDTO.builder()
                        .categoryName(entry.getKey())
                        .vehicles(entry.getValue().stream()
                                .map(vehicleMapper::toDTO)
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }
}