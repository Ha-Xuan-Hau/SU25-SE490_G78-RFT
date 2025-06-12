package com.rft.rft_be.service.vehicle;

import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.dto.vehicle.VehicleDTO;
import com.rft.rft_be.dto.vehicle.VehicleDetailDTO;
import com.rft.rft_be.entity.Vehicle;
import com.rft.rft_be.mapper.RatingMapper;
import com.rft.rft_be.mapper.VehicleMapper;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.VehicleRepository;
import com.rft.rft_be.service.rating.RatingService;
import com.rft.rft_be.service.rating.RatingServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VehicleServiceImpl implements VehicleService {

    VehicleRepository vehicleRepository;
    VehicleMapper vehicleMapper;
    RatingRepository ratingRepository;
    RatingMapper ratingMapper;
    private final RatingServiceImpl ratingServiceImpl;

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

    @Override
    public VehicleDetailDTO getVehicleDetailById(String id) {
        Optional<Vehicle> vehicle = vehicleRepository.findById(id);
        VehicleDetailDTO vehicleDetailDTO = vehicle.map(vehicleMapper::vehicleToVehicleDetail)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicleDetailDTO.setUserComments(ratingMapper.RatingToUserListCommentDTO(ratingRepository.findAllByVehicle_Id(id)));



        return vehicleDetailDTO;
    }

}