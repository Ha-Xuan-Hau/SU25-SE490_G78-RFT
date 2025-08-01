package com.rft.rft_be.service.Contract;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.rft.rft_be.entity.FinalContract;
import com.rft.rft_be.repository.FinalContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rft.rft_be.dto.contract.ContractDTO;
import com.rft.rft_be.dto.contract.CreateContractDTO;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.entity.Contract;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.mapper.ContractMapper;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.ContractRepository;
import com.rft.rft_be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final ContractMapper contractMapper;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FinalContractRepository finalContractRepository;

    @Override
    public List<ContractDTO> getAllContracts() {
        List<Contract> contracts = contractRepository.findAll();
        return contracts.stream()
                .map(contractMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ContractDTO getContractById(String id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + id));
        return contractMapper.toDTO(contract);
    }

    @Override
    public List<ContractDTO> getContractsByBookingId(String bookingId) {
        List<Contract> contracts = contractRepository.findByBookingId(bookingId);
        return contracts.stream()
                .map(contractMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContractDTO> getContractsByUserId(String userId) {
        List<Contract> contracts = contractRepository.findByUserId(userId);
        return contracts.stream()
                .map(contractMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ContractDTO> getContractsByStatus(String status) {
        try {
            Contract.Status contractStatus = Contract.Status.valueOf(status.toUpperCase());
            List<Contract> contracts = contractRepository.findByStatus(contractStatus);
            return contracts.stream()
                    .map(contractMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: DRAFT, FINISHED, CANCELLED");
        }
    }

    @Override
    public List<ContractDTO> getContractsByUserIdAndStatus(String providerId, String status) {
        try {
            Contract.Status contractStatus = Contract.Status.valueOf(status.toUpperCase());
            List<Contract> contracts = contractRepository.findByUserIdAndStatus(providerId, contractStatus);
            return contracts.stream()
                    .map(contractMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: DRAFT, FINISHED, CANCELLED");
        }
    }

    @Override
    public List<ContractDTO> getContractsByBookingIdAndStatus(String bookingId, String status) {
        try {
            Contract.Status contractStatus = Contract.Status.valueOf(status.toUpperCase());
            List<Contract> contracts = contractRepository.findByBookingIdAndStatus(bookingId, contractStatus);
            return contracts.stream()
                    .map(contractMapper::toDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: DRAFT, FINISHED, CANCELLED");
        }
    }

    @Override
    public List<ContractDTO> getContractsByProviderIdAndStatus(String providerId, String status) {
        try {
            Contract.Status contractStatus = Contract.Status.valueOf(status.toUpperCase());
            List<Contract> contracts = contractRepository.findByProviderIdAndStatus(providerId, contractStatus);
            List<ContractDTO> contractDTOs = contracts.stream()
                    .map(contractMapper::toDTO)
                    .collect(Collectors.toList());
            // Nếu status là FINISHED thì lấy thêm timeFinish từ finalContracts
            if (contractStatus == Contract.Status.FINISHED) {
                for (ContractDTO dto : contractDTOs) {
                    List<FinalContract> finalContracts = finalContractRepository.findByContractId(dto.getId());
                    if (finalContracts != null && !finalContracts.isEmpty()) {
                        dto.setTimeFinish(finalContracts.get(0).getTimeFinish());
                    }
                }
            }
            return contractDTOs;
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status + ". Valid values are: PROCESSING, RENTING, FINISHED, CANCELLED");
        }
    }

    @Override
    @Transactional
    public ContractDTO createContract(CreateContractDTO createContractDTO) {
        // Validate required fields
        if (createContractDTO.getBookingId() == null || createContractDTO.getBookingId().trim().isEmpty()) {
            throw new RuntimeException("Booking ID is required");
        }
        if (createContractDTO.getUserId() == null || createContractDTO.getUserId().trim().isEmpty()) {
            throw new RuntimeException("User ID is required");
        }

        // Validate foreign key references
        Booking booking = bookingRepository.findById(createContractDTO.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + createContractDTO.getBookingId()));

        User user = userRepository.findById(createContractDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + createContractDTO.getUserId()));

        // Create new contract entity
        Contract contract = Contract.builder()
                .booking(booking)
                .user(user)
                .image(createContractDTO.getImage())
                .costSettlement(createContractDTO.getCostSettlement())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Set status with validation
        if (createContractDTO.getStatus() != null && !createContractDTO.getStatus().trim().isEmpty()) {
            try {
                Contract.Status status = Contract.Status.valueOf(createContractDTO.getStatus().toUpperCase());
                contract.setStatus(status);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + createContractDTO.getStatus() + ". Valid values are: DRAFT, FINISHED, CANCELLED");
            }
        } else {
            contract.setStatus(Contract.Status.PROCESSING);
        }

        // Save contract
        Contract savedContract = contractRepository.save(contract);
        return contractMapper.toDTO(savedContract);
    }

    @Override
    @Transactional
    public ContractDTO updateContract(String id, ContractDTO contractDTO) {
        // Find existing contract
        Contract existingContract = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contract not found with id: " + id));

        // Update fields (only update non-null values from DTO)
        if (contractDTO.getImage() != null) {
            existingContract.setImage(contractDTO.getImage());
        }

        if (contractDTO.getCostSettlement() != null) {
            existingContract.setCostSettlement(contractDTO.getCostSettlement());
        }

        if (contractDTO.getStatus() != null && !contractDTO.getStatus().trim().isEmpty()) {
            try {
                Contract.Status status = Contract.Status.valueOf(contractDTO.getStatus().toUpperCase());
                existingContract.setStatus(status);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + contractDTO.getStatus() + ". Valid values are: DRAFT, FINISHED, CANCELLED");
            }
        }

        // Update timestamp
        existingContract.setUpdatedAt(LocalDateTime.now());

        // Save and return updated contract
        Contract updatedContract = contractRepository.save(existingContract);
        return contractMapper.toDTO(updatedContract);
    }

    @Override
    @Transactional
    public void deleteContract(String id) {
        boolean exists = contractRepository.existsById(id);
        if (!exists) {
            throw new RuntimeException("Contract not found with id: " + id);
        }
        contractRepository.deleteById(id);
    }

    @Override
    public void createContractByPayment(String bookingtxnRef) {
        Booking booking = bookingRepository.findByCodeTransaction(bookingtxnRef)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn booking với mã giao dịch: " + bookingtxnRef));

        // Cập nhật trạng thái booking
        booking.setStatus(Booking.Status.PENDING);
        bookingRepository.save(booking);

        // Lấy provider từ bookingDetails (chỉ lấy từ 1 xe vì cùng 1 chủ)
        if (booking.getBookingDetails() == null || booking.getBookingDetails().isEmpty()) {
            throw new RuntimeException("Đơn booking không chứa xe nào.");
        }

        User provider = booking.getBookingDetails().get(0).getVehicle().getUser();

        // Tạo contract mới
        Contract contract = new Contract();
        contract.setUser(provider);
        contract.setBooking(booking);
        contract.setCostSettlement(booking.getTotalCost());
        contract.setStatus(Contract.Status.PROCESSING); // có thể set mặc định nếu cần
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());

        contractRepository.save(contract);
    }
}
