package com.apexpay.repository;

import com.apexpay.entity.UpiRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UpiRequestRepository extends JpaRepository<UpiRequest, UUID> {
    List<UpiRequest> findByPayerIdAndStatus(UUID payerId, String status);
    List<UpiRequest> findByRequesterId(UUID requesterId);
    List<UpiRequest> findByPayerId(UUID payerId);
    List<UpiRequest> findByPayerIdOrRequesterId(UUID payerId, UUID requesterId);
}
