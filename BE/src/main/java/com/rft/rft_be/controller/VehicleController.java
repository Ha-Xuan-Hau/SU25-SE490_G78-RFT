package com.rft.rft_be.controller;

import com.rft.rft_be.dto.VehicleDTO;
import com.rft.rft_be.dto.CategoryDTO;
import com.rft.rft_be.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDTO> getVehicleById(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/getAllByCategory")
    public ResponseEntity<List<CategoryDTO>> getAllVehiclesByCategory() {
        return ResponseEntity.ok(vehicleService.getAllVehiclesByCategory());
    }
}