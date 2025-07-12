package com.rft.rft_be.service.Contract;

import com.rft.rft_be.dto.contract.FinalContractDTO;
import com.rft.rft_be.dto.contract.CreateFinalContractDTO;
import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.ContractMapper;
import com.rft.rft_be.repository.FinalContractRepository;
import com.rft.rft_be.repository.ContractRepository;
import com.rft.rft_be.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinalContractServiceImpl implements FinalContractService {

    private final FinalContractRepository finalContractRepository;
    private final ContractMapper finalContractMapper;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;

    @Override
    public List<FinalContractDTO> getAllFinalContracts() {
        try {
            log.info("Getting all final contracts");
            List<FinalContract> finalContracts = finalContractRepository.findAll();
            return finalContracts.stream()
                    .map(finalContractMapper::finalContract)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all final contracts", e);
            throw new RuntimeException("Failed to get all final contracts: " + e.getMessage());
        }
    }

    @Override
    public FinalContractDTO getFinalContractById(String id) {
        try {
            log.info("Getting final contract by id: {}", id);
            FinalContract finalContract = finalContractRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Final contract not found with id: " + id));
            return finalContractMapper.finalContract(finalContract);
        } catch (Exception e) {
            log.error("Error getting final contract by id: {}", id, e);
            throw new RuntimeException("Failed to get final contract: " + e.getMessage());
        }
    }

    @Override
    public List<FinalContractDTO> getFinalContractsByContractId(String contractId) {
        try {
            log.info("Getting final contracts by contract id: {}", contractId);
            List<FinalContract> finalContracts = finalContractRepository.findByContractId(contractId);
            return finalContracts.stream()
                    .map(finalContractMapper::finalContract)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting final contracts by contract id: {}", contractId, e);
            throw new RuntimeException("Failed to get final contracts by contract: " + e.getMessage());
        }
    }

    @Override
    public List<FinalContractDTO> getFinalContractsByUserId(String userId) {
        try {
            log.info("Getting final contracts by user id: {}", userId);
            List<FinalContract> finalContracts = finalContractRepository.findByUserId(userId);
            return finalContracts.stream()
                    .map(finalContractMapper::finalContract)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting final contracts by user id: {}", userId, e);
            throw new RuntimeException("Failed to get final contracts by user: " + e.getMessage());
        }
    }

    @Override
    public List<FinalContractDTO> getFinalContractsByUserIdAndContractId(String userId, String contractId) {
        try {
            log.info("Getting final contracts by user id: {} and contract id: {}", userId, contractId);
            List<FinalContract> finalContracts = finalContractRepository.findByUserIdAndContractId(userId, contractId);
            return finalContracts.stream()
                    .map(finalContractMapper::finalContract)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting final contracts by user id: {} and contract id: {}", userId, contractId, e);
            throw new RuntimeException("Failed to get final contracts by user and contract: " + e.getMessage());
        }
    }

    @Override
    public List<FinalContractDTO> getFinalContractsByTimeFinishBetween(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            log.info("Getting final contracts by time finish between: {} and {}", startDate, endDate);
            List<FinalContract> finalContracts = finalContractRepository.findByTimeFinishBetween(startDate, endDate);
            return finalContracts.stream()
                    .map(finalContractMapper::finalContract)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting final contracts by time finish range", e);
            throw new RuntimeException("Failed to get final contracts by time range: " + e.getMessage());
        }
    }

    @Override
    public List<FinalContractDTO> getFinalContractsByCostSettlementRange(BigDecimal minCost, BigDecimal maxCost) {
        try {
            log.info("Getting final contracts by cost settlement range: {} to {}", minCost, maxCost);
            List<FinalContract> finalContracts = finalContractRepository.findByCostSettlementBetween(minCost, maxCost);
            return finalContracts.stream()
                    .map(finalContractMapper::finalContract)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting final contracts by cost settlement range", e);
            throw new RuntimeException("Failed to get final contracts by cost range: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public FinalContractDTO createFinalContract(CreateFinalContractDTO createFinalContractDTO) {
        try {
            log.info("Creating final contract");

            // Validate required fields
            if (createFinalContractDTO.getContractId() == null || createFinalContractDTO.getContractId().trim().isEmpty()) {
                throw new RuntimeException("Contract ID is required");
            }
//            if (createFinalContractDTO.getUserId() == null || createFinalContractDTO.getUserId().trim().isEmpty()) {
//                throw new RuntimeException("User ID is required");
//            }

            // Validate foreign key references
            Contract contract = contractRepository.findById(createFinalContractDTO.getContractId())
                    .orElseThrow(() -> new RuntimeException("Contract not found with id: " + createFinalContractDTO.getContractId()));

//            User user = userRepository.findById(createFinalContractDTO.getUserId())
//                    .orElseThrow(() -> new RuntimeException("User not found with id: " + createFinalContractDTO.getUserId()));

            // Create new final contract entity
            FinalContract finalContract = FinalContract.builder()
                    .contract(contract)
//                    .user(user)
                    .image(createFinalContractDTO.getImage())
                    .timeFinish(createFinalContractDTO.getTimeFinish())
                    .costSettlement(createFinalContractDTO.getCostSettlement())
                    .note(createFinalContractDTO.getNote())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            // Save final contract
            FinalContract savedFinalContract = finalContractRepository.save(finalContract);
            log.info("Successfully created final contract with id: {}", savedFinalContract.getId());

            return finalContractMapper.finalContract(savedFinalContract);

        } catch (Exception e) {
            log.error("Error creating final contract", e);
            throw new RuntimeException("Failed to create final contract: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public FinalContractDTO updateFinalContract(String id, FinalContractDTO finalContractDTO) {
        try {
            log.info("Updating final contract with id: {}", id);

            // Find existing final contract
            FinalContract existingFinalContract = finalContractRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Final contract not found with id: " + id));

            // Update fields (only update non-null values from DTO)
            if (finalContractDTO.getImage() != null) {
                existingFinalContract.setImage(finalContractDTO.getImage());
            }

            if (finalContractDTO.getTimeFinish() != null) {
                existingFinalContract.setTimeFinish(finalContractDTO.getTimeFinish());
            }

            if (finalContractDTO.getCostSettlement() != null) {
                existingFinalContract.setCostSettlement(finalContractDTO.getCostSettlement());
            }

            if (finalContractDTO.getNote() != null) {
                existingFinalContract.setNote(finalContractDTO.getNote());
            }

            // Update timestamp
            existingFinalContract.setUpdatedAt(LocalDateTime.now());

            // Save and return updated final contract
            FinalContract updatedFinalContract = finalContractRepository.save(existingFinalContract);
            log.info("Successfully updated final contract with id: {}", id);

            return finalContractMapper.finalContract(updatedFinalContract);

        } catch (Exception e) {
            log.error("Error updating final contract with id: {}", id, e);
            throw new RuntimeException("Failed to update final contract: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteFinalContract(String id) {
        try {
            log.info("Deleting final contract with id: {}", id);

            boolean exists = finalContractRepository.existsById(id);
            if (!exists) {
                throw new RuntimeException("Final contract not found with id: " + id);
            }

            finalContractRepository.deleteById(id);
            log.info("Successfully deleted final contract with id: {}", id);

        } catch (Exception e) {
            log.error("Error deleting final contract with id: {}", id, e);
            throw new RuntimeException("Failed to delete final contract: " + e.getMessage());
        }
    }

    @Override
    public long countFinalContractsByUserId(String userId) {
        try {
            log.info("Counting final contracts for user: {}", userId);
            long count = finalContractRepository.countByUserId(userId);
            log.info("User {} has {} final contracts", userId, count);
            return count;
        } catch (Exception e) {
            log.error("Error counting final contracts for user: {}", userId, e);
            throw new RuntimeException("Failed to count final contracts by user: " + e.getMessage());
        }
    }

    @Override
    public long countFinalContractsByContractId(String contractId) {
        try {
            log.info("Counting final contracts for contract: {}", contractId);
            long count = finalContractRepository.countByContractId(contractId);
            log.info("Contract {} has {} final contracts", contractId, count);
            return count;
        } catch (Exception e) {
            log.error("Error counting final contracts for contract: {}", contractId, e);
            throw new RuntimeException("Failed to count final contracts by contract: " + e.getMessage());
        }
    }
}
