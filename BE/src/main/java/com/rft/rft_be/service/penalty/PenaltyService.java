package com.rft.rft_be.service.penalty;

import com.rft.rft_be.dto.penalty.CreatePenaltyDTO;
import com.rft.rft_be.dto.penalty.PenaltyDTO;

import java.util.List;

public interface PenaltyService {

    List<PenaltyDTO> getPenaltiesByUserId(String userId);
    PenaltyDTO createPenalty(CreatePenaltyDTO createPenaltyDTO);
    PenaltyDTO updatePenalty(String id, PenaltyDTO penaltyDTO);
    void deletePenalty(String id);
    PenaltyDTO getPenaltyById(String id);

    // Additional utility methods
    List<PenaltyDTO> getAllPenalties();
    List<PenaltyDTO> getPenaltiesByType(String penaltyType);
    List<PenaltyDTO> getPenaltiesByMinCancelHour(Integer minHours);
    long countPenaltiesByUserId(String userId);
    long countPenaltiesByType(String penaltyType);
    boolean isPenaltyInUse(String penaltyId);
    long countVehiclesUsingPenalty(String penaltyId);
}
