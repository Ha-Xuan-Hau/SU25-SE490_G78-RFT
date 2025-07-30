package com.rft.rft_be.mapper;

import com.rft.rft_be.dto.wallet.WalletDTO;
import com.rft.rft_be.dto.wallet.WalletTransactionDTO;
import com.rft.rft_be.entity.Wallet;
import com.rft.rft_be.entity.WalletTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


import java.util.List;


@Mapper(componentModel = "spring")
public interface WalletMapper {
    @Mapping(source = "user.id", target = "userId")
    WalletDTO toDTO(Wallet wallet);

    //@Mapping(source = "user.id", target = "userId")

    @Mapping(target = "walletId", source = "wallet.id")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "cardNumber", source = "wallet.bankAccountNumber")
    @Mapping(target = "bankName", source = "wallet.bankAccountType")
    @Mapping(target = "cardHolderName", source = "wallet.bankAccountName")
    WalletTransactionDTO toTransactionDTO(WalletTransaction tx);

    List<WalletTransactionDTO> toTransactionDTOs(List<WalletTransaction> tx);
}
