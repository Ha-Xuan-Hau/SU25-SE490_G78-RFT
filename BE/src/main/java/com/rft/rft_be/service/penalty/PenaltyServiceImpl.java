package com.rft.rft_be.service.penalty;


import com.rft.rft_be.dto.penalty.PenaltyDTO;
import com.rft.rft_be.dto.penalty.CreatePenaltyDTO;
import com.rft.rft_be.entity.Penalty;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.PenaltyMapper;
import com.rft.rft_be.repository.PenaltyRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PenaltyServiceImpl implements PenaltyService {

    private final PenaltyRepository penaltyRepository;
    private final PenaltyMapper penaltyMapper;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    public List<PenaltyDTO> getPenaltiesByUserId(String userId) {
        try {
            log.info("Getting penalties by user id: {}", userId);

            // Validate user exists
            if (!userRepository.existsById(userId)) {
                throw new RuntimeException("User not found with id: " + userId);
            }

            List<Penalty> penalties = penaltyRepository.findByUserId(userId);
            return penalties.stream()
                    .map(penaltyMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting penalties by user id: {}", userId, e);
            throw new RuntimeException("Failed to get penalties by user: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PenaltyDTO createPenalty(CreatePenaltyDTO createPenaltyDTO) {
        try {
            log.info("Creating penalty for user: {}", createPenaltyDTO.getUserId());

            validateCreatePenaltyDTO(createPenaltyDTO);
            Penalty.PenaltyType penaltyType;
            try {
                penaltyType = Penalty.PenaltyType.valueOf(createPenaltyDTO.getPenaltyType().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid penalty type: " + createPenaltyDTO.getPenaltyType() + ". Valid values are: PERCENT, FIXED");
            }

            // Validate penalty value based on type
            if (penaltyType == Penalty.PenaltyType.PERCENT) {
                if (createPenaltyDTO.getPenaltyValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                    throw new RuntimeException("Penalty value for PERCENT type cannot exceed 100");
                }
            }

            // Validate user exists
            User user = userRepository.findById(createPenaltyDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + createPenaltyDTO.getUserId()));

            // Create new penalty entity
            Penalty penalty = Penalty.builder()
                    .user(user)
                    .penaltyType(penaltyType)
                    .penaltyValue(createPenaltyDTO.getPenaltyValue())
                    .minCancelHour(createPenaltyDTO.getMinCancelHour())
                    .description(createPenaltyDTO.getDescription())
                    .build();

            // Save penalty
            Penalty savedPenalty = penaltyRepository.save(penalty);
            log.info("Successfully created penalty with id: {}", savedPenalty.getId());

            return penaltyMapper.toDTO(savedPenalty);

        } catch (Exception e) {
            log.error("Error creating penalty", e);
            throw new RuntimeException("Failed to create penalty: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PenaltyDTO updatePenalty(String id, PenaltyDTO penaltyDTO) {
        try {
            log.info("Updating penalty with id: {}", id);

            // Find existing penalty
            Penalty existingPenalty = penaltyRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + id));

            // Update fields (only update non-null values from DTO)
            if (penaltyDTO.getPenaltyType() != null && !penaltyDTO.getPenaltyType().trim().isEmpty()) {
                try {
                    Penalty.PenaltyType penaltyType = Penalty.PenaltyType.valueOf(penaltyDTO.getPenaltyType().toUpperCase());

                    // Validate penalty value based on new type
                    if (penaltyType == Penalty.PenaltyType.PERCENT && penaltyDTO.getPenaltyValue() != null) {
                        if (penaltyDTO.getPenaltyValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                            throw new RuntimeException("Penalty value for PERCENT type cannot exceed 100");
                        }
                    }

                    existingPenalty.setPenaltyType(penaltyType);
                } catch (IllegalArgumentException e) {
                    throw new RuntimeException("Invalid penalty type: " + penaltyDTO.getPenaltyType() + ". Valid values are: PERCENT, FIXED");
                }
            }

            if (penaltyDTO.getPenaltyValue() != null) {
                if (penaltyDTO.getPenaltyValue().compareTo(BigDecimal.ZERO) < 0) {
                    throw new RuntimeException("Penalty value must be greater than or equal to 0");
                }

                // Validate penalty value based on current type
                if (existingPenalty.getPenaltyType() == Penalty.PenaltyType.PERCENT) {
                    if (penaltyDTO.getPenaltyValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                        throw new RuntimeException("Penalty value for PERCENT type cannot exceed 100");
                    }
                }

                existingPenalty.setPenaltyValue(penaltyDTO.getPenaltyValue());
            }

            if (penaltyDTO.getMinCancelHour() != null) {
                if (penaltyDTO.getMinCancelHour() < 0) {
                    throw new RuntimeException("Min cancel hour must be greater than or equal to 0");
                }
                existingPenalty.setMinCancelHour(penaltyDTO.getMinCancelHour());
            }

            if (penaltyDTO.getDescription() != null) {
                existingPenalty.setDescription(penaltyDTO.getDescription());
            }

            // Update user if provided
            if (penaltyDTO.getUserId() != null && !penaltyDTO.getUserId().trim().isEmpty()) {
                User user = userRepository.findById(penaltyDTO.getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + penaltyDTO.getUserId()));
                existingPenalty.setUser(user);
            }

            // Save and return updated penalty
            Penalty updatedPenalty = penaltyRepository.save(existingPenalty);
            log.info("Successfully updated penalty with id: {}", id);

            return penaltyMapper.toDTO(updatedPenalty);

        } catch (Exception e) {
            log.error("Error updating penalty with id: {}", id, e);
            throw new RuntimeException("Failed to update penalty: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deletePenalty(String id) {
        try {
            log.info("Deleting penalty with id: {}", id);

            // Check if penalty exists
            boolean exists = penaltyRepository.existsById(id);
            if (!exists) {
                throw new RuntimeException("Penalty not found with id: " + id);
            }

            // Check if penalty is being used by any vehicles
            long vehicleCount = countVehiclesUsingPenalty(id);
            if (vehicleCount > 0) {
                throw new RuntimeException("Cannot delete penalty that is being used by " + vehicleCount + " vehicle(s). Please remove the penalty from all vehicles first.");
            }

            penaltyRepository.deleteById(id);
            log.info("Successfully deleted penalty with id: {}", id);

        } catch (Exception e) {
            log.error("Error deleting penalty with id: {}", id, e);
            throw new RuntimeException("Failed to delete penalty: " + e.getMessage());
        }
    }

    @Override
    public PenaltyDTO getPenaltyById(String id) {
        try {
            log.info("Getting penalty by id: {}", id);
            Penalty penalty = penaltyRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Penalty not found with id: " + id));
            return penaltyMapper.toDTO(penalty);
        } catch (Exception e) {
            log.error("Error getting penalty by id: {}", id, e);
            throw new RuntimeException("Failed to get penalty: " + e.getMessage());
        }
    }

    @Override
    public List<PenaltyDTO> getAllPenalties() {
        try {
            log.info("Getting all penalties");
            List<Penalty> penalties = penaltyRepository.findAll();
            return penalties.stream()
                    .map(penaltyMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all penalties", e);
            throw new RuntimeException("Failed to get all penalties: " + e.getMessage());
        }
    }

    @Override
    public List<PenaltyDTO> getPenaltiesByType(String penaltyType) {
        try {
            log.info("Getting penalties by type: {}", penaltyType);

            Penalty.PenaltyType type;
            try {
                type = Penalty.PenaltyType.valueOf(penaltyType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid penalty type: " + penaltyType + ". Valid values are: PERCENT, FIXED");
            }

            List<Penalty> penalties = penaltyRepository.findByPenaltyType(type);
            return penalties.stream()
                    .map(penaltyMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting penalties by type: {}", penaltyType, e);
            throw new RuntimeException("Failed to get penalties by type: " + e.getMessage());
        }
    }

    @Override
    public List<PenaltyDTO> getPenaltiesByMinCancelHour(Integer minHours) {
        try {
            log.info("Getting penalties by min cancel hour: {}", minHours);
            List<Penalty> penalties = penaltyRepository.findByMinCancelHourLessThanEqual(minHours);
            return penalties.stream()
                    .map(penaltyMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting penalties by min cancel hour: {}", minHours, e);
            throw new RuntimeException("Failed to get penalties by min cancel hour: " + e.getMessage());
        }
    }

    @Override
    public long countPenaltiesByUserId(String userId) {
        try {
            log.info("Counting penalties for user: {}", userId);

            // Validate user exists
            if (!userRepository.existsById(userId)) {
                throw new RuntimeException("User not found with id: " + userId);
            }

            List<Penalty> penalties = penaltyRepository.findByUserId(userId);
            long count = penalties.size();
            log.info("User {} has {} penalties", userId, count);

            return count;

        } catch (Exception e) {
            log.error("Error counting penalties for user: {}", userId, e);
            throw new RuntimeException("Failed to count penalties by user: " + e.getMessage());
        }
    }

    @Override
    public long countPenaltiesByType(String penaltyType) {
        try {
            log.info("Counting penalties by type: {}", penaltyType);

            Penalty.PenaltyType type;
            try {
                type = Penalty.PenaltyType.valueOf(penaltyType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid penalty type: " + penaltyType + ". Valid values are: PERCENT, FIXED");
            }

            List<Penalty> penalties = penaltyRepository.findByPenaltyType(type);
            long count = penalties.size();
            log.info("Penalty type {} has {} penalties", penaltyType, count);

            return count;

        } catch (Exception e) {
            log.error("Error counting penalties by type: {}", penaltyType, e);
            throw new RuntimeException("Failed to count penalties by type: " + e.getMessage());
        }
    }

    @Override
    public boolean isPenaltyInUse(String penaltyId) {
        try {
            log.info("Checking if penalty {} is in use", penaltyId);
            return countVehiclesUsingPenalty(penaltyId) > 0;
        } catch (Exception e) {
            log.error("Error checking penalty usage for id: {}", penaltyId, e);
            return false;
        }
    }

    @Override
    public long countVehiclesUsingPenalty(String penaltyId) {
        try {
            log.info("Counting vehicles using penalty: {}", penaltyId);
            return vehicleRepository.countByPenaltyId(penaltyId);
        } catch (Exception e) {
            log.error("Error counting vehicles using penalty: {}", penaltyId, e);
            return 0;
        }
    }

    private void validateCreatePenaltyDTO(CreatePenaltyDTO createPenaltyDTO) {
        if (createPenaltyDTO.getUserId() == null || createPenaltyDTO.getUserId().trim().isEmpty()) {
            throw new RuntimeException("User ID is required");
        }
        if (createPenaltyDTO.getPenaltyType() == null || createPenaltyDTO.getPenaltyType().trim().isEmpty()) {
            throw new RuntimeException("Penalty type is required");
        }
        if (createPenaltyDTO.getPenaltyValue() == null || createPenaltyDTO.getPenaltyValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Penalty value must be greater than or equal to 0");
        }
        if (createPenaltyDTO.getMinCancelHour() == null || createPenaltyDTO.getMinCancelHour() < 0) {
            throw new RuntimeException("Min cancel hour must be greater than or equal to 0");
        }
    }
}