package com.rft.rft_be.service.Contract;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.CreateContractDTO;

import java.util.List;

public interface ContractService {
    List<ContractDTO> getAllContracts();
    ContractDTO getContractById(String id);
    List<ContractDTO> getContractsByBookingId(String bookingId);
    List<ContractDTO> getContractsByUserId(String userId);
    List<ContractDTO> getContractsByStatus(String status);
    List<ContractDTO> getContractsByUserIdAndStatus(String userId, String status);
    List<ContractDTO> getContractsByBookingIdAndStatus(String bookingId, String status);
    ContractDTO createContract(CreateContractDTO createContractDTO);
    ContractDTO updateContract(String id, ContractDTO contractDTO);
    void deleteContract(String id);
}
