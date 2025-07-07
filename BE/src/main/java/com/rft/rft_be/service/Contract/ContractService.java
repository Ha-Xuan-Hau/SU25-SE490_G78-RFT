package com.rft.rft_be.service.Contract;

import java.util.List;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.CreateContractDTO;

public interface ContractService {

    List<ContractDTO> getAllContracts();

    ContractDTO getContractById(String id);

    List<ContractDTO> getContractsByBookingId(String bookingId);

    List<ContractDTO> getContractsByUserId(String userId);

    List<ContractDTO> getContractsByStatus(String status);

    List<ContractDTO> getContractsByUserIdAndStatus(String userId, String status);

    List<ContractDTO> getContractsByBookingIdAndStatus(String bookingId, String status);

    List<ContractDTO> getContractsByProviderIdAndStatus(String providerId, String status);

    ContractDTO createContract(CreateContractDTO createContractDTO);

    ContractDTO updateContract(String id, ContractDTO contractDTO);

    void deleteContract(String id);
}
