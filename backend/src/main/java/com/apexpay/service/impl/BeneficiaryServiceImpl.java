package com.apexpay.service.impl;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.dto.AddBeneficiaryRequest;
import com.apexpay.dto.BeneficiaryResponse;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.entity.Beneficiary;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.BeneficiaryRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.BeneficiaryService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BeneficiaryServiceImpl implements BeneficiaryService {

    private final UserRepository userRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final WalletRepository walletRepository;

    public BeneficiaryServiceImpl(UserRepository userRepository,
                                  BeneficiaryRepository beneficiaryRepository,
                                  WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.walletRepository = walletRepository;
    }

    @Override
    @Transactional
    public BeneficiaryResponse addBeneficiary(UUID userId, AddBeneficiaryRequest request) {
        log.info("Saving new beneficiary. User: {}, Recipient identifier: {}", userId, request.recipientIdentifier());

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String recipient = request.recipientIdentifier().trim();
        User recipientUser;

        if (recipient.contains("@")) {
            recipientUser = userRepository.findByEmail(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user with email not found."));
        } else if (recipient.startsWith("APX") || (recipient.length() >= 10 && recipient.matches("[A-Z0-9]+"))) {
            Wallet wallet = walletRepository.findByWalletNumber(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));
            recipientUser = wallet.getUser();
        } else if (recipient.matches("^\\+?[1-9]\\d{1,14}$")) {
            recipientUser = userRepository.findByMobileNumber(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user with mobile number not found."));
        } else {
            recipientUser = userRepository.findByUsername(recipient)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user with username not found."));
        }

        if (currentUser.getId().equals(recipientUser.getId())) {
            throw new BusinessException("You cannot add yourself as a beneficiary.");
        }

        // Check if already a beneficiary
        List<Beneficiary> existingList = beneficiaryRepository.findByUserId(userId);
        boolean alreadyExists = existingList.stream()
                .anyMatch(b -> b.getUpiId().startsWith(recipientUser.getUsername() + "@"));
        if (alreadyExists) {
            throw new BusinessException("Beneficiary is already saved in your contacts.");
        }

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(currentUser);
        beneficiary.setNickname(request.nickname() != null ? request.nickname() : recipientUser.getFullName());
        beneficiary.setUpiId(recipientUser.getUsername() + "@apexpay");
        beneficiary.setMobileNumber(recipientUser.getMobileNumber());

        Beneficiary saved = beneficiaryRepository.save(beneficiary);
        Wallet recipientWallet = walletRepository.findByUserId(recipientUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));

        return new BeneficiaryResponse(
                saved.getId(),
                saved.getNickname(),
                saved.getUpiId(),
                saved.getMobileNumber(),
                recipientUser.getFullName(),
                recipientWallet.getWalletNumber(),
                recipientUser.getId()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<BeneficiaryResponse> getBeneficiaries(UUID userId) {
        log.info("Retrieving saved beneficiaries list for user UUID: {}", userId);
        List<Beneficiary> list = beneficiaryRepository.findByUserId(userId);

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BeneficiaryResponse> searchBeneficiaries(UUID userId, String nicknameQuery) {
        log.info("Searching saved beneficiaries. Query: {}", nicknameQuery);
        List<Beneficiary> list = beneficiaryRepository.findByUserIdAndNicknameContainingIgnoreCase(userId, nicknameQuery);

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileResponse> searchPlatformUsers(UUID currentUserId, String searchQuery) {
        log.info("Searching system platform users for search query: {}", searchQuery);
        
        // Find users matching username, full name, email or phone
        List<User> matches = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .filter(u -> u.getFullName().toLowerCase().contains(searchQuery.toLowerCase())
                        || u.getUsername().toLowerCase().contains(searchQuery.toLowerCase())
                        || u.getEmail().toLowerCase().contains(searchQuery.toLowerCase())
                        || u.getMobileNumber().contains(searchQuery))
                .collect(Collectors.toList());

        return matches.stream()
                .map(u -> new UserProfileResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getMobileNumber(),
                        u.getProfilePhoto(),
                        u.getDateOfBirth(),
                        u.getAccountStatus().name(),
                        u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet())
                ))
                .collect(Collectors.toList());
    }

    private BeneficiaryResponse mapToResponse(Beneficiary b) {
        // Load recipient user by upiId prefix
        String username = b.getUpiId().split("@")[0];
        User recipientUser = userRepository.findByUsername(username)
                .orElse(null);

        String fullName = recipientUser != null ? recipientUser.getFullName() : b.getNickname();
        String walletNum = "";
        UUID recipientUserId = null;

        if (recipientUser != null) {
            recipientUserId = recipientUser.getId();
            Wallet wallet = walletRepository.findByUserId(recipientUser.getId()).orElse(null);
            if (wallet != null) {
                walletNum = wallet.getWalletNumber();
            }
        }

        return new BeneficiaryResponse(
                b.getId(),
                b.getNickname(),
                b.getUpiId(),
                b.getMobileNumber(),
                fullName,
                walletNum,
                recipientUserId
        );
    }
}
