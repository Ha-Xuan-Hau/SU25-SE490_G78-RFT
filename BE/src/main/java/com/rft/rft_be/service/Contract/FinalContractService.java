package com.rft.rft_be.service.Contract;


import com.rft.rft_be.dto.finalcontract.FinalContractDTO;
import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface FinalContractService {
    List<FinalContractDTO> getAllFinalContracts();
    FinalContractDTO getFinalContractById(String id);
    List<FinalContractDTO> getFinalContractsByContractId(String contractId);
    List<FinalContractDTO> getFinalContractsByUserId(String userId);
    List<FinalContractDTO> getFinalContractsByUserIdAndContractId(String userId, String contractId);
    List<FinalContractDTO> getFinalContractsByTimeFinishBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<FinalContractDTO> getFinalContractsByCostSettlementRange(BigDecimal minCost, BigDecimal maxCost);
    FinalContractDTO createFinalContract(CreateFinalContractDTO createFinalContractDTO);
    FinalContractDTO updateFinalContract(String id, FinalContractDTO finalContractDTO);
    void deleteFinalContract(String id);
    long countFinalContractsByUserId(String userId);
    long countFinalContractsByContractId(String contractId);
    List<FinalContractDTO> getAllFinalContractsWithUser();
}
