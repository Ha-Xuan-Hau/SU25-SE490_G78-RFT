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

    @Mapping(source = "user.id", target = "userId")
    WalletTransactionDTO toTransactionDTO(WalletTransaction tx);

    List<WalletTransactionDTO> toTransactionDTOs(List<WalletTransaction> tx);
}
