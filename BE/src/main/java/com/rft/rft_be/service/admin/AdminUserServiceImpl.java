package com.rft.rft_be.service.admin;

import com.rft.rft_be.dto.admin.*;
import com.rft.rft_be.entity.User;
import com.rft.rft_be.entity.Booking;
import com.rft.rft_be.repository.BookingRepository;
import com.rft.rft_be.repository.RatingRepository;
import com.rft.rft_be.repository.UserRepository;
import com.rft.rft_be.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final RatingRepository ratingRepository;
    private final WalletRepository walletRepository;

    @Override
    public AdminUserListResponseDTO getUsers(AdminUserSearchDTO searchDTO) {
        Pageable pageable = createPageable(searchDTO);
        Page<User> userPage = userRepository.findUsersWithFilters(
                searchDTO.getName(),
                searchDTO.getEmail(),
                searchDTO.getStatus(),
                searchDTO.getRole(),
                pageable
        );

        return buildUserListResponse(userPage);
    }

    @Override
    public AdminUserListResponseDTO getProviders(AdminUserSearchDTO searchDTO) {
        searchDTO.setRole(User.Role.PROVIDER);
        return getUsers(searchDTO);
    }

    @Override
    public AdminUserDetailDTO getUserDetail(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get booking statistics
        Long totalBookings = bookingRepository.countByUserId(userId);
        Long completedBookings = bookingRepository.countByUserIdAndStatus(userId, Booking.Status.COMPLETED);
        Long cancelledBookings = bookingRepository.countByUserIdAndStatus(userId, Booking.Status.CANCELLED);

        // Get rating statistics
        Double averageRating = ratingRepository.findAverageRatingByUserId(userId);
        Long totalRatings = ratingRepository.countByUserId(userId);

        // Get wallet balance
        Double walletBalance = walletRepository.findBalanceByUserId(userId);

        return AdminUserDetailDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .dateOfBirth(user.getDateOfBirth())
                .phone(user.getPhone())
                .address(user.getAddress())
                .status(user.getStatus())
                .role(user.getRole())
                .openTime(user.getOpenTime())
                .closeTime(user.getCloseTime())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .walletBalance(walletBalance != null ? walletBalance : 0.0)
                .totalBookings(totalBookings)
                .completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalRatings(totalRatings)
                .build();
    }

    @Override
    public AdminUserDetailDTO updateUserStatus(String userId, AdminUserStatusUpdateDTO statusDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(statusDTO.getStatus());
        User updatedUser = userRepository.save(user);

        return getUserDetail(updatedUser.getId());
    }

    @Override
    public AdminUserListResponseDTO searchUsersByName(String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByFullNameContainingIgnoreCase(name, pageable);
        return buildUserListResponse(userPage);
    }

    @Override
    public AdminUserListResponseDTO searchUsersByEmail(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByEmailContainingIgnoreCase(email, pageable);
        return buildUserListResponse(userPage);
    }

    @Override
    public AdminUserListResponseDTO searchUsersByStatus(User.Status status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = userRepository.findByStatus(status, pageable);
        return buildUserListResponse(userPage);
    }

    private Pageable createPageable(AdminUserSearchDTO searchDTO) {
        Sort sort = Sort.by(
                searchDTO.getSortDirection().equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC,
                searchDTO.getSortBy()
        );
        return PageRequest.of(searchDTO.getPage(), searchDTO.getSize(), sort);
    }

    private AdminUserListResponseDTO buildUserListResponse(Page<User> userPage) {
        List<AdminUserListDTO> userDTOs = userPage.getContent().stream()
                .map(this::convertToAdminUserListDTO)
                .collect(Collectors.toList());

        return AdminUserListResponseDTO.builder()
                .users(userDTOs)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .pageSize(userPage.getSize())
                .hasNext(userPage.hasNext())
                .hasPrevious(userPage.hasPrevious())
                .build();
    }

    private AdminUserListDTO convertToAdminUserListDTO(User user) {
        // Get basic statistics
        Long totalBookings = bookingRepository.countByUserId(user.getId());
        Long totalVehicles = 0L; // TODO: Add vehicle repository method
        Double walletBalance = walletRepository.findBalanceByUserId(user.getId());

        return AdminUserListDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalBookings(totalBookings)
                .totalVehicles(totalVehicles)
                .walletBalance(walletBalance != null ? walletBalance : 0.0)
                .build();
    }

}